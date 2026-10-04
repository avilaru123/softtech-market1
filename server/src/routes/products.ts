import { Router } from 'express';
import { formatCop } from '../../../src/utils/currency';
import { prisma } from '../db';

export const productsRouter = Router();

function serializeProduct(product: Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
  specs: { label: string; value: string }[];
}) {
  const price = Number(product.price);
  return {
    ...product,
    price,
    priceFormatted: formatCop(price),
    specs: product.specs.map(({ label, value }) => ({ label, value })),
  };
}

productsRouter.get('/', async (_request, response, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { specs: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    });
    response.json(products.map(serializeProduct));
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/:id', async (request, response, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: request.params.id },
      include: { specs: true },
    });
    if (!product) {
      response.status(404).json({ error: 'No encontramos ese producto.' });
      return;
    }
    response.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
});