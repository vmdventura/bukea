const pool = require('../db/pool');

// Contrato aditivo de sesión (2026-09-08): además de los campos que ya
// consumían los builds instalados (token, name, phone, email, emailVerified,
// accountType, [phoneVerified]), añade `id`, `capabilities` y `businesses`
// para que el frontend decida si mostrar el selector Cliente/Mi negocio sin
// tener que fiarse de `accountType` (que solo se fija al crear la cuenta y
// nunca se actualiza al crear un negocio después).
//
// `capabilities.manageBusiness` es la fuente de verdad de "este usuario
// tiene un negocio propio" — se calcula de `professionals.owner_user_id`,
// no de `accountType`. Un negocio oculto (`hidden_at`, p.ej. tras eliminar
// la cuenta o por moderación) sigue contando: el dueño debe poder seguir
// administrándolo aunque el marketplace no lo muestre.
async function loadBusinesses(userId) {
  const [rows] = await pool.query(
    `SELECT id, slug, name AS businessName, hidden_at, verification_required
       FROM professionals WHERE owner_user_id = ? ORDER BY id`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.businessName,
    hidden: Boolean(r.hidden_at),
    verificationRequired: Boolean(r.verification_required),
  }));
}

// Arma el payload de sesión a partir de una fila de `users` ya cargada
// (login por PIN/OTP/reset) o de un id (session GET / social login, que no
// siempre traen la fila completa). `token` es opcional: `GET /session` no
// lo repite porque el cliente ya lo tiene.
async function buildSessionPayload(user, { token } = {}) {
  const businesses = await loadBusinesses(user.id);
  return {
    ...(token ? { token } : {}),
    id: user.id,
    name: user.name,
    phone: user.phone || null,
    email: user.email || null,
    emailVerified: Boolean(user.email_verified_at ?? user.emailVerified),
    phoneVerified: Boolean(user.phone_verified_at ?? user.phoneVerified),
    accountType: user.account_type || user.accountType || 'client',
    capabilities: {
      bookAsClient: true,
      manageBusiness: businesses.length > 0,
    },
    businesses,
  };
}

module.exports = { buildSessionPayload, loadBusinesses };
