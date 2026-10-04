import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireUser } from '../auth';
import { prisma } from '../db';

export const ordersRouter = Router();

ordersRouter.post('/', requireUser, async (request, response, next) => {
  try {
    const { customerName, customerEmail, address, phone, deliveryNotes, paymentMethod, items } = request.body;
    if (typeof customerName !== 'string' || !customerName.trim()) {
      response.status(400).json({ error: 'El nombre del comprador es obligatorio.' });
      return;
    }
    if (typeof customerEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      response.status(400).json({ error: 'Escribe un correo válido para el pedido.' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      response.status(400).json({ error: 'El pedido debe tener entre 1 y 50 productos.' });
      return;
    }

    const quantities = new Map<string, number>();
    for (const item of items) {
      if (typeof item?.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        response.status(400).json({ error: 'Hay un producto o una cantidad no válida.' });
        return;
      }
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }

    const order = await prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({ where: { id: { in: [...quantities.keys()] } } });
      if (products.length !== quantities.size) {
        throw new Error('Uno de los productos ya no está disponible.');
      }

      const orderItems = [];
      let total = new Prisma.Decimal(0);
      for (const product of products) {
        const quantity = quantities.get(product.id)!;
        const stockUpdate = await transaction.product.updateMany({
          where: { id: product.id, stockCount: { gte: quantity } },
          data: { stockCount: { decrement: quantity }, inStock: product.stockCount > quantity },
        });
        if (stockUpdate.count !== 1) {
          throw new Error(`No hay suficientes unidades de ${product.name}.`);
        }

        const lineTotal = product.price.mul(quantity);
        total = total.add(lineTotal);
        orderItems.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity,
          lineTotal,
        });
      }

      const orderNumber = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      return transaction.order.create({
        data: {
          orderNumber,
          userId: request.sessionUser!.userId,
          customerName: customerName.trim().slice(0, 120),
          customerEmail: customerEmail.trim().toLowerCase(),
          totalAmount: total,
          paymentMethod: typeof paymentMethod === 'string' ? paymentMethod.slice(0, 80) : null,
          shippingAddress: typeof address === 'string' ? address.slice(0, 1000) : null,
          shippingPhone: typeof phone === 'string' ? phone.slice(0, 30) : null,
          deliveryNotes: typeof deliveryNotes === 'string' ? deliveryNotes.slice(0, 2000) : null,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    response.status(201).json({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalAmount: Number(order.totalAmount),
      itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
      status: 'pending',
      paymentStatus: 'pending',
    });
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('No hay suficientes') || error.message.startsWith('Uno de los productos'))) {
      response.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});