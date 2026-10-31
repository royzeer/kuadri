// Pruebas de integración: levantan la API completa contra una base de datos de pruebas.
// Requieren MySQL en ejecución (variables DB_* del .env o del entorno de CI).
process.env.DB_NAME = process.env.DB_NAME_TEST || 'kuadri_test';

const path = require('path');
const { execFileSync } = require('child_process');
const request = require('supertest');

let app;
let pool;
let recordatorios;

beforeAll(() => {
  // Crea la base de pruebas limpia a partir del esquema
  execFileSync('node', [path.join(__dirname, '..', '..', 'scripts', 'init-db.js')], {
    env: process.env,
    stdio: 'ignore',
  });
  app = require('../../src/app');
  ({ pool } = require('../../src/config/db'));
  recordatorios = require('../../src/jobs/recordatorios.job');
});

afterAll(async () => {
  await pool.end();
});

async function registrar(correo) {
  const res = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Prueba', correo, contrasena: 'clave-segura-1' });
  return res.body.data.token;
}

describe('Autenticación', () => {
  test('registra un usuario y crea sus categorías iniciales', async () => {
    const token = await registrar('ana@test.com');
    const res = await request(app).get('/api/categorias').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((c) => c.nombre)).toEqual(['Universidad', 'SENA', 'Personal']);
  });

  test('no permite correos repetidos', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Otra', correo: 'ana@test.com', contrasena: 'clave-segura-1' });
    expect(res.status).toBe(409);
  });

  test('valida los datos del registro', async () => {
    const res = await request(app).post('/api/auth/registro').send({ nombre: 'A', correo: 'malo', contrasena: '123' });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.data.errores).sort()).toEqual(['contrasena', 'correo', 'nombre']);
  });

  test('inicia sesión con datos correctos y rechaza los incorrectos', async () => {
    const ok = await request(app).post('/api/auth/login').send({ correo: 'ana@test.com', contrasena: 'clave-segura-1' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toBeDefined();
    expect(ok.body.data.usuario.contrasena_hash).toBeUndefined();

    const mal = await request(app).post('/api/auth/login').send({ correo: 'ana@test.com', contrasena: 'otra-clave' });
    expect(mal.status).toBe(401);
  });

  test('las rutas privadas exigen token', async () => {
    const res = await request(app).get('/api/tareas');
    expect(res.status).toBe(401);
  });
});

