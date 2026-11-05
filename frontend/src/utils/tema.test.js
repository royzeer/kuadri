import { vi } from 'vitest';
import { CLAVE_TEMA, COLOR_BARRA, elegirTema, eleccionGuardada, iniciarTema, temaActual, temaInicial } from './tema';

function sistema(oscuro) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: oscuro, addEventListener: vi.fn() });
}

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#141414" />';
  delete document.documentElement.dataset.tema;
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('tema', () => {
  test('la primera vez sigue al sistema', () => {
    sistema(true);
    expect(temaInicial()).toBe('oscuro');
    sistema(false);
    expect(temaInicial()).toBe('claro');
  });

  test('la elección guardada gana sobre el sistema', () => {
    sistema(true);
    localStorage.setItem(CLAVE_TEMA, 'claro');
    expect(temaInicial()).toBe('claro');
  });

  test('ignora valores raros guardados', () => {
    sistema(false);
    localStorage.setItem(CLAVE_TEMA, 'morado');
    expect(eleccionGuardada()).toBeNull();
    expect(temaInicial()).toBe('claro');
  });

  test('elegir oscuro lo aplica, lo guarda y cambia el color de la barra', () => {
    sistema(false);
    elegirTema('oscuro');
    expect(document.documentElement.dataset.tema).toBe('oscuro');
    expect(temaActual()).toBe('oscuro');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro');
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(COLOR_BARRA.oscuro);
  });

  test('"como el sistema" borra la elección y vuelve a seguirlo', () => {
    sistema(true);
    elegirTema('claro');
    elegirTema('sistema');
    expect(localStorage.getItem(CLAVE_TEMA)).toBeNull();
    expect(temaActual()).toBe('oscuro');
  });

  test('iniciarTema escucha los cambios del sistema mientras no haya elección', () => {
    const oyente = { matches: false, addEventListener: vi.fn() };
    window.matchMedia = vi.fn().mockReturnValue(oyente);
    iniciarTema();
    expect(temaActual()).toBe('claro');
    const alCambiar = oyente.addEventListener.mock.calls[0][1];
    oyente.matches = true;
    alCambiar();
    expect(temaActual()).toBe('oscuro');
    elegirTema('claro');
    oyente.matches = true;
    alCambiar();
    expect(temaActual()).toBe('claro');
  });
});
