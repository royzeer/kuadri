// Estudio creativo: paletas de colores, tipografías de Google Fonts y plantillas que las combinan.
const estudio = require('../models/estudio.model');
const logros = require('./logro.service');
const { AppError } = require('../utils/respuesta');
const { COLOR_REGEX, texto, idPositivo, lanzarSiHayErrores } = require('../utils/validar');

const MIN_COLORES = 2;
const MAX_COLORES = 6;
const USOS = ['titulos', 'texto', 'ambos'];
// Nombres como los de Google Fonts: letras, números, espacios y guiones ("Bricolage Grotesque", "M PLUS 1p").
const FUENTE_REGEX = /^[A-Za-z0-9][A-Za-z0-9 -]*$/;

// Limpia la lista de colores: '#b1cb5a' pasa a '#B1CB5A' (función pura).
// Devuelve null si algún color no tiene el formato #RRGGBB.
function normalizarColores(lista) {
  if (!Array.isArray(lista)) return null;
  const colores = lista.map((c) => texto(c).toUpperCase());
  return colores.every((c) => COLOR_REGEX.test(c)) ? colores : null;
}

// Junta los espacios repetidos: '  Space   Grotesk ' pasa a 'Space Grotesk'.
const limpiarFuente = (valor) => texto(valor).replace(/\s+/g, ' ');

function validarNombre(valor, errores) {
  const nombre = texto(valor);
  if (!nombre || nombre.length > 60) errores.nombre = 'El nombre es obligatorio (máximo 60 caracteres)';
  return nombre;
}

// ----- Paletas -----
function validarPaleta(datos) {
  const errores = {};
  const nombre = validarNombre(datos.nombre, errores);
  const colores = normalizarColores(datos.colores);
  if (!colores) errores.colores = 'Cada color debe tener el formato #RRGGBB';
  else if (colores.length < MIN_COLORES || colores.length > MAX_COLORES) {
    errores.colores = `Una paleta lleva entre ${MIN_COLORES} y ${MAX_COLORES} colores`;
  }
  lanzarSiHayErrores(errores);
  return { nombre, colores };
}

async function paletaOFallar(usuarioId, id) {
  const paleta = await estudio.buscarPaleta(usuarioId, id);
  if (!paleta) throw new AppError('Paleta no encontrada', 404);
  return paleta;
}

const listarPaletas = (usuarioId) => estudio.listarPaletas(usuarioId);

async function crearPaleta(usuarioId, datos, ahora = new Date()) {
  const id = await estudio.crearPaleta(usuarioId, validarPaleta(datos));
  const nuevosLogros = await logros.revisar(usuarioId, ahora);
  return { paleta: await estudio.buscarPaleta(usuarioId, id), nuevosLogros };
}

async function actualizarPaleta(usuarioId, id, datos) {
  await paletaOFallar(usuarioId, id);
  await estudio.actualizarPaleta(usuarioId, id, validarPaleta(datos));
  return estudio.buscarPaleta(usuarioId, id);
}

async function eliminarPaleta(usuarioId, id) {
  if (!(await estudio.eliminarPaleta(usuarioId, id))) throw new AppError('Paleta no encontrada', 404);
}

// ----- Tipografías -----
function validarTipografia(datos) {
  const nombre = limpiarFuente(datos.nombre);
  const uso = datos.uso || 'ambos';
  const muestra = texto(datos.muestra) || null;
  const errores = {};
  if (!nombre || nombre.length > 60 || !FUENTE_REGEX.test(nombre)) {
    errores.nombre = 'Escribe el nombre de la fuente tal como aparece en Google Fonts';
  }
  if (!USOS.includes(uso)) errores.uso = 'El uso debe ser títulos, texto o ambos';
  if (muestra && muestra.length > 150) errores.muestra = 'Máximo 150 caracteres';
  lanzarSiHayErrores(errores);
  return { nombre, uso, muestra };
}

async function tipografiaOFallar(usuarioId, id) {
  const tipografia = await estudio.buscarTipografia(usuarioId, id);
  if (!tipografia) throw new AppError('Tipografía no encontrada', 404);
  return tipografia;
}

const listarTipografias = (usuarioId) => estudio.listarTipografias(usuarioId);

async function crearTipografia(usuarioId, datos) {
  const id = await estudio.crearTipografia(usuarioId, validarTipografia(datos));
  return estudio.buscarTipografia(usuarioId, id);
}

async function actualizarTipografia(usuarioId, id, datos) {
  await tipografiaOFallar(usuarioId, id);
  await estudio.actualizarTipografia(usuarioId, id, validarTipografia(datos));
  return estudio.buscarTipografia(usuarioId, id);
}

async function eliminarTipografia(usuarioId, id) {
  if (!(await estudio.eliminarTipografia(usuarioId, id))) throw new AppError('Tipografía no encontrada', 404);
}

// ----- Plantillas -----
async function validarPlantilla(usuarioId, datos) {
  const errores = {};
  const nombre = validarNombre(datos.nombre, errores);
  const nota = texto(datos.nota) || null;
  const ids = {
    paletaId: datos.paletaId ? idPositivo(datos.paletaId) : null,
    fuenteTitulosId: datos.fuenteTitulosId ? idPositivo(datos.fuenteTitulosId) : null,
    fuenteTextoId: datos.fuenteTextoId ? idPositivo(datos.fuenteTextoId) : null,
  };
  if (nota && nota.length > 300) errores.nota = 'Máximo 300 caracteres';
  for (const campo of Object.keys(ids)) {
    if (datos[campo] && !ids[campo]) errores[campo] = 'Identificador inválido';
  }
  lanzarSiHayErrores(errores);

  // La paleta y las fuentes deben ser del mismo usuario
  if (ids.paletaId && !(await estudio.buscarPaleta(usuarioId, ids.paletaId))) {
    errores.paletaId = 'La paleta no existe';
  }
  for (const campo of ['fuenteTitulosId', 'fuenteTextoId']) {
    if (ids[campo] && !(await estudio.buscarTipografia(usuarioId, ids[campo]))) errores[campo] = 'La fuente no existe';
  }
  lanzarSiHayErrores(errores);
  return { nombre, nota, ...ids };
}

async function plantillaOFallar(usuarioId, id) {
  const plantilla = await estudio.buscarPlantilla(usuarioId, id);
  if (!plantilla) throw new AppError('Plantilla no encontrada', 404);
  return plantilla;
}

const listarPlantillas = (usuarioId) => estudio.listarPlantillas(usuarioId);

async function crearPlantilla(usuarioId, datos) {
  const id = await estudio.crearPlantilla(usuarioId, await validarPlantilla(usuarioId, datos));
  return estudio.buscarPlantilla(usuarioId, id);
}

async function actualizarPlantilla(usuarioId, id, datos) {
  await plantillaOFallar(usuarioId, id);
  await estudio.actualizarPlantilla(usuarioId, id, await validarPlantilla(usuarioId, datos));
  return estudio.buscarPlantilla(usuarioId, id);
}

async function eliminarPlantilla(usuarioId, id) {
  if (!(await estudio.eliminarPlantilla(usuarioId, id))) throw new AppError('Plantilla no encontrada', 404);
}

module.exports = {
  normalizarColores,
  limpiarFuente,
  listarPaletas,
  crearPaleta,
  actualizarPaleta,
  eliminarPaleta,
  listarTipografias,
  crearTipografia,
  actualizarTipografia,
  eliminarTipografia,
  listarPlantillas,
  crearPlantilla,
  actualizarPlantilla,
  eliminarPlantilla,
};
