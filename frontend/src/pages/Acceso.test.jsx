import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Acceso from './Acceso';
import { AuthProvider, useAuth } from '../context/AuthContext';

function Usuario() {
  const { usuario } = useAuth();
  return usuario ? <p>Sesión de {usuario.nombre}</p> : null;
}

function abrir(modo = 'login') {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Acceso modo={modo} />
        <Usuario />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// Simula la biblioteca de Google: guarda la función que recibe la credencial
function simularGoogle() {
  const google = { accounts: { id: { initialize: vi.fn(), renderButton: vi.fn() } } };
  window.google = google;
  return google;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete window.google;
  localStorage.clear();
});

describe('Entrar con Google', () => {
  it('no muestra el botón si no hay Client ID configurado', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    abrir();
    expect(screen.queryByTestId('boton-google')).not.toBeInTheDocument();
  });

  it('dibuja el botón y envía la credencial de Google a la API', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'cliente.apps.googleusercontent.com');
    const google = simularGoogle();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: { usuario: { id: 1, nombre: 'Ana' }, token: 'jwt-de-prueba' } }),
    });
    vi.stubGlobal('fetch', fetch);

    abrir();
    expect(screen.getByTestId('boton-google')).toBeInTheDocument();
    await waitFor(() => expect(google.accounts.id.renderButton).toHaveBeenCalled());
    const opciones = google.accounts.id.initialize.mock.calls[0][0];
    expect(opciones.client_id).toBe('cliente.apps.googleusercontent.com');

    opciones.callback({ credential: 'token-de-google' });

    expect(await screen.findByText('Sesión de Ana')).toBeInTheDocument();
    const [url, peticion] = fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/google$/);
    expect(JSON.parse(peticion.body)).toEqual({ credencial: 'token-de-google' });
    expect(localStorage.getItem('kuadri_token')).toBe('jwt-de-prueba');
  });

  it('muestra el error si la API rechaza la cuenta de Google', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'cliente.apps.googleusercontent.com');
    const google = simularGoogle();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ ok: false, mensaje: 'No se pudo verificar tu cuenta de Google. Intenta de nuevo.' }),
      }),
    );

    abrir('registro');
    await waitFor(() => expect(google.accounts.id.renderButton).toHaveBeenCalled());
    expect(google.accounts.id.renderButton.mock.calls[0][1].text).toBe('signup_with');
    google.accounts.id.initialize.mock.calls[0][0].callback({ credential: 'malo' });

    expect(await screen.findByText(/no se pudo verificar tu cuenta de google/i)).toBeInTheDocument();
  });
});
