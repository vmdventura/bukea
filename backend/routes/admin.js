// API del panel de administración general (/admin) — Fase 1 (dashboard,
// usuarios, negocios, reservas) + Fase 2 (moderación, métricas,
// comunicación, configuración) del concepto. Rutas propias, nunca reusa los
// endpoints del dueño de negocio (professionals.js/bookings.js), para no
// abrir el mismo hueco de seguridad que encontró docs/TEST-FRESHA.md.
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../db/pool');
const { requireAdmin } = require('../lib/auth-middleware');
const { normalizePhone, hashPin } = require('../lib/credentials');
const { insertDefaultHours } = require('../lib/hours');
const { geocodeNeighborhood } = require('../lib/geocode');
const { receiptUrl, RECEIPTS_DIR } = require('../lib/uploads');
const whatsapp = require('../lib/whatsapp');
const mailer = require('../lib/mailer');
const { getSettings, updateSettings } = require('../lib/settings');
const rateLimit = require('../lib/rate-limit');

const router = express.Router();

// CSV simple para exportar tablas — cubre las comas y comillas de nombres y
// direcciones reales, no pretende ser una librería completa.
function toCsv(rows, columns) {
  const escapeCell = v => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = columns.map(c => c.label).join(',');
  const body = rows.map(row => columns.map(c => escapeCell(c.value(row))).join(',')).join('\n');
  return header + '\n' + body;
}

function sendCsv(res, filename, csv) {
  res.type('text/csv').attachment(filename).send(csv);
}

const VALID_CATEGORIES = ['barberia', 'unas', 'salon', 'maquillaje', 'cejas-mua', 'pilates', 'entrenador', 'peluqueria-canina', 'spa'];

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// ===== Login del panel =====
// Mismo teléfono+PIN que la cuenta normal de Bukea, pero solo emite sesión
// si role = 'admin'. Un teléfono sin cuenta, con PIN incorrecto o sin el
// rol da exactamente el mismo error — el panel no delata cuál fue el caso.
router.post('/login', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const pin = String(req.body.pin || '');

  // El panel es la puerta más sensible: límites más estrictos que el login
  // normal, por teléfono y por IP.
  const limits = [
    { key: 'admin:' + phone, max: 5, blockMs: 30 * 60 * 1000 },
    { key: 'admin-ip:' + req.ip, max: 10, blockMs: 60 * 60 * 1000 },
  ];
  const blocked = rateLimit.check(limits);
  if (blocked) return res.status(429).json({ error: rateLimit.waitMessage(blocked) });

  const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  const user = rows[0];
  const denied = !user || user.role !== 'admin' || !user.pin_hash || hashPin(pin, user.pin_salt) !== user.pin_hash;
  if (denied) {
    const wait = rateLimit.hit(limits);
    if (wait) return res.status(429).json({ error: rateLimit.waitMessage(wait) });
    return res.status(404).json({ error: 'No encontramos acceso con esos datos' });
  }
  rateLimit.clear(['admin:' + phone]);

  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);
  res.json({ token, name: user.name });
});

router.use(requireAdmin);

router.get('/me', (req, res) => {
  res.json({ id: req.admin.id, name: req.admin.name });
});

