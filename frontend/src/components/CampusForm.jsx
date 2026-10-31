// Formulario para conectar el calendario de un campus virtual.
// El enlace funciona como una contraseña: se envía una vez y nunca se vuelve a mostrar.
import { useState } from 'react';

export function validarCampus(datos, esNuevo) {
  const errores = {};
  const enlace = datos.enlace.trim();
  if (!datos.nombre.trim()) errores.nombre = 'Escribe un nombre, por ejemplo "Unimagdalena"';
  if (esNuevo && !enlace) errores.enlace = 'Pega el enlace del calendario de tu campus';
  else if (enlace && !/^(https|webcals?):\/\//i.test(enlace)) {
    errores.enlace = 'El enlace debe empezar por https:// o webcal://';
  }
  return errores;
}

export default function CampusForm({ campus, categorias, onGuardar, onCancelar }) {
  const esNuevo = !campus?.id;
  const [datos, setDatos] = useState({
    nombre: campus?.nombre || '',
    enlace: '',
    categoriaId: campus?.categoria_id ? String(campus.categoria_id) : '',
  });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validarCampus(datos, esNuevo);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setGuardando(true);
    setError('');
    try {
      await onGuardar({
        nombre: datos.nombre.trim(),
        categoriaId: datos.categoriaId ? Number(datos.categoriaId) : null,
        ...(datos.enlace.trim() ? { enlace: datos.enlace.trim() } : {}),
      });
    } catch (err) {
      setErrores(err.errores || {});
      setError(err.errores?.enlace ? '' : err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      {error && <div className="alerta">{error}</div>}
      <div className="campo">
        <label htmlFor="campus-nombre">Nombre</label>
        <input
          id="campus-nombre"
          className="entrada"
          value={datos.nombre}
          maxLength={40}
          placeholder="Unimagdalena, Zajuna..."
          onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          autoFocus
        />
        {errores.nombre && <small className="error-campo">{errores.nombre}</small>}
      </div>
      <div className="campo">
        <label htmlFor="campus-enlace">{esNuevo ? 'Enlace del calendario' : 'Enlace nuevo (opcional)'}</label>
        <input
          id="campus-enlace"
          className="entrada"
          type="password"
          autoComplete="off"
          value={datos.enlace}
          placeholder={esNuevo ? 'https://...' : 'Déjalo vacío para conservar el actual'}
          onChange={(e) => setDatos({ ...datos, enlace: e.target.value })}
        />
        {errores.enlace && <small className="error-campo">{errores.enlace}</small>}
        <small className="texto-suave">
          En tu campus: Calendario, luego "Exportar calendario" (o "Suscribirse"), y copia el enlace. Se guarda
          cifrado y nadie más lo puede ver.
        </small>
      </div>
      <div className="campo">
        <label htmlFor="campus-categoria">Categoría para sus tareas</label>
        <select
          id="campus-categoria"
          className="entrada"
          value={datos.categoriaId}
          onChange={(e) => setDatos({ ...datos, categoriaId: e.target.value })}
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="fila-2">
        <button type="button" className="boton" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Revisando enlace...' : esNuevo ? 'Conectar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
