import cors from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import helmet from 'helmet';
import { healthRouter } from './routes/health';
import { catalogsRouter } from './routes/catalogs';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { alumnosRouter } from './routes/alumnos';
import { docentesRouter } from './routes/docentes';
import { bimestresRouter } from './routes/bimestres';
import { gruposRouter } from './routes/grupos';
import { inscripcionesRouter } from './routes/inscripciones';
import { evaluacionesRouter } from './routes/evaluaciones';
import { calificacionesRouter } from './routes/calificaciones';
import { ZodError } from 'zod';

export function createApp() {
  const app = express();
  const rawBasePath = process.env.APP_BASE_PATH?.trim() || '/celex';
  const normalizedBase = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`;
  const appBasePath = normalizedBase.replace(/\/+$/, '') || '/';

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get(`${appBasePath}/`, (_req, res) => {
    res.json({
      name: 'Celex Grades API',
      version: '0.1.0',
      base_path: appBasePath,
    });
  });

  app.use(`${appBasePath}/health`, healthRouter);
  app.use(`${appBasePath}/api/catalogs`, catalogsRouter);
  app.use(`${appBasePath}/api/auth`, authRouter);
  app.use(`${appBasePath}/api/users`, usersRouter);
  app.use(`${appBasePath}/api/alumnos`, alumnosRouter);
  app.use(`${appBasePath}/api/docentes`, docentesRouter);
  app.use(`${appBasePath}/api/bimestres`, bimestresRouter);
  app.use(`${appBasePath}/api/grupos`, gruposRouter);
  app.use(`${appBasePath}/api/inscripciones`, inscripcionesRouter);
  app.use(`${appBasePath}/api/evaluaciones`, evaluacionesRouter);
  app.use(`${appBasePath}/api/calificaciones`, calificacionesRouter);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'La solicitud contiene datos inválidos.',
        issues: err.issues,
      });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'CONFLICT',
          message: 'Ya existe un registro con esos datos únicos.',
        });
      }
    }

    console.error(err);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error inesperado.',
    });
  });

  return app;
}
