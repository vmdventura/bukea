// REL-04: un cliente instalado anterior (que solo lee accountType, slug,
// {token,name,phone,email,emailVerified}) sigue funcionando contra el
// backend nuevo — todo lo agregado hoy es aditivo, nunca reemplaza ni
// renombra un campo que ya existía.
const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

test('REL-04: GET /professionals/me sigue devolviendo {slug} plano', async () => {
  const user = await createUser('compatme');
  const before = await api('/api/professionals/me', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(before.status, 200);
  assert.equal(before.body.slug, null);

  await createBusiness(user);
  const after1 = await api('/api/professionals/me', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(typeof after1.body.slug, 'string', 'slug plano sigue presente, no solo dentro de businesses[]');
});

test('REL-04: /register sigue trayendo los campos viejos exactos', async () => {
  const user = await createUser('compatreg');
  for (const key of ['token', 'name', 'phone', 'email', 'emailVerified', 'accountType']) {
    assert.ok(key in user, `falta el campo viejo "${key}"`);
  }
});

test('REL-04: POST /professionals crea negocio y responde 201 con slug (forma vieja intacta)', async () => {
  const user = await createUser('compatbiz');
  const res = await createBusiness(user);
  assert.equal(res.status, 201);
  assert.equal(typeof res.body.slug, 'string');
});
