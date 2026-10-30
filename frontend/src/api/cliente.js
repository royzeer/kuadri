// Cliente HTTP de la API. Agrega el token automáticamente y unifica el manejo de errores.
const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const CLAVE_TOKEN = 'kuadri_token';

export function obtenerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function guardarToken(token) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Si el navegador bloquea el almacenamiento, la sesión dura solo mientras la página esté abierta.
  }
}

// Error con el detalle por campo que envía la API (para mostrarlo en los formularios).
export class ErrorApi extends Error {
  constructor(mensaje, estado, errores = {}) {
    super(mensaje);
    this.estado = estado;
    this.errores = errores;
  }
}

async function peticion(metodo, ruta, cuerpo) {
  const token = obtenerToken();
  let respuesta;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor', 0);
  }

  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || json.ok === false) {
    if (respuesta.status === 401 && token) {
      guardarToken(null);
      window.dispatchEvent(new Event('kuadri:sesion-expirada'));
    }
    throw new ErrorApi(json.mensaje || 'Ocurrió un error', respuesta.status, json.data?.errores || {});
  }
  return json.data;
}

export const api = {
  get: (ruta) => peticion('GET', ruta),
  post: (ruta, cuerpo) => peticion('POST', ruta, cuerpo),
  put: (ruta, cuerpo) => peticion('PUT', ruta, cuerpo),
  patch: (ruta, cuerpo) => peticion('PATCH', ruta, cuerpo),
  delete: (ruta) => peticion('DELETE', ruta),
};