// ===== Dashboard =====
router.get('/dashboard', async (req, res) => {
  const [[userCounts]] = await pool.query(
    `SELECT COUNT(*) AS total, COUNT(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 END) AS thisWeek
     FROM users WHERE role != 'admin'`
  );
  const [[bizCounts]] = await pool.query(
    `SELECT COUNT(*) AS total, COUNT(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 END) AS thisWeek
     FROM professionals WHERE hidden_at IS NULL`
  );
  const [[bookingStats]] = await pool.query(
    `SELECT
       COUNT(CASE WHEN b.status = 'confirmed' AND b.appointment_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) AS monthCount,
       COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.appointment_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN s.price_cents END), 0) AS monthCents
     FROM bookings b JOIN services s ON s.id = b.service_id`
  );
  const [dailyRows] = await pool.query(
    `SELECT DATE(appointment_at) AS d, COUNT(*) AS n FROM bookings
     WHERE status = 'confirmed' AND appointment_at >= CURDATE() - INTERVAL 29 DAY AND appointment_at <= NOW()
     GROUP BY DATE(appointment_at) ORDER BY d`
  );
  const [noHours] = await pool.query(
    `SELECT p.id, p.name, p.business_name FROM professionals p
     LEFT JOIN professional_hours h ON h.professional_id = p.id
     WHERE h.id IS NULL AND p.hidden_at IS NULL`
  );
  const [noCoords] = await pool.query(
    `SELECT id, name, business_name FROM professionals WHERE (lat IS NULL OR lng IS NULL) AND hidden_at IS NULL`
  );
  const [recentReceipts] = await pool.query(
    `SELECT b.id, b.client_name, p.name AS professional_name, b.receipt_uploaded_at
     FROM bookings b JOIN professionals p ON p.id = b.professional_id
     WHERE b.receipt_uploaded_at >= NOW() - INTERVAL 24 HOUR
     ORDER BY b.receipt_uploaded_at DESC LIMIT 10`
  );
  const [recentBookings] = await pool.query(
    `SELECT b.id, b.client_name, b.status, b.created_at, p.name AS professional_name, s.name AS service_name
     FROM bookings b JOIN professionals p ON p.id = b.professional_id JOIN services s ON s.id = b.service_id
     ORDER BY b.created_at DESC LIMIT 8`
  );
  const [recentUsers] = await pool.query(
    `SELECT id, name, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 8`
  );

  res.json({
    kpis: {
      users: { total: userCounts.total, thisWeek: userCounts.thisWeek },
      businesses: { total: bizCounts.total, thisWeek: bizCounts.thisWeek },
      bookingsThisMonth: bookingStats.monthCount,
      volumeCentsThisMonth: Number(bookingStats.monthCents),
    },
    dailyBookings: dailyRows.map(r => ({ date: r.d, count: r.n })),
    alerts: {
      noHours: noHours.map(p => ({ id: p.id, name: p.name, businessName: p.business_name })),
      noCoords: noCoords.map(p => ({ id: p.id, name: p.name, businessName: p.business_name })),
      recentReceipts: recentReceipts.map(r => ({
        bookingId: r.id, clientName: r.client_name, professionalName: r.professional_name, uploadedAt: r.receipt_uploaded_at,
      })),
    },
    recentActivity: {
      bookings: recentBookings.map(b => ({
        id: b.id, clientName: b.client_name, professionalName: b.professional_name,
        serviceName: b.service_name, status: b.status, createdAt: b.created_at,
      })),
      users: recentUsers.map(u => ({ id: u.id, name: u.name, createdAt: u.created_at })),
    },
  });
});

// ===== Usuarios =====
router.get('/users', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const provider = req.query.provider;

  let sql = `SELECT u.id, u.name, u.phone, u.email, u.google_sub, u.apple_sub, u.pin_hash, u.created_at, u.disabled_at,
                    (SELECT COUNT(*) FROM bookings WHERE client_user_id = u.id) AS bookings_count,
                    (SELECT slug FROM professionals WHERE owner_user_id = u.id LIMIT 1) AS owns_slug
             FROM users u WHERE u.role != 'admin'`;
  const params = [];
  if (q) {
    sql += ' AND (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (provider === 'google') sql += ' AND u.google_sub IS NOT NULL';
  else if (provider === 'apple') sql += ' AND u.apple_sub IS NOT NULL';
  else if (provider === 'phone') sql += ' AND u.pin_hash IS NOT NULL';
  sql += ' ORDER BY u.created_at DESC LIMIT 200';

  const [rows] = await pool.query(sql, params);
  const users = rows.map(u => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    provider: u.google_sub ? 'google' : u.apple_sub ? 'apple' : 'phone',
    bookingsCount: u.bookings_count,
    ownsBusinessSlug: u.owns_slug,
    createdAt: u.created_at,
    disabled: Boolean(u.disabled_at),
  }));

  if (req.query.format === 'csv') {
    return sendCsv(res, 'usuarios-bukea.csv', toCsv(users, [
      { label: 'Nombre', value: r => r.name },
      { label: 'Teléfono', value: r => r.phone },
      { label: 'Email', value: r => r.email },
      { label: 'Login', value: r => r.provider },
      { label: 'Reservas', value: r => r.bookingsCount },
      { label: 'Registro', value: r => r.createdAt },
      { label: 'Estado', value: r => (r.disabled ? 'Desactivado' : 'Activo') },
    ]));
  }
  res.json(users);
});

router.get('/users/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const [bookings] = await pool.query(
    `SELECT b.id, b.status, b.appointment_at, b.created_at, p.name AS professional_name, p.slug, s.name AS service_name
     FROM bookings b JOIN professionals p ON p.id = b.professional_id JOIN services s ON s.id = b.service_id
     WHERE b.client_user_id = ? ORDER BY COALESCE(b.appointment_at, b.created_at) DESC LIMIT 50`,
    [user.id]
  );
  const [owned] = await pool.query(
    'SELECT slug, name, business_name FROM professionals WHERE owner_user_id = ?',
    [user.id]
  );

  res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    provider: user.google_sub ? 'google' : user.apple_sub ? 'apple' : 'phone',
    createdAt: user.created_at,
    disabled: Boolean(user.disabled_at),
    bookings: bookings.map(b => ({
      id: b.id, status: b.status, appointmentAt: b.appointment_at, createdAt: b.created_at,
      professionalName: b.professional_name, professionalSlug: b.slug, serviceName: b.service_name,
    })),
    ownedBusinesses: owned.map(p => ({ slug: p.slug, name: p.name, businessName: p.business_name })),
  });
});

