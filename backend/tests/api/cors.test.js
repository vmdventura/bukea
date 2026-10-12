const { test } = require('./test-shim');
const assert = require('node:assert/strict');
const { API_BASE } = require('./helpers');

test('SEC-06: preflight desde el origen nativo permite PATCH y trae Vary: Origin', async () => {
  const res = await fetch(API_BASE + '/api/auth/name', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://localhost',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'Content-Type,Authorization',
    },
  });
  assert.equal(res.status, 204);
  const methods = res.headers.get('access-control-allow-methods') || '';
  assert.ok(methods.includes('PATCH'), `Allow-Methods debe incluir PATCH, vino: "${methods}"`);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://localhost');
  assert.equal(res.headers.get('vary'), 'Origin');
});

test('CORS: origen no permitido no recibe Allow-Origin (autorización del recurso sigue aplicando aparte)', async () => {
  const res = await fetch(API_BASE + '/api/auth/session', {
    headers: { Origin: 'https://evil.example.com', Authorization: 'Bearer x' },
  });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
  assert.equal(res.headers.get('vary'), 'Origin', 'Vary: Origin va siempre, haya o no match');
});

test('PATCH real /api/auth/name funciona de punta a punta (no solo el preflight)', async () => {
  const { createUser, cleanup } = require('./helpers');
  const user = await createUser('patchreal');
  const res = await fetch(API_BASE + '/api/auth/name', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + user.token, Origin: 'https://localhost' },
    body: JSON.stringify({ name: 'Nombre Nuevo' }),
  });
  assert.equal(res.status, 200);
  await cleanup();
});
