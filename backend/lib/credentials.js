// Helpers de teléfono/PIN compartidos entre el login público (routes/auth.js)
// y el login del panel de administración (routes/admin.js) — antes vivían
// duplicados dentro de auth.js.
const crypto = require('crypto');

const PHONE_RE = /^(809|829|849)\d{7}$/;

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
}

function hashPin(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString('hex');
}

module.exports = { PHONE_RE, normalizePhone, hashPin };
