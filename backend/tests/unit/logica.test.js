// Pruebas unitarias de la lógica pura: no necesitan base de datos.
const { calcularRacha } = require('../../src/services/estadisticas.service');
const { logrosCumplidos } = require('../../src/services/logro.service');
const { sumarDias, ultimosDias } = require('../../src/utils/fechas');
const { escapar } = require('../../src/services/correo.service');

describe('fechas', () => {
  test('sumarDias cruza meses y años', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31');
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29'); // año bisiesto
  });

  test('ultimosDias devuelve la semana en orden', () => {
    expect(ultimosDias('2026-10-29', 3)).toEqual(['2026-10-27', '2026-10-28', '2026-10-29']);
  });
});

describe('calcularRacha', () => {
  const hoy = '2026-10-29';

  test('sin actividad la racha es cero', () => {
    expect(calcularRacha([], hoy)).toEqual({ actual: 0, mejor: 0 });
  });

  test('cuenta días consecutivos que terminan hoy', () => {
    expect(calcularRacha(['2026-10-27', '2026-10-28', '2026-10-29'], hoy)).toEqual({ actual: 3, mejor: 3 });
  });

  test('si hoy aún no hay actividad, la racha que termina ayer sigue viva', () => {
    expect(calcularRacha(['2026-10-27', '2026-10-28'], hoy).actual).toBe(2);
  });

  test('si el último día activo fue antier, la racha actual se pierde', () => {
    expect(calcularRacha(['2026-10-26', '2026-10-27'], hoy)).toEqual({ actual: 0, mejor: 2 });
  });

  test('guarda la mejor racha histórica aunque la actual sea menor', () => {
    const dias = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-28', '2026-10-29'];
    expect(calcularRacha(dias, hoy)).toEqual({ actual: 2, mejor: 4 });
  });

  test('ignora días repetidos y el orden de entrada', () => {
    expect(calcularRacha(['2026-10-29', '2026-10-28', '2026-10-29'], hoy)).toEqual({ actual: 2, mejor: 2 });
  });
});

describe('logrosCumplidos', () => {
  const base = { tareasCompletadas: 0, mejorRacha: 0, minutosEnfoque: 0, tareasMadrugada: 0 };

  test('un usuario nuevo no tiene logros', () => {
    expect(logrosCumplidos(base)).toEqual([]);
  });

  test('otorga varios logros según el estado', () => {
    const estado = { tareasCompletadas: 10, mejorRacha: 3, minutosEnfoque: 300, tareasMadrugada: 1 };
    expect(logrosCumplidos(estado).sort()).toEqual(
      ['ENFOQUE_300', 'MADRUGADOR', 'PRIMER_PASO', 'RACHA_3', 'TAREAS_10'].sort(),
    );
  });
});

describe('correo', () => {
  test('escapa HTML para evitar inyección en la plantilla', () => {
    expect(escapar('<b>"hola"</b>')).toBe('&lt;b&gt;&quot;hola&quot;&lt;/b&gt;');
  });
});
