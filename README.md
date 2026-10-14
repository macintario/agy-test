# Celex Grades Backend

Backend inicial para el registro de calificaciones de Celex.

## Stack

- Node.js
- Express
- Prisma
- MySQL

## Scripts

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`

## Módulos iniciales

- Autenticación y roles
- Gestión de usuarios administrativos
- CRUD de alumnos
- CRUD de docentes
- CRUD de bimestres
- CRUD de grupos
- CRUD de inscripciones
- CRUD de evaluaciones
- CRUD de calificaciones

## Variables de entorno

- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`
- `APP_BASE_PATH` (default: `/celex`)

## Frontend

El frontend React inicial está en [frontend/](/home/yan/proyectos/agy-test/frontend).

### Scripts del frontend

Dentro de `frontend/`:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

Variables opcionales del frontend:

- `VITE_API_BASE_URL` (default: `/celex`)

## Script para iniciar frontend + backend

Se agregó el script [scripts/start-celex.sh](agy-test/scripts/start-celex.sh) para iniciar ambos servicios.

Uso:

- Desarrollo (default): `./scripts/start-celex.sh` o `./scripts/start-celex.sh dev`
- Producción local: `./scripts/start-celex.sh prod`

Variables opcionales para el script:

- `PORT` (backend, default `3000`)
- `FRONTEND_HOST` (default `127.0.0.1`)
- `FRONTEND_PORT` (default `5173`)
- `APP_BASE_PATH` (default `/celex`)

## Setup rápido

1. Copia `.env.example` a `.env`
2. Configura `DATABASE_URL`
3. Instala dependencias
4. Ejecuta migraciones
5. Crea el usuario administrador inicial con `prisma:seed` si aplica
6. Inicia el servidor
