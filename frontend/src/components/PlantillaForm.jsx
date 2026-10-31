// Formulario de una plantilla: junta una paleta con una fuente para títulos y otra para texto.
import { useEffect, useState } from 'react';
import { colorTexto } from '../utils/color';
import { cargarFuente, familiaCss } from '../utils/fuentes';

// Tarjeta de ejemplo con la combinación: fondo con el primer color y botón con el segundo.
export function MuestraPlantilla({ nombre, colores = [], fuenteTitulos, fuenteTexto }) {
  useEffect(() => {
    cargarFuente(fuenteTitulos);
    cargarFuente(fuenteTexto);
  }, [fuenteTitulos, fuenteTexto]);

  const fondo = colores[0] || '#F1F6DF';
  const acento = colores[1] || '#141414';
  return (
    <div className="muestra-plantilla" style={{ background: fondo, color: colorTexto(fondo) }}>
      <strong style={{ fontFamily: familiaCss(fuenteTitulos) }}>{nombre || 'Tu proyecto'}</strong>
      <p style={{ fontFamily: familiaCss(fuenteTexto) }}>Así se verían tus títulos y tu texto juntos.</p>
      <span className="muestra-plantilla-boton" style={{ background: acento, color: colorTexto(acento), fontFamily: familiaCss(fuenteTexto) }}>
        Botón
      </span>
      {colores.length > 0 && (
        <div className="muestra-plantilla-colores" aria-hidden="true">
          {colores.map((c, i) => (
            <i key={`${c}-${i}`} style={{ background: c }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function validarPlantilla({ nombre, nota }) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = 'Ponle un nombre a tu plantilla';
  else if (nombre.trim().length > 60) errores.nombre = 'Máximo 60 caracteres';
  if (nota.length > 300) errores.nota = 'Máximo 300 caracteres';
  return errores;
}

const aTexto = (id) => (id ? String(id) : '');
const aId = (valor) => (valor ? Number(valor) : null);

export default function PlantillaForm({ plantilla, paletas, tipografias, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    nombre: plantilla?.nombre || '',
    paletaId: aTexto(plantilla?.paleta_id),
    fuenteTitulosId: aTexto(plantilla?.fuente_titulos_id),
    fuenteTextoId: aTexto(plantilla?.fuente_texto_id),
    nota: plantilla?.nota || '',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });
  const paleta = paletas.find((p) => String(p.id) === datos.paletaId);
  const fuente = (id) => tipografias.find((t) => String(t.id) === id)?.nombre;

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarPlantilla(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await onGuardar({
        nombre: datos.nombre.trim(),
        paletaId: aId(datos.paletaId),
        fuenteTitulosId: aId(datos.fuenteTitulosId),
        fuenteTextoId: aId(datos.fuenteTextoId),
        nota: datos.nota.trim() || null,
      });
    } catch (error) {
      setErrores(error.errores || {});
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  }

  const selectorFuente = (id, nombre, etiqueta) => (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} name={nombre} className="entrada" value={datos[nombre]} onChange={cambiar}>
        <option value="">La de siempre</option>
        {tipografias.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>
      {errores[nombre] && <span className="error-campo">{errores[nombre]}</span>}
    </div>
  );

  return (
    <form className="form" onSubmit={enviar} noValidate>
      {errorGeneral && <div className="alerta">{errorGeneral}</div>}

      <div className="campo">
        <label htmlFor="nombre-plantilla">Nombre</label>
        <input id="nombre-plantilla" name="nombre" className="entrada" value={datos.nombre} onChange={cambiar} maxLength={60} placeholder="Ej: Mi portafolio" autoFocus />
        {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
      </div>

      <div className="campo">
        <label htmlFor="paleta-plantilla">Paleta</label>
        <select id="paleta-plantilla" name="paletaId" className="entrada" value={datos.paletaId} onChange={cambiar}>
          <option value="">Sin paleta</option>
          {paletas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {errores.paletaId && <span className="error-campo">{errores.paletaId}</span>}
      </div>

      <div className="fila-2">
        {selectorFuente('titulos-plantilla', 'fuenteTitulosId', 'Fuente de títulos')}
        {selectorFuente('texto-plantilla', 'fuenteTextoId', 'Fuente de texto')}
      </div>

      <div className="campo">
        <label htmlFor="nota-plantilla">Nota (opcional)</label>
        <textarea id="nota-plantilla" name="nota" className="entrada" value={datos.nota} onChange={cambiar} maxLength={300} placeholder="Ej: Para la página de mi hoja de vida" />
        {errores.nota && <span className="error-campo">{errores.nota}</span>}
      </div>

      <MuestraPlantilla
        nombre={datos.nombre.trim()}
        colores={paleta?.colores}
        fuenteTitulos={fuente(datos.fuenteTitulosId)}
        fuenteTexto={fuente(datos.fuenteTextoId)}
      />

      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar plantilla'}
        </button>
      </div>
    </form>
  );
}
