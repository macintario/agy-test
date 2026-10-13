import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth';
import {
  createDocente,
  deactivateDocente,
  getDocenteById,
  listDocentes,
  updateDocente,
} from '../docentes/docentes';

const habilitacionSchema = z.object({
  idioma_id: z.coerce.bigint(),
  nivel_maximo_id: z.coerce.bigint(),
  subnivel_maximo_id: z.coerce.bigint(),
  activo: z.boolean().optional(),
});

const createDocenteSchema = z.object({
  nombres: z.string().min(1),
  apellido_paterno: z.string().min(1),
  apellido_materno: z.string().optional(),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  clave_docente: z.string().min(1),
  habilitaciones: z.array(habilitacionSchema).optional(),
});

const updateDocenteSchema = createDocenteSchema.partial();

const listQuerySchema = z.object({
  search: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const idSchema = z.coerce.bigint();

export const docentesRouter = Router();

docentesRouter.use(requireAuth, requireRoles('ADMINISTRADOR', 'CONTROL_ESCOLAR'));

docentesRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listDocentes(query.search?.trim() || undefined, query.take ?? 50, query.skip ?? 0);

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

docentesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const docente = await getDocenteById(id);

    if (!docente) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el docente.',
      });
    }

    return res.json({ docente });
  } catch (error) {
    next(error);
  }
});

docentesRouter.post('/', async (req, res, next) => {
  try {
    const input = createDocenteSchema.parse(req.body);
    const docente = await createDocente({
      nombres: input.nombres.trim(),
      apellido_paterno: input.apellido_paterno.trim(),
      apellido_materno: input.apellido_materno?.trim() || null,
      correo: input.correo?.trim() || null,
      telefono: input.telefono?.trim() || null,
      clave_docente: input.clave_docente.trim(),
      habilitaciones: input.habilitaciones?.map((item) => ({
        idioma_id: item.idioma_id,
        nivel_maximo_id: item.nivel_maximo_id,
        subnivel_maximo_id: item.subnivel_maximo_id,
        activo: item.activo,
      })),
    });

    return res.status(201).json({ docente });
  } catch (error) {
    next(error);
  }
});

docentesRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateDocenteSchema.parse(req.body);
    const docente = await updateDocente(id, {
      nombres: input.nombres?.trim(),
      apellido_paterno: input.apellido_paterno?.trim(),
      apellido_materno: input.apellido_materno === undefined ? undefined : input.apellido_materno?.trim() || null,
      correo: input.correo === undefined ? undefined : input.correo?.trim() || null,
      telefono: input.telefono === undefined ? undefined : input.telefono?.trim() || null,
      clave_docente: input.clave_docente === undefined ? undefined : input.clave_docente.trim(),
      habilitaciones: input.habilitaciones?.map((item) => ({
        idioma_id: item.idioma_id,
        nivel_maximo_id: item.nivel_maximo_id,
        subnivel_maximo_id: item.subnivel_maximo_id,
        activo: item.activo,
      })),
    });

    if (!docente) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el docente.',
      });
    }

    return res.json({ docente });
  } catch (error) {
    next(error);
  }
});

docentesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const docente = await deactivateDocente(id);

    if (!docente) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el docente.',
      });
    }

    return res.json({
      docente,
      message: 'Docente desactivado correctamente.',
    });
  } catch (error) {
    next(error);
  }
});
