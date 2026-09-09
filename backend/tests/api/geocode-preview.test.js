const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

// No se prueba el camino feliz (geocodificación real contra Nominatim) para
// no depender de la red ni de su límite de 1 solicitud/segundo en la suite
// automatizada — verificado a mano contra producción (Punta Cana, La
// Altagracia; Cienfuegos, Santiago), ambos casos correctos.

test('geocode-preview: requiere sesión', async () => {
  const owner = await createUser('geopreview');
  const biz = await createBusiness(owner);
  const res = await api(`/api/professionals/${biz.body.slug}/geocode-preview`, {
    method: 'POST', body: { province: 'Santiago', sector: 'Tamboril' },
  });
  assert.equal(res.status, 401);
});

test('geocode-preview: 403 si el negocio no es tuyo', async () => {
  const owner = await createUser('geopreviewowner');
  const biz = await createBusiness(owner);
  const other = await createUser('geopreviewother');
  const res = await api(`/api/professionals/${biz.body.slug}/geocode-preview`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + other.token },
    body: { province: 'Santiago', sector: 'Tamboril' },
  });
  assert.equal(res.status, 403);
});

test('geocode-preview: 400 si falta provincia o sector', async () => {
  const owner = await createUser('geopreviewval');
  const biz = await createBusiness(owner);
  const auth = { Authorization: 'Bearer ' + owner.token };

  const noProvince = await api(`/api/professionals/${biz.body.slug}/geocode-preview`, {
    method: 'POST', headers: auth, body: { sector: 'Tamboril' },
  });
  assert.equal(noProvince.status, 400);

  const noSector = await api(`/api/professionals/${biz.body.slug}/geocode-preview`, {
    method: 'POST', headers: auth, body: { province: 'Santiago' },
  });
  assert.equal(noSector.status, 400);
});
