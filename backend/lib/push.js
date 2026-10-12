// Notificaciones push vía Firebase Cloud Messaging (2026-09-06, a pedido de
// Víctor: avisar al dueño de un negocio cuando un cliente reserva con él,
// como hace Fresha). Un solo canal para iOS y Android — FCM reenvía a APNs
// por debajo, así el backend nunca habla con APNs directo.
//
// Se activa solo cuando existe la variable de entorno
// FIREBASE_SERVICE_ACCOUNT (el JSON de la cuenta de servicio de Firebase,
// codificado en base64 — NO como texto plano: el selector de Node.js de
// cPanel hace un `export VAR=valor` sin comillas al arrancar la app, y un
// JSON con comillas, dos puntos y saltos de línea rompe ese export y
// llega truncado/corrupto a process.env. Base64 solo usa
// [A-Za-z0-9+/=], inmune a ese problema). Sin la variable,
// isConfigured() devuelve false y sendToUser() no hace nada — mismo
// patrón que lib/mailer.js y lib/whatsapp.js: una notificación que no se
// pudo mandar nunca debe tumbar la reserva que la disparó.

const pool = require('../db/pool');

function isConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

let messaging = null;
function getMessaging() {
  if (messaging) return messaging;
  const admin = require('firebase-admin');
  const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(json);
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
//
// sound/badge (2026-09-09, a pedido de Víctor): FCM NO agrega sonido ni
// número al ícono por defecto en iOS — hay que declarar `apns.payload.aps`
// explícitamente o la notificación llega silenciosa y sin badge aunque
// tenga `notification.title/body`. `badge` es el número final que debe
// mostrar el ícono (no un incremento); quien llama a sendToUser es quien
// decide ese número (ver countPendingBookings más abajo).
//
// silent=true manda un push "en segundo plano" (content-available, sin
// notification ni sonido): solo sirve para actualizar el badge del ícono
// sin generar un banner nuevo — se usa al abrir Resumen/Agenda para
// limpiar el número a 0 sin que parezca que llegó algo nuevo.
async function sendToUser(userId, { title, body, data, badge, silent } = {}) {
  if (!isConfigured() || !userId) return;

  try {
    const [rows] = await pool.query('SELECT token FROM push_tokens WHERE user_id = ?', [userId]);
    if (!rows.length) return;

    const fcm = getMessaging();
    const dataStrings = data
      ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      : undefined;
    const aps = Object.assign(
      {},
      badge !== undefined ? { badge } : {},
      silent ? { 'content-available': 1 } : { sound: 'default' }
    );
    const message = {
      // FCM exige al menos un campo de contenido además de apns/android —
      // un push silencioso sin `data` propio (el caso de limpiar el badge)
      // igual necesita este objeto, aunque quede vacío.
      data: dataStrings || {},
      apns: {
        payload: { aps },
        ...(silent ? { headers: { 'apns-priority': '5', 'apns-push-type': 'background' } } : {}),
      },
      ...(silent ? {} : { notification: { title, body }, android: { notification: { sound: 'default' } } }),
    };

    const results = await Promise.allSettled(
      rows.map(r => fcm.send({ token: r.token, ...message }))
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

// Cuántas reservas confirmadas no ha visto todavía el dueño de este
// negocio — es el número que se manda como badge del ícono en cada push
// de "Nueva reserva". Se resetea (vía bookings_seen_at) cuando el dueño
// abre Resumen o Agenda, ver GET /:slug/bookings en routes/professionals.js.
async function countPendingBookings(professionalId) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS n FROM bookings
     WHERE professional_id = ? AND status = 'confirmed'
       AND created_at > COALESCE(
         (SELECT bookings_seen_at FROM professionals WHERE id = ?),
         '1970-01-01'
       )`,
    [professionalId, professionalId]
  );
  return Number(row.n);
}

module.exports = { isConfigured, sendToUser, countPendingBookings };
