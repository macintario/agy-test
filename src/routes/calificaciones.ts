import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth';
import {
  createCalificacion,
  deleteCalificacion,
  getCalificacionById,
  listCalificaciones,
  updateCalificacion,
} from '../calificaciones/calificaciones';

const listQuerySchema = z.object({
  grupo_id: z.coerce.bigint().optional(),
  inscripcion_id: z.coerce.bigint().optional(),
  evaluacion_id: z.coerce.bigint().optional(),
});

const createCalificacionSchema = z.object({
  grupo_id: z.coerce.bigint(),
  inscripcion_id: z.coerce.bigint(),
  evaluacion_id: z.coerce.bigint(),
  calificacion: z.coerce.number().min(0).max(10),
  observaciones: z.string().optional().nullable(),
});

const updateCalificacionSchema = createCalificacionSchema.partial().omit({
  grupo_id: true,
  inscripcion_id: true,
  evaluacion_id: true,
});

const idSchema = z.coerce.bigint();

export const calificacionesRouter = Router();

calificacionesRouter.use(requireAuth, requireRoles('ADMINISTRADOR', 'CONTROL_ESCOLAR', 'DOCENTE'));

calificacionesRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listCalificaciones({
      grupoId: query.grupo_id,
      inscripcionId: query.inscripcion_id,
      evaluacionId: query.evaluacion_id,
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

calificacionesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const calificacion = await getCalificacionById(id);

    if (!calificacion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la calificación.',
      });
    }

    return res.json({ calificacion });
  } catch (error) {
    next(error);
  }
});

calificacionesRouter.post('/', async (req, res, next) => {
  try {
    const input = createCalificacionSchema.parse(req.body);
    const calificacion = await createCalificacion({
      grupo_id: input.grupo_id,
      inscripcion_id: input.inscripcion_id,
      evaluacion_id: input.evaluacion_id,
      calificacion: input.calificacion,
      capturada_por_usuario_id: BigInt(req.auth!.userId),
      observaciones: input.observaciones?.trim() || null,
    });

    return res.status(201).json({ calificacion });
  } catch (error) {
    next(error);
  }
});

calificacionesRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateCalificacionSchema.parse(req.body);
    const calificacion = await updateCalificacion(
      id,
      {
        calificacion: input.calificacion,
        observaciones: input.observaciones === undefined ? undefined : input.observaciones?.trim() || null,
      },
      BigInt(req.auth!.userId),
    );

    if (!calificacion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la calificación.',
      });
    }

    return res.json({ calificacion });
  } catch (error) {
    next(error);
  }
});

calificacionesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const calificacion = await deleteCalificacion(id, BigInt(req.auth!.userId));

    if (!calificacion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la calificación.',
      });
    }

    return res.json({
      calificacion,
      message: 'Calificación eliminada correctamente.',
    });
  } catch (error) {
    next(error);
  }
});
