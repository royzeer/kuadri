// Lector sencillo de calendarios iCalendar (.ics), el formato que exportan Moodle,
// Zajuna, Brightspace y casi todos los campus virtuales. Solo lee lo que Kuadri necesita.

// Une las líneas "dobladas": en iCal una línea larga sigue en la siguiente si empieza con espacio.
function desdoblar(texto) {
  return String(texto)
    .replace(/\r\n/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n');
}

function desescapar(valor) {
  return valor.replace(/\\([\\,;nN])/g, (_m, c) => (c === 'n' || c === 'N' ? '\n' : c));
}

// "DTSTART;TZID=America/Bogota:20261105T235900" -> { nombre, parametros, valor }
function leerPropiedad(linea) {
  const dosPuntos = linea.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  if (dosPuntos < 0) return null;
  const [nombre, ...partes] = linea.slice(0, dosPuntos).split(';');
  const parametros = {};
  for (const p of partes) {
    const [clave, ...resto] = p.split('=');
    parametros[clave.toUpperCase()] = resto.join('=').replace(/^"|"$/g, '');
  }
  return { nombre: nombre.toUpperCase(), parametros, valor: linea.slice(dosPuntos + 1) };
}

// Diferencia en milisegundos entre una zona horaria y UTC en un instante dado.
function desfase(instante, zona) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  );
  const comoUtc = Date.UTC(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute, partes.second);
  return comoUtc - instante.getTime();
}

// Convierte una fecha iCal a Date. Las fechas sin hora (todo el día) vencen a las 11:59 p. m.
function leerFecha(propiedad) {
  if (!propiedad) return null;
  const m = propiedad.valor.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, a, mes, d, h, mi, s, utc] = m;
  const n = (v) => Number(v);
  if (h === undefined) return new Date(n(a), n(mes) - 1, n(d), 23, 59, 0);
  if (utc) return new Date(Date.UTC(n(a), n(mes) - 1, n(d), n(h), n(mi), n(s)));

  const zona = propiedad.parametros.TZID;
  if (zona) {
    try {
      const aproximado = new Date(Date.UTC(n(a), n(mes) - 1, n(d), n(h), n(mi), n(s)));
      return new Date(aproximado.getTime() - desfase(aproximado, zona));
    } catch {
      // Zona desconocida: se usa la hora local del servidor
    }
  }
  return new Date(n(a), n(mes) - 1, n(d), n(h), n(mi), n(s));
}

// Devuelve los eventos del calendario con sus propiedades principales.
function leerEventos(texto) {
  const lineas = desdoblar(texto);
  if (!lineas.some((l) => l.trim().toUpperCase() === 'BEGIN:VCALENDAR')) {
    throw new Error('El enlace no devolvió un calendario');
  }

  const eventos = [];
  let actual = null;
  for (const linea of lineas) {
    const limpia = linea.trim();
    if (limpia.toUpperCase() === 'BEGIN:VEVENT') {
      actual = {};
    } else if (limpia.toUpperCase() === 'END:VEVENT') {
      if (actual) eventos.push(actual);
      actual = null;
    } else if (actual) {
      const p = leerPropiedad(limpia);
      // Si una propiedad se repite, se queda la primera
      if (p && !actual[p.nombre]) actual[p.nombre] = p;
    }
  }

  return eventos.map((e) => ({
    uid: e.UID ? e.UID.valor.trim() : null,
    titulo: e.SUMMARY ? desescapar(e.SUMMARY.valor).trim() : '',
    descripcion: e.DESCRIPTION ? desescapar(e.DESCRIPTION.valor).trim() : '',
    curso: e.CATEGORIES
      ? desescapar(e.CATEGORIES.valor.split(/(?<!\\),/)[0]).trim()
      : e.LOCATION
        ? desescapar(e.LOCATION.valor).trim()
        : '',
    enlace: e.URL ? e.URL.valor.trim() : '',
    fecha: leerFecha(e.DTEND && !e.DTSTART ? e.DTEND : e.DTSTART),
    cancelado: e.STATUS ? e.STATUS.valor.trim().toUpperCase() === 'CANCELLED' : false,
  }));
}

// Eventos que solo avisan que algo "abre" o "comienza" no son entregas pendientes.
const ES_APERTURA = /\b(abre|se abre|abierto|opens|opened|inicia|comienza|empieza|disponible desde|apertura)\b/i;
const ES_CIERRE = /\b(vence|vencimiento|cierra|se cierra|closes|due|entrega|l[ií]mite|pendiente)\b/i;

// Quita del título las frases que agrega el campus ("... vence", "... is due").
function limpiarTitulo(titulo) {
  const limpio = titulo
    .replace(/^(vencimiento|fecha de entrega|fecha l[ií]mite|entrega|cierre)\s*(de|:|-)\s*/i, '')
    .replace(/^(se cierra|cierra|vence)\s*:?\s+/i, '')
    .replace(/\s*[-:]?\s*(is due|due|vence|se vence|cierra|se cierra|closes|debe entregarse|est[aá] pendiente)\.?\s*$/i, '')
    .trim();
  return (limpio || titulo).slice(0, 150);
}

// Decide qué eventos son actividades pendientes y los deja listos para crear tareas.
function actividadesPendientes(eventos, ahora = new Date(), diasAdelante = 120) {
  const limite = new Date(ahora.getTime() + diasAdelante * 24 * 60 * 60 * 1000);
  return eventos
    .filter((e) => e.uid && e.titulo && e.fecha && !e.cancelado)
    .filter((e) => e.fecha >= ahora && e.fecha <= limite)
    .filter((e) => !(ES_APERTURA.test(e.titulo) && !ES_CIERRE.test(e.titulo)))
    .map((e) => ({ ...e, uid: e.uid.slice(0, 255), titulo: limpiarTitulo(e.titulo) }))
    .sort((a, b) => a.fecha - b.fecha);
}

module.exports = { leerEventos, actividadesPendientes, limpiarTitulo, leerFecha };
