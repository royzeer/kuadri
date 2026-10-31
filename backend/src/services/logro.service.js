const actividad = require('../models/actividad.model');
const { calcularRacha } = require('./estadisticas.service');
const { aTextoDia } = require('../utils/fechas');

// Reglas de los logros (RN04). Cada regla recibe el estado del usuario y dice si se cumple.
const REGLAS = {
  PRIMER_PASO: (e) => e.tareasCompletadas >= 1,
  RACHA_3: (e) => e.mejorRacha >= 3,
  RACHA_7: (e) => e.mejorRacha >= 7,
  TAREAS_10: (e) => e.tareasCompletadas >= 10,
  ENFOQUE_300: (e) => e.minutosEnfoque >= 300,
  MADRUGADOR: (e) => e.tareasMadrugada >= 1,
  META_1: (e) => e.metasCumplidas >= 1,
  PACIENTE: (e) => e.deseosEnObjetivo >= 1,
  CREATIVO: (e) => e.paletas >= 1,
  EQUILIBRADO: (e) => e.ocioTerminado >= 1,
};

// Función pura: devuelve los códigos de logros cuyas condiciones se cumplen.
function logrosCumplidos(estado) {
  return Object.keys(REGLAS).filter((codigo) => REGLAS[codigo](estado));
}

// Revisa el estado del usuario, otorga los logros nuevos y crea una notificación por cada uno.
async function revisar(usuarioId, ahora = new Date()) {
  const [tot, dias] = await Promise.all([
    actividad.totales(usuarioId),
    actividad.diasActivos(usuarioId),
  ]);
  const racha = calcularRacha(dias, aTextoDia(ahora));
  const estado = { ...tot, mejorRacha: racha.mejor };

  const nuevos = [];
  for (const codigo of logrosCumplidos(estado)) {
    if (await actividad.otorgarLogro(usuarioId, codigo)) nuevos.push(codigo);
  }

  if (nuevos.length > 0) {
    const catalogo = await actividad.listarLogros(usuarioId);
    for (const codigo of nuevos) {
      const logro = catalogo.find((l) => l.codigo === codigo);
      await actividad.crearNotificacion(usuarioId, 'logro', `Logro desbloqueado: ${logro.nombre}`);
    }
    return catalogo.filter((l) => nuevos.includes(l.codigo));
  }
  return [];
}

module.exports = { REGLAS, logrosCumplidos, revisar };
