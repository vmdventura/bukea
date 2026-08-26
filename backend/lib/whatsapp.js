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

module.exports = { isConfigured, sendAuthCode, sendTextMessage };
