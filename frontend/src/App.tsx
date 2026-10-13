import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ApiException,
  createAlumno,
  createCalificacion,
  createDocente,
  cancelInscripcion,
  cancelGrupo,
  deleteCalificacion,
  createInscripcion,
  createGrupo,
  deactivateAlumno,
  deactivateDocente,
  getAlumnos,
  getBimestres,
  getCalificaciones,
  getCatalogs,
  getCurrentUser,
  getDocentes,
  getEvaluaciones,
  getGrupos,
  getInscripciones,
  login,
  updateAlumno,
  updateCalificacion,
  updateInscripcion,
  updateGrupo,
  updateDocente,
} from './api';
import { moduleDefinitions, type ModuleKey } from './modules';
import type {
  AlumnoRecord,
  BimestreRecord,
  CatalogOption,
  CatalogsResponse,
  CreateAlumnoInput,
  CreateCalificacionInput,
  CreateDocenteInput,
  CreateGrupoInput,
  CreateInscripcionInput,
  DocenteHabilitacionInput,
  DocenteRecord,
  CalificacionRecord,
  EvaluacionRecord,
  GrupoRecord,
  InscripcionRecord,
  SessionUser,
  UpdateCalificacionInput,
  UpdateInscripcionInput,
} from './types';

type ViewState = 'loading' | 'auth' | 'dashboard';
type ModuleRow = Record<string, unknown>;

type TableColumn = {
  label: string;
  render: (row: ModuleRow) => string;
};

type AlumnoFormState = {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  telefono: string;
  tipo_alumno: 'interno' | 'externo';
  codigo_origen: string;
  escuela_origen: string;
};

type DocenteHabilitacionFormState = {
  idioma_id: string;
  nivel_maximo_id: string;
  subnivel_maximo_id: string;
  activo: boolean;
};

type DocenteFormState = {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  telefono: string;
  clave_docente: string;
  habilitaciones: DocenteHabilitacionFormState[];
};

type GrupoHorarioFormState = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  observaciones: string;
};

type GrupoFormState = {
  bimestre_id: string;
  idioma_id: string;
  nivel_id: string;
  subnivel_id: string;
  turno_id: string;
  folio: string;
  cupo_maximo: string;
  estado: 'programado' | 'abierto' | 'cerrado' | 'cancelado';
  observaciones: string;
  docente_id: string;
  horarios: GrupoHorarioFormState[];
};

type InscripcionFormState = {
  grupo_id: string;
  alumno_id: string;
  fecha_inscripcion: string;
  estatus: 'inscrito' | 'baja' | 'acreditado' | 'no_acreditado' | 'cancelado';
  observaciones: string;
};

type CalificacionFormState = {
  grupo_id: string;
  inscripcion_id: string;
  evaluacion_id: string;
  calificacion: string;
  observaciones: string;
};

const roleDescriptions: Record<string, string> = {
  ADMINISTRADOR: 'Gestiona usuarios, catálogos y configuración global.',
  SUPERVISOR: 'Supervisa la operación académica por idioma.',
  CONTROL_ESCOLAR: 'Administra inscripciones, grupos y calificaciones.',
  DOCENTE: 'Consulta grupos y captura calificaciones.',
};

const moduleSummaries: Record<ModuleKey, string> = {
  alumnos: 'Lista y mantenimiento de alumnos internos y externos.',
  docentes: 'Docentes con habilitaciones por idioma y nivel.',
  bimestres: 'Periodos académicos registrados.',
  grupos: 'Grupos ofertados por bimestre e idioma.',
  inscripciones: 'Relaciones alumno-grupo.',
  evaluaciones: 'Evaluaciones parciales y finales.',
  calificaciones: 'Calificaciones capturadas por evaluación.',
  seguimiento: 'Reporte de avance académico por grupo y nivel de riesgo.',
};

function createEmptyAlumnoForm(): AlumnoFormState {
  return {
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    telefono: '',
    tipo_alumno: 'interno',
    codigo_origen: '',
    escuela_origen: '',
  };
}

function createEmptyGrupoForm(): GrupoFormState {
  return {
    bimestre_id: '',
    idioma_id: '',
    nivel_id: '',
    subnivel_id: '',
    turno_id: '',
    folio: '',
    cupo_maximo: '0',
    estado: 'programado',
    observaciones: '',
    docente_id: '',
    horarios: [
      {
        dia_semana: 6,
        hora_inicio: '08:00',
        hora_fin: '10:00',
        observaciones: '',
      },
    ],
  };
}

function createEmptyInscripcionForm(): InscripcionFormState {
  return {
    grupo_id: '',
    alumno_id: '',
    fecha_inscripcion: '',
    estatus: 'inscrito',
    observaciones: '',
  };
}

function createEmptyCalificacionForm(): CalificacionFormState {
  return {
    grupo_id: '',
    inscripcion_id: '',
    evaluacion_id: '',
    calificacion: '',
    observaciones: '',
  };
}

function createEmptyDocenteForm(): DocenteFormState {
  return {
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    telefono: '',
    clave_docente: '',
    habilitaciones: [
      {
        idioma_id: '',
        nivel_maximo_id: '',
        subnivel_maximo_id: '',
        activo: true,
      },
    ],
  };
}

