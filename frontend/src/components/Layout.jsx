// Estructura principal: barra lateral oscura (barra inferior en celular), encabezado y notificaciones.
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  ChartColumn,
  Ellipsis,
  Gamepad2,
  Gift,
  House,
  ListChecks,
  LogOut,
  Palette,
  Settings,
  Target,
  Timer,
} from 'lucide-react';
import { api } from '../api/cliente';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { EVENTO_CAMPUS, sincronizarCampus } from '../utils/campus';

// En el celular solo caben los principales en la barra; el resto va en el menú "Más".
const ENLACES = [
  { a: '/', texto: 'Inicio', Icono: House, principal: true },
  { a: '/tareas', texto: 'Tareas', Icono: ListChecks, principal: true },
  { a: '/metas', texto: 'Metas', Icono: Target },
  { a: '/deseos', texto: 'Deseos', Icono: Gift },
  { a: '/estudio', texto: 'Estudio', Icono: Palette },
  { a: '/ocio', texto: 'Ocio', Icono: Gamepad2 },
  { a: '/enfoque', texto: 'Enfoque', Icono: Timer, principal: true },
  { a: '/progreso', texto: 'Progreso', Icono: ChartColumn, principal: true },
  { a: '/ajustes', texto: 'Ajustes', Icono: Settings },
];
const SECUNDARIOS = ENLACES.filter((e) => !e.principal);

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
    window.addEventListener(EVENTO_CAMPUS, cargar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener(EVENTO_CAMPUS, cargar);
    };
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

// Botón "Más" de la barra inferior del celular, con las páginas que no caben.
function MenuMas() {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const { pathname } = useLocation();
  const activo = SECUNDARIOS.some((e) => pathname.startsWith(e.a));

  // Se cierra al cambiar de página o al tocar fuera
  useEffect(() => setAbierto(false), [pathname]);
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => caja.current && !caja.current.contains(e.target) && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  return (
    <div ref={caja} className="nav-mas">
      <button type="button" className={activo ? 'active' : ''} onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        <Ellipsis size={21} aria-hidden="true" />
        Más
      </button>
      {abierto && (
        <div className="menu-mas">
          {SECUNDARIOS.map(({ a, texto, Icono }) => (
            <NavLink key={a} to={a}>
              <Icono size={20} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { cerrarSesion } = useAuth();

  // Al abrir la app se traen las actividades nuevas de los campus conectados
  useEffect(() => {
    sincronizarCampus(true).catch(() => {});
  }, []);
  return (
    <div className="app">
      <aside className="barra-lateral">
        <NavLink to="/" className="logo" aria-label="Kuadri, inicio">
          <Logo />
        </NavLink>
        <nav className="nav" aria-label="Principal">
          {ENLACES.map(({ a, texto, Icono, principal }) => (
            <NavLink key={a} to={a} end={a === '/'} className={principal ? '' : 'solo-escritorio'}>
              <Icono size={21} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
          <MenuMas />
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
