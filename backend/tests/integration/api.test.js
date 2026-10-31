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
