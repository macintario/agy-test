import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyAuthToken } from '../auth/jwt';
import type { AuthRoleCode } from '../auth/types';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Falta el token de acceso.',
    });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Falta el token de acceso.',
    });
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = {
      userId: payload.sub,
      username: payload.username,
      roleCodes: payload.roleCodes,
    };
    next();
  } catch {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'El token no es válido.',
    });
  }
}

export function requireRoles(...requiredRoles: AuthRoleCode[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleCodes = req.auth?.roleCodes ?? [];
    const allowed = requiredRoles.some((role) => roleCodes.includes(role));

    if (!allowed) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'No tienes permisos para realizar esta acción.',
      });
    }

    next();
  };
}

export async function loadCurrentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Sesión no autenticada.',
    });
  }

  const userId = BigInt(req.auth.userId);
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      persona: true,
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'El usuario de la sesión ya no existe.',
    });
  }

  req.auth = {
    userId: user.id.toString(),
    username: user.username,
    roleCodes: user.roles.map((item) => item.rol.codigo as AuthRoleCode),
  };

  next();
}
