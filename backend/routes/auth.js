const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');

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

module.exports = router;
