const { query } = require('../config/db');

// Nunca se devuelve el enlace (ni cifrado) al cliente: solo el dominio para reconocerlo.
const SELECT_CAMPUS = `
  SELECT cc.id, cc.nombre, cc.dominio, cc.categoria_id, cc.ultima_sincronizacion, cc.ultimo_error,
         c.nombre AS categoria_nombre, c.color AS categoria_color,
         (SELECT COUNT(*) FROM campus_eventos e WHERE e.campus_id = cc.id AND e.tarea_id IS NOT NULL) AS importadas
    FROM campus_conexiones cc
    LEFT JOIN categorias c ON c.id = cc.categoria_id`;

const aNumero = (f) => (f ? { ...f, importadas: Number(f.importadas) } : null);

async function listar(usuarioId) {
  const filas = await query(`${SELECT_CAMPUS} WHERE cc.usuario_id = ? ORDER BY cc.creado_en, cc.id`, [usuarioId]);
  return filas.map(aNumero);
}

async function buscar(usuarioId, id) {
  const filas = await query(`${SELECT_CAMPUS} WHERE cc.id = ? AND cc.usuario_id = ?`, [id, usuarioId]);
  return aNumero(filas[0]);
}

// Incluye el enlace cifrado: solo para uso interno al sincronizar.
async function paraSincronizar(usuarioId = null) {
  return query(
    `SELECT id, usuario_id, nombre, enlace_cifrado, categoria_id, ultima_sincronizacion
       FROM campus_conexiones
      ${usuarioId ? 'WHERE usuario_id = ?' : ''}
      ORDER BY id`,
    usuarioId ? [usuarioId] : [],
  );
}

async function crear(usuarioId, { nombre, enlaceCifrado, dominio, categoriaId }) {
  const r = await query(
    `INSERT INTO campus_conexiones (usuario_id, nombre, enlace_cifrado, dominio, categoria_id)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, nombre, enlaceCifrado, dominio, categoriaId],
  );
  return r.insertId;
}

// Si llega un enlace nuevo se reemplaza; si no, se conserva el anterior.
async function actualizar(usuarioId, id, { nombre, enlaceCifrado, dominio, categoriaId }) {
  const r = await query(
    `UPDATE campus_conexiones
        SET nombre = ?, categoria_id = ?,
            enlace_cifrado = COALESCE(?, enlace_cifrado), dominio = COALESCE(?, dominio)
      WHERE id = ? AND usuario_id = ?`,
    [nombre, categoriaId, enlaceCifrado || null, dominio || null, id, usuarioId],
  );
  return r.affectedRows > 0;
}

async function eliminar(usuarioId, id) {
  const r = await query('DELETE FROM campus_conexiones WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

async function registrarResultado(id, fecha, error) {
  await query('UPDATE campus_conexiones SET ultima_sincronizacion = ?, ultimo_error = ? WHERE id = ?', [
    fecha,
    error ? String(error).slice(0, 255) : null,
    id,
  ]);
}

// Reserva el evento: devuelve true si es nuevo. La clave única evita duplicados
// aunque dos sincronizaciones corran al mismo tiempo.
async function reservarEvento(campusId, uid) {
  const r = await query('INSERT IGNORE INTO campus_eventos (campus_id, uid) VALUES (?, ?)', [campusId, uid]);
  return r.affectedRows > 0;
}

async function asignarTarea(campusId, uid, tareaId) {
  await query('UPDATE campus_eventos SET tarea_id = ? WHERE campus_id = ? AND uid = ?', [tareaId, campusId, uid]);
}

async function liberarEvento(campusId, uid) {
  await query('DELETE FROM campus_eventos WHERE campus_id = ? AND uid = ? AND tarea_id IS NULL', [campusId, uid]);
}

// Si el profesor cambia la fecha en el campus, se actualiza la tarea (solo si sigue pendiente).
async function actualizarFechaTarea(campusId, uid, fechaLimite) {
  const r = await query(
    `UPDATE tareas t
       JOIN campus_eventos e ON e.tarea_id = t.id
        SET t.recordatorio_enviado = IF(t.fecha_limite <=> ?, t.recordatorio_enviado, FALSE),
            t.fecha_limite = ?
      WHERE e.campus_id = ? AND e.uid = ? AND t.completada = FALSE AND NOT (t.fecha_limite <=> ?)`,
    [fechaLimite, fechaLimite, campusId, uid, fechaLimite],
  );
  return r.affectedRows > 0;
}

module.exports = {
  listar,
  buscar,
  paraSincronizar,
  crear,
  actualizar,
  eliminar,
  registrarResultado,
  reservarEvento,
  asignarTarea,
  liberarEvento,
  actualizarFechaTarea,
};
