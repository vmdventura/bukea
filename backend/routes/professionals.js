const express = require('express');
const pool = require('../db/pool');
const { insertDefaultHours } = require('../lib/hours');
const { requireAuth } = require('../lib/auth-middleware');
const {
  nowInSantoDomingo, weekdayOf, dayLabel, addDays,
  timeToMinutes, minutesToHHMM, formatTime12h, computeFreeSlots,
} = require('../lib/availability');

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

router.post('/', requireAuth, async (req, res) => {
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
    `INSERT INTO professionals (slug, category, name, business_name, neighborhood, rating, reviews_count, accepts_whatsapp, accepts_cash, owner_user_id)
     VALUES (?, ?, ?, ?, ?, 0, 0, 1, 1, ?)`,
    [slug, category, name, businessName, neighborhood, req.user.id]
  );
  const professionalId = result.insertId;

  for (const s of services) {
    await pool.query(
      'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
      [professionalId, s.name, Math.round(Number(s.durationMin)), Math.round(Number(s.priceCents))]
    );
  }

  await insertDefaultHours(professionalId);

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

// Disponibilidad real (2026-08-22): reemplaza las etiquetas fijas ("Hoy",
// "Mañana", 4 horas fijas) que traía el flujo de reserva. "días" dice cuáles
// de los próximos N días tienen al menos un hueco (para el selector de
// fecha); "horas" da los horarios concretos de un día para un servicio.

router.get('/:slug/availability/days', async (req, res) => {
  const [professionals] = await pool.query('SELECT id FROM professionals WHERE slug = ?', [req.params.slug]);
  const professional = professionals[0];
  if (!professional) return res.status(404).json({ error: 'Profesional no encontrado' });

  const serviceId = Number(req.query.serviceId);
  const [services] = await pool.query(
    'SELECT duration_min FROM services WHERE id = ? AND professional_id = ?',
    [serviceId, professional.id]
  );
  if (!services[0]) return res.status(400).json({ error: 'Selecciona un servicio válido' });
  const durationMin = services[0].duration_min;

  const days = Math.min(Number(req.query.days) || 10, 21);
  const { date: today, minutes: nowMinutes } = nowInSantoDomingo();

  const [hours] = await pool.query(
    'SELECT weekday, start_time, end_time FROM professional_hours WHERE professional_id = ?',
    [professional.id]
  );
  const hoursByWeekday = hours.reduce((acc, h) => {
    (acc[h.weekday] ||= []).push(h);
    return acc;
  }, {});

  const fromDate = today;
  const toDate = addDays(today, days - 1);
  const [bookings] = await pool.query(
    `SELECT appointment_at, duration_min FROM bookings
     WHERE professional_id = ? AND status = 'confirmed'
       AND appointment_at BETWEEN ? AND ?`,
    [professional.id, `${fromDate} 00:00:00`, `${toDate} 23:59:59`]
  );

  const result = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const weekday = weekdayOf(date);
    const hoursRows = hoursByWeekday[weekday] || [];
    const isToday = date === today;

    const busyRanges = bookings
      .filter(b => b.appointment_at.slice(0, 10) === date)
      .map(b => ({
        startMin: timeToMinutes(b.appointment_at.slice(11, 16)),
        endMin: timeToMinutes(b.appointment_at.slice(11, 16)) + (b.duration_min || 30),
      }));

    const slots = hoursRows.length
      ? computeFreeSlots({ hoursRows, durationMin, busyRanges, isToday, nowMinutes })
      : [];

    result.push({ date, label: dayLabel(date), isOpen: hoursRows.length > 0, hasSlots: slots.length > 0 });
  }

  res.json(result);
});

