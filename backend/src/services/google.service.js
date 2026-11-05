// Verifica la credencial (ID token) que entrega el botón "Entrar con Google".
// Google firma el token; aquí se revisa la firma, la fecha y que sea para esta app.
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const { AppError } = require('../utils/respuesta');

let cliente;

async function verificarCredencial(credencial) {
  if (!env.google.clientId) {
    throw new AppError('Entrar con Google no está disponible por ahora', 503);
  }
  if (typeof credencial !== 'string' || !credencial) {
    throw new AppError('Falta la credencial de Google', 422);
  }
  cliente = cliente || new OAuth2Client(env.google.clientId);

  let datos;
  try {
    const ticket = await cliente.verifyIdToken({ idToken: credencial, audience: env.google.clientId });
    datos = ticket.getPayload();
  } catch {
    throw new AppError('No se pudo verificar tu cuenta de Google. Intenta de nuevo.', 401);
  }
  if (!datos || !datos.sub || !datos.email || !datos.email_verified) {
    throw new AppError('Tu cuenta de Google no tiene un correo verificado', 401);
  }
  return { googleId: datos.sub, correo: datos.email.toLowerCase(), nombre: datos.name || '' };
}

module.exports = { verificarCredencial };
