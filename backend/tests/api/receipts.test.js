const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup, API_BASE } = require('./helpers');

after(cleanup);

function nextWeekdayDate() {
  const d = new Date();
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

async function uploadReceipt(bookingId, token) {
  const form = new FormData();
  // PNG de 1x1 real (no solo un nombre con extensión falsa) — sniffFileType
  // comprueba la firma de bytes, no la extensión ni el mimetype declarado.
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );
  form.append('receipt', new Blob([pngBytes], { type: 'image/png' }), 'comprobante.png');
  const res = await fetch(API_BASE + '/api/bookings/' + bookingId + '/receipt', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

test('SEC-03: solo el cliente dueño de la cita y el dueño del negocio ven el comprobante', async () => {
  const owner = await createUser('sec3owner');
  const biz = await createBusiness(owner);
  const profile = await api(`/api/professionals/${biz.body.slug}`);
  const serviceId = profile.body.services[0].id;
  const professionalId = profile.body.id;

  const client = await createUser('sec3client');
  const otherClient = await createUser('sec3other');
  const otherOwner = await createUser('sec3owner2');
  await createBusiness(otherOwner);

  const date = nextWeekdayDate();
  const booking = await api('/api/bookings', {
    method: 'POST', headers: { Authorization: 'Bearer ' + client.token },
    body: { professionalId, serviceId, date, time: '09:00', paymentMethod: 'bank' },
  });
  assert.equal(booking.status, 201);

  const upload = await uploadReceipt(booking.body.id, client.token);
  assert.equal(upload.status, 200, 'el cliente dueño de la cita sí puede subir su comprobante');

  const asClient = await api(`/api/bookings/${booking.body.id}/receipt-file`, {
    headers: { Authorization: 'Bearer ' + client.token },
  });
  assert.equal(asClient.status, 200, 'el cliente dueño de la cita puede ver su comprobante');

  const asOwner = await api(`/api/bookings/${booking.body.id}/receipt-file`, {
    headers: { Authorization: 'Bearer ' + owner.token },
  });
  assert.equal(asOwner.status, 200, 'el dueño del negocio puede ver el comprobante de su cita');

  const asOtherClient = await api(`/api/bookings/${booking.body.id}/receipt-file`, {
    headers: { Authorization: 'Bearer ' + otherClient.token },
  });
  assert.equal(asOtherClient.status, 403, 'otro cliente cualquiera no puede ver el comprobante ajeno');

  const asOtherOwner = await api(`/api/bookings/${booking.body.id}/receipt-file`, {
    headers: { Authorization: 'Bearer ' + otherOwner.token },
  });
  assert.equal(asOtherOwner.status, 403, 'el dueño de otro negocio no puede ver el comprobante ajeno');

  const noAuth = await api(`/api/bookings/${booking.body.id}/receipt-file`);
  assert.equal(noAuth.status, 401, 'sin sesión, no se sirve el archivo');

  // Solo el cliente dueño de la cita puede subir el comprobante — ni
  // siquiera el dueño del negocio.
  const ownerUpload = await uploadReceipt(booking.body.id, owner.token);
  assert.equal(ownerUpload.status, 403, 'el dueño del negocio no puede subir el comprobante, solo verlo');
});
