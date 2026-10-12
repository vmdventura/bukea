const { test, after } = require('./test-shim');
const assert = require('node:assert/strict');
const { api, db, createUser, createBusiness, cleanup } = require('./helpers');

after(cleanup);

test('VER-01: negocio nuevo sin logo/correo/teléfono verificados queda oculto del marketplace hasta completar los tres', async () => {
  const owner = await createUser('ver1owner');
  const biz = await createBusiness(owner);
  const slug = biz.body.slug;
  const professionalId = (await api(`/api/professionals/${slug}`)).body.id;

  let list = await api('/api/professionals');
  assert.ok(!list.body.some(p => p.slug === slug), 'negocio nuevo sin verificar no debe listarse');

  // El perfil directo (no el marketplace) sigue vivo igual — oculto del
  // marketplace no significa privado.
  const direct = await api(`/api/professionals/${slug}`);
  assert.equal(direct.status, 200, 'el link directo del perfil funciona aunque esté oculto del marketplace');

  // Completa correo y teléfono, pero todavía sin logo.
  await db().query(
    'UPDATE users SET email_verified_at = NOW(), phone_verified_at = NOW() WHERE id = ?',
    [owner.id]
  );
  list = await api('/api/professionals');
  assert.ok(!list.body.some(p => p.slug === slug), 'sin logo todavía debe seguir oculto aunque correo/teléfono ya estén');

  // Completa el logo (directo en la fila, sin subir archivo real).
  await db().query('UPDATE professionals SET logo_path = ? WHERE id = ?', ['test-logo.jpg', professionalId]);
  list = await api('/api/professionals');
  assert.ok(list.body.some(p => p.slug === slug), 'con logo + correo + teléfono verificados ya debe listarse');
});

test('VER-02: negocio exento (verification_required=0) sigue visible aunque el dueño no esté verificado', async () => {
  const owner = await createUser('ver2owner');
  const biz = await createBusiness(owner);
  const slug = biz.body.slug;
  const professionalId = (await api(`/api/professionals/${slug}`)).body.id;

  await db().query('UPDATE professionals SET verification_required = 0 WHERE id = ?', [professionalId]);

  let list = await api('/api/professionals');
  assert.ok(list.body.some(p => p.slug === slug), 'negocio exento debe listarse sin logo ni verificación');

  // Editar el perfil del negocio (sin tocar verification_required) no debe
  // ocultarlo retroactivamente.
  await api(`/api/professionals/${slug}/profile`, {
    method: 'PUT', headers: { Authorization: 'Bearer ' + owner.token },
    body: { name: owner.name, businessName: 'Negocio exento editado', neighborhood: 'Naco', category: 'barberia' },
  });
  list = await api('/api/professionals');
  assert.ok(list.body.some(p => p.slug === slug), 'sigue exento después de editar el perfil, no se re-evalúa el requisito');
});
