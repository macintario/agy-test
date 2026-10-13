import type {
  EvaluacionTipo,
  GrupoEstado,
  Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { serializeDocente } from '../docentes/docentes';

export interface GrupoHorarioOutput {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  observaciones: string | null;
}

export interface GrupoDocenteHistorialOutput {
  id: string;
  docente_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_principal: boolean;
  observaciones: string | null;
  docente: ReturnType<typeof serializeDocente>;
}

export interface GrupoOutput {
  id: string;
  bimestre_id: string;
  idioma_id: string;
  nivel_id: string;
  subnivel_id: string;
  turno_id: string;
  folio: string;
  cupo_maximo: number;
  estado: GrupoEstado;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  bimestre: {
    id: string;
    codigo: string;
    anio: number;
    bimestre_numero: number;
    estatus: string;
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
    orden: number;
  };
  subnivel: {
    id: string;
    codigo: string;
    nombre: string;
    orden: number;
  };
  turno: {
    id: string;
    codigo: string;
    nombre: string;
  };
  horarios: GrupoHorarioOutput[];
  docente_historial: GrupoDocenteHistorialOutput[];
  docente_actual: ReturnType<typeof serializeDocente> | null;
}

const groupInclude = {
  bimestre: true,
  idioma: true,
  nivel: true,
  subnivel: true,
  turno: true,
  horarios: true,
  docente_historial: {
    include: {
      docente: {
        include: {
          persona: true,
          habilitaciones: {
            include: {
              idioma: true,
              nivel_maximo: true,
              subnivel_maximo: true,
            },
          },
        },
      },
    },
    orderBy: [{ es_principal: 'desc' }, { created_at: 'desc' }],
  },
} satisfies Prisma.GrupoInclude;

type GroupWithRelations = Prisma.GrupoGetPayload<{
  include: typeof groupInclude;
}>;

function timeToString(value: Date) {
  return value.toISOString().slice(11, 19);
}

function toGrupoHorarioOutput(horario: GroupWithRelations['horarios'][number]): GrupoHorarioOutput {
  return {
    id: horario.id.toString(),
    dia_semana: horario.dia_semana,
    hora_inicio: timeToString(horario.hora_inicio),
    hora_fin: timeToString(horario.hora_fin),
    observaciones: horario.observaciones,
  };
}

function toGrupoDocenteHistorialOutput(
  item: GroupWithRelations['docente_historial'][number],
): GrupoDocenteHistorialOutput {
  return {
    id: item.id.toString(),
    docente_id: item.docente_id.toString(),
    fecha_inicio: item.fecha_inicio.toISOString(),
    fecha_fin: item.fecha_fin ? item.fecha_fin.toISOString() : null,
    es_principal: item.es_principal,
    observaciones: item.observaciones,
    docente: serializeDocente(item.docente),
  };
}

function toGrupoOutput(grupo: GroupWithRelations): GrupoOutput {
  const docenteActual = grupo.docente_historial.find((item) => item.es_principal) ?? grupo.docente_historial[0] ?? null;

  return {
    id: grupo.id.toString(),
    bimestre_id: grupo.bimestre_id.toString(),
    idioma_id: grupo.idioma_id.toString(),
    nivel_id: grupo.nivel_id.toString(),
    subnivel_id: grupo.subnivel_id.toString(),
    turno_id: grupo.turno_id.toString(),
    folio: grupo.folio,
    cupo_maximo: grupo.cupo_maximo,
    estado: grupo.estado,
    observaciones: grupo.observaciones,
    created_at: grupo.created_at.toISOString(),
    updated_at: grupo.updated_at.toISOString(),
    bimestre: {
      id: grupo.bimestre.id.toString(),
      codigo: grupo.bimestre.codigo,
      anio: grupo.bimestre.anio,
      bimestre_numero: grupo.bimestre.bimestre_numero,
      estatus: grupo.bimestre.estatus,
    },
    idioma: {
      id: grupo.idioma.id.toString(),
      codigo: grupo.idioma.codigo,
      nombre: grupo.idioma.nombre,
    },
    nivel: {
      id: grupo.nivel.id.toString(),
      codigo: grupo.nivel.codigo,
      nombre: grupo.nivel.nombre,
      orden: grupo.nivel.orden,
    },
    subnivel: {
      id: grupo.subnivel.id.toString(),
      codigo: grupo.subnivel.codigo,
      nombre: grupo.subnivel.nombre,
      orden: grupo.subnivel.orden,
    },
    turno: {
      id: grupo.turno.id.toString(),
      codigo: grupo.turno.codigo,
      nombre: grupo.turno.nombre,
    },
    horarios: grupo.horarios.map(toGrupoHorarioOutput),
    docente_historial: grupo.docente_historial.map(toGrupoDocenteHistorialOutput),
    docente_actual: docenteActual ? serializeDocente(docenteActual.docente) : null,
  };
}

export interface GrupoHorarioInput {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  observaciones?: string | null;
}

export interface CreateGrupoInput {
  bimestre_id: bigint;
  idioma_id: bigint;
  nivel_id: bigint;
  subnivel_id: bigint;
  turno_id: bigint;
  folio: string;
  cupo_maximo?: number;
  estado?: GrupoEstado;
  observaciones?: string | null;
  horarios: GrupoHorarioInput[];
  docente_id?: bigint | null;
  fecha_inicio_docente?: Date | null;
}

export interface UpdateGrupoInput {
  bimestre_id?: bigint;
  idioma_id?: bigint;
  nivel_id?: bigint;
  subnivel_id?: bigint;
  turno_id?: bigint;
  folio?: string;
  cupo_maximo?: number;
  estado?: GrupoEstado;
  observaciones?: string | null;
  horarios?: GrupoHorarioInput[];
  docente_id?: bigint | null;
  fecha_inicio_docente?: Date | null;
}

async function timeToDate(value: string) {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    throw new Error('Invalid time format.');
  }
  return new Date(`1970-01-01T${value.length === 5 ? `${value}:00` : value}Z`);
}

