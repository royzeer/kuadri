import { useEffect } from 'react';
import { X } from 'lucide-react';

// Ventana modal accesible: se cierra con Escape o haciendo clic fuera.
export default function Modal({ titulo, onCerrar, children }) {
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  return (
    <div className="fondo-modal" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="tarjeta modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
        <div className="modal-cabeza">
          <h2 id="titulo-modal">{titulo}</h2>
          <button type="button" className="boton boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
