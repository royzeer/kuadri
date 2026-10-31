// Detalle de algo del registro de ocio: anotar un rato y ver los ratos anteriores.
import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { claveDia, formatearMinutos } from '../utils/fechas';
import { estadoOcio, tipoOcio } from '../utils/ocio';
import { EstrellasFijas } from './OcioForm';

const fechaCorta = (iso) => new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

export default function OcioDetalle({ ocio, onAnotar, onBorrarRato, onTerminar, onEditar, onEliminar }) {
  const hoy = claveDia(new Date());
  const [minutos, setMinutos] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const tipo = tipoOcio(ocio.tipo);

  async function anotar(e) {
    e.preventDefault();
    const n = Number(minutos);
    if (!Number.isInteger(n) || n < 1 || n > 720) {
      setError('Escribe entre 1 y 720 minutos');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await onAnotar({ minutos: n, fecha });
      setMinutos('');
    } catch (err) {
      setError(err.errores?.minutos || err.errores?.fecha || err.message);
    }
    setGuardando(false);
  }

  return (
    <div className="form">
      <div className="ocio-resumen">
        <span className="ocio-icono">
          <tipo.Icono size={30} aria-hidden="true" />
        </span>
        <div>
          <p className="texto-suave">
            {tipo.texto}
            {ocio.plataforma ? ` · ${ocio.plataforma}` : ''}
          </p>
          <span className="chip">{estadoOcio(ocio.estado)}</span>
        </div>
        <div className="ocio-total">
          <strong>{formatearMinutos(ocio.minutos_total)}</strong>
          <small className="texto-suave">en total</small>
        </div>
      </div>

      {ocio.calificacion && <EstrellasFijas valor={ocio.calificacion} size={20} />}
      {ocio.comentario && <p className="ocio-comentario">{ocio.comentario}</p>}

      <form className="anotar-rato" onSubmit={anotar} noValidate>
        <div className="campo">
          <label htmlFor="minutos-rato">Minutos</label>
          <input id="minutos-rato" type="number" min="1" max="720" inputMode="numeric" className="entrada" value={minutos} onChange={(e) => setMinutos(e.target.value)} placeholder="45" />
        </div>
        <div className="campo">
          <label htmlFor="fecha-rato">Día</label>
          <input id="fecha-rato" type="date" max={hoy} className="entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <button type="submit" className="boton boton-acento" disabled={guardando}>
          {guardando ? 'Anotando...' : 'Anotar rato'}
        </button>
      </form>
      {error && <span className="error-campo">{error}</span>}

      {ocio.ratos.length > 0 && (
        <ul className="ratos">
          {ocio.ratos.map((r) => (
            <li key={r.id}>
              <span>{fechaCorta(r.fecha)}</span>
              <strong>{formatearMinutos(r.minutos)}</strong>
              <button type="button" className="paso-quitar" onClick={() => onBorrarRato(r)} aria-label={`Borrar el rato de ${formatearMinutos(r.minutos)}`}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="meta-acciones">
        {ocio.estado !== 'terminado' && (
          <button type="button" className="boton boton-primario" onClick={onTerminar}>
            <Check size={16} strokeWidth={3} />
            Lo terminé
          </button>
        )}
        <button type="button" className="boton boton-icono" onClick={onEditar} aria-label="Editar">
          <Pencil size={16} />
        </button>
        <button type="button" className="boton boton-icono" onClick={onEliminar} aria-label="Eliminar">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
