import type { EvaluacionEstatus, EvaluacionTipo, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface EvaluacionOutput {
  id: string;
  grupo_id: string;
  tipo: EvaluacionTipo;
  fecha_programada: string | null;
  ponderacion: string;
  estatus: EvaluacionEstatus;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  grupo: {
    id: string;
    folio: string;
  };
}

const evaluacionInclude = {
  grupo: true,
} satisfies Prisma.EvaluacionInclude;

type EvaluacionWithRelations = Prisma.EvaluacionGetPayload<{
  include: typeof evaluacionInclude;
}>;

function toEvaluacionOutput(evaluacion: EvaluacionWithRelations): EvaluacionOutput {
  return {
    id: evaluacion.id.toString(),
    grupo_id: evaluacion.grupo_id.toString(),
    tipo: evaluacion.tipo,
    fecha_programada: evaluacion.fecha_programada ? evaluacion.fecha_programada.toISOString() : null,
    ponderacion: evaluacion.ponderacion.toString(),
    estatus: evaluacion.estatus,
    observaciones: evaluacion.observaciones,
    created_at: evaluacion.created_at.toISOString(),
    updated_at: evaluacion.updated_at.toISOString(),
    grupo: {
      id: evaluacion.grupo.id.toString(),
      folio: evaluacion.grupo.folio,
    },
  };
}

export async function listEvaluaciones(grupoId?: bigint) {
  const where: Prisma.EvaluacionWhereInput = {};

  if (grupoId) {
    where.grupo_id = grupoId;
  }

  const items = await prisma.evaluacion.findMany({
    where,
    include: evaluacionInclude,
    orderBy: { created_at: 'desc' },
  });

  return {
    items: items.map(toEvaluacionOutput),
    total: items.length,
  };
}

export async function getEvaluacionById(id: bigint) {
  const evaluacion = await prisma.evaluacion.findUnique({
    where: { id },
    include: evaluacionInclude,
  });

  return evaluacion ? toEvaluacionOutput(evaluacion) : null;
}

export interface CreateEvaluacionInput {
  grupo_id: bigint;
  tipo: EvaluacionTipo;
  fecha_programada?: Date | null;
  ponderacion?: number;
  estatus?: EvaluacionEstatus;
  observaciones?: string | null;
}

export async function createEvaluacion(input: CreateEvaluacionInput) {
  const evaluacion = await prisma.$transaction(async (tx) => {
    const grupo = await tx.grupo.findUnique({ where: { id: input.grupo_id } });
    if (!grupo) {
      throw new Error('El grupo no existe.');
    }

    return tx.evaluacion.create({
      data: {
        grupo_id: input.grupo_id,
        tipo: input.tipo,
        fecha_programada: input.fecha_programada ?? null,
        ponderacion: input.ponderacion ?? 50,
        estatus: input.estatus ?? 'programada',
        observaciones: input.observaciones ?? null,
      },
      include: evaluacionInclude,
    });
  });

  return toEvaluacionOutput(evaluacion);
}

export interface UpdateEvaluacionInput {
  fecha_programada?: Date | null;
  ponderacion?: number;
  estatus?: EvaluacionEstatus;
  observaciones?: string | null;
}

export async function updateEvaluacion(id: bigint, input: UpdateEvaluacionInput) {
  const evaluacion = await prisma.$transaction(async (tx) => {
    const current = await tx.evaluacion.findUnique({ where: { id } });
    if (!current) {
      return null;
    }

    return tx.evaluacion.update({
      where: { id },
      data: {
        fecha_programada: input.fecha_programada !== undefined ? input.fecha_programada : current.fecha_programada,
        ponderacion: input.ponderacion ?? Number(current.ponderacion),
        estatus: input.estatus ?? current.estatus,
        observaciones: input.observaciones !== undefined ? input.observaciones : current.observaciones,
      },
      include: evaluacionInclude,
    });
  });

  return evaluacion ? toEvaluacionOutput(evaluacion) : null;
}

export async function cancelEvaluacion(id: bigint) {
  const evaluacion = await prisma.evaluacion.findUnique({ where: { id } });
  if (!evaluacion) {
    return null;
  }

  const updated = await prisma.evaluacion.update({
    where: { id },
    data: { estatus: 'cancelada' },
    include: evaluacionInclude,
  });

  return toEvaluacionOutput(updated);
}
