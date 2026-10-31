// Estructura principal: barra lateral oscura (barra inferior en celular), encabezado y notificaciones.
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, ChartColumn, Gift, House, ListChecks, LogOut, Settings, Target, Timer } from 'lucide-react';
import { api } from '../api/cliente';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const ENLACES = [
  { a: '/', texto: 'Inicio', Icono: House },
  { a: '/tareas', texto: 'Tareas', Icono: ListChecks },
  { a: '/metas', texto: 'Metas', Icono: Target },
  { a: '/deseos', texto: 'Deseos', Icono: Gift },
  { a: '/enfoque', texto: 'Enfoque', Icono: Timer },
  { a: '/progreso', texto: 'Progreso', Icono: ChartColumn },
  { a: '/ajustes', texto: 'Ajustes', Icono: Settings },
];

function hace(fechaIso) {
  const minutos = Math.round((Date.now() - new Date(fechaIso)) / 60000);
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  if (minutos < 1440) return `hace ${Math.round(minutos / 60)} h`;
  return new Date(fechaIso).toLocaleDateString('es-CO');
}

function Notificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [lista, setLista] = useState([]);
  const caja = useRef(null);

  const cargar = useCallback(() => api.get('/notificaciones').then(setLista).catch(() => {}), []);

  // Se revisan las notificaciones al entrar y cada minuto
  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  // Cerrar al hacer clic fuera del panel
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => caja.current && !caja.current.contains(e.target) && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  const sinLeer = lista.filter((n) => !n.leida).length;

  async function alternar() {
    const abrir = !abierto;
    setAbierto(abrir);
    if (abrir) {
      await cargar();
      if (sinLeer > 0) api.patch('/notificaciones/leer-todas').catch(() => {});
    } else {
      setLista((l) => l.map((n) => ({ ...n, leida: true })));
    }
  }

  return (
    <div ref={caja} style={{ position: 'relative' }}>
      <button
        type="button"
        className="boton boton-icono"
        onClick={alternar}
        aria-label={`Notificaciones${sinLeer ? `, ${sinLeer} sin leer` : ''}`}
        aria-expanded={abierto}
      >
        <Bell size={21} />
        {sinLeer > 0 && <span className="contador">{sinLeer}</span>}
      </button>
      {abierto && (
        <div className="tarjeta panel-notificaciones">
          <h3>Notificaciones</h3>
          {lista.length === 0 && <p className="texto-suave" style={{ marginTop: 10 }}>No tienes notificaciones.</p>}
          {lista.map((n) => (
            <div key={n.id} className={`notificacion ${n.leida ? '' : 'nueva'}`}>
              {n.mensaje}
              <small>{hace(n.creado_en)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Encabezado({ titulo, subtitulo, children }) {
  return (
    <header className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && (
          <p className="texto-suave" style={{ marginTop: 10, fontWeight: 600 }}>
            {subtitulo}
          </p>
        )}
      </div>
      <div className="encabezado-acciones">
        {children}
        <Notificaciones />
      </div>
    </header>
  );
}

export default function Layout() {
  const { cerrarSesion } = useAuth();
  return (
    <div className="app">
      <aside className="barra-lateral">
        <NavLink to="/" className="logo" aria-label="Kuadri, inicio">
          <Logo />
        </NavLink>
        <nav className="nav" aria-label="Principal">
          {ENLACES.map(({ a, texto, Icono }) => (
            <NavLink key={a} to={a} end={a === '/'}>
              <Icono size={21} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="lateral-pie">
          <button type="button" onClick={cerrarSesion}>
            <LogOut size={19} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
