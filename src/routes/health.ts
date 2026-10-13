import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'celex-grades-backend',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      database: 'up',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      database: 'down',
      timestamp: new Date().toISOString(),
    });
    console.error('Database health check failed:', error);
  }
});
