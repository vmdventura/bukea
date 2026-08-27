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
    html: `<p>Tu código para crear un nuevo PIN es:</p><p style="font-size:28px;font-weight:700;letter-spacing:0.1em">${code}</p><p>Vence en 15 minutos. Si no lo pediste tú, ignora este correo.</p>`,
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

// Verificación de correo obligatoria al registrarse (2026-08-27). El
// enlace apunta al propio backend (GET /api/auth/verify-email), no a un
// servicio externo — no dependemos de Firebase ni de nada por el estilo.
async function sendEmailVerification(email, name, verifyUrl) {
  if (!isConfigured()) {
    throw new Error('El envío de correo no está configurado (faltan variables de entorno)');
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Verifica tu correo en Bukea',
    text: `Hola, ${name}:\n\nHaz clic en este enlace para verificar tu correo y terminar de crear tu cuenta en Bukea.\n\n${verifyUrl}\n\nVence en 24 horas. Si no lo pediste tú, ignora este correo.`,
    html: `<p>Hola, ${name}:</p><p>Haz clic en este enlace para verificar tu correo y terminar de crear tu cuenta en Bukea.</p><p><a href="${verifyUrl}" style="display:inline-block;background:#0f8583;color:#fff;padding:0.7rem 1.3rem;border-radius:999px;text-decoration:none;font-weight:700">Verificar mi correo</a></p><p style="color:#667">Vence en 24 horas. Si no lo pediste tú, ignora este correo.</p>`,
  });
}

module.exports = { isConfigured, sendPinResetCode, sendCustomMessage, sendTicket, sendContactMessage, sendEmailVerification };
