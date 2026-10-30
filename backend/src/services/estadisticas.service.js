const actividad = require('../models/actividad.model');
const { aTextoDia, sumarDias, ultimosDias } = require('../utils/fechas');

/**
 * Calcula la racha a partir de los días activos (regla RN01 y RN02).
 * - actual: días consecutivos que terminan hoy o ayer.
 * - mejor: la racha más larga de toda la historia.
 * Es una función pura: no consulta la base de datos, por eso es fácil de probar.
 *
 * @param {string[]} dias Días activos 'YYYY-MM-DD' (en cualquier orden, pueden repetirse).
 * @param {string} hoy Día actual 'YYYY-MM-DD'.
 */
function calcularRacha(dias, hoy) {
  const unicos = [...new Set(dias)].sort(); // del más antiguo al más reciente
  if (unicos.length === 0) return { actual: 0, mejor: 0 };

  // Mejor racha histórica
  let mejor = 1;
  let tramo = 1;
  for (let i = 1; i < unicos.length; i += 1) {
    tramo = sumarDias(unicos[i - 1], 1) === unicos[i] ? tramo + 1 : 1;
    if (tramo > mejor) mejor = tramo;
  }

  // Racha actual: se cuenta hacia atrás desde hoy (o desde ayer si hoy aún no hay actividad)
  const conjunto = new Set(unicos);
  let cursor = conjunto.has(hoy) ? hoy : sumarDias(hoy, -1);
  let actual = 0;
  while (conjunto.has(cursor)) {
    actual += 1;
    cursor = sumarDias(cursor, -1);
  }

  return { actual, mejor };
}

// Resumen de los últimos 7 días para el panel y la pantalla de estadísticas.
async function resumenSemanal(usuarioId, ahora = new Date()) {
  const hoy = aTextoDia(ahora);
  const dias = ultimosDias(hoy, 7);
  const desde = new Date(`${dias[0]}T00:00:00`);

  const [minutos, tareas, activos, tot] = await Promise.all([
    actividad.minutosPorDia(usuarioId, desde),
    actividad.tareasPorDia(usuarioId, desde),
    actividad.diasActivos(usuarioId),
    actividad.totales(usuarioId),
  ]);

  const minutosMap = Object.fromEntries(minutos.map((f) => [f.dia, Number(f.minutos)]));
  const tareasMap = Object.fromEntries(tareas.map((f) => [f.dia, Number(f.tareas)]));

  const semana = dias.map((dia) => ({
    dia,
    minutos: minutosMap[dia] || 0,
    tareas: tareasMap[dia] || 0,
  }));

  return {
    semana,
    racha: calcularRacha(activos, hoy),
    totales: tot,
    minutosSemana: semana.reduce((s, d) => s + d.minutos, 0),
    tareasSemana: semana.reduce((s, d) => s + d.tareas, 0),
  };
}

module.exports = { calcularRacha, resumenSemanal };
