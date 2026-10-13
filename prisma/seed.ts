import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const nombres = process.env.BOOTSTRAP_ADMIN_NOMBRES ?? 'Administrador';
  const apellidoPaterno = process.env.BOOTSTRAP_ADMIN_APELLIDO_PATERNO ?? 'Sistema';
  const correo = process.env.BOOTSTRAP_ADMIN_CORREO ?? null;

  if (!username || !password) {
    console.log('Bootstrap admin not configured. Skipping seed.');
    return;
  }

  const existing = await prisma.usuario.findUnique({
    where: { username },
  });

  if (existing) {
    console.log(`User ${username} already exists. Skipping.`);
    return;
  }

  const adminRole = await prisma.role.findUnique({
    where: { codigo: 'ADMINISTRADOR' },
  });

  if (!adminRole) {
    throw new Error('ADMINISTRADOR role is missing.');
  }

  const passwordHash = await hashPassword(password);

  const persona = await prisma.persona.create({
    data: {
      nombres,
      apellido_paterno: apellidoPaterno,
      apellido_materno: process.env.BOOTSTRAP_ADMIN_APELLIDO_MATERNO ?? null,
      correo,
      telefono: process.env.BOOTSTRAP_ADMIN_TELEFONO ?? null,
    },
  });

  await prisma.usuario.create({
    data: {
      persona_id: persona.id,
      username,
      password_hash: passwordHash,
      roles: {
        create: [
          {
            rol: {
              connect: { id: adminRole.id },
            },
          },
        ],
      },
    },
  });

  console.log(`Bootstrap admin ${username} created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
