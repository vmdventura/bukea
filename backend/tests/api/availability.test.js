const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

test('Disponibilidad: serviceId inválido o ausente da 400, no 500', async () => {
  const owner = await createUser('availowner');
  const biz = await createBusiness(owner);
  const slug = biz.body.slug;

  const noService = await api(`/api/professionals/${slug}/availability/days`);
  assert.equal(noService.status, 400, 'sin serviceId, /days debe dar 400');

  const nanService = await api(`/api/professionals/${slug}/availability/days?serviceId=nope`);
  assert.equal(nanService.status, 400, 'serviceId no numérico en /days debe dar 400');

  const noServiceTimes = await api(`/api/professionals/${slug}/availability/times?date=2026-09-10`);
  assert.equal(noServiceTimes.status, 400, 'sin serviceId, /times debe dar 400');

  const nanServiceTimes = await api(`/api/professionals/${slug}/availability/times?date=2026-09-10&serviceId=nope`);
  assert.equal(nanServiceTimes.status, 400, 'serviceId no numérico en /times debe dar 400');
});
