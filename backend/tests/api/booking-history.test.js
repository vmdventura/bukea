const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

function nextWeekdayDate() {
  const d = new Date();
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

test('BK-05: cambiar precio y archivar un servicio no altera reservas ya hechas con él', async () => {
  const owner = await createUser('bk5owner');
  const biz = await createBusiness(owner, {
    services: [{ name: 'Corte clásico', durationMin: 30, priceCents: 100000 }],
  });
  const authHeader = { Authorization: 'Bearer ' + owner.token };
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;

  const client = await createUser('bk5client');
  const date = nextWeekdayDate();
  const booking = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time: '09:00', paymentMethod: 'cash' },
  });
  assert.equal(booking.status, 201);
  assert.equal(booking.body.priceCents, 100000);

  // Sube el precio a RD$1.200 (misma id, para que se actualice en su
  // propia fila en vez de archivarse+recrearse).
  const priceChange = await api(`/api/professionals/${biz.body.slug}/services`, {
    method: 'PUT', headers: authHeader,
    body: { services: [{ id: serviceId, name: 'Corte clásico', durationMin: 30, priceCents: 120000 }] },
  });
  assert.equal(priceChange.status, 200);

  let bookings = await api(`/api/professionals/${biz.body.slug}/bookings`, { headers: authHeader });
  let saved = bookings.body.find(b => b.id === booking.body.id);
  assert.equal(saved.priceCents, 100000, 'la cita vieja debe conservar el precio de cuando se reservó, no el nuevo');

  // Ahora archiva el servicio por completo (lista vacía = ninguno se
  // conserva) — no debe borrar la fila ni romper la cita ya hecha.
  const archive = await api(`/api/professionals/${biz.body.slug}/services`, {
    method: 'PUT', headers: authHeader,
    body: { services: [{ name: 'Otro servicio', durationMin: 20, priceCents: 50000 }] },
  });
  assert.equal(archive.status, 200);

  const publicProfile = await api(`/api/professionals/${biz.body.slug}`);
  assert.ok(
    !publicProfile.body.services.some(s => s.id === serviceId),
    'el servicio archivado no debe aparecer para reservar de nuevo'
  );

  bookings = await api(`/api/professionals/${biz.body.slug}/bookings`, { headers: authHeader });
  saved = bookings.body.find(b => b.id === booking.body.id);
  assert.ok(saved, 'la cita con el servicio archivado sigue existiendo, sin error de llave foránea');
  assert.equal(saved.serviceName, 'Corte clásico');
  assert.equal(saved.priceCents, 100000);
});

test('BK-06: cambiar horario y equipo con una cita existente no la borra ni la rompe', async () => {
  const owner = await createUser('bk6owner');
  const biz = await createBusiness(owner);
  const authHeader = { Authorization: 'Bearer ' + owner.token };
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;

  const collabPut = await api(`/api/professionals/${biz.body.slug}/collaborators`, {
    method: 'PUT', headers: authHeader,
    body: { collaborators: [{ name: 'Flamante', role: 'Estilista' }] },
  });
  assert.equal(collabPut.status, 200);
  const collabList = await api(`/api/professionals/${biz.body.slug}/collaborators`, { headers: authHeader });
  const collaboratorId = collabList.body.find(c => c.name === 'Flamante').id;

  const client = await createUser('bk6client');
  const date = nextWeekdayDate();
  const booking = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time: '09:00', paymentMethod: 'cash', collaboratorId },
  });
  assert.equal(booking.status, 201);

  // Cambia el horario semanal — no debe tocar citas ya confirmadas.
  const hoursChange = await api(`/api/professionals/${biz.body.slug}/hours`, {
    method: 'PUT', headers: authHeader,
    body: { days: [{ weekday: 2, open: true, startTime: '10:00', endTime: '19:00' }] },
  });
  assert.equal(hoursChange.status, 200);

  let bookings = await api(`/api/professionals/${biz.body.slug}/bookings`, { headers: authHeader });
  let saved = bookings.body.find(b => b.id === booking.body.id);
  assert.ok(saved, 'la cita sigue ahí después de cambiar el horario');
  assert.equal(saved.collaboratorName, 'Flamante');

  // Quita a Flamante del equipo (lista nueva sin él) — la cita no debe
  // desaparecer ni romperse; el FK (ON DELETE SET NULL) debe dejar
  // collaborator_id en NULL en vez de fallar.
  const teamChange = await api(`/api/professionals/${biz.body.slug}/collaborators`, {
    method: 'PUT', headers: authHeader,
    body: { collaborators: [{ name: 'Yenifer', role: 'Estilista' }] },
  });
  assert.equal(teamChange.status, 200);

  bookings = await api(`/api/professionals/${biz.body.slug}/bookings`, { headers: authHeader });
  saved = bookings.body.find(b => b.id === booking.body.id);
  assert.ok(saved, 'la cita sigue existiendo después de quitar al colaborador que la atendía');
  assert.equal(saved.collaboratorName, null, 'el colaborador borrado queda NULL en la cita, no rompe la consulta');
});
