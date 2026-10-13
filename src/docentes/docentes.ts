import type { Docente, Nivel, Prisma, Subnivel } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface DocenteHabilitacionOutput {
  id: string;
  idioma_id: string;
  nivel_maximo_id: string;
  subnivel_maximo_id: string;
  activo: boolean;
  idioma: {
    id: string;
    codigo: string;
    nombre: string;
    activo: boolean;
  };
  nivel_maximo: {
    id: string;
    codigo: string;
    nombre: string;
    orden: number;
    activo: boolean;
  };
  subnivel_maximo: {
    id: string;
    codigo: string;
    nombre: string;
    orden: number;
    activo: boolean;
  };
}

export interface DocenteOutput {
  id: string;
  persona_id: string;
  clave_docente: string;
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
  habilitaciones: DocenteHabilitacionOutput[];
  created_at: string;
  updated_at: string;
}

const docenteInclude = {
  persona: true,
  habilitaciones: {
    include: {
      idioma: true,
      nivel_maximo: true,
      subnivel_maximo: true,
    },
  },
} satisfies Prisma.DocenteInclude;

type DocenteWithRelations = Prisma.DocenteGetPayload<{
  include: typeof docenteInclude;
}>;

function toDocenteHabilitacionOutput(
  habilitacion: DocenteWithRelations['habilitaciones'][number],
): DocenteHabilitacionOutput {
  return {
    id: habilitacion.id.toString(),
    idioma_id: habilitacion.idioma_id.toString(),
    nivel_maximo_id: habilitacion.nivel_maximo_id.toString(),
    subnivel_maximo_id: habilitacion.subnivel_maximo_id.toString(),
    activo: habilitacion.activo,
    idioma: {
      id: habilitacion.idioma.id.toString(),
      codigo: habilitacion.idioma.codigo,
      nombre: habilitacion.idioma.nombre,
      activo: habilitacion.idioma.activo,
    },
    nivel_maximo: {
      id: habilitacion.nivel_maximo.id.toString(),
      codigo: habilitacion.nivel_maximo.codigo,
      nombre: habilitacion.nivel_maximo.nombre,
      orden: habilitacion.nivel_maximo.orden,
      activo: habilitacion.nivel_maximo.activo,
    },
    subnivel_maximo: {
      id: habilitacion.subnivel_maximo.id.toString(),
      codigo: habilitacion.subnivel_maximo.codigo,
      nombre: habilitacion.subnivel_maximo.nombre,
      orden: habilitacion.subnivel_maximo.orden,
      activo: habilitacion.subnivel_maximo.activo,
    },
  };
}

function toDocenteOutput(docente: DocenteWithRelations): DocenteOutput {
  return {
    id: docente.id.toString(),
    persona_id: docente.persona_id.toString(),
    clave_docente: docente.clave_docente,
    activo: docente.activo,
    persona: {
      id: docente.persona.id.toString(),
      nombres: docente.persona.nombres,
      apellido_paterno: docente.persona.apellido_paterno,
      apellido_materno: docente.persona.apellido_materno,
      correo: docente.persona.correo,
      telefono: docente.persona.telefono,
      activo: docente.persona.activo,
    },
    habilitaciones: docente.habilitaciones.map(toDocenteHabilitacionOutput),
    created_at: docente.created_at.toISOString(),
    updated_at: docente.updated_at.toISOString(),
  };
}

export function serializeDocente(docente: DocenteWithRelations) {
  return toDocenteOutput(docente);
}

export interface DocenteHabilitacionInput {
  idioma_id: bigint;
  nivel_maximo_id: bigint;
  subnivel_maximo_id: bigint;
  activo?: boolean;
}

export interface CreateDocenteInput {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  correo?: string | null;
  telefono?: string | null;
  clave_docente: string;
  habilitaciones?: DocenteHabilitacionInput[];
}

export async function listDocentes(search?: string, take = 50, skip = 0) {
  const where: Prisma.DocenteWhereInput | undefined = search
    ? {
        OR: [
          { clave_docente: { contains: search } },
          { persona: { nombres: { contains: search } } },
          { persona: { apellido_paterno: { contains: search } } },
          { persona: { apellido_materno: { contains: search } } },
          { persona: { correo: { contains: search } } },
        ],
      }
    : undefined;

  const [items, total] = await prisma.$transaction([
    prisma.docente.findMany({
      where,
      include: docenteInclude,
      orderBy: {
        created_at: 'desc',
      },
      take,
      skip,
    }),
    prisma.docente.count({ where }),
  ]);

  return {
    items: items.map(toDocenteOutput),
    total,
  };
}

