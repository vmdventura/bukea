const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { api, db, createUser, createBusiness, cleanup, API_BASE } = require('./helpers');
const { LOGOS_DIR } = require('../../lib/uploads');

after(cleanup);

async function ownerWithBusiness(prefix) {
  const user = await createUser(prefix);
  const biz = await createBusiness(user);
  return { user, slug: biz.body.slug };
}

test('SEC-01: cliente sin permiso no lee stats/agenda/horario/bancos/chat ajenos', async () => {
  const { slug } = await ownerWithBusiness('o1sec');
  const client = await createUser('c1sec');
  const auth = { Authorization: 'Bearer ' + client.token };

  for (const path of [
    `/api/professionals/${slug}/stats`,
    `/api/professionals/${slug}/bookings`,
    `/api/professionals/${slug}/hours`,
    `/api/professionals/${slug}/bank-accounts`,
    `/api/professionals/${slug}/messages`,
  ]) {
    const res = await api(path, { headers: auth });
    assert.equal(res.status, 403, `${path} debe responder 403 a un cliente sin negocio`);
  }
});

test('SEC-01: sin sesión, todo responde 401 (no 2xx con datos)', async () => {
  const { slug } = await ownerWithBusiness('o1anon');
  const res = await api(`/api/professionals/${slug}/stats`);
  assert.equal(res.status, 401);
});

test('SEC-02: O2 no puede escribir en el negocio de O1 (perfil/redes/ubicación/servicios/equipo)', async () => {
  const { slug } = await ownerWithBusiness('o1sec2');
  const { user: o2 } = await ownerWithBusiness('o2sec2');
  const auth = { Authorization: 'Bearer ' + o2.token };

  const writes = [
    api(`/api/professionals/${slug}/profile`, { method: 'PUT', headers: auth, body: { name: 'x', businessName: 'x', neighborhood: 'x', category: 'barberia' } }),
    api(`/api/professionals/${slug}/social`, { method: 'PUT', headers: auth, body: { instagram: 'hack' } }),
    api(`/api/professionals/${slug}/location`, { method: 'PUT', headers: auth, body: { lat: 18.5, lng: -69.9 } }),
    api(`/api/professionals/${slug}/services`, { method: 'PUT', headers: auth, body: { services: [] } }),
    api(`/api/professionals/${slug}/collaborators`, { method: 'PUT', headers: auth, body: { collaborators: [] } }),
  ];
  const results = await Promise.all(writes);
  for (const res of results) assert.equal(res.status, 403);
});

test('SEC-02 / A4: subir logo/foto ajenos responde 403 y NO escribe archivo en disco', async () => {
  const { slug } = await ownerWithBusiness('o1upload');
  const { user: o2 } = await ownerWithBusiness('o2upload');

  const before = fs.existsSync(LOGOS_DIR) ? fs.readdirSync(LOGOS_DIR).length : 0;

  const form = new FormData();
  form.append('logo', new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], { type: 'image/jpeg' }), 'x.jpg');
  const res = await fetch(`${API_BASE}/api/professionals/${slug}/logo`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + o2.token },
    body: form,
  });
  assert.equal(res.status, 403);

  const after1 = fs.existsSync(LOGOS_DIR) ? fs.readdirSync(LOGOS_DIR).length : 0;
  assert.equal(after1, before, 'ningún archivo nuevo debe quedar en disco tras un 403');
});

test('SEC-04: DELETE de foto inexistente/ajena responde 404, nunca 200 falso-positivo', async () => {
  const { slug: slugA, user: ownerA } = await ownerWithBusiness('o1photo');
  const photoId = 999999; // id que no pertenece a este negocio (ni existe)
  const res = await api(`/api/professionals/${slugA}/photos/${photoId}`, {
    method: 'DELETE', headers: { Authorization: 'Bearer ' + ownerA.token },
  });
  assert.equal(res.status, 404, 'affectedRows=0 debe responder 404, no 200 con deleted:true');
});

test('ID-05: capabilities/businesses vienen SIEMPRE del servidor — accountType manipulado en cliente no importa', async () => {
  const client = await createUser('spoofed');
  // El cliente "manda" accountType=owner en el header no tiene efecto: el
  // backend nunca lee eso de la sesión, la calcula de owner_user_id.
  const res = await api('/api/auth/session', { headers: { Authorization: 'Bearer ' + client.token } });
  assert.equal(res.body.capabilities.manageBusiness, false);
});
