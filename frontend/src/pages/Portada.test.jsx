import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import { AvisoProvider } from '../components/AvisoContext';

function abrir(ruta, { instalada = false } = {}) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: instalada });
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <AvisoProvider>
          <App />
        </AvisoProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('Portada', () => {
  it('explica Kuadri a quien llega sin sesión y lleva a registrarse', () => {
    abrir('/');
    expect(screen.getByRole('heading', { level: 1, name: /organiza tus entregas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
  });

  it('no estorba con el aviso de instalar, aunque se abra en un teléfono', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130.0 Mobile Safari/537.36');
    abrir('/');
    expect(screen.queryByLabelText('Instalar Kuadri')).not.toBeInTheDocument();
  });

  it('en la app instalada se abre directo el inicio de sesión', () => {
    abrir('/', { instalada: true });
    expect(screen.getByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /organiza tus entregas/i })).not.toBeInTheDocument();
  });

  it('las rutas privadas sin sesión siguen pidiendo iniciar sesión', () => {
    abrir('/tareas');
    expect(screen.getByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
  });
});
