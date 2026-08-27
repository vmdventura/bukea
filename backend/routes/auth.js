const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const whatsapp = require('../lib/whatsapp');
const mailer = require('../lib/mailer');
const oauth = require('../lib/oauth');
const { PHONE_RE, normalizePhone, hashPin } = require('../lib/credentials');
const rateLimit = require('../lib/rate-limit');
const { requireAuth } = require('../lib/auth-middleware');

const router = express.Router();

// Claves de bloqueo del login: por teléfono (frena la fuerza bruta sobre
// una cuenta concreta) y por IP (frena un barrido sobre muchas cuentas).
function loginLimitKeys(req, phone) {
  return [
    { key: 'pin:' + phone, max: 5, blockMs: 15 * 60 * 1000 },
    { key: 'pin-ip:' + req.ip, max: 20, blockMs: 30 * 60 * 1000 },
  ];
}

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

  if (user && user.disabled_at) {
    throw new Error('disabled');
  }

  if (user) {
    // El correo que da Google/Apple ya viene verificado por ellos — si la
    // cuenta no tenía email_verified_at (p.ej. nació por teléfono+PIN y
    // ahora vincula Google), se marca verificada en el mismo paso.
    await pool.query(
      `UPDATE users SET ${column} = COALESCE(${column}, ?), email = COALESCE(email, ?),
         email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?`,
      [sub, email, user.id]
    );
  } else {
    const [result] = await pool.query(
      `INSERT INTO users (phone, name, email, email_verified_at, ${column}) VALUES (NULL, ?, ?, NOW(), ?)`,
      [name || 'Cliente Bukea', email, sub]
    );
    user = { id: result.insertId, name: name || 'Cliente Bukea', phone: null, email };
  }

  const token = await issueToken(user.id);
  return { token, name: user.name, phone: user.phone, email: user.email || email || null, emailVerified: true };
}

router.post('/check', async (req, res) => {
  // Límite por IP: frena a quien use este endpoint para averiguar qué
  // números tienen cuenta en Bukea (enumeración masiva).
  const wait = rateLimit.hit([{ key: 'check-ip:' + req.ip, max: 30, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 }]);
  if (wait) return res.status(429).json({ error: rateLimit.waitMessage(wait) });

  const phone = normalizePhone(req.body.phone);
  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Ingresa un número dominicano válido (809, 829 u 849)' });
  }
  const [rows] = await pool.query('SELECT name FROM users WHERE phone = ?', [phone]);
  res.json({ exists: rows.length > 0, name: rows[0] ? rows[0].name : null });
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  // Límite por IP: frena la creación masiva de cuentas falsas.
  const wait = rateLimit.hit([{ key: 'reg-ip:' + req.ip, max: 10, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 }]);
  if (wait) return res.status(429).json({ error: rateLimit.waitMessage(wait) });

  const phone = normalizePhone(req.body.phone);
  const name = (req.body.name || '').trim();
  const pin = String(req.body.pin || '');
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Ingresa un número dominicano válido (809, 829 u 849)' });
  }
  if (!name) return res.status(400).json({ error: 'Dinos tu nombre' });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });
  // El correo pasó a ser obligatorio (2026-08-27, a pedido de Víctor): toda
  // cuenta nueva debe verificarlo antes de poder usar la app de verdad —
  // ver GET /verify-email más abajo. Las cuentas ya existentes (creadas
  // antes de este cambio) no se ven afectadas, ver el backfill en db/init.js.
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Ingresa un correo válido, lo necesitamos para verificar tu cuenta' });
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Ese número ya tiene cuenta, inicia sesión con tu PIN' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const token = crypto.randomBytes(24).toString('hex');
  const [result] = await pool.query(
    'INSERT INTO users (phone, name, email, pin_salt, pin_hash, token) VALUES (?, ?, ?, ?, ?, ?)',
    [phone, name, email, salt, hashPin(pin, salt), token]
  );
  await sendVerificationEmail(req, result.insertId, email, name);
  res.status(201).json({ token, name, phone, email, emailVerified: false });
});

// Enlace de verificación (2026-08-27): token de un solo uso, vence en 24h.
// Falla en silencio si el correo no se pudo enviar (SMTP caído, etc.) — no
// tiene sentido tumbar el registro completo por eso; el usuario siempre
// puede pedir que se lo reenvíen desde POST /resend-verification.
async function sendVerificationEmail(req, userId, email, name) {
  await pool.query('DELETE FROM email_verifications WHERE user_id = ?', [userId]);
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  const verifyUrl = `${req.protocol}://${req.get('host')}${req.baseUrlPrefix || ''}/api/auth/verify-email?token=${token}`;
  try {
    await mailer.sendEmailVerification(email, name, verifyUrl);
  } catch (err) {
    console.error('No se pudo enviar el correo de verificación:', err.message);
  }
}