describe('Tareas, enfoque y logros', () => {
  let token;
  let tareaId;

  beforeAll(async () => {
    token = await registrar('beto@test.com');
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  test('crea una tarea', async () => {
    const cats = await request(app).get('/api/categorias').set(auth());
    const res = await request(app)
      .post('/api/tareas')
      .set(auth())
      .send({ titulo: 'Evidencia AA5', categoriaId: cats.body.data[1].id, prioridad: 'alta' });
    expect(res.status).toBe(201);
    expect(res.body.data.categoria_nombre).toBe('SENA');
    expect(res.body.data.completada).toBe(false);
    tareaId = res.body.data.id;
  });

  test('rechaza una tarea sin título', async () => {
    const res = await request(app).post('/api/tareas').set(auth()).send({ titulo: '  ' });
    expect(res.status).toBe(422);
  });

  test('al completar la primera tarea se gana el logro "Primer paso"', async () => {
    const res = await request(app).patch(`/api/tareas/${tareaId}/completar`).set(auth()).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.tarea.completada).toBe(true);
    expect(res.body.data.nuevosLogros.map((l) => l.codigo)).toContain('PRIMER_PASO');
  });

  test('registra una sesión de enfoque y la refleja en el resumen', async () => {
    const res = await request(app).post('/api/enfoque').set(auth()).send({ minutos: 25, tareaId });
    expect(res.status).toBe(201);

    const resumen = await request(app).get('/api/estadisticas/resumen').set(auth());
    expect(resumen.body.data.semana).toHaveLength(7);
    expect(resumen.body.data.minutosSemana).toBe(25);
    expect(resumen.body.data.racha.actual).toBe(1);
  });

  test('rechaza sesiones fuera del rango permitido', async () => {
    const res = await request(app).post('/api/enfoque').set(auth()).send({ minutos: 500 });
    expect(res.status).toBe(422);
  });

  test('un usuario no puede ver las tareas de otro', async () => {
    const otro = await registrar('carla@test.com');
    const res = await request(app).get(`/api/tareas/${tareaId}`).set('Authorization', `Bearer ${otro}`);
    expect(res.status).toBe(404);
  });
});

describe('Recordatorios automáticos', () => {
  test('genera un aviso solo una vez para las tareas que vencen pronto', async () => {
    const token = await registrar('dani@test.com');
    const auth = { Authorization: `Bearer ${token}` };
    const pronto = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const lejos = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    await request(app).post('/api/tareas').set(auth).send({ titulo: 'Entrega cercana', fechaLimite: pronto });
    await request(app).post('/api/tareas').set(auth).send({ titulo: 'Entrega lejana', fechaLimite: lejos });

    const primera = await recordatorios.ejecutar();
    expect(primera.enviados).toBeGreaterThanOrEqual(1);

    const notis = await request(app).get('/api/notificaciones').set(auth);
    const mensajes = notis.body.data.map((n) => n.mensaje);
    expect(mensajes).toContain('Se acerca la entrega: Entrega cercana');
    expect(mensajes).not.toContain('Se acerca la entrega: Entrega lejana');

    // Segunda ejecución: no debe repetir el aviso
    const segunda = await recordatorios.ejecutar();
    expect(segunda.enviados).toBe(0);
  });

  test('si el correo falla, el aviso en la app se crea una sola vez', async () => {
    const correo = require('../../src/services/correo.service');
    const espia = jest.spyOn(correo, 'enviar').mockRejectedValue(new Error('Resend respondió 403'));
    const errorOriginal = console.error;
    console.error = () => {};
    try {
      const token = await registrar('fer@test.com');
      const auth = { Authorization: `Bearer ${token}` };
      const pronto = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      await request(app).post('/api/tareas').set(auth).send({ titulo: 'Entrega con correo fallido', fechaLimite: pronto });

      await recordatorios.ejecutar();
      await recordatorios.ejecutar();

      expect(espia).toHaveBeenCalled();
      const notis = await request(app).get('/api/notificaciones').set(auth);
      const avisos = notis.body.data.filter((n) => n.mensaje === 'Se acerca la entrega: Entrega con correo fallido');
      expect(avisos).toHaveLength(1);
    } finally {
      espia.mockRestore();
      console.error = errorOriginal;
    }
  });

  test('al abrir las notificaciones se revisan los recordatorios (servidor que estuvo dormido)', async () => {
    const token = await registrar('eva@test.com');
    const auth = { Authorization: `Bearer ${token}` };
    const pronto = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await request(app).post('/api/tareas').set(auth).send({ titulo: 'Entrega sorpresa', fechaLimite: pronto });

    recordatorios.reiniciarEspera();
    const notis = await request(app).get('/api/notificaciones').set(auth);
    expect(notis.body.data.map((n) => n.mensaje)).toContain('Se acerca la entrega: Entrega sorpresa');
  });
});

describe('Metas personales', () => {
  let auth;
  let metaId;

  beforeAll(async () => {
    auth = { Authorization: `Bearer ${await registrar('flor@test.com')}` };
  });

  test('crea una meta con pasos y progreso en cero', async () => {
    const res = await request(app)
      .post('/api/metas')
      .set(auth)
      .send({ titulo: 'Aprender inglés B1', fechaObjetivo: '2027-06-30', pasos: ['Curso A2', 'Curso B1'] });
    expect(res.status).toBe(201);
    expect(res.body.data.pasos.map((p) => p.texto)).toEqual(['Curso A2', 'Curso B1']);
    expect(res.body.data.progreso).toBe(0);
    expect(res.body.data.fecha_objetivo).toBe('2027-06-30');
    metaId = res.body.data.id;
  });

  test('rechaza una meta sin nombre o con fecha inválida', async () => {
    const res = await request(app).post('/api/metas').set(auth).send({ titulo: ' ', fechaObjetivo: '30/06/2027' });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.data.errores).sort()).toEqual(['fechaObjetivo', 'titulo']);
  });

  test('al hacer todos los pasos la meta se cumple sola y da el logro "Soñador"', async () => {
    const { body } = await request(app).get(`/api/metas/${metaId}`).set(auth);
    const [p1, p2] = body.data.pasos;

    const medio = await request(app).patch(`/api/metas/${metaId}/pasos/${p1.id}`).set(auth).send({ hecho: true });
    expect(medio.body.data.meta.progreso).toBe(50);
    expect(medio.body.data.meta.cumplida_en).toBeNull();

    const fin = await request(app).patch(`/api/metas/${metaId}/pasos/${p2.id}`).set(auth).send({ hecho: true });
    expect(fin.body.data.meta.progreso).toBe(100);
    expect(fin.body.data.meta.cumplida_en).not.toBeNull();
    expect(fin.body.data.nuevosLogros.map((l) => l.codigo)).toContain('META_1');
  });

  test('si se agrega un paso nuevo, la meta vuelve a quedar en curso', async () => {
    const res = await request(app).post(`/api/metas/${metaId}/pasos`).set(auth).send({ texto: 'Examen oficial' });
    expect(res.status).toBe(201);
    expect(res.body.data.meta.cumplida_en).toBeNull();
    expect(res.body.data.meta.progreso).toBe(67);
  });

  test('una meta sin pasos se puede marcar como cumplida a mano', async () => {
    const creada = await request(app).post('/api/metas').set(auth).send({ titulo: 'Leer un libro al mes' });
    const res = await request(app).patch(`/api/metas/${creada.body.data.id}/cumplir`).set(auth).send({ cumplida: true });
    expect(res.status).toBe(200);
    expect(res.body.data.meta.progreso).toBe(100);
  });

  test('un usuario no puede ver ni tocar las metas de otro', async () => {
    const otro = { Authorization: `Bearer ${await registrar('gabi@test.com')}` };
    expect((await request(app).get(`/api/metas/${metaId}`).set(otro)).status).toBe(404);
    expect((await request(app).post(`/api/metas/${metaId}/pasos`).set(otro).send({ texto: 'X' })).status).toBe(404);
    expect((await request(app).get('/api/metas').set(otro)).body.data).toEqual([]);
  });
});

