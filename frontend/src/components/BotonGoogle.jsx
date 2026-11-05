// Botón oficial "Entrar con Google" (Google Identity Services).
// Google muestra su ventana, la persona elige su cuenta y aquí llega una credencial
// (ID token) que se envía a la API para verificarla. Si no hay Client ID configurado,
// el botón no aparece y el acceso con correo sigue igual.
import { useEffect, useRef } from 'react';

const URL_SCRIPT = 'https://accounts.google.com/gsi/client';
let cargaScript;

function cargarGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!cargaScript) {
    cargaScript = new Promise((resolver, rechazar) => {
      const script = document.createElement('script');
      script.src = URL_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolver(window.google);
      script.onerror = () => {
        cargaScript = null;
        rechazar(new Error('No se pudo cargar Google'));
      };
      document.head.appendChild(script);
    });
  }
  return cargaScript;
}

export default function BotonGoogle({ texto = 'signin_with', alEntrar, alFallar }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const contenedor = useRef(null);
  // Se guardan en refs para no volver a dibujar el botón en cada render
  const entrar = useRef(alEntrar);
  const fallar = useRef(alFallar);
  useEffect(() => {
    entrar.current = alEntrar;
    fallar.current = alFallar;
  });

  useEffect(() => {
    if (!clientId) return undefined;
    let activo = true;
    cargarGoogle()
      .then((google) => {
        if (!activo || !contenedor.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => entrar.current?.(credential),
          ux_mode: 'popup',
        });
        google.accounts.id.renderButton(contenedor.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: texto,
          logo_alignment: 'center',
          locale: 'es',
          width: Math.min(400, contenedor.current.offsetWidth || 400),
        });
      })
      .catch(() => {
        if (activo) fallar.current?.('No se pudo cargar el botón de Google. Revisa tu conexión.');
      });
    return () => {
      activo = false;
    };
  }, [clientId, texto]);

  if (!clientId) return null;

  return (
    <div className="acceso-google">
      <div className="separador-o" aria-hidden="true">
        <span>o</span>
      </div>
      <div ref={contenedor} className="boton-google" data-testid="boton-google" />
    </div>
  );
}
