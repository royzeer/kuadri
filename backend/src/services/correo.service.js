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
  // Gmail no muestra imágenes SVG, por eso el logo es un PNG publicado junto con la interfaz.
  const urlApp = escapar(env.frontendUrl.split(',')[0].trim());
  return `
  <div style="font-family:Poppins,Arial,sans-serif;background:#FFFFFF;padding:24px">
    <div style="background:#B1CB5A;border-radius:24px;padding:24px;max-width:480px;margin:auto">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr>
        <td><img src="${urlApp}/logo-correo.png" width="40" height="40" alt="Kuadri" style="display:block;border:0;border-radius:10px"></td>
        <td style="padding-left:10px;font-size:20px;font-weight:bold;color:#141414">Kuadri</td>
      </tr></table>
      <h1 style="margin:0 0 8px;font-size:24px;color:#141414">Hola, ${escapar(nombre)}</h1>
      <p style="font-size:16px;color:#141414">Tienes una entrega cerca:</p>
      <div style="background:#D6E6A1;border-radius:16px;padding:16px;margin:12px 0">
        <p style="font-size:20px;font-weight:bold;color:#141414;margin:0 0 8px">${escapar(titulo)}</p>
        <p style="font-size:16px;color:#141414;margin:0">Fecha límite: <strong>${fechaTexto}</strong></p>
      </div>
      <a href="${urlApp}" style="display:inline-block;background:#141414;color:#FFFFFF;text-decoration:none;font-size:15px;padding:12px 24px;border-radius:999px;margin-top:8px">Abrir Kuadri</a>
      <p style="font-size:13px;color:#141414;margin-top:24px">Kuadri - tu panel personal</p>
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
