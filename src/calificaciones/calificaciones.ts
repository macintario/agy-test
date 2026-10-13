import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { recalculateInscripcionSummary, syncInscripcionSummary } from '../inscripciones/inscripciones';

export interface CalificacionOutput {
  id: string;
  grupo_id: string;
  inscripcion_id: string;
  evaluacion_id: string;
  calificacion: string;
  capturada_por_usuario_id: string;
  capturada_at: string;
  updated_at: string;
  observaciones: string | null;
  evaluacion: {
    id: string;
    tipo: string;
    ponderacion: string;
    estatus: string;
  };
  inscripcion: {
    id: string;
    alumno: {
      id: string;
      codigo_origen: string | null;
      persona: {
        id: string;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string | null;
      };
    };
    grupo: {
      id: string;
      folio: string;
      bimestre: {
        id: string;
        codigo: string;
      };
    };
  };
}

const calificacionInclude = {
  evaluacion: true,
  inscripcion: {
    include: {
      alumno: {
        include: {
          persona: true,
        },
      },
      grupo: {
        include: {
          bimestre: true,
        },
      },
    },
  },
} satisfies Prisma.CalificacionInclude;

type CalificacionWithRelations = Prisma.CalificacionGetPayload<{
  include: typeof calificacionInclude;
}>;

function toCalificacionOutput(calificacion: CalificacionWithRelations): CalificacionOutput {
  return {
    id: calificacion.id.toString(),
    grupo_id: calificacion.grupo_id.toString(),
    inscripcion_id: calificacion.inscripcion_id.toString(),
    evaluacion_id: calificacion.evaluacion_id.toString(),
    calificacion: calificacion.calificacion.toString(),
    capturada_por_usuario_id: calificacion.capturada_por_usuario_id.toString(),
    capturada_at: calificacion.capturada_at.toISOString(),
    updated_at: calificacion.updated_at.toISOString(),
    observaciones: calificacion.observaciones,
    evaluacion: {
      id: calificacion.evaluacion.id.toString(),
      tipo: calificacion.evaluacion.tipo,
      ponderacion: calificacion.evaluacion.ponderacion.toString(),
      estatus: calificacion.evaluacion.estatus,
    },
    inscripcion: {
      id: calificacion.inscripcion.id.toString(),
      alumno: {
        id: calificacion.inscripcion.alumno.id.toString(),
        codigo_origen: calificacion.inscripcion.alumno.codigo_origen,
        persona: {
          id: calificacion.inscripcion.alumno.persona.id.toString(),
          nombres: calificacion.inscripcion.alumno.persona.nombres,
          apellido_paterno: calificacion.inscripcion.alumno.persona.apellido_paterno,
          apellido_materno: calificacion.inscripcion.alumno.persona.apellido_materno,
        },
      },
      grupo: {
        id: calificacion.inscripcion.grupo.id.toString(),
        folio: calificacion.inscripcion.grupo.folio,
        bimestre: {
          id: calificacion.inscripcion.grupo.bimestre.id.toString(),
          codigo: calificacion.inscripcion.grupo.bimestre.codigo,
        },
      },
    },
  };
}

export async function listCalificaciones(filter: {
  grupoId?: bigint;
  inscripcionId?: bigint;
  evaluacionId?: bigint;
}) {
  const where: Prisma.CalificacionWhereInput = {};

  if (filter.grupoId) {
    where.grupo_id = filter.grupoId;
  }

  if (filter.inscripcionId) {
    where.inscripcion_id = filter.inscripcionId;
  }

  if (filter.evaluacionId) {
    where.evaluacion_id = filter.evaluacionId;
  }

  const items = await prisma.calificacion.findMany({
    where,
    include: calificacionInclude,
    orderBy: { capturada_at: 'desc' },
  });

  return {
    items: items.map(toCalificacionOutput),
    total: items.length,
  };
}

export async function getCalificacionById(id: bigint) {
  const calificacion = await prisma.calificacion.findUnique({
    where: { id },
    include: calificacionInclude,
  });

  return calificacion ? toCalificacionOutput(calificacion) : null;
}

