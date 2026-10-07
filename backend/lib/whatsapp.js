// Envío de mensajes vía WhatsApp Cloud API (Meta Graph API).
// Se activa solo cuando existen las variables de entorno:
//   WHATSAPP_TOKEN     — token permanente del sistema (Meta Business)
//   WHATSAPP_PHONE_ID  — ID del número de teléfono de WhatsApp Business
//   WHATSAPP_AUTH_TEMPLATE — nombre de la plantilla de autenticación aprobada (ej. "codigo_bukea")
// Sin ellas, isConfigured() devuelve false y el flujo de PIN sigue siendo el único login.

const GRAPH_VERSION = 'v21.0';

function isConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_AUTH_TEMPLATE);
}

async function sendAuthCode(phone, code) {
  if (!isConfigured()) {
    throw new Error('WhatsApp Cloud API no está configurado (faltan variables de entorno)');
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: '1' + phone, // números dominicanos: +1 XXX XXX XXXX
    type: 'template',
    template: {
      name: process.env.WHATSAPP_AUTH_TEMPLATE,
      language: { code: 'es_DO' },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.WHATSAPP_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WhatsApp API respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

// Mensaje de texto libre (panel de administración, Comunicación, Fase 2).
// A diferencia de sendAuthCode (plantilla aprobada, se puede mandar en
// frío), un mensaje type:"text" de la Cloud API solo entrega si el número
// le escribió a Bukea en las últimas 24 horas (ventana de sesión de
// WhatsApp Business) — suficiente para que un admin responda soporte, no
// para mandar en frío a cualquier cliente.
async function sendTextMessage(phone, text) {
  if (!isConfigured()) {
    throw new Error('WhatsApp Cloud API no está configurado (faltan variables de entorno)');
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: '1' + phone,
    type: 'text',
    text: { body: text },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.WHATSAPP_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WhatsApp API respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

// Recordatorio de cita, 1 hora antes (2026-09-10, a pedido de Víctor). Como
// sendAuthCode (y a diferencia de sendTextMessage), usa una plantilla
// aprobada de Meta: un mensaje type:"text" solo entrega si el cliente le
// escribió a Bukea en las últimas 24 horas, y no hay garantía de que lo haya
// hecho justo antes de su cita. La plantilla necesita existir y estar
// aprobada en Meta Business (categoría Utilidad, no Marketing, para que
// pueda mandarse en frío) — nombre en WHATSAPP_REMINDER_TEMPLATE.
//
// Texto de la plantilla "recordatorio_cita" (actualizada 2026-09-10 al
// estilo más completo de Fresha, a pedido de Víctor), variables del body en
// el mismo orden que aquí: {{1}} nombre del cliente, {{2}} negocio,
// {{3}} fecha y hora, {{4}} servicio. Sin esa variable configurada,
// isReminderConfigured() da false y el job de lib/reminders.js no intenta
// nada.
function isReminderConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_REMINDER_TEMPLATE);
}

async function sendAppointmentReminder(phone, { clientName, businessName, dateTime, serviceName }) {
  if (!isReminderConfigured()) {
    throw new Error('Plantilla de recordatorio no configurada (falta WHATSAPP_REMINDER_TEMPLATE)');
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: '1' + phone,
    type: 'template',
    template: {
      name: process.env.WHATSAPP_REMINDER_TEMPLATE,
      language: { code: 'es_DO' },
      components: [
        { type: 'body', parameters: [
          { type: 'text', text: clientName },
          { type: 'text', text: businessName },
          { type: 'text', text: dateTime },
          { type: 'text', text: serviceName },
        ] },
      ],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.WHATSAPP_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WhatsApp API respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

module.exports = { isConfigured, sendAuthCode, sendTextMessage, isReminderConfigured, sendAppointmentReminder };
