import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentStatus } from '@prisma/client';
import { Router } from 'express';
import { requireUser } from '../auth';
import { prisma } from '../db';
import { createPendingOrder, OrderCreationError } from '../orderService';

export const paymentsRouter = Router();

interface MercadoPagoPayment {
  id: number | string;
  status: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
}

function appUrl(): URL {
  const value = process.env.APP_URL ?? 'http://localhost:3000';
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('La pasarela Mercado Pago requiere que APP_URL use HTTP o HTTPS.');
  }
  return url;
}

function accessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('La pasarela Mercado Pago no está configurada. Define MP_ACCESS_TOKEN.');
  const environment = process.env.MP_ENVIRONMENT ?? 'sandbox';
  const acceptedPrefixes = environment === 'sandbox'
    ? ['TEST-', 'APP_USR-']
    : environment === 'production'
      ? ['APP_USR-']
      : null;
  if (!acceptedPrefixes) {
    throw new Error('La pasarela Mercado Pago requiere MP_ENVIRONMENT=sandbox o production.');
  }
  if (!acceptedPrefixes.some((prefix) => token.startsWith(prefix))) {
    throw new Error(`La pasarela Mercado Pago requiere un token ${environment === 'sandbox' ? 'de prueba' : 'productivo'} para el entorno configurado.`);
  }
  return token;
}

async function mercadoPagoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => null) as (T & { message?: string }) | null;
  if (!response.ok || result === null) {
    console.error('Mercado Pago API request failed:', response.status, result?.message ?? 'Invalid response');
    throw new Error('No se pudo iniciar el pago con Mercado Pago. Inténtalo de nuevo.');
  }
  return result;
}

async function releaseOrderStock(orderId: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status === 'CANCELLED' || order.paymentStatus === 'PAID') return;

    const updated = await transaction.order.updateMany({
      where: {
        id: order.id,
        status: { not: 'CANCELLED' },
        paymentStatus: { in: ['PENDING', 'FAILED'] },
      },
      data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
    });
    if (updated.count !== 1) return;

    for (const item of order.items) {
      if (!item.productId) continue;
      await transaction.product.updateMany({
        where: { id: item.productId },
        data: { stockCount: { increment: item.quantity }, inStock: true },
      });
    }
  });
}

async function syncPayment(payment: MercadoPagoPayment): Promise<void> {
  if (!payment.external_reference || !payment.id) {
    throw new Error('La notificación de Mercado Pago no incluye una referencia válida.');
  }
  const order = await prisma.order.findUnique({
    where: { orderNumber: payment.external_reference },
    include: { items: true },
  });
  if (!order) throw new Error('No se encontró el pedido asociado al pago.');
  if (payment.currency_id !== order.currency || Number(payment.transaction_amount) !== Number(order.totalAmount)) {
    throw new Error('El importe o la moneda del pago no coinciden con el pedido.');
  }

  const paymentReference = String(payment.id).slice(0, 180);
  if (payment.status === 'approved') {
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({ where: { id: order.id } });
      if (!current || current.status === 'CANCELLED') {
        throw new Error('El pedido cancelado no puede marcarse como pagado.');
      }
      await transaction.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: 'Mercado Pago',
          paymentReference,
          ...(current.status === 'PENDING' ? { status: 'PROCESSING' } : {}),
        },
      });
    });
    return;
  }

  if (payment.status === 'cancelled') {
    await releaseOrderStock(order.id);
    return;
  }

  if (payment.status === 'rejected') {
    await prisma.order.updateMany({
      where: { id: order.id, status: { not: 'CANCELLED' }, paymentStatus: 'PENDING' },
      data: { paymentStatus: 'FAILED', paymentMethod: 'Mercado Pago', paymentReference },
    });
    await releaseOrderStock(order.id);
    return;
  }

  if (payment.status === 'refunded') {
    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: 'PAID' },
      data: { paymentStatus: PaymentStatus.REFUNDED, paymentReference },
    });
  }
}

