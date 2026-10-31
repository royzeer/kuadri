import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AvisoApp from './AvisoApp';
import { CLAVE_AVISO_CERRADO, escucharInstalacion, tipoTelefono } from '../utils/instalar';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
const TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';
const PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

function simular(agente, { instalada = false } = {}) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(agente);
  window.matchMedia = vi.fn().mockReturnValue({ matches: instalada });
}

// Se escucha una sola vez, como en main.jsx
beforeAll(() => escucharInstalacion());

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('tipoTelefono', () => {
  test('reconoce iPhone y Android, pero no computador ni tableta', () => {
    expect(tipoTelefono(IPHONE)).toBe('ios');
    expect(tipoTelefono(ANDROID)).toBe('android');
    expect(tipoTelefono(TABLET)).toBeNull();
    expect(tipoTelefono(PC)).toBeNull();
  });
});

describe('AvisoApp', () => {
  test('no aparece en computador', () => {
    simular(PC);
    render(<AvisoApp />);
    expect(screen.queryByText('Ten Kuadri como app')).not.toBeInTheDocument();
  });

  test('no aparece si Kuadri ya está instalada', () => {
    simular(IPHONE, { instalada: true });
    render(<AvisoApp />);
    expect(screen.queryByText('Ten Kuadri como app')).not.toBeInTheDocument();
  });

  test('en iPhone muestra los pasos de Safari', async () => {
    simular(IPHONE);
    render(<AvisoApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver cómo hacerlo' }));
    expect(screen.getByText('Agregar a pantalla de inicio')).toBeInTheDocument();
  });

  test('en Android sin botón del navegador muestra los pasos del menú', async () => {
    simular(ANDROID);
    render(<AvisoApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver cómo hacerlo' }));
    expect(screen.getByText('Agregar a la pantalla principal')).toBeInTheDocument();
  });

  test('en Android con Chrome el botón Instalar abre la ventana del navegador', async () => {
    simular(ANDROID);
    const evento = new Event('beforeinstallprompt');
    evento.prompt = vi.fn().mockResolvedValue();
    evento.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(evento);

    render(<AvisoApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Instalar' }));
    expect(evento.prompt).toHaveBeenCalled();
    expect(screen.queryByText('Ten Kuadri como app')).not.toBeInTheDocument();
  });

  test('al cerrarlo no vuelve a aparecer', async () => {
    simular(IPHONE);
    const { unmount } = render(<AvisoApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('Ten Kuadri como app')).not.toBeInTheDocument();
    expect(localStorage.getItem(CLAVE_AVISO_CERRADO)).toBe('1');

    unmount();
    render(<AvisoApp />);
    expect(screen.queryByText('Ten Kuadri como app')).not.toBeInTheDocument();
  });
});
