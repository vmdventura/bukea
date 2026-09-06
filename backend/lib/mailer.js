// Envío de correo transaccional vía SMTP (nodemailer).
// Se activa solo cuando existen las variables de entorno:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM
// Sin ellas, isConfigured() devuelve false y "olvidé mi PIN" responde 503
// (no rompe el resto del login por teléfono).

const nodemailer = require('nodemailer');

function isConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT &&
    process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.MAIL_FROM
  );
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

async function sendPinResetCode(email, code) {
  if (!isConfigured()) {
    throw new Error('El envío de correo no está configurado (faltan variables de entorno)');
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Tu código para recuperar el acceso a Bukea',
    text: `Tu código para crear un nuevo PIN es: ${code}\n\nVence en 15 minutos. Si no lo pediste tú, ignora este correo.`,
    html: brandEmailHtml({
      preheader: `Tu código para crear un nuevo PIN en Bukea: ${code}`,
      heading: 'Recupera el acceso a tu cuenta',
      bodyHtml: `Usa este código para crear un PIN nuevo:
        <p style="margin:18px 0 0;font-size:1.9rem;font-weight:700;letter-spacing:0.28em;color:#0f8583">${code}</p>`,
      footNote: 'Este código vence en 15 minutos. Si no lo pediste tú, ignora este correo.',
      whyHtml: 'Tu correo está asociado a una cuenta de Bukea que pidió recuperar el acceso por PIN olvidado. Si no fuiste tú, tu cuenta sigue segura — no hace falta que hagas nada más.',
    }),
  });
}

// Correo libre (panel de administración, Comunicación, Fase 2) — para
// soporte manual desde la ficha de un usuario, o un mensaje de prueba.
async function sendCustomMessage(email, subject, text) {
  if (!isConfigured()) {
    throw new Error('El envío de correo no está configurado (faltan variables de entorno)');
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject,
    text,
    html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
  });
}

// Ticket de soporte desde el panel de negocio (2026-08-25) — "Abrir ticket"
// en la pestaña Negocio. Sin tabla ni estado propio por ahora: es un correo
// directo a Bukea con el contexto del negocio que escribe.
async function sendTicket({ businessName, slug, fromName, fromEmail, message }) {
  if (!isConfigured()) {
    throw new Error('El envío de correo no está configurado (faltan variables de entorno)');
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: 'hola@bukeard.com',
    replyTo: fromEmail || undefined,
    subject: `Ticket de soporte — ${businessName}`,
    text: `Negocio: ${businessName} (${slug})\nContacto: ${fromName || 'Sin nombre'} ${fromEmail ? '<' + fromEmail + '>' : ''}\n\n${message}`,
    html: `<p><strong>Negocio:</strong> ${businessName} (${slug})</p><p><strong>Contacto:</strong> ${fromName || 'Sin nombre'} ${fromEmail ? '&lt;' + fromEmail + '&gt;' : ''}</p><p>${String(message).replace(/\n/g, '<br>')}</p>`,
  });
}

// Formulario de contacto público (bukeard.com/contacto, 2026-08-27) — igual
// patrón que sendTicket: un correo directo a Bukea con replyTo apuntando a
// quien escribió, así se puede responder tal cual desde el cliente de correo.
async function sendContactMessage({ name, email, message, subject }) {
  if (!isConfigured()) {
    throw new Error('El envío de correo no está configurado (faltan variables de entorno)');
  }
  const subjectLabel = subject || 'Contacto';
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: 'hola@bukeard.com',
    replyTo: email,
    subject: `${subjectLabel} — ${name}`,
    text: `Asunto: ${subjectLabel}\nDe: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>Asunto:</strong> ${subjectLabel}</p><p><strong>De:</strong> ${name} &lt;${email}&gt;</p><p>${String(message).replace(/\n/g, '<br>')}</p>`,
  });
}

