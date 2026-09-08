const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

async function ownerWithBusiness(prefix) {
  const user = await createUser(prefix);
  const biz = await createBusiness(user);
  return { user, slug: biz.body.slug };
}

test('MAP-02: rechaza coordenadas inválidas sin guardar', async () => {
  const { user, slug } = await ownerWithBusiness('maploc');
  const auth = { Authorization: 'Bearer ' + user.token };

  const cases = [
    { lat: 91, lng: -69.9 },
    { lat: 18.5, lng: 181 },
    { lat: null, lng: -69.9 },
    { lat: '', lng: -69.9 },
    { lat: true, lng: -69.9 },
    { lat: 'no-numero', lng: -69.9 },
    { lat: [18.5], lng: -69.9 },
  ];
  for (const body of cases) {
    const res = await api(`/api/professionals/${slug}/location`, { method: 'PUT', headers: auth, body });
    assert.equal(res.status, 400, `debe rechazar ${JSON.stringify(body)}`);
  }
});

test('MAP-02: coordenadas válidas sí persisten y marcan locationConfirmed', async () => {
  const { user, slug } = await ownerWithBusiness('maplocok');
  const auth = { Authorization: 'Bearer ' + user.token };
  const res = await api(`/api/professionals/${slug}/location`, {
    method: 'PUT', headers: auth, body: { lat: 18.4655, lng: -69.9313 },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.lat, 18.4655);

  const profile = await api(`/api/professionals/${slug}`);
  assert.equal(profile.body.locationConfirmed, true);
  assert.ok(Math.abs(profile.body.lat - 18.4655) < 0.00001);
});

test('el pin manual del dueño no se pisa al cambiar el sector en /profile', async () => {
  const { user, slug } = await ownerWithBusiness('maplocpersist');
  const auth = { Authorization: 'Bearer ' + user.token };
  await api(`/api/professionals/${slug}/location`, { method: 'PUT', headers: auth, body: { lat: 18.5, lng: -69.9 } });

  const put = await api(`/api/professionals/${slug}/profile`, {
    method: 'PUT', headers: auth,
    body: { name: user.name, businessName: 'Negocio E2E reubicado', neighborhood: 'Naco', category: 'barberia' },
  });
  assert.equal(put.status, 200);

  // La re-geocodificación es async/fire-and-forget; si el pin manual NO se
  // pisa, lat/lng deben seguir siendo los exactos de arriba de inmediato
  // (no hay carrera posible: PUT /profile con pin confirmado nunca dispara
  // la geocodificación).
  const profile = await api(`/api/professionals/${slug}`);
  assert.equal(profile.body.lat, 18.5);
  assert.equal(profile.body.lng, -69.9);
});
