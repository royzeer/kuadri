// Configuración de la aplicación Express (sin iniciar el servidor, para poder probarla).
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const rutas = require('./routes');
const { rutaNoEncontrada, manejarErrores } = require('./middlewares/errores');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl.split(',').map((u) => u.trim()) }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', rutas);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

module.exports = app;
