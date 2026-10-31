// Formulario para agregar o editar un deseo. Al agregarlo se puede anotar el precio de hoy.
import { useState } from 'react';

const ES_ENLACE = /^https?:\/\/\S+$/i;

export function validarDeseo(datos) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Escribe qué quieres comprar';
  else if (datos.nombre.trim().length > 120) errores.nombre = 'Máximo 120 caracteres';
  if (datos.enlace.trim() && !ES_ENLACE.test(datos.enlace.trim())) errores.enlace = 'Pega un enlace que empiece por https://';
  if (datos.imagen.trim() && !ES_ENLACE.test(datos.imagen.trim())) errores.imagen = 'Pega un enlace que empiece por https://';
  if (datos.precioObjetivo !== '' && !(Number(datos.precioObjetivo) > 0)) errores.precioObjetivo = 'Escribe un precio mayor que cero';
  if (datos.precioActual !== '' && !(Number(datos.precioActual) > 0)) errores.precioActual = 'Escribe un precio mayor que cero';
  return errores;
}

export default function DeseoForm({ deseo, onGuardar, onCancelar }) {
  const editando = Boolean(deseo?.id);
  const [datos, setDatos] = useState({
    nombre: deseo?.nombre || '',
    enlace: deseo?.enlace || '',
    imagen: deseo?.imagen || '',
    precioObjetivo: deseo?.precio_objetivo ? String(deseo.precio_objetivo) : '',
    prioridad: deseo?.prioridad || 'media',
    precioActual: '',
    tienda: '',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarDeseo(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await onGuardar({
        nombre: datos.nombre.trim(),
        enlace: datos.enlace.trim() || null,
        imagen: datos.imagen.trim() || null,
        precioObjetivo: datos.precioObjetivo ? Number(datos.precioObjetivo) : null,
        prioridad: datos.prioridad,
        ...(!editando && datos.precioActual
          ? { precioActual: Number(datos.precioActual), tienda: datos.tienda.trim() || null }
          : {}),
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
        <label htmlFor="nombre">Qué quieres</label>
        <input id="nombre" name="nombre" className="entrada" value={datos.nombre} onChange={cambiar} maxLength={120} placeholder="Ej: Audífonos inalámbricos" autoFocus />
        {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
      </div>

      <div className="campo">
        <label htmlFor="enlace">Enlace de la tienda (opcional)</label>
        <input id="enlace" name="enlace" type="url" className="entrada" value={datos.enlace} onChange={cambiar} placeholder="https://" />
        {errores.enlace && <span className="error-campo">{errores.enlace}</span>}
      </div>

      <div className="campo">
        <label htmlFor="imagen">Enlace de la foto (opcional)</label>
        <input id="imagen" name="imagen" type="url" className="entrada" value={datos.imagen} onChange={cambiar} placeholder="https://" />
        {errores.imagen && <span className="error-campo">{errores.imagen}</span>}
      </div>

      <div className="fila-2">
        <div className="campo">
          <label htmlFor="precioObjetivo">Precio que quieres pagar</label>
          <input id="precioObjetivo" name="precioObjetivo" type="number" inputMode="numeric" min="1" step="any" className="entrada" value={datos.precioObjetivo} onChange={cambiar} />
          {errores.precioObjetivo && <span className="error-campo">{errores.precioObjetivo}</span>}
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

      {!editando && (
        <div className="fila-2">
          <div className="campo">
            <label htmlFor="precioActual">Precio de hoy (opcional)</label>
            <input id="precioActual" name="precioActual" type="number" inputMode="numeric" min="1" step="any" className="entrada" value={datos.precioActual} onChange={cambiar} />
            {errores.precioActual && <span className="error-campo">{errores.precioActual}</span>}
          </div>
          <div className="campo">
            <label htmlFor="tienda">Tienda (opcional)</label>
            <input id="tienda" name="tienda" className="entrada" value={datos.tienda} onChange={cambiar} maxLength={60} />
          </div>
        </div>
      )}

      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar deseo'}
        </button>
      </div>
    </form>
  );
}