const VERIFY_PAGE_STYLE = `<style>
  body { font-family: -apple-system, "Segoe UI", sans-serif; background: #f2f7f6; color: #16302e; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
  .card { background: #fff; border-radius: 20px; padding: 2.4rem 2rem; max-width: 380px; box-shadow: 0 14px 34px rgba(15,40,38,0.12); }
  h1 { font-size: 1.3rem; margin: 0 0 0.6rem; }
  p { color: #44647a; font-size: 0.95rem; line-height: 1.5; margin: 0; }
  .icon { width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
  .ok .icon { background: #e3f4ee; color: #0f8583; }
  .err .icon { background: #fbe3e0; color: #b3261e; }
</style>`;

// GET porque se abre desde el enlace de un correo (Safari/Mail), no desde
// la app — nunca requiere sesión.
router.get('/verify-email', async (req, res) => {
  const token = String(req.query.token || '');
  const [rows] = await pool.query(
    'SELECT user_id, expires_at FROM email_verifications WHERE token = ?', [token]
  );
  const record = rows[0];
  if (!record || new Date(record.expires_at) < new Date()) {
    return res.status(400).type('html').send(`${VERIFY_PAGE_STYLE}<div class="card err"><div class="icon">✕</div><h1>Enlace vencido</h1><p>Este enlace ya no es válido. Vuelve a la app y toca "Reenviar correo" para pedir uno nuevo.</p></div>`);
  }
  await pool.query('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [record.user_id]);
  await pool.query('DELETE FROM email_verifications WHERE user_id = ?', [record.user_id]);
  res.type('html').send(`${VERIFY_PAGE_STYLE}<div class="card ok"><div class="icon">✓</div><h1>¡Correo verificado!</h1><p>Ya puedes volver a la app Bukea y seguir donde te quedaste.</p></div>`);
});

router.post('/resend-verification', requireAuth, async (req, res) => {
  if (req.user.email_verified_at) return res.json({ sent: false, alreadyVerified: true });
  if (!req.user.email) return res.status(400).json({ error: 'Tu cuenta no tiene un correo registrado' });
  const wait = rateLimit.check([{ key: 'verify-resend:' + req.user.id }]);
  if (wait > 0) return res.status(429).json({ error: rateLimit.waitMessage(wait) });
  rateLimit.hit([{ key: 'verify-resend:' + req.user.id, max: 3, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 }]);
  await sendVerificationEmail(req, req.user.id, req.user.email, req.user.name);
  res.json({ sent: true });
});

router.get('/session', requireAuth, (req, res) => {
  res.json({
    id: req.user.id, name: req.user.name, phone: req.user.phone, email: req.user.email,
    emailVerified: Boolean(req.user.email_verified_at),
  });
});

router.post('/login', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const pin = String(req.body.pin || '');

  const limits = loginLimitKeys(req, phone);
  const blocked = rateLimit.check(limits);
  if (blocked) return res.status(429).json({ error: rateLimit.waitMessage(blocked) });

  const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  const user = rows[0];
  if (!user) {
    const wait = rateLimit.hit(limits);
    if (wait) return res.status(429).json({ error: rateLimit.waitMessage(wait) });
    return res.status(404).json({ error: 'Ese número no tiene cuenta todavía' });
  }
  if (hashPin(pin, user.pin_salt) !== user.pin_hash) {
    const wait = rateLimit.hit(limits);
    if (wait) return res.status(429).json({ error: rateLimit.waitMessage(wait) });
    return res.status(401).json({ error: 'PIN incorrecto' });
  }
  rateLimit.clear(['pin:' + phone]);
  if (user.disabled_at) {
    return res.status(403).json({ error: 'Esta cuenta está desactivada. Escríbenos si crees que es un error' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);
  res.json({ token, name: user.name, phone: user.phone, email: user.email, emailVerified: Boolean(user.email_verified_at) });
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
    return res.status(429).json({ error: 'Demasiados intentos, espera unos minutos' });
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
    return res.status(502).json({ error: 'No se pudo enviar el código por WhatsApp, intenta de nuevo' });
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
  if (!record) return res.status(404).json({ error: 'Código vencido, pide uno nuevo' });
  if (record.attempts >= 5) return res.status(429).json({ error: 'Demasiados intentos, pide un código nuevo' });

  if (hashPin(code, record.code_salt) !== record.code_hash) {
    await pool.query('UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return res.status(401).json({ error: 'Código incorrecto' });
  }

  await pool.query('DELETE FROM auth_codes WHERE phone = ?', [phone]);

  // Si el usuario existe, inicia sesión; si no, el frontend pedirá el nombre y registrará.
  const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  if (users.length > 0 && users[0].disabled_at) {
    return res.status(403).json({ error: 'Esta cuenta está desactivada. Escríbenos si crees que es un error' });
  }
  if (users.length > 0) {
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, users[0].id]);
    return res.json({ verified: true, exists: true, token, name: users[0].name, phone, email: users[0].email, emailVerified: Boolean(users[0].email_verified_at) });
  }
  res.json({ verified: true, exists: false, phone });
});

/* ===== Olvidé mi PIN (2026-08-23) =====
   Recuperación por email en vez de WhatsApp: mismo motivo que llevó a
   agregar el email al registro — es gratis y no depende de tener la API de
   WhatsApp Business activa. Solo funciona para cuentas que dieron su email
   al registrarse (o que entraron alguna vez con Google/Apple). */

router.post('/forgot-pin', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Ingresa un correo válido' });
  }
  if (!mailer.isConfigured()) {
    return res.status(503).json({ error: 'La recuperación por correo aún no está activa' });
  }

  const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    // No revela si el correo existe o no — evita que alguien use este
    // endpoint para averiguar qué correos tienen cuenta en Bukea.
    return res.json({ sent: true });
  }

  // Máximo 3 códigos por correo cada 10 minutos (anti-abuso, igual que el OTP de WhatsApp)
  const [recent] = await pool.query(
    'SELECT COUNT(*) AS n FROM auth_codes WHERE email = ? AND created_at > NOW() - INTERVAL 10 MINUTE',
    [email]
  );
  if (recent[0].n >= 3) {
    return res.status(429).json({ error: 'Demasiados intentos, espera unos minutos' });
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString('hex');
  await pool.query(
    'INSERT INTO auth_codes (email, code_hash, code_salt, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL 15 MINUTE)',
    [email, hashPin(code, salt), salt]
  );

  try {
    await mailer.sendPinResetCode(email, code);
  } catch (err) {
    console.error('Error enviando código de recuperación:', err.message);
    return res.status(502).json({ error: 'No se pudo enviar el correo, intenta de nuevo' });
  }
  res.json({ sent: true });
});

