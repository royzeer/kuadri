// Aviso "Ten Kuadri como app": solo en teléfonos, con los pasos para agregarla a la pantalla principal.
// No aparece en computador, si ya está instalada o si la persona lo cerró antes.
import { useEffect, useState } from 'react';
import { Download, EllipsisVertical, Share, SquarePlus, X } from 'lucide-react';
import {
  avisoCerrado,
  eventoInstalacion,
  guardarCerrado,
  pedirInstalacion,
  suscribirInstalacion,
  tipoTelefono,
  yaInstalada,
} from '../utils/instalar';
import Logo from './Logo';

function PasosIphone() {
  return (
    <ol className="aviso-app-pasos">
      <li>
        Abre Kuadri en <strong>Safari</strong> y toca el botón <strong>Compartir</strong>{' '}
        <Share size={16} aria-label="(cuadro con flecha hacia arriba)" />. Si no lo ves, toca primero los tres puntos{' '}
        <strong>···</strong> de la barra de abajo.
      </li>
      <li>
        Baja y toca <strong>Agregar a pantalla de inicio</strong> <SquarePlus size={16} aria-hidden="true" />.
      </li>
      <li>
        Toca <strong>Agregar</strong> arriba a la derecha. Listo, Kuadri queda con su icono.
      </li>
    </ol>
  );
}

function PasosAndroid() {
  return (
    <ol className="aviso-app-pasos">
      <li>
        Toca los tres puntos <EllipsisVertical size={16} aria-label="(menú)" /> arriba a la derecha de Chrome.
      </li>
      <li>
        Toca <strong>Agregar a la pantalla principal</strong> o <strong>Instalar aplicación</strong>.
      </li>
      <li>
        Toca <strong>Instalar</strong>. Listo, Kuadri queda con su icono.
      </li>
    </ol>
  );
}

export default function AvisoApp({ conBarra = false }) {
  const [telefono] = useState(() => tipoTelefono());
  const [visible, setVisible] = useState(() => Boolean(telefono) && !yaInstalada() && !avisoCerrado());
  const [evento, setEvento] = useState(() => eventoInstalacion());
  const [verPasos, setVerPasos] = useState(false);

  useEffect(
    () =>
      suscribirInstalacion((e) => {
        setEvento(e);
        if (!e && avisoCerrado()) setVisible(false);
      }),
    [],
  );

  if (!visible) return null;

  function cerrar() {
    guardarCerrado();
    setVisible(false);
  }

  async function instalar() {
    if (await pedirInstalacion()) cerrar();
  }

  // En Android con Chrome basta un toque; en iPhone (o si el navegador no lo permite) se muestran los pasos
  const botonDirecto = telefono === 'android' && evento;

  return (
    <aside className={`aviso-app ${conBarra ? 'con-barra' : ''}`} aria-label="Instalar Kuadri">
      <button type="button" className="aviso-app-cerrar" onClick={cerrar} aria-label="Cerrar aviso">
        <X size={18} />
      </button>
      <div className="aviso-app-cabeza">
        <span className="aviso-app-logo">
          <Logo conTexto={false} />
        </span>
        <div>
          <strong>Ten Kuadri como app</strong>
          <p>Ábrela desde tu pantalla principal, sin buscarla en el navegador.</p>
        </div>
      </div>
      {verPasos && (telefono === 'ios' ? <PasosIphone /> : <PasosAndroid />)}
      {botonDirecto ? (
        <button type="button" className="boton boton-acento boton-bloque" onClick={instalar}>
          <Download size={18} aria-hidden="true" />
          Instalar
        </button>
      ) : (
        !verPasos && (
          <button type="button" className="boton boton-acento boton-bloque" onClick={() => setVerPasos(true)}>
            Ver cómo hacerlo
          </button>
        )
      )}
    </aside>
  );
}
