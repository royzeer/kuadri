// Formulario de una paleta: un nombre y de 2 a 6 colores.
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export const MIN_COLORES = 2;
export const MAX_COLORES = 6;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const COLORES_INICIALES = ['#B1CB5A', '#141414', '#D6E6A1'];

export function validarPaleta({ nombre, colores }) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = 'Ponle un nombre a tu paleta';
  else if (nombre.trim().length > 60) errores.nombre = 'Máximo 60 caracteres';
  if (colores.some((c) => !HEX.test(c.trim()))) errores.colores = 'Cada color debe tener el formato #RRGGBB';
  return errores;
}

export default function PaletaForm({ paleta, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(paleta?.nombre || '');
  const [colores, setColores] = useState(paleta?.colores?.length ? paleta.colores : COLORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiarColor = (i, valor) => setColores(colores.map((c, j) => (j === i ? valor : c)));

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarPaleta({ nombre, colores });
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await onGuardar({ nombre: nombre.trim(), colores: colores.map((c) => c.trim().toUpperCase()) });
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
        <label htmlFor="nombre-paleta">Nombre</label>
        <input id="nombre-paleta" className="entrada" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Ej: Atardecer" autoFocus />
        {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
      </div>

      <fieldset className="campo colores-campo">
        <legend className="etiqueta">Colores</legend>
        {colores.map((c, i) => (
          <div key={i} className="color-fila">
            <input
              type="color"
              value={HEX.test(c) ? c : '#000000'}
              onChange={(e) => cambiarColor(i, e.target.value.toUpperCase())}
              aria-label={`Elegir el color ${i + 1}`}
            />
            <input
              className="entrada"
              value={c}
              onChange={(e) => cambiarColor(i, e.target.value)}
              maxLength={7}
              aria-label={`Código del color ${i + 1}`}
            />
            <button
              type="button"
              className="boton boton-icono"
              onClick={() => setColores(colores.filter((_, j) => j !== i))}
              disabled={colores.length <= MIN_COLORES}
              aria-label={`Quitar el color ${i + 1}`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {colores.length < MAX_COLORES && (
          <button type="button" className="boton" onClick={() => setColores([...colores, '#FFFFFF'])}>
            <Plus size={16} strokeWidth={3} />
            Agregar color
          </button>
        )}
        {errores.colores && <span className="error-campo">{errores.colores}</span>}
      </fieldset>

      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar paleta'}
        </button>
      </div>
    </form>
  );
}
