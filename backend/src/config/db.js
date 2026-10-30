// Pool de conexiones a MySQL. Todas las consultas pasan por aquí.
const mysql = require('mysql2/promise');
const env = require('./env');

// Configuración SSL para bases de datos en la nube.
// Si se entrega el certificado de la autoridad (CA), se valida el servidor.
function opcionesSsl() {
  if (!env.db.ssl) return undefined;
  if (env.db.certificadoCa) return { ca: env.db.certificadoCa, rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

const { ssl: _usaSsl, certificadoCa: _ca, ...conexion } = env.db;

const pool = mysql.createPool({
  ...conexion,
  ssl: opcionesSsl(),
  waitForConnections: true,
  connectionLimit: 10,
  // Las columnas DATE llegan como texto 'YYYY-MM-DD' para no perder el día por la zona horaria.
  dateStrings: ['DATE'],
  // Las columnas BOOLEAN de MySQL son TINYINT(1): se convierten a true/false para el JSON.
  typeCast(campo, siguiente) {
    if (campo.type === 'TINY' && campo.length === 1) {
      const valor = campo.string();
      return valor === null ? null : valor === '1';
    }
    return siguiente();
  },
});

// La base de datos usa la misma zona horaria que el servidor de Node,
// así NOW() y CURRENT_TIMESTAMP coinciden con las fechas que envía la API.
function desfaseHorario() {
  const minutos = -new Date().getTimezoneOffset();
  const signo = minutos >= 0 ? '+' : '-';
  const abs = Math.abs(minutos);
  return `${signo}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

pool.on('connection', (c) => {
  c.query(`SET time_zone = '${desfaseHorario()}'`);
});

// Ejecuta una consulta parametrizada y devuelve solo las filas.
async function query(sql, params = []) {
  const [filas] = await pool.execute(sql, params);
  return filas;
}

module.exports = { pool, query, opcionesSsl };
