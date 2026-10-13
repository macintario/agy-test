import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth';
import { cancelGrupo, createGrupo, getGrupoById, listGrupos, updateGrupo } from '../grupos/grupos';

const horarioSchema = z.object({
  dia_semana: z.coerce.number().int().min(1).max(7),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  hora_fin: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  observaciones: z.string().optional().nullable(),
});

const createGrupoSchema = z.object({
  bimestre_id: z.coerce.bigint(),
  idioma_id: z.coerce.bigint(),
  nivel_id: z.coerce.bigint(),
  subnivel_id: z.coerce.bigint(),
  turno_id: z.coerce.bigint(),
  folio: z.string().min(1).optional(),
  cupo_maximo: z.coerce.number().int().min(0).optional(),
  estado: z.enum(['programado', 'abierto', 'cerrado', 'cancelado']).optional(),
  observaciones: z.string().optional().nullable(),
  horarios: z.array(horarioSchema).min(1),
  docente_id: z.coerce.bigint().optional().nullable(),
  fecha_inicio_docente: z.coerce.date().optional().nullable(),
});

const updateGrupoSchema = createGrupoSchema.partial().extend({
  horarios: z.array(horarioSchema).optional(),
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const idSchema = z.coerce.bigint();

export const gruposRouter = Router();

gruposRouter.use(requireAuth, requireRoles('ADMINISTRADOR', 'CONTROL_ESCOLAR'));

gruposRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listGrupos(query.search?.trim() || undefined, query.take ?? 50, query.skip ?? 0);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

gruposRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const grupo = await getGrupoById(id);

    if (!grupo) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el grupo.',
      });
    }

    return res.json({ grupo });
  } catch (error) {
    next(error);
  }
});

gruposRouter.post('/', async (req, res, next) => {
  try {
    const input = createGrupoSchema.parse(req.body);
    const grupo = await createGrupo({
      bimestre_id: input.bimestre_id,
      idioma_id: input.idioma_id,
      nivel_id: input.nivel_id,
      subnivel_id: input.subnivel_id,
      turno_id: input.turno_id,
      folio: input.folio?.trim() || '',
      cupo_maximo: input.cupo_maximo,
      estado: input.estado,
      observaciones: input.observaciones?.trim() || null,
      horarios: input.horarios.map((horario) => ({
        dia_semana: horario.dia_semana,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        observaciones: horario.observaciones?.trim() || null,
      })),
      docente_id: input.docente_id ?? undefined,
      fecha_inicio_docente: input.fecha_inicio_docente ?? undefined,
    });

    return res.status(201).json({ grupo });
  } catch (error) {
    next(error);
  }
});

gruposRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateGrupoSchema.parse(req.body);
    const grupo = await updateGrupo(id, {
      bimestre_id: input.bimestre_id,
      idioma_id: input.idioma_id,
      nivel_id: input.nivel_id,
      subnivel_id: input.subnivel_id,
      turno_id: input.turno_id,
      folio: input.folio?.trim(),
      cupo_maximo: input.cupo_maximo,
      estado: input.estado,
      observaciones: input.observaciones === undefined ? undefined : input.observaciones?.trim() || null,
      horarios: input.horarios?.map((horario) => ({
        dia_semana: horario.dia_semana,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        observaciones: horario.observaciones?.trim() || null,
      })),
      docente_id: input.docente_id,
      fecha_inicio_docente: input.fecha_inicio_docente,
    });

    if (!grupo) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el grupo.',
      });
    }

    return res.json({ grupo });
  } catch (error) {
    next(error);
  }
});

gruposRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const grupo = await cancelGrupo(id);

    if (!grupo) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el grupo.',
      });
    }

    return res.json({
      grupo,
      message: 'Grupo cancelado correctamente.',
    });
  } catch (error) {
    next(error);
  }
});
