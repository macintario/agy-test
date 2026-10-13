-- CreateTable
CREATE TABLE `roles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `roles_codigo_key`(`codigo`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `idiomas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `idiomas_codigo_key`(`codigo`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `niveles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `orden` INT NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `niveles_codigo_key`(`codigo`),
  UNIQUE INDEX `niveles_orden_key`(`orden`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subniveles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `orden` INT NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `subniveles_codigo_key`(`codigo`),
  UNIQUE INDEX `subniveles_orden_key`(`orden`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `turnos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `turnos_codigo_key`(`codigo`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `nombres` VARCHAR(120) NOT NULL,
  `apellido_paterno` VARCHAR(120) NOT NULL,
  `apellido_materno` VARCHAR(120) NULL,
  `correo` VARCHAR(190) NULL,
  `telefono` VARCHAR(30) NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `personas_correo_key`(`correo`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `usuarios` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `persona_id` BIGINT NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `usuarios_persona_id_key`(`persona_id`),
  UNIQUE INDEX `usuarios_username_key`(`username`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `usuario_roles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `usuario_id` BIGINT NOT NULL,
  `rol_id` BIGINT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `usuario_roles_usuario_id_rol_id_key`(`usuario_id`, `rol_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `alumnos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `persona_id` BIGINT NOT NULL,
  `tipo_alumno` ENUM('interno', 'externo') NOT NULL,
  `codigo_origen` VARCHAR(60) NULL,
  `escuela_origen` VARCHAR(255) NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `alumnos_persona_id_key`(`persona_id`),
  UNIQUE INDEX `alumnos_codigo_origen_key`(`codigo_origen`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `docentes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `persona_id` BIGINT NOT NULL,
  `clave_docente` VARCHAR(60) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `docentes_persona_id_key`(`persona_id`),
  UNIQUE INDEX `docentes_clave_docente_key`(`clave_docente`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supervisor_idiomas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `usuario_id` BIGINT NOT NULL,
  `idioma_id` BIGINT NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `supervisor_idiomas_usuario_id_idioma_id_key`(`usuario_id`, `idioma_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `docente_idioma_habilitaciones` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `docente_id` BIGINT NOT NULL,
  `idioma_id` BIGINT NOT NULL,
  `nivel_maximo_id` BIGINT NOT NULL,
  `subnivel_maximo_id` BIGINT NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `docente_idioma_habilitaciones_docente_id_idioma_id_key`(`docente_id`, `idioma_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bimestres` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `anio` INT NOT NULL,
  `bimestre_numero` INT NOT NULL,
  `codigo` VARCHAR(5) NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `estatus` ENUM('planeado', 'abierto', 'cerrado', 'cancelado') NOT NULL DEFAULT 'planeado',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `bimestres_codigo_key`(`codigo`),
  UNIQUE INDEX `bimestres_anio_bimestre_numero_key`(`anio`, `bimestre_numero`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grupos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `bimestre_id` BIGINT NOT NULL,
  `idioma_id` BIGINT NOT NULL,
  `nivel_id` BIGINT NOT NULL,
  `subnivel_id` BIGINT NOT NULL,
  `turno_id` BIGINT NOT NULL,
  `folio` VARCHAR(30) NOT NULL,
  `cupo_maximo` INT NOT NULL DEFAULT 0,
  `estado` ENUM('programado', 'abierto', 'cerrado', 'cancelado') NOT NULL DEFAULT 'programado',
  `observaciones` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `grupos_folio_key`(`folio`),
  INDEX `grupos_bimestre_id_idioma_id_nivel_id_subnivel_id_turno_id_idx`(`bimestre_id`, `idioma_id`, `nivel_id`, `subnivel_id`, `turno_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grupo_horarios` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `grupo_id` BIGINT NOT NULL,
  `dia_semana` INT NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `observaciones` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `grupo_horarios_grupo_id_dia_semana_hora_inicio_hora_fin_key`(`grupo_id`, `dia_semana`, `hora_inicio`, `hora_fin`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grupo_docente_historial` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `grupo_id` BIGINT NOT NULL,
  `docente_id` BIGINT NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NULL,
  `es_principal` BOOLEAN NOT NULL DEFAULT true,
  `observaciones` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `grupo_docente_historial_grupo_id_idx`(`grupo_id`),
  INDEX `grupo_docente_historial_docente_id_idx`(`docente_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inscripciones` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `grupo_id` BIGINT NOT NULL,
  `alumno_id` BIGINT NOT NULL,
  `fecha_inscripcion` DATE NOT NULL,
  `estatus` ENUM('inscrito', 'baja', 'acreditado', 'no_acreditado', 'cancelado') NOT NULL DEFAULT 'inscrito',
  `calificacion_final` DECIMAL(4,2) NULL,
  `aprobado` BOOLEAN NULL,
  `fecha_cierre` DATETIME(3) NULL,
  `observaciones` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `inscripciones_grupo_id_alumno_id_key`(`grupo_id`, `alumno_id`),
  UNIQUE INDEX `inscripciones_id_grupo_id_key`(`id`, `grupo_id`),
  INDEX `inscripciones_alumno_id_idx`(`alumno_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluaciones` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `grupo_id` BIGINT NOT NULL,
  `tipo` ENUM('parcial', 'final') NOT NULL,
  `fecha_programada` DATE NULL,
  `ponderacion` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `estatus` ENUM('programada', 'capturada', 'cerrada', 'cancelada') NOT NULL DEFAULT 'programada',
  `observaciones` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `evaluaciones_grupo_id_tipo_key`(`grupo_id`, `tipo`),
  UNIQUE INDEX `evaluaciones_id_grupo_id_key`(`id`, `grupo_id`),
  INDEX `evaluaciones_grupo_id_idx`(`grupo_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `calificaciones` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `grupo_id` BIGINT NOT NULL,
  `inscripcion_id` BIGINT NOT NULL,
  `evaluacion_id` BIGINT NOT NULL,
  `calificacion` DECIMAL(4,2) NOT NULL,
  `capturada_por_usuario_id` BIGINT NOT NULL,
  `capturada_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `observaciones` TEXT NULL,
  UNIQUE INDEX `calificaciones_inscripcion_id_evaluacion_id_key`(`inscripcion_id`, `evaluacion_id`),
  INDEX `calificaciones_grupo_id_idx`(`grupo_id`),
  INDEX `calificaciones_inscripcion_id_idx`(`inscripcion_id`),
  INDEX `calificaciones_evaluacion_id_idx`(`evaluacion_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `calificaciones_historial` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `calificacion_id` BIGINT NOT NULL,
  `valor_anterior` DECIMAL(4,2) NOT NULL,
  `valor_nuevo` DECIMAL(4,2) NOT NULL,
  `modificado_por_usuario_id` BIGINT NOT NULL,
  `motivo` VARCHAR(255) NULL,
  `modificado_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `calificaciones_historial_calificacion_id_idx`(`calificacion_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `clases_impartidas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `grupo_docente_historial_id` BIGINT NOT NULL,
  `fecha_clase` DATE NOT NULL,
  `hora_inicio` TIME NULL,
  `hora_fin` TIME NULL,
  `tema` VARCHAR(255) NULL,
  `observaciones` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `clases_impartidas_grupo_docente_historial_id_idx`(`grupo_docente_historial_id`),
  INDEX `clases_impartidas_fecha_clase_idx`(`fecha_clase`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `configuracion_academica` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `clave` VARCHAR(100) NOT NULL,
  `valor` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `configuracion_academica_clave_key`(`clave`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_persona_id_fkey` FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `usuario_roles`
  ADD CONSTRAINT `usuario_roles_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_roles_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `alumnos`
  ADD CONSTRAINT `alumnos_persona_id_fkey` FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `docentes`
  ADD CONSTRAINT `docentes_persona_id_fkey` FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `supervisor_idiomas`
  ADD CONSTRAINT `supervisor_idiomas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `supervisor_idiomas_idioma_id_fkey` FOREIGN KEY (`idioma_id`) REFERENCES `idiomas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `docente_idioma_habilitaciones`
  ADD CONSTRAINT `docente_idioma_habilitaciones_docente_id_fkey` FOREIGN KEY (`docente_id`) REFERENCES `docentes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `docente_idioma_habilitaciones_idioma_id_fkey` FOREIGN KEY (`idioma_id`) REFERENCES `idiomas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `docente_idioma_habilitaciones_nivel_maximo_id_fkey` FOREIGN KEY (`nivel_maximo_id`) REFERENCES `niveles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `docente_idioma_habilitaciones_subnivel_maximo_id_fkey` FOREIGN KEY (`subnivel_maximo_id`) REFERENCES `subniveles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `grupos`
  ADD CONSTRAINT `grupos_bimestre_id_fkey` FOREIGN KEY (`bimestre_id`) REFERENCES `bimestres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `grupos_idioma_id_fkey` FOREIGN KEY (`idioma_id`) REFERENCES `idiomas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `grupos_nivel_id_fkey` FOREIGN KEY (`nivel_id`) REFERENCES `niveles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `grupos_subnivel_id_fkey` FOREIGN KEY (`subnivel_id`) REFERENCES `subniveles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `grupos_turno_id_fkey` FOREIGN KEY (`turno_id`) REFERENCES `turnos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `grupo_horarios`
  ADD CONSTRAINT `grupo_horarios_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `grupo_docente_historial`
  ADD CONSTRAINT `grupo_docente_historial_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `grupo_docente_historial_docente_id_fkey` FOREIGN KEY (`docente_id`) REFERENCES `docentes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `inscripciones`
  ADD CONSTRAINT `inscripciones_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `inscripciones_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumnos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `evaluaciones`
  ADD CONSTRAINT `evaluaciones_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `calificaciones`
  ADD CONSTRAINT `calificaciones_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `calificaciones_inscripcion_id_fkey` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `calificaciones_evaluacion_id_fkey` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `calificaciones_capturada_por_usuario_id_fkey` FOREIGN KEY (`capturada_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `calificaciones_historial`
  ADD CONSTRAINT `calificaciones_historial_calificacion_id_fkey` FOREIGN KEY (`calificacion_id`) REFERENCES `calificaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `calificaciones_historial_modificado_por_usuario_id_fkey` FOREIGN KEY (`modificado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `clases_impartidas`
  ADD CONSTRAINT `clases_impartidas_grupo_docente_historial_id_fkey` FOREIGN KEY (`grupo_docente_historial_id`) REFERENCES `grupo_docente_historial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `roles` (`codigo`, `nombre`, `descripcion`) VALUES
('ADMINISTRADOR', 'Administrador', 'Administración total del sistema'),
('SUPERVISOR', 'Supervisor', 'Supervisión académica por idioma'),
('CONTROL_ESCOLAR', 'Control Escolar', 'Gestión de alumnos, grupos y calificaciones'),
('DOCENTE', 'Docente', 'Imparte clases y consulta sus grupos');

INSERT INTO `idiomas` (`codigo`, `nombre`) VALUES
('EN', 'Inglés'),
('FR', 'Francés'),
('DE', 'Alemán');

INSERT INTO `niveles` (`codigo`, `nombre`, `orden`) VALUES
('BASICO', 'Básico', 1),
('INTERMEDIO', 'Intermedio', 2),
('AVANZADO', 'Avanzado', 3);

INSERT INTO `subniveles` (`codigo`, `nombre`, `orden`) VALUES
('I', 'I', 1),
('II', 'II', 2),
('III', 'III', 3),
('IV', 'IV', 4),
('V', 'V', 5);

INSERT INTO `turnos` (`codigo`, `nombre`) VALUES
('MATUTINO', 'Matutino'),
('VESPERTINO', 'Vespertino');

INSERT INTO `configuracion_academica` (`clave`, `valor`, `descripcion`) VALUES
('calificacion_minima_aprobatoria', '8.00', 'Calificación mínima para aprobar'),
('ponderacion_parcial', '50.00', 'Peso del examen parcial'),
('ponderacion_final', '50.00', 'Peso del examen final');
