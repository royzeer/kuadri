// Detalle de un deseo: gráfica del precio, anotar el precio de hoy e historial.
import { useState } from 'react';
import { ExternalLink, Pencil, ShoppingBag, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { formatearPesos, puntosGrafico } from '../utils/dinero';

const ANCHO = 320;
const ALTO = 120;

export function GraficoPrecios({ historial, objetivo }) {
  if (historial.length < 2) {
    return <p className="vacio">Anota el precio dos veces o más para ver la gráfica.</p>;
  }
  const puntos = puntosGrafico(historial, ANCHO, ALTO);
  const precios = historial.map((p) => p.precio);
  const max = Math.max(...precios);
  const min = Math.min(...precios);
  // Línea punteada del objetivo, solo si cae dentro del rango de la gráfica
  const yObjetivo = objetivo !== null && objetivo >= min && objetivo <= max && max !== min
    ? 10 + ((max - objetivo) / (max - min)) * (ALTO - 20)
    : null;

  return (
    <div className="grafico-precios">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={`Precios anotados: ${precios.map(formatearPesos).join(', ')}`}>
        {yObjetivo !== null && <line x1="0" x2={ANCHO} y1={yObjetivo} y2={yObjetivo} className="linea-objetivo" />}
        <polyline points={puntos.map((p) => `${p.x},${p.y}`).join(' ')} className="linea-precio" />
        {puntos.map((p, i) => (
          <circle key={historial[i].id} cx={p.x} cy={p.y} r={i === puntos.length - 1 ? 6 : 4} className="punto-precio" />
        ))}
      </svg>
      <div className="grafico-precios-pie">
        <span>Máx. {formatearPesos(max)}</span>
        <span>Mín. {formatearPesos(min)}</span>
      </div>
    </div>
  );
}

export default function DeseoDetalle({ deseo, onAnotar, onBorrarPrecio, onComprar, onEditar, onEliminar }) {
  const [precio, setPrecio] = useState('');
  const [tienda, setTienda] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function anotar(e) {
    e.preventDefault();
    if (!(Number(precio) > 0)) {
      setError('Escribe un precio mayor que cero');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await onAnotar({ precio: Number(precio), tienda: tienda.trim() || null });
      setPrecio('');
    } catch (err) {
      setError(err.errores?.precio || err.message);
    }
    setGuardando(false);
  }

  const comprado = Boolean(deseo.comprado_en);
  const historialReciente = [...deseo.historial].reverse();

  return (
    <div className="form">
      <div className="deseo-resumen">
        <div>
          <span className="etiqueta texto-suave">Precio de hoy</span>
          <div className="deseo-precio">{formatearPesos(deseo.precio_actual)}</div>
          {deseo.tendencia && deseo.tendencia !== 'igual' && (
            <span className={`tendencia ${deseo.tendencia}`}>
              {deseo.tendencia === 'baja' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {deseo.tendencia === 'baja' ? 'Bajó' : 'Subió'} {formatearPesos(Math.abs(deseo.diferencia))}
            </span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="etiqueta texto-suave">Quieres pagar</span>
          <div className="deseo-objetivo">{formatearPesos(deseo.precio_objetivo)}</div>
          {deseo.enObjetivo && <span className="chip">Llegó a tu precio</span>}
        </div>
      </div>

      <GraficoPrecios historial={deseo.historial} objetivo={deseo.precio_objetivo} />

      {!comprado && (
        <form className="anotar-precio" onSubmit={anotar} noValidate>
          <input
            className="entrada"
            type="number"
            inputMode="numeric"
            min="1"
            step="any"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Precio"
            aria-label="Precio que viste hoy"
          />
          <input
            className="entrada"
            value={tienda}
            onChange={(e) => setTienda(e.target.value)}
            placeholder="Tienda"
            aria-label="Tienda"
            maxLength={60}
          />
          <button type="submit" className="boton boton-primario" disabled={guardando}>
            Anotar precio
          </button>
        </form>
      )}
      {error && <span className="error-campo">{error}</span>}

      {historialReciente.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 8 }}>Historial</h3>
          <ul className="historial-precios">
            {historialReciente.map((p) => (
              <li key={p.id}>
                <span className="historial-fecha">{new Date(p.registrado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                <span className="historial-tienda">{p.tienda || ''}</span>
                <strong>{formatearPesos(p.precio)}</strong>
                <button type="button" className="paso-quitar" onClick={() => onBorrarPrecio(p)} aria-label={`Borrar el precio ${formatearPesos(p.precio)}`}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="deseo-acciones">
        {deseo.enlace && (
          <a className="boton" href={deseo.enlace} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} /> Ver en la tienda
          </a>
        )}
        <button type="button" className={`boton ${comprado ? '' : 'boton-acento'}`} onClick={onComprar}>
          <ShoppingBag size={16} /> {comprado ? 'Devolver a la lista' : 'Ya lo compré'}
        </button>
        <button type="button" className="boton boton-icono" onClick={onEditar} aria-label="Editar deseo">
          <Pencil size={16} />
        </button>
        <button type="button" className="boton boton-icono boton-peligro" onClick={onEliminar} aria-label="Eliminar deseo">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