router.patch('/users/:id', async (req, res) => {
  const fields = [];
  const params = [];
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) return res.status(400).json({ error: 'El nombre no puede quedar vacío' });
    fields.push('name = ?');
    params.push(name);
  }
  if (req.body.email !== undefined) {
    fields.push('email = ?');
    params.push(String(req.body.email).trim().toLowerCase() || null);
  }
  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  params.push(req.params.id);

  const [result] = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ saved: true });
});

router.post('/users/:id/reset-pin', async (req, res) => {
  const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

  const newPin = String(crypto.randomInt(1000, 10000));
  const salt = crypto.randomBytes(16).toString('hex');
  // token = NULL cierra cualquier sesión abierta con el PIN viejo.
  await pool.query('UPDATE users SET pin_salt = ?, pin_hash = ?, token = NULL WHERE id = ?', [salt, hashPin(newPin, salt), req.params.id]);
  res.json({ newPin });
});

router.post('/users/:id/toggle-disabled', async (req, res) => {
  const [rows] = await pool.query('SELECT disabled_at FROM users WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

  const nowDisabled = !rows[0].disabled_at;
  await pool.query(
    'UPDATE users SET disabled_at = ?, token = NULL WHERE id = ?',
    [nowDisabled ? new Date() : null, req.params.id]
  );
  res.json({ disabled: nowDisabled });
});

// ===== Negocios =====
router.get('/businesses', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = req.query.category;
  const filter = req.query.filter;

  let sql = `SELECT p.id, p.slug, p.name, p.business_name, p.category, p.neighborhood, p.rating, p.reviews_count,
                    p.owner_user_id, p.lat, p.lng, p.hidden_at, p.created_at,
                    (SELECT COUNT(*) FROM professional_hours h WHERE h.professional_id = p.id) AS hours_count,
                    (SELECT COUNT(*) FROM bookings b WHERE b.professional_id = p.id AND b.status = 'confirmed'
                       AND b.appointment_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS bookings_this_month
             FROM professionals p WHERE 1=1`;
  const params = [];
  if (q) {
    sql += ' AND (p.name LIKE ? OR p.business_name LIKE ? OR p.neighborhood LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (category) { sql += ' AND p.category = ?'; params.push(category); }
  if (filter === 'no-owner') sql += ' AND p.owner_user_id IS NULL';
  else if (filter === 'no-hours') sql += ' AND NOT EXISTS (SELECT 1 FROM professional_hours h WHERE h.professional_id = p.id)';
  else if (filter === 'no-coords') sql += ' AND (p.lat IS NULL OR p.lng IS NULL)';
  else if (filter === 'hidden') sql += ' AND p.hidden_at IS NOT NULL';
  sql += ' ORDER BY p.created_at DESC LIMIT 200';

  const [rows] = await pool.query(sql, params);
  const businesses = rows.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    businessName: p.business_name,
    category: p.category,
    neighborhood: p.neighborhood,
    rating: Number(p.rating),
    reviewsCount: p.reviews_count,
    hasOwner: p.owner_user_id !== null,
    hasHours: p.hours_count > 0,
    hasCoords: p.lat !== null && p.lng !== null,
    hidden: Boolean(p.hidden_at),
    bookingsThisMonth: p.bookings_this_month,
    createdAt: p.created_at,
  }));

  if (req.query.format === 'csv') {
    return sendCsv(res, 'negocios-bukea.csv', toCsv(businesses, [
      { label: 'Negocio', value: r => r.businessName },
      { label: 'Profesional', value: r => r.name },
      { label: 'Categoría', value: r => r.category },
      { label: 'Sector', value: r => r.neighborhood },
      { label: 'Reservas del mes', value: r => r.bookingsThisMonth },
      { label: 'Rating', value: r => r.rating },
      { label: 'Reseñas', value: r => r.reviewsCount },
      { label: 'Tiene dueño', value: r => (r.hasOwner ? 'Sí' : 'No') },
      { label: 'Oculto', value: r => (r.hidden ? 'Sí' : 'No') },
      { label: 'Registro', value: r => r.createdAt },
    ]));
  }
  res.json(businesses);
});

