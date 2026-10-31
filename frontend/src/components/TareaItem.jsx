import { Check, Pencil, Trash2 } from 'lucide-react';
import { describirLimite } from '../utils/fechas';

const TEXTO_PRIORIDAD = { alta: 'Prioridad alta', media: 'Prioridad media', baja: 'Prioridad baja' };

// Una tarea como renglón de cuaderno, con casilla para completar y botones de editar y eliminar.
export default function TareaItem({ tarea, onCompletar, onEditar, onEliminar }) {
  const limite = describirLimite(tarea.fecha_limite);
  return (
    <li className={`tarea ${tarea.completada ? 'completada' : ''}`}>
      <button
        type="button"
        className="tarea-check"
        onClick={() => onCompletar(tarea)}
        aria-label={tarea.completada ? `Marcar "${tarea.titulo}" como pendiente` : `Completar "${tarea.titulo}"`}
        aria-pressed={Boolean(tarea.completada)}
      >
        {Boolean(tarea.completada) && <Check size={18} strokeWidth={3.2} />}
      </button>
      <div className="tarea-info">
        <div className="tarea-titulo">{tarea.titulo}</div>
        <div className="tarea-meta">
          {tarea.categoria_nombre && (
            <span>
              <i className="punto" style={{ '--color': tarea.categoria_color }} aria-hidden="true" />
              {tarea.categoria_nombre}
            </span>
          )}
          <span className={!tarea.completada && limite.vencida ? 'vencida' : 'texto-suave'}>{limite.texto}</span>
          {tarea.prioridad !== 'media' && (
            <span className={tarea.prioridad === 'alta' ? 'prioridad-alta' : 'texto-suave'}>
              {TEXTO_PRIORIDAD[tarea.prioridad]}
            </span>
          )}
        </div>
      </div>
      {(onEditar || onEliminar) && (
        <div className="tarea-acciones">
          {onEditar && (
            <button type="button" className="boton" onClick={() => onEditar(tarea)} aria-label={`Editar "${tarea.titulo}"`}>
              <Pencil size={16} />
            </button>
          )}
          {onEliminar && (
            <button type="button" className="boton" onClick={() => onEliminar(tarea)} aria-label={`Eliminar "${tarea.titulo}"`}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </li>
  );
}
