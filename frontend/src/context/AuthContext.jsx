// Estado global de la sesión: usuario actual, iniciar y cerrar sesión.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, guardarToken, obtenerToken } from '../api/cliente';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(obtenerToken()));

  // Al abrir la app, si hay token guardado se recupera el perfil
  useEffect(() => {
    if (!obtenerToken()) return;
    api
      .get('/auth/perfil')
      .then(setUsuario)
      .catch(() => guardarToken(null))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener('kuadri:sesion-expirada', alExpirar);
    return () => window.removeEventListener('kuadri:sesion-expirada', alExpirar);
  }, []);

  const entrar = useCallback(async (ruta, datos) => {
    const { usuario: u, token } = await api.post(ruta, datos);
    guardarToken(token);
    setUsuario(u);
  }, []);

  const iniciarSesion = useCallback((datos) => entrar('/auth/login', datos), [entrar]);
  const registrarse = useCallback((datos) => entrar('/auth/registro', datos), [entrar]);

  const cerrarSesion = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, cargando, iniciarSesion, registrarse, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
