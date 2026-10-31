import { equilibrio, estadoOcio, tipoOcio } from './ocio';

describe('ocio', () => {
  test('equilibrio reparte el tiempo en porcentajes que suman 100', () => {
    expect(equilibrio(0, 0).estudio).toBe(0);
    expect(equilibrio(90, 30)).toMatchObject({ estudio: 75, ocio: 25 });
    expect(equilibrio(100, 0).mensaje).toMatch(/solo estudiaste/);
    expect(equilibrio(20, 80).mensaje).toMatch(/ocio va ganando/);
  });

  test('traduce el tipo y el estado a textos amigables', () => {
    expect(tipoOcio('pelicula').texto).toBe('Película');
    expect(tipoOcio('raro').texto).toBe('Otro');
    expect(estadoOcio('abandonado')).toBe('Lo dejé');
  });
});