router.post('/businesses', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const businessName = String(req.body.businessName || '').trim();
  const neighborhood = String(req.body.neighborhood || '').trim();
  const category = req.body.category;

  if (!name || !businessName || !neighborhood || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }

  let ownerId = null;
  if (req.body.ownerPhone) {
    const phone = normalizePhone(req.body.ownerPhone);
    const [ownerRows] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (!ownerRows[0]) return res.status(404).json({ error: 'No encontramos ninguna cuenta con ese teléfono para el titular' });
    ownerId = ownerRows[0].id;
  }

  let slug = slugify(name) || 'negocio';
  const [taken] = await pool.query('SELECT slug FROM professionals WHERE slug LIKE ?', [slug + '%']);
  if (taken.some(r => r.slug === slug)) {
    let n = 2;
    while (taken.some(r => r.slug === slug + '-' + n)) n++;
    slug = slug + '-' + n;
  }

  const [result] = await pool.query(
    `INSERT INTO professionals (slug, category, name, business_name, neighborhood, rating, reviews_count, accepts_whatsapp, accepts_cash, owner_user_id)
     VALUES (?, ?, ?, ?, ?, 0, 0, 1, 1, ?)`,
    [slug, category, name, businessName, neighborhood, ownerId]
  );
  await insertDefaultHours(result.insertId);

  geocodeNeighborhood(neighborhood).then(point => {
    if (point) {
      pool.query('UPDATE professionals SET lat = ?, lng = ? WHERE id = ?', [point.lat, point.lng, result.insertId])
        .catch(err => console.error('No se pudo guardar la geocodificación:', err.message));
    }
  });

  res.status(201).json({ id: result.insertId, slug });
});

router.get('/businesses/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM professionals WHERE id = ?', [req.params.id]);
  const p = rows[0];
  if (!p) return res.status(404).json({ error: 'Negocio no encontrado' });

  const [services] = await pool.query('SELECT id, name, duration_min, price_cents FROM services WHERE professional_id = ? ORDER BY id', [p.id]);
  const [hours] = await pool.query('SELECT weekday, start_time, end_time FROM professional_hours WHERE professional_id = ? ORDER BY weekday', [p.id]);
  const [collaborators] = await pool.query('SELECT id, name, role FROM collaborators WHERE professional_id = ? ORDER BY id', [p.id]);
  const [bankAccounts] = await pool.query(
    'SELECT id, bank_name, account_type, account_number, account_holder, cedula_rnc FROM professional_bank_accounts WHERE professional_id = ?',
    [p.id]
  );

  let owner = null;
  if (p.owner_user_id) {
    const [ownerRows] = await pool.query('SELECT id, name, phone, email FROM users WHERE id = ?', [p.owner_user_id]);
    owner = ownerRows[0] || null;
  }

  res.json({
    id: p.id,
    slug: p.slug,
    name: p.name,
    businessName: p.business_name,
    category: p.category,
    neighborhood: p.neighborhood,
    rating: Number(p.rating),
    reviewsCount: p.reviews_count,
    acceptsWhatsapp: Boolean(p.accepts_whatsapp),
    acceptsCash: Boolean(p.accepts_cash),
    lat: p.lat !== null ? Number(p.lat) : null,
    lng: p.lng !== null ? Number(p.lng) : null,
    hidden: Boolean(p.hidden_at),
    createdAt: p.created_at,
    referralSource: p.referral_source || null,
    owner,
    services: services.map(s => ({ id: s.id, name: s.name, durationMin: s.duration_min, priceCents: s.price_cents })),
    hours: hours.map(h => ({ weekday: h.weekday, startTime: h.start_time.slice(0, 5), endTime: h.end_time.slice(0, 5) })),
    collaborators: collaborators.map(c => ({ id: c.id, name: c.name, role: c.role || '' })),
    bankAccounts: bankAccounts.map(b => ({
      id: b.id, bankName: b.bank_name, accountType: b.account_type,
      accountNumber: b.account_number, accountHolder: b.account_holder, cedulaRnc: b.cedula_rnc,
    })),
  });
});

router.patch('/businesses/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT id, neighborhood FROM professionals WHERE id = ?', [req.params.id]);
  const before = rows[0];
  if (!before) return res.status(404).json({ error: 'Negocio no encontrado' });

  if (req.body.category !== undefined && !VALID_CATEGORIES.includes(req.body.category)) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }

  const columnByField = { name: 'name', businessName: 'business_name', neighborhood: 'neighborhood', category: 'category', slug: 'slug', lat: 'lat', lng: 'lng' };
  const fields = [];
  const params = [];
  for (const [field, column] of Object.entries(columnByField)) {
    if (req.body[field] === undefined) continue;
    const value = String(req.body[field]).trim();
    fields.push(`${column} = ?`);
    params.push(value === '' ? null : value);
  }
  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  params.push(req.params.id);

  await pool.query(`UPDATE professionals SET ${fields.join(', ')} WHERE id = ?`, params);

  // Si cambió el sector y no se dieron coordenadas a mano, re-geocodifica en
  // segundo plano, mismo patrón que POST /:slug/profile del dueño.
  if (req.body.neighborhood !== undefined && req.body.neighborhood !== before.neighborhood && req.body.lat === undefined) {
    geocodeNeighborhood(req.body.neighborhood).then(point => {
      if (point) {
        pool.query('UPDATE professionals SET lat = ?, lng = ? WHERE id = ?', [point.lat, point.lng, req.params.id])
          .catch(err => console.error('No se pudo guardar la geocodificación:', err.message));
      }
    });
  }

  res.json({ saved: true });
});

