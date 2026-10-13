import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth';
import {
  cancelInscripcion,
  createInscripcion,
  getInscripcionById,
  listInscripciones,
  updateInscripcion,
} from '../inscripciones/inscripciones';

const listQuerySchema = z.object({
  grupo_id: z.coerce.bigint().optional(),
  alumno_id: z.coerce.bigint().optional(),
});

const createInscripcionSchema = z.object({
  grupo_id: z.coerce.bigint(),
  alumno_id: z.coerce.bigint(),
  fecha_inscripcion: z.coerce.date().optional(),
  estatus: z.enum(['inscrito', 'baja', 'acreditado', 'no_acreditado', 'cancelado']).optional(),
  observaciones: z.string().optional().nullable(),
});

const updateInscripcionSchema = createInscripcionSchema.partial();

const idSchema = z.coerce.bigint();

export const inscripcionesRouter = Router();

inscripcionesRouter.use(requireAuth, requireRoles('ADMINISTRADOR', 'CONTROL_ESCOLAR'));

inscripcionesRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listInscripciones({
      grupoId: query.grupo_id,
      alumnoId: query.alumno_id,
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

inscripcionesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const inscripcion = await getInscripcionById(id);

    if (!inscripcion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la inscripción.',
      });
    }

    return res.json({ inscripcion });
  } catch (error) {
    next(error);
  }
});

inscripcionesRouter.post('/', async (req, res, next) => {
  try {
    const input = createInscripcionSchema.parse(req.body);
    const inscripcion = await createInscripcion({
      grupo_id: input.grupo_id,
      alumno_id: input.alumno_id,
      fecha_inscripcion: input.fecha_inscripcion,
      estatus: input.estatus,
      observaciones: input.observaciones?.trim() || null,
    });

    return res.status(201).json({ inscripcion });
  } catch (error) {
    next(error);
  }
});

inscripcionesRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateInscripcionSchema.parse(req.body);
    const inscripcion = await updateInscripcion(id, {
      fecha_inscripcion: input.fecha_inscripcion,
      estatus: input.estatus,
      fecha_cierre: undefined,
      observaciones: input.observaciones === undefined ? undefined : input.observaciones?.trim() || null,
    });

    if (!inscripcion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la inscripción.',
      });
    }

    return res.json({ inscripcion });
  } catch (error) {
    next(error);
  }
});

inscripcionesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const inscripcion = await cancelInscripcion(id);

    if (!inscripcion) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró la inscripción.',
      });
    }

    return res.json({
      inscripcion,
      message: 'Inscripción cancelada correctamente.',
    });
  } catch (error) {
    next(error);
  }
});
