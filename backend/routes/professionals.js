const express = require('express');
const pool = require('../db/pool');
const { insertDefaultHours } = require('../lib/hours');
const { requireAuth } = require('../lib/auth-middleware');
const { receiptUrl, logoUpload, logoUrl, photoUpload, photoUrl } = require('../lib/uploads');
const { geocodeNeighborhood } = require('../lib/geocode');
const { getSettings } = require('../lib/settings');
const mailer = require('../lib/mailer');
const {
  nowInSantoDomingo, weekdayOf, dayLabel, addDays,
  timeToMinutes, minutesToHHMM, formatTime12h, computeFreeSlots,
} = require('../lib/availability');

const router = express.Router();

router.get('/', async (req, res) => {
  const { category } = req.query;
  const params = [];
  let sql = 'SELECT * FROM professionals WHERE hidden_at IS NULL';
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY rating DESC';

  const [professionals] = await pool.query(sql, params);
  const ids = professionals.map(p => p.id);

  let servicesByProfessional = {};
  let photoByProfessional = {};
  if (ids.length > 0) {
    const [services] = await pool.query(
      `SELECT professional_id, name FROM services WHERE professional_id IN (?) ORDER BY id`,
      [ids]
    );
    servicesByProfessional = services.reduce((acc, s) => {
      (acc[s.professional_id] ||= []).push(s.name);
      return acc;
    }, {});
    // Primera foto de la galería de cada negocio, para las tarjetas con foto
    // del inicio de la app ("Cerca de ti", 2026-08-26).
    const [photos] = await pool.query(
      `SELECT professional_id, path FROM business_photos WHERE professional_id IN (?) ORDER BY id`,
      [ids]
    );
    photos.forEach(ph => { if (!photoByProfessional[ph.professional_id]) photoByProfessional[ph.professional_id] = ph.path; });
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
      lat: p.lat !== null ? Number(p.lat) : null,
      lng: p.lng !== null ? Number(p.lng) : null,
      logoUrl: logoUrl(req, p.logo_path),
      photoUrl: photoByProfessional[p.id] ? photoUrl(req, photoByProfessional[p.id]) : null,
    }))
  );
});

// El negocio propio de la sesión (2026-08-25) — antes el panel de negocio
// solo sabía a qué negocio pertenece el dueño por un valor guardado en el
// navegador (localStorage), nunca preguntándole al servidor. Un dueño que
// entraba desde otro dispositivo o navegador veía "Crea tu negocio" aunque
// ya tuviera uno. Va antes de /:slug para no chocar con esa ruta.
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT slug FROM professionals WHERE owner_user_id = ?', [req.user.id]);
  res.json({ slug: rows[0] ? rows[0].slug : null });
});

const VALID_CATEGORIES = ['barberia', 'unas', 'salon', 'maquillaje', 'cejas-mua', 'pilates', 'entrenador', 'peluqueria-canina', 'spa'];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Opciones válidas de "¿Cómo conociste Bukea?" — pregunta opcional del
// asistente de registro; alimenta la validación de calle, nunca bloquea.
const REFERRAL_SOURCES = ['instagram', 'tiktok', 'amigo', 'google', 'visita', 'otro'];

