const { query } = require('../config/db');

const SELECT_TAREA = `
  SELECT t.id, t.titulo, t.descripcion, t.prioridad, t.fecha_limite,
         t.completada, t.completada_en, t.categoria_id, t.creado_en,
         c.nombre AS categoria_nombre, c.color AS categoria_color
    FROM tareas t
    LEFT JOIN categorias c ON c.id = t.categoria_id`;

// Construye el WHERE de forma segura: solo se agregan condiciones conocidas
// y todos los valores van como parámetros.
async function listar(usuarioId, filtros = {}) {
  const condiciones = ['t.usuario_id = ?'];
  const params = [usuarioId];

  if (filtros.estado === 'pendientes') condiciones.push('t.completada = FALSE');
  if (filtros.estado === 'completadas') condiciones.push('t.completada = TRUE');
  if (filtros.categoriaId) {
    condiciones.push('t.categoria_id = ?');
    params.push(filtros.categoriaId);
  }
  if (filtros.prioridad) {
    condiciones.push('t.prioridad = ?');
    params.push(filtros.prioridad);
  }
  if (filtros.desde) {
    condiciones.push('t.fecha_limite >= ?');
    params.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push('t.fecha_limite <= ?');
    params.push(filtros.hasta);
  }

  return query(
    `${SELECT_TAREA}
      WHERE ${condiciones.join(' AND ')}
      ORDER BY t.completada, t.fecha_limite IS NULL, t.fecha_limite,
               FIELD(t.prioridad, 'alta', 'media', 'baja'), t.id DESC`,
    params,
  );
}

async function buscar(usuarioId, id) {
  const filas = await query(`${SELECT_TAREA} WHERE t.id = ? AND t.usuario_id = ?`, [id, usuarioId]);
  return filas[0] || null;
}

async function crear(usuarioId, datos) {
  const r = await query(
    `INSERT INTO tareas (usuario_id, categoria_id, titulo, descripcion, prioridad, fecha_limite)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, datos.categoriaId, datos.titulo, datos.descripcion, datos.prioridad, datos.fechaLimite],
  );
  return r.insertId;
}

// Si cambia la fecha límite, el recordatorio se vuelve a programar.
async function actualizar(usuarioId, id, datos) {
  const r = await query(
    `UPDATE tareas
        SET categoria_id = ?, titulo = ?, descripcion = ?, prioridad = ?,
            recordatorio_enviado = IF(fecha_limite <=> ?, recordatorio_enviado, FALSE),
            fecha_limite = ?
      WHERE id = ? AND usuario_id = ?`,
    [
      datos.categoriaId,
      datos.titulo,
      datos.descripcion,
      datos.prioridad,
      datos.fechaLimite,
      datos.fechaLimite,
      id,
      usuarioId,
    ],
  );
  return r.affectedRows > 0;
}

async function cambiarEstado(usuarioId, id, completada, fecha) {
  const r = await query(
    'UPDATE tareas SET completada = ?, completada_en = ? WHERE id = ? AND usuario_id = ?',
    [completada, completada ? fecha : null, id, usuarioId],
  );
  return r.affectedRows > 0;
}

async function eliminar(usuarioId, id) {
  const r = await query('DELETE FROM tareas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

// Tareas pendientes cuya fecha límite cae entre `desde` y `hasta` y aún no tienen recordatorio.
async function pendientesPorRecordar(desde, hasta) {
  return query(
    `SELECT t.id, t.titulo, t.fecha_limite,
            u.id AS usuario_id, u.nombre, u.correo, u.avisos_correo
       FROM tareas t
       JOIN usuarios u ON u.id = t.usuario_id
      WHERE t.completada = FALSE
        AND t.recordatorio_enviado = FALSE
        AND t.fecha_limite BETWEEN ? AND ?`,
    [desde, hasta],
  );
}

async function marcarRecordada(id) {
  await query('UPDATE tareas SET recordatorio_enviado = TRUE WHERE id = ?', [id]);
}

module.exports = {
  listar,
  buscar,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  pendientesPorRecordar,
  marcarRecordada,
};
