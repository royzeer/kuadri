// Prueba la verificación de "Entrar con Google" sin llamar a Google (biblioteca simulada).
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

function cargar(clientId = 'cliente-de-prueba.apps.googleusercontent.com') {
  jest.resetModules();
  if (clientId) process.env.GOOGLE_CLIENT_ID = clientId;
  else delete process.env.GOOGLE_CLIENT_ID;
  return require('../../src/services/google.service');
}

const ticket = (datos) => ({ getPayload: () => datos });

describe('verificar credencial de Google', () => {
  afterEach(() => {
    mockVerifyIdToken.mockReset();
    delete process.env.GOOGLE_CLIENT_ID;
  });

  test('devuelve el id, el correo en minúsculas y el nombre', async () => {
    mockVerifyIdToken.mockResolvedValue(ticket({ sub: '123', email: 'Ana@Gmail.com', email_verified: true, name: 'Ana' }));
    const google = cargar();

    const perfil = await google.verificarCredencial('token-valido');

    expect(perfil).toEqual({ googleId: '123', correo: 'ana@gmail.com', nombre: 'Ana' });
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'token-valido',
      audience: 'cliente-de-prueba.apps.googleusercontent.com',
    });
  });

  test('responde 503 si falta GOOGLE_CLIENT_ID', async () => {
    const google = cargar(null);
    await expect(google.verificarCredencial('x')).rejects.toMatchObject({ estado: 503 });
  });

  test('responde 422 si no llega la credencial', async () => {
    const google = cargar();
    await expect(google.verificarCredencial(undefined)).rejects.toMatchObject({ estado: 422 });
  });

  test('responde 401 si Google rechaza el token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Wrong recipient'));
    const google = cargar();
    await expect(google.verificarCredencial('falso')).rejects.toMatchObject({ estado: 401 });
  });

  test('responde 401 si el correo no está verificado', async () => {
    mockVerifyIdToken.mockResolvedValue(ticket({ sub: '9', email: 'x@y.com', email_verified: false }));
    const google = cargar();
    await expect(google.verificarCredencial('token')).rejects.toMatchObject({ estado: 401 });
  });
});
