// Interruptor de modo claro / oscuro (va en el encabezado de cada página).
import { Moon, Sun } from 'lucide-react';
import { elegirTema, useTema } from '../utils/tema';

export default function BotonTema() {
  const { tema } = useTema();
  const oscuro = tema === 'oscuro';
  return (
    <button
      type="button"
      className="boton boton-icono"
      onClick={() => elegirTema(oscuro ? 'claro' : 'oscuro')}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
    >
      {oscuro ? <Sun size={21} aria-hidden="true" /> : <Moon size={21} aria-hidden="true" />}
    </button>
  );
}
