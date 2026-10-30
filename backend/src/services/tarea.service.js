const tareas = require('../models/tarea.model');
const categorias = require('../models/categoria.model');
const logros = require('./logro.service');
const { AppError } = require('../utils/respuesta');
const { PRIORIDADES, texto, idPositivo, fecha, lanzarSiHayErrores } = require('../utils/validar');

// Valida y normaliza los datos de una tarea antes de guardarla.
async function validarDatos(usuarioId, datos) {
  const titulo = texto(datos.titulo);
  const descripcion = texto(datos.descripcion) || null;
  const prioridad = datos.prioridad || 'media';
  const fechaLimite = fecha(datos.fechaLimite);
  const categoriaId = datos.categoriaId ? idPositivo(datos.categoriaId) : null;

  const errores = {};
  if (!titulo || titulo.length > 150) errores.titulo = 'El título es obligatorio (máximo 150 caracteres)';
  if (descripcion && descripcion.length > 2000) errores.descripcion = 'Máximo 2000 caracteres';
  if (!PRIORIDADES.includes(prioridad)) errores.prioridad = 'La prioridad debe ser baja, media o alta';
  if (fechaLimite === undefined) errores.fechaLimite = 'La fecha no es válida';
  if (datos.categoriaId && !categoriaId) errores.categoriaId = 'Categoría inválida';
  lanzarSiHayErrores(errores);

  // La categoría debe pertenecer al mismo usuario
  if (categoriaId && !(await categorias.buscar(usuarioId, categoriaId))) {
    throw new AppError('Datos inválidos', 422, { categoriaId: 'La categoría no existe' });
  }

  return { titulo, descripcion, prioridad, fechaLimite, categoriaId };
}

function listar(usuarioId, consulta) {
  const desde = fecha(consulta.desde);
  const hasta = fecha(consulta.hasta);
  return tareas.listar(usuarioId, {
    estado: consulta.estado,
    categoriaId: idPositivo(consulta.categoria),
    prioridad: PRIORIDADES.includes(consulta.prioridad) ? consulta.prioridad : null,
    desde: desde || null,
    hasta: hasta || null,
  });
}

async function obtener(usuarioId, id) {
  const tarea = await tareas.buscar(usuarioId, id);
  if (!tarea) throw new AppError('Tarea no encontrada', 404);
  return tarea;
}

async function crear(usuarioId, datos) {
  const limpios = await validarDatos(usuarioId, datos);
  const id = await tareas.crear(usuarioId, limpios);
  return tareas.buscar(usuarioId, id);
}

async function actualizar(usuarioId, id, datos) {
  await obtener(usuarioId, id);
  const limpios = await validarDatos(usuarioId, datos);
  await tareas.actualizar(usuarioId, id, limpios);
  return tareas.buscar(usuarioId, id);
}

// Marca la tarea como completada (o la reabre) y revisa si se ganó algún logro.
async function cambiarEstado(usuarioId, id, completada = true, ahora = new Date()) {
  await obtener(usuarioId, id);
  await tareas.cambiarEstado(usuarioId, id, Boolean(completada), ahora);
  const nuevosLogros = completada ? await logros.revisar(usuarioId, ahora) : [];
  return { tarea: await tareas.buscar(usuarioId, id), nuevosLogros };
}

async function eliminar(usuarioId, id) {
  const borrada = await tareas.eliminar(usuarioId, id);
  if (!borrada) throw new AppError('Tarea no encontrada', 404);
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar };
