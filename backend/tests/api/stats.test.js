const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, db, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

// Inserta directo en bookings (no vía POST /api/bookings) para controlar
// appointment_at con precisión — DATA-02 depende de fechas exactas
// respecto a CURDATE(), no de qué día de la semana corra la prueba.
async function insertBooking(conn, { professionalId, serviceId, clientId, daysAgo, priceCents, status }) {
  const appointmentAt = `DATE_SUB(NOW(), INTERVAL ${Number(daysAgo)} DAY)`;
  await conn.query(
    `INSERT INTO bookings
       (professional_id, service_id, client_user_id, client_name, day_label, time_label,
        appointment_at, duration_min, service_name, price_cents, payment_method, status)
     VALUES (?, ?, ?, 'DATA-02 test', 'Hoy', '9:00 AM', ${appointmentAt}, 30, 'Servicio de prueba', ?, 'cash', ?)`,
    [professionalId, serviceId, clientId, priceCents, status]
  );
}

test('DATA-02: Mi Cuadre excluye canceladas y usa el precio histórico de cada cita, no el actual', async () => {
  const owner = await createUser('data2owner');
  const biz = await createBusiness(owner, {
    services: [{ name: 'Servicio de prueba', durationMin: 30, priceCents: 999999 }],
  });
  const authHeader = { Authorization: 'Bearer ' + owner.token };
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;
  const client = await createUser('data2client');
  const conn = db();

  // Precio actual del servicio (999999) es deliberadamente distinto de los
  // precios históricos de las citas (100000/150000) para probar que Mi
  // Cuadre no recalcula con el precio de hoy.
  await insertBooking(conn, { professionalId, serviceId, clientId: client.id, daysAgo: 0, priceCents: 100000, status: 'confirmed' }); // hoy
  await insertBooking(conn, { professionalId, serviceId, clientId: client.id, daysAgo: 3, priceCents: 150000, status: 'confirmed' }); // dentro de 7 días
  await insertBooking(conn, { professionalId, serviceId, clientId: client.id, daysAgo: 0, priceCents: 500000, status: 'cancelled' }); // hoy pero cancelada
  await insertBooking(conn, { professionalId, serviceId, clientId: client.id, daysAgo: 20, priceCents: 200000, status: 'confirmed' }); // fuera de mes/semana (si el mes es corto) — solo se usa para no-contaminar hoy/semana

  const stats = await api(`/api/professionals/${biz.body.slug}/stats`, { headers: authHeader });
  assert.equal(stats.status, 200);
  assert.equal(stats.body.today.count, 1, 'la cancelada de hoy no debe contar');
  assert.equal(stats.body.today.totalCents, 100000, 'usa el precio histórico de la cita (100000), no el actual del servicio (999999) ni el de la cancelada (500000)');
  assert.equal(stats.body.last7Days.count, 2, 'las dos confirmadas dentro de 7 días cuentan, la cancelada no');
  assert.equal(stats.body.last7Days.totalCents, 250000, '100000 + 150000, precios históricos');
});