async function validateDocenteCanImpartGroup(
  tx: Prisma.TransactionClient,
  docenteId: bigint,
  idiomaId: bigint,
  nivelId: bigint,
  subnivelId: bigint,
) {
  const docente = await tx.docente.findUnique({
    where: { id: docenteId },
    include: {
      habilitaciones: true,
    },
  });

  if (!docente) {
    throw new Error('Docente not found.');
  }

  const habilitacion = await tx.docenteIdiomaHabilitacion.findFirst({
    where: {
      docente_id: docenteId,
      idioma_id: idiomaId,
      activo: true,
    },
    include: {
      nivel_maximo: true,
      subnivel_maximo: true,
    },
  });

  if (!habilitacion) {
    throw new Error('El docente no está habilitado para este idioma.');
  }

  const nivel = await tx.nivel.findUnique({ where: { id: nivelId } });
  const subnivel = await tx.subnivel.findUnique({ where: { id: subnivelId } });

  if (!nivel || !subnivel) {
    throw new Error('Nivel o subnivel inválido.');
  }

  if (nivel.orden > habilitacion.nivel_maximo.orden) {
    throw new Error('El docente no puede impartir este nivel.');
  }

  if (nivel.id === habilitacion.nivel_maximo.id && subnivel.orden > habilitacion.subnivel_maximo.orden) {
    throw new Error('El docente no puede impartir este subnivel.');
  }
}

