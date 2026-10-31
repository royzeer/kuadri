const { query } = require('../config/db');

// Cada deseo viene con su último precio, el más bajo y cuántas veces se anotó.
const SELECT_DESEO = `
  SELECT d.id, d.nombre, d.enlace, d.imagen, d.precio_objetivo, d.prioridad, d.comprado_en, d.creado_en,
         (SELECT p.precio FROM precios_deseo p WHERE p.deseo_id = d.id
           ORDER BY p.registrado_en DESC, p.id DESC LIMIT 1) AS precio_actual,
         (SELECT MIN(p.precio) FROM precios_deseo p WHERE p.deseo_id = d.id) AS precio_minimo,
         (SELECT COUNT(*) FROM precios_deseo p WHERE p.deseo_id = d.id) AS total_precios
    FROM deseos d`;

// DECIMAL llega como texto desde MySQL; se convierte a número para el JSON.
const aNumero = (v) => (v === null || v === undefined ? null : Number(v));
function aNumeros(d) {
  return {
    ...d,
    precio_objetivo: aNumero(d.precio_objetivo),
    precio_actual: aNumero(d.precio_actual),
    precio_minimo: aNumero(d.precio_minimo),
    total_precios: Number(d.total_precios),
  };
}

async function listar(usuarioId) {
  const filas = await query(
    `${SELECT_DESEO}
      WHERE d.usuario_id = ?
      ORDER BY d.comprado_en IS NOT NULL, FIELD(d.prioridad, 'alta', 'media', 'baja'), d.id DESC`,
    [usuarioId],
  );
  return filas.map(aNumeros);
}

async function buscar(usuarioId, id) {
  const filas = await query(`${SELECT_DESEO} WHERE d.id = ? AND d.usuario_id = ?`, [id, usuarioId]);
  return filas[0] ? aNumeros(filas[0]) : null;
}

async function crear(usuarioId, datos) {
  const r = await query(
    `INSERT INTO deseos (usuario_id, nombre, enlace, imagen, precio_objetivo, prioridad)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, datos.nombre, datos.enlace, datos.imagen, datos.precioObjetivo, datos.prioridad],
  );
  return r.insertId;
}

// Si cambia el precio objetivo, el aviso se puede volver a enviar.
async function actualizar(usuarioId, id, datos) {
  const r = await query(
    `UPDATE deseos
        SET nombre = ?, enlace = ?, imagen = ?, prioridad = ?,
            aviso_enviado = IF(precio_objetivo <=> ?, aviso_enviado, FALSE),
            precio_objetivo = ?
      WHERE id = ? AND usuario_id = ?`,
    [datos.nombre, datos.enlace, datos.imagen, datos.prioridad, datos.precioObjetivo, datos.precioObjetivo, id, usuarioId],
  );
  return r.affectedRows > 0;
}

async function marcarComprado(usuarioId, id, fecha) {
  await query('UPDATE deseos SET comprado_en = ? WHERE id = ? AND usuario_id = ?', [fecha, id, usuarioId]);
}

async function eliminar(usuarioId, id) {
  const r = await query('DELETE FROM deseos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

async function estadoAviso(id) {
  const [fila] = await query('SELECT aviso_enviado FROM deseos WHERE id = ?', [id]);
  return fila.aviso_enviado;
}

async function cambiarAviso(id, enviado) {
  await query('UPDATE deseos SET aviso_enviado = ? WHERE id = ?', [enviado, id]);
}

// ----- Historial de precios -----
async function historial(deseoId) {
  const filas = await query(
    `SELECT id, precio, tienda, registrado_en FROM precios_deseo
      WHERE deseo_id = ? ORDER BY registrado_en, id`,
    [deseoId],
  );
  return filas.map((p) => ({ ...p, precio: Number(p.precio) }));
}

async function registrarPrecio(deseoId, { precio, tienda, fecha }) {
  const r = await query('INSERT INTO precios_deseo (deseo_id, precio, tienda, registrado_en) VALUES (?, ?, ?, ?)', [
    deseoId,
    precio,
    tienda,
    fecha,
  ]);
  return r.insertId;
}

async function eliminarPrecio(deseoId, precioId) {
  const r = await query('DELETE FROM precios_deseo WHERE id = ? AND deseo_id = ?', [precioId, deseoId]);
  return r.affectedRows > 0;
}

module.exports = {
  listar,
  buscar,
  crear,
  actualizar,
  marcarComprado,
  eliminar,
  estadoAviso,
  cambiarAviso,
  historial,
  registrarPrecio,
  eliminarPrecio,
};
