// Formato único de respuesta para toda la API: { ok, data, mensaje }

class AppError extends Error {
  constructor(mensaje, estado = 400, detalles = undefined) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
  }
}

function exito(res, data = null, mensaje = 'OK', estado = 200) {
  return res.status(estado).json({ ok: true, data, mensaje });
}

module.exports = { AppError, exito };