router.get('/:slug/availability/times', async (req, res) => {
  const [professionals] = await pool.query('SELECT id FROM professionals WHERE slug = ?', [req.params.slug]);
  const professional = professionals[0];
  if (!professional) return res.status(404).json({ error: 'Profesional no encontrado' });

  const serviceId = Number(req.query.serviceId);
  const date = String(req.query.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Fecha inválida' });

  const [services] = await pool.query(
    'SELECT duration_min FROM services WHERE id = ? AND professional_id = ?',
    [serviceId, professional.id]
  );
  if (!services[0]) return res.status(400).json({ error: 'Selecciona un servicio válido' });
  const durationMin = services[0].duration_min;

  const { date: today, minutes: nowMinutes } = nowInSantoDomingo();
  const isToday = date === today;

  const [hoursRows] = await pool.query(
    'SELECT start_time, end_time FROM professional_hours WHERE professional_id = ? AND weekday = ?',
    [professional.id, weekdayOf(date)]
  );

  const [bookings] = await pool.query(
    `SELECT appointment_at, duration_min FROM bookings
     WHERE professional_id = ? AND status = 'confirmed'
       AND appointment_at BETWEEN ? AND ?`,
    [professional.id, `${date} 00:00:00`, `${date} 23:59:59`]
  );
  const busyRanges = bookings.map(b => ({
    startMin: timeToMinutes(b.appointment_at.slice(11, 16)),
    endMin: timeToMinutes(b.appointment_at.slice(11, 16)) + (b.duration_min || 30),
  }));

  const slots = computeFreeSlots({ hoursRows, durationMin, busyRanges, isToday, nowMinutes });

  res.json({
    date,
    label: dayLabel(date),
    times: slots.map(t => ({ time: minutesToHHMM(t), label: formatTime12h(minutesToHHMM(t)) })),
  });
});

router.get('/:slug/bookings', requireAuth, async (req, res) => {
  const [professionals] = await pool.query(
    'SELECT id, owner_user_id FROM professionals WHERE slug = ?',
    [req.params.slug]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }
  if (professional.owner_user_id !== req.user.id) {
    return res.status(403).json({ error: 'No tienes acceso a este negocio' });
  }

  const [bookings] = await pool.query(
    `SELECT b.id, b.client_name, b.day_label, b.time_label, b.appointment_at, b.status,
            b.payment_method, b.created_at,
            s.name AS service_name, s.price_cents, s.duration_min
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     WHERE b.professional_id = ?
     ORDER BY COALESCE(b.appointment_at, b.created_at) DESC`,
    [professional.id]
  );

  res.json(
    bookings.map(b => ({
      id: b.id,
      clientName: b.client_name,
      dayLabel: b.appointment_at ? dayLabel(b.appointment_at.slice(0, 10)) : b.day_label,
      timeLabel: b.appointment_at ? formatTime12h(b.appointment_at.slice(11, 16)) : b.time_label,
      status: b.status,
      paymentMethod: b.payment_method,
      serviceName: b.service_name,
      priceCents: b.price_cents,
      durationMin: b.duration_min,
      createdAt: b.created_at,
    }))
  );
});

// "Mi Cuadre": cuánto vendió el profesional hoy, en los últimos 7 días y en el
// mes en curso. Se calcula sobre appointment_at (la fecha real de la cita) y,
// para las reservas de antes de tener fechas reales, cae de vuelta a
// created_at. Las citas canceladas no cuentan.
router.get('/:slug/stats', requireAuth, async (req, res) => {
  const [professionals] = await pool.query(
    'SELECT id, owner_user_id FROM professionals WHERE slug = ?',
    [req.params.slug]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }
  if (professional.owner_user_id !== req.user.id) {
    return res.status(403).json({ error: 'No tienes acceso a este negocio' });
  }

  // DATE(...) acota cada cubeta a un rango cerrado (hoy, últimos 7 días,
  // mes en curso hasta hoy) — con appointment_at una cita agendada a futuro
  // no debe contar como "de hoy" solo porque su fecha es >= CURDATE().
  const [[stats]] = await pool.query(
    `SELECT
       COUNT(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) = CURDATE() THEN 1 END) AS today_count,
       COALESCE(SUM(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) = CURDATE() THEN s.price_cents END), 0) AS today_cents,
       COUNT(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE() THEN 1 END) AS week_count,
       COALESCE(SUM(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE() THEN s.price_cents END), 0) AS week_cents,
       COUNT(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE() THEN 1 END) AS month_count,
       COALESCE(SUM(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE() THEN s.price_cents END), 0) AS month_cents
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     WHERE b.professional_id = ? AND b.status = 'confirmed'`,
    [professional.id]
  );

  res.json({
    today: { count: Number(stats.today_count), totalCents: Number(stats.today_cents) },
    last7Days: { count: Number(stats.week_count), totalCents: Number(stats.week_cents) },
    month: { count: Number(stats.month_count), totalCents: Number(stats.month_cents) },
  });
});

const WEEKDAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

async function findOwnedProfessional(slug, userId) {
  const [rows] = await pool.query('SELECT id, owner_user_id FROM professionals WHERE slug = ?', [slug]);
  const professional = rows[0];
  if (!professional) return { error: [404, 'Profesional no encontrado'] };
  if (professional.owner_user_id !== userId) return { error: [403, 'No tienes acceso a este negocio'] };
  return { professional };
}

// Horario semanal editable (2026-08-22) — hasta ahora solo existía el
// horario por defecto sembrado al registrarse (mar-sáb 9am-6pm). Un solo
// rango por día en esta pantalla; varios rangos (huecos de almuerzo) siguen
// siendo posibles en la base de datos pero requieren editarlos a mano.
router.get('/:slug/hours', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const [rows] = await pool.query(
    'SELECT weekday, start_time, end_time FROM professional_hours WHERE professional_id = ? ORDER BY weekday',
    [professional.id]
  );
  const byWeekday = {};
  rows.forEach(r => { byWeekday[r.weekday] = r; });

  res.json(
    WEEKDAY_KEYS.map((key, weekday) => {
      const row = byWeekday[weekday];
      return {
        weekday,
        key,
        open: Boolean(row),
        startTime: row ? row.start_time.slice(0, 5) : '09:00',
        endTime: row ? row.end_time.slice(0, 5) : '18:00',
      };
    })
  );
});

router.put('/:slug/hours', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const days = Array.isArray(req.body.days) ? req.body.days : [];
  const clean = [];
  for (const d of days) {
    if (!d.open) continue;
    const weekday = Number(d.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return res.status(400).json({ error: 'Día inválido' });
    }
    if (!/^\d{2}:\d{2}$/.test(d.startTime) || !/^\d{2}:\d{2}$/.test(d.endTime)) {
      return res.status(400).json({ error: 'Hora inválida' });
    }
    if (d.startTime >= d.endTime) {
      return res.status(400).json({ error: 'La hora de cierre debe ser después de la de apertura' });
    }
    clean.push({ weekday, startTime: d.startTime, endTime: d.endTime });
  }

  await pool.query('DELETE FROM professional_hours WHERE professional_id = ?', [professional.id]);
  for (const d of clean) {
    await pool.query(
      'INSERT INTO professional_hours (professional_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)',
      [professional.id, d.weekday, d.startTime + ':00', d.endTime + ':00']
    );
  }

  res.json({ saved: true, openDays: clean.length });
});

module.exports = router;
