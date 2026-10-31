// Lista de deseos con seguimiento de precios anotados a mano.
import { useCallback, useEffect, useState } from 'react';
import { Gift, Plus } from 'lucide-react';
import { api } from '../api/cliente';
import { anunciarLogros, useAviso } from '../components/AvisoContext';
import { Encabezado } from '../components/Layout';
import Modal from '../components/Modal';
import DeseoForm from '../components/DeseoForm';
import DeseoDetalle from '../components/DeseoDetalle';
import { estadoPrecio, formatearPesos } from '../utils/dinero';

function DeseoTarjeta({ deseo, onAbrir }) {
  const estado = estadoPrecio(deseo);
  const [sinFoto, setSinFoto] = useState(false);
  return (
    <button type="button" className={`deseo ${deseo.comprado_en ? 'comprado' : ''}`} onClick={() => onAbrir(deseo)}>
      <div className="deseo-foto">
        {deseo.imagen && !sinFoto ? (
          <img src={deseo.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setSinFoto(true)} />
        ) : (
          <Gift size={38} aria-hidden="true" />
        )}
        {deseo.prioridad === 'alta' && <span className="chip deseo-prioridad">Prioridad alta</span>}
      </div>
      <div className="deseo-cuerpo">
        <span className="deseo-nombre">{deseo.nombre}</span>
        <span className="deseo-precio">{formatearPesos(deseo.precio_actual)}</span>
        <span className={estado.listo ? 'chip' : 'texto-suave deseo-estado'}>
          {deseo.comprado_en ? 'Comprado' : estado.texto}
        </span>
      </div>
    </button>
  );
}

export default function Deseos() {
  const mostrarAviso = useAviso();
  const [deseos, setDeseos] = useState([]);
  const [vista, setVista] = useState('pendientes');
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo, deseo = editar
  const [abierto, setAbierto] = useState(null); // detalle con historial
  const [error, setError] = useState('');

  const cargar = useCallback(() => api.get('/deseos').then(setDeseos).catch((e) => setError(e.message)), []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function abrir(deseo) {
    try {
      setAbierto(await api.get(`/deseos/${deseo.id}`));
    } catch (e) {
      setError(e.message);
    }
  }

  async function guardar(datos) {
    const { deseo, nuevosLogros } = editando?.id
      ? await api.put(`/deseos/${editando.id}`, datos)
      : await api.post('/deseos', datos);
    anunciarLogros(mostrarAviso, nuevosLogros);
    setEditando(null);
    if (abierto) setAbierto(deseo);
    cargar();
  }

  async function anotar(datos) {
    const { deseo, nuevosLogros } = await api.post(`/deseos/${abierto.id}/precios`, datos);
    if (nuevosLogros.length > 0) anunciarLogros(mostrarAviso, nuevosLogros);
    else if (deseo.enObjetivo && !abierto.enObjetivo) mostrarAviso(`"${deseo.nombre}" llegó a tu precio`);
    setAbierto(deseo);
    cargar();
  }

  async function borrarPrecio(precio) {
    if (!window.confirm(`¿Borrar el precio ${formatearPesos(precio.precio)}?`)) return;
    setAbierto(await api.delete(`/deseos/${abierto.id}/precios/${precio.id}`));
    cargar();
  }

  async function comprar() {
    setAbierto(await api.patch(`/deseos/${abierto.id}/comprar`, { comprado: !abierto.comprado_en }));
    cargar();
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar "${abierto.nombre}" de tu lista?`)) return;
    await api.delete(`/deseos/${abierto.id}`);
    setAbierto(null);
    cargar();
  }

  const pendientes = deseos.filter((d) => !d.comprado_en);
  const comprados = deseos.filter((d) => d.comprado_en);
  const visibles = vista === 'pendientes' ? pendientes : comprados;
  const enObjetivo = pendientes.filter((d) => estadoPrecio(d).listo).length;

  return (
    <>
      <Encabezado titulo="Deseos" subtitulo="Lo que quieres comprar y cuánto cuesta.">
        <button type="button" className="boton boton-primario" onClick={() => setEditando({})} aria-label="Nuevo deseo">
          <Plus size={20} strokeWidth={3} />
          <span>Nuevo</span>
        </button>
      </Encabezado>

      {error && <div className="alerta" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="filtros">
        <div className="pestanas" role="group" aria-label="Deseos">
          <button type="button" aria-pressed={vista === 'pendientes'} onClick={() => setVista('pendientes')}>
            Por comprar ({pendientes.length})
          </button>
          <button type="button" aria-pressed={vista === 'comprados'} onClick={() => setVista('comprados')}>
            Comprados ({comprados.length})
          </button>
        </div>
        {vista === 'pendientes' && enObjetivo > 0 && (
          <span className="chip" style={{ alignSelf: 'center' }}>
            {enObjetivo === 1 ? '1 llegó a tu precio' : `${enObjetivo} llegaron a tu precio`}
          </span>
        )}
      </div>

      {visibles.length === 0 ? (
        <p className="vacio">
          {vista === 'pendientes' ? 'Tu lista está vacía. Agrega algo que quieras con el botón Nuevo.' : 'Aún no has comprado nada de tu lista.'}
        </p>
      ) : (
        <div className="rejilla-deseos">
          {visibles.map((d) => (
            <DeseoTarjeta key={d.id} deseo={d} onAbrir={abrir} />
          ))}
        </div>
      )}

      {abierto && !editando && (
        <Modal titulo={abierto.nombre} onCerrar={() => setAbierto(null)}>
          <DeseoDetalle
            deseo={abierto}
            onAnotar={anotar}
            onBorrarPrecio={borrarPrecio}
            onComprar={comprar}
            onEditar={() => setEditando(abierto)}
            onEliminar={eliminar}
          />
        </Modal>
      )}

      {editando && (
        <Modal titulo={editando.id ? 'Editar deseo' : 'Nuevo deseo'} onCerrar={() => setEditando(null)}>
          <DeseoForm deseo={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />
        </Modal>
      )}
    </>
  );
}
