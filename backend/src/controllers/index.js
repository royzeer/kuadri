// Controladores: reciben la petición, llaman al servicio y responden.
// No contienen reglas de negocio; esas viven en /services.
const authService = require('../services/auth.service');
const categoriaService = require('../services/categoria.service');
const tareaService = require('../services/tarea.service');
const enfoqueService = require('../services/enfoque.service');
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

module.exports = { auth, categorias, tareas, enfoque, resumen, logros, notificaciones };
