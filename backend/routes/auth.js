const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const whatsapp = require('../lib/whatsapp');

const router = express.Router();

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

module.exports = router;