router.post('/', requireAuth, async (req, res) => {
  const { name, businessName, neighborhood, category, services, referralSource } = req.body;

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

  const referral = REFERRAL_SOURCES.includes(referralSource) ? referralSource : null;

  const [result] = await pool.query(
    `INSERT INTO professionals (slug, category, name, business_name, neighborhood, rating, reviews_count, accepts_whatsapp, accepts_cash, owner_user_id, referral_source)
     VALUES (?, ?, ?, ?, ?, 0, 0, 1, 1, ?, ?)`,
    [slug, category, name, businessName, neighborhood, req.user.id, referral]
  );
  const professionalId = result.insertId;

  for (const s of services) {
    await pool.query(
      'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
      [professionalId, s.name, Math.round(Number(s.durationMin)), Math.round(Number(s.priceCents))]
    );
  }

  await insertDefaultHours(professionalId);

  // No bloquea la respuesta — Nominatim puede tardar 1-2s y "Crear mi
  // cuenta" debe sentirse instantáneo. El pin aparece en el mapa en cuanto
  // resuelve, o en el próximo arranque del servidor si falla (ver
  // backfillMissingCoordinates en db/init.js).
  geocodeNeighborhood(neighborhood).then(point => {
    if (point) {
      pool.query('UPDATE professionals SET lat = ?, lng = ? WHERE id = ?', [point.lat, point.lng, professionalId])
        .catch(err => console.error('No se pudo guardar la geocodificación:', err.message));
    }
  });

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

  // Las cuentas bancarias las comparte el negocio a propósito para que le
  // paguen — van en el mismo endpoint público que el resto del perfil.
  const [bankAccounts] = await pool.query(
    'SELECT id, bank_name, account_type, account_number, account_holder, cedula_rnc FROM professional_bank_accounts WHERE professional_id = ?',
    [professional.id]
  );

  // Equipo (2026-08-23): el titular siempre aparece primero como la
  // "persona 0" reservable, seguido de los colaboradores que el negocio
  // haya agregado — misma agenda para todos (ver nota en schema.sql).
  const [collaboratorRows] = await pool.query(
    'SELECT id, name, role FROM collaborators WHERE professional_id = ? ORDER BY id',
    [professional.id]
  );
  const collaborators = [
    { id: null, name: professional.name, role: 'Titular' },
    ...collaboratorRows.map(c => ({ id: c.id, name: c.name, role: c.role || '' })),
  ];

  const [photoRows] = await pool.query(
    'SELECT id, path FROM business_photos WHERE professional_id = ? ORDER BY id',
    [professional.id]
  );

  res.json({
    id: professional.id,
    slug: professional.slug,
    category: professional.category,
    name: professional.name,
    businessName: professional.business_name,
    neighborhood: professional.neighborhood,
    lat: professional.lat !== null ? Number(professional.lat) : null,
    lng: professional.lng !== null ? Number(professional.lng) : null,
    rating: Number(professional.rating),
    reviewsCount: professional.reviews_count,
    acceptsWhatsapp: Boolean(professional.accepts_whatsapp),
    acceptsCash: Boolean(professional.accepts_cash),
    logoUrl: logoUrl(req, professional.logo_path),
    social: {
      instagram: professional.social_instagram || '',
      facebook: professional.social_facebook || '',
      tiktok: professional.social_tiktok || '',
      website: professional.social_website || '',
    },
    photos: photoRows.map(p => ({ id: p.id, url: photoUrl(req, p.path) })),
    services: services.map(s => ({
      id: s.id,
      name: s.name,
      durationMin: s.duration_min,
      priceCents: s.price_cents,
    })),
    bankAccounts: bankAccounts.map(b => ({
      id: b.id,
      bankName: b.bank_name,
      accountType: b.account_type,
      accountNumber: b.account_number,
      accountHolder: b.account_holder,
      cedulaRnc: b.cedula_rnc,
    })),
    collaborators,
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
  const { bookingSlotMin, bookingBufferMin } = await getSettings();

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
      ? computeFreeSlots({ hoursRows, durationMin, busyRanges, isToday, nowMinutes, slotMin: bookingSlotMin, bufferMin: bookingBufferMin })
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

  const { bookingSlotMin, bookingBufferMin } = await getSettings();
  const slots = computeFreeSlots({ hoursRows, durationMin, busyRanges, isToday, nowMinutes, slotMin: bookingSlotMin, bufferMin: bookingBufferMin });

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
            b.payment_method, b.created_at, b.receipt_path,
            s.name AS service_name, s.price_cents, s.duration_min,
            c.name AS collaborator_name
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     LEFT JOIN collaborators c ON c.id = b.collaborator_id
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
      appointmentAt: b.appointment_at,
      status: b.status,
      paymentMethod: b.payment_method,
      serviceName: b.service_name,
      priceCents: b.price_cents,
      durationMin: b.duration_min,
      createdAt: b.created_at,
      receiptUrl: receiptUrl(req, b.receipt_path),
      collaboratorName: b.collaborator_name || null,
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

// Editar perfil del negocio (2026-08-24) — nombre del dueño, nombre del
// negocio, categoría y sector, desde "Mi perfil" en el panel de escritorio.
// El slug NO cambia aunque cambie el nombre (se generó una sola vez al
// crear el negocio) — así no se rompen enlaces existentes ni el
// bukea_pro_slug guardado en el navegador. Si cambia el sector, se
// re-geocodifica en segundo plano igual que al registrarse (ver POST /).
router.put('/:slug/profile', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

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

  const [[before]] = await pool.query('SELECT neighborhood FROM professionals WHERE id = ?', [professional.id]);
  await pool.query(
    'UPDATE professionals SET name = ?, business_name = ?, neighborhood = ?, category = ? WHERE id = ?',
    [name, businessName, neighborhood, category, professional.id]
  );

  if (before.neighborhood !== neighborhood) {
    geocodeNeighborhood(neighborhood).then(point => {
      if (point) {
        pool.query('UPDATE professionals SET lat = ?, lng = ? WHERE id = ?', [point.lat, point.lng, professional.id])
          .catch(err => console.error('No se pudo guardar la geocodificación:', err.message));
      }
    });
  }

  res.json({ saved: true });
});

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

// Cuentas bancarias (2026-08-22 noche) — para que el cliente que paga por
// transferencia copie el número sin llamar. Se editan desde "Mi negocio";
// GET aquí es solo para prellenar ese formulario (la vista pública ya las
// trae en GET /:slug).
router.get('/:slug/bank-accounts', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const [rows] = await pool.query(
    'SELECT id, bank_name, account_type, account_number, account_holder, cedula_rnc FROM professional_bank_accounts WHERE professional_id = ? ORDER BY id',
    [professional.id]
  );
  res.json(rows.map(b => ({
    id: b.id,
    bankName: b.bank_name,
    accountType: b.account_type,
    accountNumber: b.account_number,
    accountHolder: b.account_holder,
    cedulaRnc: b.cedula_rnc,
  })));
});

router.put('/:slug/bank-accounts', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const accounts = Array.isArray(req.body.accounts) ? req.body.accounts : [];
  const clean = [];
  for (const a of accounts) {
    const bankName = String(a.bankName || '').trim();
    const accountType = String(a.accountType || '').trim();
    const accountNumber = String(a.accountNumber || '').trim();
    const accountHolder = String(a.accountHolder || '').trim();
    const cedulaRnc = String(a.cedulaRnc || '').trim();
    if (!bankName || !accountType || !accountNumber || !accountHolder || !cedulaRnc) continue;
    clean.push({ bankName, accountType, accountNumber, accountHolder, cedulaRnc });
  }

  await pool.query('DELETE FROM professional_bank_accounts WHERE professional_id = ?', [professional.id]);
  for (const a of clean) {
    await pool.query(
      'INSERT INTO professional_bank_accounts (professional_id, bank_name, account_type, account_number, account_holder, cedula_rnc) VALUES (?, ?, ?, ?, ?, ?)',
      [professional.id, a.bankName, a.accountType, a.accountNumber, a.accountHolder, a.cedulaRnc]
    );
  }

  res.json({ saved: true, count: clean.length });
});

// Equipo/colaboradores (2026-08-23) — mismo patrón que bank-accounts:
// GET prellena el formulario en "Mi negocio", PUT reemplaza todo el equipo.
// El titular NO vive en esta tabla (es el propio `professionals.name`), así
// que aquí solo se listan/editan los colaboradores adicionales.
router.get('/:slug/collaborators', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const [rows] = await pool.query(
    'SELECT id, name, role FROM collaborators WHERE professional_id = ? ORDER BY id',
    [professional.id]
  );
  res.json(rows.map(c => ({ id: c.id, name: c.name, role: c.role || '' })));
});

