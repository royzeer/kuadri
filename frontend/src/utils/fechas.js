// Utilidades de fechas para la interfaz (funciones puras, fáciles de probar).

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const NOMBRES_DIAS = DIAS_CORTOS;

export function claveDia(fecha) {
  const f = new Date(fecha);
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${m}-${d}`;
}

// Devuelve las 42 celdas (6 semanas) del calendario de un mes, empezando en lunes.
export function celdasDelMes(anio, mes) {
  const primero = new Date(anio, mes, 1);
  const desfase = (primero.getDay() + 6) % 7; // lunes = 0
  const inicio = new Date(anio, mes, 1 - desfase);
  return Array.from({ length: 42 }, (_, i) => {
    const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    return { fecha, clave: claveDia(fecha), delMes: fecha.getMonth() === mes };
  });
}

// Texto amigable para la fecha límite: "Hoy 3:00 p. m.", "Mañana", "Vencida"...
export function describirLimite(fechaLimite, ahora = new Date()) {
  if (!fechaLimite) return { texto: 'Sin fecha', vencida: false };
  const limite = new Date(fechaLimite);
  const hora = limite.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  const hoy = claveDia(ahora);
  const manana = claveDia(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1));
  const clave = claveDia(limite);

  if (limite < ahora) return { texto: `Vencida (${limite.toLocaleDateString('es-CO')})`, vencida: true };
  if (clave === hoy) return { texto: `Hoy, ${hora}`, vencida: false };
  if (clave === manana) return { texto: `Mañana, ${hora}`, vencida: false };
  return {
    texto: limite.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + `, ${hora}`,
    vencida: false,
  };
}

// Convierte una fecha ISO al formato que usa <input type="datetime-local">.
export function aValorInput(fechaIso) {
  if (!fechaIso) return '';
  const f = new Date(fechaIso);
  const p = (n) => String(n).padStart(2, '0');
  return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}T${p(f.getHours())}:${p(f.getMinutes())}`;
}

export function formatearMinutos(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function diaCorto(claveYmd) {
  const [a, m, d] = claveYmd.split('-').map(Number);
  return DIAS_CORTOS[(new Date(a, m - 1, d).getDay() + 6) % 7];
}

// Intensidad de color de un día en "Tu semana en cuadros" (0 = sin actividad, 3 = una hora o más).
export function nivelDia({ minutos, tareas }) {
  if (minutos >= 60) return 3;
  if (minutos >= 30) return 2;
  if (minutos > 0 || tareas > 0) return 1;
  return 0;
}

export function saludo(ahora = new Date()) {
  const h = ahora.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
