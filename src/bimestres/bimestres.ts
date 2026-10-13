import type { BimestreEstatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface BimestreOutput {
  id: string;
  anio: number;
  bimestre_numero: number;
  codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: BimestreEstatus;
  created_at: string;
  updated_at: string;
}

function buildCodigo(anio: number, bimestreNumero: number) {
  return `${String(anio).slice(-2)}-${bimestreNumero}`;
}

function toBimestreOutput(
  bimestre: Prisma.BimestreGetPayload<{}>,
): BimestreOutput {
  return {
    id: bimestre.id.toString(),
    anio: bimestre.anio,
    bimestre_numero: bimestre.bimestre_numero,
    codigo: bimestre.codigo,
    fecha_inicio: bimestre.fecha_inicio.toISOString(),
    fecha_fin: bimestre.fecha_fin.toISOString(),
    estatus: bimestre.estatus,
    created_at: bimestre.created_at.toISOString(),
    updated_at: bimestre.updated_at.toISOString(),
  };
}

export async function listBimestres(search?: string, take = 50, skip = 0) {
  const where: Prisma.BimestreWhereInput | undefined = search
    ? {
        OR: [
          { codigo: { contains: search } },
          { estatus: { equals: search as BimestreEstatus } },
        ],
      }
    : undefined;

  const [items, total] = await prisma.$transaction([
    prisma.bimestre.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { bimestre_numero: 'desc' }],
      take,
      skip,
    }),
    prisma.bimestre.count({ where }),
  ]);

  return {
    items: items.map(toBimestreOutput),
    total,
  };
}

export async function getBimestreById(id: bigint) {
  const bimestre = await prisma.bimestre.findUnique({
    where: { id },
  });

  return bimestre ? toBimestreOutput(bimestre) : null;
}

export interface CreateBimestreInput {
  anio: number;
  bimestre_numero: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  estatus?: BimestreEstatus;
}

export async function createBimestre(input: CreateBimestreInput) {
  const bimestre = await prisma.bimestre.create({
    data: {
      anio: input.anio,
      bimestre_numero: input.bimestre_numero,
      codigo: buildCodigo(input.anio, input.bimestre_numero),
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin,
      estatus: input.estatus ?? 'planeado',
    },
  });

  return toBimestreOutput(bimestre);
}

export interface UpdateBimestreInput {
  anio?: number;
  bimestre_numero?: number;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  estatus?: BimestreEstatus;
}

export async function updateBimestre(id: bigint, input: UpdateBimestreInput) {
  const current = await prisma.bimestre.findUnique({ where: { id } });
  if (!current) {
    return null;
  }

  const anio = input.anio ?? current.anio;
  const bimestreNumero = input.bimestre_numero ?? current.bimestre_numero;

  const bimestre = await prisma.bimestre.update({
    where: { id },
    data: {
      anio,
      bimestre_numero: bimestreNumero,
      codigo: buildCodigo(anio, bimestreNumero),
      fecha_inicio: input.fecha_inicio ?? current.fecha_inicio,
      fecha_fin: input.fecha_fin ?? current.fecha_fin,
      estatus: input.estatus ?? current.estatus,
    },
  });

  return toBimestreOutput(bimestre);
}

export async function cancelBimestre(id: bigint) {
  const bimestre = await prisma.bimestre.findUnique({ where: { id } });
  if (!bimestre) {
    return null;
  }

  const updated = await prisma.bimestre.update({
    where: { id },
    data: { estatus: 'cancelado' },
  });

  return toBimestreOutput(updated);
}
