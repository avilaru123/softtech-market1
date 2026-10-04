import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from './db';

const COOKIE_NAME = 'softtech_session';
const SESSION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  role: 'ADMIN' | 'CUSTOMER';
  expiresAt: number;
};

declare global {
  namespace Express {
    interface Request {
      sessionUser?: SessionPayload;
    }
  }
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
  }
  return secret;
}

function sign(value: string): string {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function setSessionCookie(response: Response, userId: string, role: SessionPayload['role']): void {
  const payload: SessionPayload = {
    userId,
    role,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = `${encoded}.${sign(encoded)}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secure}`
  );
}

export function clearSessionCookie(response: Response): void {
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function readSession(request: Request): SessionPayload | null {
  const cookieHeader = request.headers.cookie;
  const token = cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SessionPayload;
    if (payload.expiresAt <= Date.now() / 1000) return null;
    if (payload.role !== 'ADMIN' && payload.role !== 'CUSTOMER') return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireUser(request: Request, response: Response, next: NextFunction): void {
  try {
    const session = readSession(request);
    if (!session) {
      response.status(401).json({ error: 'Inicia sesión para continuar.' });
      return;
    }

    void prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, isActive: true },
    }).then((user) => {
      if (!user || !user.isActive) {
        clearSessionCookie(response);
        response.status(401).json({ error: 'La sesión ya no es válida.' });
        return;
      }
      request.sessionUser = { ...session, role: user.role };
      next();
    }).catch(next);
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction): void {
  requireUser(request, response, () => {
    if (request.sessionUser?.role !== 'ADMIN') {
      response.status(403).json({ error: 'Esta operación requiere una cuenta administradora.' });
      return;
    }
    next();
  });
}