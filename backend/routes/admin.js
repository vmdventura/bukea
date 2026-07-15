const express = require('express');
const path = require('path');
const crypto = require('crypto');
const pool = require('../db/pool');

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bukea-admin';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'bukea-dev-secret-change-me';
const COOKIE_NAME = 'bukea_admin_session';

function sign(value) {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
  return `${value}.${hmac}`;
}

function verify(signed) {
  if (!signed) return false;
  const dot = signed.lastIndexOf('.');
  if (dot === -1) return false;
  const value = signed.slice(0, dot);
  const hmac = signed.slice(dot + 1);
  const expected = sign(value).slice(dot + 1);
  if (hmac.length !== expected.length) return false;
  return value === 'ok' && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(c => {
      const idx = c.indexOf('=');
      return [c.slice(0, idx).trim(), decodeURIComponent(c.slice(idx + 1))];
    })
  );
}

function requireAdmin(req, res, next) {
  const cookies = parseCookies(req);
  if (verify(cookies[COOKIE_NAME])) return next();
  res.status(401).json({ error: 'No autorizado' });
}

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

router.post('/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  const token = sign('ok');
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
  );
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

router.get('/summary', requireAdmin, async (req, res) => {
  const [[totals]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM professionals) AS professional_count,
      COUNT(CASE WHEN b.created_at >= CURDATE() THEN 1 END) AS today_count,
      COALESCE(SUM(CASE WHEN b.created_at >= CURDATE() THEN s.price_cents END), 0) AS today_cents,
      COUNT(CASE WHEN b.created_at >= CURDATE() - INTERVAL 6 DAY THEN 1 END) AS week_count,
      COALESCE(SUM(CASE WHEN b.created_at >= CURDATE() - INTERVAL 6 DAY THEN s.price_cents END), 0) AS week_cents,
      COUNT(CASE WHEN b.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 END) AS month_count,
      COALESCE(SUM(CASE WHEN b.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN s.price_cents END), 0) AS month_cents,
      COUNT(*) AS all_time_count,
      COALESCE(SUM(s.price_cents), 0) AS all_time_cents
    FROM bookings b
    JOIN services s ON s.id = b.service_id
  `);

  const [byProfessional] = await pool.query(`
    SELECT p.slug, p.name, p.business_name, p.category,
           COUNT(b.id) AS bookings_count,
           COALESCE(SUM(s.price_cents), 0) AS total_cents,
           MAX(b.created_at) AS last_booking_at
    FROM professionals p
    LEFT JOIN bookings b ON b.professional_id = p.id
    LEFT JOIN services s ON s.id = b.service_id
    GROUP BY p.id
    ORDER BY bookings_count DESC, p.name ASC
  `);

  const [recent] = await pool.query(`
    SELECT b.id, b.client_name, b.day_label, b.time_label, b.payment_method, b.created_at,
           p.name AS professional_name, p.business_name, s.name AS service_name, s.price_cents
    FROM bookings b
    JOIN professionals p ON p.id = b.professional_id
    JOIN services s ON s.id = b.service_id
    ORDER BY b.created_at DESC
    LIMIT 20
  `);

  res.json({
    totals: {
      professionalCount: totals.professional_count,
      today: { count: Number(totals.today_count), totalCents: Number(totals.today_cents) },
      last7Days: { count: Number(totals.week_count), totalCents: Number(totals.week_cents) },
      month: { count: Number(totals.month_count), totalCents: Number(totals.month_cents) },
      allTime: { count: Number(totals.all_time_count), totalCents: Number(totals.all_time_cents) },
    },
    byProfessional: byProfessional.map(p => ({
      slug: p.slug,
      name: p.name,
      businessName: p.business_name,
      category: p.category,
      bookingsCount: p.bookings_count,
      totalCents: Number(p.total_cents),
      lastBookingAt: p.last_booking_at,
    })),
    recent: recent.map(b => ({
      id: b.id,
      clientName: b.client_name,
      dayLabel: b.day_label,
      timeLabel: b.time_label,
      paymentMethod: b.payment_method,
      professionalName: b.professional_name,
      businessName: b.business_name,
      serviceName: b.service_name,
      priceCents: b.price_cents,
      createdAt: b.created_at,
    })),
  });
});

module.exports = router;
