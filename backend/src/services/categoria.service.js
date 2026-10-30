const categorias = require('../models/categoria.model');
const { AppError } = require('../utils/respuesta');
const { COLOR_REGEX, texto, lanzarSiHayErrores } = require('../utils/validar');

const ICONOS = ['carpeta', 'libro', 'codigo', 'corazon', 'rayo', 'cafe', 'avion', 'pincel', 'control', 'dinero'];

function validar(datos) {
  const nombre = texto(datos.nombre);
  const color = datos.color || '#3359FF';
  const icono = datos.icono || 'carpeta';
  const errores = {};
  if (!nombre || nombre.length > 40) errores.nombre = 'Escribe un nombre de máximo 40 caracteres';
  if (!COLOR_REGEX.test(color)) errores.color = 'El color debe tener el formato #RRGGBB';
  if (!ICONOS.includes(icono)) errores.icono = 'Icono no válido';
  lanzarSiHayErrores(errores);
  return { nombre, color: color.toUpperCase(), icono };
}

// El nombre de categoría es único por usuario: se traduce el error de MySQL a un mensaje claro.
function traducirDuplicado(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ya tienes una categoría con ese nombre', 409, { nombre: 'Nombre repetido' });
  }
  throw error;
}

const listar = (usuarioId) => categorias.listar(usuarioId);

async function crear(usuarioId, datos) {
  const limpios = validar(datos);
  const id = await categorias.crear(usuarioId, limpios).catch(traducirDuplicado);
  return categorias.buscar(usuarioId, id);
}

async function actualizar(usuarioId, id, datos) {
  const limpios = validar(datos);
  const ok = await categorias.actualizar(usuarioId, id, limpios).catch(traducirDuplicado);
  if (!ok) throw new AppError('Categoría no encontrada', 404);
  return categorias.buscar(usuarioId, id);
}

async function eliminar(usuarioId, id) {
  if (!(await categorias.eliminar(usuarioId, id))) throw new AppError('Categoría no encontrada', 404);
}

module.exports = { ICONOS, listar, crear, actualizar, eliminar };
