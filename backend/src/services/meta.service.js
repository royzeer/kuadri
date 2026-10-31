const metas = require('../models/meta.model');
const categorias = require('../models/categoria.model');
const logros = require('./logro.service');
const { AppError } = require('../utils/respuesta');
const { texto, idPositivo, dia, lanzarSiHayErrores } = require('../utils/validar');

const MAX_PASOS = 30;

// Porcentaje de avance de una meta (función pura). Una meta cumplida siempre está al 100 %.
function calcularProgreso({ total_pasos: total, pasos_hechos: hechos, cumplida_en: cumplida }) {
  if (cumplida) return 100;
  if (!total) return 0;
  return Math.round((hechos / total) * 100);
}

function validarPaso(valor) {
  const t = texto(valor);
  return t && t.length <= 150 ? t : null;
}

async function validarDatos(usuarioId, datos, conPasos) {
  const titulo = texto(datos.titulo);
  const descripcion = texto(datos.descripcion) || null;
  const fechaObjetivo = dia(datos.fechaObjetivo);
  const categoriaId = datos.categoriaId ? idPositivo(datos.categoriaId) : null;
  const pasos = conPasos && Array.isArray(datos.pasos) ? datos.pasos.map(validarPaso) : [];

  const errores = {};
  if (!titulo || titulo.length > 120) errores.titulo = 'El nombre de la meta es obligatorio (máximo 120 caracteres)';
  if (descripcion && descripcion.length > 2000) errores.descripcion = 'Máximo 2000 caracteres';
  if (fechaObjetivo === undefined) errores.fechaObjetivo = 'La fecha no es válida';
  if (datos.categoriaId && !categoriaId) errores.categoriaId = 'Categoría inválida';
  if (pasos.includes(null)) errores.pasos = 'Cada paso debe tener texto (máximo 150 caracteres)';
  if (pasos.length > MAX_PASOS) errores.pasos = `Máximo ${MAX_PASOS} pasos por meta`;
  lanzarSiHayErrores(errores);

  if (categoriaId && !(await categorias.buscar(usuarioId, categoriaId))) {
    throw new AppError('Datos inválidos', 422, { categoriaId: 'La categoría no existe' });
  }
  return { titulo, descripcion, fechaObjetivo, categoriaId, pasos };
}

// Agrega a cada meta su lista de pasos y el porcentaje de avance.
async function completar(lista) {
  const pasos = await metas.pasosDe(lista.map((m) => m.id));
  return lista.map((m) => ({
    ...m,
    pasos: pasos.filter((p) => p.meta_id === m.id).map(({ meta_id: _m, ...p }) => p),
    progreso: calcularProgreso(m),
  }));
}

async function listar(usuarioId) {
  return completar(await metas.listar(usuarioId));
}

async function buscarOFallar(usuarioId, id) {
  const meta = await metas.buscar(usuarioId, id);
  if (!meta) throw new AppError('Meta no encontrada', 404);
  return meta;
}

async function obtener(usuarioId, id) {
  const [meta] = await completar([await buscarOFallar(usuarioId, id)]);
  return meta;
}

async function crear(usuarioId, datos) {
  const limpios = await validarDatos(usuarioId, datos, true);
  const id = await metas.crear(usuarioId, limpios);
  for (const paso of limpios.pasos) await metas.crearPaso(id, paso);
  return obtener(usuarioId, id);
}

async function actualizar(usuarioId, id, datos) {
  await buscarOFallar(usuarioId, id);
  const limpios = await validarDatos(usuarioId, datos, false);
  await metas.actualizar(usuarioId, id, limpios);
  return obtener(usuarioId, id);
}

// Marca la meta como cumplida (o la reabre) y revisa si se ganó algún logro.
async function cambiarCumplida(usuarioId, id, cumplida, ahora) {
  await metas.marcarCumplida(usuarioId, id, cumplida ? ahora : null);
  return cumplida ? logros.revisar(usuarioId, ahora) : [];
}

async function cumplir(usuarioId, id, cumplida = true, ahora = new Date()) {
  await buscarOFallar(usuarioId, id);
  const nuevosLogros = await cambiarCumplida(usuarioId, id, Boolean(cumplida), ahora);
  return { meta: await obtener(usuarioId, id), nuevosLogros };
}

// Después de tocar los pasos: si todos quedaron hechos la meta se cumple sola,
// y si se agrega o desmarca un paso de una meta cumplida, vuelve a quedar en curso.
async function revisarPasos(usuarioId, id, ahora) {
  const meta = await metas.buscar(usuarioId, id);
  const todosHechos = meta.total_pasos > 0 && meta.pasos_hechos === meta.total_pasos;
  let nuevosLogros = [];
  if (todosHechos && !meta.cumplida_en) nuevosLogros = await cambiarCumplida(usuarioId, id, true, ahora);
  if (!todosHechos && meta.cumplida_en && meta.total_pasos > 0) await cambiarCumplida(usuarioId, id, false, ahora);
  return { meta: await obtener(usuarioId, id), nuevosLogros };
}

async function agregarPaso(usuarioId, id, datos, ahora = new Date()) {
  const meta = await buscarOFallar(usuarioId, id);
  const paso = validarPaso(datos.texto);
  if (!paso) throw new AppError('Datos inválidos', 422, { texto: 'Escribe el paso (máximo 150 caracteres)' });
  if (meta.total_pasos >= MAX_PASOS) {
    throw new AppError('Datos inválidos', 422, { texto: `Máximo ${MAX_PASOS} pasos por meta` });
  }
  await metas.crearPaso(id, paso);
  return revisarPasos(usuarioId, id, ahora);
}

async function cambiarPaso(usuarioId, id, pasoId, hecho = true, ahora = new Date()) {
  await buscarOFallar(usuarioId, id);
  if (!(await metas.cambiarPaso(id, pasoId, Boolean(hecho)))) throw new AppError('Paso no encontrado', 404);
  return revisarPasos(usuarioId, id, ahora);
}

async function eliminarPaso(usuarioId, id, pasoId, ahora = new Date()) {
  await buscarOFallar(usuarioId, id);
  if (!(await metas.eliminarPaso(id, pasoId))) throw new AppError('Paso no encontrado', 404);
  return revisarPasos(usuarioId, id, ahora);
}

async function eliminar(usuarioId, id) {
  if (!(await metas.eliminar(usuarioId, id))) throw new AppError('Meta no encontrada', 404);
}

module.exports = {
  calcularProgreso,
  listar,
  obtener,
  crear,
  actualizar,
  cumplir,
  agregarPaso,
  cambiarPaso,
  eliminarPaso,
  eliminar,
};
