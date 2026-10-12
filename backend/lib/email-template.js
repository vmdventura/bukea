/* Plantilla de correos de Bukea (2026-10-12).
   Una sola estructura para todos los correos: cabecera verde profundo con el
   logo, tarjeta blanca con el contenido, pie con enlaces. Tablas y estilos
   inline a propósito: es lo único que Gmail, Outlook y Apple Mail renderizan
   de forma confiable. La tipografía de títulos es Georgia (parecida a
   Fraunces, que no existe en correo). El logo es un PNG alojado en el propio
   sitio (los clientes de correo no muestran SVG). */

const SITE = 'https://www.bukeard.com';
const LOGO_URL = `${SITE}/app/icon-192.png`;

const C = {
  deep: '#143432',
  teal: '#0f7a78',
  tealDark: '#0c5f5d',
  tealSoft: '#e6f3f2',
  tealLine: '#c4e2e0',
  gold: '#c9a45c',
  cream: '#f4ecd9',
  ink: '#16302e',
  text: '#3f5b58',
  faint: '#7d9794',
  page: '#edf4f3',
  line: '#e1ebea',
};

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- Componentes ---------- */

function button(label, url) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:30px auto 0">
      <tr><td align="center" style="border-radius:999px;background:${C.teal}">
        <a href="${esc(url)}" style="display:inline-block;padding:15px 34px;font:700 15px ${SANS};color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>
      </td></tr>
    </table>`;
}

// Código de 6 dígitos en un recuadro grande, separado en dos grupos.
function codeTile(code) {
  const c = String(code);
  const shown = c.length === 6 ? `${c.slice(0, 3)}&nbsp;&nbsp;${c.slice(3)}` : esc(c);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 4px">
      <tr><td align="center" style="background:${C.tealSoft};border:1px solid ${C.tealLine};border-radius:16px;padding:20px 34px">
        <span style="font:700 38px ${SANS};letter-spacing:6px;color:${C.tealDark};line-height:1">${shown}</span>
      </td></tr>
    </table>`;
}

// Lista numerada: items = [{ title, text }]
function steps(items) {
  const rows = items.map((it, i) => `
      <tr>
        <td valign="top" style="padding:0 14px 18px 0;width:34px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" width="30" height="30" style="width:30px;height:30px;border-radius:15px;background:${C.tealSoft};border:1px solid ${C.tealLine};font:700 14px ${SANS};color:${C.tealDark}">${i + 1}</td></tr></table>
        </td>
        <td valign="top" style="padding:3px 0 18px;text-align:left">
          <div style="font:700 15px ${SANS};color:${C.ink};line-height:1.35">${esc(it.title)}</div>
          <div style="font:400 14px ${SANS};color:${C.text};line-height:1.55;margin-top:3px">${esc(it.text)}</div>
        </td>
      </tr>`).join('');
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:26px 0 0">${rows}
    </table>`;
}

// Filas etiqueta / valor para los avisos internos.
function facts(rows) {
  const trs = rows.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `
      <tr>
        <td valign="top" style="padding:9px 14px 9px 0;border-top:1px solid ${C.line};font:400 13px ${SANS};color:${C.faint};text-align:left;white-space:nowrap">${esc(k)}</td>
        <td valign="top" style="padding:9px 0;border-top:1px solid ${C.line};font:600 14px ${SANS};color:${C.ink};text-align:left">${esc(v)}</td>
      </tr>`).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0 0">${trs}</table>`;
}

// Párrafos a partir de texto plano (saltos de línea dobles = párrafo).
function paragraphs(text) {
  return String(text || '').split(/\n{2,}/).map(p =>
    `<p style="margin:0 0 14px;font:400 15px ${SANS};color:${C.text};line-height:1.7;text-align:left">${esc(p).replace(/\n/g, '<br>')}</p>`
  ).join('');
}

function p(html, align) {
  return `<p style="margin:0 0 14px;font:400 15px ${SANS};color:${C.text};line-height:1.7;text-align:${align || 'center'}">${html}</p>`;
}

/* ---------- Estructura ---------- */

