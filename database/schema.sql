-- Kuadri - Esquema de base de datos (Fases 1 y 2)
-- Motor: MySQL 8 / MariaDB 10.6+

DROP DATABASE IF EXISTS kuadri;
CREATE DATABASE kuadri CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kuadri;

-- Usuarios registrados
CREATE TABLE usuarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(80)  NOT NULL,
  correo          VARCHAR(120) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  avisos_correo   BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Categorías de cada usuario (Universidad, SENA, Personal...)
CREATE TABLE categorias (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT         NOT NULL,
  nombre     VARCHAR(40) NOT NULL,
  color      CHAR(7)     NOT NULL DEFAULT '#3359FF',
  icono      VARCHAR(30) NOT NULL DEFAULT 'carpeta',
  creado_en  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_categorias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uq_categoria_nombre UNIQUE (usuario_id, nombre)
);

-- Tareas y entregas
CREATE TABLE tareas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id          INT          NOT NULL,
  categoria_id        INT          NULL,
  titulo              VARCHAR(150) NOT NULL,
  descripcion         TEXT         NULL,
  prioridad           ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
  fecha_limite        DATETIME     NULL,
  completada          BOOLEAN      NOT NULL DEFAULT FALSE,
  completada_en       DATETIME     NULL,
  recordatorio_enviado BOOLEAN     NOT NULL DEFAULT FALSE,
  creado_en           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tareas_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)   ON DELETE CASCADE,
  CONSTRAINT fk_tareas_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  INDEX idx_tareas_usuario_fecha (usuario_id, fecha_limite),
  INDEX idx_tareas_recordatorio (completada, recordatorio_enviado, fecha_limite)
);

-- Sesiones del temporizador de enfoque
CREATE TABLE sesiones_enfoque (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT      NOT NULL,
  tarea_id     INT      NULL,
  categoria_id INT      NULL,
  minutos      SMALLINT NOT NULL,
  terminada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sesiones_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)   ON DELETE CASCADE,
  CONSTRAINT fk_sesiones_tarea     FOREIGN KEY (tarea_id)     REFERENCES tareas(id)     ON DELETE SET NULL,
  CONSTRAINT fk_sesiones_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  CONSTRAINT chk_minutos CHECK (minutos BETWEEN 1 AND 180),
  INDEX idx_sesiones_usuario_fecha (usuario_id, terminada_en)
);

-- Notificaciones dentro de la app
CREATE TABLE notificaciones (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT          NOT NULL,
  tipo       ENUM('recordatorio','logro','sistema') NOT NULL,
  mensaje    VARCHAR(255) NOT NULL,
  leida      BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_notificaciones_usuario (usuario_id, leida)
);

-- Catálogo de logros
CREATE TABLE logros (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(30)  NOT NULL UNIQUE,
  nombre      VARCHAR(50)  NOT NULL,
  descripcion VARCHAR(150) NOT NULL,
  icono       VARCHAR(30)  NOT NULL
);

-- Logros obtenidos por cada usuario
CREATE TABLE usuario_logros (
  usuario_id   INT      NOT NULL,
  logro_id     INT      NOT NULL,
  obtenido_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, logro_id),
  CONSTRAINT fk_ul_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_ul_logro   FOREIGN KEY (logro_id)   REFERENCES logros(id)   ON DELETE CASCADE
);

-- Vista: días con actividad por usuario (base para rachas y estadísticas)
CREATE VIEW v_dias_activos AS
  SELECT usuario_id, DATE(completada_en) AS dia FROM tareas WHERE completada = TRUE AND completada_en IS NOT NULL
  UNION
  SELECT usuario_id, DATE(terminada_en) AS dia FROM sesiones_enfoque;

-- Catálogo inicial de logros
INSERT INTO logros (codigo, nombre, descripcion, icono) VALUES
  ('PRIMER_PASO',  'Primer paso',  'Completaste tu primera tarea',              'bandera'),
  ('RACHA_3',      'Constante',    'Mantuviste una racha de 3 días',            'llama'),
  ('RACHA_7',      'Imparable',    'Mantuviste una racha de 7 días',            'rayo'),
  ('TAREAS_10',    'Productivo',   'Completaste 10 tareas',                     'check'),
  ('ENFOQUE_300',  'Concentrado',  'Acumulaste 5 horas de enfoque',             'reloj'),
  ('MADRUGADOR',   'Madrugador',   'Completaste una tarea antes de las 8:00 a. m.', 'sol');

-- ===== Fase 2 (igual a database/migraciones/001-fase-2-metas-deseos.sql) =====
-- Metas personales (aprender inglés, ahorrar para un portátil...)
CREATE TABLE IF NOT EXISTS metas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT          NOT NULL,
  categoria_id   INT          NULL,
  titulo         VARCHAR(120) NOT NULL,
  descripcion    TEXT         NULL,
  fecha_objetivo DATE         NULL,
  cumplida_en    DATETIME     NULL,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_metas_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)   ON DELETE CASCADE,
  CONSTRAINT fk_metas_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  INDEX idx_metas_usuario (usuario_id, cumplida_en)
);

-- Pasos de cada meta: el progreso se calcula con los pasos hechos
CREATE TABLE IF NOT EXISTS meta_pasos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  meta_id   INT          NOT NULL,
  texto     VARCHAR(150) NOT NULL,
  hecho     BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pasos_meta FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE CASCADE
);

-- Lista de deseos
CREATE TABLE IF NOT EXISTS deseos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT           NOT NULL,
  nombre          VARCHAR(120)  NOT NULL,
  enlace          VARCHAR(500)  NULL,
  imagen          VARCHAR(500)  NULL,
  precio_objetivo DECIMAL(12,2) NULL,
  prioridad       ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
  aviso_enviado   BOOLEAN       NOT NULL DEFAULT FALSE,
  comprado_en     DATETIME      NULL,
  creado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_deseos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT chk_precio_objetivo CHECK (precio_objetivo IS NULL OR precio_objetivo > 0),
  INDEX idx_deseos_usuario (usuario_id, comprado_en)
);

-- Historial de precios que el usuario anota a mano
CREATE TABLE IF NOT EXISTS precios_deseo (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  deseo_id      INT           NOT NULL,
  precio        DECIMAL(12,2) NOT NULL,
  tienda        VARCHAR(60)   NULL,
  registrado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_precios_deseo FOREIGN KEY (deseo_id) REFERENCES deseos(id) ON DELETE CASCADE,
  CONSTRAINT chk_precio CHECK (precio > 0),
  INDEX idx_precios_deseo_fecha (deseo_id, registrado_en)
);

-- Logros nuevos
INSERT IGNORE INTO logros (codigo, nombre, descripcion, icono) VALUES
  ('META_1',    'Soñador',     'Cumpliste tu primera meta',                 'trofeo'),
  ('PACIENTE',  'Paciente',    'Un deseo llegó a tu precio objetivo',       'etiqueta');
