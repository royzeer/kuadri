// Panel principal: resumen del día, creación rápida, semana en cuadros, categorías y próximas tareas.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { api } from '../api/cliente';
import { useAuth } from '../context/AuthContext';
import { anunciarLogros, useAviso } from '../components/AvisoContext';
import { Encabezado } from '../components/Layout';
import Icono from '../components/Icono';
import TareaItem from '../components/TareaItem';
import { claveDia, diaCorto, formatearMinutos, nivelDia, saludo } from '../utils/fechas';
import { colorTexto } from '../utils/color';

// Frase de resumen según lo que hay pendiente
function resumenDelDia(tareas) {
  if (tareas.length === 0) return 'No tienes pendientes. Buen momento para planear la semana.';
  const hoy = claveDia(new Date());
  const paraHoy = tareas.filter((t) => t.fecha_limite && claveDia(t.fecha_limite) === hoy).length;
  const total = `Tienes ${tareas.length} ${tareas.length === 1 ? 'pendiente' : 'pendientes'}`;
  if (paraHoy === 0) return `${total} y nada vence hoy.`;
  return `${total}; ${paraHoy === 1 ? 'una vence' : `${paraHoy} vencen`} hoy.`;
}

export default function Inicio() {
  const { usuario } = useAuth();
  const mostrarAviso = useAviso();
  const navegar = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [rapida, setRapida] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [cats, pendientes, res] = await Promise.all([
        api.get('/categorias'),
        api.get('/tareas?estado=pendientes'),
        api.get('/estadisticas/resumen'),
      ]);
      setCategorias(cats);
      setTareas(pendientes);
      setResumen(res);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearRapida(e) {
    e.preventDefault();
    if (!rapida.trim()) return;
    try {
      await api.post('/tareas', { titulo: rapida.trim() });
      setRapida('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function completar(tarea) {
    const { nuevosLogros } = await api.patch(`/tareas/${tarea.id}/completar`, { completada: true });
    anunciarLogros(mostrarAviso, nuevosLogros);
    cargar();
  }

  const nombre = usuario?.nombre?.split(' ')[0] || '';

  return (
    <>
      <Encabezado
        titulo={
          <>
            {saludo()}, <span className="resaltado">{nombre}</span>.
          </>
        }
        subtitulo={resumenDelDia(tareas)}
      />

      {error && <div className="alerta" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={crearRapida} className="rapida">
        <span className="rapida-casilla" aria-hidden="true" />
        <label htmlFor="rapida" className="oculto-visual">
          Nueva tarea rápida
        </label>
        <input
          id="rapida"
          placeholder="Anota algo pendiente..."
          value={rapida}
          onChange={(e) => setRapida(e.target.value)}
          maxLength={150}
        />
        <button type="submit" className="boton boton-primario">
          <Plus size={18} strokeWidth={3} /> Anotar
        </button>
      </form>

      {resumen && (
        <section className="seccion" aria-labelledby="titulo-semana">
          <div className="seccion-titulo">
            <h2 id="titulo-semana">Tu semana en cuadros</h2>
            <span className="texto-suave" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {formatearMinutos(resumen.minutosSemana)} de enfoque
            </span>
          </div>
          <div className="semana">
            <div className="racha">
              <span className="racha-numero">{resumen.racha.actual}</span>
              <span className="racha-texto">{resumen.racha.actual === 1 ? 'día seguido' : 'días seguidos'}</span>
            </div>
            <div className="semana-cuadros">
              {resumen.semana.map((d, i) => {
                const nivel = nivelDia(d);
                const esHoy = i === resumen.semana.length - 1;
                return (
                  <div key={d.dia} className={`cuadro-dia ${esHoy ? 'hoy' : ''}`}>
                    <span
                      className="caja"
                      data-nivel={nivel}
                      title={`${formatearMinutos(d.minutos)} de enfoque, ${d.tareas} tareas`}
                    >
                      {nivel > 0 && <Check size={20} strokeWidth={3.2} color="#141414" />}
                    </span>
                    <small>{esHoy ? 'Hoy' : diaCorto(d.dia)}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="seccion">
        <div className="seccion-titulo">
          <h2>Categorías</h2>
          <Link to="/ajustes" className="enlace">
            Editar
          </Link>
        </div>
        <div className="cuadros-categorias">
          {categorias.map((c) => (
            <button
              type="button"
              key={c.id}
              className="cuadro-cat"
              style={{ '--color-cat': c.color, '--texto-cat': colorTexto(c.color) }}
              onClick={() => navegar(`/tareas?categoria=${c.id}`)}
              aria-label={`${c.nombre}: ${c.pendientes} pendientes`}
            >
              <span className="cuadro-cat-icono">
                <Icono nombre={c.icono} size={20} />
              </span>
              <span>
                <span className="cuadro-cat-numero">{c.pendientes}</span>
                <span className="cuadro-cat-pendientes"> {c.pendientes === 1 ? 'pendiente' : 'pendientes'}</span>
              </span>
              <span className="cuadro-cat-nombre">{c.nombre}</span>
            </button>
          ))}
          <Link to="/ajustes" className="cuadro-cat cuadro-cat-nuevo">
            <span>
              <Plus size={26} strokeWidth={3} aria-hidden="true" />
              <br />
              Nueva categoría
            </span>
          </Link>
        </div>
      </section>

      <section className="seccion">
        <div className="seccion-titulo">
          <h2>Lo que viene</h2>
          <Link to="/tareas" className="enlace">
            Ver todas
          </Link>
        </div>
        {tareas.length === 0 ? (
          <p className="vacio">Nada pendiente por ahora. Anota tu próxima tarea arriba.</p>
        ) : (
          <ul className="lista-tareas">
            {tareas.slice(0, 5).map((t) => (
              <TareaItem key={t.id} tarea={t} onCompletar={completar} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