router.post('/businesses/:id/transfer', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const [userRows] = await pool.query('SELECT id, name FROM users WHERE phone = ?', [phone]);
  const user = userRows[0];
  if (!user) return res.status(404).json({ error: 'No encontramos ninguna cuenta con ese teléfono' });

  const [result] = await pool.query('UPDATE professionals SET owner_user_id = ? WHERE id = ?', [user.id, req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Negocio no encontrado' });

  res.json({ saved: true, newOwnerName: user.name });
});

router.post('/businesses/:id/toggle-hidden', async (req, res) => {
  const [rows] = await pool.query('SELECT hidden_at FROM professionals WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Negocio no encontrado' });

  const nowHidden = !rows[0].hidden_at;
  await pool.query('UPDATE professionals SET hidden_at = ? WHERE id = ?', [nowHidden ? new Date() : null, req.params.id]);
  res.json({ hidden: nowHidden });
});

// "Ver como dueño" (2026-08-25) — para soporte: abre el panel real de
// negocio (/negocio) como si fuera el dueño, sin necesitar su teléfono ni
// PIN. Emite un token de sesión nuevo para su cuenta, igual que un login
// normal — cierra cualquier sesión que el dueño tuviera abierta en otro
// dispositivo, el mismo costo que ya tiene "Resetear PIN".
router.post('/businesses/:id/impersonate', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.slug, u.id AS user_id, u.name
     FROM professionals p JOIN users u ON u.id = p.owner_user_id
     WHERE p.id = ?`,
    [req.params.id]
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ error: 'Este negocio no tiene un dueño real todavía, no se puede entrar como él' });

  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, row.user_id]);
  res.json({ token, name: row.name, slug: row.slug });
});

// ===== Reservas =====
router.get('/bookings', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const status = req.query.status;
  const range = req.query.range;

  let sql = `SELECT b.id, b.client_name, b.status, b.payment_method, b.appointment_at, b.created_at, b.receipt_path,
                    p.name AS professional_name, p.slug, s.name AS service_name, s.price_cents, c.name AS collaborator_name
             FROM bookings b
             JOIN professionals p ON p.id = b.professional_id
             JOIN services s ON s.id = b.service_id
             LEFT JOIN collaborators c ON c.id = b.collaborator_id
             WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  if (range === 'today') sql += ' AND DATE(b.appointment_at) = CURDATE()';
  else if (range === 'week') sql += ' AND b.appointment_at BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY';
  if (q) {
    sql += ' AND (b.client_name LIKE ? OR p.name LIKE ? OR p.business_name LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY COALESCE(b.appointment_at, b.created_at) DESC LIMIT 200';

  const [rows] = await pool.query(sql, params);
  const bookings = rows.map(b => ({
    id: b.id,
    clientName: b.client_name,
    status: b.status,
    paymentMethod: b.payment_method,
    appointmentAt: b.appointment_at,
    createdAt: b.created_at,
    receiptUrl: receiptUrl(req, b.receipt_path),
    professionalName: b.professional_name,
    professionalSlug: b.slug,
    serviceName: b.service_name,
    priceCents: b.price_cents,
    collaboratorName: b.collaborator_name,
  }));

  if (req.query.format === 'csv') {
    return sendCsv(res, 'reservas-bukea.csv', toCsv(bookings, [
      { label: 'Cliente', value: r => r.clientName },
      { label: 'Negocio', value: r => r.professionalName },
      { label: 'Servicio', value: r => r.serviceName },
      { label: 'Precio (RD$)', value: r => Math.round(r.priceCents / 100) },
      { label: 'Fecha', value: r => r.appointmentAt || r.createdAt },
      { label: 'Pago', value: r => r.paymentMethod },
      { label: 'Estado', value: r => r.status },
    ]));
  }
  res.json(bookings);
});

router.post('/bookings/:id/cancel', async (req, res) => {
  const [rows] = await pool.query('SELECT id, status FROM bookings WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (rows[0].status === 'cancelled') return res.status(400).json({ error: 'Esa reserva ya estaba cancelada' });

  await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ saved: true });
});

