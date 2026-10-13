import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth';
import { cancelEvaluacion, createEvaluacion, getEvaluacionById, listEvaluaciones, updateEvaluacion } from '../evaluaciones/evaluaciones';

const listQuerySchema = z.object({
  grupo_id: z.coerce.bigint().optional(),
});

const createEvaluacionSchema = z.object({
  grupo_id: z.coerce.bigint(),
  tipo: z.enum(['parcial', 'final']),
  fecha_programada: z.coerce.date().optional().nullable(),
  ponderacion: z.coerce.number().min(0).max(100).optional(),
  estatus: z.enum(['programada', 'capturada', 'cerrada', 'cancelada']).optional(),
  observaciones: z.string().optional().nullable(),
});

const updateEvaluacionSchema = createEvaluacionSchema.partial().omit({ grupo_id: true, tipo: true });

const idSchema = z.coerce.bigint();

export const evaluacionesRouter = Router();

evaluacionesRouter.use(requireAuth, requireRoles('ADMINISTRADOR', 'CONTROL_ESCOLAR'));

evaluacionesRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listEvaluaciones(query.grupo_id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

evaluacionesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const evaluacion = await getEvaluacionById(id);

    if (!evaluacion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la evaluación.',
      });
    }

    return res.json({ evaluacion });
  } catch (error) {
    next(error);
  }
});

evaluacionesRouter.post('/', async (req, res, next) => {
  try {
    const input = createEvaluacionSchema.parse(req.body);
    const evaluacion = await createEvaluacion({
      grupo_id: input.grupo_id,
      tipo: input.tipo,
      fecha_programada: input.fecha_programada ?? null,
      ponderacion: input.ponderacion,
      estatus: input.estatus,
      observaciones: input.observaciones?.trim() || null,
    });

    return res.status(201).json({ evaluacion });
  } catch (error) {
    next(error);
  }
});

evaluacionesRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateEvaluacionSchema.parse(req.body);
    const evaluacion = await updateEvaluacion(id, {
      fecha_programada: input.fecha_programada,
      ponderacion: input.ponderacion,
      estatus: input.estatus,
      observaciones: input.observaciones === undefined ? undefined : input.observaciones?.trim() || null,
    });

    if (!evaluacion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la evaluación.',
      });
    }

    return res.json({ evaluacion });
  } catch (error) {
    next(error);
  }
});

evaluacionesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const evaluacion = await cancelEvaluacion(id);

    if (!evaluacion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la evaluación.',
      });
    }

    return res.json({
      evaluacion,
      message: 'Evaluación cancelada correctamente.',
    });
  } catch (error) {
    next(error);
  }
});
