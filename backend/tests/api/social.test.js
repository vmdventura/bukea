const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

async function ownerWithBusiness(prefix) {
  const user = await createUser(prefix);
  const biz = await createBusiness(user);
  return { user, slug: biz.body.slug };
}

test('SEC-05: rechaza esquemas peligrosos en website', async () => {
  const { user, slug } = await ownerWithBusiness('socsec');
  const auth = { Authorization: 'Bearer ' + user.token };
  for (const website of ['javascript:alert(1)', 'data:text/html,<script>1</script>', 'file:///etc/passwd']) {
    const res = await api(`/api/professionals/${slug}/social`, { method: 'PUT', headers: auth, body: { website } });
    assert.equal(res.status, 400, `debe rechazar ${website}`);
  }
});

test('SOC-01: acepta @handle, handle y URL completa; normaliza a handle', async () => {
  const { user, slug } = await ownerWithBusiness('sochandle');
  const auth = { Authorization: 'Bearer ' + user.token };

  const res = await api(`/api/professionals/${slug}/social`, {
    method: 'PUT', headers: auth,
    body: { instagram: '@mi.negocio', tiktok: 'https://www.tiktok.com/@otro.handle', facebook: 'https://facebook.com/paginabukea', website: 'bukeard.com' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.instagram, 'mi.negocio');
  assert.equal(res.body.tiktok, 'otro.handle');
  assert.equal(res.body.facebook, 'paginabukea');
  assert.equal(res.body.website, 'https://bukeard.com/');
});

test('SOC-01: borrar una red la deja vacía (no falla, no mantiene el valor viejo)', async () => {
  const { user, slug } = await ownerWithBusiness('socclear');
  const auth = { Authorization: 'Bearer ' + user.token };
  await api(`/api/professionals/${slug}/social`, { method: 'PUT', headers: auth, body: { instagram: 'algo' } });
  const res = await api(`/api/professionals/${slug}/social`, { method: 'PUT', headers: auth, body: { instagram: '' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.instagram, null);

  const profile = await api(`/api/professionals/${slug}`);
  assert.equal(profile.body.social.instagram, '');
});