// ===== Moderación (Fase 2) =====
router.get('/moderation/bank-accounts', async (req, res) => {
  const filter = req.query.filter; // 'unverified' | 'verified'
  let sql = `SELECT ba.id, ba.bank_name, ba.account_type, ba.account_number, ba.account_holder, ba.cedula_rnc, ba.verified_at,
                    p.id AS professional_id, p.business_name, p.name AS professional_name
             FROM professional_bank_accounts ba
             JOIN professionals p ON p.id = ba.professional_id
             WHERE 1=1`;
  if (filter === 'unverified') sql += ' AND ba.verified_at IS NULL';
  else if (filter === 'verified') sql += ' AND ba.verified_at IS NOT NULL';
  sql += ' ORDER BY (ba.verified_at IS NULL) DESC, ba.id DESC LIMIT 200';

  const [rows] = await pool.query(sql);
  res.json(rows.map(b => ({
    id: b.id,
    bankName: b.bank_name,
    accountType: b.account_type,
    accountNumber: b.account_number,
    accountHolder: b.account_holder,
    cedulaRnc: b.cedula_rnc,
    verified: Boolean(b.verified_at),
    professionalId: b.professional_id,
    businessName: b.business_name,
    professionalName: b.professional_name,
  })));
});

router.post('/bank-accounts/:id/toggle-verified', async (req, res) => {
  const [rows] = await pool.query('SELECT verified_at FROM professional_bank_accounts WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });

  const nowVerified = !rows[0].verified_at;
  await pool.query('UPDATE professional_bank_accounts SET verified_at = ? WHERE id = ?', [nowVerified ? new Date() : null, req.params.id]);
  res.json({ verified: nowVerified });
});

router.get('/moderation/receipts', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.client_name, b.receipt_path, b.receipt_uploaded_at, b.status,
            p.business_name AS professional_business_name
     FROM bookings b JOIN professionals p ON p.id = b.professional_id
     WHERE b.receipt_path IS NOT NULL
     ORDER BY b.receipt_uploaded_at DESC LIMIT 100`
  );
  res.json(rows.map(r => ({
    bookingId: r.id,
    clientName: r.client_name,
    professionalBusinessName: r.professional_business_name,
    uploadedAt: r.receipt_uploaded_at,
    status: r.status,
    receiptUrl: receiptUrl(req, r.receipt_path),
  })));
});

// Borra el archivo del comprobante y desvincula la reserva — la reserva en
// sí no se toca, solo deja de tener comprobante adjunto (ej. el cliente
// subió algo que no era un comprobante de pago).
router.delete('/bookings/:id/receipt', async (req, res) => {
  const [rows] = await pool.query('SELECT receipt_path FROM bookings WHERE id = ?', [req.params.id]);
  const booking = rows[0];
  if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (!booking.receipt_path) return res.status(400).json({ error: 'Esa reserva no tiene comprobante' });

  const filePath = path.join(RECEIPTS_DIR, booking.receipt_path.split('/').pop());
  fs.unlink(filePath, err => {
    if (err && err.code !== 'ENOENT') console.error('No se pudo borrar el comprobante:', err.message);
  });
  await pool.query('UPDATE bookings SET receipt_path = NULL, receipt_uploaded_at = NULL WHERE id = ?', [req.params.id]);
  res.json({ saved: true });
});

// ===== Métricas (Fase 2) =====
router.get('/metrics', async (req, res) => {
  const [growthRows] = await pool.query(
    `SELECT YEARWEEK(created_at, 3) AS yw, MIN(DATE(created_at)) AS weekStart, COUNT(*) AS n
     FROM users WHERE role != 'admin' AND created_at >= NOW() - INTERVAL 12 WEEK
     GROUP BY yw ORDER BY yw`
  );
  const [growthBizRows] = await pool.query(
    `SELECT YEARWEEK(created_at, 3) AS yw, MIN(DATE(created_at)) AS weekStart, COUNT(*) AS n
     FROM professionals WHERE created_at >= NOW() - INTERVAL 12 WEEK
     GROUP BY yw ORDER BY yw`
  );

  const [[funnel]] = await pool.query(
    `SELECT
       COUNT(*) AS registered,
       COUNT(CASE WHEN EXISTS (SELECT 1 FROM services s WHERE s.professional_id = p.id) THEN 1 END) AS withServices,
       COUNT(CASE WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.professional_id = p.id) THEN 1 END) AS everBooked,
       COUNT(CASE WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.professional_id = p.id AND b.status = 'confirmed' AND b.appointment_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) THEN 1 END) AS bookedThisMonth
     FROM professionals p WHERE p.hidden_at IS NULL`
  );

  const [[retention]] = await pool.query(
    `SELECT
       COUNT(*) AS totalClients,
       COUNT(CASE WHEN bookings_count >= 2 THEN 1 END) AS repeatClients
     FROM (
       SELECT client_user_id, COUNT(*) AS bookings_count
       FROM bookings WHERE client_user_id IS NOT NULL
       GROUP BY client_user_id
     ) t`
  );

  const [byCategory] = await pool.query(
    `SELECT p.category,
            COUNT(DISTINCT p.id) AS businesses,
            COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) AS bookings
     FROM professionals p LEFT JOIN bookings b ON b.professional_id = p.id
     WHERE p.hidden_at IS NULL
     GROUP BY p.category ORDER BY bookings DESC`
  );

  const [bySector] = await pool.query(
    `SELECT p.neighborhood,
            COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) AS bookings
     FROM professionals p LEFT JOIN bookings b ON b.professional_id = p.id
     WHERE p.hidden_at IS NULL
     GROUP BY p.neighborhood ORDER BY bookings DESC LIMIT 10`
  );

  const [topBusinesses] = await pool.query(
    `SELECT p.business_name,
            COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.appointment_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN s.price_cents END), 0) AS volumeCents,
            COUNT(CASE WHEN b.appointment_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) AS totalThisMonth,
            COUNT(CASE WHEN b.status = 'cancelled' AND b.appointment_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) AS cancelledThisMonth
     FROM professionals p LEFT JOIN bookings b ON b.professional_id = p.id
     LEFT JOIN services s ON s.id = b.service_id
     WHERE p.hidden_at IS NULL
     GROUP BY p.id ORDER BY volumeCents DESC LIMIT 10`
  );

  res.json({
    growth: {
      users: growthRows.map(r => ({ weekStart: r.weekStart, count: r.n })),
      businesses: growthBizRows.map(r => ({ weekStart: r.weekStart, count: r.n })),
    },
    funnel: {
      registered: funnel.registered,
      withServices: funnel.withServices,
      everBooked: funnel.everBooked,
      bookedThisMonth: funnel.bookedThisMonth,
    },
    retention: {
      totalClients: retention.totalClients,
      repeatClients: retention.repeatClients,
      repeatPct: retention.totalClients > 0 ? Math.round((retention.repeatClients / retention.totalClients) * 100) : 0,
    },
    byCategory: byCategory.map(r => ({ category: r.category, businesses: r.businesses, bookings: r.bookings })),
    bySector: bySector.map(r => ({ neighborhood: r.neighborhood, bookings: r.bookings })),
    topBusinesses: topBusinesses.map(r => ({
      businessName: r.business_name,
      volumeCents: Number(r.volumeCents),
      cancellationPct: r.totalThisMonth > 0 ? Math.round((r.cancelledThisMonth / r.totalThisMonth) * 100) : 0,
    })),
  });
});

// ===== Comunicación (Fase 2) =====
router.get('/communication/status', (req, res) => {
  res.json({ whatsapp: whatsapp.isConfigured(), mail: mailer.isConfigured() });
});

async function logMessage({ userId, channel, subject, body, status, errorMessage, adminId }) {
  await pool.query(
    'INSERT INTO message_log (user_id, channel, subject, body, status, error_message, sent_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId || null, channel, subject || null, body, status, errorMessage || null, adminId]
  );
}

// Mensaje de prueba al propio admin — para confirmar que un canal quedó
// bien configurado sin arriesgar mandarle algo a un cliente real.
router.post('/communication/test', async (req, res) => {
  const channel = req.body.channel;
  const body = 'Este es un mensaje de prueba del panel de administración de Bukea.';
  try {
    if (channel === 'whatsapp') {
      if (!req.admin.phone) return res.status(400).json({ error: 'Tu cuenta de admin no tiene teléfono' });
      await whatsapp.sendTextMessage(req.admin.phone, body);
    } else if (channel === 'email') {
      if (!req.admin.email) return res.status(400).json({ error: 'Tu cuenta de admin no tiene correo' });
      await mailer.sendCustomMessage(req.admin.email, 'Prueba, panel de Bukea', body);
    } else {
      return res.status(400).json({ error: 'Canal no válido' });
    }
    await logMessage({ userId: req.admin.id, channel, body, status: 'sent', adminId: req.admin.id });
    res.json({ sent: true });
  } catch (err) {
    await logMessage({ userId: req.admin.id, channel, body, status: 'failed', errorMessage: err.message, adminId: req.admin.id });
    res.status(502).json({ error: err.message });
  }
});

router.post('/users/:id/message', async (req, res) => {
  const channel = req.body.channel;
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Escribe un mensaje' });
  if (channel !== 'whatsapp' && channel !== 'email') return res.status(400).json({ error: 'Canal no válido' });

  const [rows] = await pool.query('SELECT id, phone, email FROM users WHERE id = ?', [req.params.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  try {
    if (channel === 'whatsapp') {
      if (!user.phone) return res.status(400).json({ error: 'Ese usuario no tiene teléfono' });
      await whatsapp.sendTextMessage(user.phone, text);
    } else {
      if (!user.email) return res.status(400).json({ error: 'Ese usuario no tiene correo' });
      await mailer.sendCustomMessage(user.email, 'Un mensaje del equipo de Bukea', text);
    }
    await logMessage({ userId: user.id, channel, body: text, status: 'sent', adminId: req.admin.id });
    res.json({ sent: true });
  } catch (err) {
    await logMessage({ userId: user.id, channel, body: text, status: 'failed', errorMessage: err.message, adminId: req.admin.id });
    res.status(502).json({ error: err.message });
  }
});

router.get('/communication/log', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.id, m.channel, m.body, m.status, m.error_message, m.created_at, u.name AS user_name
     FROM message_log m LEFT JOIN users u ON u.id = m.user_id
     ORDER BY m.created_at DESC LIMIT 50`
  );
  res.json(rows.map(m => ({
    id: m.id,
    channel: m.channel,
    body: m.body,
    status: m.status,
    errorMessage: m.error_message,
    createdAt: m.created_at,
    userName: m.user_name,
  })));
});

