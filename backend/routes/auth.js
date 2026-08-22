const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const whatsapp = require('../lib/whatsapp');
const oauth = require('../lib/oauth');

const router = express.Router();

async function issueToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, userId]);
  return token;
}

// Busca una cuenta por proveedor social (o por email, para no duplicar la
// cuenta de alguien que ya se había registrado con teléfono+PIN) y la crea
// si no existe. Devuelve la misma forma de sesión que login/register.
async function upsertSocialUser({ column, sub, email, name }) {
  let [rows] = await pool.query(`SELECT * FROM users WHERE ${column} = ?`, [sub]);
  let user = rows[0];

  if (!user && email) {
    [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    user = rows[0];
  }

  if (user) {
    await pool.query(
      `UPDATE users SET ${column} = COALESCE(${column}, ?), email = COALESCE(email, ?) WHERE id = ?`,
      [sub, email, user.id]
    );
  } else {
    const [result] = await pool.query(
      `INSERT INTO users (phone, name, email, ${column}) VALUES (NULL, ?, ?, ?)`,
      [name || 'Cliente Bukea', email, sub]
    );
    user = { id: result.insertId, name: name || 'Cliente Bukea', phone: null, email };
  }

  const token = await issueToken(user.id);
  return { token, name: user.name, phone: user.phone, email: user.email || email || null };
}

const PHONE_RE = /^(809|829|849)\d{7}$/;

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
}

function hashPin(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString('hex');
}

router.post('/check', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Ingresa un número dominicano válido (809, 829 u 849)' });
  }
  const [rows] = await pool.query('SELECT name FROM users WHERE phone = ?', [phone]);
  res.json({ exists: rows.length > 0, name: rows[0] ? rows[0].name : null });
});

router.post('/register', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const name = (req.body.name || '').trim();
  const pin = String(req.body.pin || '');

  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Ingresa un número dominicano válido (809, 829 u 849)' });
  }
  if (!name) return res.status(400).json({ error: 'Dinos tu nombre' });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });

  const [existing] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Ese número ya tiene cuenta — inicia sesión con tu PIN' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query(
    'INSERT INTO users (phone, name, pin_salt, pin_hash, token) VALUES (?, ?, ?, ?, ?)',
    [phone, name, salt, hashPin(pin, salt), token]
  );
  res.status(201).json({ token, name, phone });
});

router.post('/login', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const pin = String(req.body.pin || '');

  const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Ese número no tiene cuenta todavía' });
  if (hashPin(pin, user.pin_salt) !== user.pin_hash) {
    return res.status(401).json({ error: 'PIN incorrecto' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);
  res.json({ token, name: user.name, phone: user.phone });
});

/* ===== Verificación por WhatsApp (OTP) =====
   Activa solo cuando las variables WHATSAPP_* están configuradas en cPanel.
   Mientras tanto, /otp/send responde 503 y el frontend sigue usando el PIN. */

router.get('/otp/status', (req, res) => {
  res.json({ enabled: whatsapp.isConfigured() });
});

router.post('/otp/send', async (req, res) => {
  if (!whatsapp.isConfigured()) {
    return res.status(503).json({ error: 'La verificación por WhatsApp aún no está activa' });
  }
  const phone = normalizePhone(req.body.phone);
  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Ingresa un número dominicano válido (809, 829 u 849)' });
  }

  // Máximo 3 códigos por número cada 10 minutos (anti-abuso)
  const [recent] = await pool.query(
    'SELECT COUNT(*) AS n FROM auth_codes WHERE phone = ? AND created_at > NOW() - INTERVAL 10 MINUTE',
    [phone]
  );
  if (recent[0].n >= 3) {
    return res.status(429).json({ error: 'Demasiados intentos — espera unos minutos' });
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString('hex');
  await pool.query(
    'INSERT INTO auth_codes (phone, code_hash, code_salt, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL 5 MINUTE)',
    [phone, hashPin(code, salt), salt]
  );

  try {
    await whatsapp.sendAuthCode(phone, code);
  } catch (err) {
    console.error('Error enviando OTP por WhatsApp:', err.message);
    return res.status(502).json({ error: 'No se pudo enviar el código por WhatsApp — intenta de nuevo' });
  }
  res.json({ sent: true });
});

router.post('/otp/verify', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || '');
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'El código es de 6 dígitos' });
  }

  const [rows] = await pool.query(
    'SELECT * FROM auth_codes WHERE phone = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [phone]
  );
  const record = rows[0];
  if (!record) return res.status(404).json({ error: 'Código vencido — pide uno nuevo' });
  if (record.attempts >= 5) return res.status(429).json({ error: 'Demasiados intentos — pide un código nuevo' });

  if (hashPin(code, record.code_salt) !== record.code_hash) {
    await pool.query('UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return res.status(401).json({ error: 'Código incorrecto' });
  }

  await pool.query('DELETE FROM auth_codes WHERE phone = ?', [phone]);

  // Si el usuario existe, inicia sesión; si no, el frontend pedirá el nombre y registrará.
  const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  if (users.length > 0) {
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, users[0].id]);
    return res.json({ verified: true, exists: true, token, name: users[0].name, phone });
  }
  res.json({ verified: true, exists: false, phone });
});

/* ===== Login con Google y Apple =====
   El frontend verifica la identidad del proveedor y nos manda el idToken;
   aquí se valida la firma contra Google/Apple antes de crear la sesión.
   /providers le dice al frontend si ya hay credenciales configuradas
   (GOOGLE_CLIENT_ID / APPLE_CLIENT_ID) para mostrar los botones activos
   o "Próximamente" mientras Víctor las da de alta. */

router.get('/providers', (req, res) => {
  res.json({ google: oauth.isGoogleConfigured(), apple: oauth.isAppleConfigured() });
});

router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Falta el idToken de Google' });
  try {
    const payload = await oauth.verifyGoogleIdToken(idToken);
    const session = await upsertSocialUser({ column: 'google_sub', ...payload });
    res.json(session);
  } catch (err) {
    console.error('Error verificando Google:', err.message);
    res.status(401).json({ error: 'No se pudo verificar tu cuenta de Google' });
  }
});

router.post('/apple', async (req, res) => {
  const { idToken, name } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Falta el idToken de Apple' });
  try {
    const payload = await oauth.verifyAppleIdToken(idToken);
    const session = await upsertSocialUser({ column: 'apple_sub', ...payload, name: name || payload.name });
    res.json(session);
  } catch (err) {
    console.error('Error verificando Apple:', err.message);
    res.status(401).json({ error: 'No se pudo verificar tu cuenta de Apple' });
  }
});

module.exports = router;
