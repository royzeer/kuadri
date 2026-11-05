const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { pool } = require('../config/db');
const usuarios = require('../models/usuario.model');
const google = require('./google.service');
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

// Usuario y categorías iniciales se guardan en una sola transacción:
// o se guarda todo, o no se guarda nada.
async function crearConCategorias({ nombre, correo, contrasenaHash = null, googleId = null }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [r] = await conexion.execute(
      'INSERT INTO usuarios (nombre, correo, contrasena_hash, google_id) VALUES (?, ?, ?, ?)',
      [nombre, correo, contrasenaHash, googleId],
    );
    for (const c of CATEGORIAS_INICIALES) {
      await conexion.execute(
        'INSERT INTO categorias (usuario_id, nombre, color, icono) VALUES (?, ?, ?, ?)',
        [r.insertId, c.nombre, c.color, c.icono],
      );
    }
    await conexion.commit();
    return r.insertId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
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
  const usuarioId = await crearConCategorias({ nombre, correo, contrasenaHash });
  const usuario = await usuarios.buscarPorId(usuarioId);
  return { usuario, token: firmarToken(usuarioId) };
}

async function iniciarSesion(datos) {
  const correo = texto(datos.correo).toLowerCase();
  const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';
  if (!correo || !contrasena) throw new AppError('Escribe tu correo y tu contraseña', 422);

  const encontrado = await usuarios.buscarPorCorreo(correo);
  // Mismo mensaje en ambos casos para no revelar qué correos existen.
  // Las cuentas creadas con Google no tienen contraseña: también se rechazan aquí.
  const valida =
    encontrado && encontrado.contrasena_hash && (await bcrypt.compare(contrasena, encontrado.contrasena_hash));
  if (!valida) throw new AppError('Correo o contraseña incorrectos', 401);

  const usuario = await usuarios.buscarPorId(encontrado.id);
  return { usuario, token: firmarToken(encontrado.id) };
}

// Entrar con Google (CU01): Google confirma quién es la persona y Kuadri entrega su JWT normal.
// 1. Si ya entró antes con Google, se usa esa cuenta.
// 2. Si ya tiene cuenta con el mismo correo, se vincula a Google (no se crea otra).
// 3. Si no tiene cuenta, se crea una sin contraseña, con sus categorías iniciales.
async function entrarConGoogle(datos) {
  const perfil = await google.verificarCredencial(datos.credencial);

  let encontrado = await usuarios.buscarPorGoogleId(perfil.googleId);
  if (!encontrado) {
    encontrado = await usuarios.buscarPorCorreo(perfil.correo);
    if (encontrado) await usuarios.vincularGoogle(encontrado.id, perfil.googleId);
  }

  let usuarioId = encontrado && encontrado.id;
  let nuevo = false;
  if (!usuarioId) {
    let nombre = texto(perfil.nombre).slice(0, 80);
    if (nombre.length < 2) nombre = perfil.correo.split('@')[0].slice(0, 80);
    usuarioId = await crearConCategorias({ nombre, correo: perfil.correo, googleId: perfil.googleId });
    nuevo = true;
  }

  const usuario = await usuarios.buscarPorId(usuarioId);
  return { usuario, token: firmarToken(usuarioId), nuevo };
}

async function actualizarPerfil(usuarioId, datos) {
  const nombre = texto(datos.nombre);
  if (nombre.length < 2 || nombre.length > 80) {
    throw new AppError('Datos inválidos', 422, { nombre: 'Escribe un nombre de 2 a 80 caracteres' });
  }
  await usuarios.actualizarPerfil(usuarioId, { nombre, avisosCorreo: Boolean(datos.avisosCorreo) });
  return usuarios.buscarPorId(usuarioId);
}

module.exports = { registrar, iniciarSesion, entrarConGoogle, actualizarPerfil, firmarToken };
