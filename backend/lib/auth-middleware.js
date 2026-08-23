const pool = require('../db/pool');

// Exige un token de sesión válido (Authorization: Bearer <token>, emitido
// por /api/auth/{login,register,google,apple}) y cuelga el usuario en
// req.user. Compartido por professionals.js y bookings.js.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar' });

  const [rows] = await pool.query('SELECT id, name, phone, email FROM users WHERE token = ?', [token]);
  if (!rows[0]) return res.status(401).json({ error: 'Tu sesión expiró — inicia sesión de nuevo' });

  req.user = rows[0];
  next();
}

module.exports = { requireAuth };
