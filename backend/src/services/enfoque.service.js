const actividad = require('../models/actividad.model');
const tareas = require('../models/tarea.model');
const categorias = require('../models/categoria.model');
const logros = require('./logro.service');
const { AppError } = require('../utils/respuesta');
const { idPositivo, lanzarSiHayErrores } = require('../utils/validar');

// Registra una sesión de enfoque terminada (RF12, RF13, RN03).
async function registrar(usuarioId, datos, ahora = new Date()) {
  const minutos = Number(datos.minutos);
  const tareaId = datos.tareaId ? idPositivo(datos.tareaId) : null;
  let categoriaId = datos.categoriaId ? idPositivo(datos.categoriaId) : null;

  const errores = {};
  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 180) {
    errores.minutos = 'La sesión debe durar entre 1 y 180 minutos';
  }
  if (datos.tareaId && !tareaId) errores.tareaId = 'Tarea inválida';
  if (datos.categoriaId && !categoriaId) errores.categoriaId = 'Categoría inválida';
  lanzarSiHayErrores(errores);

  if (tareaId) {
    const tarea = await tareas.buscar(usuarioId, tareaId);
    if (!tarea) throw new AppError('La tarea no existe', 404);
    // Si la sesión es de una tarea, hereda su categoría
    categoriaId = categoriaId || tarea.categoria_id;
  }
  if (categoriaId && !(await categorias.buscar(usuarioId, categoriaId))) {
    throw new AppError('La categoría no existe', 404);
  }

  const id = await actividad.crearSesion(usuarioId, { minutos, tareaId, categoriaId, fecha: ahora });
  const nuevosLogros = await logros.revisar(usuarioId, ahora);
  return { sesion: { id, minutos, tareaId, categoriaId, terminada_en: ahora }, nuevosLogros };
}

module.exports = { registrar };
