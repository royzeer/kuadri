// Registro de ocio: lo que disfrutas (juegos, series, libros...) y los ratos que le dedicas.
const ocio = require('../models/ocio.model');
const logros = require('./logro.service');
const { AppError } = require('../utils/respuesta');
const { texto, dia, lanzarSiHayErrores } = require('../utils/validar');
const { aTextoDia } = require('../utils/fechas');

const TIPOS = ['videojuego', 'serie', 'pelicula', 'libro', 'musica', 'otro'];
const ESTADOS = ['pendiente', 'en_curso', 'terminado', 'abandonado'];
const MAX_MINUTOS_RATO = 720;

// Calificación opcional de 1 a 5: vacío da null; otro valor da undefined (inválido).
function calificacion(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

function validarDatos(datos) {
  const limpios = {
    titulo: texto(datos.titulo),
    tipo: datos.tipo || 'otro',
    estado: datos.estado || 'pendiente',
    calificacion: calificacion(datos.calificacion),
    plataforma: texto(datos.plataforma) || null,
    comentario: texto(datos.comentario) || null,
  };
  const errores = {};
  if (!limpios.titulo || limpios.titulo.length > 120) errores.titulo = 'El título es obligatorio (máximo 120 caracteres)';
  if (!TIPOS.includes(limpios.tipo)) errores.tipo = 'Elige un tipo de la lista';
  if (!ESTADOS.includes(limpios.estado)) errores.estado = 'Elige un estado de la lista';
  if (limpios.calificacion === undefined) errores.calificacion = 'La nota va de 1 a 5';
  if (limpios.plataforma && limpios.plataforma.length > 60) errores.plataforma = 'Máximo 60 caracteres';
  if (limpios.comentario && limpios.comentario.length > 2000) errores.comentario = 'Máximo 2000 caracteres';
  lanzarSiHayErrores(errores);
  return limpios;
}

// Fecha de un rato (función pura): sin día es "ahora"; con un día pasado se guarda a mediodía.
// No se aceptan días futuros. Devuelve undefined si el día no es válido.
function fechaRato(valor, ahora) {
  const d = dia(valor);
  if (d === undefined) return undefined;
  if (d === null || d === aTextoDia(ahora)) return ahora;
  if (d > aTextoDia(ahora)) return undefined;
  const [a, m, n] = d.split('-').map(Number);
  return new Date(a, m - 1, n, 12);
}

async function buscarOFallar(usuarioId, id) {
  const actividad = await ocio.buscar(usuarioId, id);
  if (!actividad) throw new AppError('No encontramos esa actividad de ocio', 404);
  return actividad;
}

const listar = (usuarioId) => ocio.listar(usuarioId);

async function obtener(usuarioId, id) {
  const actividad = await buscarOFallar(usuarioId, id);
  return { ...actividad, ratos: await ocio.ratos(id) };
}

// Terminar algo puede dar el logro "Equilibrado".
async function revisarLogros(usuarioId, estado, ahora) {
  return estado === 'terminado' ? logros.revisar(usuarioId, ahora) : [];
}

async function crear(usuarioId, datos, ahora = new Date()) {
  const limpios = validarDatos(datos);
  const id = await ocio.crear(usuarioId, limpios, ahora);
  const nuevosLogros = await revisarLogros(usuarioId, limpios.estado, ahora);
  return { ocio: await obtener(usuarioId, id), nuevosLogros };
}

async function actualizar(usuarioId, id, datos, ahora = new Date()) {
  await buscarOFallar(usuarioId, id);
  const limpios = validarDatos(datos);
  await ocio.actualizar(usuarioId, id, limpios, ahora);
  const nuevosLogros = await revisarLogros(usuarioId, limpios.estado, ahora);
  return { ocio: await obtener(usuarioId, id), nuevosLogros };
}

// Anotar un rato en algo pendiente lo pasa a "en curso".
async function registrarRato(usuarioId, id, datos, ahora = new Date()) {
  const actividad = await buscarOFallar(usuarioId, id);
  const minutos = Number(datos.minutos);
  const fecha = fechaRato(datos.fecha, ahora);
  const errores = {};
  if (!Number.isInteger(minutos) || minutos < 1 || minutos > MAX_MINUTOS_RATO) {
    errores.minutos = `Escribe entre 1 y ${MAX_MINUTOS_RATO} minutos`;
  }
  if (fecha === undefined) errores.fecha = 'Elige hoy o un día anterior';
  lanzarSiHayErrores(errores);

  await ocio.crearRato(id, { minutos, fecha });
  if (actividad.estado === 'pendiente') await ocio.cambiarEstado(usuarioId, id, 'en_curso');
  return obtener(usuarioId, id);
}

async function eliminarRato(usuarioId, id, ratoId) {
  await buscarOFallar(usuarioId, id);
  if (!(await ocio.eliminarRato(id, ratoId))) throw new AppError('Rato no encontrado', 404);
  return obtener(usuarioId, id);
}

async function eliminar(usuarioId, id) {
  if (!(await ocio.eliminar(usuarioId, id))) throw new AppError('No encontramos esa actividad de ocio', 404);
}

module.exports = {
  TIPOS,
  ESTADOS,
  calificacion,
  fechaRato,
  listar,
  obtener,
  crear,
  actualizar,
  registrarRato,
  eliminarRato,
  eliminar,
};
