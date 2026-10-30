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

1. Crear una cuenta en Resend y generar una API key.
2. Ponerla en `RESEND_API_KEY` en Render.
3. Sin dominio propio, Resend solo envía al correo de la cuenta de Resend. Para una app personal es suficiente; para enviar a otros usuarios hay que verificar un dominio.

## 5. Actualizaciones

Render y Vercel quedan conectados al repositorio: cada commit nuevo en `main` vuelve a publicar la app automáticamente.
