// Manejo central de errores: toda respuesta de error sale con el mismo formato.
const { AppError } = require('../utils/respuesta');
const env = require('../config/env');

function rutaNoEncontrada(req, _res, next) {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(error, _req, res, _next) {
  // JSON mal escrito en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, data: null, mensaje: 'El cuerpo de la petición no es JSON válido' });
  }
  if (error instanceof AppError) {
    return res.status(error.estado).json({
      ok: false,
      data: error.detalles ? { errores: error.detalles } : null,
      mensaje: error.message,
    });
  }
  // Errores inesperados: se registran, pero no se muestran detalles internos al cliente.
  if (env.entorno !== 'test') console.error(error);
  return res.status(500).json({ ok: false, data: null, mensaje: 'Error interno del servidor' });
}

module.exports = { rutaNoEncontrada, manejarErrores };
