// Tarea automática (CU06): genera recordatorios de las entregas próximas.
const cron = require('node-cron');
const env = require('../config/env');
const tareas = require('../models/tarea.model');
const actividad = require('../models/actividad.model');
const correo = require('../services/correo.service');

async function ejecutar(ahora = new Date()) {
  const hasta = new Date(ahora.getTime() + env.recordatorios.horasAntes * 60 * 60 * 1000);
  const pendientes = await tareas.pendientesPorRecordar(ahora, hasta);

  let enviados = 0;
  for (const t of pendientes) {
    try {
      await actividad.crearNotificacion(t.usuario_id, 'recordatorio', `Se acerca la entrega: ${t.titulo}`);
      if (t.avisos_correo) {
        // Si el correo falla (por ejemplo, Resend lo rechaza), el aviso dentro de la app ya quedó
        // creado. Se marca la tarea como recordada igual, para no repetir el aviso cada 15 minutos.
        try {
          await correo.enviar(
            t.correo,
            `Recordatorio: ${t.titulo}`,
            correo.plantillaRecordatorio(t.nombre, t.titulo, t.fecha_limite),
          );
        } catch (error) {
          console.error(`No se pudo enviar el correo de la tarea ${t.id}:`, error.message);
        }
      }
      await tareas.marcarRecordada(t.id);
      enviados += 1;
    } catch (error) {
      // Si falla una tarea, se sigue con las demás y se reintenta en la próxima ejecución.
      console.error(`Error al recordar la tarea ${t.id}:`, error.message);
    }
  }
  return { revisadas: pendientes.length, enviados };
}

// En servicios gratuitos el servidor se "duerme" cuando nadie lo usa, y mientras duerme
// el planificador no corre. Por eso los recordatorios también se revisan cuando alguien
// usa la app, pero como máximo una vez cada pocos minutos para no recargar la base de datos.
let ultimaRevision = 0;
let enCurso = null;

async function ejecutarSiCorresponde(ahora = new Date()) {
  const espera = env.recordatorios.minutosEntreRevisiones * 60 * 1000;
  if (enCurso) return enCurso; // si ya hay una revisión corriendo, se espera esa misma
  if (ahora.getTime() - ultimaRevision < espera) return null;
  ultimaRevision = ahora.getTime();
  enCurso = ejecutar(ahora).finally(() => {
    enCurso = null;
  });
  return enCurso;
}

// Solo para pruebas: permite forzar una nueva revisión inmediata.
function reiniciarEspera() {
  ultimaRevision = 0;
}

function iniciar() {
  const tarea = cron.schedule(env.recordatorios.cron, () => {
    ejecutar().catch((e) => console.error('Error en el planificador de recordatorios:', e.message));
  });
  console.log(`Planificador de recordatorios activo (${env.recordatorios.cron})`);
  // Revisión inmediata al arrancar (por ejemplo, cuando el servidor se despierta)
  ejecutarSiCorresponde().catch((e) => console.error('Error al revisar recordatorios:', e.message));
  return tarea;
}

module.exports = { ejecutar, ejecutarSiCorresponde, reiniciarEspera, iniciar };
