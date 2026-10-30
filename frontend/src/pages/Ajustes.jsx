// Perfil, preferencias de aviso y gestión de categorías (CU03, RF17).
import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/cliente';
import { useAuth } from '../context/AuthContext';
import { Encabezado } from '../components/Layout';
import Icono, { ICONOS_CATEGORIA } from '../components/Icono';
import Modal from '../components/Modal';
import { COLORES_CATEGORIA, colorTexto } from '../utils/color';

const COLORES = COLORES_CATEGORIA;

function FormCategoria({ categoria, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    nombre: categoria?.nombre || '',
    color: categoria?.color || COLORES[0],
    icono: categoria?.icono || 'carpeta',
  });
  const [error, setError] = useState('');

  async function enviar(e) {
    e.preventDefault();
    if (!datos.nombre.trim()) return setError('Escribe un nombre');
    try {
      await onGuardar({ ...datos, nombre: datos.nombre.trim() });
    } catch (err) {
      setError(err.errores?.nombre || err.message);
    }
    return undefined;
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      {error && <div className="alerta">{error}</div>}
      <div className="campo">
        <label htmlFor="nombre-cat">Nombre</label>
        <input
          id="nombre-cat"
          className="entrada"
          value={datos.nombre}
          maxLength={40}
          onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          autoFocus
        />
      </div>
      <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="etiqueta" style={{ marginBottom: 8 }}>
          Color
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {COLORES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setDatos({ ...datos, color: c })}
              aria-label={`Color ${c}`}
              aria-pressed={datos.color === c}
              style={{
                width: 40,
                height: 40,
                background: c,
                border: '2.5px solid #161616',
                borderRadius: 10,
                cursor: 'pointer',
                boxShadow: datos.color === c ? '0 0 0 3px #fff, 0 0 0 6px #161616' : 'none',
              }}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="etiqueta" style={{ marginBottom: 8 }}>
          Icono
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ICONOS_CATEGORIA.map((i) => (
            <button
              type="button"
              key={i}
              className="boton boton-icono"
              onClick={() => setDatos({ ...datos, icono: i })}
              aria-label={`Icono ${i}`}
              aria-pressed={datos.icono === i}
              style={datos.icono === i ? { background: datos.color, color: colorTexto(datos.color) } : undefined}
            >
              <Icono nombre={i} size={22} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario">
          Guardar
        </button>
      </div>
    </form>
  );
}

export default function Ajustes() {
  const { usuario, setUsuario, cerrarSesion } = useAuth();
  const [perfil, setPerfil] = useState({ nombre: usuario.nombre, avisosCorreo: usuario.avisos_correo });
  const [mensaje, setMensaje] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);

  const cargarCategorias = () => api.get('/categorias').then(setCategorias).catch(() => {});

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function guardarPerfil(e) {
    e.preventDefault();
    try {
      setUsuario(await api.put('/auth/perfil', perfil));
      setMensaje('Perfil actualizado');
    } catch (err) {
      setMensaje(err.message);
    }
  }

  async function guardarCategoria(datos) {
    if (editando.id) await api.put(`/categorias/${editando.id}`, datos);
    else await api.post('/categorias', datos);
    setEditando(null);
    cargarCategorias();
  }

  async function eliminarCategoria(c) {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"? Sus tareas quedarán sin categoría.`)) return;
    await api.delete(`/categorias/${c.id}`);
    cargarCategorias();
  }

  return (
    <>
      <Encabezado titulo="Ajustes" subtitulo={usuario.correo} />

      <section className="tarjeta">
        <h2 style={{ marginBottom: 16 }}>Perfil</h2>
        <form className="form" onSubmit={guardarPerfil}>
          <div className="campo">
            <label htmlFor="nombre-perfil">Nombre</label>
            <input
              id="nombre-perfil"
              className="entrada"
              value={perfil.nombre}
              onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={perfil.avisosCorreo}
              onChange={(e) => setPerfil({ ...perfil, avisosCorreo: e.target.checked })}
              style={{ width: 22, height: 22, accentColor: '#111' }}
            />
            Recibir recordatorios por correo
          </label>
          {mensaje && <p role="status" style={{ fontWeight: 700 }}>{mensaje}</p>}
          <button type="submit" className="boton boton-primario" style={{ alignSelf: 'flex-start' }}>
            Guardar cambios
          </button>
        </form>
      </section>

      <section className="seccion">
        <div className="seccion-titulo">
          <h2>Categorías</h2>
          <button type="button" className="boton boton-primario" onClick={() => setEditando({})}>
            <Plus size={20} strokeWidth={3} /> Nueva
          </button>
        </div>
        <ul className="lista-tareas">
          {categorias.map((c) => (
            <li key={c.id} className="tarea">
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  background: c.color,
                  color: colorTexto(c.color),
                  border: '2.5px solid #161616',
                  borderRadius: 10,
                }}
              >
                <Icono nombre={c.icono} size={20} />
              </span>
              <div className="tarea-info">
                <div className="tarea-titulo">{c.nombre}</div>
                <div className="texto-suave" style={{ fontSize: '0.85rem' }}>
                  {c.total_tareas} {c.total_tareas === 1 ? 'tarea' : 'tareas'}
                </div>
              </div>
              <div className="tarea-acciones">
                <button type="button" className="boton" onClick={() => setEditando(c)} aria-label={`Editar ${c.nombre}`}>
                  <Pencil size={17} />
                </button>
                <button type="button" className="boton" onClick={() => eliminarCategoria(c)} aria-label={`Eliminar ${c.nombre}`}>
                  <Trash2 size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="boton boton-peligro" style={{ marginTop: 28 }} onClick={cerrarSesion}>
        Cerrar sesión
      </button>

      {editando && (
        <Modal titulo={editando.id ? 'Editar categoría' : 'Nueva categoría'} onCerrar={() => setEditando(null)}>
          <FormCategoria categoria={editando} onGuardar={guardarCategoria} onCancelar={() => setEditando(null)} />
        </Modal>
      )}
    </>
  );
}
