const { query } = require('../config/db');

const CAMPOS_PUBLICOS = 'id, nombre, correo, avisos_correo, creado_en';

async function buscarPorCorreo(correo) {
  const filas = await query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
  return filas[0] || null;
}

async function buscarPorId(id) {
  const filas = await query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`, [id]);
  return filas[0] || null;
}

async function crear({ nombre, correo, contrasenaHash }) {
  const resultado = await query(
    'INSERT INTO usuarios (nombre, correo, contrasena_hash) VALUES (?, ?, ?)',
    [nombre, correo, contrasenaHash],
  );
  return resultado.insertId;
}

async function actualizarPerfil(id, { nombre, avisosCorreo }) {
  await query('UPDATE usuarios SET nombre = ?, avisos_correo = ? WHERE id = ?', [
    nombre,
    avisosCorreo,
    id,
  ]);
}

module.exports = { buscarPorCorreo, buscarPorId, crear, actualizarPerfil };
