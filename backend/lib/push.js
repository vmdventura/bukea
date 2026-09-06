// Notificaciones push vía Firebase Cloud Messaging (2026-09-06, a pedido de
// Víctor: avisar al dueño de un negocio cuando un cliente reserva con él,
// como hace Fresha). Un solo canal para iOS y Android — FCM reenvía a APNs
// por debajo, así el backend nunca habla con APNs directo.
//
// Se activa solo cuando existe la variable de entorno
// FIREBASE_SERVICE_ACCOUNT (el JSON de la cuenta de servicio de Firebase,
// como texto plano). Sin ella, isConfigured() devuelve false y
// sendToUser() no hace nada — mismo patrón que lib/mailer.js y
// lib/whatsapp.js: una notificación que no se pudo mandar nunca debe
// tumbar la reserva que la disparó.

const pool = require('../db/pool');

function isConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

let messaging = null;
function getMessaging() {
  if (messaging) return messaging;
  const admin = require('firebase-admin');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const app = admin.apps.length ? admin.app() : admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  messaging = admin.messaging(app);
  return messaging;
}

// Códigos de error de FCM que significan "este token ya no sirve" (el
// usuario desinstaló la app, o el token venció) — se borra de una vez en
// vez de seguir intentando mandarle algo que nunca va a llegar.
const STALE_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

// Manda una notificación a todos los dispositivos registrados de un
// usuario (puede tener más de uno). Nunca lanza — un fallo de push no debe
// interrumpir el flujo que la disparó (crear una reserva, etc.).
async function sendToUser(userId, { title, body, data }) {
  if (!isConfigured() || !userId) return;

  try {
    const [rows] = await pool.query('SELECT token FROM push_tokens WHERE user_id = ?', [userId]);
    if (!rows.length) return;

    const fcm = getMessaging();
    const dataStrings = data
      ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      : undefined;

    const results = await Promise.allSettled(
      rows.map(r => fcm.send({ token: r.token, notification: { title, body }, data: dataStrings }))
    );

    const staleTokens = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const code = result.reason && result.reason.errorInfo && result.reason.errorInfo.code;
        if (STALE_TOKEN_ERRORS.has(code)) {
          staleTokens.push(rows[i].token);
        } else {
          console.error('Error enviando push:', result.reason && result.reason.message);
        }
      }
    });
    if (staleTokens.length) {
      await pool.query('DELETE FROM push_tokens WHERE token IN (?)', [staleTokens]);
    }
  } catch (err) {
    console.error('Error en sendToUser (push):', err.message);
  }
}

module.exports = { isConfigured, sendToUser };
