const nodemailer = require('nodemailer');
const env = require('../config/env');

// Kuadri puede enviar correos de tres formas, en este orden de preferencia:
// 1. API de Resend (por HTTPS): funciona en servicios gratuitos que bloquean SMTP, como Render.
// 2. Servidor SMTP propio (con Nodemailer).
// 3. Modo simulado: si no hay nada configurado, el correo solo se muestra en la consola.
const transporte = env.correo.host
  ? nodemailer.createTransport({
      host: env.correo.host,
      port: env.correo.port,
      secure: env.correo.port === 465,
      auth: { user: env.correo.user, pass: env.correo.password },
    })
  : null;

async function enviarConResend(destino, asunto, html) {
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.correo.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.correo.resendRemitente, to: [destino], subject: asunto, html }),
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`Resend respondió ${respuesta.status}: ${detalle}`);
  }
  return { simulado: false, proveedor: 'resend' };
}

async function enviar(destino, asunto, html) {
  if (env.correo.resendApiKey) return enviarConResend(destino, asunto, html);
  if (!transporte) {
    if (env.entorno !== 'test') console.log(`[correo simulado] Para: ${destino} | ${asunto}`);
    return { simulado: true };
  }
  await transporte.sendMail({ from: env.correo.remitente, to: destino, subject: asunto, html });
  return { simulado: false };
}

// Plantilla del correo de recordatorio, con el mismo estilo visual de la app.
function plantillaRecordatorio(nombre, titulo, fechaLimite) {
  const fechaTexto = new Date(fechaLimite).toLocaleString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `
  <div style="font-family:Arial,sans-serif;background:#FFD02B;padding:24px">
    <div style="background:#FBF8F1;border:3px solid #111;border-radius:16px;padding:24px;box-shadow:6px 6px 0 #111;max-width:480px;margin:auto">
      <h1 style="margin:0 0 8px;font-size:24px;color:#111">Hola, ${escapar(nombre)}</h1>
      <p style="font-size:16px;color:#111">Tienes una entrega cerca:</p>
      <p style="font-size:20px;font-weight:bold;color:#111;margin:8px 0">${escapar(titulo)}</p>
      <p style="font-size:16px;color:#111">Fecha límite: <strong>${fechaTexto}</strong></p>
      <p style="font-size:14px;color:#555;margin-top:24px">Kuadri - tu panel personal</p>
    </div>
  </div>`;
}

// Evita que un título con HTML rompa el correo.
function escapar(textoPlano) {
  return String(textoPlano)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { enviar, plantillaRecordatorio, escapar };
