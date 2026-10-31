// Ayudas para instalar Kuadri en la pantalla principal del celular.

export const CLAVE_AVISO_CERRADO = 'kuadri-aviso-app-cerrado';

let eventoGuardado = null;
const oyentes = new Set();

function avisar() {
  oyentes.forEach((fn) => fn(eventoGuardado));
}

// Chrome en Android dispara "beforeinstallprompt" cuando la app se puede instalar.
// Se guarda el evento para mostrar la ventana de instalación cuando la persona toque "Instalar".
export function escucharInstalacion() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoGuardado = e;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    eventoGuardado = null;
    guardarCerrado();
    avisar();
  });
}

export function eventoInstalacion() {
  return eventoGuardado;
}

export function suscribirInstalacion(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

// Muestra la ventana de instalación del navegador. Devuelve true si la persona aceptó.
export async function pedirInstalacion() {
  if (!eventoGuardado) return false;
  const evento = eventoGuardado;
  eventoGuardado = null;
  avisar();
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome === 'accepted';
}

// Solo teléfonos: iPhone o Android con "Mobile" (las tabletas Android no lo llevan).
export function tipoTelefono(agente = navigator.userAgent) {
  if (/iPhone|iPod/i.test(agente)) return 'ios';
  if (/Android/i.test(agente) && /Mobile/i.test(agente)) return 'android';
  return null;
}

// True si Kuadri ya se abrió como app instalada (desde el icono de la pantalla principal).
export function yaInstalada() {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
  return Boolean(standalone || window.navigator.standalone);
}

export function avisoCerrado() {
  try {
    return localStorage.getItem(CLAVE_AVISO_CERRADO) === '1';
  } catch {
    return false;
  }
}

export function guardarCerrado() {
  try {
    localStorage.setItem(CLAVE_AVISO_CERRADO, '1');
  } catch {
    // Sin almacenamiento (modo privado): el aviso solo se oculta por esta vez
  }
}