// Envoltorio de tarjeta con la identidad de Bukea, para los correos
// transaccionales que sí necesitan verse como un producto de verdad (no
// solo texto plano) — mismos tokens que routes/auth.js (VERIFY_PAGE_STYLE)
// para que el correo y la página de "correo verificado" que abre el enlace
// se vean como la misma marca. Tablas + estilos inline a propósito: es lo
// único que Gmail/Outlook/Apple Mail renderizan de forma confiable.
function brandEmailHtml({ preheader, heading, bodyHtml, ctaLabel, ctaUrl, footNote, whyHtml }) {
  const cta = ctaLabel && ctaUrl ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0">
          <tr><td style="border-radius:999px;background:#0f8583">
            <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;font:700 15px -apple-system,'Segoe UI',sans-serif;color:#ffffff;text-decoration:none;border-radius:999px">${ctaLabel}</a>
          </td></tr>
        </table>` : '';
  // Bloque "¿Por qué he recibido este correo?" (2026-09-06, a pedido de
  // Víctor, viendo el mismo bloque en el correo de verificación de Fresha):
  // debajo del botón, dentro de la misma tarjeta, separado por una línea —
  // deja claro que el correo llegó por crear/usar una cuenta en Bukea, no
  // por otra cosa, y da una salida si no fue el destinatario quien la creó.
  const why = whyHtml ? `
          <div style="margin-top:30px;padding-top:22px;border-top:1px solid #e3ecea;text-align:center">
            <p style="margin:0 0 8px;font-size:0.86rem;font-weight:700;color:#16302e">¿Por qué he recibido este correo?</p>
            <p style="margin:0;font-size:0.82rem;line-height:1.6;color:#44647a">${whyHtml}</p>
          </div>` : '';
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:#f2f7f6;font-family:-apple-system,'Segoe UI',sans-serif;color:#16302e">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader || ''}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:420px" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding-bottom:22px">
          <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#0f8583;line-height:1">b</span><br>
          <span style="font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:19px;color:#0f8583;letter-spacing:0.01em">Bukea</span>
        </td></tr>
        <tr><td align="center" style="background:#ffffff;border-radius:20px;padding:38px 30px;box-shadow:0 14px 34px rgba(15,40,38,0.10)">
          <h1 style="margin:0 0 14px;font-size:1.25rem;font-weight:700;color:#16302e">${heading}</h1>
          <div style="font-size:0.92rem;line-height:1.6;color:#44647a">${bodyHtml}</div>
          ${cta}
          ${why}
        </td></tr>
        <tr><td align="center" style="padding:22px 8px 0;font-size:0.76rem;line-height:1.5;color:#8098a8">
          ${footNote || ''}<br>Bukea · bukeard.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Verificación de correo obligatoria al registrarse (2026-08-27). El
// enlace apunta al propio backend (GET /api/auth/verify-email), no a un
// servicio externo — no dependemos de Firebase ni de nada por el estilo.
async function sendEmailVerification(email, name, verifyUrl) {
  if (!isConfigured()) {
    throw new Error('El envío de correo no está configurado (faltan variables de entorno)');
  }
  const firstName = String(name || '').trim().split(/\s+/)[0] || '';
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Verifica tu correo en Bukea',
    text: `Hola${firstName ? ', ' + firstName : ''}:\n\nPara proteger tu cuenta necesitamos confirmar que ${email} es tuyo. Haz clic en este enlace para verificarlo:\n\n${verifyUrl}\n\nVence en 24 horas. Si no creaste una cuenta en Bukea, ignora este correo.`,
    html: brandEmailHtml({
      preheader: `Confirma tu correo para terminar de crear tu cuenta en Bukea.`,
      heading: `Hola${firstName ? ', ' + firstName : ''}: verifica tu correo`,
      bodyHtml: `Para proteger tu cuenta necesitamos confirmar que <strong style="color:#16302e">${email}</strong> es tuyo. Solo tienes que hacerlo esta vez.`,
      ctaLabel: 'Verificar mi correo',
      ctaUrl: verifyUrl,
      footNote: `Este enlace vence en 24 horas. Si no creaste una cuenta en Bukea, ignora este correo.`,
      whyHtml: `Tu dirección de correo se usó para crear una cuenta en Bukea. Si recibiste este correo por error, <a href="https://www.bukeard.com/contacto" style="color:#0f8583;font-weight:600">infórmanos aquí</a>.`,
    }),
  });
}

module.exports = { isConfigured, sendPinResetCode, sendCustomMessage, sendTicket, sendContactMessage, sendEmailVerification };
