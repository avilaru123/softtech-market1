import { Router } from 'express';
import { prisma } from '../db';
import { clearSessionCookie, requireUser, setSessionCookie } from '../auth';
import { hashPassword, verifyPassword } from '../passwords';

export const authRouter = Router();

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  preferredAssistiveTech: string | null;
  highContrastDefault: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'ADMIN' ? 'admin' : 'cliente',
    preferredAssistiveTech: user.preferredAssistiveTech,
    highContrastDefault: user.highContrastDefault,
  };
}

authRouter.post('/register', async (request, response, next) => {
  try {
    const { name, email, password, preferredAssistiveTech, highContrastDefault } = request.body;
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
      response.status(400).json({ error: 'Escribe un nombre válido.' });
      return;
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      response.status(400).json({ error: 'Escribe un correo válido.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      response.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: await hashPassword(password),
        preferredAssistiveTech: typeof preferredAssistiveTech === 'string' ? preferredAssistiveTech : null,
        highContrastDefault: highContrastDefault === true,
      },
    });
    setSessionCookie(response, user.id, user.role);
    response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      response.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
      return;
    }
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      response.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
      response.status(401).json({ error: 'El correo o la contraseña no son correctos.' });
      return;
    }

    setSessionCookie(response, user.id, user.role);
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireUser, async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.sessionUser!.userId } });
    if (!user || !user.isActive) {
      clearSessionCookie(response);
      response.status(401).json({ error: 'La sesión ya no es válida.' });
      return;
    }
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
});