// Metas personales: cada meta avanza a medida que marcas sus pasos.
import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { api } from '../api/cliente';
import { anunciarLogros, useAviso } from '../components/AvisoContext';
import { Encabezado } from '../components/Layout';
import Modal from '../components/Modal';
import MetaForm from '../components/MetaForm';

function fechaObjetivo(ymd) {
  const [a, m, d] = ymd.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function MetaTarjeta({ meta, onCambio, onEditar, onEliminar }) {
  const mostrarAviso = useAviso();
  const [nuevoPaso, setNuevoPaso] = useState('');
  const [error, setError] = useState('');

  // Toda acción sobre la meta devuelve la meta actualizada y los logros nuevos.
  async function ejecutar(peticion) {
    setError('');
    try {
      const { meta: actualizada, nuevosLogros } = await peticion;
      anunciarLogros(mostrarAviso, nuevosLogros);
      onCambio(actualizada);
      return true;
    } catch (e) {
      setError(e.errores?.texto || e.message);
      return false;
    }
  }

  async function agregarPaso(e) {
    e.preventDefault();
    if (!nuevoPaso.trim()) return;
    if (await ejecutar(api.post(`/metas/${meta.id}/pasos`, { texto: nuevoPaso.trim() }))) setNuevoPaso('');
  }

  const cumplida = Boolean(meta.cumplida_en);

  return (
    <article className={`meta ${cumplida ? 'cumplida' : ''}`}>
      <div className="meta-cabeza">
        <div style={{ minWidth: 0 }}>
          <h3 className="meta-titulo">{meta.titulo}</h3>
          <div className="meta-datos">
            {meta.categoria_nombre && (
              <span>
                <i className="punto" style={{ '--color': meta.categoria_color }} aria-hidden="true" />
                {meta.categoria_nombre}
              </span>
            )}
            {meta.fecha_objetivo && (
              <span>
                <CalendarDays size={14} aria-hidden="true" />
                {fechaObjetivo(meta.fecha_objetivo)}
              </span>
            )}
          </div>
        </div>
        <span className="meta-porcentaje">{meta.progreso}%</span>
      </div>

      {meta.descripcion && <p className="meta-descripcion">{meta.descripcion}</p>}

      <div className="meta-barra" role="progressbar" aria-valuenow={meta.progreso} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance de ${meta.titulo}`}>
        <span style={{ width: `${meta.progreso}%` }} />
      </div>

      {meta.pasos.length > 0 && (
        <ul className="pasos">
          {meta.pasos.map((p) => (
            <li key={p.id} className={p.hecho ? 'hecho' : ''}>
              <button
                type="button"
                className="paso-check"
                aria-pressed={p.hecho}
                aria-label={p.hecho ? `Desmarcar "${p.texto}"` : `Marcar "${p.texto}" como hecho`}
                onClick={() => ejecutar(api.patch(`/metas/${meta.id}/pasos/${p.id}`, { hecho: !p.hecho }))}
              >
                {p.hecho && <Check size={14} strokeWidth={3.2} />}
              </button>
              <span className="paso-texto">{p.texto}</span>
              <button
                type="button"
                className="paso-quitar"
                aria-label={`Quitar el paso "${p.texto}"`}
                onClick={() => ejecutar(api.delete(`/metas/${meta.id}/pasos/${p.id}`))}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="paso-nuevo" onSubmit={agregarPaso}>
        <input
          value={nuevoPaso}
          onChange={(e) => setNuevoPaso(e.target.value)}
          placeholder="Agregar un paso"
          aria-label={`Agregar un paso a ${meta.titulo}`}
          maxLength={150}
        />
        <button type="submit" aria-label="Agregar paso" disabled={!nuevoPaso.trim()}>
          <Plus size={16} strokeWidth={3} />
        </button>
      </form>
      {error && <span className="error-campo">{error}</span>}

      <div className="meta-acciones">
        {(meta.pasos.length === 0 || cumplida) && (
          <button
            type="button"
            className={`boton ${cumplida ? '' : 'boton-primario'}`}
            onClick={() => ejecutar(api.patch(`/metas/${meta.id}/cumplir`, { cumplida: !cumplida }))}
          >
            {cumplida ? <RotateCcw size={16} /> : <Check size={16} strokeWidth={3} />}
            {cumplida ? 'Reabrir' : 'La cumplí'}
          </button>
        )}
        <button type="button" className="boton boton-icono" onClick={() => onEditar(meta)} aria-label={`Editar "${meta.titulo}"`}>
          <Pencil size={16} />
        </button>
        <button type="button" className="boton boton-icono" onClick={() => onEliminar(meta)} aria-label={`Eliminar "${meta.titulo}"`}>
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

export default function Metas() {
  const [metas, setMetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [vista, setVista] = useState('curso');
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nueva, meta = editar
  const [error, setError] = useState('');

  const cargar = useCallback(() => api.get('/metas').then(setMetas).catch((e) => setError(e.message)), []);

  useEffect(() => {
    cargar();
    api.get('/categorias').then(setCategorias).catch(() => {});
  }, [cargar]);

  const reemplazar = (actualizada) => setMetas((lista) => lista.map((m) => (m.id === actualizada.id ? actualizada : m)));

  async function guardar(datos) {
    if (editando?.id) await api.put(`/metas/${editando.id}`, datos);
    else await api.post('/metas', datos);
    setEditando(null);
    cargar();
  }

  async function eliminar(meta) {
    if (!window.confirm(`¿Eliminar la meta "${meta.titulo}"?`)) return;
    await api.delete(`/metas/${meta.id}`);
    cargar();
  }

  const enCurso = metas.filter((m) => !m.cumplida_en);
  const cumplidas = metas.filter((m) => m.cumplida_en);
  const visibles = vista === 'curso' ? enCurso : cumplidas;

  return (
    <>
      <Encabezado titulo="Metas" subtitulo="Lo que quieres lograr, paso a paso.">
        <button type="button" className="boton boton-primario" onClick={() => setEditando({})} aria-label="Nueva meta">
          <Plus size={20} strokeWidth={3} />
          <span>Nueva</span>
        </button>
      </Encabezado>

      {error && <div className="alerta" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="filtros">
        <div className="pestanas" role="group" aria-label="Metas">
          <button type="button" aria-pressed={vista === 'curso'} onClick={() => setVista('curso')}>
            En curso ({enCurso.length})
          </button>
          <button type="button" aria-pressed={vista === 'cumplidas'} onClick={() => setVista('cumplidas')}>
            Cumplidas ({cumplidas.length})
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="vacio">
          {vista === 'curso' ? 'No tienes metas en curso. Crea una con el botón Nueva.' : 'Aún no has cumplido metas. Vas en camino.'}
        </p>
      ) : (
        <div className="rejilla-metas">
          {visibles.map((m) => (
            <MetaTarjeta key={m.id} meta={m} onCambio={reemplazar} onEditar={setEditando} onEliminar={eliminar} />
          ))}
        </div>
      )}

      {editando && (
        <Modal titulo={editando.id ? 'Editar meta' : 'Nueva meta'} onCerrar={() => setEditando(null)}>
          <MetaForm meta={editando} categorias={categorias} onGuardar={guardar} onCancelar={() => setEditando(null)} />
        </Modal>
      )}
    </>
  );
}
