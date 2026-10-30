// Formulario para crear o editar una tarea. Valida en el cliente antes de enviar (RNF04).
import { useState } from 'react';
import { aValorInput } from '../utils/fechas';

export function validarTarea(datos) {
  const errores = {};
  if (!datos.titulo.trim()) errores.titulo = 'El título es obligatorio';
  else if (datos.titulo.trim().length > 150) errores.titulo = 'Máximo 150 caracteres';
  if (datos.descripcion.length > 2000) errores.descripcion = 'Máximo 2000 caracteres';
  return errores;
}

export default function TareaForm({ tarea, categorias, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    titulo: tarea?.titulo || '',
    descripcion: tarea?.descripcion || '',
    categoriaId: tarea?.categoria_id ? String(tarea.categoria_id) : '',
    prioridad: tarea?.prioridad || 'media',
    fechaLimite: aValorInput(tarea?.fecha_limite),
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarTarea(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await onGuardar({
        titulo: datos.titulo.trim(),
        descripcion: datos.descripcion.trim(),
        categoriaId: datos.categoriaId ? Number(datos.categoriaId) : null,
        prioridad: datos.prioridad,
        // El input da la hora local; se envía en formato ISO para que el servidor la entienda igual.
        fechaLimite: datos.fechaLimite ? new Date(datos.fechaLimite).toISOString() : null,
      });
    } catch (error) {
      setErrores(error.errores || {});
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      {errorGeneral && <div className="alerta">{errorGeneral}</div>}

      <div className="campo">
        <label htmlFor="titulo">Título</label>
        <input id="titulo" name="titulo" className="entrada" value={datos.titulo} onChange={cambiar} maxLength={150} autoFocus />
        {errores.titulo && <span className="error-campo">{errores.titulo}</span>}
      </div>

      <div className="campo">
        <label htmlFor="descripcion">Descripción (opcional)</label>
        <textarea id="descripcion" name="descripcion" className="entrada" value={datos.descripcion} onChange={cambiar} />
        {errores.descripcion && <span className="error-campo">{errores.descripcion}</span>}
      </div>

      <div className="fila-2">
        <div className="campo">
          <label htmlFor="categoriaId">Categoría</label>
          <select id="categoriaId" name="categoriaId" className="entrada" value={datos.categoriaId} onChange={cambiar}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="prioridad">Prioridad</label>
          <select id="prioridad" name="prioridad" className="entrada" value={datos.prioridad} onChange={cambiar}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="fechaLimite">Fecha límite</label>
        <input id="fechaLimite" name="fechaLimite" type="datetime-local" className="entrada" value={datos.fechaLimite} onChange={cambiar} />
        {errores.fechaLimite && <span className="error-campo">{errores.fechaLimite}</span>}
      </div>

      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar tarea'}
        </button>
      </div>
    </form>
  );
}
