// Temporizador de enfoque (CU08). El tiempo se ve llenando una cuadrícula de 50 cuadritos.
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Square } from 'lucide-react';
import { api } from '../api/cliente';
import { anunciarLogros, useAviso } from '../components/AvisoContext';
import { Encabezado } from '../components/Layout';
import { formatearMinutos } from '../utils/fechas';

const DURACIONES = [15, 25, 50, 90];
const CELDAS = 50;

function aReloj(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Enfoque() {
  const mostrarAviso = useAviso();
  const [duracion, setDuracion] = useState(25);
  const [restante, setRestante] = useState(25 * 60);
  const [corriendo, setCorriendo] = useState(false);
  const [tareaId, setTareaId] = useState('');
  const [tareas, setTareas] = useState([]);
  const [minutosHoy, setMinutosHoy] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const fin = useRef(null); // momento exacto en que termina la sesión

  const cargarHoy = () =>
    api
      .get('/estadisticas/resumen')
      .then((r) => setMinutosHoy(r.semana.at(-1).minutos))
      .catch(() => {});

  useEffect(() => {
    api.get('/tareas?estado=pendientes').then(setTareas).catch(() => {});
    cargarHoy();
  }, []);

  // Se calcula con la hora real (no restando 1 cada segundo) para que no se desfase.
  useEffect(() => {
    if (!corriendo) return undefined;
    const intervalo = setInterval(() => {
      const segundos = Math.max(0, Math.round((fin.current - Date.now()) / 1000));
      setRestante(segundos);
      if (segundos === 0) {
        setCorriendo(false);
        guardar(duracion);
      }
    }, 250);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);

  // Muestra el tiempo en la pestaña del navegador
  useEffect(() => {
    document.title = corriendo ? `${aReloj(restante)} - Kuadri` : 'Kuadri';
    return () => {
      document.title = 'Kuadri';
    };
  }, [corriendo, restante]);

  async function guardar(minutos) {
    try {
      const { nuevosLogros } = await api.post('/enfoque', { minutos, tareaId: tareaId ? Number(tareaId) : null });
      setMensaje(`Sesión guardada: ${formatearMinutos(minutos)} de enfoque.`);
      anunciarLogros(mostrarAviso, nuevosLogros);
      cargarHoy();
    } catch (e) {
      setMensaje(e.message);
    }
    setRestante(duracion * 60);
  }

  function iniciar() {
    setMensaje('');
    fin.current = Date.now() + restante * 1000;
    setCorriendo(true);
  }

  function elegir(min) {
    setDuracion(min);
    setRestante(min * 60);
    setCorriendo(false);
  }

  function reiniciar() {
    setCorriendo(false);
    setRestante(duracion * 60);
  }

  // Terminar antes de tiempo: se guardan los minutos completos que ya pasaron.
  function terminarAhora() {
    setCorriendo(false);
    const minutos = Math.floor((duracion * 60 - restante) / 60);
    if (minutos >= 1) guardar(minutos);
    else {
      setMensaje('La sesión duró menos de un minuto, no se guardó.');
      setRestante(duracion * 60);
    }
  }

  const total = duracion * 60;
  const empezada = restante !== total;
  const progreso = (total - restante) / total;
  const llenas = Math.floor(progreso * CELDAS);

  return (
    <>
      <Encabezado titulo="Enfoque" subtitulo={`Hoy llevas ${formatearMinutos(minutosHoy)} de estudio.`} />

      <div className="enfoque">
        <section className="tarjeta panel-reloj" aria-label="Temporizador">
          <div className="reloj-tiempo" role="timer">
            {aReloj(restante)}
          </div>
          <p className="reloj-estado">
            {corriendo ? 'Concentrado. Cada cuadrito es un paso.' : empezada ? 'En pausa' : 'Listo para empezar'}
          </p>

          <div className="rejilla-enfoque" aria-hidden="true">
            {Array.from({ length: CELDAS }, (_, i) => (
              <span
                key={i}
                className={`celda ${i < llenas ? 'llena' : ''} ${corriendo && i === llenas ? 'actual' : ''}`}
              />
            ))}
          </div>

          <div className="controles-reloj">
            {corriendo ? (
              <button type="button" className="boton" onClick={() => setCorriendo(false)}>
                <Pause size={19} /> Pausar
              </button>
            ) : (
              <button type="button" className="boton boton-primario" onClick={iniciar}>
                <Play size={19} /> {empezada ? 'Continuar' : 'Empezar'}
              </button>
            )}
            {empezada && (
              <>
                <button type="button" className="boton boton-verde" onClick={terminarAhora}>
                  <Square size={17} /> Terminar
                </button>
                <button type="button" className="boton boton-icono" onClick={reiniciar} aria-label="Reiniciar">
                  <RotateCcw size={19} />
                </button>
              </>
            )}
          </div>

          {mensaje && (
            <p role="status" style={{ marginTop: 18, fontWeight: 700 }}>
              {mensaje}
            </p>
          )}
        </section>

        <aside className="tarjeta form">
          <div>
            <h2 style={{ marginBottom: 12 }}>Duración</h2>
            <div className="duraciones" role="group" aria-label="Duración">
              {DURACIONES.map((m) => (
                <button
                  type="button"
                  key={m}
                  className="boton"
                  aria-pressed={duracion === m}
                  onClick={() => elegir(m)}
                  disabled={corriendo}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>
          <div className="campo">
            <label htmlFor="tarea-enfoque">¿En qué vas a trabajar?</label>
            <select
              id="tarea-enfoque"
              className="entrada"
              value={tareaId}
              onChange={(e) => setTareaId(e.target.value)}
              disabled={corriendo}
            >
              <option value="">Sin tarea específica</option>
              {tareas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>
          </div>
          <p className="texto-suave" style={{ fontSize: '0.88rem' }}>
            Al terminar, la sesión suma a tus estadísticas y a tu racha.
          </p>
        </aside>
      </div>
    </>
  );
}
