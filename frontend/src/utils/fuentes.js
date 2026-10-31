// Carga fuentes de Google Fonts por su nombre para ver cómo se ven dentro de la app.

// Mismo formato que acepta la API: letras, números, espacios y guiones.
const NOMBRE_VALIDO = /^[A-Za-z0-9][A-Za-z0-9 -]*$/;

export function nombreValido(nombre) {
  const limpio = (nombre || '').trim().replace(/\s+/g, ' ');
  return limpio.length > 0 && limpio.length <= 60 && NOMBRE_VALIDO.test(limpio);
}

// 'Space Grotesk' -> https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap
export function urlFuente(nombre) {
  const familia = nombre.trim().replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${familia}:wght@400;700&display=swap`;
}

// Pila de fuentes para el estilo en línea; si la fuente no carga se ve la del sistema.
export const familiaCss = (nombre) => (nombre ? `'${nombre}', system-ui, sans-serif` : undefined);

// Agrega la hoja de estilos una sola vez por fuente.
export function cargarFuente(nombre) {
  if (!nombreValido(nombre) || typeof document === 'undefined') return;
  const id = `fuente-${nombre.trim().replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const enlace = document.createElement('link');
  enlace.id = id;
  enlace.rel = 'stylesheet';
  enlace.href = urlFuente(nombre);
  document.head.appendChild(enlace);
}
