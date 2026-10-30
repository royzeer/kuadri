// Todas las rutas de la API. Las que van después de requiereAuth son privadas.
const { Router } = require('express');
const c = require('../controllers');
const { requiereAuth } = require('../middlewares/auth');

const router = Router();

// Públicas
router.get('/salud', (_req, res) => res.json({ ok: true, data: { estado: 'activo' }, mensaje: 'Kuadri API' }));
router.post('/auth/registro', c.auth.registro);
router.post('/auth/login', c.auth.login);

// Privadas
router.use(requiereAuth);

router.get('/auth/perfil', c.auth.perfil);
router.put('/auth/perfil', c.auth.actualizarPerfil);

router.get('/categorias', c.categorias.listar);
router.post('/categorias', c.categorias.crear);
router.put('/categorias/:id', c.categorias.actualizar);
router.delete('/categorias/:id', c.categorias.eliminar);

router.get('/tareas', c.tareas.listar);
router.post('/tareas', c.tareas.crear);
router.get('/tareas/:id', c.tareas.obtener);
router.put('/tareas/:id', c.tareas.actualizar);
router.patch('/tareas/:id/completar', c.tareas.completar);
router.delete('/tareas/:id', c.tareas.eliminar);

router.post('/enfoque', c.enfoque.registrar);
router.get('/estadisticas/resumen', c.resumen.semanal);
router.get('/logros', c.logros.listar);

router.get('/notificaciones', c.notificaciones.listar);
router.patch('/notificaciones/leer-todas', c.notificaciones.leerTodas);

module.exports = router;
