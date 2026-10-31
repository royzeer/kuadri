-- Kuadri - Migración Fase 3: estudio creativo y registro de ocio.
-- Agrega tablas nuevas sin tocar ni borrar los datos que ya existen.
-- Se puede correr más de una vez sin problema (usa IF NOT EXISTS e INSERT IGNORE).

-- Paletas de colores. Los colores se guardan juntos: '#B1CB5A,#141414,#D6E6A1'
CREATE TABLE IF NOT EXISTS paletas (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT         NOT NULL,
  nombre     VARCHAR(60) NOT NULL,
  colores    VARCHAR(60) NOT NULL,
  creado_en  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_paletas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_paletas_usuario (usuario_id)
);

-- Tipografías de Google Fonts que le gustan al usuario
CREATE TABLE IF NOT EXISTS tipografias (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT          NOT NULL,
  nombre     VARCHAR(60)  NOT NULL,
  uso        ENUM('titulos','texto','ambos') NOT NULL DEFAULT 'ambos',
  muestra    VARCHAR(150) NULL,
  creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tipografias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_tipografias_usuario (usuario_id)
);

-- Plantillas: una paleta con una fuente para títulos y otra para texto
CREATE TABLE IF NOT EXISTS plantillas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id        INT          NOT NULL,
  nombre            VARCHAR(60)  NOT NULL,
  paleta_id         INT          NULL,
  fuente_titulos_id INT          NULL,
  fuente_texto_id   INT          NULL,
  nota              VARCHAR(300) NULL,
  creado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plantillas_usuario FOREIGN KEY (usuario_id)        REFERENCES usuarios(id)    ON DELETE CASCADE,
  CONSTRAINT fk_plantillas_paleta  FOREIGN KEY (paleta_id)         REFERENCES paletas(id)     ON DELETE SET NULL,
  CONSTRAINT fk_plantillas_titulos FOREIGN KEY (fuente_titulos_id) REFERENCES tipografias(id) ON DELETE SET NULL,
  CONSTRAINT fk_plantillas_texto   FOREIGN KEY (fuente_texto_id)   REFERENCES tipografias(id) ON DELETE SET NULL,
  INDEX idx_plantillas_usuario (usuario_id)
);

-- Registro de ocio: videojuegos, series, películas, libros, música...
CREATE TABLE IF NOT EXISTS ocio (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT          NOT NULL,
  titulo       VARCHAR(120) NOT NULL,
  tipo         ENUM('videojuego','serie','pelicula','libro','musica','otro') NOT NULL DEFAULT 'otro',
  estado       ENUM('pendiente','en_curso','terminado','abandonado') NOT NULL DEFAULT 'pendiente',
  calificacion TINYINT      NULL,
  plataforma   VARCHAR(60)  NULL,
  comentario   TEXT         NULL,
  terminado_en DATETIME     NULL,
  creado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ocio_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT chk_calificacion CHECK (calificacion IS NULL OR calificacion BETWEEN 1 AND 5),
  INDEX idx_ocio_usuario (usuario_id, estado)
);

-- Ratos de ocio ("hoy jugué 45 minutos"), para ver el equilibrio con el estudio
CREATE TABLE IF NOT EXISTS ocio_ratos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  ocio_id    INT      NOT NULL,
  minutos    SMALLINT NOT NULL,
  fecha      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ratos_ocio FOREIGN KEY (ocio_id) REFERENCES ocio(id) ON DELETE CASCADE,
  CONSTRAINT chk_minutos_rato CHECK (minutos BETWEEN 1 AND 720),
  INDEX idx_ratos_fecha (ocio_id, fecha)
);

-- Logros nuevos
INSERT IGNORE INTO logros (codigo, nombre, descripcion, icono) VALUES
  ('CREATIVO',    'Creativo',    'Guardaste tu primera paleta de colores',    'pincel'),
  ('EQUILIBRADO', 'Equilibrado', 'Terminaste algo de tu lista de ocio',      'control');