// ===== Configuración (Fase 2) =====
router.get('/settings', async (req, res) => {
  res.json(await getSettings());
});

router.patch('/settings', async (req, res) => {
  const patch = {};
  if (req.body.bannerEnabled !== undefined) patch.bannerEnabled = Boolean(req.body.bannerEnabled);
  if (req.body.bannerText !== undefined) patch.bannerText = String(req.body.bannerText).slice(0, 280);
  if (req.body.bookingBufferMin !== undefined) {
    const v = Number(req.body.bookingBufferMin);
    if (!Number.isInteger(v) || v < 0 || v > 240) return res.status(400).json({ error: 'El colchón de antelación debe ser un número entre 0 y 240 minutos' });
    patch.bookingBufferMin = v;
  }
  if (req.body.bookingSlotMin !== undefined) {
    const v = Number(req.body.bookingSlotMin);
    if (!Number.isInteger(v) || v < 5 || v > 60) return res.status(400).json({ error: 'El tamaño del slot debe ser un número entre 5 y 60 minutos' });
    patch.bookingSlotMin = v;
  }
  res.json(await updateSettings(patch));
});

// Soporte (2026-08-27) — hilos de chat con dueños de negocio, ver
// GET/POST /:slug/messages en professionals.js del lado del dueño. Un
// hilo por cuenta, agrupado por support_messages.user_id.
router.get('/support/threads', async (req, res) => {
  const [threads] = await pool.query(`
    SELECT u.id AS userId, u.name, u.phone,
      (SELECT body FROM support_messages WHERE user_id = u.id ORDER BY id DESC LIMIT 1) AS lastBody,
      (SELECT created_at FROM support_messages WHERE user_id = u.id ORDER BY id DESC LIMIT 1) AS lastAt,
      (SELECT COUNT(*) FROM support_messages WHERE user_id = u.id AND sender = 'user' AND read_at IS NULL) AS unread
    FROM users u
    WHERE EXISTS (SELECT 1 FROM support_messages sm WHERE sm.user_id = u.id)
    ORDER BY lastAt DESC
  `);
  res.json(threads);
});

