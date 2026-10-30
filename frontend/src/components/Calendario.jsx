// Vista de calendario mensual de las tareas (RF08).
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { celdasDelMes, claveDia, NOMBRES_DIAS } from '../utils/fechas';

export default function Calendario({ tareas, onSeleccionar }) {
  const hoy = new Date();
  const [mes, setMes] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });

  const celdas = useMemo(() => celdasDelMes(mes.anio, mes.mes), [mes]);

  // Agrupa las tareas por día para pintarlas rápido
  const porDia = useMemo(() => {
    const grupos = {};
    tareas
      .filter((t) => t.fecha_limite)
      .forEach((t) => {
        const clave = claveDia(t.fecha_limite);
        (grupos[clave] ||= []).push(t);
      });
    return grupos;
  }, [tareas]);

  const mover = (delta) =>
    setMes(({ anio, mes: m }) => {
      const f = new Date(anio, m + delta, 1);
      return { anio: f.getFullYear(), mes: f.getMonth() };
    });

  const nombreMes = new Date(mes.anio, mes.mes, 1).toLocaleDateString('es-CO', { month: 'long' });
  const titulo = `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${mes.anio}`;
  const claveHoy = claveDia(hoy);

  return (
    <div className="calendario">
      <div className="calendario-cabeza">
        <button type="button" className="boton boton-icono" onClick={() => mover(-1)} aria-label="Mes anterior">
          <ChevronLeft />
        </button>
        <h2>{titulo}</h2>
        <button type="button" className="boton boton-icono" onClick={() => mover(1)} aria-label="Mes siguiente">
          <ChevronRight />
        </button>
      </div>
      <div className="calendario-rejilla">
        {NOMBRES_DIAS.map((d) => (
          <div key={d} className="calendario-dia-semana">
            {d}
          </div>
        ))}
        {celdas.map((c) => (
          <div
            key={c.clave}
            className={`calendario-dia ${c.delMes ? '' : 'otro-mes'} ${c.clave === claveHoy ? 'hoy' : ''}`}
          >
            <span className="numero-dia">{c.fecha.getDate()}</span>
            {(porDia[c.clave] || []).map((t) => (
              <button
                type="button"
                key={t.id}
                className={`evento ${t.completada ? 'hecho' : ''}`}
                style={{ '--color': t.categoria_color || undefined }}
                onClick={() => onSeleccionar(t)}
                title={t.titulo}
              >
                <span>{t.titulo}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
