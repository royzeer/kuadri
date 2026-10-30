// Validaciones sencillas y reutilizables para los datos que llegan a la API.
const { AppError } = require('./respuesta');

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const PRIORIDADES = ['baja', 'media', 'alta'];

// Recibe un objeto { campo: 'mensaje de error' } y lanza un error 422 si hay alguno.
function lanzarSiHayErrores(errores) {
  if (Object.keys(errores).length > 0) {
    throw new AppError('Datos inválidos', 422, errores);
  }
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function idPositivo(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Convierte un valor a fecha válida o devuelve null.
function fecha(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const f = new Date(valor);
  return Number.isNaN(f.getTime()) ? undefined : f;
}

module.exports = {
  CORREO_REGEX,
  COLOR_REGEX,
  PRIORIDADES,
  lanzarSiHayErrores,
  texto,
  idPositivo,
  fecha,
};
