import { OrderStatus, Prisma } from '@prisma/client';
import { Router } from 'express';
import { formatCop } from '../../../src/utils/currency';
import { requireAdmin } from '../auth';
import { prisma } from '../db';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const orderStatuses: Record<string, OrderStatus> = {
  pending: OrderStatus.PENDING,
  processing: OrderStatus.PROCESSING,
  shipped: OrderStatus.SHIPPED,
  delivered: OrderStatus.DELIVERED,
  cancelled: OrderStatus.CANCELLED,
};

function productData(input: Record<string, unknown>): Omit<Prisma.ProductCreateInput, 'id' | 'specs'> {
  if (typeof input.name !== 'string' || !input.name.trim()) throw new Error('El producto necesita un nombre.');
  const price = Number(input.price);
  const stockCount = Number(input.stockCount ?? 0);
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stockCount) || stockCount < 0) {
    throw new Error('El precio o las existencias no son válidos.');
  }

  return {
    name: input.name.trim().slice(0, 180),
    category: String(input.category ?? 'general').slice(0, 60),
    categoryLabel: String(input.categoryLabel ?? 'General').slice(0, 100),
    shortCategory: String(input.shortCategory ?? 'Hardware').slice(0, 40),
    icon: String(input.icon ?? 'devices').slice(0, 80),
    price: new Prisma.Decimal(price),
    priceType: String(input.priceType ?? 'Precio final').slice(0, 100),
    image: String(input.image ?? '').slice(0, 5000),
    imageAlt: String(input.imageAlt ?? input.name).slice(0, 5000),
    badge: String(input.badge ?? '').slice(0, 100),
    subBadge: String(input.subBadge ?? '').slice(0, 100),
    description: String(input.description ?? '').slice(0, 5000),
    inStock: stockCount > 0,
    stockCount,
    isDownload: input.isDownload === true,
    wcagLevel: String(input.wcagLevel ?? 'aaa-native').slice(0, 40),
    inputMethod: String(input.inputMethod ?? 'keyboard').slice(0, 40),
    featured: input.featured === true,
    contrastRatio: typeof input.contrastRatio === 'string' ? input.contrastRatio.slice(0, 30) : null,
    warrantyInfo: typeof input.warrantyInfo === 'string' ? input.warrantyInfo.slice(0, 5000) : null,
  };
}

function productSpecs(input: Record<string, unknown>): { label: string; value: string }[] {
  if (!Array.isArray(input.specs)) return [];
  return input.specs
    .filter((spec): spec is { label: string; value: string } =>
      typeof spec?.label === 'string' && typeof spec?.value === 'string'
    )
    .map(({ label, value }) => ({ label: label.slice(0, 120), value: value.slice(0, 2000) }));
}

adminRouter.get('/orders', async (_request, response, next) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
    response.json(orders.map((order) => ({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalAmount: formatCop(Number(order.totalAmount)),
      totalAmountValue: Number(order.totalAmount),
      itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
      date: order.createdAt.toLocaleDateString('es-ES'),
      createdAt: order.createdAt.toISOString(),
      status: order.status.toLowerCase(),
      paymentMethod: order.paymentMethod ?? undefined,
    })));
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/orders/:orderNumber/status', async (request, response, next) => {
  try {
    const status = orderStatuses[request.body.status];
    if (!status) {
      response.status(400).json({ error: 'Ese estado de pedido no es válido.' });
      return;
    }
    const order = await prisma.order.update({
      where: { orderNumber: request.params.orderNumber },
      data: { status },
    });
    response.json({ orderNumber: order.orderNumber, status: order.status.toLowerCase() });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/customers', async (_request, response, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { _count: { select: { orders: true } }, orders: { select: { totalAmount: true } } },
      orderBy: { createdAt: 'desc' },
    });
    response.json(users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'admin' : 'cliente',
      registeredDate: user.createdAt.toLocaleDateString('es-ES'),
      ordersCount: user._count.orders,
      totalSpent: formatCop(user.orders.reduce((total, order) => total + Number(order.totalAmount), 0)),
      status: user.isActive ? 'active' : 'suspended',
    })));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/products', async (request, response, next) => {
  try {
    const input = request.body as Record<string, unknown>;
    const product = await prisma.product.create({
      data: {
        ...productData(input),
        ...(typeof input.id === 'string' ? { id: input.id.slice(0, 100) } : {}),
        specs: { create: productSpecs(input) },
      },
      include: { specs: true },
    });
    response.status(201).json({ ...product, price: Number(product.price), priceFormatted: formatCop(Number(product.price)) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('El producto')) {
      response.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

adminRouter.put('/products/:id', async (request, response, next) => {
  try {
    const input = request.body as Record<string, unknown>;
    const product = await prisma.$transaction(async (transaction) => {
      await transaction.productSpec.deleteMany({ where: { productId: request.params.id } });
      return transaction.product.update({
        where: { id: request.params.id },
        data: { ...productData(input), specs: { create: productSpecs(input) } },
        include: { specs: true },
      });
    });
    response.json({ ...product, price: Number(product.price), priceFormatted: formatCop(Number(product.price)) });
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('El producto') || error.message.startsWith('El precio'))) {
      response.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

adminRouter.delete('/products/:id', async (request, response, next) => {
  try {
    await prisma.product.delete({ where: { id: request.params.id } });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});