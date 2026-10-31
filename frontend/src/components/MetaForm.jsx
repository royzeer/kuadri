// Formulario para crear o editar una meta. Al crearla se pueden escribir los pasos, uno por renglón.
import { useState } from 'react';

export function validarMeta(datos) {
  const errores = {};
  if (!datos.titulo.trim()) errores.titulo = 'Ponle un nombre a tu meta';
  else if (datos.titulo.trim().length > 120) errores.titulo = 'Máximo 120 caracteres';
  if (datos.descripcion.length > 2000) errores.descripcion = 'Máximo 2000 caracteres';
  if (separarPasos(datos.pasos).some((p) => p.length > 150)) errores.pasos = 'Cada paso puede tener máximo 150 caracteres';
  return errores;
}

// Un paso por renglón; se ignoran los renglones vacíos.
export function separarPasos(texto) {
  return texto
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function MetaForm({ meta, categorias, onGuardar, onCancelar }) {
  const editando = Boolean(meta?.id);
  const [datos, setDatos] = useState({
    titulo: meta?.titulo || '',
    descripcion: meta?.descripcion || '',
    categoriaId: meta?.categoria_id ? String(meta.categoria_id) : '',
    fechaObjetivo: meta?.fecha_objetivo || '',
    pasos: '',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarMeta(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await onGuardar({
        titulo: datos.titulo.trim(),
        descripcion: datos.descripcion.trim(),
        categoriaId: datos.categoriaId ? Number(datos.categoriaId) : null,
        fechaObjetivo: datos.fechaObjetivo || null,
        ...(editando ? {} : { pasos: separarPasos(datos.pasos) }),
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
        <label htmlFor="titulo">Meta</label>
        <input id="titulo" name="titulo" className="entrada" value={datos.titulo} onChange={cambiar} maxLength={120} placeholder="Ej: Aprender inglés B1" autoFocus />
        {errores.titulo && <span className="error-campo">{errores.titulo}</span>}
      </div>

      <div className="campo">
        <label htmlFor="descripcion">Por qué la quieres (opcional)</label>
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
          <label htmlFor="fechaObjetivo">Fecha objetivo</label>
          <input id="fechaObjetivo" name="fechaObjetivo" type="date" className="entrada" value={datos.fechaObjetivo} onChange={cambiar} />
          {errores.fechaObjetivo && <span className="error-campo">{errores.fechaObjetivo}</span>}
        </div>
      </div>

      {!editando && (
        <div className="campo">
          <label htmlFor="pasos">Pasos (uno por renglón, opcional)</label>
          <textarea id="pasos" name="pasos" className="entrada" value={datos.pasos} onChange={cambiar} placeholder={'Terminar curso A2\nTerminar curso B1\nPresentar el examen'} />
          {errores.pasos && <span className="error-campo">{errores.pasos}</span>}
        </div>
      )}

      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar meta'}
        </button>
      </div>
    </form>
  );
}
