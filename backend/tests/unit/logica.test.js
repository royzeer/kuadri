// Pruebas unitarias de la lógica pura: no necesitan base de datos.
const { calcularRacha } = require('../../src/services/estadisticas.service');
const { logrosCumplidos } = require('../../src/services/logro.service');
const { sumarDias, ultimosDias } = require('../../src/utils/fechas');
const { escapar } = require('../../src/services/correo.service');
const { calcularProgreso } = require('../../src/services/meta.service');
const { analizarPrecios } = require('../../src/services/deseo.service');
const { normalizarColores, limpiarFuente } = require('../../src/services/estudio.service');
const { calificacion, fechaRato } = require('../../src/services/ocio.service');
const { enlace, precio, dia } = require('../../src/utils/validar');

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

describe('metas y deseos', () => {
  test('calcularProgreso usa los pasos hechos y da 100 si la meta está cumplida', () => {
    expect(calcularProgreso({ total_pasos: 0, pasos_hechos: 0, cumplida_en: null })).toBe(0);
    expect(calcularProgreso({ total_pasos: 3, pasos_hechos: 1, cumplida_en: null })).toBe(33);
    expect(calcularProgreso({ total_pasos: 0, pasos_hechos: 0, cumplida_en: '2026-10-31' })).toBe(100);
  });

  test('analizarPrecios detecta si el precio baja, sube o llega al objetivo', () => {
    const p = (precios) => precios.map((v) => ({ precio: v }));
    expect(analizarPrecios([], 100)).toEqual({ tendencia: null, diferencia: 0, enObjetivo: false });
    expect(analizarPrecios(p([200]), null).tendencia).toBeNull();
    expect(analizarPrecios(p([200, 150]), 160)).toEqual({ tendencia: 'baja', diferencia: -50, enObjetivo: true });
    expect(analizarPrecios(p([150, 180]), 160)).toEqual({ tendencia: 'sube', diferencia: 30, enObjetivo: false });
  });

  test('valida enlaces, precios y fechas sin hora', () => {
    expect(enlace('')).toBeNull();
    expect(enlace('https://a.co/x')).toBe('https://a.co/x');
    expect(enlace('javascript:alert(1)')).toBeUndefined();
    expect(precio('125000')).toBe(125000);
    expect(precio('0')).toBeUndefined();
    expect(dia('2027-02-28')).toBe('2027-02-28');
    expect(dia('2027-02-30')).toBeUndefined();
  });
});

describe('estudio y ocio', () => {
  test('normalizarColores pasa a mayúsculas y rechaza colores mal escritos', () => {
    expect(normalizarColores(['#b1cb5a', ' #141414 '])).toEqual(['#B1CB5A', '#141414']);
    expect(normalizarColores(['#B1CB5A', 'rojo'])).toBeNull();
    expect(normalizarColores('#B1CB5A')).toBeNull();
  });

  test('limpiarFuente junta los espacios repetidos', () => {
    expect(limpiarFuente('  Space   Grotesk ')).toBe('Space Grotesk');
  });

  test('la calificación es opcional y va de 1 a 5', () => {
    expect(calificacion('')).toBeNull();
    expect(calificacion('4')).toBe(4);
    expect(calificacion(6)).toBeUndefined();
    expect(calificacion(2.5)).toBeUndefined();
  });

  test('fechaRato usa ahora para hoy, mediodía para días pasados y rechaza el futuro', () => {
    const ahora = new Date(2026, 9, 31, 21, 15);
    expect(fechaRato(undefined, ahora)).toBe(ahora);
    expect(fechaRato('2026-10-31', ahora)).toBe(ahora);
    expect(fechaRato('2026-10-29', ahora)).toEqual(new Date(2026, 9, 29, 12));
    expect(fechaRato('2026-11-01', ahora)).toBeUndefined();
    expect(fechaRato('29/10/2026', ahora)).toBeUndefined();
  });

  test('da los logros "Creativo" y "Equilibrado"', () => {
    const base = { tareasCompletadas: 0, mejorRacha: 0, minutosEnfoque: 0, tareasMadrugada: 0 };
    expect(logrosCumplidos({ ...base, paletas: 1, ocioTerminado: 1 }).sort()).toEqual(['CREATIVO', 'EQUILIBRADO']);
  });
});

describe('correo', () => {
  test('escapa HTML para evitar inyección en la plantilla', () => {
    expect(escapar('<b>"hola"</b>')).toBe('&lt;b&gt;&quot;hola&quot;&lt;/b&gt;');
  });
});
