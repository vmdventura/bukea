const pool = require('../db/pool');

// Exige un token de sesión válido (Authorization: Bearer <token>, emitido
// por /api/auth/{login,register,google,apple}) y cuelga el usuario en
// req.user. Compartido por professionals.js y bookings.js.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar' });

  const [rows] = await pool.query('SELECT id, name, phone, email, disabled_at FROM users WHERE token = ?', [token]);
  if (!rows[0]) return res.status(401).json({ error: 'Tu sesión expiró — inicia sesión de nuevo' });
  if (rows[0].disabled_at) return res.status(403).json({ error: 'Esta cuenta está desactivada' });

  req.user = rows[0];
  next();
}

// Exige que el token de sesión pertenezca a una cuenta con role = 'admin'
// (asignado a mano por SQL, nunca desde la app — ver db/make-admin.js).
// Responde 404, no 401/403, para que la ruta del panel no delate su
// existencia a quien no tiene acceso.
async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(404).end();

  const [rows] = await pool.query('SELECT id, name, phone, email, role FROM users WHERE token = ?', [token]);
  const user = rows[0];
  if (!user || user.role !== 'admin') return res.status(404).end();

  req.admin = user;
  next();
}

module.exports = { requireAuth, requireAdmin };
