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

module.exports = { isConfigured, sendPinResetCode };