export async function getDocenteById(id: bigint) {
  const docente = await prisma.docente.findUnique({
    where: { id },
    include: docenteInclude,
  });

  return docente ? toDocenteOutput(docente) : null;
}

async function validateHabilitaciones(
  tx: Prisma.TransactionClient,
  habilitaciones: DocenteHabilitacionInput[],
) {
  if (habilitaciones.length === 0) {
    return [];
  }

  const [idiomas, niveles, subniveles] = await Promise.all([
    tx.idioma.findMany({ where: { id: { in: habilitaciones.map((item) => item.idioma_id) } } }),
    tx.nivel.findMany({ where: { id: { in: habilitaciones.map((item) => item.nivel_maximo_id) } } }),
    tx.subnivel.findMany({ where: { id: { in: habilitaciones.map((item) => item.subnivel_maximo_id) } } }),
  ]);

  if (idiomas.length !== new Set(habilitaciones.map((item) => item.idioma_id.toString())).size) {
    throw new Error('One or more idiomas are invalid.');
  }

  if (niveles.length !== new Set(habilitaciones.map((item) => item.nivel_maximo_id.toString())).size) {
    throw new Error('One or more niveles are invalid.');
  }

  if (subniveles.length !== new Set(habilitaciones.map((item) => item.subnivel_maximo_id.toString())).size) {
    throw new Error('One or more subniveles are invalid.');
  }

  return habilitaciones;
}

export async function createDocente(input: CreateDocenteInput) {
  const docente = await prisma.$transaction(async (tx) => {
    const persona = await tx.persona.create({
      data: {
        nombres: input.nombres,
        apellido_paterno: input.apellido_paterno,
        apellido_materno: input.apellido_materno ?? null,
        correo: input.correo ?? null,
        telefono: input.telefono ?? null,
      },
    });

    const createdDocente = await tx.docente.create({
      data: {
        persona_id: persona.id,
        clave_docente: input.clave_docente,
      },
    });

    const habilitaciones = await validateHabilitaciones(tx, input.habilitaciones ?? []);

    if (habilitaciones.length > 0) {
      await tx.docenteIdiomaHabilitacion.createMany({
        data: habilitaciones.map((item) => ({
          docente_id: createdDocente.id,
          idioma_id: item.idioma_id,
          nivel_maximo_id: item.nivel_maximo_id,
          subnivel_maximo_id: item.subnivel_maximo_id,
          activo: item.activo ?? true,
        })),
      });
    }

    return tx.docente.findUnique({
      where: { id: createdDocente.id },
      include: docenteInclude,
    });
  });

  if (!docente) {
    throw new Error('Docente could not be created.');
  }

  return toDocenteOutput(docente);
}

export interface UpdateDocenteInput {
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string | null;
  correo?: string | null;
  telefono?: string | null;
  clave_docente?: string;
  habilitaciones?: DocenteHabilitacionInput[];
}

export async function updateDocente(id: bigint, input: UpdateDocenteInput) {
  const docente = await prisma.$transaction(async (tx) => {
    const current = await tx.docente.findUnique({
      where: { id },
      include: {
        persona: true,
        habilitaciones: true,
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

    await tx.docente.update({
      where: { id },
      data: {
        clave_docente: input.clave_docente ?? current.clave_docente,
      },
    });

    if (input.habilitaciones !== undefined) {
      const habilitaciones = await validateHabilitaciones(tx, input.habilitaciones);
      await tx.docenteIdiomaHabilitacion.deleteMany({
        where: { docente_id: id },
      });

      if (habilitaciones.length > 0) {
        await tx.docenteIdiomaHabilitacion.createMany({
          data: habilitaciones.map((item) => ({
            docente_id: id,
            idioma_id: item.idioma_id,
            nivel_maximo_id: item.nivel_maximo_id,
            subnivel_maximo_id: item.subnivel_maximo_id,
            activo: item.activo ?? true,
          })),
        });
      }
    }

    return tx.docente.findUnique({
      where: { id },
      include: docenteInclude,
    });
  });

  return docente ? toDocenteOutput(docente) : null;
}

export async function deactivateDocente(id: bigint) {
  const docente = await prisma.$transaction(async (tx) => {
    const current = await tx.docente.findUnique({
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

    await tx.docente.update({
      where: { id },
      data: { activo: false },
    });

    return tx.docente.findUnique({
      where: { id },
      include: docenteInclude,
    });
  });

  return docente ? toDocenteOutput(docente) : null;
}
