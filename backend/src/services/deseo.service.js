const deseos = require('../models/deseo.model');
const actividad = require('../models/actividad.model');
const logros = require('./logro.service');
const { AppError } = require('../utils/respuesta');
const { PRIORIDADES, texto, enlace, precio, lanzarSiHayErrores } = require('../utils/validar');

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const formatearPesos = (valor) => pesos.format(valor);

// Compara el último precio con el anterior y con el objetivo (función pura).
// Devuelve la tendencia ('baja', 'sube', 'igual' o null si solo hay un precio)
// y si el precio ya llegó a lo que el usuario quiere pagar.
function analizarPrecios(historial, precioObjetivo) {
  if (historial.length === 0) return { tendencia: null, diferencia: 0, enObjetivo: false };
  const actual = historial[historial.length - 1].precio;
  const anterior = historial.length > 1 ? historial[historial.length - 2].precio : null;
  const diferencia = anterior === null ? 0 : actual - anterior;
  let tendencia = null;
  if (anterior !== null) tendencia = diferencia < 0 ? 'baja' : diferencia > 0 ? 'sube' : 'igual';
  return { tendencia, diferencia, enObjetivo: precioObjetivo !== null && actual <= precioObjetivo };
}

function validarDatos(datos) {
  const nombre = texto(datos.nombre);
  const limpios = {
    nombre,
    enlace: enlace(datos.enlace),
    imagen: enlace(datos.imagen),
    precioObjetivo: precio(datos.precioObjetivo),
    prioridad: datos.prioridad || 'media',
  };
  const errores = {};
  if (!nombre || nombre.length > 120) errores.nombre = 'El nombre es obligatorio (máximo 120 caracteres)';
  if (limpios.enlace === undefined) errores.enlace = 'Pega un enlace que empiece por http:// o https://';
  if (limpios.imagen === undefined) errores.imagen = 'Pega un enlace de imagen que empiece por http:// o https://';
  if (limpios.precioObjetivo === undefined) errores.precioObjetivo = 'Escribe un precio mayor que cero';
  if (!PRIORIDADES.includes(limpios.prioridad)) errores.prioridad = 'La prioridad debe ser baja, media o alta';
  return { limpios, errores };
}

function validarPrecio(datos) {
  const valor = precio(datos.precio);
  const tienda = texto(datos.tienda) || null;
  const errores = {};
  if (!valor) errores.precio = 'Escribe un precio mayor que cero';
  if (tienda && tienda.length > 60) errores.tienda = 'Máximo 60 caracteres';
  return { limpios: { precio: valor, tienda }, errores };
}

async function buscarOFallar(usuarioId, id) {
  const deseo = await deseos.buscar(usuarioId, id);
  if (!deseo) throw new AppError('Deseo no encontrado', 404);
  return deseo;
}

const listar = (usuarioId) => deseos.listar(usuarioId);

// Detalle con el historial completo y el análisis del precio.
async function obtener(usuarioId, id) {
  const deseo = await buscarOFallar(usuarioId, id);
  const historial = await deseos.historial(id);
  return { ...deseo, historial, ...analizarPrecios(historial, deseo.precio_objetivo) };
}

// Después de anotar un precio: avisa una sola vez cuando llega al objetivo.
// Si el precio vuelve a subir, el aviso queda listo para la próxima bajada.
async function revisarObjetivo(usuarioId, deseo, ahora) {
  if (deseo.precio_objetivo === null || deseo.precio_actual === null) return [];
  const enObjetivo = deseo.precio_actual <= deseo.precio_objetivo;
  const avisado = await deseos.estadoAviso(deseo.id);
  if (enObjetivo && !avisado) {
    await deseos.cambiarAviso(deseo.id, true);
    await actividad.crearNotificacion(
      usuarioId,
      'sistema',
      `"${deseo.nombre}" llegó a tu precio objetivo: ${formatearPesos(deseo.precio_actual)}`,
    );
    return logros.revisar(usuarioId, ahora);
  }
  if (!enObjetivo && avisado) await deseos.cambiarAviso(deseo.id, false);
  return [];
}

async function crear(usuarioId, datos, ahora = new Date()) {
  const { limpios, errores } = validarDatos(datos);
  // Opcional: el precio que tiene hoy, para empezar el historial de una vez
  const inicial = datos.precioActual ? validarPrecio({ precio: datos.precioActual, tienda: datos.tienda }) : null;
  if (inicial?.errores.precio) errores.precioActual = inicial.errores.precio;
  lanzarSiHayErrores(errores);

  const id = await deseos.crear(usuarioId, limpios);
  let nuevosLogros = [];
  if (inicial) {
    await deseos.registrarPrecio(id, { ...inicial.limpios, fecha: ahora });
    nuevosLogros = await revisarObjetivo(usuarioId, await deseos.buscar(usuarioId, id), ahora);
  }
  return { deseo: await obtener(usuarioId, id), nuevosLogros };
}

async function actualizar(usuarioId, id, datos, ahora = new Date()) {
  await buscarOFallar(usuarioId, id);
  const { limpios, errores } = validarDatos(datos);
  lanzarSiHayErrores(errores);
  await deseos.actualizar(usuarioId, id, limpios);
  const nuevosLogros = await revisarObjetivo(usuarioId, await deseos.buscar(usuarioId, id), ahora);
  return { deseo: await obtener(usuarioId, id), nuevosLogros };
}

async function registrarPrecio(usuarioId, id, datos, ahora = new Date()) {
  await buscarOFallar(usuarioId, id);
  const { limpios, errores } = validarPrecio(datos);
  lanzarSiHayErrores(errores);
  await deseos.registrarPrecio(id, { ...limpios, fecha: ahora });
  const nuevosLogros = await revisarObjetivo(usuarioId, await deseos.buscar(usuarioId, id), ahora);
  return { deseo: await obtener(usuarioId, id), nuevosLogros };
}

async function eliminarPrecio(usuarioId, id, precioId) {
  await buscarOFallar(usuarioId, id);
  if (!(await deseos.eliminarPrecio(id, precioId))) throw new AppError('Precio no encontrado', 404);
  return obtener(usuarioId, id);
}

async function comprar(usuarioId, id, comprado = true, ahora = new Date()) {
  await buscarOFallar(usuarioId, id);
  await deseos.marcarComprado(usuarioId, id, comprado ? ahora : null);
  return obtener(usuarioId, id);
}

async function eliminar(usuarioId, id) {
  if (!(await deseos.eliminar(usuarioId, id))) throw new AppError('Deseo no encontrado', 404);
}

module.exports = {
  analizarPrecios,
  formatearPesos,
  listar,
  obtener,
  crear,
  actualizar,
  registrarPrecio,
  eliminarPrecio,
  comprar,
  eliminar,
};
