const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, db, createUser, createBusiness, cleanup } = require('./helpers');
const push = require('../../lib/push');

after(cleanup);

function nextWeekdayDate() {
  const d = new Date();
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

test('Badge: countPendingBookings cuenta solo confirmadas después de bookings_seen_at', async () => {
  const owner = await createUser('badgeowner');
  const biz = await createBusiness(owner);
  const authHeader = { Authorization: 'Bearer ' + owner.token };
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;
  const client = await createUser('badgeclient');
  const date = nextWeekdayDate();

  assert.equal(await push.countPendingBookings(professionalId), 0, 'sin reservas, el badge empieza en 0');

  const b1 = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time: '09:00', paymentMethod: 'cash' },
  });
  assert.equal(b1.status, 201);
  assert.equal(await push.countPendingBookings(professionalId), 1, 'una reserva nueva sube el badge a 1');

  const b2 = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time: '11:00', paymentMethod: 'cash' },
  });
  assert.equal(b2.status, 201);
  assert.equal(await push.countPendingBookings(professionalId), 2, 'dos reservas sin ver suben el badge a 2');

  // Abrir la agenda (GET /:slug/bookings) marca bookings_seen_at = NOW() —
  // el badge debe bajar a 0 aunque las reservas sigan ahí, confirmadas.
  const bookings = await api(`/api/professionals/${biz.body.slug}/bookings`, { headers: authHeader });
  assert.equal(bookings.status, 200);
  assert.equal(bookings.body.length, 2, 'la agenda sigue mostrando las dos reservas');

  // El UPDATE de bookings_seen_at corre después de res.json() (no bloquea
  // la respuesta) — un pequeño margen antes de comprobar.
  await new Promise(r => setTimeout(r, 300));
  assert.equal(await push.countPendingBookings(professionalId), 0, 'después de ver la agenda, el badge vuelve a 0');

  // Cancelar una reserva ya vista no debe hacer que el badge suba de 0.
  const cancel = await api(`/api/bookings/${b1.body.id}/cancel`, { method: 'POST', headers: authHeader });
  assert.equal(cancel.status, 200);
  assert.equal(await push.countPendingBookings(professionalId), 0, 'cancelar no revive el badge');

  // Una reserva nueva DESPUÉS de ver la agenda sí debe volver a subirlo.
  const b3 = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time: '13:00', paymentMethod: 'cash' },
  });
  assert.equal(b3.status, 201);
  assert.equal(await push.countPendingBookings(professionalId), 1, 'reserva nueva después de ver la agenda sube el badge de nuevo');
});
