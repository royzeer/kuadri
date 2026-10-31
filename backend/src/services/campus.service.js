// Campus virtuales: cada usuario conecta el enlace de calendario de su campus
// y Kuadri convierte sus actividades pendientes en tareas.
const campus = require('../models/campus.model');
const categorias = require('../models/categoria.model');
const tareas = require('../models/tarea.model');
const actividad = require('../models/actividad.model');
const calendario = require('./calendario.service');
const env = require('../config/env');
const { cifrar, descifrar } = require('../utils/cifrado');
const { leerEventos, actividadesPendientes } = require('../utils/ical');
const { AppError } = require('../utils/respuesta');
const { texto, idPositivo, lanzarSiHayErrores } = require('../utils/validar');

const MAX_POR_SINCRONIZACION = 100;

async function validar(usuarioId, datos, enlaceObligatorio) {
  const nombre = texto(datos.nombre);
  const enlaceTexto = texto(datos.enlace);
  const enlace = enlaceTexto ? calendario.normalizarEnlace(enlaceTexto) : null;
  const categoriaId = datos.categoriaId ? idPositivo(datos.categoriaId) : null;

  const errores = {};
  if (!nombre || nombre.length > 40) errores.nombre = 'Escribe un nombre de máximo 40 caracteres';
  if (enlaceObligatorio && !enlaceTexto) errores.enlace = 'Pega el enlace del calendario de tu campus';
  else if (enlaceTexto && !enlace) errores.enlace = 'El enlace debe empezar por https:// o webcal://';
  if (datos.categoriaId && !categoriaId) errores.categoriaId = 'Categoría inválida';
  lanzarSiHayErrores(errores);

  if (categoriaId && !(await categorias.buscar(usuarioId, categoriaId))) {
    throw new AppError('Datos inválidos', 422, { categoriaId: 'La categoría no existe' });
  }
  return { nombre, enlace, categoriaId };
}

// Prioridad según lo cerca que está la entrega.
function prioridadPorFecha(fecha, ahora = new Date()) {
  const dias = (fecha - ahora) / (24 * 60 * 60 * 1000);
  if (dias <= 3) return 'alta';
  if (dias <= 10) return 'media';
  return 'baja';
}

function descripcionDe(evento, nombreCampus) {
  const partes = [];
  if (evento.curso) partes.push(`Curso: ${evento.curso}`);
  if (evento.descripcion) partes.push(evento.descripcion);
  if (evento.enlace) partes.push(evento.enlace);
  partes.push(`Traída de ${nombreCampus}`);
  return partes.join('\n\n').slice(0, 2000);
}

// Trae las actividades de un campus. Nunca lanza: guarda el error para mostrarlo en la app.
async function sincronizarConexion(conexion, ahora = new Date()) {
  const resultado = { id: conexion.id, nombre: conexion.nombre, nuevas: 0, actualizadas: 0, error: null };
  try {
    const contenido = await calendario.descargar(descifrar(conexion.enlace_cifrado));
    const pendientes = actividadesPendientes(leerEventos(contenido), ahora).slice(0, MAX_POR_SINCRONIZACION);

    for (const evento of pendientes) {
      if (await campus.reservarEvento(conexion.id, evento.uid)) {
        try {
          const tareaId = await tareas.crear(conexion.usuario_id, {
            categoriaId: conexion.categoria_id,
            titulo: evento.titulo,
            descripcion: descripcionDe(evento, conexion.nombre),
            prioridad: prioridadPorFecha(evento.fecha, ahora),
            fechaLimite: evento.fecha,
          });
          await campus.asignarTarea(conexion.id, evento.uid, tareaId);
          resultado.nuevas += 1;
        } catch (error) {
          await campus.liberarEvento(conexion.id, evento.uid);
          throw error;
        }
      } else if (await campus.actualizarFechaTarea(conexion.id, evento.uid, evento.fecha)) {
        resultado.actualizadas += 1;
      }
    }
  } catch (error) {
    resultado.error = error.message === 'Formato de cifrado desconocido' || error.code === 'ERR_CRYPTO_INVALID_AUTH_TAG'
      ? 'No se pudo leer el enlace guardado. Pégalo de nuevo'
      : error.message;
  }

  await campus.registrarResultado(conexion.id, ahora, resultado.error);
  if (resultado.nuevas > 0) {
    const n = resultado.nuevas;
    await actividad.crearNotificacion(
      conexion.usuario_id,
      'sistema',
      `${conexion.nombre}: ${n} ${n === 1 ? 'actividad nueva' : 'actividades nuevas'} en tus tareas`,
    );
  }
  return resultado;
}

