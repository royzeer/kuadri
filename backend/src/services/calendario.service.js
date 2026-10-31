// Descarga el calendario de un campus virtual a partir del enlace que pegó el usuario.
const net = require('net');

const TAMANO_MAXIMO = 3 * 1024 * 1024; // 3 MB
const ESPERA_MAXIMA = 20000; // 20 segundos
const MAX_REDIRECCIONES = 3;

// Solo se permiten sitios públicos por https: nunca direcciones internas del servidor.
function esDestinoPermitido(url) {
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (net.isIP(host)) return false;
  if (host === 'localhost' || !host.includes('.')) return false;
  return !/\.(local|localhost|internal|lan|home)$/.test(host);
}

// Limpia el enlace pegado por el usuario. Devuelve la URL lista o null si no sirve.
// - webcal:// (Brightspace, Google) se cambia por https://
// - En Moodle se pide "todos los cursos" y "eventos recientes y próximos 60 días"
function normalizarEnlace(valor) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto || texto.length > 1000) return null;
  let url;
  try {
    url = new URL(texto.replace(/^webcals?:\/\//i, 'https://'));
  } catch {
    return null;
  }
  if (!esDestinoPermitido(url)) return null;
  if (url.pathname.endsWith('/calendar/export_execute.php')) {
    url.searchParams.set('preset_what', 'all');
    url.searchParams.set('preset_time', 'recentupcoming');
  }
  return url.toString();
}

// Lee el cuerpo sin pasar del tamaño máximo.
async function leerTexto(respuesta) {
  const lector = respuesta.body.getReader();
  const partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.length;
    if (total > TAMANO_MAXIMO) {
      await lector.cancel();
      throw new Error('El calendario es demasiado grande');
    }
    partes.push(value);
  }
  return Buffer.concat(partes).toString('utf8');
}

async function descargar(enlace) {
  let url = new URL(enlace);
  for (let i = 0; i <= MAX_REDIRECCIONES; i += 1) {
    if (!esDestinoPermitido(url)) throw new Error('El enlace apunta a un sitio no permitido');
    let respuesta;
    try {
      respuesta = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(ESPERA_MAXIMA),
        headers: { Accept: 'text/calendar, */*', 'User-Agent': 'Kuadri/1.0 (calendario)' },
      });
    } catch {
      throw new Error('No se pudo conectar con el campus');
    }
    if (respuesta.status >= 300 && respuesta.status < 400 && respuesta.headers.get('location')) {
      url = new URL(respuesta.headers.get('location'), url);
      continue;
    }
    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new Error('El campus rechazó el enlace. Cópialo de nuevo desde tu calendario');
    }
    if (!respuesta.ok) throw new Error(`El campus respondió con un error (${respuesta.status})`);
    return leerTexto(respuesta);
  }
  throw new Error('El enlace redirige demasiadas veces');
}

module.exports = { normalizarEnlace, esDestinoPermitido, descargar };
