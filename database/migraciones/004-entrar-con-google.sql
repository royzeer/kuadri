-- Kuadri - Migración: entrar con Google.
-- Agrega google_id a los usuarios y permite cuentas sin contraseña (las creadas con Google).
-- No toca ni borra los datos que ya existen. Se puede correr más de una vez sin problema:
-- MySQL 8 no tiene "ADD COLUMN IF NOT EXISTS", por eso primero se revisa si la columna existe.

SET @existe := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'google_id'
);
SET @sql := IF(
  @existe = 0,
  'ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(64) NULL UNIQUE AFTER contrasena_hash',
  'SELECT 1'
);
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;

-- Las cuentas creadas con Google no tienen contraseña.
ALTER TABLE usuarios MODIFY contrasena_hash VARCHAR(255) NULL;
