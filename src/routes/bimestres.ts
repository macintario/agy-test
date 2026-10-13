import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth';
import {
  cancelBimestre,
  createBimestre,
  getBimestreById,
  listBimestres,
  updateBimestre,
} from '../bimestres/bimestres';

const createBimestreSchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
  bimestre_numero: z.coerce.number().int().min(1).max(6),
  fecha_inicio: z.coerce.date(),
  fecha_fin: z.coerce.date(),
  estatus: z.enum(['planeado', 'abierto', 'cerrado', 'cancelado']).optional(),
});

const updateBimestreSchema = createBimestreSchema.partial();

const listQuerySchema = z.object({
  search: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const idSchema = z.coerce.bigint();

export const bimestresRouter = Router();

bimestresRouter.use(requireAuth, requireRoles('ADMINISTRADOR', 'CONTROL_ESCOLAR'));

bimestresRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listBimestres(query.search?.trim() || undefined, query.take ?? 50, query.skip ?? 0);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

bimestresRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const bimestre = await getBimestreById(id);

    if (!bimestre) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el bimestre.',
      });
    }

    return res.json({ bimestre });
  } catch (error) {
    next(error);
  }
});

bimestresRouter.post('/', async (req, res, next) => {
  try {
    const input = createBimestreSchema.parse(req.body);
    const bimestre = await createBimestre({
      anio: input.anio,
      bimestre_numero: input.bimestre_numero,
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin,
      estatus: input.estatus,
    });

    return res.status(201).json({ bimestre });
  } catch (error) {
    next(error);
  }
});

bimestresRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateBimestreSchema.parse(req.body);
    const bimestre = await updateBimestre(id, {
      anio: input.anio,
      bimestre_numero: input.bimestre_numero,
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin,
      estatus: input.estatus,
    });

    if (!bimestre) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el bimestre.',
      });
    }

    return res.json({ bimestre });
  } catch (error) {
    next(error);
  }
});

bimestresRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const bimestre = await cancelBimestre(id);

    if (!bimestre) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No se encontró el bimestre.',
      });
    }

    return res.json({
      bimestre,
      message: 'Bimestre cancelado correctamente.',
    });
  } catch (error) {
    next(error);
  }
});
