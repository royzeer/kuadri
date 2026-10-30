// Crea (o reinicia) la base de datos a partir de database/schema.sql.
// Uso: npm run db:init   (toma el nombre de la base de DB_NAME en el .env)
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');
const { opcionesSsl } = require('../src/config/db');

async function main() {
  const ruta = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  // El esquema usa el nombre "kuadri"; se reemplaza por el nombre configurado.
  const sql = fs
    .readFileSync(ruta, 'utf8')
    .replace(/DROP DATABASE IF EXISTS kuadri;/, `DROP DATABASE IF EXISTS \`${env.db.database}\`;`)
    .replace(/CREATE DATABASE kuadri /, `CREATE DATABASE \`${env.db.database}\` `)
    .replace(/USE kuadri;/, `USE \`${env.db.database}\`;`);

  const { database, ssl: _ssl, certificadoCa: _ca, ...sinBase } = env.db;
  const conexion = await mysql.createConnection({ ...sinBase, ssl: opcionesSsl(), multipleStatements: true });
  await conexion.query(sql);
  await conexion.end();
  // Cierra el pool que se abre al importar la configuración
  await require('../src/config/db').pool.end();
  console.log(`Base de datos "${database}" lista.`);
}

main().catch((error) => {
  console.error('Error al crear la base de datos:', error.message);
  process.exit(1);
});
