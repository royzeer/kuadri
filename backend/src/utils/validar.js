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

// Enlace web opcional: vacío da null; si no empieza por http(s) da undefined (inválido).
function enlace(valor) {
  const t = texto(valor);
  if (!t) return null;
  try {
    const u = new URL(t);
    return ['http:', 'https:'].includes(u.protocol) && t.length <= 500 ? t : undefined;
  } catch {
    return undefined;
  }
}

// Precio opcional en pesos: vacío da null; si no es un número positivo da undefined (inválido).
function precio(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 && n < 1e10 ? Math.round(n * 100) / 100 : undefined;
}

// Fecha sin hora 'YYYY-MM-DD' opcional: vacío da null; formato incorrecto da undefined.
function dia(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return undefined;
  const f = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(f.getTime()) && f.toISOString().startsWith(valor) ? valor : undefined;
}

module.exports = {
  CORREO_REGEX,
  COLOR_REGEX,
  PRIORIDADES,
  lanzarSiHayErrores,
  texto,
  idPositivo,
  fecha,
  enlace,
  precio,
  dia,
};
