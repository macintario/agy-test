export type AuthRoleCode = 'ADMINISTRADOR' | 'SUPERVISOR' | 'CONTROL_ESCOLAR' | 'DOCENTE';

export interface CatalogOption {
  id: string;
  codigo: string;
  nombre: string;
  orden?: number;
  activo?: boolean;
}

export interface CatalogsResponse {
  roles: CatalogOption[];
  idiomas: CatalogOption[];
  niveles: CatalogOption[];
  subniveles: CatalogOption[];
  turnos: CatalogOption[];
}

export interface BimestreRecord {
  id: string;
  anio: number;
  bimestre_numero: number;
  codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: 'planeado' | 'abierto' | 'cerrado' | 'cancelado';
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  id: string;
  username: string;
  persona: {
    id: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    correo: string | null;
    telefono: string | null;
  };
  roles: Array<{
    codigo: AuthRoleCode;
    nombre: string;
  }>;
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface AlumnoRecord {
  id: string;
  persona_id: string;
  tipo_alumno: 'interno' | 'externo';
  codigo_origen: string | null;
  escuela_origen: string | null;
  activo: boolean;
  persona: {
    id: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    correo: string | null;
    telefono: string | null;
    activo: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface DocenteHabilitacionRecord {
  id: string;
  idioma_id: string;
  nivel_maximo_id: string;
  subnivel_maximo_id: string;
  activo: boolean;
  idioma: CatalogOption;
  nivel_maximo: CatalogOption;
  subnivel_maximo: CatalogOption;
}

export interface DocenteRecord {
  id: string;
  persona_id: string;
  clave_docente: string;
  activo: boolean;
  persona: {
    id: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    correo: string | null;
    telefono: string | null;
    activo: boolean;
  };
  habilitaciones: DocenteHabilitacionRecord[];
  created_at: string;
  updated_at: string;
}

export interface CreateAlumnoInput {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  correo?: string | null;
  telefono?: string | null;
  tipo_alumno: 'interno' | 'externo';
  codigo_origen?: string | null;
  escuela_origen?: string | null;
}

export interface UpdateAlumnoInput extends Partial<CreateAlumnoInput> {}

export interface DocenteHabilitacionInput {
  idioma_id: string;
  nivel_maximo_id: string;
  subnivel_maximo_id: string;
  activo?: boolean;
}

export interface CreateDocenteInput {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  correo?: string | null;
  telefono?: string | null;
  clave_docente: string;
  habilitaciones?: DocenteHabilitacionInput[];
}

export interface UpdateDocenteInput extends Partial<CreateDocenteInput> {}

export interface GrupoHorarioInput {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  observaciones?: string | null;
}

export interface GrupoHorarioRecord extends GrupoHorarioInput {
  id: string;
}

export interface GrupoDocenteHistorialRecord {
  id: string;
  docente_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_principal: boolean;
  observaciones: string | null;
  docente: DocenteRecord;
}

export interface GrupoRecord {
  id: string;
  bimestre_id: string;
  idioma_id: string;
  nivel_id: string;
  subnivel_id: string;
  turno_id: string;
  folio: string;
  cupo_maximo: number;
  estado: 'programado' | 'abierto' | 'cerrado' | 'cancelado';
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  bimestre: BimestreRecord;
  idioma: CatalogOption;
  nivel: CatalogOption;
  subnivel: CatalogOption;
  turno: CatalogOption;
  horarios: GrupoHorarioRecord[];
  docente_historial: GrupoDocenteHistorialRecord[];
  docente_actual: DocenteRecord | null;
}

export interface CreateGrupoInput {
  bimestre_id: string;
  idioma_id: string;
  nivel_id: string;
  subnivel_id: string;
  turno_id: string;
  folio?: string;
  cupo_maximo?: number;
  estado?: 'programado' | 'abierto' | 'cerrado' | 'cancelado';
  observaciones?: string | null;
  horarios: GrupoHorarioInput[];
  docente_id?: string | null;
  fecha_inicio_docente?: string | null;
}

export interface UpdateGrupoInput {
  bimestre_id?: string;
  idioma_id?: string;
  nivel_id?: string;
  subnivel_id?: string;
  turno_id?: string;
  folio?: string;
  cupo_maximo?: number;
  estado?: 'programado' | 'abierto' | 'cerrado' | 'cancelado';
  observaciones?: string | null;
  horarios?: GrupoHorarioInput[];
  docente_id?: string | null;
  fecha_inicio_docente?: string | null;
}

export interface InscripcionRecord {
  id: string;
  grupo_id: string;
  alumno_id: string;
  fecha_inscripcion: string;
  estatus: 'inscrito' | 'baja' | 'acreditado' | 'no_acreditado' | 'cancelado';
  calificacion_final: string | null;
  aprobado: boolean | null;
  fecha_cierre: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  alumno: {
    id: string;
    tipo_alumno: string;
    codigo_origen: string | null;
    escuela_origen: string | null;
    activo: boolean;
    persona: {
      id: string;
      nombres: string;
      apellido_paterno: string;
      apellido_materno: string | null;
      correo: string | null;
      telefono: string | null;
    };
  };
  grupo: {
    id: string;
    folio: string;
    estado: string;
    bimestre: {
      id: string;
      codigo: string;
    };
    idioma: CatalogOption;
    nivel: CatalogOption;
    subnivel: CatalogOption;
  };
}

export interface CreateInscripcionInput {
  grupo_id: string;
  alumno_id: string;
  fecha_inscripcion?: string;
  estatus?: 'inscrito' | 'baja' | 'acreditado' | 'no_acreditado' | 'cancelado';
  observaciones?: string | null;
}

export interface UpdateInscripcionInput {
  fecha_inscripcion?: string;
  estatus?: 'inscrito' | 'baja' | 'acreditado' | 'no_acreditado' | 'cancelado';
  observaciones?: string | null;
}

export interface EvaluacionRecord {
  id: string;
  grupo_id: string;
  tipo: 'parcial' | 'final';
  fecha_programada: string | null;
  ponderacion: string;
  estatus: 'programada' | 'capturada' | 'cerrada' | 'cancelada';
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  grupo: {
    id: string;
    folio: string;
  };
}

export interface CalificacionRecord {
  id: string;
  grupo_id: string;
  inscripcion_id: string;
  evaluacion_id: string;
  calificacion: string;
  capturada_por_usuario_id: string;
  capturada_at: string;
  updated_at: string;
  observaciones: string | null;
  evaluacion: {
    id: string;
    tipo: 'parcial' | 'final';
    ponderacion: string;
    estatus: 'programada' | 'capturada' | 'cerrada' | 'cancelada';
  };
  inscripcion: {
    id: string;
    alumno: {
      id: string;
      codigo_origen: string | null;
      persona: {
        id: string;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string | null;
      };
    };
    grupo: {
      id: string;
      folio: string;
      bimestre: {
        id: string;
        codigo: string;
      };
    };
  };
}

export interface CreateCalificacionInput {
  grupo_id: string;
  inscripcion_id: string;
  evaluacion_id: string;
  calificacion: number;
  observaciones?: string | null;
}

export interface UpdateCalificacionInput {
  calificacion?: number;
  observaciones?: string | null;
}
