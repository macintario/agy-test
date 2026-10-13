import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth';
import {
  createAlumno,
  deactivateAlumno,
  getAlumnoById,
  listAlumnos,
  updateAlumno,
} from '../alumnos/alumnos';

const tipoAlumnoSchema = z.enum(['interno', 'externo']);

const createAlumnoSchema = z.object({
  nombres: z.string().min(1),
  apellido_paterno: z.string().min(1),
  apellido_materno: z.string().optional(),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  tipo_alumno: tipoAlumnoSchema,
  codigo_origen: z.string().optional(),
  escuela_origen: z.string().optional(),
});

const updateAlumnoSchema = createAlumnoSchema.partial();

const listQuerySchema = z.object({
  search: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const idSchema = z.coerce.bigint();

export const alumnosRouter = Router();

alumnosRouter.use(requireAuth, requireRoles('ADMINISTRADOR', 'CONTROL_ESCOLAR'));

alumnosRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listAlumnos(query.search?.trim() || undefined, query.take ?? 50, query.skip ?? 0);

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

alumnosRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const alumno = await getAlumnoById(id);

    if (!alumno) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el alumno.',
      });
    }

    return res.json({ alumno });
  } catch (error) {
    next(error);
  }
});

alumnosRouter.post('/', async (req, res, next) => {
  try {
    const input = createAlumnoSchema.parse(req.body);
    const alumno = await createAlumno({
      nombres: input.nombres.trim(),
      apellido_paterno: input.apellido_paterno.trim(),
      apellido_materno: input.apellido_materno?.trim() || null,
      correo: input.correo?.trim() || null,
      telefono: input.telefono?.trim() || null,
      tipo_alumno: input.tipo_alumno,
      codigo_origen: input.codigo_origen?.trim() || null,
      escuela_origen: input.escuela_origen?.trim() || null,
    });

    return res.status(201).json({ alumno });
  } catch (error) {
    next(error);
  }
});

alumnosRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateAlumnoSchema.parse(req.body);
    const alumno = await updateAlumno(id, {
      nombres: input.nombres?.trim(),
      apellido_paterno: input.apellido_paterno?.trim(),
      apellido_materno: input.apellido_materno === undefined ? undefined : input.apellido_materno?.trim() || null,
      correo: input.correo === undefined ? undefined : input.correo?.trim() || null,
      telefono: input.telefono === undefined ? undefined : input.telefono?.trim() || null,
      tipo_alumno: input.tipo_alumno,
      codigo_origen: input.codigo_origen === undefined ? undefined : input.codigo_origen?.trim() || null,
      escuela_origen: input.escuela_origen === undefined ? undefined : input.escuela_origen?.trim() || null,
    });

    if (!alumno) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el alumno.',
      });
    }

    return res.json({ alumno });
  } catch (error) {
    next(error);
  }
});

alumnosRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const alumno = await deactivateAlumno(id);

    if (!alumno) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el alumno.',
      });
    }

    return res.json({
      alumno,
      message: 'Alumno desactivado correctamente.',
    });
  } catch (error) {
    next(error);
  }
});
