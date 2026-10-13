import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { findUserForLogin, mapUserToSession, setUserLastLogin } from '../auth/users';
import { verifyPassword } from '../auth/password';
import { signAuthToken } from '../auth/jwt';
import type { AuthRoleCode } from '../auth/types';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Debes indicar tu usuario o correo.'),
  password: z.string().min(1, 'Debes indicar tu contraseña.'),
});

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await findUserForLogin(input.identifier.trim());

    if (!user || !user.activo) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Las credenciales no son válidas.',
      });
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Las credenciales no son válidas.',
      });
    }

    await setUserLastLogin(user.id);

    const sessionUser = mapUserToSession(user);
    const token = signAuthToken({
      userId: sessionUser.id,
      username: sessionUser.username,
      roleCodes: sessionUser.roles.map((role) => role.codigo as AuthRoleCode),
    });

    return res.json({
      token,
      user: sessionUser,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findUserForLogin(req.auth!.username);
  if (!user) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'No se encontró el usuario autenticado.',
    });
  }

  return res.json({
    user: mapUserToSession(user),
  });
});
