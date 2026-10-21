import 'dotenv/config';
import express from 'express';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { ordersRouter } from './routes/orders';
import { paymentsRouter } from './routes/payments';
import { productsRouter } from './routes/products';
import { prisma } from './db';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);

app.disable('x-powered-by');
const appOrigins = new Set([new URL(process.env.APP_URL ?? 'http://localhost:3000').origin]);
if (process.env.NODE_ENV !== 'production') appOrigins.add('http://localhost:3000');
app.use((request, response, next) => {
  const origin = request.get('origin');
  if (origin && appOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.vary('Origin');
  }

  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', request.get('Access-Control-Request-Headers') ?? 'Content-Type');
    response.status(204).end();
    return;
  }
  next();
});
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: 'Ocurrió un error en el servidor.' });
});

const server = app.listen(port, () => {
  console.log(`API lista en http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => {
      void prisma.$disconnect();
    });
  });
}