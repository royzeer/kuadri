const { query } = require('../config/db');

// Cada meta viene con el conteo de pasos para calcular el progreso.
const SELECT_META = `
  SELECT m.id, m.titulo, m.descripcion, m.fecha_objetivo, m.cumplida_en, m.categoria_id, m.creado_en,
         c.nombre AS categoria_nombre, c.color AS categoria_color,
         COUNT(p.id) AS total_pasos,
         COALESCE(SUM(p.hecho = TRUE), 0) AS pasos_hechos
    FROM metas m
    LEFT JOIN categorias c ON c.id = m.categoria_id
    LEFT JOIN meta_pasos p ON p.meta_id = m.id`;

function aNumeros(m) {
  return { ...m, total_pasos: Number(m.total_pasos), pasos_hechos: Number(m.pasos_hechos) };
}

async function listar(usuarioId) {
  const filas = await query(
    `${SELECT_META}
      WHERE m.usuario_id = ?
      GROUP BY m.id
      ORDER BY m.cumplida_en IS NOT NULL, m.fecha_objetivo IS NULL, m.fecha_objetivo, m.id DESC`,
    [usuarioId],
  );
  return filas.map(aNumeros);
}

async function buscar(usuarioId, id) {
  const filas = await query(`${SELECT_META} WHERE m.id = ? AND m.usuario_id = ? GROUP BY m.id`, [id, usuarioId]);
  return filas[0] ? aNumeros(filas[0]) : null;
}

// Pasos de varias metas a la vez (para no hacer una consulta por meta).
async function pasosDe(metaIds) {
  if (metaIds.length === 0) return [];
  return query(
    `SELECT id, meta_id, texto, hecho FROM meta_pasos
      WHERE meta_id IN (${metaIds.map(() => '?').join(', ')})
      ORDER BY id`,
    metaIds,
  );
}

async function crear(usuarioId, datos) {
  const r = await query(
    `INSERT INTO metas (usuario_id, categoria_id, titulo, descripcion, fecha_objetivo)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, datos.categoriaId, datos.titulo, datos.descripcion, datos.fechaObjetivo],
  );
  return r.insertId;
}

async function actualizar(usuarioId, id, datos) {
  const r = await query(
    `UPDATE metas SET categoria_id = ?, titulo = ?, descripcion = ?, fecha_objetivo = ?
      WHERE id = ? AND usuario_id = ?`,
    [datos.categoriaId, datos.titulo, datos.descripcion, datos.fechaObjetivo, id, usuarioId],
  );
  return r.affectedRows > 0;
}

async function marcarCumplida(usuarioId, id, fecha) {
  await query('UPDATE metas SET cumplida_en = ? WHERE id = ? AND usuario_id = ?', [fecha, id, usuarioId]);
}

async function eliminar(usuarioId, id) {
  const r = await query('DELETE FROM metas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

// ----- Pasos (siempre se valida antes que la meta sea del usuario) -----
async function crearPaso(metaId, texto) {
  const r = await query('INSERT INTO meta_pasos (meta_id, texto) VALUES (?, ?)', [metaId, texto]);
  return r.insertId;
}

async function cambiarPaso(metaId, pasoId, hecho) {
  const r = await query('UPDATE meta_pasos SET hecho = ? WHERE id = ? AND meta_id = ?', [hecho, pasoId, metaId]);
  return r.affectedRows > 0;
}

async function eliminarPaso(metaId, pasoId) {
  const r = await query('DELETE FROM meta_pasos WHERE id = ? AND meta_id = ?', [pasoId, metaId]);
  return r.affectedRows > 0;
}

module.exports = {
  listar,
  buscar,
  pasosDe,
  crear,
  actualizar,
  marcarCumplida,
  eliminar,
  crearPaso,
  cambiarPaso,
  eliminarPaso,
};
