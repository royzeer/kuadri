// Sincronización con los campus virtuales (Moodle, Zajuna, Brightspace...).
import { api } from '../api/cliente';

export const EVENTO_CAMPUS = 'kuadri:campus-sincronizado';

// Pide al servidor traer las actividades nuevas. Si llegó algo, avisa a las páginas abiertas.
export async function sincronizarCampus(automatica = false) {
  const resultado = await api.post('/campus/sincronizar', { automatica });
  if (resultado.nuevas > 0 || resultado.actualizadas > 0) {
    window.dispatchEvent(new CustomEvent(EVENTO_CAMPUS, { detail: resultado }));
  }
  return resultado;
}

// Texto corto para mostrar el resultado de una sincronización.
export function resumenSincronizacion({ nuevas = 0, actualizadas = 0, campus = [] }) {
  const errores = campus.filter((c) => c.error);
  if (errores.length > 0) return `${errores[0].nombre}: ${errores[0].error}`;
  if (nuevas === 0 && actualizadas === 0) return 'Todo al día: no hay actividades nuevas';
  const partes = [];
  if (nuevas > 0) partes.push(`${nuevas} ${nuevas === 1 ? 'actividad nueva' : 'actividades nuevas'}`);
  if (actualizadas > 0) partes.push(`${actualizadas} con fecha cambiada`);
  return `Listo: ${partes.join(' y ')}`;
}
