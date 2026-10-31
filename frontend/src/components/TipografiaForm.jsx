// Formulario de una tipografía de Google Fonts, con vista previa.
import { useEffect, useState } from 'react';
import { cargarFuente, familiaCss, nombreValido } from '../utils/fuentes';

export const USOS = [
  { valor: 'titulos', texto: 'Títulos' },
  { valor: 'texto', texto: 'Texto' },
  { valor: 'ambos', texto: 'Títulos y texto' },
];

export function validarTipografia({ nombre, muestra }) {
  const errores = {};
  if (!nombreValido(nombre)) errores.nombre = 'Escribe el nombre tal como aparece en Google Fonts (sin símbolos)';
  if (muestra.length > 150) errores.muestra = 'Máximo 150 caracteres';
  return errores;
}

export default function TipografiaForm({ tipografia, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    nombre: tipografia?.nombre || '',
    uso: tipografia?.uso || 'ambos',
    muestra: tipografia?.muestra || '',
  });
  // La vista previa se actualiza al salir del campo, para no pedir una fuente por cada letra.
  const [vista, setVista] = useState(tipografia?.nombre || '');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => cargarFuente(vista), [vista]);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarTipografia(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await onGuardar({ nombre: datos.nombre.trim().replace(/\s+/g, ' '), uso: datos.uso, muestra: datos.muestra.trim() || null });
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
        <label htmlFor="nombre-fuente">Nombre en Google Fonts</label>
        <input
          id="nombre-fuente"
          name="nombre"
          className="entrada"
          value={datos.nombre}
          onChange={cambiar}
          onBlur={() => nombreValido(datos.nombre) && setVista(datos.nombre.trim())}
          maxLength={60}
          placeholder="Ej: Space Grotesk"
          autoFocus
        />
        <small className="texto-suave">
          Búscala en{' '}
          <a href="https://fonts.google.com" target="_blank" rel="noreferrer">
            fonts.google.com
          </a>{' '}
          y copia el nombre exacto.
        </small>
        {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
      </div>

      <div className="campo">
        <label htmlFor="uso-fuente">La uso para</label>
        <select id="uso-fuente" name="uso" className="entrada" value={datos.uso} onChange={cambiar}>
          {USOS.map((u) => (
            <option key={u.valor} value={u.valor}>
              {u.texto}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="muestra-fuente">Frase de muestra (opcional)</label>
        <input id="muestra-fuente" name="muestra" className="entrada" value={datos.muestra} onChange={cambiar} maxLength={150} placeholder="Ej: Organiza tu semana" />
        {errores.muestra && <span className="error-campo">{errores.muestra}</span>}
      </div>

      {vista && (
        <p className="fuente-previa" style={{ fontFamily: familiaCss(vista) }} aria-label={`Vista previa de ${vista}`}>
          {datos.muestra.trim() || 'El veloz murciélago hindú comía feliz cardillo y kiwi.'}
        </p>
      )}

      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar tipografía'}
        </button>
      </div>
    </form>
  );
}