router.put('/:slug/collaborators', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const collaborators = Array.isArray(req.body.collaborators) ? req.body.collaborators : [];
  const clean = [];
  for (const c of collaborators) {
    const name = String(c.name || '').trim();
    const role = String(c.role || '').trim();
    if (!name) continue;
    clean.push({ name, role });
  }

  // Colaboradores ya asignados a citas pasadas no se pierden: la FK usa
  // ON DELETE SET NULL, así que borrar y reinsertar (mismo patrón que
  // bank-accounts) deja esas citas con collaborator_id NULL en vez de fallar.
  await pool.query('DELETE FROM collaborators WHERE professional_id = ?', [professional.id]);
  for (const c of clean) {
    await pool.query(
      'INSERT INTO collaborators (professional_id, name, role) VALUES (?, ?, ?)',
      [professional.id, c.name, c.role || null]
    );
  }

  res.json({ saved: true, count: clean.length });
});

// Logo del negocio (2026-08-25) — un solo archivo, se reemplaza el anterior.
// No se borra el archivo viejo del disco (mismo criterio que receipts: el
// espacio en disco no es crítico y complicar esto con limpieza no vale la
// pena todavía).
router.post('/:slug/logo', requireAuth, (req, res) => {
  logoUpload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
    if (error) return res.status(error[0]).json({ error: error[1] });
    if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });

    await pool.query('UPDATE professionals SET logo_path = ? WHERE id = ?', [req.file.filename, professional.id]);
    res.json({ logoUrl: logoUrl(req, req.file.filename) });
  });
});

// Redes sociales (2026-08-25) — los 4 campos son opcionales, se guardan tal
// cual los escribe el negocio (usuario/handle o URL completa, sin validar
// formato: distintas redes usan convenciones distintas y no vale la pena
// bloquear el guardado por eso).
router.put('/:slug/social', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const instagram = String(req.body.instagram || '').trim().slice(0, 190);
  const facebook = String(req.body.facebook || '').trim().slice(0, 190);
  const tiktok = String(req.body.tiktok || '').trim().slice(0, 190);
  const website = String(req.body.website || '').trim().slice(0, 190);

  await pool.query(
    'UPDATE professionals SET social_instagram = ?, social_facebook = ?, social_tiktok = ?, social_website = ? WHERE id = ?',
    [instagram || null, facebook || null, tiktok || null, website || null, professional.id]
  );
  res.json({ saved: true });
});