async function syncGrupoDocente(
  tx: Prisma.TransactionClient,
  grupoId: bigint,
  docenteId: bigint | null | undefined,
  idiomaId: bigint,
  nivelId: bigint,
  subnivelId: bigint,
  fechaInicioDocente: Date | null | undefined,
) {
  if (docenteId == null) {
    return;
  }

  await validateDocenteCanImpartGroup(tx, docenteId, idiomaId, nivelId, subnivelId);

  const currentPrincipal = await tx.grupoDocenteHistorial.findFirst({
    where: {
      grupo_id: grupoId,
      es_principal: true,
      fecha_fin: null,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (currentPrincipal && currentPrincipal.docente_id === docenteId) {
    return;
  }

  if (currentPrincipal) {
    await tx.grupoDocenteHistorial.update({
      where: { id: currentPrincipal.id },
      data: {
        fecha_fin: fechaInicioDocente ?? new Date(),
        es_principal: false,
      },
    });
  }

  await tx.grupoDocenteHistorial.create({
    data: {
      grupo_id: grupoId,
      docente_id: docenteId,
      fecha_inicio: fechaInicioDocente ?? new Date(),
      fecha_fin: null,
      es_principal: true,
    },
  });
}

function buildFolio(bimestreCode: string, idiomaCode: string, nivelCode: string, subnivelCode: string, turnoCode: string) {
  return `${bimestreCode}-${idiomaCode}-${nivelCode}-${subnivelCode}-${turnoCode}`;
}

export async function listGrupos(search?: string, take = 50, skip = 0) {
  const where: Prisma.GrupoWhereInput | undefined = search
    ? {
        OR: [
          { folio: { contains: search } },
          { observaciones: { contains: search } },
          { bimestre: { codigo: { contains: search } } },
        ],
      }
    : undefined;

  const [items, total] = await prisma.$transaction([
    prisma.grupo.findMany({
      where,
      include: groupInclude,
      orderBy: { created_at: 'desc' },
      take,
      skip,
    }),
    prisma.grupo.count({ where }),
  ]);

  return {
    items: items.map(toGrupoOutput),
    total,
  };
}

export async function getGrupoById(id: bigint) {
  const grupo = await prisma.grupo.findUnique({
    where: { id },
    include: groupInclude,
  });

  return grupo ? toGrupoOutput(grupo) : null;
}

export async function createGrupo(input: CreateGrupoInput) {
  const grupo = await prisma.$transaction(async (tx) => {
    const [bimestre, idioma, nivel, subnivel, turno] = await Promise.all([
      tx.bimestre.findUnique({ where: { id: input.bimestre_id } }),
      tx.idioma.findUnique({ where: { id: input.idioma_id } }),
      tx.nivel.findUnique({ where: { id: input.nivel_id } }),
      tx.subnivel.findUnique({ where: { id: input.subnivel_id } }),
      tx.turno.findUnique({ where: { id: input.turno_id } }),
    ]);

    if (!bimestre || !idioma || !nivel || !subnivel || !turno) {
      throw new Error('No se pudo crear el grupo por datos de catálogo inválidos.');
    }

    const folio = input.folio || buildFolio(bimestre.codigo, idioma.codigo, nivel.codigo, subnivel.codigo, turno.codigo);

    const created = await tx.grupo.create({
      data: {
        bimestre_id: input.bimestre_id,
        idioma_id: input.idioma_id,
        nivel_id: input.nivel_id,
        subnivel_id: input.subnivel_id,
        turno_id: input.turno_id,
        folio,
        cupo_maximo: input.cupo_maximo ?? 0,
        estado: input.estado ?? 'programado',
        observaciones: input.observaciones ?? null,
      },
    });

    if (input.horarios.length === 0) {
      throw new Error('El grupo debe tener al menos un horario.');
    }

    await tx.grupoHorario.createMany({
      data: await Promise.all(
        input.horarios.map(async (horario) => ({
          grupo_id: created.id,
          dia_semana: horario.dia_semana,
          hora_inicio: await timeToDate(horario.hora_inicio),
          hora_fin: await timeToDate(horario.hora_fin),
          observaciones: horario.observaciones ?? null,
        })),
      ),
    });

    await syncGrupoDocente(tx, created.id, input.docente_id, input.idioma_id, input.nivel_id, input.subnivel_id, input.fecha_inicio_docente);

    return tx.grupo.findUnique({
      where: { id: created.id },
      include: groupInclude,
    });
  });

  if (!grupo) {
    throw new Error('No se pudo crear el grupo.');
  }

  return toGrupoOutput(grupo);
}

export async function updateGrupo(id: bigint, input: UpdateGrupoInput) {
  const grupo = await prisma.$transaction(async (tx) => {
    const current = await tx.grupo.findUnique({
      where: { id },
      include: {
        horarios: true,
      },
    });

    if (!current) {
      return null;
    }

    const bimestreId = input.bimestre_id ?? current.bimestre_id;
    const idiomaId = input.idioma_id ?? current.idioma_id;
    const nivelId = input.nivel_id ?? current.nivel_id;
    const subnivelId = input.subnivel_id ?? current.subnivel_id;
    const turnoId = input.turno_id ?? current.turno_id;

    let folio = input.folio ?? current.folio;
    if (
      input.bimestre_id ||
      input.idioma_id ||
      input.nivel_id ||
      input.subnivel_id ||
      input.turno_id
    ) {
      const [bimestre, idioma, nivel, subnivel, turno] = await Promise.all([
        tx.bimestre.findUnique({ where: { id: bimestreId } }),
        tx.idioma.findUnique({ where: { id: idiomaId } }),
        tx.nivel.findUnique({ where: { id: nivelId } }),
        tx.subnivel.findUnique({ where: { id: subnivelId } }),
        tx.turno.findUnique({ where: { id: turnoId } }),
      ]);

      if (!bimestre || !idioma || !nivel || !subnivel || !turno) {
        throw new Error('No se pudo actualizar el grupo por datos de catálogo inválidos.');
      }

      folio = input.folio ?? buildFolio(bimestre.codigo, idioma.codigo, nivel.codigo, subnivel.codigo, turno.codigo);
    }

    await tx.grupo.update({
      where: { id },
      data: {
        bimestre_id: bimestreId,
        idioma_id: idiomaId,
        nivel_id: nivelId,
        subnivel_id: subnivelId,
        turno_id: turnoId,
        folio,
        cupo_maximo: input.cupo_maximo ?? current.cupo_maximo,
        estado: input.estado ?? current.estado,
        observaciones: input.observaciones !== undefined ? input.observaciones : current.observaciones,
      },
    });

    if (input.horarios !== undefined) {
      if (input.horarios.length === 0) {
        throw new Error('El grupo debe tener al menos un horario.');
      }

      await tx.grupoHorario.deleteMany({
        where: { grupo_id: id },
      });

      await tx.grupoHorario.createMany({
        data: await Promise.all(
          input.horarios.map(async (horario) => ({
            grupo_id: id,
            dia_semana: horario.dia_semana,
            hora_inicio: await timeToDate(horario.hora_inicio),
            hora_fin: await timeToDate(horario.hora_fin),
            observaciones: horario.observaciones ?? null,
          })),
        ),
      });
    }

    if (input.docente_id !== undefined) {
      if (input.docente_id === null) {
        const currentPrincipal = await tx.grupoDocenteHistorial.findFirst({
          where: { grupo_id: id, es_principal: true, fecha_fin: null },
          orderBy: { created_at: 'desc' },
        });
        if (currentPrincipal) {
          await tx.grupoDocenteHistorial.update({
            where: { id: currentPrincipal.id },
            data: { fecha_fin: new Date(), es_principal: false },
          });
        }
      } else {
        await syncGrupoDocente(tx, id, input.docente_id, idiomaId, nivelId, subnivelId, input.fecha_inicio_docente);
      }
    }

    return tx.grupo.findUnique({
      where: { id },
      include: groupInclude,
    });
  });

  return grupo ? toGrupoOutput(grupo) : null;
}

export async function cancelGrupo(id: bigint) {
  const grupo = await prisma.grupo.findUnique({
    where: { id },
  });

  if (!grupo) {
    return null;
  }

  const updated = await prisma.grupo.update({
    where: { id },
    data: { estado: 'cancelado' },
    include: groupInclude,
  });

  return toGrupoOutput(updated);
}
