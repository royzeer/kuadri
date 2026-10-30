const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { pool } = require('../config/db');
const usuarios = require('../models/usuario.model');
const { AppError } = require('../utils/respuesta');
const { CORREO_REGEX, texto, lanzarSiHayErrores } = require('../utils/validar');

// Categorías que se crean automáticamente al registrarse (RF03)
const CATEGORIAS_INICIALES = [
  { nombre: 'Universidad', color: '#3359FF', icono: 'libro' },
  { nombre: 'SENA', color: '#46D9A0', icono: 'codigo' },
  { nombre: 'Personal', color: '#FF7438', icono: 'corazon' },
];

function firmarToken(usuarioId) {
  return jwt.sign({ id: usuarioId }, env.jwt.secreto, { expiresIn: env.jwt.expira });
}

async function registrar(datos) {
  const nombre = texto(datos.nombre);
  const correo = texto(datos.correo).toLowerCase();
  const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';

  const errores = {};
  if (nombre.length < 2 || nombre.length > 80) errores.nombre = 'Escribe un nombre de 2 a 80 caracteres';
  if (!CORREO_REGEX.test(correo)) errores.correo = 'Escribe un correo válido';
  if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener mínimo 8 caracteres';
  lanzarSiHayErrores(errores);

  if (await usuarios.buscarPorCorreo(correo)) {
    throw new AppError('Ya existe una cuenta con ese correo', 409, { correo: 'Correo ya registrado' });
  }

  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  // Usuario y categorías iniciales se guardan en una sola transacción:
  // o se guarda todo, o no se guarda nada.
  const conexion = await pool.getConnection();
  let usuarioId;
  try {
    await conexion.beginTransaction();
    const [r] = await conexion.execute(
      'INSERT INTO usuarios (nombre, correo, contrasena_hash) VALUES (?, ?, ?)',
      [nombre, correo, contrasenaHash],
    );
    usuarioId = r.insertId;
    for (const c of CATEGORIAS_INICIALES) {
      await conexion.execute(
        'INSERT INTO categorias (usuario_id, nombre, color, icono) VALUES (?, ?, ?, ?)',
        [usuarioId, c.nombre, c.color, c.icono],
      );
    }
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  const usuario = await usuarios.buscarPorId(usuarioId);
  return { usuario, token: firmarToken(usuarioId) };
}

async function iniciarSesion(datos) {
  const correo = texto(datos.correo).toLowerCase();
  const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';
  if (!correo || !contrasena) throw new AppError('Escribe tu correo y tu contraseña', 422);

  const encontrado = await usuarios.buscarPorCorreo(correo);
  // Mismo mensaje en ambos casos para no revelar qué correos existen.
  const valida = encontrado && (await bcrypt.compare(contrasena, encontrado.contrasena_hash));
  if (!valida) throw new AppError('Correo o contraseña incorrectos', 401);

  const usuario = await usuarios.buscarPorId(encontrado.id);
  return { usuario, token: firmarToken(encontrado.id) };
}

async function actualizarPerfil(usuarioId, datos) {
  const nombre = texto(datos.nombre);
  if (nombre.length < 2 || nombre.length > 80) {
    throw new AppError('Datos inválidos', 422, { nombre: 'Escribe un nombre de 2 a 80 caracteres' });
  }
  await usuarios.actualizarPerfil(usuarioId, { nombre, avisosCorreo: Boolean(datos.avisosCorreo) });
  return usuarios.buscarPorId(usuarioId);
}

module.exports = { registrar, iniciarSesion, actualizarPerfil, firmarToken };
