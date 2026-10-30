// Punto de entrada: inicia el servidor HTTP y el planificador de recordatorios.
const env = require('./config/env');
const app = require('./app');
const { pool } = require('./config/db');
const recordatorios = require('./jobs/recordatorios.job');

async function iniciar() {
  // Verifica la conexión a la base de datos antes de abrir el puerto
  await pool.query('SELECT 1');
  app.listen(env.puerto, () => {
    console.log(`Kuadri API escuchando en http://localhost:${env.puerto}/api`);
  });
  recordatorios.iniciar();
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
