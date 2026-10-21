import { Router } from 'express';
import { requireUser } from '../auth';
import { createPendingOrder, OrderCreationError } from '../orderService';

export const ordersRouter = Router();

ordersRouter.post('/', requireUser, async (request, response, next) => {
  try {
    const order = await createPendingOrder(request.sessionUser!.userId, request.body);

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
    if (error instanceof OrderCreationError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
});