function layout({ preheader, eyebrow, heading, bodyHtml, footNote, whyHtml, align }) {
  const why = whyHtml ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px">
          <tr><td align="center" style="border-top:1px solid ${C.line};padding-top:22px">
            <div style="font:700 13px ${SANS};color:${C.ink};margin-bottom:6px">¿Por qué recibí este correo?</div>
            <div style="font:400 13px ${SANS};color:${C.faint};line-height:1.6">${whyHtml}</div>
          </td></tr>
        </table>` : '';
  const eb = eyebrow ? `<div style="font:700 11px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.teal};margin-bottom:12px">${esc(eyebrow)}</div>` : '';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Bukea</title>
</head>
<body style="margin:0;padding:0;background:${C.page}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${esc(preheader || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}">
  <tr><td align="center" style="padding:32px 14px 40px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

      <tr><td align="center" style="background:${C.deep};border-radius:22px 22px 0 0;padding:30px 20px 26px">
        <a href="${SITE}" style="text-decoration:none">
          <img src="${LOGO_URL}" width="46" height="46" alt="b" style="display:inline-block;vertical-align:middle;border:0;border-radius:13px">
          <span style="display:inline-block;vertical-align:middle;margin-left:11px;font:700 27px ${SERIF};color:${C.cream};letter-spacing:0.2px">Bukea</span>
        </a>
      </td></tr>
      <tr><td height="3" style="height:3px;font-size:0;line-height:0;background:${C.gold}">&nbsp;</td></tr>

      <tr><td align="${align || 'center'}" style="background:#ffffff;border-radius:0 0 22px 22px;padding:40px 36px 38px;box-shadow:0 14px 34px rgba(15,40,38,0.08)">
        ${eb}
        <h1 style="margin:0 0 16px;font:700 27px ${SERIF};line-height:1.2;color:${C.ink};text-align:${align || 'center'}">${heading}</h1>
        ${bodyHtml}
        ${why}
      </td></tr>

      <tr><td align="center" style="padding:26px 12px 0">
        <div style="font:400 13px ${SANS};color:${C.faint};line-height:1.7">
          <a href="${SITE}" style="color:${C.teal};text-decoration:none;font-weight:600">Buscar y reservar</a>
          &nbsp;·&nbsp;
          <a href="${SITE}/contacto" style="color:${C.teal};text-decoration:none;font-weight:600">Ayuda y contacto</a>
          &nbsp;·&nbsp;
          <a href="${SITE}/privacidad" style="color:${C.teal};text-decoration:none;font-weight:600">Privacidad</a>
        </div>
        ${footNote ? `<div style="font:400 12px ${SANS};color:${C.faint};line-height:1.6;margin-top:12px">${footNote}</div>` : ''}
        <div style="font:400 12px ${SANS};color:${C.faint};line-height:1.6;margin-top:12px">Bukea · República Dominicana</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ---------- Correos ---------- */

function loginCode(code) {
  return layout({
    preheader: `Tu código para entrar a Bukea: ${code}`,
    eyebrow: 'Tu código',
    heading: 'Escribe este código para entrar',
    bodyHtml: `${p('Úsalo en la pantalla de Bukea donde pediste entrar o crear tu cuenta.')}${codeTile(code)}
      ${p('Vence en 15 minutos.')}`,
    whyHtml: 'Alguien escribió este correo para entrar o crear una cuenta en Bukea. Si no fuiste tú, no hace falta que hagas nada.',
  });
}

function pinReset(code) {
  return layout({
    preheader: `Tu código para crear un PIN nuevo en Bukea: ${code}`,
    eyebrow: 'Recuperar acceso',
    heading: 'Crea un PIN nuevo',
    bodyHtml: `${p('Usa este código para elegir un PIN nuevo y volver a entrar.')}${codeTile(code)}
      ${p('Vence en 15 minutos.')}`,
    whyHtml: 'Esta cuenta de Bukea pidió recuperar el acceso por PIN olvidado. Si no fuiste tú, tu cuenta sigue segura y no hace falta que hagas nada.',
  });
}

function verifyEmail(name, email, url) {
  const first = String(name || '').trim().split(/\s+/)[0];
  return layout({
    preheader: 'Confirma tu correo para terminar de crear tu cuenta en Bukea.',
    eyebrow: 'Un último paso',
    heading: `${first ? esc(first) + ', verifica' : 'Verifica'} tu correo`,
    bodyHtml: `${p(`Para proteger tu cuenta necesitamos confirmar que <strong style="color:${C.ink}">${esc(email)}</strong> es tuyo. Solo tienes que hacerlo esta vez.`)}
      ${button('Verificar mi correo', url)}
      ${p('El enlace vence en 24 horas.', 'center').replace('margin:0 0 14px', 'margin:18px 0 0')}`,
    whyHtml: `Tu correo se usó para crear una cuenta en Bukea. Si no fuiste tú, <a href="${SITE}/contacto" style="color:${C.teal};font-weight:600">avísanos aquí</a>.`,
  });
}

function welcomeClient(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'hola';
  return layout({
    preheader: 'Ya puedes reservar con barberos, manicuristas y salones cerca de ti.',
    eyebrow: 'Bienvenida',
    heading: `Hola, ${esc(first)}. Ya eres parte de Bukea`,
    bodyHtml: `${p('Reserva tu próxima cita en República Dominicana, sin llamadas ni mensajes de ida y vuelta. Es gratis para ti, siempre.')}
      ${steps([
        { title: 'Busca por sector o en el mapa', text: 'Barberías, uñas, salones, cejas y más, con horarios reales.' },
        { title: 'Elige servicio, fecha y hora', text: 'Ves lo que cuesta y cuándo hay espacio antes de confirmar.' },
        { title: 'Cancela cuando lo necesites', text: 'Tus citas están en Mi cuenta, a un toque.' },
      ])}
      ${button('Buscar y reservar', SITE)}
      ${p(`<a href="${SITE}/cuenta" style="color:${C.teal};font-weight:600;text-decoration:none">Ir a Mi cuenta</a>`).replace('margin:0 0 14px', 'margin:18px 0 0')}`,
    whyHtml: 'Creaste una cuenta en Bukea con este correo. Si no fuiste tú, <a href="' + SITE + '/contacto" style="color:' + C.teal + ';font-weight:600">avísanos aquí</a>.',
  });
}

function welcomeBusiness(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'hola';
  return layout({
    preheader: 'Tu cuenta de negocio está lista. Estos son los 3 pasos para recibir tus primeras citas.',
    eyebrow: 'Bienvenido a Bukea para negocios',
    heading: `${esc(first)}, tu negocio ya tiene casa`,
    bodyHtml: `${p('Recibe citas sin comisión por cada cliente nuevo y deja de contestar mensajes para agendar. Estos son los tres pasos para empezar:')}
      ${steps([
        { title: 'Carga tus servicios y precios', text: 'Lo que haces, cuánto dura y cuánto cuesta, en pesos.' },
        { title: 'Define tu horario', text: 'Tus clientes solo ven los espacios que de verdad tienes libres.' },
        { title: 'Comparte tu link', text: 'Ponlo en tu Instagram y WhatsApp para que reserven directo.' },
      ])}
      ${button('Abrir Mi Negocio', 'https://negocio.bukeard.com')}
      ${p('¿Dudas? Responde este correo y te ayudamos.').replace('margin:0 0 14px', 'margin:18px 0 0')}`,
    whyHtml: 'Creaste una cuenta de negocio en Bukea con este correo. Si no fuiste tú, <a href="' + SITE + '/contacto" style="color:' + C.teal + ';font-weight:600">avísanos aquí</a>.',
  });
}

// Mensaje escrito a mano desde el panel (soporte, saludo a negocios nuevos).
function message(subject, text) {
  return layout({
    preheader: String(text || '').replace(/\s+/g, ' ').slice(0, 110),
    eyebrow: 'Mensaje del equipo',
    heading: esc(subject),
    align: 'left',
    bodyHtml: `${paragraphs(text)}
      <p style="margin:22px 0 0;font:700 15px ${SERIF};color:${C.ink};text-align:left">El equipo de Bukea</p>
      <p style="margin:2px 0 0;font:400 13px ${SANS};color:${C.faint};text-align:left">Puedes responder directamente a este correo.</p>`,
  });
}

// Aviso interno de un negocio nuevo.
function newBusinessAlert(d) {
  return layout({
    preheader: `${d.businessName} (${d.category}, ${d.neighborhood}) acaba de registrarse`,
    eyebrow: 'Aviso interno',
    heading: 'Nuevo negocio registrado',
    bodyHtml: `${facts([
      ['Negocio', d.businessName],
      ['Profesional', d.name],
      ['Categoría', d.category],
      ['Sector', d.neighborhood],
      ['Servicios', d.servicesCount],
      ['Cuenta', [d.ownerName, d.ownerPhone, d.ownerEmail].filter(Boolean).join(' · ')],
      ['Conoció Bukea por', d.referral || 'sin responder'],
      ['Cupo fundador', d.foundingFree ? 'sí' : 'no'],
    ])}
      ${button('Ver en el panel', d.adminUrl)}
      ${p(`<a href="${esc(d.profileUrl)}" style="color:${C.teal};font-weight:600;text-decoration:none">Ver perfil público</a>`).replace('margin:0 0 14px', 'margin:18px 0 0')}`,
  });
}

// Confirmación de cita para el cliente (2026-10-12).
// d: { name, serviceName, priceCents, dayLabel, timeLabel, businessName, professionalName,
//      neighborhood, collaboratorName, paymentMethod, directionsUrl, profileUrl }
function bookingConfirmed(d) {
  const first = String(d.clientName || '').trim().split(/\s+/)[0];
  const price = 'RD$ ' + Math.round((d.priceCents || 0) / 100).toLocaleString('en-US');
  const pay = d.paymentMethod === 'bank' ? 'Transferencia' : 'Efectivo en el negocio';
  const when = `${d.dayLabel}, ${d.timeLabel}`;
  const payNote = d.paymentMethod === 'bank'
    ? p(`Pagas por transferencia. Las cuentas del negocio están en <a href="${esc(d.profileUrl)}" style="color:${C.teal};font-weight:600">su perfil</a>.`).replace('margin:0 0 14px', 'margin:22px 0 0')
    : '';
  return layout({
    preheader: `${d.serviceName} con ${d.professionalName}, ${when}`,
    eyebrow: 'Cita confirmada',
    heading: `${first ? esc(first) + ', tu' : 'Tu'} cita está lista`,
    bodyHtml: `${p('Guardamos tu espacio. Aquí tienes el resumen:')}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 0;background:${C.tealSoft};border:1px solid ${C.tealLine};border-radius:16px">
        <tr><td align="center" style="padding:22px 18px 10px">
          <div style="font:700 11px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.teal}">Cuándo</div>
          <div style="font:700 24px ${SERIF};color:${C.ink};margin-top:6px;line-height:1.25">${esc(when)}</div>
        </td></tr>
        <tr><td style="padding:6px 22px 20px">${facts([
          ['Servicio', d.serviceName],
          ['Precio', price],
          ['Con', d.collaboratorName || d.professionalName],
          ['Negocio', d.businessName],
          ['Dónde', d.neighborhood],
          ['Pago', pay],
        ])}</td></tr>
      </table>
      ${payNote}
      ${button('Cómo llegar', d.directionsUrl)}
      <p style="margin:20px 0 0;font:400 14px ${SANS};color:${C.text};text-align:center;line-height:1.7">
        <a href="${SITE}/cuenta" style="color:${C.teal};font-weight:600;text-decoration:none">Ver o cancelar en Mi cuenta</a>
      </p>`,
    whyHtml: 'Reservaste una cita en Bukea con este correo. Si no fuiste tú, <a href="' + SITE + '/contacto" style="color:' + C.teal + ';font-weight:600">avísanos aquí</a>.',
  });
}

// Mensajes que llegan a Bukea (ticket de soporte, formulario de contacto).
function inbound({ eyebrow, heading, rows, message: body }) {
  return layout({
    preheader: String(body || '').replace(/\s+/g, ' ').slice(0, 110),
    eyebrow,
    heading: esc(heading),
    align: 'left',
    bodyHtml: `${facts(rows)}<div style="margin-top:20px">${paragraphs(body)}</div>`,
  });
}

module.exports = { layout, button, codeTile, steps, facts, paragraphs, loginCode, pinReset, verifyEmail, welcomeClient, welcomeBusiness, bookingConfirmed, message, newBusinessAlert, inbound, LOGO_URL };
