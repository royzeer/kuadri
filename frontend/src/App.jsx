// Rutas de la aplicación. Las páginas privadas solo se muestran con sesión iniciada.
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AvisoApp from './components/AvisoApp';
import Acceso from './pages/Acceso';
import Inicio from './pages/Inicio';
import Tareas from './pages/Tareas';
import Metas from './pages/Metas';
import Deseos from './pages/Deseos';
import Estudio from './pages/Estudio';
import Ocio from './pages/Ocio';
import Enfoque from './pages/Enfoque';
import Progreso from './pages/Progreso';
import Ajustes from './pages/Ajustes';

export default function App() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p className="tarjeta">Cargando Kuadri...</p>
      </main>
    );
  }

  if (!usuario) {
    return (
      <>
        <Routes>
          <Route path="/registro" element={<Acceso modo="registro" />} />
          <Route path="*" element={<Acceso modo="login" />} />
        </Routes>
        <AvisoApp />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="metas" element={<Metas />} />
          <Route path="deseos" element={<Deseos />} />
          <Route path="estudio" element={<Estudio />} />
          <Route path="ocio" element={<Ocio />} />
          <Route path="enfoque" element={<Enfoque />} />
          <Route path="progreso" element={<Progreso />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AvisoApp conBarra />
    </>
  );
}