paymentsRouter.post('/checkout', requireUser, async (request, response, next) => {
  let orderId: string | undefined;
  try {
    const token = accessToken();
    const baseUrl = appUrl();
    const environment = process.env.MP_ENVIRONMENT ?? 'sandbox';
    if (environment !== 'sandbox' && environment !== 'production') {
      throw new Error('MP_ENVIRONMENT debe ser sandbox o production.');
    }
    if (!process.env.MP_WEBHOOK_SECRET) {
      throw new Error('La pasarela Mercado Pago requiere MP_WEBHOOK_SECRET para verificar las notificaciones.');
    }

    const order = await createPendingOrder(request.sessionUser!.userId, {
      ...request.body,
      paymentMethod: 'Mercado Pago',
    });
    orderId = order.id;
    const returnUrl = new URL('/cart', 'http://localhost:3000');
    returnUrl.searchParams.set('payment', 'return');
    returnUrl.searchParams.set('order', order.orderNumber);
    const returnUrlValue = returnUrl.toString();
    const notificationUrl = new URL('/api/payments/webhook', baseUrl);

    const preference = await mercadoPagoRequest<{
      init_point: string;
      sandbox_init_point?: string;
    }>('/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: order.items.map((item) => ({
          id: item.productId ?? undefined,
          title: item.productName,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: order.currency,
        })),
        payer: { name: order.customerName, email: order.customerEmail },
        external_reference: order.orderNumber,
        back_urls: {
          success: returnUrlValue,
          failure: returnUrlValue,
          pending: returnUrlValue,
        },
        notification_url: notificationUrl.toString(),
      }),
    });

    const checkoutUrl = environment === 'sandbox' ? preference.sandbox_init_point : preference.init_point;
    if (!checkoutUrl) throw new Error('Mercado Pago no devolvió una URL para continuar el pago.');
    response.status(201).json({ orderNumber: order.orderNumber, checkoutUrl });
  } catch (error) {
    if (orderId) {
      try {
        await releaseOrderStock(orderId);
      } catch (rollbackError) {
        next(rollbackError);
        return;
      }
    }
    if (error instanceof OrderCreationError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    if (error instanceof Error && (
      error.message.startsWith('La pasarela Mercado Pago') ||
      error.message.startsWith('MP_ENVIRONMENT')
    )) {
      response.status(503).json({ error: error.message });
      return;
    }
    if (error instanceof Error && error.message.startsWith('No se pudo iniciar el pago')) {
      response.status(502).json({ error: error.message });
      return;
    }
    next(error);
  }
});

paymentsRouter.get('/orders/:orderNumber/status', requireUser, async (request, response, next) => {
  try {
    const orderNumber = request.params.orderNumber;
    const order = await prisma.order.findFirst({
      where: { orderNumber, userId: request.sessionUser!.userId },
      include: { items: true },
    });
    if (!order) {
      response.status(404).json({ error: 'No encontramos ese pedido.' });
      return;
    }

    const paymentId = request.query.payment_id;
    if (typeof paymentId === 'string' && /^\d+$/.test(paymentId)) {
      const payment = await mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`);
      if (payment.external_reference !== order.orderNumber) {
        response.status(400).json({ error: 'El pago no corresponde a este pedido.' });
        return;
      }
      await syncPayment(payment);
    }

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    response.json({
      orderNumber: updatedOrder.orderNumber,
      customerName: updatedOrder.customerName,
      customerEmail: updatedOrder.customerEmail,
      totalAmount: Number(updatedOrder.totalAmount),
      itemCount: updatedOrder.items.reduce((count, item) => count + item.quantity, 0),
      paymentStatus: updatedOrder.paymentStatus.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post('/webhook', async (request, response, next) => {
  try {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      response.status(503).json({ error: 'La firma del webhook de Mercado Pago no está configurada.' });
      return;
    }

    const signature = request.header('x-signature');
    const requestId = request.header('x-request-id');
    const paymentId = request.body?.data?.id;
    const timestamp = signature?.match(/(?:^|,)ts=([^,]+)/)?.[1];
    const signatureHash = signature?.match(/(?:^|,)v1=([^,]+)/)?.[1];
    if (typeof paymentId !== 'string' && typeof paymentId !== 'number') {
      response.status(400).json({ error: 'Notificación de pago no válida.' });
      return;
    }
    if (!timestamp || !signatureHash || !requestId) {
      response.status(401).json({ error: 'La firma de la notificación no es válida.' });
      return;
    }

    const manifest = `id:${String(paymentId).toLowerCase()};request-id:${requestId};ts:${timestamp};`;
    const expected = createHmac('sha256', secret).update(manifest).digest();
    const actual = Buffer.from(signatureHash, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      response.status(401).json({ error: 'La firma de la notificación no es válida.' });
      return;
    }

    const type = request.body?.type ?? request.query.type;
    if (type !== 'payment') {
      response.status(200).json({ received: true });
      return;
    }

    const payment = await mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(String(paymentId))}`);
    await syncPayment(payment);
    response.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
});
