import { Router } from 'express';
import { z } from 'zod';
import { createUser, listUsers, mapUserToSession } from '../auth/users';
import { requireAuth, requireRoles } from '../middleware/auth';
import type { AuthRoleCode } from '../auth/types';

const ROLE_CODES = ['ADMINISTRADOR', 'SUPERVISOR', 'CONTROL_ESCOLAR', 'DOCENTE'] as const satisfies readonly [
  AuthRoleCode,
  ...AuthRoleCode[],
];

const createUserSchema = z.object({
  nombres: z.string().min(1),
  apellido_paterno: z.string().min(1),
  apellido_materno: z.string().optional(),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  username: z.string().min(4),
  password: z.string().min(8),
  roleCodes: z.array(z.enum(ROLE_CODES)).min(1),
});

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRoles('ADMINISTRADOR'));

usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await listUsers();
    return res.json({
      items: users.map(mapUserToSession),
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/', async (req, res, next) => {
  try {
    const input = createUserSchema.parse(req.body);
    const user = await createUser({
      nombres: input.nombres.trim(),
      apellido_paterno: input.apellido_paterno.trim(),
      apellido_materno: input.apellido_materno?.trim() || null,
      correo: input.correo?.trim() || null,
      telefono: input.telefono?.trim() || null,
      username: input.username.trim(),
      password: input.password,
      roleCodes: input.roleCodes,
    });

    return res.status(201).json({
      user: mapUserToSession(user),
    });
  } catch (error) {
    next(error);
  }
});
