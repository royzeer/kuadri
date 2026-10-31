// Consultas del estudio creativo: paletas, tipografías y plantillas.
const { query } = require('../config/db');

// Los colores se guardan en una sola columna separados por coma.
const aLista = (texto) => (texto ? texto.split(',') : []);
const conColores = (p) => ({ ...p, colores: aLista(p.colores) });

// ----- Paletas -----
async function listarPaletas(usuarioId) {
  const filas = await query(
    'SELECT id, nombre, colores, creado_en FROM paletas WHERE usuario_id = ? ORDER BY id DESC',
    [usuarioId],
  );
  return filas.map(conColores);
}

async function buscarPaleta(usuarioId, id) {
  const [fila] = await query('SELECT id, nombre, colores, creado_en FROM paletas WHERE id = ? AND usuario_id = ?', [
    id,
    usuarioId,
  ]);
  return fila ? conColores(fila) : null;
}

async function crearPaleta(usuarioId, { nombre, colores }) {
  const r = await query('INSERT INTO paletas (usuario_id, nombre, colores) VALUES (?, ?, ?)', [
    usuarioId,
    nombre,
    colores.join(','),
  ]);
  return r.insertId;
}

async function actualizarPaleta(usuarioId, id, { nombre, colores }) {
  const r = await query('UPDATE paletas SET nombre = ?, colores = ? WHERE id = ? AND usuario_id = ?', [
    nombre,
    colores.join(','),
    id,
    usuarioId,
  ]);
  return r.affectedRows > 0;
}

async function eliminarPaleta(usuarioId, id) {
  const r = await query('DELETE FROM paletas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

// ----- Tipografías -----
async function listarTipografias(usuarioId) {
  return query(
    'SELECT id, nombre, uso, muestra, creado_en FROM tipografias WHERE usuario_id = ? ORDER BY nombre, id',
    [usuarioId],
  );
}

async function buscarTipografia(usuarioId, id) {
  const [fila] = await query(
    'SELECT id, nombre, uso, muestra, creado_en FROM tipografias WHERE id = ? AND usuario_id = ?',
    [id, usuarioId],
  );
  return fila || null;
}

async function crearTipografia(usuarioId, { nombre, uso, muestra }) {
  const r = await query('INSERT INTO tipografias (usuario_id, nombre, uso, muestra) VALUES (?, ?, ?, ?)', [
    usuarioId,
    nombre,
    uso,
    muestra,
  ]);
  return r.insertId;
}

async function actualizarTipografia(usuarioId, id, { nombre, uso, muestra }) {
  const r = await query('UPDATE tipografias SET nombre = ?, uso = ?, muestra = ? WHERE id = ? AND usuario_id = ?', [
    nombre,
    uso,
    muestra,
    id,
    usuarioId,
  ]);
  return r.affectedRows > 0;
}

async function eliminarTipografia(usuarioId, id) {
  const r = await query('DELETE FROM tipografias WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

// ----- Plantillas (vienen con los colores y los nombres de las fuentes) -----
const SELECT_PLANTILLA = `
  SELECT pl.id, pl.nombre, pl.nota, pl.paleta_id, pl.fuente_titulos_id, pl.fuente_texto_id, pl.creado_en,
         pa.nombre AS paleta_nombre, pa.colores,
         ft.nombre AS fuente_titulos, fx.nombre AS fuente_texto
    FROM plantillas pl
    LEFT JOIN paletas pa     ON pa.id = pl.paleta_id
    LEFT JOIN tipografias ft ON ft.id = pl.fuente_titulos_id
    LEFT JOIN tipografias fx ON fx.id = pl.fuente_texto_id`;

async function listarPlantillas(usuarioId) {
  const filas = await query(`${SELECT_PLANTILLA} WHERE pl.usuario_id = ? ORDER BY pl.id DESC`, [usuarioId]);
  return filas.map(conColores);
}

async function buscarPlantilla(usuarioId, id) {
  const [fila] = await query(`${SELECT_PLANTILLA} WHERE pl.id = ? AND pl.usuario_id = ?`, [id, usuarioId]);
  return fila ? conColores(fila) : null;
}

async function crearPlantilla(usuarioId, d) {
  const r = await query(
    `INSERT INTO plantillas (usuario_id, nombre, paleta_id, fuente_titulos_id, fuente_texto_id, nota)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, d.nombre, d.paletaId, d.fuenteTitulosId, d.fuenteTextoId, d.nota],
  );
  return r.insertId;
}

async function actualizarPlantilla(usuarioId, id, d) {
  const r = await query(
    `UPDATE plantillas SET nombre = ?, paleta_id = ?, fuente_titulos_id = ?, fuente_texto_id = ?, nota = ?
      WHERE id = ? AND usuario_id = ?`,
    [d.nombre, d.paletaId, d.fuenteTitulosId, d.fuenteTextoId, d.nota, id, usuarioId],
  );
  return r.affectedRows > 0;
}

async function eliminarPlantilla(usuarioId, id) {
  const r = await query('DELETE FROM plantillas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

module.exports = {
  listarPaletas,
  buscarPaleta,
  crearPaleta,
  actualizarPaleta,
  eliminarPaleta,
  listarTipografias,
  buscarTipografia,
  crearTipografia,
  actualizarTipografia,
  eliminarTipografia,
  listarPlantillas,
  buscarPlantilla,
  crearPlantilla,
  actualizarPlantilla,
  eliminarPlantilla,
};
