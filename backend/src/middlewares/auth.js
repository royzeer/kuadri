// Protege las rutas privadas: exige un token JWT válido en el encabezado Authorization.
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('../utils/respuesta');

function requiereAuth(req, _res, next) {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new AppError('Debes iniciar sesión', 401));
  }
  try {
    const datos = jwt.verify(token, env.jwt.secreto);
    req.usuarioId = datos.id;
    return next();
  } catch {
    return next(new AppError('La sesión expiró o no es válida', 401));
  }
}

module.exports = { requiereAuth };
