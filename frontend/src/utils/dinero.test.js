import { estadoPrecio, formatearPesos, puntosGrafico } from './dinero';

describe('dinero', () => {
  test('formatearPesos usa pesos colombianos sin decimales', () => {
    expect(formatearPesos(150000).replace(/\s/g, ' ')).toBe('$ 150.000');
    expect(formatearPesos(null)).toBe('Sin precio');
  });

  test('estadoPrecio compara el precio de hoy con el objetivo', () => {
    expect(estadoPrecio({ precio_actual: null, precio_objetivo: 100 }).listo).toBe(false);
    expect(estadoPrecio({ precio_actual: 90, precio_objetivo: 100 })).toEqual({ texto: 'Llegó a tu precio', listo: true });
    expect(estadoPrecio({ precio_actual: 130, precio_objetivo: 100 }).texto).toMatch(/^Faltan/);
  });

  test('puntosGrafico pone el precio más alto arriba y el más bajo abajo', () => {
    const puntos = puntosGrafico([{ precio: 200 }, { precio: 100 }], 120, 60);
    expect(puntos).toEqual([
      { x: 10, y: 10 },
      { x: 110, y: 50 },
    ]);
    expect(puntosGrafico([{ precio: 5 }], 120, 60)).toEqual([{ x: 60, y: 30 }]);
  });
});
