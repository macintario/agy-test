import type {
  AlumnoRecord,
  ApiError,
  CalificacionRecord,
  BimestreRecord,
  CatalogsResponse,
  CreateAlumnoInput,
  CreateCalificacionInput,
  CreateInscripcionInput,
  CreateGrupoInput,
  CreateDocenteInput,
  DocenteRecord,
  EvaluacionRecord,
  InscripcionRecord,
  GrupoRecord,
  LoginResponse,
  SessionUser,
  UpdateAlumnoInput,
  UpdateCalificacionInput,
  UpdateInscripcionInput,
  UpdateGrupoInput,
  UpdateDocenteInput,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiException extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('Content-Type', 'application/json');

  const bearer = token ?? localStorage.getItem('celex.token');
  if (bearer) {
    headers.set('Authorization', `Bearer ${bearer}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const error = payload as ApiError;
    throw new ApiException(error.message ?? 'Request failed', response.status, error.error);
  }

  return payload as T;
}

export function login(identifier: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export function getCurrentUser(token: string) {
  return request<{ user: SessionUser }>('/api/auth/me', {}, token);
}

export function getCatalogs() {
  return request<CatalogsResponse>('/api/catalogs');
}

export function getAlumnos() {
  return request<{ items: AlumnoRecord[]; total: number }>('/api/alumnos');
}

export function createAlumno(input: CreateAlumnoInput) {
  return request<{ alumno: AlumnoRecord }>('/api/alumnos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAlumno(id: string, input: UpdateAlumnoInput) {
  return request<{ alumno: AlumnoRecord }>(`/api/alumnos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deactivateAlumno(id: string) {
  return request<{ alumno: AlumnoRecord; message: string }>(`/api/alumnos/${id}`, {
    method: 'DELETE',
  });
}

export function getDocentes() {
  return request<{ items: DocenteRecord[]; total: number }>('/api/docentes');
}

export function createDocente(input: CreateDocenteInput) {
  return request<{ docente: DocenteRecord }>('/api/docentes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateDocente(id: string, input: UpdateDocenteInput) {
  return request<{ docente: DocenteRecord }>(`/api/docentes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deactivateDocente(id: string) {
  return request<{ docente: DocenteRecord; message: string }>(`/api/docentes/${id}`, {
    method: 'DELETE',
  });
}

export function getBimestres() {
  return request<{ items: BimestreRecord[]; total: number }>('/api/bimestres');
}

export function getGrupos() {
  return request<{ items: GrupoRecord[]; total: number }>('/api/grupos');
}

export function createGrupo(input: CreateGrupoInput) {
  return request<{ grupo: GrupoRecord }>('/api/grupos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateGrupo(id: string, input: UpdateGrupoInput) {
  return request<{ grupo: GrupoRecord }>(`/api/grupos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function cancelGrupo(id: string) {
  return request<{ grupo: GrupoRecord; message: string }>(`/api/grupos/${id}`, {
    method: 'DELETE',
  });
}

export function getInscripciones() {
  return request<{ items: InscripcionRecord[]; total: number }>('/api/inscripciones');
}

export function createInscripcion(input: CreateInscripcionInput) {
  return request<{ inscripcion: InscripcionRecord }>('/api/inscripciones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateInscripcion(id: string, input: UpdateInscripcionInput) {
  return request<{ inscripcion: InscripcionRecord }>(`/api/inscripciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function cancelInscripcion(id: string) {
  return request<{ inscripcion: InscripcionRecord; message: string }>(`/api/inscripciones/${id}`, {
    method: 'DELETE',
  });
}

export function getEvaluaciones() {
  return request<{ items: EvaluacionRecord[]; total: number }>('/api/evaluaciones');
}

export function getCalificaciones() {
  return request<{ items: CalificacionRecord[]; total: number }>('/api/calificaciones');
}

export function createCalificacion(input: CreateCalificacionInput) {
  return request<{ calificacion: CalificacionRecord }>('/api/calificaciones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCalificacion(id: string, input: UpdateCalificacionInput) {
  return request<{ calificacion: CalificacionRecord }>(`/api/calificaciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCalificacion(id: string) {
  return request<{ calificacion: CalificacionRecord; message: string }>(`/api/calificaciones/${id}`, {
    method: 'DELETE',
  });
}
