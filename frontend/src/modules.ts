export type ModuleKey = 'alumnos' | 'docentes' | 'bimestres' | 'grupos' | 'inscripciones' | 'evaluaciones' | 'calificaciones' | 'seguimiento';

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
}

export const moduleDefinitions: ModuleDefinition[] = [
  {
    key: 'alumnos',
    label: 'Alumnos',
    description: 'Alta, búsqueda y desactivación lógica de alumnos internos y externos.',
  },
  {
    key: 'docentes',
    label: 'Docentes',
    description: 'Perfil docente con habilitaciones por idioma, nivel y subnivel.',
  },
  {
    key: 'bimestres',
    label: 'Bimestres',
    description: 'Periodos académicos con código YY-N y estado operativo.',
  },
  {
    key: 'grupos',
    label: 'Grupos',
    description: 'Oferta por idioma, nivel, subnivel, turno, horarios y docente actual.',
  },
  {
    key: 'inscripciones',
    label: 'Inscripciones',
    description: 'Relación alumno-grupo con estado y calificación final calculada.',
  },
  {
    key: 'evaluaciones',
    label: 'Evaluaciones',
    description: 'Parcial y final por grupo.',
  },
  {
    key: 'calificaciones',
    label: 'Calificaciones',
    description: 'Captura y consulta de notas por evaluación.',
  },
  {
    key: 'seguimiento',
    label: 'Seguimiento',
    description: 'Reporte de avance académico por grupo y nivel de riesgo.',
  },
];
