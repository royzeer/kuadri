// Todas las rutas de la API. Las que van después de requiereAuth son privadas.
const { Router } = require('express');
const c = require('../controllers');
const { requiereAuth } = require('../middlewares/auth');

const router = Router();

// Públicas
router.get('/salud', (_req, res) => res.json({ ok: true, data: { estado: 'activo' }, mensaje: 'Kuadri API' }));
router.post('/auth/registro', c.auth.registro);
router.post('/auth/login', c.auth.login);
// Protegida con CRON_SECRET (la usa GitHub Actions), no con el token de usuario
router.post('/campus/sincronizar-todos', c.campus.sincronizarTodos);

// Privadas
router.use(requiereAuth);

router.get('/auth/perfil', c.auth.perfil);
router.put('/auth/perfil', c.auth.actualizarPerfil);

router.get('/categorias', c.categorias.listar);
router.post('/categorias', c.categorias.crear);
router.put('/categorias/:id', c.categorias.actualizar);
router.delete('/categorias/:id', c.categorias.eliminar);

router.get('/campus', c.campus.listar);
router.post('/campus', c.campus.crear);
router.post('/campus/sincronizar', c.campus.sincronizar);
router.put('/campus/:id', c.campus.actualizar);
router.delete('/campus/:id', c.campus.eliminar);

router.get('/tareas', c.tareas.listar);
router.post('/tareas', c.tareas.crear);
router.get('/tareas/:id', c.tareas.obtener);
router.put('/tareas/:id', c.tareas.actualizar);
router.patch('/tareas/:id/completar', c.tareas.completar);
router.delete('/tareas/:id', c.tareas.eliminar);

router.get('/metas', c.metas.listar);
router.post('/metas', c.metas.crear);
router.get('/metas/:id', c.metas.obtener);
router.put('/metas/:id', c.metas.actualizar);
router.patch('/metas/:id/cumplir', c.metas.cumplir);
router.delete('/metas/:id', c.metas.eliminar);
router.post('/metas/:id/pasos', c.metas.agregarPaso);
router.patch('/metas/:id/pasos/:subId', c.metas.cambiarPaso);
router.delete('/metas/:id/pasos/:subId', c.metas.eliminarPaso);

router.get('/deseos', c.deseos.listar);
router.post('/deseos', c.deseos.crear);
router.get('/deseos/:id', c.deseos.obtener);
router.put('/deseos/:id', c.deseos.actualizar);
router.patch('/deseos/:id/comprar', c.deseos.comprar);
router.delete('/deseos/:id', c.deseos.eliminar);
router.post('/deseos/:id/precios', c.deseos.registrarPrecio);
router.delete('/deseos/:id/precios/:subId', c.deseos.eliminarPrecio);

router.get('/estudio/paletas', c.estudio.paletas);
router.post('/estudio/paletas', c.estudio.crearPaleta);
router.put('/estudio/paletas/:id', c.estudio.actualizarPaleta);
router.delete('/estudio/paletas/:id', c.estudio.eliminarPaleta);
router.get('/estudio/tipografias', c.estudio.tipografias);
router.post('/estudio/tipografias', c.estudio.crearTipografia);
router.put('/estudio/tipografias/:id', c.estudio.actualizarTipografia);
router.delete('/estudio/tipografias/:id', c.estudio.eliminarTipografia);
router.get('/estudio/plantillas', c.estudio.plantillas);
router.post('/estudio/plantillas', c.estudio.crearPlantilla);
router.put('/estudio/plantillas/:id', c.estudio.actualizarPlantilla);
router.delete('/estudio/plantillas/:id', c.estudio.eliminarPlantilla);

router.get('/ocio', c.ocio.listar);
router.post('/ocio', c.ocio.crear);
router.get('/ocio/:id', c.ocio.obtener);
router.put('/ocio/:id', c.ocio.actualizar);
router.delete('/ocio/:id', c.ocio.eliminar);
router.post('/ocio/:id/ratos', c.ocio.registrarRato);
router.delete('/ocio/:id/ratos/:subId', c.ocio.eliminarRato);

router.post('/enfoque', c.enfoque.registrar);
router.get('/estadisticas/resumen', c.resumen.semanal);
router.get('/logros', c.logros.listar);

router.get('/notificaciones', c.notificaciones.listar);
router.patch('/notificaciones/leer-todas', c.notificaciones.leerTodas);

module.exports = router;