router.post('/reset-pin', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '');
  const newPin = String(req.body.newPin || '');

  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'El código es de 6 dígitos' });
  if (!/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });

  const [rows] = await pool.query(
    'SELECT * FROM auth_codes WHERE email = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [email]
  );
  const record = rows[0];
  if (!record) return res.status(404).json({ error: 'Código vencido, pide uno nuevo' });
  if (record.attempts >= 5) return res.status(429).json({ error: 'Demasiados intentos, pide un código nuevo' });

  if (hashPin(code, record.code_salt) !== record.code_hash) {
    await pool.query('UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return res.status(401).json({ error: 'Código incorrecto' });
  }

  const [users] = await pool.query('SELECT id, name, phone FROM users WHERE email = ?', [email]);
  const user = users[0];
  if (!user) return res.status(404).json({ error: 'No encontramos esa cuenta' });

  await pool.query('DELETE FROM auth_codes WHERE email = ?', [email]);

  const salt = crypto.randomBytes(16).toString('hex');
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query(
    'UPDATE users SET pin_salt = ?, pin_hash = ?, token = ? WHERE id = ?',
    [salt, hashPin(newPin, salt), token, user.id]
  );
  res.json({ token, name: user.name, phone: user.phone });
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
    if (err.message === 'disabled') {
      return res.status(403).json({ error: 'Esta cuenta está desactivada. Escríbenos si crees que es un error' });
    }
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
    if (err.message === 'disabled') {
      return res.status(403).json({ error: 'Esta cuenta está desactivada. Escríbenos si crees que es un error' });
    }
    console.error('Error verificando Apple:', err.message);
    res.status(401).json({ error: 'No se pudo verificar tu cuenta de Apple' });
  }
});

/* ===== Eliminar mi cuenta (2026-08-25) =====
   Requisito del App Store (regla 5.1.1): toda app con registro debe
   permitir eliminar la cuenta desde adentro. Se anonimiza la fila en vez
   de borrarla — las reservas históricas de los negocios no pierden su
   referencia, pero la cuenta queda irreconocible e inaccesible. */

router.post('/delete-account', requireAuth, async (req, res) => {
  // Si la cuenta es dueña de un negocio, el negocio se oculta del
  // marketplace en el mismo acto (queda recuperable solo vía admin).
  await pool.query(
    'UPDATE professionals SET hidden_at = NOW() WHERE owner_user_id = ? AND hidden_at IS NULL',
    [req.user.id]
  );
  await pool.query(
    `UPDATE users SET name = 'Cuenta eliminada', phone = NULL, email = NULL,
       google_sub = NULL, apple_sub = NULL, pin_hash = NULL, pin_salt = NULL,
       token = NULL, disabled_at = NOW()
     WHERE id = ?`,
    [req.user.id]
  );
  res.json({ deleted: true });
});

module.exports = router;
