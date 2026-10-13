import type { InscripcionEstatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface InscripcionOutput {
  id: string;
  grupo_id: string;
  alumno_id: string;
  fecha_inscripcion: string;
  estatus: InscripcionEstatus;
  calificacion_final: string | null;
  aprobado: boolean | null;
  fecha_cierre: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  alumno: {
    id: string;
    tipo_alumno: string;
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
    };
  };
  grupo: {
    id: string;
    folio: string;
    estado: string;
    bimestre: {
      id: string;
      codigo: string;
    };
    idioma: {
      id: string;
      codigo: string;
      nombre: string;
    };
    nivel: {
      id: string;
      codigo: string;
      nombre: string;
    };
    subnivel: {
      id: string;
      codigo: string;
      nombre: string;
    };
  };
}

const inscripcionInclude = {
  alumno: {
    include: {
      persona: true,
    },
  },
  grupo: {
    include: {
      bimestre: true,
      idioma: true,
      nivel: true,
      subnivel: true,
    },
  },
} satisfies Prisma.InscripcionInclude;

type InscripcionWithRelations = Prisma.InscripcionGetPayload<{
  include: typeof inscripcionInclude;
}>;

function toInscripcionOutput(inscripcion: InscripcionWithRelations): InscripcionOutput {
  return {
    id: inscripcion.id.toString(),
    grupo_id: inscripcion.grupo_id.toString(),
    alumno_id: inscripcion.alumno_id.toString(),
    fecha_inscripcion: inscripcion.fecha_inscripcion.toISOString(),
    estatus: inscripcion.estatus,
    calificacion_final: inscripcion.calificacion_final ? inscripcion.calificacion_final.toString() : null,
    aprobado: inscripcion.aprobado,
    fecha_cierre: inscripcion.fecha_cierre ? inscripcion.fecha_cierre.toISOString() : null,
    observaciones: inscripcion.observaciones,
    created_at: inscripcion.created_at.toISOString(),
    updated_at: inscripcion.updated_at.toISOString(),
    alumno: {
      id: inscripcion.alumno.id.toString(),
      tipo_alumno: inscripcion.alumno.tipo_alumno,
      codigo_origen: inscripcion.alumno.codigo_origen,
      escuela_origen: inscripcion.alumno.escuela_origen,
      activo: inscripcion.alumno.activo,
      persona: {
        id: inscripcion.alumno.persona.id.toString(),
        nombres: inscripcion.alumno.persona.nombres,
        apellido_paterno: inscripcion.alumno.persona.apellido_paterno,
        apellido_materno: inscripcion.alumno.persona.apellido_materno,
        correo: inscripcion.alumno.persona.correo,
        telefono: inscripcion.alumno.persona.telefono,
      },
    },
    grupo: {
      id: inscripcion.grupo.id.toString(),
      folio: inscripcion.grupo.folio,
      estado: inscripcion.grupo.estado,
      bimestre: {
        id: inscripcion.grupo.bimestre.id.toString(),
        codigo: inscripcion.grupo.bimestre.codigo,
      },
      idioma: {
        id: inscripcion.grupo.idioma.id.toString(),
        codigo: inscripcion.grupo.idioma.codigo,
        nombre: inscripcion.grupo.idioma.nombre,
      },
      nivel: {
        id: inscripcion.grupo.nivel.id.toString(),
        codigo: inscripcion.grupo.nivel.codigo,
        nombre: inscripcion.grupo.nivel.nombre,
      },
      subnivel: {
        id: inscripcion.grupo.subnivel.id.toString(),
        codigo: inscripcion.grupo.subnivel.codigo,
        nombre: inscripcion.grupo.subnivel.nombre,
      },
    },
  };
}

async function getMinAprobatorio(tx: Prisma.TransactionClient): Promise<number> {
  const config = await tx.configuracionAcademica.findUnique({
    where: { clave: 'calificacion_minima_aprobatoria' },
  });
  const value = Number(config?.valor ?? '8.00');
  return Number.isFinite(value) ? value : 8;
}

async function recalculateInscripcionSummary(tx: Prisma.TransactionClient, inscripcionId: bigint) {
  const current = await tx.inscripcion.findUnique({
    where: { id: inscripcionId },
  });

  if (!current) {
    return;
  }

  const calificaciones = await tx.calificacion.findMany({
    where: { inscripcion_id: inscripcionId },
    include: {
      evaluacion: true,
    },
  });

  const parcial = calificaciones.find((item) => item.evaluacion.tipo === 'parcial');
  const final = calificaciones.find((item) => item.evaluacion.tipo === 'final');

  if (!parcial || !final) {
    await tx.inscripcion.update({
      where: { id: inscripcionId },
      data: {
        calificacion_final: null,
        aprobado: null,
      },
    });
    return;
  }

  const ponderacionParcial = Number(parcial.evaluacion.ponderacion ?? 50);
  const ponderacionFinal = Number(final.evaluacion.ponderacion ?? 50);
  const total = Number(parcial.calificacion) * ponderacionParcial + Number(final.calificacion) * ponderacionFinal;
  const finalGrade = Number((total / 100).toFixed(2));
  const aprobado = finalGrade >= (await getMinAprobatorio(tx));

  await tx.inscripcion.update({
    where: { id: inscripcionId },
    data: {
      calificacion_final: finalGrade,
      aprobado,
      estatus:
        current.estatus === 'cancelado' || current.estatus === 'baja'
          ? current.estatus
          : aprobado
            ? 'acreditado'
            : 'no_acreditado',
    },
  });
}

