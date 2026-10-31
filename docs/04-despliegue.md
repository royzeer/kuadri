# Kuadri - Guía de despliegue

Kuadri se publica en tres servicios con plan gratuito:

| Parte | Servicio | Carpeta del repositorio |
|---|---|---|
| Base de datos MySQL | Aiven | `database/schema.sql` |
| API REST | Render | `backend` |
| Interfaz | Vercel | `frontend` |

## 1. Base de datos en Aiven

1. Crear una cuenta en Aiven y un servicio **MySQL** en el plan gratuito.
2. Cuando el servicio esté encendido, copiar de la página del servicio: host, puerto, usuario, contraseña y el certificado CA.
3. Crear las tablas desde el computador, con un `.env` temporal en `backend` que apunte a Aiven:

```
DB_HOST=<host de Aiven>
DB_PORT=<puerto de Aiven>
DB_USER=<usuario de Aiven>
DB_PASSWORD=<contraseña de Aiven>
DB_NAME=kuadri
DB_SSL=true
```

```bash
cd backend
npm run db:init
```

## 2. API en Render

1. Crear un **Web Service** conectado al repositorio de GitHub.
2. Configuración:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Variables de entorno:

| Variable | Valor |
|---|---|
| NODE_ENV | production |
| TZ | America/Bogota |
| DB_HOST, DB_PORT, DB_USER, DB_PASSWORD | Datos de Aiven |
| DB_NAME | kuadri |
| DB_SSL | true |
| DB_CA_CERT | Contenido del certificado CA de Aiven |
| JWT_SECRET | Una frase larga y aleatoria |
| FRONTEND_URL | La dirección que entregue Vercel (se completa en el paso 3) |
| RESEND_API_KEY | Clave de Resend (opcional, para correos) |

4. Comprobar que `https://<tu-api>.onrender.com/api/salud` responde.

**Notas del plan gratuito:**
- El servicio se apaga tras 15 minutos sin uso y tarda cerca de un minuto en despertar.
- Mientras está apagado, el planificador no corre. Por eso la API también revisa los recordatorios al arrancar y cada vez que se abren las notificaciones.
- El envío por SMTP está bloqueado; los correos se envían por la API de Resend.

## 3. Interfaz en Vercel

1. Importar el repositorio de GitHub.
2. Root Directory: `frontend` (Vercel detecta Vite automáticamente).
3. Variable de entorno: `VITE_API_URL=https://<tu-api>.onrender.com/api`
4. Desplegar. El archivo `vercel.json` hace que las rutas internas (como `/tareas`) funcionen al recargar la página.
5. Volver a Render y poner la dirección de Vercel en `FRONTEND_URL`.

## 4. Correos con Resend (opcional)

1. Crear una cuenta gratis en Resend (resend.com) con el mismo correo con el que se usa Kuadri.
2. En Resend, ir a API Keys y crear una clave con permiso "Sending access".
3. En Render, abrir el servicio, ir a Environment y agregar `RESEND_API_KEY` con esa clave. Render vuelve a desplegar solo.
4. Crear en Kuadri una tarea que venza en menos de 24 horas. El correo llega en máximo 15 minutos (o al abrir las notificaciones si el servidor estaba dormido).

Límites del plan gratis (revisados en octubre de 2026): 100 correos al día y 3.000 al mes. Sin dominio propio el remitente es `onboarding@resend.dev` y Resend solo entrega al correo de la cuenta de Resend; a cualquier otro destino responde con error 403. Si eso pasa, Kuadri igual deja el aviso dentro de la app y no lo repite. Para enviar a otras personas hay que verificar un dominio propio y cambiar `RESEND_FROM`.

## 5. Campus virtuales

1. En Render, abrir el servicio, ir a Environment y agregar dos variables con frases largas y aleatorias distintas:
   - `CAMPUS_SECRET`: cifra los enlaces de calendario. Si se cambia después, cada usuario debe volver a pegar su enlace.
   - `CRON_SECRET`: clave para que GitHub Actions pueda pedir la sincronización.
2. En GitHub, abrir el repositorio, ir a Settings, luego Secrets and variables, luego Actions, y crear `CRON_SECRET` con el mismo valor.
3. El flujo `.github/workflows/sincronizar-campus.yml` corre cada 3 horas, despierta a Render y trae las actividades nuevas de todos los usuarios. Se puede correr a mano desde la pestaña Actions con "Run workflow". GitHub pausa los flujos programados si el repositorio pasa 60 días sin cambios.

## 6. Actualizaciones

### Cambios en la base de datos (migraciones)

Cuando una versión nueva trae tablas nuevas (por ejemplo, la Fase 2: metas y deseos), **no** se usa `npm run db:init`, porque ese comando borra la base y todos los datos. Se usa `npm run db:migrar`, que solo agrega lo que falta y se puede correr más de una vez sin problema.

1. Revisar en [console.aiven.io](https://console.aiven.io) que el servicio `kuadri-db` diga **Running**. En el plan gratis se apaga si no se usa; si está apagado, encenderlo y esperar a que pase de **Rebuilding** a **Running**.
2. Poner en `backend/.env` los datos de Aiven (los mismos de la sección 1, con `DB_SSL=true`).
3. Ejecutar:

```bash
cd backend
npm run db:migrar
```

4. Debe aparecer una línea `Migración aplicada: ...` por cada archivo (por ejemplo `001-fase-2-metas-deseos.sql`, `002-fase-3-estudio-ocio.sql` y `003-campus-virtual.sql`) y al final `Base de datos "kuadri" al día.` Las migraciones anteriores se vuelven a pasar sin cambiar nada.
5. Volver a dejar el `.env` apuntando a la base local.

Las migraciones están en `database/migraciones/`. El archivo `database/schema.sql` ya trae todo para instalaciones nuevas.


Render y Vercel quedan conectados al repositorio: cada commit nuevo en `main` vuelve a publicar la app automáticamente.
