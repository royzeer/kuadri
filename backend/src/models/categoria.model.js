const { query } = require('../config/db');

// Lista las categorías del usuario con el número de tareas pendientes y totales.
async function listar(usuarioId) {
  const filas = await query(
    `SELECT c.id, c.nombre, c.color, c.icono,
            COUNT(t.id) AS total_tareas,
            COALESCE(SUM(t.completada = FALSE), 0) AS pendientes
       FROM categorias c
       LEFT JOIN tareas t ON t.categoria_id = c.id
      WHERE c.usuario_id = ?
      GROUP BY c.id
      ORDER BY c.creado_en, c.id`,
    [usuarioId],
  );
  // SUM devuelve texto en MySQL; se convierte a número
  return filas.map((f) => ({ ...f, total_tareas: Number(f.total_tareas), pendientes: Number(f.pendientes) }));
}

async function buscar(usuarioId, id) {
  const filas = await query(
    'SELECT id, nombre, color, icono FROM categorias WHERE id = ? AND usuario_id = ?',
    [id, usuarioId],
  );
  return filas[0] || null;
}

async function crear(usuarioId, { nombre, color, icono }) {
  const r = await query(
    'INSERT INTO categorias (usuario_id, nombre, color, icono) VALUES (?, ?, ?, ?)',
    [usuarioId, nombre, color, icono],
  );
  return r.insertId;
}

async function actualizar(usuarioId, id, { nombre, color, icono }) {
  const r = await query(
    'UPDATE categorias SET nombre = ?, color = ?, icono = ? WHERE id = ? AND usuario_id = ?',
    [nombre, color, icono, id, usuarioId],
  );
  return r.affectedRows > 0;
}

async function eliminar(usuarioId, id) {
  const r = await query('DELETE FROM categorias WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

module.exports = { listar, buscar, crear, actualizar, eliminar };
