// Gestión de tareas (CU04) con vista de lista y de calendario (CU05).
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, List, Plus } from 'lucide-react';
import { api } from '../api/cliente';
import { anunciarLogros, useAviso } from '../components/AvisoContext';
import { Encabezado } from '../components/Layout';
import Modal from '../components/Modal';
import TareaForm from '../components/TareaForm';
import TareaItem from '../components/TareaItem';
import Calendario from '../components/Calendario';

export default function Tareas() {
  const mostrarAviso = useAviso();
  const [parametros, setParametros] = useSearchParams();
  const [tareas, setTareas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [vista, setVista] = useState('lista');
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nueva, tarea = editar
  const [error, setError] = useState('');

  const filtros = {
    estado: parametros.get('estado') || 'pendientes',
    categoria: parametros.get('categoria') || '',
    prioridad: parametros.get('prioridad') || '',
  };

  const cargar = useCallback(async () => {
    try {
      const consulta = new URLSearchParams();
      // En el calendario se muestran pendientes y completadas
      if (vista === 'lista' && filtros.estado !== 'todas') consulta.set('estado', filtros.estado);
      if (filtros.categoria) consulta.set('categoria', filtros.categoria);
      if (filtros.prioridad) consulta.set('prioridad', filtros.prioridad);
      setTareas(await api.get(`/tareas?${consulta}`));
    } catch (e) {
      setError(e.message);
    }
  }, [vista, filtros.estado, filtros.categoria, filtros.prioridad]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    api.get('/categorias').then(setCategorias).catch(() => {});
  }, []);

  function cambiarFiltro(nombre, valor) {
    const nuevos = new URLSearchParams(parametros);
    if (valor) nuevos.set(nombre, valor);
    else nuevos.delete(nombre);
    setParametros(nuevos);
  }

  async function guardar(datos) {
    if (editando?.id) await api.put(`/tareas/${editando.id}`, datos);
    else await api.post('/tareas', datos);
    setEditando(null);
    cargar();
  }

  async function alternarCompletada(tarea) {
    const { nuevosLogros } = await api.patch(`/tareas/${tarea.id}/completar`, { completada: !tarea.completada });
    anunciarLogros(mostrarAviso, nuevosLogros);
    cargar();
  }

  async function eliminar(tarea) {
    if (!window.confirm(`¿Eliminar "${tarea.titulo}"?`)) return;
    await api.delete(`/tareas/${tarea.id}`);
    cargar();
  }

  return (
    <>
      <Encabezado titulo="Tareas" subtitulo="Tus entregas, parciales y pendientes.">
        <button type="button" className="boton boton-primario" onClick={() => setEditando({})} aria-label="Nueva tarea">
          <Plus size={20} strokeWidth={3} />
          <span>Nueva</span>
        </button>
      </Encabezado>

      {error && <div className="alerta" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="filtros">
        <div className="pestanas" role="group" aria-label="Vista">
          <button type="button" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')}>
            <List size={18} /> Lista
          </button>
          <button type="button" aria-pressed={vista === 'calendario'} onClick={() => setVista('calendario')}>
            <Calendar size={18} /> Calendario
          </button>
        </div>

        {vista === 'lista' && (
          <select
            className="entrada"
            aria-label="Estado"
            value={filtros.estado}
            onChange={(e) => cambiarFiltro('estado', e.target.value)}
          >
            <option value="pendientes">Pendientes</option>
            <option value="completadas">Completadas</option>
            <option value="todas">Todas</option>
          </select>
        )}
        <select
          className="entrada"
          aria-label="Categoría"
          value={filtros.categoria}
          onChange={(e) => cambiarFiltro('categoria', e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          className="entrada"
          aria-label="Prioridad"
          value={filtros.prioridad}
          onChange={(e) => cambiarFiltro('prioridad', e.target.value)}
        >
          <option value="">Cualquier prioridad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {vista === 'calendario' ? (
        <Calendario tareas={tareas} onSeleccionar={setEditando} />
      ) : tareas.length === 0 ? (
        <p className="vacio">No hay tareas con estos filtros.</p>
      ) : (
        <ul className="lista-tareas">
          {tareas.map((t) => (
            <TareaItem
              key={t.id}
              tarea={t}
              onCompletar={alternarCompletada}
              onEditar={setEditando}
              onEliminar={eliminar}
            />
          ))}
        </ul>
      )}

      {editando && (
        <Modal titulo={editando.id ? 'Editar tarea' : 'Nueva tarea'} onCerrar={() => setEditando(null)}>
          <TareaForm
            tarea={editando.id ? editando : { categoria_id: filtros.categoria ? Number(filtros.categoria) : null }}
            categorias={categorias}
            onGuardar={guardar}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}
    </>
  );
}
