// Modo claro / oscuro.
// La primera vez se sigue lo que diga el sistema (prefers-color-scheme).
// Si la persona elige un tema, se guarda en localStorage y se respeta siempre.
// index.html repite una versión corta de temaInicial() para que la página
// no parpadee en blanco antes de que cargue React.
import { useSyncExternalStore } from 'react';

export const CLAVE_TEMA = 'kuadri-tema';
// Color de la barra del navegador y de la app instalada (meta theme-color)
export const COLOR_BARRA = { claro: '#141414', oscuro: '#101010' };

const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';
const oyentes = new Set();

function sistemaOscuro() {
  try {
    return Boolean(window.matchMedia?.(CONSULTA_OSCURO)?.matches);
  } catch {
    return false;
  }
}

// 'claro' | 'oscuro' | null (null = seguir al sistema)
export function eleccionGuardada() {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return valor === 'claro' || valor === 'oscuro' ? valor : null;
  } catch {
    return null;
  }
}

export function temaInicial() {
  return eleccionGuardada() || (sistemaOscuro() ? 'oscuro' : 'claro');
}

export function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', COLOR_BARRA[tema]);
  oyentes.forEach((avisar) => avisar());
}

// eleccion: 'claro' | 'oscuro' | 'sistema'
export function elegirTema(eleccion) {
  try {
    if (eleccion === 'sistema') localStorage.removeItem(CLAVE_TEMA);
    else localStorage.setItem(CLAVE_TEMA, eleccion);
  } catch {
    // Sin almacenamiento (modo privado): el tema solo dura esta visita
  }
  aplicarTema(eleccion === 'sistema' ? (sistemaOscuro() ? 'oscuro' : 'claro') : eleccion);
}

export function temaActual() {
  return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
}

// Se llama una vez en main.jsx: aplica el tema y, mientras la persona no
// haya elegido uno, sigue los cambios del sistema (por ejemplo, al anochecer).
export function iniciarTema() {
  aplicarTema(temaInicial());
  try {
    window.matchMedia?.(CONSULTA_OSCURO)?.addEventListener?.('change', () => {
      if (!eleccionGuardada()) aplicarTema(sistemaOscuro() ? 'oscuro' : 'claro');
    });
  } catch {
    // Navegadores viejos sin matchMedia: se queda el tema inicial
  }
}

function suscribir(avisar) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

// Una sola cadena para que React note el cambio aunque solo cambie la elección
function foto() {
  return `${temaActual()}|${eleccionGuardada() || 'sistema'}`;
}

// Para los componentes: devuelve { tema, eleccion } y se actualiza al cambiar
export function useTema() {
  const [tema, eleccion] = useSyncExternalStore(suscribir, foto, () => 'claro|sistema').split('|');
  return { tema, eleccion };
}