describe('Lista de deseos y precios', () => {
  let auth;
  let deseoId;

  beforeAll(async () => {
    auth = { Authorization: `Bearer ${await registrar('hugo@test.com')}` };
  });

  test('agrega un deseo con su precio de hoy', async () => {
    const res = await request(app).post('/api/deseos').set(auth).send({
      nombre: 'Audífonos',
      enlace: 'https://tienda.example.com/audifonos',
      precioObjetivo: 150000,
      precioActual: 200000,
      tienda: 'Tienda X',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.deseo.precio_actual).toBe(200000);
    expect(res.body.data.deseo.historial).toHaveLength(1);
    expect(res.body.data.deseo.enObjetivo).toBe(false);
    deseoId = res.body.data.deseo.id;
  });

  test('rechaza enlaces que no son web y precios negativos', async () => {
    const res = await request(app)
      .post('/api/deseos')
      .set(auth)
      .send({ nombre: 'Malo', enlace: 'javascript:alert(1)', precioObjetivo: -5 });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.data.errores).sort()).toEqual(['enlace', 'precioObjetivo']);
  });

  test('al anotar un precio que llega al objetivo avisa una sola vez y da el logro "Paciente"', async () => {
    const baja = await request(app).post(`/api/deseos/${deseoId}/precios`).set(auth).send({ precio: 140000 });
    expect(baja.status).toBe(201);
    expect(baja.body.data.deseo.tendencia).toBe('baja');
    expect(baja.body.data.deseo.enObjetivo).toBe(true);
    expect(baja.body.data.deseo.precio_minimo).toBe(140000);
    expect(baja.body.data.nuevosLogros.map((l) => l.codigo)).toContain('PACIENTE');

    // Otro precio bajo: no repite el aviso
    await request(app).post(`/api/deseos/${deseoId}/precios`).set(auth).send({ precio: 130000 });
    const notis = await request(app).get('/api/notificaciones').set(auth);
    const avisos = notis.body.data.filter((n) => n.mensaje.includes('llegó a tu precio objetivo'));
    expect(avisos).toHaveLength(1);
  });

  test('guarda el historial en orden y permite borrar un precio mal anotado', async () => {
    const { body } = await request(app).get(`/api/deseos/${deseoId}`).set(auth);
    expect(body.data.historial.map((p) => p.precio)).toEqual([200000, 140000, 130000]);
    const ultimo = body.data.historial[2];
    const res = await request(app).delete(`/api/deseos/${deseoId}/precios/${ultimo.id}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.precio_actual).toBe(140000);
  });

  test('marca un deseo como comprado', async () => {
    const res = await request(app).patch(`/api/deseos/${deseoId}/comprar`).set(auth).send({ comprado: true });
    expect(res.status).toBe(200);
    expect(res.body.data.comprado_en).not.toBeNull();
  });

  test('un usuario no puede ver ni anotar precios en los deseos de otro', async () => {
    const otro = { Authorization: `Bearer ${await registrar('ines@test.com')}` };
    expect((await request(app).get(`/api/deseos/${deseoId}`).set(otro)).status).toBe(404);
    expect((await request(app).post(`/api/deseos/${deseoId}/precios`).set(otro).send({ precio: 1 })).status).toBe(404);
  });
});

describe('Estudio creativo', () => {
  let auth;
  let paletaId;
  let fuenteId;

  beforeAll(async () => {
    auth = { Authorization: `Bearer ${await registrar('juli@test.com')}` };
  });

  test('guarda una paleta con sus colores en mayúscula y da el logro "Creativo"', async () => {
    const res = await request(app)
      .post('/api/estudio/paletas')
      .set(auth)
      .send({ nombre: 'Lima', colores: ['#b1cb5a', '#141414', '#D6E6A1'] });
    expect(res.status).toBe(201);
    expect(res.body.data.paleta.colores).toEqual(['#B1CB5A', '#141414', '#D6E6A1']);
    expect(res.body.data.nuevosLogros.map((l) => l.codigo)).toContain('CREATIVO');
    paletaId = res.body.data.paleta.id;
  });

  test('rechaza paletas con un solo color o con colores mal escritos', async () => {
    const uno = await request(app).post('/api/estudio/paletas').set(auth).send({ nombre: 'X', colores: ['#FFFFFF'] });
    expect(uno.status).toBe(422);
    const malo = await request(app).post('/api/estudio/paletas').set(auth).send({ nombre: '', colores: ['#FFF', 'azul'] });
    expect(Object.keys(malo.body.data.errores).sort()).toEqual(['colores', 'nombre']);
  });

  test('guarda una tipografía y rechaza nombres con símbolos raros', async () => {
    const res = await request(app)
      .post('/api/estudio/tipografias')
      .set(auth)
      .send({ nombre: '  Space   Grotesk ', uso: 'titulos', muestra: 'Hola mundo' });
    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('Space Grotesk');
    fuenteId = res.body.data.id;

    const mal = await request(app).post('/api/estudio/tipografias').set(auth).send({ nombre: 'Roboto&family=x', uso: 'otro' });
    expect(mal.status).toBe(422);
    expect(Object.keys(mal.body.data.errores).sort()).toEqual(['nombre', 'uso']);
  });

  test('una plantilla junta la paleta y las fuentes', async () => {
    const res = await request(app)
      .post('/api/estudio/plantillas')
      .set(auth)
      .send({ nombre: 'Portafolio', paletaId, fuenteTitulosId: fuenteId, fuenteTextoId: fuenteId, nota: 'Para mi web' });
    expect(res.status).toBe(201);
    expect(res.body.data.colores).toEqual(['#B1CB5A', '#141414', '#D6E6A1']);
    expect(res.body.data.fuente_titulos).toBe('Space Grotesk');

    // Si se borra la paleta, la plantilla sigue pero sin colores
    await request(app).delete(`/api/estudio/paletas/${paletaId}`).set(auth);
    const lista = await request(app).get('/api/estudio/plantillas').set(auth);
    expect(lista.body.data[0].paleta_id).toBeNull();
    expect(lista.body.data[0].colores).toEqual([]);
  });

  test('un usuario no puede usar ni tocar el estudio de otro', async () => {
    const otro = { Authorization: `Bearer ${await registrar('kike@test.com')}` };
    const res = await request(app).post('/api/estudio/plantillas').set(otro).send({ nombre: 'Copia', fuenteTitulosId: fuenteId });
    expect(res.status).toBe(422);
    expect(res.body.data.errores.fuenteTitulosId).toBeDefined();
    expect((await request(app).delete(`/api/estudio/tipografias/${fuenteId}`).set(otro)).status).toBe(404);
    expect((await request(app).get('/api/estudio/tipografias').set(otro)).body.data).toEqual([]);
  });
});

describe('Registro de ocio y equilibrio', () => {
  let auth;
  let ocioId;

  beforeAll(async () => {
    auth = { Authorization: `Bearer ${await registrar('luna@test.com')}` };
  });

  test('agrega un videojuego pendiente', async () => {
    const res = await request(app)
      .post('/api/ocio')
      .set(auth)
      .send({ titulo: 'Hollow Knight', tipo: 'videojuego', plataforma: 'PC' });
    expect(res.status).toBe(201);
    expect(res.body.data.ocio.estado).toBe('pendiente');
    expect(res.body.data.ocio.minutos_total).toBe(0);
    ocioId = res.body.data.ocio.id;
  });

  test('valida tipo, estado y nota', async () => {
    const res = await request(app).post('/api/ocio').set(auth).send({ titulo: ' ', tipo: 'anime', estado: 'x', calificacion: 7 });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.data.errores).sort()).toEqual(['calificacion', 'estado', 'tipo', 'titulo']);
  });

  test('anotar un rato lo pasa a "en curso" y suma minutos', async () => {
    const res = await request(app).post(`/api/ocio/${ocioId}/ratos`).set(auth).send({ minutos: 45 });
    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('en_curso');
    expect(res.body.data.minutos_total).toBe(45);
    expect(res.body.data.ratos).toHaveLength(1);

    const futuro = await request(app).post(`/api/ocio/${ocioId}/ratos`).set(auth).send({ minutos: 30, fecha: '2999-01-01' });
    expect(futuro.status).toBe(422);
  });

  test('el resumen semanal muestra los minutos de ocio junto a los de estudio', async () => {
    await request(app).post('/api/enfoque').set(auth).send({ minutos: 25 });
    const res = await request(app).get('/api/estadisticas/resumen').set(auth);
    expect(res.body.data.ocioSemana).toBe(45);
    expect(res.body.data.minutosSemana).toBe(25);
    expect(res.body.data.semana[6].ocio).toBe(45);
  });

  test('al terminarlo guarda la fecha y da el logro "Equilibrado"', async () => {
    const res = await request(app)
      .put(`/api/ocio/${ocioId}`)
      .set(auth)
      .send({ titulo: 'Hollow Knight', tipo: 'videojuego', estado: 'terminado', calificacion: 5, plataforma: 'PC' });
    expect(res.status).toBe(200);
    expect(res.body.data.ocio.terminado_en).not.toBeNull();
    expect(res.body.data.ocio.calificacion).toBe(5);
    expect(res.body.data.nuevosLogros.map((l) => l.codigo)).toContain('EQUILIBRADO');
  });

  test('permite borrar un rato mal anotado', async () => {
    const { body } = await request(app).get(`/api/ocio/${ocioId}`).set(auth);
    const res = await request(app).delete(`/api/ocio/${ocioId}/ratos/${body.data.ratos[0].id}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.minutos_total).toBe(0);
  });

  test('un usuario no puede ver ni anotar ratos en el ocio de otro', async () => {
    const otro = { Authorization: `Bearer ${await registrar('mono@test.com')}` };
    expect((await request(app).get(`/api/ocio/${ocioId}`).set(otro)).status).toBe(404);
    expect((await request(app).post(`/api/ocio/${ocioId}/ratos`).set(otro).send({ minutos: 10 })).status).toBe(404);
  });
});

