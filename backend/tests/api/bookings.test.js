const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

function nextWeekdayDate() {
  // Martes a sábado, 9-18h es el horario por defecto (lib/hours.js) — toma
  // el próximo martes para asegurar disponibilidad sin depender del día
  // en que corra la prueba.
  const d = new Date();
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

test('BK-01: dos clientes reservando el mismo horario, exactamente uno gana', async () => {
  const owner = await createUser('bkowner');
  const biz = await createBusiness(owner);
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;

  const c1 = await createUser('bkc1');
  const c2 = await createUser('bkc2');
  const date = nextWeekdayDate();
  const time = '10:00';

  const payload = (token) => ({
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: { professionalId, serviceId, date, time, paymentMethod: 'cash' },
  });

  const [r1, r2] = await Promise.all([
    api('/api/bookings', payload(c1.token)),
    api('/api/bookings', payload(c2.token)),
  ]);

  const statuses = [r1.status, r2.status].sort();
  assert.deepEqual(statuses, [201, 409], 'uno gana (201), el otro choca (409)');
});

test('BK-04: cancelar libera el horario para una reserva nueva', async () => {
  const owner = await createUser('bk4owner');
  const biz = await createBusiness(owner);
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;

  const client = await createUser('bk4client');
  const date = nextWeekdayDate();
  const time = '11:00';

  const r1 = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time, paymentMethod: 'cash' },
  });
  assert.equal(r1.status, 201);

  const cancel = await api(`/api/bookings/${r1.body.id}/cancel`, { method: 'POST', headers: { Authorization: 'Bearer ' + client.token } });
  assert.equal(cancel.status, 200);

  const r2 = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time, paymentMethod: 'cash' },
  });
  assert.equal(r2.status, 201, 'el mismo horario debe volver a estar disponible tras cancelar');
});

test('BK-07: rechaza reserva con servicio ajeno/archivado o fuera de horario', async () => {
  const owner = await createUser('bk7owner');
  const biz = await createBusiness(owner);
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const professionalId = profile.body.id;
  const client = await createUser('bk7client');
  const date = nextWeekdayDate();

  const badService = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId: 999999, date, time: '10:00', paymentMethod: 'cash' },
  });
  assert.equal(badService.status, 404);

  const outOfHours = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId: profile.body.services[0].id, date, time: '23:00', paymentMethod: 'cash' },
  });
  assert.ok([400, 409].includes(outOfHours.status), 'fuera de horario debe rechazarse, no 201');
});
