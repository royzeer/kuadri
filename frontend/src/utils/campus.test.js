import { resumenSincronizacion } from './campus';

describe('resumenSincronizacion', () => {
  test('dice si todo está al día', () => {
    expect(resumenSincronizacion({ nuevas: 0, actualizadas: 0, campus: [] })).toBe(
      'Todo al día: no hay actividades nuevas',
    );
  });

  test('cuenta las actividades nuevas y las cambiadas', () => {
    expect(resumenSincronizacion({ nuevas: 1, actualizadas: 2, campus: [] })).toBe(
      'Listo: 1 actividad nueva y 2 con fecha cambiada',
    );
  });

  test('muestra el error del campus si algo falló', () => {
    const campus = [{ nombre: 'Zajuna', error: 'No se pudo conectar con el campus' }];
    expect(resumenSincronizacion({ nuevas: 0, actualizadas: 0, campus })).toBe(
      'Zajuna: No se pudo conectar con el campus',
    );
  });
});
