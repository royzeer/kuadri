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
