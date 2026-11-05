import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import BotonTema from './BotonTema';
import { CLAVE_TEMA, iniciarTema } from '../utils/tema';

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() });
  iniciarTema();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('BotonTema', () => {
  test('cambia entre claro y oscuro y recuerda la elección', async () => {
    render(<BotonTema />);
    const boton = screen.getByRole('button', { name: 'Cambiar a modo oscuro' });
    await userEvent.click(boton);
    expect(document.documentElement.dataset.tema).toBe('oscuro');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro');

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }));
    expect(document.documentElement.dataset.tema).toBe('claro');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('claro');
  });
});
