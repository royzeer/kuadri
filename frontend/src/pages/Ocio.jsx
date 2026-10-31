// Registro de ocio: lo que disfrutas en tu tiempo libre y cuánto tiempo le dedicas.
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/cliente';
import { anunciarLogros, useAviso } from '../components/AvisoContext';
import { Encabezado } from '../components/Layout';
import Modal from '../components/Modal';
import OcioForm, { EstrellasFijas } from '../components/OcioForm';
import OcioDetalle from '../components/OcioDetalle';
import { formatearMinutos } from '../utils/fechas';
import { ESTADOS_OCIO, TIPOS_OCIO, estadoOcio, tipoOcio } from '../utils/ocio';

function OcioTarjeta({ item, onAbrir }) {
  const tipo = tipoOcio(item.tipo);
  return (
    <button type="button" className={`ocio-tarjeta estado-${item.estado}`} onClick={() => onAbrir(item)}>
      <span className="ocio-icono">
        <tipo.Icono size={26} aria-hidden="true" />
      </span>
      <span className="ocio-titulo">{item.titulo}</span>
      <span className="ocio-datos">
        {tipo.texto}
        {item.plataforma ? ` · ${item.plataforma}` : ''}
      </span>
      <span className="ocio-pie">
        <span className="chip">{estadoOcio(item.estado)}</span>
        {item.minutos_total > 0 && <strong>{formatearMinutos(item.minutos_total)}</strong>}
      </span>
      {item.calificacion && <EstrellasFijas valor={item.calificacion} />}
    </button>
  );
}

export default function Ocio() {
  const mostrarAviso = useAviso();
  const [lista, setLista] = useState([]);
  const [estado, setEstado] = useState('en_curso');
  const [tipo, setTipo] = useState('');
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo, item = editar
  const [abierto, setAbierto] = useState(null); // detalle con los ratos
  const [error, setError] = useState('');

  const cargar = useCallback(() => api.get('/ocio').then(setLista).catch((e) => setError(e.message)), []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function abrir(item) {
    try {
      setAbierto(await api.get(`/ocio/${item.id}`));
    } catch (e) {
      setError(e.message);
    }
  }

  async function guardar(datos) {
    const { ocio, nuevosLogros } = editando?.id ? await api.put(`/ocio/${editando.id}`, datos) : await api.post('/ocio', datos);
    anunciarLogros(mostrarAviso, nuevosLogros);
    setEditando(null);
    if (abierto) setAbierto(ocio);
    setEstado(ocio.estado); // muestra la lista donde quedó
    cargar();
  }

  async function terminar() {
    const { titulo, tipo: t, calificacion, plataforma, comentario } = abierto;
    const { ocio, nuevosLogros } = await api.put(`/ocio/${abierto.id}`, {
      titulo,
      tipo: t,
      estado: 'terminado',
      calificacion,
      plataforma,
      comentario,
    });
    anunciarLogros(mostrarAviso, nuevosLogros);
    setAbierto(ocio);
    cargar();
  }

  async function anotar(datos) {
    setAbierto(await api.post(`/ocio/${abierto.id}/ratos`, datos));
    cargar();
  }

  async function borrarRato(rato) {
    if (!window.confirm(`¿Borrar el rato de ${formatearMinutos(rato.minutos)}?`)) return;
    setAbierto(await api.delete(`/ocio/${abierto.id}/ratos/${rato.id}`));
    cargar();
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar "${abierto.titulo}" de tu ocio?`)) return;
    await api.delete(`/ocio/${abierto.id}`);
    setAbierto(null);
    cargar();
  }

  const delTipo = tipo ? lista.filter((o) => o.tipo === tipo) : lista;
  const visibles = delTipo.filter((o) => o.estado === estado);

  return (
    <>
      <Encabezado titulo="Ocio" subtitulo="Lo que disfrutas cuando no estudias.">
        <button type="button" className="boton boton-primario" onClick={() => setEditando({})} aria-label="Agregar a mi ocio">
          <Plus size={20} strokeWidth={3} />
          <span>Nuevo</span>
        </button>
      </Encabezado>

      {error && <div className="alerta" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="filtros">
        <div className="pestanas pestanas-desliza" role="group" aria-label="Estado">
          {ESTADOS_OCIO.map((e) => (
            <button key={e.valor} type="button" aria-pressed={estado === e.valor} onClick={() => setEstado(e.valor)}>
              {e.texto} ({delTipo.filter((o) => o.estado === e.valor).length})
            </button>
          ))}
        </div>
        <select className="entrada" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value="">Todos los tipos</option>
          {TIPOS_OCIO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.texto}
            </option>
          ))}
        </select>
      </div>

      {visibles.length === 0 ? (
        <p className="vacio">
          {lista.length === 0
            ? 'Anota aquí el juego, la serie o el libro que tienes entre manos con el botón Nuevo.'
            : 'No hay nada en esta lista.'}
        </p>
      ) : (
        <div className="rejilla-ocio">
          {visibles.map((o) => (
            <OcioTarjeta key={o.id} item={o} onAbrir={abrir} />
          ))}
        </div>
      )}

      {abierto && !editando && (
        <Modal titulo={abierto.titulo} onCerrar={() => setAbierto(null)}>
          <OcioDetalle
            ocio={abierto}
            onAnotar={anotar}
            onBorrarRato={borrarRato}
            onTerminar={terminar}
            onEditar={() => setEditando(abierto)}
            onEliminar={eliminar}
          />
        </Modal>
      )}

      {editando && (
        <Modal titulo={editando.id ? 'Editar' : 'Agregar a mi ocio'} onCerrar={() => setEditando(null)}>
          <OcioForm ocio={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />
        </Modal>
      )}
    </>
  );
}