function readValueAtPath(value: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = value;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function formatValue(value: unknown): string {
  if (value == null) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(value);
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getComparableId(value: unknown): string {
  return value == null ? '' : String(value);
}

function buildAlumnoInput(form: AlumnoFormState): CreateAlumnoInput {
  return {
    nombres: form.nombres.trim(),
    apellido_paterno: form.apellido_paterno.trim(),
    apellido_materno: trimToNull(form.apellido_materno),
    correo: trimToNull(form.correo),
    telefono: trimToNull(form.telefono),
    tipo_alumno: form.tipo_alumno,
    codigo_origen: trimToNull(form.codigo_origen),
    escuela_origen: trimToNull(form.escuela_origen),
  };
}

function buildDocenteInput(form: DocenteFormState): CreateDocenteInput {
  const habilitaciones: DocenteHabilitacionInput[] = form.habilitaciones
    .filter(
      (item) =>
        item.idioma_id.trim() !== '' &&
        item.nivel_maximo_id.trim() !== '' &&
        item.subnivel_maximo_id.trim() !== '',
    )
    .map((item) => ({
      idioma_id: item.idioma_id,
      nivel_maximo_id: item.nivel_maximo_id,
      subnivel_maximo_id: item.subnivel_maximo_id,
      activo: item.activo,
    }));

  return {
    nombres: form.nombres.trim(),
    apellido_paterno: form.apellido_paterno.trim(),
    apellido_materno: trimToNull(form.apellido_materno),
    correo: trimToNull(form.correo),
    telefono: trimToNull(form.telefono),
    clave_docente: form.clave_docente.trim(),
    habilitaciones,
  };
}

function buildGrupoInput(form: GrupoFormState): CreateGrupoInput {
  const cupoMaximo = form.cupo_maximo.trim() === '' ? 0 : Number(form.cupo_maximo);
  return {
    bimestre_id: form.bimestre_id,
    idioma_id: form.idioma_id,
    nivel_id: form.nivel_id,
    subnivel_id: form.subnivel_id,
    turno_id: form.turno_id,
    folio: trimToUndefined(form.folio),
    cupo_maximo: Number.isNaN(cupoMaximo) ? 0 : cupoMaximo,
    estado: form.estado,
    observaciones: trimToNull(form.observaciones),
    docente_id: trimToNull(form.docente_id),
    horarios: form.horarios.map((horario) => ({
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      observaciones: trimToNull(horario.observaciones),
    })),
  };
}

function buildInscripcionInput(form: InscripcionFormState): CreateInscripcionInput {
  return {
    grupo_id: form.grupo_id,
    alumno_id: form.alumno_id,
    fecha_inscripcion: trimToUndefined(form.fecha_inscripcion),
    estatus: form.estatus,
    observaciones: trimToNull(form.observaciones),
  };
}

function isCompleteHabilitacion(item: DocenteHabilitacionFormState) {
  return item.idioma_id.trim() !== '' && item.nivel_maximo_id.trim() !== '' && item.subnivel_maximo_id.trim() !== '';
}

function getDocenteHabilitacionSummary(docente: DocenteRecord) {
  if (docente.habilitaciones.length === 0) {
    return 'Sin habilitaciones';
  }

  return docente.habilitaciones
    .map(
      (item) =>
        `${item.idioma.codigo} ${item.nivel_maximo.codigo} ${item.subnivel_maximo.codigo}${item.activo ? '' : ' (inactiva)'}`,
    )
    .join(' · ');
}

const dayLabels: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

function formatGroupDay(diaSemana: number) {
  return dayLabels[diaSemana] ?? `Día ${diaSemana}`;
}

function formatGroupSchedule(group: GrupoRecord) {
  if (group.horarios.length === 0) {
    return 'Sin horarios';
  }

  return group.horarios
    .map((horario) => `${formatGroupDay(horario.dia_semana)} ${horario.hora_inicio}-${horario.hora_fin}`)
    .join(' · ');
}

function formatGroupTeacher(group: GrupoRecord) {
  if (!group.docente_actual) {
    return 'Sin docente';
  }

  return `${group.docente_actual.persona.nombres} ${group.docente_actual.persona.apellido_paterno}`;
}

function formatInscripcionDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function toDatetimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatInscripcionAlumno(inscripcion: InscripcionRecord) {
  const nombres = inscripcion.alumno?.persona?.nombres;
  const apellido = inscripcion.alumno?.persona?.apellido_paterno;
  if (!nombres || !apellido) {
    return '—';
  }

  return `${nombres} ${apellido}`;
}

function formatInscripcionGrupo(inscripcion: InscripcionRecord) {
  const folio = inscripcion.grupo?.folio;
  const codigo = inscripcion.grupo?.bimestre?.codigo;
  if (!folio || !codigo) {
    return '—';
  }

  return `${folio} · ${codigo}`;
}

function formatInscripcionAlumnoOption(alumno: AlumnoRecord) {
  return `${alumno.persona.nombres} ${alumno.persona.apellido_paterno}${alumno.codigo_origen ? ` · ${alumno.codigo_origen}` : ''}`;
}

function formatInscripcionGrupoOption(grupo: GrupoRecord) {
  return `${grupo.folio} · ${grupo.bimestre.codigo} · ${grupo.idioma.nombre} · ${grupo.nivel.nombre} · ${grupo.subnivel.nombre}`;
}

function formatCalificacionGrupoOption(grupo: GrupoRecord) {
  return `${grupo.folio} · ${grupo.bimestre.codigo} · ${grupo.idioma.nombre} · ${grupo.nivel.nombre}${grupo.subnivel ? ` · ${grupo.subnivel.nombre}` : ''}`;
}

function formatCalificacionInscripcionOption(inscripcion: InscripcionRecord) {
  return `${inscripcion.alumno.persona.nombres} ${inscripcion.alumno.persona.apellido_paterno} · ${inscripcion.grupo.folio}`;
}

function formatCalificacionEvaluacionOption(evaluacion: EvaluacionRecord) {
  return `${evaluacion.grupo.folio} · ${evaluacion.tipo} · ${evaluacion.ponderacion}%`;
}

const moduleColumns: Record<ModuleKey, TableColumn[]> = {
  alumnos: [
    { label: 'Nombre(s)', render: (row) => formatValue(readValueAtPath(row, 'persona.nombres')) },
    {
      label: 'Apellido paterno',
      render: (row) => formatValue(readValueAtPath(row, 'persona.apellido_paterno')),
    },
    { label: 'Tipo', render: (row) => formatValue(readValueAtPath(row, 'tipo_alumno')) },
    { label: 'Activo', render: (row) => formatValue(readValueAtPath(row, 'activo')) },
  ],
  docentes: [
    { label: 'Nombre(s)', render: (row) => formatValue(readValueAtPath(row, 'persona.nombres')) },
    {
      label: 'Apellido paterno',
      render: (row) => formatValue(readValueAtPath(row, 'persona.apellido_paterno')),
    },
    { label: 'Clave', render: (row) => formatValue(readValueAtPath(row, 'clave_docente')) },
    {
      label: 'Habilitaciones',
      render: (row) => getDocenteHabilitacionSummary(row as unknown as DocenteRecord),
    },
    { label: 'Activo', render: (row) => formatValue(readValueAtPath(row, 'activo')) },
  ],
  bimestres: [
    { label: 'Código', render: (row) => formatValue(readValueAtPath(row, 'codigo')) },
    { label: 'Año', render: (row) => formatValue(readValueAtPath(row, 'anio')) },
    { label: 'Bimestre', render: (row) => formatValue(readValueAtPath(row, 'bimestre_numero')) },
    { label: 'Estatus', render: (row) => formatValue(readValueAtPath(row, 'estatus')) },
  ],
  grupos: [
    { label: 'Folio', render: (row) => formatValue(readValueAtPath(row, 'folio')) },
    { label: 'Bimestre', render: (row) => formatValue(readValueAtPath(row, 'bimestre.codigo')) },
    { label: 'Idioma', render: (row) => formatValue(readValueAtPath(row, 'idioma.nombre')) },
    { label: 'Nivel', render: (row) => formatValue(readValueAtPath(row, 'nivel.nombre')) },
    { label: 'Subnivel', render: (row) => formatValue(readValueAtPath(row, 'subnivel.nombre')) },
    { label: 'Turno', render: (row) => formatValue(readValueAtPath(row, 'turno.nombre')) },
    {
      label: 'Horario',
      render: (row) => formatGroupSchedule(row as unknown as GrupoRecord),
    },
    { label: 'Docente', render: (row) => formatGroupTeacher(row as unknown as GrupoRecord) },
    { label: 'Estado', render: (row) => formatValue(readValueAtPath(row, 'estado')) },
  ],
  inscripciones: [
    { label: 'Alumno', render: (row) => formatInscripcionAlumno(row as unknown as InscripcionRecord) },
    { label: 'Grupo', render: (row) => formatInscripcionGrupo(row as unknown as InscripcionRecord) },
    { label: 'Inscripción', render: (row) => formatInscripcionDate(readValueAtPath(row, 'fecha_inscripcion') as string) },
    { label: 'Estatus', render: (row) => formatValue(readValueAtPath(row, 'estatus')) },
    { label: 'Aprobado', render: (row) => formatValue(readValueAtPath(row, 'aprobado')) },
    { label: 'Final', render: (row) => formatValue(readValueAtPath(row, 'calificacion_final')) },
  ],
  evaluaciones: [
    { label: 'Grupo', render: (row) => formatValue(readValueAtPath(row, 'grupo.folio')) },
    { label: 'Tipo', render: (row) => formatValue(readValueAtPath(row, 'tipo')) },
    { label: 'Ponderación', render: (row) => formatValue(readValueAtPath(row, 'ponderacion')) },
    { label: 'Estatus', render: (row) => formatValue(readValueAtPath(row, 'estatus')) },
  ],
  calificaciones: [
    { label: 'Grupo', render: (row) => formatValue(readValueAtPath(row, 'inscripcion.grupo.folio')) },
    { label: 'Alumno', render: (row) => formatValue(readValueAtPath(row, 'inscripcion.alumno.persona.nombres')) },
    { label: 'Evaluación', render: (row) => formatValue(readValueAtPath(row, 'evaluacion.tipo')) },
    { label: 'Calificación', render: (row) => formatValue(readValueAtPath(row, 'calificacion')) },
  ],
  seguimiento: [
    { label: 'Grupo', render: (row) => formatValue(readValueAtPath(row, 'folio')) },
    { label: 'Bimestre', render: (row) => formatValue(readValueAtPath(row, 'bimestre')) },
    { label: 'Inscritos', render: (row) => formatValue(readValueAtPath(row, 'inscritos')) },
    { label: 'Promedio', render: (row) => formatValue(readValueAtPath(row, 'promedio')) },
    { label: 'Pendientes', render: (row) => formatValue(readValueAtPath(row, 'pendientes')) },
    { label: 'Riesgo', render: (row) => formatValue(readValueAtPath(row, 'riesgo')) },
  ],
};

function App() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('celex.token'));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [catalogSummary, setCatalogSummary] = useState<string[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogsResponse | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>('alumnos');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [moduleRows, setModuleRows] = useState<ModuleRow[]>([]);
  const [moduleTotal, setModuleTotal] = useState(0);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [moduleNotice, setModuleNotice] = useState<string | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [editingAlumnoId, setEditingAlumnoId] = useState<string | null>(null);
  const [alumnoForm, setAlumnoForm] = useState<AlumnoFormState>(() => createEmptyAlumnoForm());
  const [editingDocenteId, setEditingDocenteId] = useState<string | null>(null);
  const [docenteForm, setDocenteForm] = useState<DocenteFormState>(() => createEmptyDocenteForm());
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [grupoForm, setGrupoForm] = useState<GrupoFormState>(() => createEmptyGrupoForm());
  const [groupLookups, setGroupLookups] = useState<{
    bimestres: BimestreRecord[];
    docentes: DocenteRecord[];
  }>({
    bimestres: [],
    docentes: [],
  });
  const [editingInscripcionId, setEditingInscripcionId] = useState<string | null>(null);
  const [inscripcionForm, setInscripcionForm] = useState<InscripcionFormState>(() => createEmptyInscripcionForm());
  const [inscripcionLookups, setInscripcionLookups] = useState<{
    alumnos: AlumnoRecord[];
    grupos: GrupoRecord[];
  }>({
    alumnos: [],
    grupos: [],
  });
  const [editingCalificacionId, setEditingCalificacionId] = useState<string | null>(null);
  const [calificacionForm, setCalificacionForm] = useState<CalificacionFormState>(() =>
    createEmptyCalificacionForm(),
  );
  const [calificacionLookups, setCalificacionLookups] = useState<{
    grupos: GrupoRecord[];
    inscripciones: InscripcionRecord[];
    evaluaciones: EvaluacionRecord[];
  }>({
    grupos: [],
    inscripciones: [],
    evaluaciones: [],
  });

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const catalogsResponse = await getCatalogs();
        if (!active) {
          return;
        }

        setCatalogs(catalogsResponse);
        setCatalogSummary([
          `${catalogsResponse.roles.length} roles`,
          `${catalogsResponse.idiomas.length} idiomas`,
          `${catalogsResponse.niveles.length} niveles`,
          `${catalogsResponse.subniveles.length} subniveles`,
          `${catalogsResponse.turnos.length} turnos`,
        ]);
      } catch {
        if (active) {
          setCatalogSummary(['Catálogos disponibles al conectar con la API']);
        }
      }

      if (!token) {
        if (active) {
          setViewState('auth');
        }
        return;
      }

      try {
        const current = await getCurrentUser(token);
        if (!active) {
          return;
        }

        setUser(current.user);
        setViewState('dashboard');
      } catch {
        if (!active) {
          return;
        }

        localStorage.removeItem('celex.token');
        setToken(null);
        setUser(null);
        setViewState('auth');
      }
    }

    bootstrap().finally(() => {
      if (active && !token) {
        setViewState('auth');
      }
    });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || viewState !== 'dashboard') {
      return;
    }

    let active = true;
    setModuleLoading(true);
    setModuleError(null);
    setModuleRows([]);

    async function loadModule() {
      try {
        const loader = {
          alumnos: getAlumnos,
          docentes: getDocentes,
          bimestres: getBimestres,
          grupos: getGrupos,
          inscripciones: getInscripciones,
          evaluaciones: getEvaluaciones,
          calificaciones: getCalificaciones,
          seguimiento: async () => ({ items: [], total: 0 }),
        }[activeModule];

        if (activeModule === 'grupos') {
          const [groups, bimestres, docentes] = await Promise.all([loader(), getBimestres(), getDocentes()]);
          if (!active) {
            return;
          }

          setModuleRows(groups.items as unknown as ModuleRow[]);
          setModuleTotal(groups.total);
          setGroupLookups({ bimestres: bimestres.items, docentes: docentes.items });
          return;
        }

        if (activeModule === 'inscripciones') {
          const [inscripciones, alumnos, grupos] = await Promise.all([loader(), getAlumnos(), getGrupos()]);
          if (!active) {
            return;
          }

          setModuleRows(inscripciones.items as unknown as ModuleRow[]);
          setModuleTotal(inscripciones.total);
          setInscripcionLookups({ alumnos: alumnos.items, grupos: grupos.items });
          return;
        }

        if (activeModule === 'calificaciones') {
          const [calificaciones, grupos, inscripciones, evaluaciones] = await Promise.all([
            loader(),
            getGrupos(),
            getInscripciones(),
            getEvaluaciones(),
          ]);
          if (!active) {
            return;
          }

          setModuleRows(calificaciones.items as unknown as ModuleRow[]);
          setModuleTotal(calificaciones.total);
          setCalificacionLookups({
            grupos: grupos.items,
            inscripciones: inscripciones.items,
            evaluaciones: evaluaciones.items,
          });
          return;
        }

        if (activeModule === 'seguimiento') {
          const [grupos, inscripciones] = await Promise.all([getGrupos(), getInscripciones()]);
          if (!active) {
            return;
          }

          const rows = grupos.items.map((grupo) => {
            const grupoInscripciones = inscripciones.items.filter((inscripcion) => inscripcion.grupo_id === grupo.id);
            const inscritos = grupoInscripciones.length;
            const scores = grupoInscripciones
              .map((inscripcion) => Number(inscripcion.calificacion_final ?? 0))
              .filter((calificacion) => Number.isFinite(calificacion) && calificacion > 0);
            const promedio = scores.length > 0 ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
            const pendientes = grupoInscripciones.filter((inscripcion) => !inscripcion.calificacion_final).length;
            const riesgo = promedio >= 8 ? 'Normal' : pendientes > 0 ? 'En seguimiento' : 'Atención';

            return {
              id: grupo.id,
              folio: grupo.folio,
              bimestre: grupo.bimestre.codigo,
              inscritos,
              promedio: promedio > 0 ? promedio.toFixed(2) : '—',
              pendientes,
              riesgo,
            } as ModuleRow;
          });

          setModuleRows(rows);
          setModuleTotal(rows.length);
          return;
        }

        const result = await loader();
        if (!active) {
          return;
        }

        setModuleRows(result.items as unknown as ModuleRow[]);
        setModuleTotal(result.total);
      } catch (err) {
        if (!active) {
          return;
        }

        const text = err instanceof ApiException ? err.message : 'No se pudo cargar el módulo.';
        setModuleError(text);
        setModuleRows([]);
        setModuleTotal(0);
        if (activeModule === 'grupos') {
          setGroupLookups({ bimestres: [], docentes: [] });
        }
        if (activeModule === 'inscripciones') {
          setInscripcionLookups({ alumnos: [], grupos: [] });
        }
        if (activeModule === 'calificaciones') {
          setCalificacionLookups({ grupos: [], inscripciones: [], evaluaciones: [] });
        }
      } finally {
        if (active) {
          setModuleLoading(false);
        }
      }
    }

    loadModule();

    return () => {
      active = false;
    };
  }, [activeModule, refreshNonce, token, viewState]);

  const roleCodes = useMemo(() => user?.roles.map((role) => role.codigo) ?? [], [user]);
  const columns = moduleColumns[activeModule];
  const activeDefinition = moduleDefinitions.find((item) => item.key === activeModule)!;
  const supportsEditing =
    activeModule === 'alumnos' ||
    activeModule === 'docentes' ||
    activeModule === 'grupos' ||
    activeModule === 'inscripciones' ||
    activeModule === 'calificaciones';

  useEffect(() => {
    setModuleError(null);
    setModuleNotice(null);
  }, [activeModule]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingLogin(true);
    setError(null);
    setMessage(null);

    try {
      const result = await login(identifier.trim(), password);
      localStorage.setItem('celex.token', result.token);
      setToken(result.token);
      setUser(result.user);
      setMessage(`Bienvenido, ${result.user.persona.nombres}.`);
      setViewState('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoadingLogin(false);
    }
  }

  function logout() {
    localStorage.removeItem('celex.token');
    setToken(null);
    setUser(null);
    setIdentifier('');
    setPassword('');
    setError(null);
    setMessage(null);
    setModuleError(null);
    setModuleNotice(null);
    setEditingAlumnoId(null);
    setEditingDocenteId(null);
    setEditingGrupoId(null);
    setEditingInscripcionId(null);
    setEditingCalificacionId(null);
    setAlumnoForm(createEmptyAlumnoForm());
    setDocenteForm(createEmptyDocenteForm());
    setGrupoForm(createEmptyGrupoForm());
    setInscripcionForm(createEmptyInscripcionForm());
    setCalificacionForm(createEmptyCalificacionForm());
    setViewState('auth');
  }

  function resetAlumnoForm() {
    setEditingAlumnoId(null);
    setAlumnoForm(createEmptyAlumnoForm());
    setModuleError(null);
    setModuleNotice(null);
  }

  function resetDocenteForm() {
    setEditingDocenteId(null);
    setDocenteForm(createEmptyDocenteForm());
    setModuleError(null);
    setModuleNotice(null);
  }

  function selectAlumno(alumno: AlumnoRecord) {
    setActiveModule('alumnos');
    setEditingAlumnoId(alumno.id);
    setAlumnoForm({
      nombres: alumno.persona.nombres,
      apellido_paterno: alumno.persona.apellido_paterno,
      apellido_materno: alumno.persona.apellido_materno ?? '',
      correo: alumno.persona.correo ?? '',
      telefono: alumno.persona.telefono ?? '',
      tipo_alumno: alumno.tipo_alumno,
      codigo_origen: alumno.codigo_origen ?? '',
      escuela_origen: alumno.escuela_origen ?? '',
    });
    setModuleError(null);
    setModuleNotice(null);
  }

  function selectDocente(docente: DocenteRecord) {
    setActiveModule('docentes');
    setEditingDocenteId(docente.id);
    setDocenteForm({
      nombres: docente.persona.nombres,
      apellido_paterno: docente.persona.apellido_paterno,
      apellido_materno: docente.persona.apellido_materno ?? '',
      correo: docente.persona.correo ?? '',
      telefono: docente.persona.telefono ?? '',
      clave_docente: docente.clave_docente,
      habilitaciones:
        docente.habilitaciones.length > 0
          ? docente.habilitaciones.map((item) => ({
              idioma_id: item.idioma_id,
              nivel_maximo_id: item.nivel_maximo_id,
              subnivel_maximo_id: item.subnivel_maximo_id,
              activo: item.activo,
            }))
          : [
              {
                idioma_id: '',
                nivel_maximo_id: '',
                subnivel_maximo_id: '',
                activo: true,
              },
            ],
    });
    setModuleError(null);
    setModuleNotice(null);
  }

  async function handleAlumnoSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      const payload = buildAlumnoInput(alumnoForm);
      if (editingAlumnoId) {
        await updateAlumno(editingAlumnoId, payload);
        setModuleNotice('Alumno actualizado correctamente.');
      } else {
        await createAlumno(payload);
        setModuleNotice('Alumno registrado correctamente.');
      }

      resetAlumnoForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo guardar el alumno.');
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleAlumnoDeactivate() {
    if (!editingAlumnoId) {
      return;
    }

    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      await deactivateAlumno(editingAlumnoId);
      setModuleNotice('Alumno desactivado correctamente.');
      resetAlumnoForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo desactivar el alumno.');
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleDocenteSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      const payload = buildDocenteInput(docenteForm);
      if (editingDocenteId) {
        await updateDocente(editingDocenteId, payload);
        setModuleNotice('Docente actualizado correctamente.');
      } else {
        await createDocente(payload);
        setModuleNotice('Docente registrado correctamente.');
      }

      resetDocenteForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo guardar el docente.');
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleDocenteDeactivate() {
    if (!editingDocenteId) {
      return;
    }

    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      await deactivateDocente(editingDocenteId);
      setModuleNotice('Docente desactivado correctamente.');
      resetDocenteForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo desactivar el docente.');
    } finally {
      setSavingRecord(false);
    }
  }

  function resetGrupoForm() {
    setEditingGrupoId(null);
    setGrupoForm(createEmptyGrupoForm());
    setModuleError(null);
    setModuleNotice(null);
  }

  function selectGrupo(grupo: GrupoRecord) {
    setActiveModule('grupos');
    setEditingGrupoId(grupo.id);
    setGrupoForm({
      bimestre_id: grupo.bimestre_id,
      idioma_id: grupo.idioma_id,
      nivel_id: grupo.nivel_id,
      subnivel_id: grupo.subnivel_id,
      turno_id: grupo.turno_id,
      folio: grupo.folio,
      cupo_maximo: String(grupo.cupo_maximo),
      estado: grupo.estado,
      observaciones: grupo.observaciones ?? '',
      docente_id: grupo.docente_actual?.id ?? '',
      horarios:
        grupo.horarios.length > 0
          ? grupo.horarios.map((horario) => ({
              dia_semana: horario.dia_semana,
              hora_inicio: horario.hora_inicio.slice(0, 5),
              hora_fin: horario.hora_fin.slice(0, 5),
              observaciones: horario.observaciones ?? '',
            }))
          : [
              {
                dia_semana: 6,
                hora_inicio: '08:00',
                hora_fin: '10:00',
                observaciones: '',
              },
            ],
    });
    setModuleError(null);
    setModuleNotice(null);
  }

  function updateGrupoHorario(index: number, field: keyof GrupoHorarioFormState, value: string | number) {
    setGrupoForm((current) => ({
      ...current,
      horarios: current.horarios.map((horario, horarioIndex) =>
        horarioIndex === index ? { ...horario, [field]: value } : horario,
      ),
    }));
  }

  function addGrupoHorario() {
    setGrupoForm((current) => ({
      ...current,
      horarios: [
        ...current.horarios,
        {
          dia_semana: 6,
          hora_inicio: '08:00',
          hora_fin: '10:00',
          observaciones: '',
        },
      ],
    }));
  }

  function removeGrupoHorario(index: number) {
    setGrupoForm((current) => {
      const next = current.horarios.filter((_, horarioIndex) => horarioIndex !== index);
      return {
        ...current,
        horarios:
          next.length > 0
            ? next
            : [
                {
                  dia_semana: 6,
                  hora_inicio: '08:00',
                  hora_fin: '10:00',
                  observaciones: '',
                },
              ],
      };
    });
  }

  async function handleGrupoSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      const payload = buildGrupoInput(grupoForm);
      if (editingGrupoId) {
        await updateGrupo(editingGrupoId, payload);
        setModuleNotice('Grupo actualizado correctamente.');
      } else {
        await createGrupo(payload);
        setModuleNotice('Grupo creado correctamente.');
      }

      resetGrupoForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo guardar el grupo.');
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleGrupoCancel() {
    if (!editingGrupoId) {
      return;
    }

    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      await cancelGrupo(editingGrupoId);
      setModuleNotice('Grupo cancelado correctamente.');
      resetGrupoForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo cancelar el grupo.');
    } finally {
      setSavingRecord(false);
    }
  }

  function resetInscripcionForm() {
    setEditingInscripcionId(null);
    setInscripcionForm(createEmptyInscripcionForm());
    setModuleError(null);
    setModuleNotice(null);
  }

  function selectInscripcion(inscripcion: InscripcionRecord) {
    setActiveModule('inscripciones');
    setEditingInscripcionId(inscripcion.id);
    setInscripcionForm({
      grupo_id: inscripcion.grupo_id,
      alumno_id: inscripcion.alumno_id,
      fecha_inscripcion: toDatetimeLocalValue(inscripcion.fecha_inscripcion),
      estatus: inscripcion.estatus,
      observaciones: inscripcion.observaciones ?? '',
    });
    setModuleError(null);
    setModuleNotice(null);
  }

  function buildInscripcionUpdateInput(form: InscripcionFormState): UpdateInscripcionInput {
    return {
      fecha_inscripcion: trimToUndefined(form.fecha_inscripcion),
      estatus: form.estatus,
      observaciones: trimToNull(form.observaciones),
    };
  }

  async function handleInscripcionSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      if (editingInscripcionId) {
        const payload = buildInscripcionUpdateInput(inscripcionForm);
        await updateInscripcion(editingInscripcionId, payload);
        setModuleNotice('Inscripción actualizada correctamente.');
      } else {
        const payload = buildInscripcionInput(inscripcionForm);
        await createInscripcion(payload);
        setModuleNotice('Inscripción registrada correctamente.');
      }

      resetInscripcionForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo guardar la inscripción.');
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleInscripcionCancel() {
    if (!editingInscripcionId) {
      return;
    }

    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      await cancelInscripcion(editingInscripcionId);
      setModuleNotice('Inscripción cancelada correctamente.');
      resetInscripcionForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo cancelar la inscripción.');
    } finally {
      setSavingRecord(false);
    }
  }

  function resetCalificacionForm() {
    setEditingCalificacionId(null);
    setCalificacionForm(createEmptyCalificacionForm());
    setModuleError(null);
    setModuleNotice(null);
  }

  function selectCalificacion(calificacion: CalificacionRecord) {
    setActiveModule('calificaciones');
    setEditingCalificacionId(calificacion.id);
    setCalificacionForm({
      grupo_id: calificacion.grupo_id,
      inscripcion_id: calificacion.inscripcion_id,
      evaluacion_id: calificacion.evaluacion_id,
      calificacion: calificacion.calificacion,
      observaciones: calificacion.observaciones ?? '',
    });
    setModuleError(null);
    setModuleNotice(null);
  }

  function buildCalificacionInput(form: CalificacionFormState): CreateCalificacionInput {
    return {
      grupo_id: form.grupo_id,
      inscripcion_id: form.inscripcion_id,
      evaluacion_id: form.evaluacion_id,
      calificacion: Number(form.calificacion),
      observaciones: trimToNull(form.observaciones),
    };
  }

  function buildCalificacionUpdateInput(form: CalificacionFormState): UpdateCalificacionInput {
    return {
      calificacion: form.calificacion.trim() === '' ? undefined : Number(form.calificacion),
      observaciones: trimToNull(form.observaciones),
    };
  }

  async function handleCalificacionSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      if (editingCalificacionId) {
        const payload = buildCalificacionUpdateInput(calificacionForm);
        await updateCalificacion(editingCalificacionId, payload);
        setModuleNotice('Calificación actualizada correctamente.');
      } else {
        const payload = buildCalificacionInput(calificacionForm);
        await createCalificacion(payload);
        setModuleNotice('Calificación registrada correctamente.');
      }

      resetCalificacionForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo guardar la calificación.');
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleCalificacionDelete() {
    if (!editingCalificacionId) {
      return;
    }

    setSavingRecord(true);
    setModuleError(null);
    setModuleNotice(null);

    try {
      await deleteCalificacion(editingCalificacionId);
      setModuleNotice('Calificación eliminada correctamente.');
      resetCalificacionForm();
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'No se pudo eliminar la calificación.');
    } finally {
      setSavingRecord(false);
    }
  }

  const availableIds = catalogs ?? null;

  function docenteOptionLabel(docente: DocenteRecord) {
    const habilitacion = docente.habilitaciones[0];
    const suffix = habilitacion
      ? ` - ${habilitacion.idioma.codigo} ${habilitacion.nivel_maximo.codigo}${habilitacion.subnivel_maximo.codigo}`
      : '';
    return `${docente.persona.nombres} ${docente.persona.apellido_paterno} (${docente.clave_docente})${suffix}`;
  }

  function renderGrupoEditor() {
    return (
      <section className="dashboard-card form-section">
        <div className="dashboard-top" style={{ marginBottom: 16 }}>
          <div>
            <h3>{editingGrupoId ? 'Editar grupo' : 'Registrar grupo'}</h3>
            <p>Define bimestre, idioma, nivel, horario y docente asignado.</p>
          </div>
          <div className="row">
            <button className="button button-secondary" type="button" onClick={resetGrupoForm}>
              Nuevo grupo
            </button>
            {editingGrupoId ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={handleGrupoCancel}
                disabled={savingRecord}
              >
                Cancelar grupo
              </button>
            ) : null}
          </div>
        </div>

        <form className="editor-grid" onSubmit={handleGrupoSave}>
          <div className="field">
            <label htmlFor="grupo-bimestre">Bimestre</label>
            <select
              id="grupo-bimestre"
              value={grupoForm.bimestre_id}
              onChange={(event) => setGrupoForm((current) => ({ ...current, bimestre_id: event.target.value }))}
              required
            >
              <option value="">Selecciona un bimestre</option>
              {groupLookups.bimestres.map((bimestre) => (
                <option key={bimestre.id} value={bimestre.id}>
                  {bimestre.codigo} · {bimestre.anio} · {bimestre.estatus}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="grupo-idioma">Idioma</label>
            <select
              id="grupo-idioma"
              value={grupoForm.idioma_id}
              onChange={(event) => setGrupoForm((current) => ({ ...current, idioma_id: event.target.value }))}
              required
            >
              <option value="">Selecciona un idioma</option>
              {availableIds?.idiomas.map((idioma) => (
                <option key={idioma.id} value={idioma.id}>
                  {idioma.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="grupo-nivel">Nivel</label>
            <select
              id="grupo-nivel"
              value={grupoForm.nivel_id}
              onChange={(event) => setGrupoForm((current) => ({ ...current, nivel_id: event.target.value }))}
              required
            >
              <option value="">Selecciona un nivel</option>
              {availableIds?.niveles.map((nivel) => (
                <option key={nivel.id} value={nivel.id}>
                  {nivel.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="grupo-subnivel">Subnivel</label>
            <select
              id="grupo-subnivel"
              value={grupoForm.subnivel_id}
              onChange={(event) => setGrupoForm((current) => ({ ...current, subnivel_id: event.target.value }))}
              required
            >
              <option value="">Selecciona un subnivel</option>
              {availableIds?.subniveles.map((subnivel) => (
                <option key={subnivel.id} value={subnivel.id}>
                  {subnivel.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="grupo-turno">Turno</label>
            <select
              id="grupo-turno"
              value={grupoForm.turno_id}
              onChange={(event) => setGrupoForm((current) => ({ ...current, turno_id: event.target.value }))}
              required
            >
              <option value="">Selecciona un turno</option>
              {availableIds?.turnos.map((turno) => (
                <option key={turno.id} value={turno.id}>
                  {turno.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="grupo-folio">Folio</label>
            <input
              id="grupo-folio"
              value={grupoForm.folio}
              onChange={(event) => setGrupoForm((current) => ({ ...current, folio: event.target.value }))}
              placeholder="Opcional; se genera automáticamente"
            />
          </div>

          <div className="field">
            <label htmlFor="grupo-cupo">Cupo máximo</label>
            <input
              id="grupo-cupo"
              type="number"
              min="0"
              value={grupoForm.cupo_maximo}
              onChange={(event) => setGrupoForm((current) => ({ ...current, cupo_maximo: event.target.value }))}
            />
          </div>

          <div className="field">
            <label htmlFor="grupo-estado">Estado</label>
            <select
              id="grupo-estado"
              value={grupoForm.estado}
              onChange={(event) =>
                setGrupoForm((current) => ({
                  ...current,
                  estado: event.target.value as GrupoFormState['estado'],
                }))
              }
            >
              <option value="programado">Programado</option>
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="grupo-docente">Docente</label>
            <select
              id="grupo-docente"
              value={grupoForm.docente_id}
              onChange={(event) => setGrupoForm((current) => ({ ...current, docente_id: event.target.value }))}
            >
              <option value="">Sin docente</option>
              {groupLookups.docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docenteOptionLabel(docente)}
                </option>
              ))}
            </select>
          </div>

          <div className="field field-span-2">
            <label htmlFor="grupo-observaciones">Observaciones</label>
            <textarea
              id="grupo-observaciones"
              value={grupoForm.observaciones}
              onChange={(event) => setGrupoForm((current) => ({ ...current, observaciones: event.target.value }))}
              rows={3}
              placeholder="Opcional"
            />
          </div>

          <div className="field field-span-2">
            <div className="dashboard-top" style={{ marginBottom: 8 }}>
              <div>
                <label>Horarios</label>
                <p>Agrega uno o más horarios para el grupo.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={addGrupoHorario}>
                Agregar horario
              </button>
            </div>

            <div className="habilitaciones-list">
              {grupoForm.horarios.map((horario, index) => (
                <div className="habilitacion-row" key={`${index}-${horario.dia_semana}-${horario.hora_inicio}`}>
                  <div className="field">
                    <label>Día</label>
                    <select
                      value={String(horario.dia_semana)}
                      onChange={(event) =>
                        updateGrupoHorario(index, 'dia_semana', Number(event.target.value))
                      }
                    >
                      {Object.entries(dayLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Hora inicio</label>
                    <input
                      type="time"
                      value={horario.hora_inicio}
                      onChange={(event) => updateGrupoHorario(index, 'hora_inicio', event.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Hora fin</label>
                    <input
                      type="time"
                      value={horario.hora_fin}
                      onChange={(event) => updateGrupoHorario(index, 'hora_fin', event.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Observaciones</label>
                    <input
                      value={horario.observaciones}
                      onChange={(event) => updateGrupoHorario(index, 'observaciones', event.target.value)}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="field align-end">
                    <label>&nbsp;</label>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => removeGrupoHorario(index)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={savingRecord}>
              {savingRecord ? 'Guardando…' : editingGrupoId ? 'Guardar cambios' : 'Registrar grupo'}
            </button>
            <button className="button button-secondary" type="button" onClick={resetGrupoForm}>
              Limpiar
            </button>
          </div>
        </form>
      </section>
    );
  }

  function renderInscripcionEditor() {
    const isEditing = editingInscripcionId !== null;

    return (
      <section className="dashboard-card form-section">
        <div className="dashboard-top" style={{ marginBottom: 16 }}>
          <div>
            <h3>{isEditing ? 'Editar inscripción' : 'Registrar inscripción'}</h3>
            <p>Asigna alumnos a grupos y ajusta su estatus académico.</p>
          </div>
          <div className="row">
            <button className="button button-secondary" type="button" onClick={resetInscripcionForm}>
              Nueva inscripción
            </button>
            {isEditing ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={handleInscripcionCancel}
                disabled={savingRecord}
              >
                Cancelar inscripción
              </button>
            ) : null}
          </div>
        </div>

        <form className="editor-grid" onSubmit={handleInscripcionSave}>
          <div className="field">
            <label htmlFor="inscripcion-grupo">Grupo</label>
            <select
              id="inscripcion-grupo"
              value={inscripcionForm.grupo_id}
              onChange={(event) => setInscripcionForm((current) => ({ ...current, grupo_id: event.target.value }))}
              required
              disabled={isEditing}
            >
              <option value="">Selecciona un grupo</option>
              {inscripcionLookups.grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {formatInscripcionGrupoOption(grupo)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="inscripcion-alumno">Alumno</label>
            <select
              id="inscripcion-alumno"
              value={inscripcionForm.alumno_id}
              onChange={(event) => setInscripcionForm((current) => ({ ...current, alumno_id: event.target.value }))}
              required
              disabled={isEditing}
            >
              <option value="">Selecciona un alumno</option>
              {inscripcionLookups.alumnos.map((alumno) => (
                <option key={alumno.id} value={alumno.id}>
                  {formatInscripcionAlumnoOption(alumno)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="inscripcion-fecha">Fecha de inscripción</label>
            <input
              id="inscripcion-fecha"
              type="datetime-local"
              value={inscripcionForm.fecha_inscripcion}
              onChange={(event) =>
                setInscripcionForm((current) => ({ ...current, fecha_inscripcion: event.target.value }))
              }
            />
          </div>

          <div className="field">
            <label htmlFor="inscripcion-estatus">Estatus</label>
            <select
              id="inscripcion-estatus"
              value={inscripcionForm.estatus}
              onChange={(event) =>
                setInscripcionForm((current) => ({
                  ...current,
                  estatus: event.target.value as InscripcionFormState['estatus'],
                }))
              }
            >
              <option value="inscrito">Inscrito</option>
              <option value="baja">Baja</option>
              <option value="acreditado">Acreditado</option>
              <option value="no_acreditado">No acreditado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="field field-span-2">
            <label htmlFor="inscripcion-observaciones">Observaciones</label>
            <textarea
              id="inscripcion-observaciones"
              value={inscripcionForm.observaciones}
              onChange={(event) =>
                setInscripcionForm((current) => ({ ...current, observaciones: event.target.value }))
              }
              rows={3}
              placeholder="Opcional"
            />
          </div>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={savingRecord}>
              {savingRecord ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar inscripción'}
            </button>
            <button className="button button-secondary" type="button" onClick={resetInscripcionForm}>
              Limpiar
            </button>
          </div>
        </form>
      </section>
    );
  }

  function renderCalificacionEditor() {
    const isEditing = editingCalificacionId !== null;
    const grupos = calificacionLookups.grupos;
    const selectedGrupoId = calificacionForm.grupo_id;
    const selectedGrupo = grupos.find((grupo) => grupo.id === selectedGrupoId) ?? null;
    const evaluaciones = calificacionLookups.evaluaciones.filter(
      (evaluacion) => !selectedGrupoId || evaluacion.grupo_id === selectedGrupoId,
    );
    const inscripciones = calificacionLookups.inscripciones.filter(
      (inscripcion) => !selectedGrupoId || inscripcion.grupo_id === selectedGrupoId,
    );

    return (
      <section className="dashboard-card form-section">
        <div className="dashboard-top" style={{ marginBottom: 16 }}>
          <div>
            <h3>{isEditing ? 'Editar calificación' : 'Capturar calificación'}</h3>
            <p>Relaciona una inscripción con su evaluación parcial o final.</p>
          </div>
          <div className="row">
            <button className="button button-secondary" type="button" onClick={resetCalificacionForm}>
              Nueva calificación
            </button>
            {isEditing ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={handleCalificacionDelete}
                disabled={savingRecord}
              >
                Eliminar
              </button>
            ) : null}
          </div>
        </div>

        <form className="editor-grid" onSubmit={handleCalificacionSave}>
          <div className="field">
            <label htmlFor="calificacion-grupo">Grupo</label>
            <select
              id="calificacion-grupo"
              value={calificacionForm.grupo_id}
              onChange={(event) =>
                setCalificacionForm((current) => ({
                  ...current,
                  grupo_id: event.target.value,
                  inscripcion_id: '',
                  evaluacion_id: '',
                }))
              }
              required
              disabled={isEditing}
            >
              <option value="">Selecciona un grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {formatCalificacionGrupoOption(grupo)}
                </option>
              ))}
            </select>
          </div>

          <div className="field field-span-2">
            <div className="dashboard-top" style={{ marginBottom: 8 }}>
              <div>
                <label>Asistente de captura</label>
                <p>
                  {selectedGrupo
                    ? `Captura para ${selectedGrupo.folio}. Elige una inscripción y su evaluación asociada.`
                    : 'Primero selecciona un grupo para ver sus alumnos inscritos y evaluaciones disponibles.'}
                </p>
              </div>
              {selectedGrupo ? (
                <div className="row">
                  <span className="badge">{inscripciones.length} inscripciones</span>
                  <span className="badge">{evaluaciones.length} evaluaciones</span>
                </div>
              ) : null}
            </div>

            {selectedGrupo ? (
              <div className="capture-guidance">
                <div className="capture-guidance-column">
                  <h4>Inscripciones del grupo</h4>
                  {inscripciones.length > 0 ? (
                    <div className="capture-item-list">
                      {inscripciones.map((inscripcion) => {
                        const alumno = `${inscripcion.alumno.persona.nombres} ${inscripcion.alumno.persona.apellido_paterno}`;
                        const isSelected = calificacionForm.inscripcion_id === inscripcion.id;
                        return (
                          <button
                            key={inscripcion.id}
                            type="button"
                            className={`capture-item ${isSelected ? 'selected' : ''}`}
                            onClick={() =>
                              setCalificacionForm((current) => ({
                                ...current,
                                inscripcion_id: inscripcion.id,
                              }))
                            }
                          >
                            <strong>{alumno}</strong>
                            <span>{inscripcion.estatus}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-helper">No hay inscripciones activas para este grupo.</div>
                  )}
                </div>

                <div className="capture-guidance-column">
                  <h4>Evaluaciones del grupo</h4>
                  {evaluaciones.length > 0 ? (
                    <div className="capture-item-list">
                      {evaluaciones.map((evaluacion) => {
                        const isSelected = calificacionForm.evaluacion_id === evaluacion.id;
                        return (
                          <button
                            key={evaluacion.id}
                            type="button"
                            className={`capture-item ${isSelected ? 'selected' : ''}`}
                            onClick={() =>
                              setCalificacionForm((current) => ({
                                ...current,
                                evaluacion_id: evaluacion.id,
                              }))
                            }
                          >
                            <strong>{evaluacion.tipo.toUpperCase()}</strong>
                            <span>{evaluacion.estatus}</span>
                            <small>{evaluacion.ponderacion}%</small>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-helper">No hay evaluaciones registradas para este grupo.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-helper">Selecciona un grupo para activar la captura guiada.</div>
            )}
          </div>

          <div className="field">
            <label htmlFor="calificacion-inscripcion">Inscripción</label>
            <select
              id="calificacion-inscripcion"
              value={calificacionForm.inscripcion_id}
              onChange={(event) =>
                setCalificacionForm((current) => ({ ...current, inscripcion_id: event.target.value }))
              }
              required
              disabled={!selectedGrupoId || isEditing}
            >
              <option value="">Selecciona una inscripción</option>
              {inscripciones.map((inscripcion) => (
                <option key={inscripcion.id} value={inscripcion.id}>
                  {formatCalificacionInscripcionOption(inscripcion)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="calificacion-evaluacion">Evaluación</label>
            <select
              id="calificacion-evaluacion"
              value={calificacionForm.evaluacion_id}
              onChange={(event) =>
                setCalificacionForm((current) => ({ ...current, evaluacion_id: event.target.value }))
              }
              required
              disabled={!selectedGrupoId || isEditing}
            >
              <option value="">Selecciona una evaluación</option>
              {evaluaciones.map((evaluacion) => (
                <option key={evaluacion.id} value={evaluacion.id}>
                  {formatCalificacionEvaluacionOption(evaluacion)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="calificacion-valor">Calificación</label>
            <input
              id="calificacion-valor"
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={calificacionForm.calificacion}
              onChange={(event) =>
                setCalificacionForm((current) => ({ ...current, calificacion: event.target.value }))
              }
              required
              placeholder="0.00 - 10.00"
            />
          </div>

          <div className="field field-span-2">
            <label htmlFor="calificacion-observaciones">Observaciones</label>
            <textarea
              id="calificacion-observaciones"
              value={calificacionForm.observaciones}
              onChange={(event) =>
                setCalificacionForm((current) => ({ ...current, observaciones: event.target.value }))
              }
              rows={3}
              placeholder="Opcional"
            />
          </div>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={savingRecord}>
              {savingRecord ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar calificación'}
            </button>
            <button className="button button-secondary" type="button" onClick={resetCalificacionForm}>
              Limpiar
            </button>
          </div>
        </form>
      </section>
    );
  }

  function renderAlumnoEditor() {
    return (
      <section className="dashboard-card form-section">
        <div className="dashboard-top" style={{ marginBottom: 16 }}>
          <div>
            <h3>{editingAlumnoId ? 'Editar alumno' : 'Registrar alumno'}</h3>
            <p>Alta y mantenimiento de alumnos internos y externos.</p>
          </div>
          <div className="row">
            <button className="button button-secondary" type="button" onClick={resetAlumnoForm}>
              Nuevo alumno
            </button>
            {editingAlumnoId ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={handleAlumnoDeactivate}
                disabled={savingRecord}
              >
                Desactivar
              </button>
            ) : null}
          </div>
        </div>

        <form className="editor-grid" onSubmit={handleAlumnoSave}>
          <div className="field">
            <label htmlFor="alumno-nombres">Nombres</label>
            <input
              id="alumno-nombres"
              value={alumnoForm.nombres}
              onChange={(event) => setAlumnoForm((current) => ({ ...current, nombres: event.target.value }))}
              placeholder="Nombre(s)"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="alumno-apellido-paterno">Apellido paterno</label>
            <input
              id="alumno-apellido-paterno"
              value={alumnoForm.apellido_paterno}
              onChange={(event) =>
                setAlumnoForm((current) => ({ ...current, apellido_paterno: event.target.value }))
              }
              placeholder="Apellido paterno"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="alumno-apellido-materno">Apellido materno</label>
            <input
              id="alumno-apellido-materno"
              value={alumnoForm.apellido_materno}
              onChange={(event) =>
                setAlumnoForm((current) => ({ ...current, apellido_materno: event.target.value }))
              }
              placeholder="Apellido materno"
            />
          </div>

          <div className="field">
            <label htmlFor="alumno-correo">Correo</label>
            <input
              id="alumno-correo"
              type="email"
              value={alumnoForm.correo}
              onChange={(event) => setAlumnoForm((current) => ({ ...current, correo: event.target.value }))}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="field">
            <label htmlFor="alumno-telefono">Teléfono</label>
            <input
              id="alumno-telefono"
              value={alumnoForm.telefono}
              onChange={(event) => setAlumnoForm((current) => ({ ...current, telefono: event.target.value }))}
              placeholder="Número de contacto"
            />
          </div>

          <div className="field">
            <label htmlFor="alumno-tipo">Tipo de alumno</label>
            <select
              id="alumno-tipo"
              value={alumnoForm.tipo_alumno}
              onChange={(event) =>
                setAlumnoForm((current) => ({
                  ...current,
                  tipo_alumno: event.target.value === 'externo' ? 'externo' : 'interno',
                }))
              }
            >
              <option value="interno">Interno</option>
              <option value="externo">Externo</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="alumno-codigo-origen">Código de origen</label>
            <input
              id="alumno-codigo-origen"
              value={alumnoForm.codigo_origen}
              onChange={(event) => setAlumnoForm((current) => ({ ...current, codigo_origen: event.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className="field field-span-2">
            <label htmlFor="alumno-escuela-origen">Escuela de origen</label>
            <input
              id="alumno-escuela-origen"
              value={alumnoForm.escuela_origen}
              onChange={(event) => setAlumnoForm((current) => ({ ...current, escuela_origen: event.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={savingRecord}>
              {savingRecord ? 'Guardando…' : editingAlumnoId ? 'Guardar cambios' : 'Registrar alumno'}
            </button>
            <button className="button button-secondary" type="button" onClick={resetAlumnoForm}>
              Limpiar
            </button>
          </div>
        </form>
      </section>
    );
  }

  function updateDocenteHabilitacion(
    index: number,
    field: keyof DocenteHabilitacionFormState,
    value: string | boolean,
  ) {
    setDocenteForm((current) => ({
      ...current,
      habilitaciones: current.habilitaciones.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addDocenteHabilitacion() {
    setDocenteForm((current) => ({
      ...current,
      habilitaciones: [
        ...current.habilitaciones,
        {
          idioma_id: '',
          nivel_maximo_id: '',
          subnivel_maximo_id: '',
          activo: true,
        },
      ],
    }));
  }

  function removeDocenteHabilitacion(index: number) {
    setDocenteForm((current) => {
      const next = current.habilitaciones.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        habilitaciones:
          next.length > 0
            ? next
            : [
                {
                  idioma_id: '',
                  nivel_maximo_id: '',
                  subnivel_maximo_id: '',
                  activo: true,
                },
              ],
      };
    });
  }

  function availableIdiomasForRow(index: number): CatalogOption[] {
    if (!availableIds) {
      return [];
    }

    const selectedOtherIds = new Set(
      docenteForm.habilitaciones
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item) => item.idioma_id)
        .filter((item) => item.trim() !== ''),
    );

    return availableIds.idiomas.filter((idioma) => !selectedOtherIds.has(idioma.id) || idioma.id === docenteForm.habilitaciones[index]?.idioma_id);
  }

  function renderDocenteEditor() {
    return (
      <section className="dashboard-card form-section">
        <div className="dashboard-top" style={{ marginBottom: 16 }}>
          <div>
            <h3>{editingDocenteId ? 'Editar docente' : 'Registrar docente'}</h3>
            <p>Captura de datos personales y habilitaciones por idioma, nivel y subnivel.</p>
          </div>
          <div className="row">
            <button className="button button-secondary" type="button" onClick={resetDocenteForm}>
              Nuevo docente
            </button>
            {editingDocenteId ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={handleDocenteDeactivate}
                disabled={savingRecord}
              >
                Desactivar
              </button>
            ) : null}
          </div>
        </div>

        <form className="editor-grid" onSubmit={handleDocenteSave}>
          <div className="field">
            <label htmlFor="docente-nombres">Nombres</label>
            <input
              id="docente-nombres"
              value={docenteForm.nombres}
              onChange={(event) => setDocenteForm((current) => ({ ...current, nombres: event.target.value }))}
              placeholder="Nombre(s)"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="docente-apellido-paterno">Apellido paterno</label>
            <input
              id="docente-apellido-paterno"
              value={docenteForm.apellido_paterno}
              onChange={(event) =>
                setDocenteForm((current) => ({ ...current, apellido_paterno: event.target.value }))
              }
              placeholder="Apellido paterno"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="docente-apellido-materno">Apellido materno</label>
            <input
              id="docente-apellido-materno"
              value={docenteForm.apellido_materno}
              onChange={(event) =>
                setDocenteForm((current) => ({ ...current, apellido_materno: event.target.value }))
              }
              placeholder="Apellido materno"
            />
          </div>

          <div className="field">
            <label htmlFor="docente-correo">Correo</label>
            <input
              id="docente-correo"
              type="email"
              value={docenteForm.correo}
              onChange={(event) => setDocenteForm((current) => ({ ...current, correo: event.target.value }))}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="field">
            <label htmlFor="docente-telefono">Teléfono</label>
            <input
              id="docente-telefono"
              value={docenteForm.telefono}
              onChange={(event) => setDocenteForm((current) => ({ ...current, telefono: event.target.value }))}
              placeholder="Número de contacto"
            />
          </div>

          <div className="field">
            <label htmlFor="docente-clave">Clave docente</label>
            <input
              id="docente-clave"
              value={docenteForm.clave_docente}
              onChange={(event) => setDocenteForm((current) => ({ ...current, clave_docente: event.target.value }))}
              placeholder="Clave interna"
              required
            />
          </div>

          <div className="field field-span-2">
            <div className="dashboard-top" style={{ marginBottom: 8 }}>
              <div>
                <label>Habilitaciones</label>
                <p>Define el idioma y el nivel máximo que cada docente puede impartir.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={addDocenteHabilitacion}>
                Agregar habilitación
              </button>
            </div>

            <div className="habilitaciones-list">
              {docenteForm.habilitaciones.map((item, index) => (
                <div className="habilitacion-row" key={`${index}-${item.idioma_id}-${item.nivel_maximo_id}`}>
                  <div className="field">
                    <label>Idioma</label>
                    <select
                      value={item.idioma_id}
                      onChange={(event) => updateDocenteHabilitacion(index, 'idioma_id', event.target.value)}
                    >
                      <option value="">Selecciona un idioma</option>
                      {availableIdiomasForRow(index).map((idioma) => (
                        <option key={idioma.id} value={idioma.id}>
                          {idioma.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Nivel máximo</label>
                    <select
                      value={item.nivel_maximo_id}
                      onChange={(event) => updateDocenteHabilitacion(index, 'nivel_maximo_id', event.target.value)}
                    >
                      <option value="">Selecciona un nivel</option>
                      {availableIds?.niveles.map((nivel) => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Subnivel máximo</label>
                    <select
                      value={item.subnivel_maximo_id}
                      onChange={(event) => updateDocenteHabilitacion(index, 'subnivel_maximo_id', event.target.value)}
                    >
                      <option value="">Selecciona un subnivel</option>
                      {availableIds?.subniveles.map((subnivel) => (
                        <option key={subnivel.id} value={subnivel.id}>
                          {subnivel.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Activo</label>
                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={item.activo}
                        onChange={(event) => updateDocenteHabilitacion(index, 'activo', event.target.checked)}
                      />
                      <span>Habilitación vigente</span>
                    </label>
                  </div>

                  <div className="field align-end">
                    <label>&nbsp;</label>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => removeDocenteHabilitacion(index)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={savingRecord}>
              {savingRecord ? 'Guardando…' : editingDocenteId ? 'Guardar cambios' : 'Registrar docente'}
            </button>
            <button className="button button-secondary" type="button" onClick={resetDocenteForm}>
              Limpiar
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (viewState === 'loading') {
    return (
      <div className="app-shell">
        <div className="card panel">
          <h2>Cargando Celex Grades…</h2>
          <p>Preparando la sesión y conectando con la API.</p>
        </div>
      </div>
    );
  }

  if (viewState === 'auth') {
    return (
      <div className="app-shell">
        <div className="card login-layout">
          <section className="hero">
            <div>
              <span className="eyebrow">Celex Grades</span>
              <h1>Gestión académica de idiomas, grupos y calificaciones.</h1>
              <p>
                Inicia sesión para administrar alumnos, docentes, bimestres, grupos, evaluaciones y calificaciones
                desde un solo lugar.
              </p>
            </div>

            <div className="hero-grid">
              <div className="hero-metric">
                <strong>4</strong>
                <span>roles base en el sistema</span>
              </div>
              <div className="hero-metric">
                <strong>3</strong>
                <span>idiomas iniciales listos para crecer</span>
              </div>
              <div className="hero-metric">
                <strong>2</strong>
                <span>evaluaciones por curso</span>
              </div>
              <div className="hero-metric">
                <strong>100%</strong>
                <span>histórico académico preservado</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Iniciar sesión</h2>
            <p>Usa tu usuario o correo y tu contraseña para entrar al panel.</p>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="identifier">Usuario o correo</label>
                <input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  placeholder="admin o correo@ejemplo.com"
                />
              </div>

              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                />
              </div>

              <div className="row" style={{ marginTop: 20 }}>
                <button className="button button-primary" type="submit" disabled={loadingLogin}>
                  {loadingLogin ? 'Ingresando…' : 'Entrar'}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={async () => {
                    try {
                      const catalogsResponse = await getCatalogs();
                      setCatalogs(catalogsResponse);
                      setMessage(
                        `Catálogos cargados: ${catalogsResponse.roles.length} roles, ${catalogsResponse.idiomas.length} idiomas.`,
                      );
                    } catch {
                      setError('No se pudieron cargar los catálogos.');
                    }
                  }}
                >
                  Ver catálogos
                </button>
              </div>
            </form>

            {error ? <div className="error-box">{error}</div> : null}
            {message ? <div className="success-box">{message}</div> : null}

            <div className="section" style={{ marginTop: 24 }}>
              <h3>Preparado para crecer</h3>
              <div className="row">
                {catalogSummary.map((item) => (
                  <span className="badge" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="card app-dashboard">
        <aside className="sidebar">
          <div>
            <span className="eyebrow">Celex Grades</span>
            <h2>{user?.persona.nombres}</h2>
            <p>{user?.username}</p>
            <div className="row" style={{ marginTop: 12 }}>
              {user?.roles.map((role) => (
                <span className="badge" key={role.codigo} title={roleDescriptions[role.codigo]}>
                  {role.nombre}
                </span>
              ))}
            </div>
          </div>

          <nav className="sidebar-nav">
            {moduleDefinitions.map((module) => (
              <button
                key={module.key}
                className={`sidebar-link ${module.key === activeModule ? 'active' : ''}`}
                onClick={() => setActiveModule(module.key)}
                type="button"
              >
                <strong>{module.label}</strong>
                <span>{module.description}</span>
              </button>
            ))}
          </nav>

          <div className="section">
            <button className="button button-secondary" onClick={logout} type="button">
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="dashboard">
          <div className="dashboard-top">
            <div>
              <span className="eyebrow">Panel operativo</span>
              <h2>{activeDefinition.label}</h2>
              <p>{moduleSummaries[activeModule]}</p>
            </div>

            <div className="row">
              <button className="button button-secondary" onClick={() => setActiveModule('alumnos')} type="button">
                Volver a alumnos
              </button>
              <button className="button button-secondary" onClick={logout} type="button">
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Total de registros</h3>
              <p>{moduleLoading ? 'Cargando…' : `${moduleTotal}`}</p>
            </div>
            <div className="dashboard-card">
              <h3>Acceso</h3>
              <p>{roleCodes.join(', ') || 'Sin roles'}</p>
            </div>
            <div className="dashboard-card">
              <h3>Catálogos</h3>
              <div className="row">
                {catalogSummary.map((item) => (
                  <span className="badge" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {supportsEditing
            ? activeModule === 'alumnos'
              ? renderAlumnoEditor()
              : activeModule === 'docentes'
                ? renderDocenteEditor()
                : activeModule === 'grupos'
                  ? renderGrupoEditor()
                  : activeModule === 'inscripciones'
                    ? renderInscripcionEditor()
                    : renderCalificacionEditor()
            : null}

          <section className="dashboard-card">
            <div className="dashboard-top" style={{ marginBottom: 16 }}>
              <div>
                <h3>Listado real desde la API</h3>
                <p>Los datos visibles aquí provienen de los endpoints protegidos del backend.</p>
              </div>
              <button
                className="button button-primary"
                type="button"
                onClick={() => setRefreshNonce((current) => current + 1)}
              >
                Refrescar
              </button>
            </div>

            {moduleError ? <div className="error-box">{moduleError}</div> : null}
            {moduleNotice ? <div className="success-box">{moduleNotice}</div> : null}

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.label}>{column.label}</th>
                    ))}
                    {supportsEditing ? <th>Acciones</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {moduleLoading ? (
                    <tr>
                      <td colSpan={columns.length + (supportsEditing ? 1 : 0)}>Cargando registros…</td>
                    </tr>
                  ) : moduleRows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + (supportsEditing ? 1 : 0)}>Sin registros para mostrar.</td>
                    </tr>
                  ) : (
                    moduleRows.map((row) => {
                      const rowId = getComparableId(row.id ?? JSON.stringify(row));

                      return (
                        <tr key={rowId}>
                          {columns.map((column) => (
                            <td key={column.label}>{column.render(row)}</td>
                          ))}
                          {supportsEditing ? (
                            <td className="table-actions">
                              <div className="row">
                                <button
                                  className="button button-secondary button-small"
                                  type="button"
                                  onClick={() => {
                                    if (activeModule === 'alumnos') {
                                      selectAlumno(row as unknown as AlumnoRecord);
                                    } else if (activeModule === 'docentes') {
                                      selectDocente(row as unknown as DocenteRecord);
                                    } else if (activeModule === 'grupos') {
                                      selectGrupo(row as unknown as GrupoRecord);
                                    } else if (activeModule === 'inscripciones') {
                                      selectInscripcion(row as unknown as InscripcionRecord);
                                    } else {
                                      selectCalificacion(row as unknown as CalificacionRecord);
                                    }
                                  }}
                                >
                                  Editar
                                </button>
                                {activeModule === 'grupos' || activeModule === 'inscripciones' ? (
                                  <button
                                        className="button button-secondary button-small"
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            setSavingRecord(true);
                                            setModuleError(null);
                                            setModuleNotice(null);
                                            if (activeModule === 'grupos') {
                                              await cancelGrupo(getComparableId(row.id));
                                              setModuleNotice('Grupo cancelado correctamente.');
                                              if (editingGrupoId === getComparableId(row.id)) {
                                                resetGrupoForm();
                                              }
                                            } else {
                                              await cancelInscripcion(getComparableId(row.id));
                                              setModuleNotice('Inscripción cancelada correctamente.');
                                              if (editingInscripcionId === getComparableId(row.id)) {
                                                resetInscripcionForm();
                                              }
                                            }
                                            setRefreshNonce((current) => current + 1);
                                          } catch (err) {
                                            setModuleError(
                                              err instanceof Error
                                                ? err.message
                                                : activeModule === 'grupos'
                                                  ? 'No se pudo cancelar el grupo.'
                                                  : 'No se pudo cancelar la inscripción.',
                                            );
                                          } finally {
                                            setSavingRecord(false);
                                          }
                                        }}
                                  >
                                      {activeModule === 'grupos' ? 'Cancelar' : 'Cancelar'}
                                  </button>
                                ) : activeModule === 'calificaciones' ? (
                                  <button
                                  className="button button-secondary button-small"
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      setSavingRecord(true);
                                      setModuleError(null);
                                      setModuleNotice(null);
                                      await deleteCalificacion(getComparableId(row.id));
                                      setModuleNotice('Calificación eliminada correctamente.');
                                      if (editingCalificacionId === getComparableId(row.id)) {
                                        resetCalificacionForm();
                                      }
                                      setRefreshNonce((current) => current + 1);
                                    } catch (err) {
                                      setModuleError(
                                        err instanceof Error ? err.message : 'No se pudo eliminar la calificación.',
                                      );
                                    } finally {
                                      setSavingRecord(false);
                                    }
                                  }}
                                  >
                                  Eliminar
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