export async function syncInscripcionSummary(inscripcionId: bigint) {
  await prisma.$transaction(async (tx) => {
    await recalculateInscripcionSummary(tx, inscripcionId);
  });
}

export async function listInscripciones(filter: { grupoId?: bigint; alumnoId?: bigint } = {}) {
  const where: Prisma.InscripcionWhereInput = {};

  if (filter.grupoId) {
    where.grupo_id = filter.grupoId;
  }

  if (filter.alumnoId) {
    where.alumno_id = filter.alumnoId;
  }

  const items = await prisma.inscripcion.findMany({
    where,
    include: inscripcionInclude,
    orderBy: { created_at: 'desc' },
  });

  return {
    items: items.map(toInscripcionOutput),
    total: items.length,
  };
}

export async function getInscripcionById(id: bigint) {
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id },
    include: inscripcionInclude,
  });

  return inscripcion ? toInscripcionOutput(inscripcion) : null;
}

export interface CreateInscripcionInput {
  grupo_id: bigint;
  alumno_id: bigint;
  fecha_inscripcion?: Date;
  estatus?: InscripcionEstatus;
  observaciones?: string | null;
}

export async function createInscripcion(input: CreateInscripcionInput) {
  const inscripcion = await prisma.$transaction(async (tx) => {
    const grupo = await tx.grupo.findUnique({
      where: { id: input.grupo_id },
      include: {
        inscripciones: {
          where: { estatus: 'inscrito' },
        },
      },
    });

    if (!grupo) {
      throw new Error('El grupo no existe.');
    }

    if (grupo.estado === 'cancelado') {
      throw new Error('No se puede inscribir en un grupo cancelado.');
    }

    const alumno = await tx.alumno.findUnique({ where: { id: input.alumno_id } });
    if (!alumno) {
      throw new Error('El alumno no existe.');
    }

    if (grupo.cupo_maximo > 0 && grupo.inscripciones.length >= grupo.cupo_maximo) {
      throw new Error('El grupo ya alcanzó su cupo máximo.');
    }

    return tx.inscripcion.create({
      data: {
        grupo_id: input.grupo_id,
        alumno_id: input.alumno_id,
        fecha_inscripcion: input.fecha_inscripcion ?? new Date(),
        estatus: input.estatus ?? 'inscrito',
        observaciones: input.observaciones ?? null,
      },
      include: inscripcionInclude,
    });
  });

  return toInscripcionOutput(inscripcion);
}

export interface UpdateInscripcionInput {
  fecha_inscripcion?: Date;
  estatus?: InscripcionEstatus;
  fecha_cierre?: Date | null;
  observaciones?: string | null;
}

export async function updateInscripcion(id: bigint, input: UpdateInscripcionInput) {
  const inscripcion = await prisma.$transaction(async (tx) => {
    const current = await tx.inscripcion.findUnique({ where: { id } });

    if (!current) {
      return null;
    }

    const updated = await tx.inscripcion.update({
      where: { id },
      data: {
        fecha_inscripcion: input.fecha_inscripcion ?? current.fecha_inscripcion,
        estatus: input.estatus ?? current.estatus,
        fecha_cierre: input.fecha_cierre !== undefined ? input.fecha_cierre : current.fecha_cierre,
        observaciones: input.observaciones !== undefined ? input.observaciones : current.observaciones,
      },
      include: inscripcionInclude,
    });

    return updated;
  });

  return inscripcion ? toInscripcionOutput(inscripcion) : null;
}

export async function cancelInscripcion(id: bigint) {
  const inscripcion = await prisma.$transaction(async (tx) => {
    const current = await tx.inscripcion.findUnique({ where: { id } });
    if (!current) {
      return null;
    }

    const updated = await tx.inscripcion.update({
      where: { id },
      data: {
        estatus: 'cancelado',
        fecha_cierre: new Date(),
      },
      include: inscripcionInclude,
    });

    return updated;
  });

  return inscripcion ? toInscripcionOutput(inscripcion) : null;
}

export async function markInscripcionClosed(id: bigint) {
  await prisma.inscripcion.update({
    where: { id },
    data: {
      fecha_cierre: new Date(),
    },
  });
}

export { recalculateInscripcionSummary };
