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
      // Conexión reutilizada y tiempos límite (2026-10-12): sin esto cada correo
      // abría una conexión TLS nueva y un servidor lento dejaba el envío colgado.
      pool: true,
      maxConnections: 3,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

const T = require('./email-template');

function requireConfigured() {
  if (!isConfigured()) {
    throw new Error('El envío de correo no está configurado (faltan variables de entorno)');
  }
}

async function sendPinResetCode(email, code) {
  requireConfigured();
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Tu código para recuperar el acceso a Bukea',
    text: `Tu código para crear un nuevo PIN es: ${code}\n\nVence en 15 minutos. Si no lo pediste tú, ignora este correo.`,
    html: T.pinReset(code),
  });
}

// Código para entrar o crear cuenta con el correo (2026-10-11).
async function sendLoginCode(email, code) {
  requireConfigured();
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `Tu código de Bukea: ${code}`,
    text: `Tu código para entrar a Bukea es: ${code}\n\nVence en 15 minutos. Si no lo pediste tú, ignora este correo.`,
    html: T.loginCode(code),
  });
}

// Correo libre del panel de administración (soporte, saludo a negocios
// nuevos, mensajes a varios usuarios). Va dentro de la plantilla de marca.
async function sendCustomMessage(email, subject, text) {
  requireConfigured();
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject,
    text,
    html: T.message(subject, text),
  });
}

// Bienvenida automática al crear una cuenta nueva (2026-10-11). Si no hay
// SMTP, falla en silencio en el llamador. Cliente y negocio llevan contenido
// distinto.
async function sendWelcome(email, name, accountType) {
  requireConfigured();
  const owner = accountType === 'owner';
  const first = String(name || '').trim().split(/\s+/)[0] || 'hola';
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    replyTo: 'contacto@bukeard.com',
    subject: owner ? 'Bienvenido a Bukea para negocios' : 'Bienvenido a Bukea',
    text: owner
      ? `Hola ${first}, bienvenido a Bukea.\n\nYa puedes armar tu negocio, cargar tus servicios y recibir citas sin comisión por cliente nuevo: https://negocio.bukeard.com\n\nSi necesitas ayuda, responde este correo.`
      : `Hola ${first}, bienvenido a Bukea.\n\nYa puedes reservar con barberos, manicuristas y salones cerca de ti: https://www.bukeard.com\n\nTus citas están en https://www.bukeard.com/cuenta. Si necesitas ayuda, responde este correo.`,
    html: owner ? T.welcomeBusiness(name) : T.welcomeClient(name),
  });
}

// Confirmación de cita al cliente (2026-10-12). Se llama sin esperar: si el
// correo falla, la reserva ya quedó guardada.
async function sendBookingConfirmation(email, d) {
  requireConfigured();
  const price = 'RD$ ' + Math.round((d.priceCents || 0) / 100).toLocaleString('en-US');
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    replyTo: 'contacto@bukeard.com',
    subject: `Tu cita en ${d.businessName}: ${d.dayLabel}, ${d.timeLabel}`,
    text: `Tu cita está confirmada.\n\n${d.serviceName} con ${d.collaboratorName || d.professionalName}\n${d.dayLabel}, ${d.timeLabel}\n${d.businessName}, ${d.neighborhood}\nPrecio: ${price}\n\nCómo llegar: ${d.directionsUrl}\nVer o cancelar: https://www.bukeard.com/cuenta`,
    html: T.bookingConfirmed(d),
  });
}

// Ticket de soporte desde el panel de negocio (2026-08-25).
async function sendTicket({ businessName, slug, fromName, fromEmail, message }) {
  requireConfigured();
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: 'contacto@bukeard.com',
    replyTo: fromEmail || undefined,
    subject: `Ticket de soporte: ${businessName}`,
    text: `Negocio: ${businessName} (${slug})\nContacto: ${fromName || 'Sin nombre'} ${fromEmail ? '<' + fromEmail + '>' : ''}\n\n${message}`,
    html: T.inbound({
      eyebrow: 'Ticket de soporte',
      heading: businessName,
      rows: [['Negocio', `${businessName} (${slug})`], ['Contacto', [fromName || 'Sin nombre', fromEmail].filter(Boolean).join(' · ')]],
      message,
    }),
  });
}

// Formulario de contacto público (bukeard.com/contacto, 2026-08-27).
async function sendContactMessage({ name, email, message, subject }) {
  requireConfigured();
  const subjectLabel = subject || 'Contacto';
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: 'contacto@bukeard.com',
    replyTo: email,
    subject: `${subjectLabel}: ${name}`,
    text: `Asunto: ${subjectLabel}\nDe: ${name} <${email}>\n\n${message}`,
    html: T.inbound({
      eyebrow: 'Formulario de contacto',
      heading: subjectLabel,
      rows: [['De', `${name} · ${email}`]],
      message,
    }),
  });
}

// Verificación de correo obligatoria al registrarse (2026-08-27). El enlace
// apunta al propio backend (GET /api/auth/verify-email).
async function sendEmailVerification(email, name, verifyUrl) {
  requireConfigured();
  const firstName = String(name || '').trim().split(/\s+/)[0] || '';
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Verifica tu correo en Bukea',
    text: `Hola${firstName ? ', ' + firstName : ''}:\n\nPara proteger tu cuenta necesitamos confirmar que ${email} es tuyo. Haz clic en este enlace para verificarlo:\n\n${verifyUrl}\n\nVence en 24 horas. Si no creaste una cuenta en Bukea, ignora este correo.`,
    html: T.verifyEmail(name, email, verifyUrl),
  });
}

// Aviso interno: se acaba de registrar un negocio nuevo (2026-10-11). Va al
// súper administrador fijo.
async function sendNewBusinessAlert(to, d) {
  requireConfigured();
  const rows = [
    ['Negocio', d.businessName],
    ['Profesional', d.name],
    ['Categoría', d.category],
    ['Sector', d.neighborhood],
    ['Servicios', d.servicesCount],
    ['Cuenta', [d.ownerName, d.ownerPhone, d.ownerEmail].filter(Boolean).join(' · ')],
    ['Conoció Bukea por', d.referral || 'sin responder'],
    ['Cupo fundador', d.foundingFree ? 'sí' : 'no'],
  ];
  const text = ['Nuevo negocio en Bukea', ...rows.map(([k, v]) => `${k}: ${v}`), `Perfil: ${d.profileUrl}`, `Panel: ${d.adminUrl}`].join('\n');
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Nuevo negocio en Bukea: ${d.businessName}`,
    text,
    html: T.newBusinessAlert(d),
  });
}

module.exports = { isConfigured, sendPinResetCode, sendLoginCode, sendCustomMessage, sendWelcome, sendBookingConfirmation, sendTicket, sendContactMessage, sendEmailVerification, sendNewBusinessAlert };
