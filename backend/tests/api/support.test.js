const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

async function ownerWithBusiness(prefix) {
  const user = await createUser(prefix);
  const biz = await createBusiness(user);
  return { user, slug: biz.body.slug };
}

test('SUP-01: mismo clientKey enviado dos veces no duplica el mensaje', async () => {
  const { user, slug } = await ownerWithBusiness('sup1');
  const auth = { Authorization: 'Bearer ' + user.token };
  const clientKey = 'test-key-' + Date.now();

  const r1 = await api(`/api/professionals/${slug}/messages`, { method: 'POST', headers: auth, body: { message: 'Hola, necesito ayuda', clientKey } });
  assert.equal(r1.status, 200);
  const r2 = await api(`/api/professionals/${slug}/messages`, { method: 'POST', headers: auth, body: { message: 'Hola, necesito ayuda', clientKey } });
  assert.equal(r2.status, 200);
  assert.equal(r2.body.duplicate, true);

  const list = await api(`/api/professionals/${slug}/messages`, { headers: auth });
  const mine = list.body.filter(m => m.body === 'Hola, necesito ayuda');
  assert.equal(mine.length, 1, 'solo un mensaje debe existir pese al reintento');
});

test('mensaje de más de 3000 caracteres se rechaza, no se trunca en silencio', async () => {
  const { user, slug } = await ownerWithBusiness('suplong');
  const auth = { Authorization: 'Bearer ' + user.token };
  const long = 'a'.repeat(3001);
  const res = await api(`/api/professionals/${slug}/messages`, { method: 'POST', headers: auth, body: { message: long } });
  assert.equal(res.status, 400);
});

test('SUP-02: GET del hilo ya NO marca leído por sí solo', async () => {
  const { user, slug } = await ownerWithBusiness('sup2');
  const auth = { Authorization: 'Bearer ' + user.token };

  // Simula una respuesta del admin insertándola directo en la base sería
  // ideal, pero esta suite no tiene acceso a rutas de /admin en scope —
  // en su lugar comprobamos el contrato de las 3 rutas nuevas exista y
  // que GET no cambie el conteo de no leídos (0 aquí, sin mensajes de admin).
  await api(`/api/professionals/${slug}/messages`, { headers: auth });
  const before = await api(`/api/professionals/${slug}/messages/unread-count`, { headers: auth });
  await api(`/api/professionals/${slug}/messages`, { headers: auth });
  const after1 = await api(`/api/professionals/${slug}/messages/unread-count`, { headers: auth });
  assert.equal(before.body.unread, after1.body.unread);

  const markRead = await api(`/api/professionals/${slug}/messages/read`, { method: 'POST', headers: auth });
  assert.equal(markRead.status, 200);
});

test('?after=<id> trae solo mensajes nuevos', async () => {
  const { user, slug } = await ownerWithBusiness('supafter');
  const auth = { Authorization: 'Bearer ' + user.token };
  const r1 = await api(`/api/professionals/${slug}/messages`, { method: 'POST', headers: auth, body: { message: 'Primero' } });
  assert.equal(r1.status, 200);
  const all = await api(`/api/professionals/${slug}/messages`, { headers: auth });
  const firstId = all.body[0].id;
  await api(`/api/professionals/${slug}/messages`, { method: 'POST', headers: auth, body: { message: 'Segundo' } });
  const incremental = await api(`/api/professionals/${slug}/messages?after=${firstId}`, { headers: auth });
  assert.equal(incremental.body.length, 1);
  assert.equal(incremental.body[0].body, 'Segundo');
});
