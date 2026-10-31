-- Kuadri - Migración Fase 2: metas personales y lista de deseos.
-- Agrega tablas nuevas sin tocar ni borrar los datos que ya existen.
-- Se puede correr más de una vez sin problema (usa IF NOT EXISTS e INSERT IGNORE).

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
