// Recordatorio de cita por WhatsApp, 1 hora antes (2026-09-10). A
// diferencia del resto de la suite (que pega contra el servidor real por
// HTTP), lib/reminders.js no tiene endpoint propio — es un job en segundo
// plano, así que estas pruebas lo requieren directo dentro del mismo
// proceso (ver test-shim.js: todos los archivos de prueba ya corren en un
// solo proceso Node, comparten el pool de helpers.js).
const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { createUser, createBusiness, api, db, cleanup } = require('./helpers');
const { checkAndSendReminders } = require('../../lib/reminders');

after(cleanup);

// Variables reales de WHATSAPP_* (si las hay en el .env de staging) se
// guardan y restauran alrededor de cada prueba — así la prueba controla
// isReminderConfigured() sin pisar la configuración real del proceso.
const ENV_KEYS = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_REMINDER_TEMPLATE'];
function withEnv(vars, fn) {
  const original = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]));
  // process.env.X = undefined coerciona a la string "undefined" (sigue
  // siendo truthy) en vez de borrar la variable — hay que delete a mano.
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return Promise.resolve(fn()).finally(() => {
    for (const k of ENV_KEYS) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });
}

function withFetch(mockFetch, fn) {
  const original = global.fetch;
  global.fetch = mockFetch;
  return Promise.resolve(fn()).finally(() => { global.fetch = original; });
}

// appointment_at guarda la hora de pared de RD tal cual (ver db/pool.js) —
// hay que formatear en esa zona, no en UTC, o una prueba corrida en un
// huso distinto al del servidor calcularía una ventana equivocada.
function rdDateTimeAt(minutesFromNow) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(Date.now() + minutesFromNow * 60000)).map(p => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day} ${hour}:${parts.minute}:${parts.second}`;
}

// createBusiness solo devuelve {slug, existing} — el id numérico y el id
// del servicio hacen falta para insertar la reserva directo por SQL, así
// que se leen del perfil público justo después de crearlo.
async function createBookableBusiness(prefix) {
  const owner = await createUser(prefix);
  const created = await createBusiness(owner);
  const profile = await api('/api/professionals/' + created.body.slug);
  return { id: profile.body.id, serviceId: profile.body.services[0].id };
}

async function insertBooking(professionalId, serviceId, clientUserId, minutesFromNow) {
  const appointmentAt = rdDateTimeAt(minutesFromNow);
  const [result] = await db().query(
    `INSERT INTO bookings
       (professional_id, service_id, client_user_id, client_name, day_label, time_label,
        appointment_at, duration_min, service_name, price_cents, status, payment_method)
     VALUES (?, ?, ?, 'E2E', 'Hoy', '—', ?, 30, 'Corte', 100000, 'confirmed', 'cash')`,
    [professionalId, serviceId, clientUserId, appointmentAt]
  );
  return result.insertId;
}

test('recordatorios: sin WHATSAPP_REMINDER_TEMPLATE configurado, no intenta mandar nada', async () => {
  const biz = await createBookableBusiness('remindercfg');
  const client = await createUser('reminderclient');
  const bookingId = await insertBooking(biz.id, biz.serviceId, client.id, 60);

  let fetchCalled = false;
  await withEnv({ WHATSAPP_TOKEN: undefined, WHATSAPP_PHONE_ID: undefined, WHATSAPP_REMINDER_TEMPLATE: undefined }, () =>
    withFetch(() => { fetchCalled = true; }, () => checkAndSendReminders())
  );

  assert.equal(fetchCalled, false);
  const [[row]] = await db().query('SELECT reminder_sent_at FROM bookings WHERE id = ?', [bookingId]);
  assert.equal(row.reminder_sent_at, null);
});

test('recordatorios: cita a 1 hora, plantilla configurada, manda la plantilla y marca reminder_sent_at', async () => {
  const biz = await createBookableBusiness('remindersend');
  const client = await createUser('reminderclient2');
  const bookingId = await insertBooking(biz.id, biz.serviceId, client.id, 60);

  let sentBody = null;
  await withEnv(
    { WHATSAPP_TOKEN: 'test-token', WHATSAPP_PHONE_ID: '123', WHATSAPP_REMINDER_TEMPLATE: 'recordatorio_cita' },
    () => withFetch(async (url, opts) => {
      sentBody = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ messages: [{ id: 'wamid.test' }] }) };
    }, () => checkAndSendReminders())
  );

  assert.ok(sentBody, 'debió llamar a la Cloud API de WhatsApp');
  assert.equal(sentBody.type, 'template');
  assert.equal(sentBody.template.name, 'recordatorio_cita');
  assert.equal(sentBody.to, '1' + client.phone);

  const [[row]] = await db().query('SELECT reminder_sent_at FROM bookings WHERE id = ?', [bookingId]);
  assert.ok(row.reminder_sent_at, 'reminder_sent_at debió quedar marcado tras el envío exitoso');
});

test('recordatorios: cita fuera de la ventana (mañana) no se toca', async () => {
  const biz = await createBookableBusiness('reminderfar');
  const client = await createUser('reminderclient3');
  const bookingId = await insertBooking(biz.id, biz.serviceId, client.id, 24 * 60);

  let fetchCalled = false;
  await withEnv(
    { WHATSAPP_TOKEN: 'test-token', WHATSAPP_PHONE_ID: '123', WHATSAPP_REMINDER_TEMPLATE: 'recordatorio_cita' },
    () => withFetch(() => { fetchCalled = true; }, () => checkAndSendReminders())
  );

  assert.equal(fetchCalled, false);
  const [[row]] = await db().query('SELECT reminder_sent_at FROM bookings WHERE id = ?', [bookingId]);
  assert.equal(row.reminder_sent_at, null);
});

test('recordatorios: no repite un recordatorio ya mandado', async () => {
  const biz = await createBookableBusiness('reminderdup');
  const client = await createUser('reminderclient4');
  const bookingId = await insertBooking(biz.id, biz.serviceId, client.id, 60);
  await db().query('UPDATE bookings SET reminder_sent_at = NOW() WHERE id = ?', [bookingId]);

  let fetchCalled = false;
  await withEnv(
    { WHATSAPP_TOKEN: 'test-token', WHATSAPP_PHONE_ID: '123', WHATSAPP_REMINDER_TEMPLATE: 'recordatorio_cita' },
    () => withFetch(() => { fetchCalled = true; }, () => checkAndSendReminders())
  );

  assert.equal(fetchCalled, false);
});
