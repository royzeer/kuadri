// Aplica las migraciones de database/migraciones sobre una base que ya tiene datos.
// A diferencia de db:init, NO borra nada: solo agrega lo que falta.
// Uso: npm run db:migrar   (toma la conexión del .env, por ejemplo la de Aiven)
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');
const { opcionesSsl, pool } = require('../src/config/db');

async function main() {
  const carpeta = path.join(__dirname, '..', '..', 'database', 'migraciones');
  const archivos = fs.readdirSync(carpeta).filter((a) => a.endsWith('.sql')).sort();

  const { ssl: _ssl, certificadoCa: _ca, ...conexionDatos } = env.db;
  const conexion = await mysql.createConnection({ ...conexionDatos, ssl: opcionesSsl(), multipleStatements: true });
  for (const archivo of archivos) {
    await conexion.query(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
    console.log(`Migración aplicada: ${archivo}`);
  }
  await conexion.end();
  await pool.end();
  console.log(`Base de datos "${env.db.database}" al día.`);
}

main().catch((error) => {
  console.error('Error al aplicar las migraciones:', error.message);
  process.exit(1);
});
