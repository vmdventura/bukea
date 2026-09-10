// Recordatorio de cita por WhatsApp, 1 hora antes (2026-09-10, a pedido de
// Víctor, tras la prueba en vivo del flujo de reserva: el mensaje de
// confirmación que se veía en el ticket era solo un mockup visual, nunca
// se mandaba de verdad). No hay cola ni cron externo: un solo proceso
// Node de por vida (cPanel), así que un setInterval adentro del mismo
// proceso alcanza — ver startReminderScheduler(), llamado una vez desde
// app.js al arrancar.
//
// Por qué por sondeo y no por temporizador exacto: appointment_at se fija
// al reservar, pero una cita se puede cancelar o reprogramar después. Un
// setTimeout por cita habría que cancelarlo a mano en cada cambio; revisar
// cada pocos minutos qué cae dentro de la ventana es más simple y no se
// desincroniza si el proceso se reinicia (un despliegue, un crash) —
// peor caso, el recordatorio de esa ventana sale unos minutos más tarde.

const pool = require('../db/pool');
const whatsapp = require('./whatsapp');
const { RD_TZ, formatTime12h } = require('./availability');

const REMINDER_LEAD_MIN = 60; // cuánto antes de la cita debe llegar
const WINDOW_MIN = 10; // ancho de la ventana, debe ser >= POLL_INTERVAL_MS/60000
const POLL_INTERVAL_MS = 5 * 60 * 1000;

// Fecha/hora en RD a `msFromNow` milisegundos desde ahora, como el mismo
// string "YYYY-MM-DD HH:MM:SS" que usa appointment_at (ver db/pool.js,
// dateStrings:true) — comparable directo en la consulta SQL de abajo.
function rdDateTimeAt(msFromNow) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: RD_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(Date.now() + msFromNow)).map(p => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day} ${hour}:${parts.minute}:${parts.second}`;
}

async function checkAndSendReminders() {
  const windowStart = rdDateTimeAt((REMINDER_LEAD_MIN - WINDOW_MIN / 2) * 60000);
  const windowEnd = rdDateTimeAt((REMINDER_LEAD_MIN + WINDOW_MIN / 2) * 60000);

  let rows;
  try {
    [rows] = await pool.query(
      `SELECT b.id, b.appointment_at, u.phone AS client_phone,
              p.name AS professional_name, p.business_name
       FROM bookings b
       JOIN users u ON u.id = b.client_user_id
       JOIN professionals p ON p.id = b.professional_id
       WHERE b.status = 'confirmed' AND b.reminder_sent_at IS NULL
         AND b.appointment_at BETWEEN ? AND ?
         AND u.phone IS NOT NULL AND u.disabled_at IS NULL`,
      [windowStart, windowEnd]
    );
  } catch (err) {
    console.error('[recordatorios] error consultando citas:', err.message);
    return;
  }

  for (const row of rows) {
    try {
      await whatsapp.sendAppointmentReminder(row.client_phone, {
        professionalName: row.professional_name,
        businessName: row.business_name,
        time: formatTime12h(row.appointment_at.slice(11, 16)),
      });
      await pool.query('UPDATE bookings SET reminder_sent_at = NOW(3) WHERE id = ?', [row.id]);
    } catch (err) {
      // No reintenta en el mismo ciclo — si la plantilla o el número fallan,
      // seguirá fallando en la próxima corrida también; el error queda en el
      // log para que Víctor lo note, pero no debe tumbar el resto de la cola.
      console.error(`[recordatorios] no se pudo mandar el de la cita ${row.id}:`, err.message);
    }
  }
}

function startReminderScheduler() {
  if (!whatsapp.isReminderConfigured()) {
    console.log('[recordatorios] WHATSAPP_REMINDER_TEMPLATE no configurado, job desactivado');
    return;
  }
  checkAndSendReminders();
  setInterval(checkAndSendReminders, POLL_INTERVAL_MS);
}

module.exports = { checkAndSendReminders, startReminderScheduler };
