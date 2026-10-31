// Estadísticas semanales, racha y logros (CU09, CU10).
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../api/cliente';
import { Encabezado } from '../components/Layout';
import Icono from '../components/Icono';
import { diaCorto, formatearMinutos } from '../utils/fechas';


function GraficoBarras({ semana, campo, sufijo }) {
  const maximo = Math.max(1, ...semana.map((d) => d[campo]));
  return (
    <div className="grafico" role="img" aria-label={semana.map((d) => `${diaCorto(d.dia)}: ${d[campo]} ${sufijo}`).join(', ')}>
      {semana.map((d, i) => (
        <div key={d.dia} className="barra-columna">
          <span className="barra-valor">{d[campo] || ''}</span>
          <div
            className={`barra ${i === semana.length - 1 ? 'hoy' : ''}`}
            style={{ height: `${(d[campo] / maximo) * 150}px` }}
          />
          <span className="barra-dia">{diaCorto(d.dia)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Progreso() {
  const [resumen, setResumen] = useState(null);
  const [logros, setLogros] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/estadisticas/resumen'), api.get('/logros')])
      .then(([r, l]) => {
        setResumen(r);
        setLogros(l);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alerta">{error}</div>;
  if (!resumen) return <p>Cargando...</p>;

  const obtenidos = logros.filter((l) => l.obtenido_en).length;

  return (
    <>
      <Encabezado titulo="Tu progreso" subtitulo="Los últimos 7 días, tu racha y tus logros." />

      <section className="metricas">
        <div className="metrica">
          <span className="metrica-valor">{resumen.racha.actual}</span>
          <span className="metrica-etiqueta">días de racha actual</span>
        </div>
        <div className="metrica">
          <span className="metrica-valor">{resumen.racha.mejor}</span>
          <span className="metrica-etiqueta">días en tu mejor racha</span>
        </div>
        <div className="metrica">
          <span className="metrica-valor">{formatearMinutos(resumen.minutosSemana)}</span>
          <span className="metrica-etiqueta">de enfoque esta semana</span>
        </div>
        <div className="metrica">
          <span className="metrica-valor">{resumen.tareasSemana}</span>
          <span className="metrica-etiqueta">tareas completadas esta semana</span>
        </div>
      </section>

      <section className="seccion">
        <h2 style={{ marginBottom: 14 }}>Minutos de enfoque por día</h2>
        <GraficoBarras semana={resumen.semana} campo="minutos" sufijo="minutos" />
      </section>

      <section className="seccion">
        <h2 style={{ marginBottom: 14 }}>Tareas completadas por día</h2>
        <GraficoBarras semana={resumen.semana} campo="tareas" sufijo="tareas" />
      </section>

      <section className="seccion">
        <div className="seccion-titulo">
          <h2>Logros</h2>
          <span className="chip">
            {obtenidos} de {logros.length} desbloqueados
          </span>
        </div>
        <div className="logros">
          {logros.map((l) => (
            <div key={l.id} className={`logro ${l.obtenido_en ? '' : 'bloqueado'}`}>
              <span className="logro-sticker">
                {l.obtenido_en ? <Icono nombre={l.icono} size={36} /> : <Lock size={28} />}
              </span>
              <h3>{l.nombre}</h3>
              <p>{l.descripcion}</p>
              {l.obtenido_en && (
                <small style={{ fontWeight: 700 }}>{new Date(l.obtenido_en).toLocaleDateString('es-CO')}</small>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
