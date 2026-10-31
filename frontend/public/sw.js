// Service worker de Kuadri: permite instalar la app y abrirla aunque falle la red.
// Solo guarda la página principal; los datos siempre se piden a la API en línea.
const CACHE = 'kuadri-v1';

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.add('/')));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// Al abrir una página se intenta la red primero; sin conexión se usa la copia guardada
self.addEventListener('fetch', (evento) => {
  if (evento.request.mode !== 'navigate') return;
  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put('/', copia));
        return respuesta;
      })
      .catch(() => caches.match('/')),
  );
});