router.get('/support/threads/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  const [messages] = await pool.query(
    'SELECT id, sender, body, created_at FROM support_messages WHERE user_id = ? ORDER BY id',
    [userId]
  );
  await pool.query(
    "UPDATE support_messages SET read_at = NOW() WHERE user_id = ? AND sender = 'user' AND read_at IS NULL",
    [userId]
  );
  res.json(messages);
});

router.post('/support/threads/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  const body = String(req.body.message || '').trim().slice(0, 3000);
  if (!body) return res.status(400).json({ error: 'Escribe tu respuesta' });

  const [[user]] = await pool.query('SELECT name, email, phone FROM users WHERE id = ?', [userId]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  await pool.query("INSERT INTO support_messages (user_id, sender, body, read_at) VALUES (?, 'admin', ?, NOW())", [userId, body]);

  // Avisar por el canal que tenga: correo si lo dio, si no WhatsApp (mismo
  // patrón que "Enviar mensaje" en la ficha del usuario, más abajo).
  if (user.email && mailer.isConfigured()) {
    try { await mailer.sendCustomMessage(user.email, 'Respuesta de Bukea', body); } catch (err) { console.error(err); }
  } else if (user.phone && whatsapp.isConfigured && whatsapp.isConfigured()) {
    try { await whatsapp.sendTextMessage(user.phone, body); } catch (err) { console.error(err); }
  }
  res.json({ sent: true });
});

module.exports = router;
