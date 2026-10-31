// Pruebas de la lectura de calendarios del campus, el cifrado y la validación de enlaces.
const { leerEventos, actividadesPendientes, limpiarTitulo } = require('../../src/utils/ical');
const { cifrar, descifrar } = require('../../src/utils/cifrado');
const { normalizarEnlace } = require('../../src/services/calendario.service');
const { prioridadPorFecha, tocaSincronizar } = require('../../src/services/campus.service');

// Calendario de ejemplo como el que exporta Moodle (Zajuna)
const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Moodle Pty Ltd//NONSGML Moodle Version 2024100700//EN',
  'BEGIN:VEVENT',
  'UID:101@zajuna.sena.edu.co',
  'SUMMARY:Vencimiento de Diagrama de flujo GA5-220501',
  'DESCRIPTION:Sube el diagrama\\, en PDF.\\nMáximo 2 páginas',
  'CATEGORIES:P_22810010_V_3659691',
  'DTSTART:20261105T045900Z',
  'DTEND:20261105T045900Z',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:102@zajuna.sena.edu.co',
  'SUMMARY:Se cierra Cuestionario GA3-240202501-AA1 con un titulo muy largo que',
  '  sigue en la siguiente linea',
  'DTSTART;TZID=America/Bogota:20261110T235900',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:103@zajuna.sena.edu.co',
  'SUMMARY:Se abre Cuestionario final',
  'DTSTART;VALUE=DATE:20261112',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:104@zajuna.sena.edu.co',
  'SUMMARY:Vencimiento de Evidencia vieja',
  'DTSTART:20261001T045900Z',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:105@zajuna.sena.edu.co',
  'SUMMARY:Clase cancelada',
  'STATUS:CANCELLED',
  'DTSTART:20261106T150000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const ahora = new Date('2026-10-31T12:00:00Z');

describe('lectura de calendarios iCal', () => {
  test('lee eventos, textos escapados y líneas dobladas', () => {
    const eventos = leerEventos(ICS);
    expect(eventos).toHaveLength(5);
    expect(eventos[0].descripcion).toBe('Sube el diagrama, en PDF.\nMáximo 2 páginas');
    expect(eventos[0].curso).toBe('P_22810010_V_3659691');
    expect(eventos[1].titulo).toContain('muy largo que sigue en la siguiente linea');
  });

  test('interpreta fechas UTC, con zona horaria y de todo el día', () => {
    const [utc, conZona, diaCompleto] = leerEventos(ICS);
    expect(utc.fecha.toISOString()).toBe('2026-11-05T04:59:00.000Z');
    expect(conZona.fecha.toISOString()).toBe('2026-11-11T04:59:00.000Z'); // 11:59 p. m. en Bogotá
    expect(diaCompleto.fecha.getHours()).toBe(23);
  });

  test('solo deja entregas futuras: sin aperturas, vencidas ni canceladas', () => {
    const pendientes = actividadesPendientes(leerEventos(ICS), ahora);
    expect(pendientes.map((p) => p.uid)).toEqual(['101@zajuna.sena.edu.co', '102@zajuna.sena.edu.co']);
    expect(pendientes[0].titulo).toBe('Diagrama de flujo GA5-220501');
    expect(pendientes[1].titulo.startsWith('Cuestionario GA3')).toBe(true);
  });

  test('limpia las frases que agrega el campus al título', () => {
    expect(limpiarTitulo('Taller 2 is due')).toBe('Taller 2');
    expect(limpiarTitulo('Foro 1 vence')).toBe('Foro 1');
    expect(limpiarTitulo('Vencimiento de Mapa mental')).toBe('Mapa mental');
  });

  test('rechaza lo que no es un calendario', () => {
    expect(() => leerEventos('<html>Inicia sesión</html>')).toThrow('no devolvió un calendario');
  });
});

describe('cifrado del enlace', () => {
  test('cifra y descifra sin dejar el enlace a la vista', () => {
    const enlace = 'https://campus.edu.co/calendar/export_execute.php?userid=7&authtoken=abc123';
    const cifrado = cifrar(enlace);
    expect(cifrado).not.toContain('abc123');
    expect(cifrar(enlace)).not.toBe(cifrado); // cada vez cambia
    expect(descifrar(cifrado)).toBe(enlace);
  });

  test('detecta si el texto cifrado fue alterado', () => {
    const partes = cifrar('https://campus.edu.co/x').split(':');
    partes[3] = Buffer.from('otra cosa').toString('base64');
    expect(() => descifrar(partes.join(':'))).toThrow();
  });
});

describe('validación del enlace', () => {
  test('acepta https y convierte webcal', () => {
    expect(normalizarEnlace('webcal://d2l.campus.edu.co/feed.ics')).toBe('https://d2l.campus.edu.co/feed.ics');
  });

  test('en Moodle pide todos los cursos y los próximos 60 días', () => {
    const url = new URL(
      normalizarEnlace(
        'https://zajuna.sena.edu.co/calendar/export_execute.php?userid=1&authtoken=x&preset_what=user&preset_time=weeknow',
      ),
    );
    expect(url.searchParams.get('preset_what')).toBe('all');
    expect(url.searchParams.get('preset_time')).toBe('recentupcoming');
    expect(url.searchParams.get('authtoken')).toBe('x');
  });

  test('rechaza http, direcciones internas y textos que no son enlaces', () => {
    expect(normalizarEnlace('http://campus.edu.co/feed.ics')).toBeNull();
    expect(normalizarEnlace('https://localhost/feed.ics')).toBeNull();
    expect(normalizarEnlace('https://127.0.0.1/feed.ics')).toBeNull();
    expect(normalizarEnlace('https://[::1]/feed.ics')).toBeNull();
    expect(normalizarEnlace('https://servidor.internal/feed.ics')).toBeNull();
    expect(normalizarEnlace('mi contraseña')).toBeNull();
  });
});

describe('reglas de sincronización', () => {
  test('la prioridad depende de qué tan cerca está la entrega', () => {
    expect(prioridadPorFecha(new Date('2026-11-02T12:00:00Z'), ahora)).toBe('alta');
    expect(prioridadPorFecha(new Date('2026-11-07T12:00:00Z'), ahora)).toBe('media');
    expect(prioridadPorFecha(new Date('2026-11-30T12:00:00Z'), ahora)).toBe('baja');
  });

  test('la sincronización automática espera unos minutos entre una y otra', () => {
    expect(tocaSincronizar({ ultima_sincronizacion: null }, ahora, 10)).toBe(true);
    expect(tocaSincronizar({ ultima_sincronizacion: new Date('2026-10-31T11:55:00Z') }, ahora, 10)).toBe(false);
    expect(tocaSincronizar({ ultima_sincronizacion: new Date('2026-10-31T11:45:00Z') }, ahora, 10)).toBe(true);
  });
});
