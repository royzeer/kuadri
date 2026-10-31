-- Kuadri - Migración: conectar campus virtuales (Moodle, Zajuna, Brightspace...).
-- Cada usuario guarda el enlace de calendario de su campus (cifrado) y Kuadri trae
-- sus actividades pendientes como tareas. No toca ni borra los datos que ya existen.
-- Se puede correr más de una vez sin problema (usa IF NOT EXISTS).

-- Campus conectados por cada usuario. El enlace se guarda cifrado, nunca en texto plano.
CREATE TABLE IF NOT EXISTS campus_conexiones (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id            INT          NOT NULL,
  nombre                VARCHAR(40)  NOT NULL,
  enlace_cifrado        TEXT         NOT NULL,
  dominio               VARCHAR(120) NOT NULL,
  categoria_id          INT          NULL,
  ultima_sincronizacion DATETIME     NULL,
  ultimo_error          VARCHAR(255) NULL,
  creado_en             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_campus_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)   ON DELETE CASCADE,
  CONSTRAINT fk_campus_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  CONSTRAINT uq_campus_nombre UNIQUE (usuario_id, nombre)
);

-- Actividades del campus que ya se trajeron, para no repetirlas.
-- Si el usuario borra la tarea, el registro queda (tarea_id NULL) y no se vuelve a traer.
CREATE TABLE IF NOT EXISTS campus_eventos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT          NOT NULL,
  uid       VARCHAR(255) NOT NULL,
  tarea_id  INT          NULL,
  creado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventos_campus FOREIGN KEY (campus_id) REFERENCES campus_conexiones(id) ON DELETE CASCADE,
  CONSTRAINT fk_eventos_tarea  FOREIGN KEY (tarea_id)  REFERENCES tareas(id)            ON DELETE SET NULL,
  CONSTRAINT uq_evento UNIQUE (campus_id, uid)
);
