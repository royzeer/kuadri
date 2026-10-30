// Pantallas de inicio de sesión y registro (CU01, CU02), con panel de marca a la izquierda.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Acceso({ modo }) {
  const esRegistro = modo === 'registro';
  const { iniciarSesion, registrarse } = useAuth();
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const encontrados = {};
    if (esRegistro && datos.nombre.trim().length < 2) encontrados.nombre = 'Escribe tu nombre';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) encontrados.correo = 'Escribe un correo válido';
    if (esRegistro && datos.contrasena.length < 8) encontrados.contrasena = 'Mínimo 8 caracteres';
    if (!esRegistro && !datos.contrasena) encontrados.contrasena = 'Escribe tu contraseña';
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    setError('');
    try {
      if (esRegistro) await registrarse(datos);
      else await iniciarSesion({ correo: datos.correo, contrasena: datos.contrasena });
    } catch (err) {
      setError(err.message);
      setErrores(err.errores || {});
      setEnviando(false);
    }
  }

  return (
    <main className="acceso">
      <section className="acceso-marca">
        <div className="logo" style={{ color: '#fff' }}>
          <Logo />
        </div>
        <h1>
          Tu semana, <span className="resaltado">cuadro por cuadro</span>.
        </h1>
        <div>
          <div className="muestra" aria-hidden="true">
            {DIAS.map((d, i) => (
              <span key={i}>{i < 5 ? <Check size={20} strokeWidth={3.2} /> : d}</span>
            ))}
          </div>
          <p className="muestra-texto" style={{ marginTop: 14, fontWeight: 600, maxWidth: 380 }}>
            Anota tus entregas, recibe recordatorios antes de cada fecha y mira cómo se llena tu semana.
          </p>
        </div>
      </section>

      <section className="acceso-formulario">
        <div className="acceso-caja">
          <h2>{esRegistro ? 'Crea tu cuenta' : 'Hola de nuevo'}</h2>
          <p className="texto-suave" style={{ marginBottom: 22, fontWeight: 600 }}>
            {esRegistro ? 'Te toma menos de un minuto.' : 'Entra para ver tus pendientes.'}
          </p>

          <form className="form tarjeta" onSubmit={enviar} noValidate>
            {error && <div className="alerta">{error}</div>}
            {esRegistro && (
              <div className="campo">
                <label htmlFor="nombre">Nombre</label>
                <input id="nombre" name="nombre" className="entrada" value={datos.nombre} onChange={cambiar} autoComplete="name" />
                {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
              </div>
            )}
            <div className="campo">
              <label htmlFor="correo">Correo</label>
              <input id="correo" name="correo" type="email" className="entrada" value={datos.correo} onChange={cambiar} autoComplete="email" />
              {errores.correo && <span className="error-campo">{errores.correo}</span>}
            </div>
            <div className="campo">
              <label htmlFor="contrasena">Contraseña</label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                className="entrada"
                value={datos.contrasena}
                onChange={cambiar}
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
              />
              {errores.contrasena && <span className="error-campo">{errores.contrasena}</span>}
            </div>
            <button type="submit" className="boton boton-primario boton-bloque" disabled={enviando}>
              {enviando ? 'Un momento...' : esRegistro ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontWeight: 600 }}>
            {esRegistro ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
            <Link to={esRegistro ? '/login' : '/registro'} className="enlace">
              {esRegistro ? 'Inicia sesión' : 'Regístrate'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
