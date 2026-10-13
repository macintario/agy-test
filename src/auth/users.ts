import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword } from './password';
import type { AuthRoleCode } from './types';

export interface CreateUserInput {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  correo?: string | null;
  telefono?: string | null;
  username: string;
  password: string;
  roleCodes: AuthRoleCode[];
}

export async function createUser(input: CreateUserInput) {
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const persona = await tx.persona.create({
      data: {
        nombres: input.nombres,
        apellido_paterno: input.apellido_paterno,
        apellido_materno: input.apellido_materno ?? null,
        correo: input.correo ?? null,
        telefono: input.telefono ?? null,
      },
    });

    const roles = await tx.role.findMany({
      where: {
        codigo: {
          in: input.roleCodes,
        },
      },
    });

    if (roles.length !== input.roleCodes.length) {
      throw new Error('One or more roles are invalid.');
    }

    const usuario = await tx.usuario.create({
      data: {
        persona_id: persona.id,
        username: input.username,
        password_hash: passwordHash,
        roles: {
          create: roles.map((rol) => ({
            rol: {
              connect: { id: rol.id },
            },
          })),
        },
      },
      include: {
        persona: true,
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    return usuario;
  });
}

export async function findUserForLogin(identifier: string) {
  return prisma.usuario.findFirst({
    where: {
      OR: [
        { username: identifier },
        {
          persona: {
            correo: identifier,
          },
        },
      ],
    },
    include: {
      persona: true,
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}

export function mapUserToSession(user: {
  id: bigint;
  username: string;
  persona: {
    id: bigint;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    correo: string | null;
    telefono: string | null;
  };
  roles: Array<{ rol: { codigo: string; nombre: string } }>;
}) {
  return {
    id: user.id.toString(),
    username: user.username,
    persona: {
      id: user.persona.id.toString(),
      nombres: user.persona.nombres,
      apellido_paterno: user.persona.apellido_paterno,
      apellido_materno: user.persona.apellido_materno,
      correo: user.persona.correo,
      telefono: user.persona.telefono,
    },
    roles: user.roles.map((item) => ({
      codigo: item.rol.codigo,
      nombre: item.rol.nombre,
    })),
  };
}

export async function listUsers() {
  return prisma.usuario.findMany({
    orderBy: {
      created_at: 'desc',
    },
    include: {
      persona: true,
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}

export async function setUserLastLogin(userId: bigint) {
  await prisma.usuario.update({
    where: { id: userId },
    data: { last_login_at: new Date() },
  });
}

export async function findRoleCodesByUserId(userId: bigint) {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });

  return user?.roles.map((item) => item.rol.codigo as AuthRoleCode) ?? [];
}
