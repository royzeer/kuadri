// Controladores: reciben la petición, llaman al servicio y responden.
// No contienen reglas de negocio; esas viven en /services.
const authService = require('../services/auth.service');
const categoriaService = require('../services/categoria.service');
const tareaService = require('../services/tarea.service');
const enfoqueService = require('../services/enfoque.service');
const metaService = require('../services/meta.service');
const deseoService = require('../services/deseo.service');
const estadisticas = require('../services/estadisticas.service');
const usuarios = require('../models/usuario.model');
const actividad = require('../models/actividad.model');
const recordatorios = require('../jobs/recordatorios.job');
const { exito, AppError } = require('../utils/respuesta');
const { idPositivo } = require('../utils/validar');

// Lee el :id de la URL y valida que sea un número positivo.
function idDeRuta(req) {
  const id = idPositivo(req.params.id);
  if (!id) throw new AppError('Identificador inválido', 400);
  return id;
}

// Igual que idDeRuta, para el segundo identificador (paso o precio).
function subIdDeRuta(req) {
  const id = idPositivo(req.params.subId);
  if (!id) throw new AppError('Identificador inválido', 400);
  return id;
}

const auth = {
  registro: async (req, res) => exito(res, await authService.registrar(req.body || {}), 'Cuenta creada', 201),
  login: async (req, res) => exito(res, await authService.iniciarSesion(req.body || {}), 'Bienvenido'),
  perfil: async (req, res) => exito(res, await usuarios.buscarPorId(req.usuarioId)),
  actualizarPerfil: async (req, res) =>
    exito(res, await authService.actualizarPerfil(req.usuarioId, req.body || {}), 'Perfil actualizado'),
};

const categorias = {
  listar: async (req, res) => exito(res, await categoriaService.listar(req.usuarioId)),
  crear: async (req, res) =>
    exito(res, await categoriaService.crear(req.usuarioId, req.body || {}), 'Categoría creada', 201),
  actualizar: async (req, res) =>
    exito(res, await categoriaService.actualizar(req.usuarioId, idDeRuta(req), req.body || {}), 'Categoría actualizada'),
  eliminar: async (req, res) => {
    await categoriaService.eliminar(req.usuarioId, idDeRuta(req));
    exito(res, null, 'Categoría eliminada');
  },
};

const tareas = {
  listar: async (req, res) => exito(res, await tareaService.listar(req.usuarioId, req.query)),
  obtener: async (req, res) => exito(res, await tareaService.obtener(req.usuarioId, idDeRuta(req))),
  crear: async (req, res) => exito(res, await tareaService.crear(req.usuarioId, req.body || {}), 'Tarea creada', 201),
  actualizar: async (req, res) =>
    exito(res, await tareaService.actualizar(req.usuarioId, idDeRuta(req), req.body || {}), 'Tarea actualizada'),
  completar: async (req, res) => {
    const completada = req.body?.completada !== false;
    const resultado = await tareaService.cambiarEstado(req.usuarioId, idDeRuta(req), completada);
    exito(res, resultado, completada ? 'Tarea completada' : 'Tarea marcada como pendiente');
  },
  eliminar: async (req, res) => {
    await tareaService.eliminar(req.usuarioId, idDeRuta(req));
    exito(res, null, 'Tarea eliminada');
  },
};

const metas = {
  listar: async (req, res) => exito(res, await metaService.listar(req.usuarioId)),
  obtener: async (req, res) => exito(res, await metaService.obtener(req.usuarioId, idDeRuta(req))),
  crear: async (req, res) => exito(res, await metaService.crear(req.usuarioId, req.body || {}), 'Meta creada', 201),
  actualizar: async (req, res) =>
    exito(res, await metaService.actualizar(req.usuarioId, idDeRuta(req), req.body || {}), 'Meta actualizada'),
  cumplir: async (req, res) => {
    const cumplida = req.body?.cumplida !== false;
    const resultado = await metaService.cumplir(req.usuarioId, idDeRuta(req), cumplida);
    exito(res, resultado, cumplida ? 'Meta cumplida' : 'Meta en curso de nuevo');
  },
  eliminar: async (req, res) => {
    await metaService.eliminar(req.usuarioId, idDeRuta(req));
    exito(res, null, 'Meta eliminada');
  },
  agregarPaso: async (req, res) =>
    exito(res, await metaService.agregarPaso(req.usuarioId, idDeRuta(req), req.body || {}), 'Paso agregado', 201),
  cambiarPaso: async (req, res) => {
    const hecho = req.body?.hecho !== false;
    exito(res, await metaService.cambiarPaso(req.usuarioId, idDeRuta(req), subIdDeRuta(req), hecho), 'Paso actualizado');
  },
  eliminarPaso: async (req, res) =>
    exito(res, await metaService.eliminarPaso(req.usuarioId, idDeRuta(req), subIdDeRuta(req)), 'Paso eliminado'),
};

const deseos = {
  listar: async (req, res) => exito(res, await deseoService.listar(req.usuarioId)),
  obtener: async (req, res) => exito(res, await deseoService.obtener(req.usuarioId, idDeRuta(req))),
  crear: async (req, res) =>
    exito(res, await deseoService.crear(req.usuarioId, req.body || {}), 'Deseo agregado', 201),
  actualizar: async (req, res) =>
    exito(res, await deseoService.actualizar(req.usuarioId, idDeRuta(req), req.body || {}), 'Deseo actualizado'),
  comprar: async (req, res) => {
    const comprado = req.body?.comprado !== false;
    const resultado = await deseoService.comprar(req.usuarioId, idDeRuta(req), comprado);
    exito(res, resultado, comprado ? 'Marcado como comprado' : 'De vuelta en tu lista');
  },
  eliminar: async (req, res) => {
    await deseoService.eliminar(req.usuarioId, idDeRuta(req));
    exito(res, null, 'Deseo eliminado');
  },
  registrarPrecio: async (req, res) =>
    exito(res, await deseoService.registrarPrecio(req.usuarioId, idDeRuta(req), req.body || {}), 'Precio anotado', 201),
  eliminarPrecio: async (req, res) =>
    exito(res, await deseoService.eliminarPrecio(req.usuarioId, idDeRuta(req), subIdDeRuta(req)), 'Precio eliminado'),
};

const enfoque = {
  registrar: async (req, res) =>
    exito(res, await enfoqueService.registrar(req.usuarioId, req.body || {}), 'Sesión registrada', 201),
};

const resumen = {
  semanal: async (req, res) => exito(res, await estadisticas.resumenSemanal(req.usuarioId)),
};

const logros = {
  listar: async (req, res) => exito(res, await actividad.listarLogros(req.usuarioId)),
};

const notificaciones = {
  listar: async (req, res) => {
    // Aprovecha que el usuario está usando la app para revisar recordatorios pendientes.
    // Si la revisión falla, igual se devuelven las notificaciones.
    await recordatorios.ejecutarSiCorresponde().catch(() => null);
    exito(res, await actividad.listarNotificaciones(req.usuarioId));
  },
  leerTodas: async (req, res) => {
    await actividad.leerTodas(req.usuarioId);
    exito(res, null, 'Notificaciones leídas');
  },
};

module.exports = { auth, categorias, tareas, metas, deseos, enfoque, resumen, logros, notificaciones };
