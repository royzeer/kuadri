// Cifrado simétrico (AES-256-GCM) para datos privados que la app necesita leer de nuevo,
// como el enlace de calendario del campus. Sin la clave del servidor no se pueden leer.
const crypto = require('crypto');
const env = require('../config/env');

const VERSION = 'v1';
let clave;

function obtenerClave() {
  if (!clave) clave = crypto.scryptSync(env.campus.secreto, 'kuadri-campus', 32);
  return clave;
}

function cifrar(textoPlano) {
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv('aes-256-gcm', obtenerClave(), iv);
  const datos = Buffer.concat([cifrador.update(textoPlano, 'utf8'), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return [VERSION, iv.toString('base64'), etiqueta.toString('base64'), datos.toString('base64')].join(':');
}

// Si el texto fue alterado o la clave cambió, lanza un error.
function descifrar(textoCifrado) {
  const [version, iv, etiqueta, datos] = String(textoCifrado).split(':');
  if (version !== VERSION || !iv || !etiqueta || !datos) throw new Error('Formato de cifrado desconocido');
  const descifrador = crypto.createDecipheriv('aes-256-gcm', obtenerClave(), Buffer.from(iv, 'base64'));
  descifrador.setAuthTag(Buffer.from(etiqueta, 'base64'));
  return Buffer.concat([descifrador.update(Buffer.from(datos, 'base64')), descifrador.final()]).toString('utf8');
}

module.exports = { cifrar, descifrar };
