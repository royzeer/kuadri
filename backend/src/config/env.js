// Carga y valida las variables de entorno en un solo lugar.
require('dotenv').config({ quiet: true });

const env = {
  puerto: Number(process.env.PORT) || 4000,
  entorno: process.env.NODE_ENV || 'development',
  zonaHoraria: process.env.TZ || 'America/Bogota',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kuadri',
    // Bases de datos en la nube (como Aiven) exigen conexión cifrada (SSL)
    ssl: process.env.DB_SSL === 'true',
    certificadoCa: (process.env.DB_CA_CERT || '').replace(/\\n/g, '\n'),
  },
  jwt: {
    secreto: process.env.JWT_SECRET,
    expira: process.env.JWT_EXPIRES_IN || '7d',
  },
  correo: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    remitente: process.env.SMTP_FROM || 'Kuadri <no-reply@kuadri.app>',
    // Envío por API HTTP (Resend). Se usa en servicios donde el SMTP está bloqueado.
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendRemitente: process.env.RESEND_FROM || 'Kuadri <onboarding@resend.dev>',
  },
  recordatorios: {
    // Expresión cron: por defecto cada 15 minutos
    cron: process.env.REMINDER_CRON || '*/15 * * * *',
    horasAntes: Number(process.env.REMINDER_HOURS_BEFORE) || 24,
    // Mínimo de minutos entre revisiones cuando se disparan por uso de la app
    minutosEntreRevisiones: Number(process.env.REMINDER_MIN_INTERVAL) || 5,
  },
  campus: {
    // Clave para cifrar los enlaces de calendario. Si falta, se deriva de JWT_SECRET.
    secreto: process.env.CAMPUS_SECRET || '',
    // Clave que debe enviar GitHub Actions para sincronizar a todos los usuarios.
    claveCron: process.env.CRON_SECRET || '',
    // Mientras el servidor está despierto, también sincroniza solo (por defecto cada hora).
    cron: process.env.CAMPUS_CRON || '0 * * * *',
    // Mínimo de minutos entre sincronizaciones automáticas de un mismo campus.
    minutosEntreSincronizaciones: Number(process.env.CAMPUS_MIN_INTERVAL) || 10,
  },
};

// La zona horaria del proceso define cómo se interpretan las fechas.
process.env.TZ = env.zonaHoraria;

if (!env.jwt.secreto) {
  if (env.entorno === 'production') {
    throw new Error('Falta la variable JWT_SECRET');
  }
  env.jwt.secreto = 'secreto-solo-para-desarrollo';
}

if (!env.campus.secreto) env.campus.secreto = env.jwt.secreto;

module.exports = env;
