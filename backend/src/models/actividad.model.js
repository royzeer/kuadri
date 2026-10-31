// Consultas de sesiones de enfoque, notificaciones, logros y estadísticas.
const { query } = require('../config/db');

async function crearSesion(usuarioId, { minutos, tareaId, categoriaId, fecha }) {
  const r = await query(
    `INSERT INTO sesiones_enfoque (usuario_id, tarea_id, categoria_id, minutos, terminada_en)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, tareaId, categoriaId, minutos, fecha],
  );
  return r.insertId;
}

// Días distintos con actividad (vista v_dias_activos), del más reciente al más antiguo.
async function diasActivos(usuarioId) {
  const filas = await query(
    'SELECT dia FROM v_dias_activos WHERE usuario_id = ? ORDER BY dia DESC',
    [usuarioId],
  );
  return filas.map((f) => f.dia);
}

async function minutosPorDia(usuarioId, desde) {
  return query(
    `SELECT DATE(terminada_en) AS dia, SUM(minutos) AS minutos
       FROM sesiones_enfoque
      WHERE usuario_id = ? AND terminada_en >= ?
      GROUP BY DATE(terminada_en)`,
    [usuarioId, desde],
  );
}

async function tareasPorDia(usuarioId, desde) {
  return query(
    `SELECT DATE(completada_en) AS dia, COUNT(*) AS tareas
       FROM tareas
      WHERE usuario_id = ? AND completada = TRUE AND completada_en >= ?
      GROUP BY DATE(completada_en)`,
    [usuarioId, desde],
  );
}

async function totales(usuarioId) {
  const [fila] = await query(
    `SELECT
       (SELECT COUNT(*) FROM tareas WHERE usuario_id = ? AND completada = TRUE)  AS tareas_completadas,
       (SELECT COUNT(*) FROM tareas WHERE usuario_id = ? AND completada = FALSE) AS tareas_pendientes,
       (SELECT COALESCE(SUM(minutos), 0) FROM sesiones_enfoque WHERE usuario_id = ?) AS minutos_enfoque,
       (SELECT COUNT(*) FROM tareas
          WHERE usuario_id = ? AND completada = TRUE AND HOUR(completada_en) < 8) AS tareas_madrugada,
       (SELECT COUNT(*) FROM metas WHERE usuario_id = ? AND cumplida_en IS NOT NULL) AS metas_cumplidas,
       (SELECT COUNT(DISTINCT d.id) FROM deseos d
          JOIN precios_deseo p ON p.deseo_id = d.id
         WHERE d.usuario_id = ? AND p.precio <= d.precio_objetivo) AS deseos_en_objetivo`,
    [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId],
  );
  return {
    tareasCompletadas: Number(fila.tareas_completadas),
    tareasPendientes: Number(fila.tareas_pendientes),
    minutosEnfoque: Number(fila.minutos_enfoque),
    tareasMadrugada: Number(fila.tareas_madrugada),
    metasCumplidas: Number(fila.metas_cumplidas),
    deseosEnObjetivo: Number(fila.deseos_en_objetivo),
  };
}

// ----- Notificaciones -----
async function crearNotificacion(usuarioId, tipo, mensaje) {
  await query('INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, ?, ?)', [
    usuarioId,
    tipo,
    mensaje,
  ]);
}

async function listarNotificaciones(usuarioId) {
  return query(
    `SELECT id, tipo, mensaje, leida, creado_en
       FROM notificaciones WHERE usuario_id = ?
      ORDER BY creado_en DESC, id DESC LIMIT 50`,
    [usuarioId],
  );
}

async function leerTodas(usuarioId) {
  await query('UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ? AND leida = FALSE', [
    usuarioId,
  ]);
}

// ----- Logros -----
async function listarLogros(usuarioId) {
  return query(
    `SELECT l.id, l.codigo, l.nombre, l.descripcion, l.icono, ul.obtenido_en
       FROM logros l
       LEFT JOIN usuario_logros ul ON ul.logro_id = l.id AND ul.usuario_id = ?
      ORDER BY l.id`,
    [usuarioId],
  );
}

// Inserta el logro si el usuario no lo tenía. Devuelve true si es nuevo.
async function otorgarLogro(usuarioId, codigo) {
  const r = await query(
    `INSERT IGNORE INTO usuario_logros (usuario_id, logro_id)
     SELECT ?, id FROM logros WHERE codigo = ?`,
    [usuarioId, codigo],
  );
  return r.affectedRows > 0;
}

module.exports = {
  crearSesion,
  diasActivos,
  minutosPorDia,
  tareasPorDia,
  totales,
  crearNotificacion,
  listarNotificaciones,
  leerTodas,
  listarLogros,
  otorgarLogro,
};
