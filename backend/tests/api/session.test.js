const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, db, createUser, cleanup } = require('./helpers');

after(cleanup);

test('A1: GET /session devuelve el contrato aditivo completo', async () => {
  const user = await createUser('sess');
  const res = await api('/api/auth/session', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(res.status, 200);
  assert.equal(res.body.id, user.id);
  assert.equal(res.body.accountType, 'client');
  assert.deepEqual(res.body.capabilities, { bookAsClient: true, manageBusiness: false });
  assert.deepEqual(res.body.businesses, []);
  // Campos que ya consumían los builds instalados, sin romper:
  assert.equal(res.body.email, user.email);
  assert.equal(res.body.emailVerified, false);
  assert.equal(res.body.phoneVerified, false);
});

test('A1: /register también devuelve capabilities/businesses (no solo /session)', async () => {
  const user = await createUser('reg');
  assert.deepEqual(user.capabilities, { bookAsClient: true, manageBusiness: false });
  assert.deepEqual(user.businesses, []);
  assert.equal(user.id > 0, true);
});

test('ID-06: token inválido → 401, no 500 ni datos', async () => {
  const res = await api('/api/auth/session', { headers: { Authorization: 'Bearer no-existe-este-token' } });
  assert.equal(res.status, 401);
});

test('ID-06: sin Authorization → 401', async () => {
  const res = await api('/api/auth/session');
  assert.equal(res.status, 401);
});

test('ID-06: cuenta desactivada por un admin (disabled_at, token intacto) → 403', async () => {
  // Distinto de "eliminar mi cuenta" (abajo): el panel de admin desactiva
  // sin tocar el token, así que la sesión sigue siendo válida pero
  // bloqueada — debe distinguirse de un token simplemente vencido (401).
  const user = await createUser('admindisabled');
  await db().query('UPDATE users SET disabled_at = NOW() WHERE id = ?', [user.id]);
  const res = await api('/api/auth/session', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(res.status, 403);
});

test('ID-06: "eliminar mi cuenta" invalida el token de inmediato (401, no 403)', async () => {
  const user = await createUser('selfdeleted');
  const del = await api('/api/auth/delete-account', { method: 'POST', headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(del.status, 200);
  const res = await api('/api/auth/session', { headers: { Authorization: 'Bearer ' + user.token } });
  assert.equal(res.status, 401, 'el token quedó NULL en la fila anonimizada, ya no existe sesión que bloquear con 403');
});

test('REL-04: POST /login sigue devolviendo la forma vieja de sesión, ampliada', async () => {
  const user = await createUser('login');
  const res = await api('/api/auth/login', { method: 'POST', body: { phone: user.phone, pin: '1234' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, user.name);
  assert.equal(typeof res.body.token, 'string');
  assert.ok(res.body.capabilities);
});
