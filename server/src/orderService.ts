import { Prisma } from '@prisma/client';
import { prisma } from './db';

export class OrderCreationError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

export async function createPendingOrder(userId: string, input: Record<string, unknown>) {
  const { customerName, customerEmail, address, phone, deliveryNotes, paymentMethod, items } = input;
  if (typeof customerName !== 'string' || !customerName.trim()) {
    throw new OrderCreationError('El nombre del comprador es obligatorio.', 400);
  }
  if (typeof customerEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new OrderCreationError('Escribe un correo válido para el pedido.', 400);
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new OrderCreationError('El pedido debe tener entre 1 y 50 productos.', 400);
  }

  const quantities = new Map<string, number>();
  for (const item of items) {
    if (typeof item?.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new OrderCreationError('Hay un producto o una cantidad no válida.', 400);
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({ where: { id: { in: [...quantities.keys()] } } });
      if (products.length !== quantities.size) {
        throw new OrderCreationError('Uno de los productos ya no está disponible.', 409);
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
          throw new OrderCreationError(`No hay suficientes unidades de ${product.name}.`, 409);
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
          userId,
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new OrderCreationError('El inventario cambió mientras se procesaba el pedido. Inténtalo de nuevo.', 409);
    }
    throw error;
  }
}