// ¿Ya pasó suficiente tiempo desde la última sincronización automática?
function tocaSincronizar(conexion, ahora, minutos = env.campus.minutosEntreSincronizaciones) {
  if (!conexion.ultima_sincronizacion) return true;
  return ahora - new Date(conexion.ultima_sincronizacion) >= minutos * 60 * 1000;
}

function resumir(resultados) {
  return {
    campus: resultados,
    nuevas: resultados.reduce((s, r) => s + r.nuevas, 0),
    actualizadas: resultados.reduce((s, r) => s + r.actualizadas, 0),
  };
}

// automatica = true: al abrir la app; se salta los campus revisados hace poco.
async function sincronizarUsuario(usuarioId, { automatica = false, ahora = new Date() } = {}) {
  const conexiones = await campus.paraSincronizar(usuarioId);
  const resultados = [];
  for (const c of conexiones) {
    if (!automatica || tocaSincronizar(c, ahora)) resultados.push(await sincronizarConexion(c, ahora));
  }
  return resumir(resultados);
}

// Para el planificador y GitHub Actions: revisa los campus de todos los usuarios.
async function sincronizarTodos(ahora = new Date()) {
  const conexiones = await campus.paraSincronizar();
  const resultados = [];
  for (const c of conexiones) {
    if (tocaSincronizar(c, ahora)) resultados.push(await sincronizarConexion(c, ahora));
  }
  const { nuevas, actualizadas } = resumir(resultados);
  return { revisados: resultados.length, nuevas, actualizadas, conErrores: resultados.filter((r) => r.error).length };
}

const listar = (usuarioId) => campus.listar(usuarioId);

function traducirDuplicado(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ya tienes un campus con ese nombre', 409, { nombre: 'Nombre repetido' });
  }
  throw error;
}

// Antes de guardar, se prueba el enlace: así el usuario sabe de una vez si sirve.
async function probarEnlace(enlace) {
  try {
    leerEventos(await calendario.descargar(enlace));
  } catch (error) {
    throw new AppError('No se pudo leer el calendario', 422, { enlace: error.message });
  }
}

async function crear(usuarioId, datos) {
  const limpios = await validar(usuarioId, datos, true);
  await probarEnlace(limpios.enlace);
  const id = await campus
    .crear(usuarioId, {
      nombre: limpios.nombre,
      enlaceCifrado: cifrar(limpios.enlace),
      dominio: new URL(limpios.enlace).hostname,
      categoriaId: limpios.categoriaId,
    })
    .catch(traducirDuplicado);
  const [conexion] = (await campus.paraSincronizar(usuarioId)).filter((c) => c.id === id);
  const sincronizacion = await sincronizarConexion(conexion);
  return { campus: await campus.buscar(usuarioId, id), sincronizacion };
}

async function actualizar(usuarioId, id, datos) {
  if (!(await campus.buscar(usuarioId, id))) throw new AppError('Campus no encontrado', 404);
  const limpios = await validar(usuarioId, datos, false);
  if (limpios.enlace) await probarEnlace(limpios.enlace);
  await campus
    .actualizar(usuarioId, id, {
      nombre: limpios.nombre,
      enlaceCifrado: limpios.enlace ? cifrar(limpios.enlace) : null,
      dominio: limpios.enlace ? new URL(limpios.enlace).hostname : null,
      categoriaId: limpios.categoriaId,
    })
    .catch(traducirDuplicado);
  return campus.buscar(usuarioId, id);
}

// Las tareas que ya se trajeron se quedan; solo se deja de sincronizar.
async function eliminar(usuarioId, id) {
  if (!(await campus.eliminar(usuarioId, id))) throw new AppError('Campus no encontrado', 404);
}

module.exports = {
  prioridadPorFecha,
  tocaSincronizar,
  sincronizarConexion,
  sincronizarUsuario,
  sincronizarTodos,
  listar,
  crear,
  actualizar,
  eliminar,
};
