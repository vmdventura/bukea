const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

function nextWeekdayDate() {
  const d = new Date();
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

test('BK-02: dos servicios de duración distinta que se solapan en el medio, exactamente uno gana', async () => {
  const owner = await createUser('bk2owner');
  const biz = await createBusiness(owner, {
    services: [
      { name: 'Servicio 45min', durationMin: 45, priceCents: 100000 },
      { name: 'Servicio 30min', durationMin: 30, priceCents: 80000 },
    ],
  });
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const svc45 = profile.body.services.find(s => s.durationMin === 45).id;
  const svc30 = profile.body.services.find(s => s.durationMin === 30).id;
  const professionalId = profile.body.id;

  const c1 = await createUser('bk2c1');
  const c2 = await createUser('bk2c2');
  const date = nextWeekdayDate();

  // 45 min a las 9:00 (9:00-9:45) y 30 min a las 9:15 (9:15-9:45) se
  // solapan en el medio aunque empiecen en minutos distintos — el UNIQUE
  // por sí solo (mismo professional_id + appointment_at exacto) no lo
  // detectaría; solo el recálculo de huecos libres dentro de la
  // transacción (computeFreeSlots) lo bloquea.
  const [r1, r2] = await Promise.all([
    api('/api/bookings', {
      method: 'POST', headers: { Authorization: 'Bearer ' + c1.token },
      body: { professionalId, serviceId: svc45, date, time: '09:00', paymentMethod: 'cash' },
    }),
    api('/api/bookings', {
      method: 'POST', headers: { Authorization: 'Bearer ' + c2.token },
      body: { professionalId, serviceId: svc30, date, time: '09:15', paymentMethod: 'cash' },
    }),
  ]);

  const statuses = [r1.status, r2.status].sort();
  assert.deepEqual(statuses, [201, 409], 'exactamente una reserva activa para el hueco disputado, no las dos');
});

test('BK-03: horarios contiguos (10:00-10:30 y 10:30-11:00) se permiten los dos', async () => {
  const owner = await createUser('bk3owner');
  const biz = await createBusiness(owner, {
    services: [{ name: 'Corte 30min', durationMin: 30, priceCents: 50000 }],
  });
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;

  const c1 = await createUser('bk3c1');
  const c2 = await createUser('bk3c2');
  const date = nextWeekdayDate();

  const r1 = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + c1.token },
    body: { professionalId, serviceId, date, time: '10:00', paymentMethod: 'cash' },
  });
  const r2 = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + c2.token },
    body: { professionalId, serviceId, date, time: '10:30', paymentMethod: 'cash' },
  });

  assert.equal(r1.status, 201, 'primer horario debe reservarse');
  assert.equal(r2.status, 201, 'horario contiguo (sin solape) debe reservarse también');
});
