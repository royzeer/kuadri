// Prueba el envío por la API de Resend sin enviar correos reales (fetch simulado).
describe('envío de correo con Resend', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env.RESEND_API_KEY = 'clave-de-prueba';
    process.env.RESEND_FROM = 'Kuadri <onboarding@resend.dev>';
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
  });

  test('envía la petición correcta a la API', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const correo = require('../../src/services/correo.service');

    const r = await correo.enviar('yo@correo.com', 'Recordatorio', '<p>Hola</p>');

    expect(r.proveedor).toBe('resend');
    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(opciones.headers.Authorization).toBe('Bearer clave-de-prueba');
    expect(JSON.parse(opciones.body)).toEqual({
      from: 'Kuadri <onboarding@resend.dev>',
      to: ['yo@correo.com'],
      subject: 'Recordatorio',
      html: '<p>Hola</p>',
    });
  });

  test('lanza un error claro si Resend rechaza el envío', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'dominio no verificado' });
    const correo = require('../../src/services/correo.service');
    await expect(correo.enviar('otro@correo.com', 'X', 'Y')).rejects.toThrow('Resend respondió 403');
  });
});
