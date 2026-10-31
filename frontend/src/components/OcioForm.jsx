// Formulario para agregar o editar algo del registro de ocio.
import { useState } from 'react';
import { Star } from 'lucide-react';
import { ESTADOS_OCIO, TIPOS_OCIO } from '../utils/ocio';

export function validarOcio(datos) {
  const errores = {};
  if (!datos.titulo.trim()) errores.titulo = 'Escribe el título';
  else if (datos.titulo.trim().length > 120) errores.titulo = 'Máximo 120 caracteres';
  if (datos.plataforma.trim().length > 60) errores.plataforma = 'Máximo 60 caracteres';
  if (datos.comentario.length > 2000) errores.comentario = 'Máximo 2000 caracteres';
  return errores;
}

// Nota de 1 a 5 estrellas; tocar la misma estrella otra vez la quita.
export function Estrellas({ valor, onCambiar }) {
  return (
    <div className="estrellas" role="group" aria-label="Tu nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={valor >= n}
          aria-label={`${n} de 5`}
          onClick={() => onCambiar(valor === n ? null : n)}
        >
          <Star size={22} fill={valor >= n ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

// Nota solo para mostrar (sin botones).
export function EstrellasFijas({ valor, size = 16 }) {
  return (
    <span className="estrellas-fijas" role="img" aria-label={`Nota: ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={valor >= n ? 'currentColor' : 'none'} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function OcioForm({ ocio, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    titulo: ocio?.titulo || '',
    tipo: ocio?.tipo || 'videojuego',
    estado: ocio?.estado || 'pendiente',
    calificacion: ocio?.calificacion || null,
    plataforma: ocio?.plataforma || '',
    comentario: ocio?.comentario || '',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarOcio(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await onGuardar({
        ...datos,
        titulo: datos.titulo.trim(),
        plataforma: datos.plataforma.trim() || null,
        comentario: datos.comentario.trim() || null,
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
        <label htmlFor="titulo-ocio">Título</label>
        <input id="titulo-ocio" name="titulo" className="entrada" value={datos.titulo} onChange={cambiar} maxLength={120} placeholder="Ej: Hollow Knight" autoFocus />
        {errores.titulo && <span className="error-campo">{errores.titulo}</span>}
      </div>

      <div className="fila-2">
        <div className="campo">
          <label htmlFor="tipo-ocio">Tipo</label>
          <select id="tipo-ocio" name="tipo" className="entrada" value={datos.tipo} onChange={cambiar}>
            {TIPOS_OCIO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.texto}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="estado-ocio">Estado</label>
          <select id="estado-ocio" name="estado" className="entrada" value={datos.estado} onChange={cambiar}>
            {ESTADOS_OCIO.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="fila-2">
        <div className="campo">
          <label htmlFor="plataforma-ocio">Dónde (opcional)</label>
          <input id="plataforma-ocio" name="plataforma" className="entrada" value={datos.plataforma} onChange={cambiar} maxLength={60} placeholder="Ej: PC, Netflix, Kindle" />
          {errores.plataforma && <span className="error-campo">{errores.plataforma}</span>}
        </div>
        <div className="campo">
          <span className="etiqueta">Tu nota (opcional)</span>
          <Estrellas valor={datos.calificacion} onCambiar={(n) => setDatos({ ...datos, calificacion: n })} />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="comentario-ocio">Comentario (opcional)</label>
        <textarea id="comentario-ocio" name="comentario" className="entrada" value={datos.comentario} onChange={cambiar} placeholder="Qué te gustó, en qué parte vas..." />
        {errores.comentario && <span className="error-campo">{errores.comentario}</span>}
      </div>

      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
