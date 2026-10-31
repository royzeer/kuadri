// Tarea automática: trae las actividades de los campus virtuales de todos los usuarios.
// Corre cada hora mientras el servidor está despierto. Cuando Render lo duerme,
// GitHub Actions lo despierta y llama a /api/campus/sincronizar-todos.
const cron = require('node-cron');
const env = require('../config/env');
const campusService = require('../services/campus.service');

let enCurso = null;

// Si ya hay una sincronización general corriendo, se espera esa misma.
function ejecutar(ahora = new Date()) {
  if (!enCurso) {
    enCurso = campusService.sincronizarTodos(ahora).finally(() => {
      enCurso = null;
    });
  }
  return enCurso;
}

function iniciar() {
  const tarea = cron.schedule(env.campus.cron, () => {
    ejecutar().catch((e) => console.error('Error al sincronizar los campus:', e.message));
  });
  console.log(`Sincronización de campus activa (${env.campus.cron})`);
  return tarea;
}

module.exports = { ejecutar, iniciar };