export interface CreateCalificacionInput {
  grupo_id: bigint;
  inscripcion_id: bigint;
  evaluacion_id: bigint;
  calificacion: number;
  capturada_por_usuario_id: bigint;
  observaciones?: string | null;
}

async function validateCalificacionContext(
  tx: Prisma.TransactionClient,
  input: CreateCalificacionInput,
) {
  const inscripcion = await tx.inscripcion.findUnique({
    where: { id: input.inscripcion_id },
  });
  if (!inscripcion) {
    throw new Error('La inscripción no existe.');
  }

  if (inscripcion.grupo_id !== input.grupo_id) {
    throw new Error('La inscripción no pertenece al grupo indicado.');
  }

  const evaluacion = await tx.evaluacion.findUnique({
    where: { id: input.evaluacion_id },
  });
  if (!evaluacion) {
    throw new Error('La evaluación no existe.');
  }

  if (evaluacion.grupo_id !== input.grupo_id) {
    throw new Error('La evaluación no pertenece al grupo indicado.');
  }
}

export async function createCalificacion(input: CreateCalificacionInput) {
  const calificacion = await prisma.$transaction(async (tx) => {
    await validateCalificacionContext(tx, input);

    const created = await tx.calificacion.create({
      data: {
        grupo_id: input.grupo_id,
        inscripcion_id: input.inscripcion_id,
        evaluacion_id: input.evaluacion_id,
        calificacion: input.calificacion,
        capturada_por_usuario_id: input.capturada_por_usuario_id,
        observaciones: input.observaciones ?? null,
      },
      include: calificacionInclude,
    });

    await recalculateInscripcionSummary(tx, input.inscripcion_id);
    return created;
  });

  return toCalificacionOutput(calificacion);
}

export interface UpdateCalificacionInput {
  calificacion?: number;
  observaciones?: string | null;
}

export async function updateCalificacion(id: bigint, input: UpdateCalificacionInput, modifiedByUserId: bigint) {
  const calificacion = await prisma.$transaction(async (tx) => {
    const current = await tx.calificacion.findUnique({
      where: { id },
    });

    if (!current) {
      return null;
    }

    const updated = await tx.calificacion.update({
      where: { id },
      data: {
        calificacion: input.calificacion ?? Number(current.calificacion),
        observaciones: input.observaciones !== undefined ? input.observaciones : current.observaciones,
        capturada_por_usuario_id: modifiedByUserId,
        capturada_at: new Date(),
      },
      include: calificacionInclude,
    });

    if (input.calificacion !== undefined && Number(current.calificacion) !== input.calificacion) {
      await tx.calificacionHistorial.create({
        data: {
          calificacion_id: current.id,
          valor_anterior: Number(current.calificacion),
          valor_nuevo: input.calificacion,
          modificado_por_usuario_id: modifiedByUserId,
          motivo: 'Actualización de calificación',
        },
      });
    }

    await recalculateInscripcionSummary(tx, current.inscripcion_id);
    return updated;
  });

  return calificacion ? toCalificacionOutput(calificacion) : null;
}

export async function deleteCalificacion(id: bigint, modifiedByUserId: bigint) {
  const calificacion = await prisma.$transaction(async (tx) => {
    const current = await tx.calificacion.findUnique({
      where: { id },
    });

    if (!current) {
      return null;
    }

    await tx.calificacionHistorial.create({
      data: {
        calificacion_id: current.id,
        valor_anterior: Number(current.calificacion),
        valor_nuevo: Number(current.calificacion),
        modificado_por_usuario_id: modifiedByUserId,
        motivo: 'Eliminación de calificación',
      },
    });

    const deleted = await tx.calificacion.delete({
      where: { id },
      include: calificacionInclude,
    });

    await recalculateInscripcionSummary(tx, current.inscripcion_id);
    return deleted;
  });

  return calificacion ? toCalificacionOutput(calificacion) : null;
}

export async function recalculateCalificacionesForInscripcion(inscripcionId: bigint) {
  await syncInscripcionSummary(inscripcionId);
}
