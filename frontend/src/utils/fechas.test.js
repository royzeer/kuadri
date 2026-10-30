import { celdasDelMes, claveDia, describirLimite, diaCorto, formatearMinutos } from './fechas';

describe('utilidades de fechas', () => {
  test('el calendario siempre tiene 42 celdas y empieza en lunes', () => {
    const celdas = celdasDelMes(2026, 9); // octubre 2026
    expect(celdas).toHaveLength(42);
    expect(celdas[0].fecha.getDay()).toBe(1); // lunes
    expect(celdas.find((c) => c.delMes).clave).toBe('2026-10-01');
  });

  test('formatea minutos en texto legible', () => {
    expect(formatearMinutos(25)).toBe('25 min');
    expect(formatearMinutos(60)).toBe('1 h');
    expect(formatearMinutos(95)).toBe('1 h 35 min');
  });

  test('reconoce el día de la semana', () => {
    expect(diaCorto('2026-10-29')).toBe('Jue');
  });

  test('describe la fecha límite según el día', () => {
    const ahora = new Date(2026, 9, 29, 10, 0);
    expect(describirLimite(null, ahora).texto).toBe('Sin fecha');
    expect(describirLimite(new Date(2026, 9, 29, 18, 0), ahora).texto).toMatch(/^Hoy/);
    expect(describirLimite(new Date(2026, 9, 30, 9, 0), ahora).texto).toMatch(/^Mañana/);
    expect(describirLimite(new Date(2026, 9, 28, 9, 0), ahora).vencida).toBe(true);
  });

  test('claveDia usa la fecha local', () => {
    expect(claveDia(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
