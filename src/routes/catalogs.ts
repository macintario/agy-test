import { Router } from 'express';

export const catalogsRouter = Router();

catalogsRouter.get('/', (_req, res) => {
  res.json({
    roles: [
      { id: '1', codigo: 'ADMINISTRADOR', nombre: 'Administrador' },
      { id: '2', codigo: 'SUPERVISOR', nombre: 'Supervisor' },
      { id: '3', codigo: 'CONTROL_ESCOLAR', nombre: 'Control Escolar' },
      { id: '4', codigo: 'DOCENTE', nombre: 'Docente' },
    ],
    idiomas: [
      { id: '1', codigo: 'EN', nombre: 'Inglés' },
      { id: '2', codigo: 'FR', nombre: 'Francés' },
      { id: '3', codigo: 'DE', nombre: 'Alemán' },
    ],
    niveles: [
      { id: '1', codigo: 'BASICO', nombre: 'Básico', orden: 1 },
      { id: '2', codigo: 'INTERMEDIO', nombre: 'Intermedio', orden: 2 },
      { id: '3', codigo: 'AVANZADO', nombre: 'Avanzado', orden: 3 },
    ],
    subniveles: [
      { id: '1', codigo: 'I', nombre: 'I', orden: 1 },
      { id: '2', codigo: 'II', nombre: 'II', orden: 2 },
      { id: '3', codigo: 'III', nombre: 'III', orden: 3 },
      { id: '4', codigo: 'IV', nombre: 'IV', orden: 4 },
      { id: '5', codigo: 'V', nombre: 'V', orden: 5 },
    ],
    turnos: [
      { id: '1', codigo: 'MATUTINO', nombre: 'Matutino' },
      { id: '2', codigo: 'VESPERTINO', nombre: 'Vespertino' },
    ],
  });
});
