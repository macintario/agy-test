import { prisma } from '../lib/prisma';
import type { Prisma, TipoAlumno } from '@prisma/client';

export interface AlumnoOutput {
  id: string;
  persona_id: string;
  tipo_alumno: TipoAlumno;
  codigo_origen: string | null;
  escuela_origen: string | null;
  activo: boolean;
  persona: {
    id: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    correo: string | null;
    telefono: string | null;
    activo: boolean;
  };
  created_at: string;
  updated_at: string;
}

const alumnoInclude = {
  persona: true,
} satisfies Prisma.AlumnoInclude;

function toAlumnoOutput(
  alumno: Prisma.AlumnoGetPayload<{
    include: typeof alumnoInclude;
  }>,
): AlumnoOutput {
  return {
    id: alumno.id.toString(),
    persona_id: alumno.persona_id.toString(),
    tipo_alumno: alumno.tipo_alumno,
    codigo_origen: alumno.codigo_origen,
    escuela_origen: alumno.escuela_origen,
    activo: alumno.activo,
    persona: {
      id: alumno.persona.id.toString(),
      nombres: alumno.persona.nombres,
      apellido_paterno: alumno.persona.apellido_paterno,
      apellido_materno: alumno.persona.apellido_materno,
      correo: alumno.persona.correo,
      telefono: alumno.persona.telefono,
      activo: alumno.persona.activo,
    },
    created_at: alumno.created_at.toISOString(),
    updated_at: alumno.updated_at.toISOString(),
  };
}

export function serializeAlumno(
  alumno: Prisma.AlumnoGetPayload<{
    include: typeof alumnoInclude;
  }>,
) {
  return toAlumnoOutput(alumno);
}

export async function listAlumnos(search?: string, take = 50, skip = 0) {
  const where: Prisma.AlumnoWhereInput | undefined = search
    ? {
        OR: [
          { codigo_origen: { contains: search } },
          { escuela_origen: { contains: search } },
          { persona: { nombres: { contains: search } } },
          { persona: { apellido_paterno: { contains: search } } },
          { persona: { apellido_materno: { contains: search } } },
          { persona: { correo: { contains: search } } },
        ],
      }
    : undefined;

  const [items, total] = await prisma.$transaction([
    prisma.alumno.findMany({
      where,
      include: alumnoInclude,
      orderBy: {
        created_at: 'desc',
      },
      take,
      skip,
    }),
    prisma.alumno.count({ where }),
  ]);

  return {
    items: items.map(toAlumnoOutput),
    total,
  };
}

export async function getAlumnoById(id: bigint) {
  const alumno = await prisma.alumno.findUnique({
    where: { id },
    include: alumnoInclude,
  });

  return alumno ? toAlumnoOutput(alumno) : null;
}

export interface CreateAlumnoInput {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  correo?: string | null;
  telefono?: string | null;
  tipo_alumno: TipoAlumno;
  codigo_origen?: string | null;
  escuela_origen?: string | null;
}

export async function createAlumno(input: CreateAlumnoInput) {
  const alumno = await prisma.$transaction(async (tx) => {
    const persona = await tx.persona.create({
      data: {
        nombres: input.nombres,
        apellido_paterno: input.apellido_paterno,
        apellido_materno: input.apellido_materno ?? null,
        correo: input.correo ?? null,
        telefono: input.telefono ?? null,
      },
    });

    return tx.alumno.create({
      data: {
        persona_id: persona.id,
        tipo_alumno: input.tipo_alumno,
        codigo_origen: input.codigo_origen ?? null,
        escuela_origen: input.escuela_origen ?? null,
      },
      include: alumnoInclude,
    });
  });

  return toAlumnoOutput(alumno);
}

export interface UpdateAlumnoInput extends Partial<CreateAlumnoInput> {}

export async function updateAlumno(id: bigint, input: UpdateAlumnoInput) {
  const alumno = await prisma.$transaction(async (tx) => {
    const current = await tx.alumno.findUnique({
      where: { id },
      include: {
        persona: true,
      },
    });

    if (!current) {
      return null;
    }

    await tx.persona.update({
      where: { id: current.persona_id },
      data: {
        nombres: input.nombres ?? current.persona.nombres,
        apellido_paterno: input.apellido_paterno ?? current.persona.apellido_paterno,
        apellido_materno: input.apellido_materno !== undefined ? input.apellido_materno : current.persona.apellido_materno,
        correo: input.correo !== undefined ? input.correo : current.persona.correo,
        telefono: input.telefono !== undefined ? input.telefono : current.persona.telefono,
      },
    });

    return tx.alumno.update({
      where: { id },
      data: {
        tipo_alumno: input.tipo_alumno ?? current.tipo_alumno,
        codigo_origen: input.codigo_origen !== undefined ? input.codigo_origen : current.codigo_origen,
        escuela_origen: input.escuela_origen !== undefined ? input.escuela_origen : current.escuela_origen,
      },
      include: alumnoInclude,
    });
  });

  return alumno ? toAlumnoOutput(alumno) : null;
}

export async function deactivateAlumno(id: bigint) {
  const alumno = await prisma.$transaction(async (tx) => {
    const current = await tx.alumno.findUnique({
      where: { id },
      include: {
        persona: true,
      },
    });

    if (!current) {
      return null;
    }

    await tx.persona.update({
      where: { id: current.persona_id },
      data: { activo: false },
    });

    return tx.alumno.update({
      where: { id },
      data: { activo: false },
      include: alumnoInclude,
    });
  });

  return alumno ? toAlumnoOutput(alumno) : null;
}