describe('Campus virtuales', () => {
  const ENLACE = 'https://campus.prueba.edu.co/calendar/export_execute.php?userid=9&authtoken=secreto123';
  let auth;
  let campusId;
  let calendario;
  let campusJob;
  let ics;

  // Fecha iCal en UTC a N días de hoy, para que siempre sean entregas futuras.
  const enDias = (n) =>
    new Date(Date.now() + n * 86400000)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const evento = (uid, titulo, dias) =>
    ['BEGIN:VEVENT', `UID:${uid}`, `SUMMARY:${titulo}`, 'CATEGORIES:Programación web', `DTSTART:${enDias(dias)}`, 'END:VEVENT'];
  const calendarioCon = (...eventos) => ['BEGIN:VCALENDAR', ...eventos.flat(), 'END:VCALENDAR'].join('\r\n');

  beforeAll(async () => {
    auth = { Authorization: `Bearer ${await registrar('pepe@test.com')}` };
    calendario = require('../../src/services/calendario.service');
    campusJob = require('../../src/jobs/campus.job');
    ics = calendarioCon(evento('a1', 'Vencimiento de Taller 1', 2), evento('a2', 'Se abre Foro 2', 3));
    // No se sale a internet: el "campus" devuelve el calendario de prueba
    jest.spyOn(calendario, 'descargar').mockImplementation(async () => ics);
  });

  afterAll(() => jest.restoreAllMocks());

  test('conecta un campus, prueba el enlace y trae las entregas pendientes', async () => {
    const cats = await request(app).get('/api/categorias').set(auth);
    const universidad = cats.body.data.find((c) => c.nombre === 'Universidad');
    const res = await request(app)
      .post('/api/campus')
      .set(auth)
      .send({ nombre: 'Unimagdalena', enlace: ENLACE, categoriaId: universidad.id });
    expect(res.status).toBe(201);
    expect(res.body.data.sincronizacion.nuevas).toBe(1);
    expect(res.body.data.campus.dominio).toBe('campus.prueba.edu.co');
    expect(res.body.data.campus.importadas).toBe(1);
    campusId = res.body.data.campus.id;

    const tareas = await request(app).get('/api/tareas').set(auth);
    expect(tareas.body.data).toHaveLength(1);
    expect(tareas.body.data[0].titulo).toBe('Taller 1');
    expect(tareas.body.data[0].categoria_nombre).toBe('Universidad');
    expect(tareas.body.data[0].prioridad).toBe('alta');
    expect(tareas.body.data[0].descripcion).toContain('Curso: Programación web');
  });

  test('nunca devuelve el enlace y lo guarda cifrado', async () => {
    const res = await request(app).get('/api/campus').set(auth);
    expect(JSON.stringify(res.body)).not.toContain('secreto123');
    const [fila] = await pool.query('SELECT enlace_cifrado FROM campus_conexiones WHERE id = ?', [campusId]);
    expect(fila[0].enlace_cifrado).not.toContain('secreto123');
  });

  test('al sincronizar de nuevo no repite tareas y trae solo las nuevas', async () => {
    ics = calendarioCon(evento('a1', 'Vencimiento de Taller 1', 2), evento('a3', 'Vencimiento de Ensayo', 20));
    const res = await request(app).post('/api/campus/sincronizar').set(auth).send({});
    expect(res.body.data.nuevas).toBe(1);
    const tareas = await request(app).get('/api/tareas').set(auth);
    expect(tareas.body.data.map((t) => t.titulo).sort()).toEqual(['Ensayo', 'Taller 1']);
  });

  test('si el profesor cambia la fecha, se actualiza la tarea', async () => {
    ics = calendarioCon(evento('a1', 'Vencimiento de Taller 1', 5), evento('a3', 'Vencimiento de Ensayo', 20));
    const res = await request(app).post('/api/campus/sincronizar').set(auth).send({});
    expect(res.body.data.actualizadas).toBe(1);
    expect(res.body.data.nuevas).toBe(0);
  });

  test('una tarea borrada a mano no vuelve a aparecer', async () => {
    const tareas = await request(app).get('/api/tareas').set(auth);
    const ensayo = tareas.body.data.find((t) => t.titulo === 'Ensayo');
    await request(app).delete(`/api/tareas/${ensayo.id}`).set(auth);
    await request(app).post('/api/campus/sincronizar').set(auth).send({});
    const despues = await request(app).get('/api/tareas').set(auth);
    expect(despues.body.data.map((t) => t.titulo)).toEqual(['Taller 1']);
  });

  test('la sincronización al abrir la app espera unos minutos', async () => {
    const res = await request(app).post('/api/campus/sincronizar').set(auth).send({ automatica: true });
    expect(res.body.data.campus).toHaveLength(0);
  });

  test('avisa con una notificación cuando llegan actividades nuevas', async () => {
    const res = await request(app).get('/api/notificaciones').set(auth);
    expect(res.body.data.some((n) => n.mensaje.startsWith('Unimagdalena:'))).toBe(true);
  });

  test('guarda el error si el campus falla, sin romper la app', async () => {
    calendario.descargar.mockRejectedValueOnce(new Error('No se pudo conectar con el campus'));
    const res = await request(app).post('/api/campus/sincronizar').set(auth).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.campus[0].error).toBe('No se pudo conectar con el campus');
    const lista = await request(app).get('/api/campus').set(auth);
    expect(lista.body.data[0].ultimo_error).toBe('No se pudo conectar con el campus');
  });

  test('rechaza enlaces inválidos y calendarios que no se pueden leer', async () => {
    const malo = await request(app).post('/api/campus').set(auth).send({ nombre: 'Zajuna', enlace: 'http://127.0.0.1/x' });
    expect(malo.status).toBe(422);
    expect(malo.body.data.errores.enlace).toBeDefined();

    calendario.descargar.mockResolvedValueOnce('<html>Inicia sesión</html>');
    const noLee = await request(app)
      .post('/api/campus')
      .set(auth)
      .send({ nombre: 'Zajuna', enlace: 'https://zajuna.prueba.co/calendar/export_execute.php?a=1' });
    expect(noLee.status).toBe(422);
    expect(noLee.body.data.errores.enlace).toContain('calendario');
  });

  test('un usuario no puede ver, cambiar ni borrar el campus de otro', async () => {
    const otro = { Authorization: `Bearer ${await registrar('lola@test.com')}` };
    expect((await request(app).get('/api/campus').set(otro)).body.data).toHaveLength(0);
    expect((await request(app).put(`/api/campus/${campusId}`).set(otro).send({ nombre: 'X' })).status).toBe(404);
    expect((await request(app).delete(`/api/campus/${campusId}`).set(otro)).status).toBe(404);
  });

  test('la sincronización general exige la clave del planificador', async () => {
    const sinClave = await request(app).post('/api/campus/sincronizar-todos');
    expect(sinClave.status).toBe(401);
    const resultado = await campusJob.ejecutar(new Date(Date.now() + 3600000));
    expect(resultado.revisados).toBeGreaterThanOrEqual(1);
  });

  test('al desconectar el campus las tareas que ya llegaron se quedan', async () => {
    const res = await request(app).delete(`/api/campus/${campusId}`).set(auth);
    expect(res.status).toBe(200);
    const tareas = await request(app).get('/api/tareas').set(auth);
    expect(tareas.body.data).toHaveLength(1);
  });
});
