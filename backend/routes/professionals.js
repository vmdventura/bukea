const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  const { category } = req.query;
  const params = [];
  let sql = 'SELECT * FROM professionals';
  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }
  sql += ' ORDER BY rating DESC';

  const [professionals] = await pool.query(sql, params);
  const ids = professionals.map(p => p.id);

  let servicesByProfessional = {};
  if (ids.length > 0) {
    const [services] = await pool.query(
      `SELECT professional_id, name FROM services WHERE professional_id IN (?) ORDER BY id`,
      [ids]
    );
    servicesByProfessional = services.reduce((acc, s) => {
      (acc[s.professional_id] ||= []).push(s.name);
      return acc;
    }, {});
  }

  res.json(
    professionals.map(p => ({
      slug: p.slug,
      category: p.category,
      name: p.name,
      businessName: p.business_name,
      neighborhood: p.neighborhood,
      rating: Number(p.rating),
      reviewsCount: p.reviews_count,
      tags: (servicesByProfessional[p.id] || []).slice(0, 3),
    }))
  );
});

const VALID_CATEGORIES = ['barberia', 'unas', 'salon', 'maquillaje', 'cejas-mua', 'pilates'];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

router.post('/', async (req, res) => {
  const { name, businessName, neighborhood, category, services } = req.body;

  if (!name || !businessName || !neighborhood || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }
  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: 'Agrega al menos un servicio' });
  }
  for (const s of services) {
    if (!s.name || !Number.isFinite(Number(s.durationMin)) || !Number.isFinite(Number(s.priceCents))) {
      return res.status(400).json({ error: 'Cada servicio necesita nombre, duración y precio' });
    }
  }

  let slug = slugify(name) || 'profesional';
  const [taken] = await pool.query('SELECT slug FROM professionals WHERE slug LIKE ?', [slug + '%']);
  if (taken.some(r => r.slug === slug)) {
    let n = 2;
    while (taken.some(r => r.slug === slug + '-' + n)) n++;
    slug = slug + '-' + n;
  }

  const [result] = await pool.query(
    `INSERT INTO professionals (slug, category, name, business_name, neighborhood, rating, reviews_count, accepts_whatsapp, accepts_cash)
     VALUES (?, ?, ?, ?, ?, 0, 0, 1, 1)`,
    [slug, category, name, businessName, neighborhood]
  );
  const professionalId = result.insertId;

  for (const s of services) {
    await pool.query(
      'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
      [professionalId, s.name, Math.round(Number(s.durationMin)), Math.round(Number(s.priceCents))]
    );
  }

  res.status(201).json({ slug });
});

router.get('/:slug', async (req, res) => {
  const [professionals] = await pool.query(
    'SELECT * FROM professionals WHERE slug = ?',
    [req.params.slug]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  const [services] = await pool.query(
    'SELECT id, name, duration_min, price_cents FROM services WHERE professional_id = ?',
    [professional.id]
  );

  res.json({
    id: professional.id,
    slug: professional.slug,
    category: professional.category,
    name: professional.name,
    businessName: professional.business_name,
    neighborhood: professional.neighborhood,
    rating: Number(professional.rating),
    reviewsCount: professional.reviews_count,
    acceptsWhatsapp: Boolean(professional.accepts_whatsapp),
    acceptsCash: Boolean(professional.accepts_cash),
    services: services.map(s => ({
      id: s.id,
      name: s.name,
      durationMin: s.duration_min,
      priceCents: s.price_cents,
    })),
  });
});

router.get('/:slug/bookings', async (req, res) => {
  const [professionals] = await pool.query(
    'SELECT id FROM professionals WHERE slug = ?',
    [req.params.slug]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  const [bookings] = await pool.query(
    `SELECT b.id, b.client_name, b.day_label, b.time_label, b.payment_method, b.created_at,
            s.name AS service_name, s.price_cents, s.duration_min
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     WHERE b.professional_id = ?
     ORDER BY b.created_at DESC`,
    [professional.id]
  );

  res.json(
    bookings.map(b => ({
      id: b.id,
      clientName: b.client_name,
      dayLabel: b.day_label,
      timeLabel: b.time_label,
      paymentMethod: b.payment_method,
      serviceName: b.service_name,
      priceCents: b.price_cents,
      durationMin: b.duration_min,
      createdAt: b.created_at,
    }))
  );
});

// "Mi Cuadre": cuánto vendió el profesional hoy, en los últimos 7 días y en el
// mes en curso. Los períodos se calculan sobre created_at (cuándo se hizo la
// reserva) porque day_label es texto libre ("Hoy", "Mañana"), no una fecha real.
router.get('/:slug/stats', async (req, res) => {
  const [professionals] = await pool.query(
    'SELECT id FROM professionals WHERE slug = ?',
    [req.params.slug]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  const [[stats]] = await pool.query(
    `SELECT
       COUNT(CASE WHEN b.created_at >= CURDATE() THEN 1 END) AS today_count,
       COALESCE(SUM(CASE WHEN b.created_at >= CURDATE() THEN s.price_cents END), 0) AS today_cents,
       COUNT(CASE WHEN b.created_at >= CURDATE() - INTERVAL 6 DAY THEN 1 END) AS week_count,
       COALESCE(SUM(CASE WHEN b.created_at >= CURDATE() - INTERVAL 6 DAY THEN s.price_cents END), 0) AS week_cents,
       COUNT(CASE WHEN b.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 END) AS month_count,
       COALESCE(SUM(CASE WHEN b.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN s.price_cents END), 0) AS month_cents
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     WHERE b.professional_id = ?`,
    [professional.id]
  );

  res.json({
    today: { count: Number(stats.today_count), totalCents: Number(stats.today_cents) },
    last7Days: { count: Number(stats.week_count), totalCents: Number(stats.week_cents) },
    month: { count: Number(stats.month_count), totalCents: Number(stats.month_cents) },
  });
});

module.exports = router;
