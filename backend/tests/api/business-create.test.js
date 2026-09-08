const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

test('ID-02: cliente sin negocio crea uno y conserva su identidad', async () => {
  const user = await createUser('c1');
  const before = await api('/api/auth/session', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(before.body.capabilities.manageBusiness, false);

  const res = await createBusiness(user);
  assert.equal(res.status, 201);
  assert.equal(res.body.existing, false);
  assert.ok(res.body.slug);

  const after1 = await api('/api/auth/session', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(after1.body.id, user.id, 'misma identidad de usuario');
  assert.equal(after1.body.accountType, 'owner', 'account_type se actualiza al crear negocio');
  assert.equal(after1.body.capabilities.manageBusiness, true);
  assert.equal(after1.body.businesses.length, 1);
  assert.equal(after1.body.businesses[0].slug, res.body.slug);
});

test('ID-03: dos altas concurrentes del mismo dueño no crean dos negocios', async () => {
  const user = await createUser('concurrent');
  const [r1, r2] = await Promise.all([createBusiness(user), createBusiness(user)]);

  const statuses = [r1.status, r2.status].sort();
  assert.deepEqual(statuses, [200, 201], 'una crea (201), la otra ve la existente (200)');
  assert.equal(r1.body.slug, r2.body.slug, 'mismo slug en ambas respuestas');

  const me = await api('/api/professionals/me', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(me.body.businesses.length, 1, 'exactamente un negocio en la base');
});

test('ID-03: reintento secuencial (doble toque) devuelve el negocio existente, no error', async () => {
  const user = await createUser('doubletap');
  const r1 = await createBusiness(user);
  assert.equal(r1.status, 201);
  const r2 = await createBusiness(user, { businessName: 'Otro nombre, mismo dueño' });
  assert.equal(r2.status, 200);
  assert.equal(r2.body.existing, true);
  assert.equal(r2.body.slug, r1.body.slug, 'no crea un segundo negocio aunque el payload cambie');
});

test('ID-04: alta con datos inválidos no deja negocio parcial', async () => {
  const user = await createUser('partial');
  const res = await api('/api/professionals', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + user.token },
    body: { name: user.name, businessName: 'X', neighborhood: 'Piantini', category: 'barberia', services: [] },
  });
  assert.equal(res.status, 400, 'sin servicios, rechaza antes de tocar la base');

  const me = await api('/api/professionals/me', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(me.body.slug, null, 'no quedó ningún negocio a medias');
});

test('alta de negocio crea horario y servicio por defecto (transacción completa)', async () => {
  const user = await createUser('full');
  const res = await createBusiness(user);
  assert.equal(res.status, 201);

  const profile = await api('/api/professionals/' + res.body.slug);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.services.length, 1);
});
