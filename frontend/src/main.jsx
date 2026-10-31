import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AvisoProvider } from './components/AvisoContext';
import App from './App';
import { escucharInstalacion } from './utils/instalar';
import './index.css';

// Se escucha desde el inicio porque el navegador avisa una sola vez que la app se puede instalar
escucharInstalacion();

// El service worker solo se registra en producción para no estorbar mientras se programa
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AvisoProvider>
          <App />
        </AvisoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