// Ubicación exacta en el mapa (2026-08-25) — el registro solo geocodifica el
// sector (ver lib/geocode.js), así que el pin puede quedar impreciso. Aquí
// el dueño lo arrastra en el mapa de "Mi negocio" y guarda coordenadas
// exactas, que a partir de ahí ya no se pisan al cambiar el sector en texto.
router.put('/:slug/location', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'Coordenadas inválidas' });
  }

  await pool.query('UPDATE professionals SET lat = ?, lng = ? WHERE id = ?', [lat, lng, professional.id]);
  res.json({ saved: true, lat, lng });
});

// Galería de fotos del negocio (2026-08-25) — 0..N fotos, cada una se sube y
// se borra individualmente (a diferencia del logo, que es un solo slot).
router.post('/:slug/photos', requireAuth, (req, res) => {
  photoUpload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
    if (error) return res.status(error[0]).json({ error: error[1] });
    if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });

    const [result] = await pool.query(
      'INSERT INTO business_photos (professional_id, path) VALUES (?, ?)',
      [professional.id, req.file.filename]
    );
    res.status(201).json({ id: result.insertId, url: photoUrl(req, req.file.filename) });
  });
});

router.delete('/:slug/photos/:photoId', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  await pool.query(
    'DELETE FROM business_photos WHERE id = ? AND professional_id = ?',
    [req.params.photoId, professional.id]
  );
  res.json({ deleted: true });
});

// Servicios editables (2026-08-25) — hasta ahora solo se creaban en el
// wizard de registro; mismo patrón "reemplazar todo" que bank-accounts y
// collaborators. Los IDs de citas ya reservadas contra un servicio borrado
// se quedan con service_id apuntando a una fila que ya no existe — no rompe
// nada porque bookings solo lee service_id al reservar, no con FK con
// ON DELETE CASCADE hacia bookings (ver schema.sql).
router.put('/:slug/services', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const services = Array.isArray(req.body.services) ? req.body.services : [];
  const clean = [];
  for (const s of services) {
    const name = String(s.name || '').trim();
    const durationMin = Math.round(Number(s.durationMin));
    const priceCents = Math.round(Number(s.priceCents));
    if (!name || !Number.isFinite(durationMin) || durationMin <= 0 || !Number.isFinite(priceCents) || priceCents < 0) continue;
    clean.push({ name, durationMin, priceCents });
  }
  if (clean.length === 0) {
    return res.status(400).json({ error: 'Agrega al menos un servicio válido' });
  }

  await pool.query('DELETE FROM services WHERE professional_id = ?', [professional.id]);
  for (const s of clean) {
    await pool.query(
      'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
      [professional.id, s.name, s.durationMin, s.priceCents]
    );
  }

  res.json({ saved: true, count: clean.length });
});

// Chat de soporte (2026-08-27) — reemplaza el "Abrir ticket" de una sola
// vía por un hilo real: el dueño escribe desde "Mi negocio", ve la
// respuesta del admin en la misma pantalla, y puede seguir escribiendo.
// Un solo hilo por cuenta (no por negocio) — support_messages.user_id.
router.get('/:slug/messages', requireAuth, async (req, res) => {
  const { error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const [messages] = await pool.query(
    'SELECT id, sender, body, created_at FROM support_messages WHERE user_id = ? ORDER BY id',
    [req.user.id]
  );
  // Al abrir el chat, se dan por leídos los mensajes del admin — así el
  // punto de "sin leer" del panel de negocio desaparece.
  await pool.query(
    "UPDATE support_messages SET read_at = NOW() WHERE user_id = ? AND sender = 'admin' AND read_at IS NULL",
    [req.user.id]
  );
  res.json(messages.map(m => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.created_at })));
});

router.post('/:slug/messages', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const message = String(req.body.message || '').trim().slice(0, 3000);
  if (!message) return res.status(400).json({ error: 'Escribe tu mensaje' });

  await pool.query(
    "INSERT INTO support_messages (user_id, sender, body) VALUES (?, 'user', ?)",
    [req.user.id, message]
  );

  // Aviso por correo a Bukea, igual que el ticket anterior — así Víctor no
  // depende de estar viendo el panel de admin para enterarse de un mensaje
  // nuevo. Si el correo falla, el mensaje ya quedó guardado en el hilo.
  const [[full]] = await pool.query('SELECT business_name FROM professionals WHERE id = ?', [professional.id]);
  try {
    await mailer.sendTicket({
      businessName: full.business_name,
      slug: req.params.slug,
      fromName: req.user.name,
      fromEmail: req.user.email,
      message,
    });
  } catch (err) {
    console.error('No se pudo avisar por correo del mensaje de soporte:', err.message);
  }
  res.json({ sent: true });
});

module.exports = router;
