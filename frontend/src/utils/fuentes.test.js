import { cargarFuente, nombreValido, urlFuente } from './fuentes';

describe('fuentes', () => {
  test('arma el enlace de Google Fonts con el nombre de la fuente', () => {
    expect(urlFuente(' Space  Grotesk ')).toBe(
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap',
    );
  });

  test('solo acepta nombres de fuente sin símbolos', () => {
    expect(nombreValido('M PLUS 1p')).toBe(true);
    expect(nombreValido('Roboto&family=Otra')).toBe(false);
    expect(nombreValido('   ')).toBe(false);
  });

  test('carga cada fuente una sola vez', () => {
    cargarFuente('Lobster');
    cargarFuente('Lobster');
    expect(document.querySelectorAll('link[href*="family=Lobster"]')).toHaveLength(1);
  });
});
