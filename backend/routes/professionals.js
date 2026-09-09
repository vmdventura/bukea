const express = require('express');
const fs = require('fs');
const pool = require('../db/pool');
const { insertDefaultHours } = require('../lib/hours');
const { requireAuth } = require('../lib/auth-middleware');
const {
  receiptUrl, logoUpload, logoUrl, photoUpload, photoUrl,
  sniffFileType, IMAGE_MIME: IMAGE_MIME_SET,
} = require('../lib/uploads');
const { geocodeNeighborhood, geocodeAddress } = require('../lib/geocode');
const rateLimit = require('../lib/rate-limit');
const { getSettings } = require('../lib/settings');
const { loadBusinesses } = require('../lib/session-payload');
const { normalizeSocial } = require('../lib/social');
const { FOUNDING_FREE_LIMIT } = require('../views/shared');
const mailer = require('../lib/mailer');
const push = require('../lib/push');
const {
  nowInSantoDomingo, weekdayOf, dayLabel, addDays,
  timeToMinutes, minutesToHHMM, formatTime12h, computeFreeSlots,
} = require('../lib/availability');
const { wrapAsyncRouter } = require('../lib/async-router');

const router = wrapAsyncRouter(express.Router());

// Requisito de verificación (2026-09-08) para aparecer en las listas del
// marketplace (este endpoint, y las páginas públicas en routes/pages.js) —
// nunca en GET /:slug (el perfil directo sigue vivo aunque falte algo).
// Duplicado a propósito en los dos archivos (mismo criterio que
// directionLinks en lib/geocode.js): son consultas SQL independientes, no
// vale la pena una capa de indirección para una condición de una línea.
const VISIBLE_IN_MARKETPLACE_SQL = `(
  verification_required = 0
  OR (
    logo_path IS NOT NULL
    AND owner_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users u WHERE u.id = professionals.owner_user_id
        AND u.email_verified_at IS NOT NULL AND u.phone_verified_at IS NOT NULL
    )
  )
)`;

router.get('/', async (req, res) => {
  const { category } = req.query;
  const params = [];
  let sql = `SELECT * FROM professionals WHERE hidden_at IS NULL AND ${VISIBLE_IN_MARKETPLACE_SQL}`;
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
      `SELECT professional_id, name FROM services WHERE professional_id IN (?) AND archived_at IS NULL ORDER BY id`,
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
  const businesses = await loadBusinesses(req.user.id);
  // `slug` se conserva para builds instalados que solo leen ese campo
  // (primer negocio, igual que antes); `businesses` es aditivo.
  res.json({ slug: businesses[0] ? businesses[0].slug : null, businesses });
});

const VALID_CATEGORIES = ['barberia', 'unas', 'salon', 'maquillaje', 'cejas-mua', 'pilates', 'entrenador', 'peluqueria-canina', 'spa', 'trenzas', 'tatuadores', 'servicios-profesionales'];

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

// Alta de negocio (2026-09-08: reescrito para ser transaccional e
// idempotente — antes un doble toque, un reintento tras timeout o dos
// pestañas del mismo dueño podían crear dos negocios; GET /me solo
// devuelve el primero, así que el segundo quedaba huérfano en la práctica).
//
// Política elegida: "un negocio activo por dueño". `SELECT ... FOR UPDATE`
// sobre la fila de `users` sirve de mutex — dos POST concurrentes del
// mismo usuario se serializan; el segundo, al ver que ya existe un
// negocio, no crea nada y devuelve el existente. No se agrega UNIQUE a
// `owner_user_id` (la guía pide no hacerlo sin revisar antes datos y
// política de varios negocios) ni tabla de Idempotency-Key: no hace falta
// para "un negocio por dueño", y si el proyecto habilita varios negocios
// más adelante, ahí sí se justifica esa segunda capa.
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

  const referral = REFERRAL_SOURCES.includes(referralSource) ? referralSource : null;

  const conn = await pool.getConnection();
  let professionalId = null;
  let slug = null;
  let existing = false;
  let neighborhoodToGeocode = null;
  try {
    await conn.beginTransaction();

    // Mutex por usuario: serializa dos altas concurrentes del mismo dueño
    // (doble toque, dos pestañas). No bloquea a otros usuarios distintos.
    await conn.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [req.user.id]);

    const [already] = await conn.query(
      'SELECT id, slug, neighborhood, lat FROM professionals WHERE owner_user_id = ? ORDER BY id LIMIT 1',
      [req.user.id]
    );
    if (already[0]) {
      // Cubre doble toque, reintento tras timeout y "la respuesta se
      // perdió pero el commit anterior sí ocurrió": el cliente reintenta
      // con el mismo payload y recibe el negocio que ya tiene, no un
      // negocio nuevo.
      professionalId = already[0].id;
      slug = already[0].slug;
      existing = true;
      await conn.commit();
      // Si el alta original falló al geocodificar (Nominatim caído/rate
      // limit), este reintento es la única oportunidad de sanarlo — antes
      // el negocio se quedaba sin pin para siempre hasta el backfill de
      // arranque (revisión 2026-09-09).
      if (already[0].lat === null) neighborhoodToGeocode = already[0].neighborhood;
    } else {
      slug = slugify(name) || 'profesional';
      const [taken] = await conn.query('SELECT slug FROM professionals WHERE slug LIKE ?', [slug + '%']);
      if (taken.some(r => r.slug === slug)) {
        let n = 2;
        while (taken.some(r => r.slug === slug + '-' + n)) n++;
        slug = slug + '-' + n;
      }

      // Primeros FOUNDING_FREE_LIMIT negocios reales, gratis de por vida.
      // Sigue sin lock global entre dueños distintos (solo esta fila de
      // `users` está bloqueada) — riesgo aceptado ya documentado, dos
      // altas de dueños distintos en el mismo instante podrían colar uno
      // de más en el cupo.
      const [[{ foundingCount }]] = await conn.query('SELECT COUNT(*) AS foundingCount FROM professionals WHERE founding_free = 1');
      const foundingFree = foundingCount < FOUNDING_FREE_LIMIT ? 1 : 0;

      const [result] = await conn.query(
        `INSERT INTO professionals (slug, category, name, business_name, neighborhood, rating, reviews_count, accepts_whatsapp, accepts_cash, owner_user_id, referral_source, founding_free, verification_required)
         VALUES (?, ?, ?, ?, ?, 0, 0, 1, 1, ?, ?, ?, 1)`,
        [slug, category, name, businessName, neighborhood, req.user.id, referral, foundingFree]
      );
      professionalId = result.insertId;

      for (const s of services) {
        await conn.query(
          'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
          [professionalId, s.name, Math.round(Number(s.durationMin)), Math.round(Number(s.priceCents))]
        );
      }

      await insertDefaultHours(professionalId, conn);

      // Una cuenta registrada como 'client' que crea un negocio pasa a
      // 'owner' en la misma transacción — antes se quedaba con la
      // etiqueta vieja para siempre (accountType nunca se actualizaba).
      await conn.query("UPDATE users SET account_type = 'owner' WHERE id = ?", [req.user.id]);

      await conn.commit();
      neighborhoodToGeocode = neighborhood;
    }
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  if (neighborhoodToGeocode) {
    // No bloquea la respuesta — Nominatim puede tardar 1-2s. Va después
    // del commit a propósito: si esto falla no debe tumbar el alta.
    geocodeNeighborhood(neighborhoodToGeocode).then(point => {
      if (point) {
        pool.query('UPDATE professionals SET lat = ?, lng = ? WHERE id = ?', [point.lat, point.lng, professionalId])
          .catch(err => console.error('No se pudo guardar la geocodificación:', err.message));
      }
    });
  }

  res.status(existing ? 200 : 201).json({ slug, existing });
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
    'SELECT id, name, duration_min, price_cents FROM services WHERE professional_id = ? AND archived_at IS NULL',
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
    // Absoluta con el dominio real (2026-09-08) — el panel de negocio corre
    // dentro de la app empaquetada (capacitor://localhost) o embebido en un
    // iframe de la SPA, ninguno de los dos tiene el dominio público en
    // window.location.origin. Mismo criterio que logoUrl/receiptUrl arriba.
    publicUrl: `${req.protocol}://${req.get('host')}/p/${professional.slug}`,
    // Solo dice si la regla APLICA a este negocio, no si ya la cumple (eso
    // depende de la verificación de correo/teléfono del dueño, que es
    // privada — el panel de negocio ya la tiene en GET /api/auth/session,
    // no hace falta duplicarla aquí). Público sin problema: no es dato
    // sensible, solo une bandera de configuración.
    verificationRequired: Boolean(professional.verification_required),
    // true = el dueño confirmó el pin a mano en el mapa; false = coordenada
    // aproximada por sector (geocodificación automática, puede no ser exacta).
    locationConfirmed: Boolean(professional.location_set_by_owner_at),
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
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: 'Selecciona un servicio válido' });
  }
  const [services] = await pool.query(
    'SELECT duration_min FROM services WHERE id = ? AND professional_id = ? AND archived_at IS NULL',
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
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: 'Selecciona un servicio válido' });
  }

  const [services] = await pool.query(
    'SELECT duration_min FROM services WHERE id = ? AND professional_id = ? AND archived_at IS NULL',
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
            COALESCE(b.service_name, s.name) AS service_name,
            COALESCE(b.price_cents, s.price_cents) AS price_cents,
            COALESCE(b.duration_min, s.duration_min) AS duration_min,
            c.name AS collaborator_name, u.phone AS client_phone
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     LEFT JOIN collaborators c ON c.id = b.collaborator_id
     LEFT JOIN users u ON u.id = b.client_user_id
     WHERE b.professional_id = ?
     ORDER BY COALESCE(b.appointment_at, b.created_at) DESC`,
    [professional.id]
  );

  res.json(
    bookings.map(b => ({
      id: b.id,
      clientName: b.client_name,
      clientPhone: b.client_phone || null,
      dayLabel: b.appointment_at ? dayLabel(b.appointment_at.slice(0, 10)) : b.day_label,
      timeLabel: b.appointment_at ? formatTime12h(b.appointment_at.slice(11, 16)) : b.time_label,
      appointmentAt: b.appointment_at,
      status: b.status,
      paymentMethod: b.payment_method,
      serviceName: b.service_name,
      priceCents: b.price_cents,
      durationMin: b.duration_min,
      createdAt: b.created_at,
      receiptUrl: receiptUrl(req, b.id, b.receipt_path),
      collaboratorName: b.collaborator_name || null,
    }))
  );

  // Badge del ícono (2026-09-09): el dueño acaba de ver su agenda completa
  // en esta misma respuesta, así que ya no hay reservas "pendientes de ver".
  // Marca la fecha y manda un push silencioso (sin sonido ni banner) para
  // que el número del ícono baje a 0 sin esperar la próxima reserva nueva.
  // Después de res.json() a propósito: no debe atrasar la respuesta al
  // dueño, y un fallo aquí no debe convertir la carga de la agenda en error.
  pool.query('UPDATE professionals SET bookings_seen_at = NOW(3) WHERE id = ?', [professional.id])
    .then(() => push.sendToUser(professional.owner_user_id, { badge: 0, silent: true }))
    .catch(err => console.error('Error limpiando el badge de la agenda:', err.message));
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
  // COALESCE(b.price_cents, s.price_cents) usa el precio del momento de la
  // reserva (revisión externa 2026-09-08); el JOIN a services solo queda
  // como respaldo para citas viejas anteriores a ese snapshot.
  const [[stats]] = await pool.query(
    `SELECT
       COUNT(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) = CURDATE() THEN 1 END) AS today_count,
       COALESCE(SUM(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) = CURDATE() THEN COALESCE(b.price_cents, s.price_cents) END), 0) AS today_cents,
       COUNT(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE() THEN 1 END) AS week_count,
       COALESCE(SUM(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE() THEN COALESCE(b.price_cents, s.price_cents) END), 0) AS week_cents,
       COUNT(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE() THEN 1 END) AS month_count,
       COALESCE(SUM(CASE WHEN DATE(COALESCE(b.appointment_at, b.created_at)) BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE() THEN COALESCE(b.price_cents, s.price_cents) END), 0) AS month_cents
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

// Valida coordenadas de verdad (2026-09-08) — antes solo se comprobaba
// Number.isFinite(Number(v)), que acepta booleanos (Number(true) === 1),
// arrays de un elemento (Number([5]) === 5) y strings vacíos truncados por
// Number('') === 0. Aquí solo pasan number o string estrictamente numérica,
// dentro del rango real de lat/lng. Devuelve null si no es válido.
function parseCoordinate(value, min, max) {
  if (typeof value === 'boolean' || value === null || value === undefined) return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const str = typeof value === 'string' ? value.trim() : String(value);
  if (str === '' || !/^-?\d+(\.\d+)?$/.test(str)) return null;
  const num = Number(str);
  if (!Number.isFinite(num) || num < min || num > max) return null;
  return Math.round(num * 1e7) / 1e7;
}

const WEEKDAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

async function findOwnedProfessional(slug, userId) {
  const [rows] = await pool.query('SELECT id, owner_user_id FROM professionals WHERE slug = ?', [slug]);
  const professional = rows[0];
  if (!professional) return { error: [404, 'Profesional no encontrado'] };
  if (professional.owner_user_id !== userId) return { error: [403, 'No tienes acceso a este negocio'] };
  return { professional };
}

// Middleware de propiedad (2026-09-08) — usado en logo/fotos, donde antes
// multer escribía el archivo en disco ANTES de comprobar que quien sube es
// el dueño del negocio: una petición ajena con un slug cualquiera dejaba el
// archivo persistido (y, para logo/fotos, servido públicamente por
// express.static) aunque la respuesta terminara en 403. Colgar esta
// comprobación antes del middleware de multer en la cadena de la ruta
// cierra ese hueco: nada se escribe a disco si la autorización falla.
function requireOwnedProfessional(req, res, next) {
  findOwnedProfessional(req.params.slug, req.user.id)
    .then(({ professional, error }) => {
      if (error) return res.status(error[0]).json({ error: error[1] });
      req.professional = professional;
      next();
    })
    .catch(next);
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

  // Solo re-geocodifica si el dueño nunca confirmó un pin a mano (ver
  // location_set_by_owner_at, PUT /:slug/location) — antes esto pisaba
  // cualquier pin exacto ya guardado con solo editar el texto del sector.
  const [[locState]] = await pool.query(
    'SELECT location_set_by_owner_at FROM professionals WHERE id = ?', [professional.id]
  );
  if (before.neighborhood !== neighborhood && !locState.location_set_by_owner_at) {
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
router.post('/:slug/logo', requireAuth, requireOwnedProfessional, (req, res) => {
  logoUpload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });

    const realType = await sniffFileType(req.file.path);
    if (!realType || !IMAGE_MIME_SET.has(realType)) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'El archivo no es una imagen JPG, PNG o WEBP válida' });
    }

    await pool.query('UPDATE professionals SET logo_path = ? WHERE id = ?', [req.file.filename, req.professional.id]);
    res.json({ logoUrl: logoUrl(req, req.file.filename) });
  });
});

// Redes sociales (2026-08-25; normalizadas y validadas desde 2026-09-08 —
// antes se guardaban tal cual, sin validar formato ni esquema, lo que
// permitía colar `javascript:`/`data:` en "website"). Acepta handle, `@handle`
// o URL completa; guarda el handle (o la URL canónica en website).
router.put('/:slug/social', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const { value, errors } = normalizeSocial(req.body);
  if (Object.keys(errors).length > 0) {
    const [field, message] = Object.entries(errors)[0];
    return res.status(400).json({ error: message, field });
  }

  await pool.query(
    'UPDATE professionals SET social_instagram = ?, social_facebook = ?, social_tiktok = ?, social_website = ? WHERE id = ?',
    [value.instagram, value.facebook, value.tiktok, value.website, professional.id]
  );
  res.json({ saved: true, ...value });
});

// Ubicación exacta en el mapa (2026-08-25) — el registro solo geocodifica el
// sector (ver lib/geocode.js), así que el pin puede quedar impreciso. Aquí
// el dueño lo arrastra en el mapa de "Mi negocio" y guarda coordenadas
// exactas. `location_set_by_owner_at` (2026-09-08) marca que este pin es
// del dueño, para que PUT /:slug/profile deje de pisarlo al re-geocodificar.
router.put('/:slug/location', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const lat = parseCoordinate(req.body.lat, -90, 90);
  const lng = parseCoordinate(req.body.lng, -180, 180);
  if (lat === null || lng === null) {
    return res.status(400).json({ error: 'Coordenadas inválidas' });
  }

  await pool.query(
    'UPDATE professionals SET lat = ?, lng = ?, location_set_by_owner_at = NOW() WHERE id = ?',
    [lat, lng, professional.id]
  );
  res.json({ saved: true, lat, lng });
});

// Centrar el mapa por provincia + sector (2026-09-09, a pedido de Víctor):
// "ingresa las coordenadas" era difícil de usar para público no técnico —
// esto solo ubica el pin para que el dueño lo ajuste y confirme con
// PUT .../location (arriba); no guarda nada por sí solo. Limitado a 20
// solicitudes/hora por dueño porque cada llamada consume una solicitud a
// Nominatim (máx. 1/segundo permitido por su política de uso, ver
// lib/geocode.js) — un dueño ajustando su ubicación no necesita más que
// eso en una sesión normal.
router.post('/:slug/geocode-preview', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const wait = rateLimit.hit([{ key: 'geocode-preview:' + req.user.id, max: 20, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 }]);
  if (wait) return res.status(429).json({ error: rateLimit.waitMessage(wait) });

  const sector = String(req.body.sector || '').trim();
  const province = String(req.body.province || '').trim();
  if (!sector || !province) return res.status(400).json({ error: 'Selecciona provincia y sector' });

  const coords = await geocodeAddress(sector, province);
  if (!coords) return res.status(404).json({ error: 'No pudimos ubicar ese sector, ajusta el pin a mano' });
  res.json(coords);
});

// Galería de fotos del negocio (2026-08-25) — 0..N fotos, cada una se sube y
// se borra individualmente (a diferencia del logo, que es un solo slot).
router.post('/:slug/photos', requireAuth, requireOwnedProfessional, (req, res) => {
  photoUpload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });

    const realType = await sniffFileType(req.file.path);
    if (!realType || !IMAGE_MIME_SET.has(realType)) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'El archivo no es una imagen JPG, PNG o WEBP válida' });
    }

    const [result] = await pool.query(
      'INSERT INTO business_photos (professional_id, path) VALUES (?, ?)',
      [req.professional.id, req.file.filename]
    );
    res.status(201).json({ id: result.insertId, url: photoUrl(req, req.file.filename) });
  });
});

router.delete('/:slug/photos/:photoId', requireAuth, requireOwnedProfessional, async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM business_photos WHERE id = ? AND professional_id = ?',
    [req.params.photoId, req.professional.id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }
  res.json({ deleted: true });
});

// Servicios editables (2026-08-25). Hasta el 2026-09-08 este endpoint borraba
// y reinsertaba todos los servicios del negocio (mismo patrón que
// bank-accounts/collaborators) — pero a diferencia de esas dos tablas,
// bookings.service_id SÍ tiene una FK normal hacia services (sin ON DELETE),
// así que borrar un servicio con reservas asociadas rompía el guardado
// entero con un error de llave foránea. Ahora: los servicios que llegan con
// `id` se actualizan en su propia fila (conserva el id, así las reservas
// existentes lo siguen encontrando); los que no traen `id` (o no coincide
// con uno del negocio) se insertan nuevos; los que existían y ya no vienen
// en la lista se archivan (archived_at) en vez de borrarse — desaparecen del
// perfil público y de "elegir servicio" al reservar (ver los WHERE
// archived_at IS NULL en este archivo) pero siguen ahí para las reservas
// viejas que ya los referencian.
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
    const id = Number.isInteger(Number(s.id)) && Number(s.id) > 0 ? Number(s.id) : null;
    clean.push({ id, name, durationMin, priceCents });
  }
  if (clean.length === 0) {
    return res.status(400).json({ error: 'Agrega al menos un servicio válido' });
  }

  const [existingRows] = await pool.query('SELECT id FROM services WHERE professional_id = ?', [professional.id]);
  const existingIds = new Set(existingRows.map(r => r.id));
  const keptIds = new Set();

  for (const s of clean) {
    if (s.id && existingIds.has(s.id)) {
      keptIds.add(s.id);
      await pool.query(
        'UPDATE services SET name = ?, duration_min = ?, price_cents = ?, archived_at = NULL WHERE id = ? AND professional_id = ?',
        [s.name, s.durationMin, s.priceCents, s.id, professional.id]
      );
    } else {
      const [result] = await pool.query(
        'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
        [professional.id, s.name, s.durationMin, s.priceCents]
      );
      keptIds.add(result.insertId);
    }
  }

  const toArchive = existingRows.map(r => r.id).filter(id => !keptIds.has(id));
  if (toArchive.length > 0) {
    await pool.query('UPDATE services SET archived_at = NOW() WHERE id IN (?)', [toArchive]);
  }

  res.json({ saved: true, count: clean.length });
});

// Chat de soporte (2026-08-27) — reemplaza el "Abrir ticket" de una sola
// vía por un hilo real: el dueño escribe desde "Mi negocio", ve la
// respuesta del admin en la misma pantalla, y puede seguir escribiendo.
// Un solo hilo por cuenta (no por negocio) — support_messages.user_id.
// GET ya NO marca leído (2026-09-08) — antes cualquier lectura del hilo,
// incluido un polling oculto de badge, apagaba el punto de "sin leer" sin
// que el dueño hubiera visto nada. Marcar leído es ahora un paso explícito,
// ver POST /messages/read. `?after=<id>` permite traer solo lo nuevo.
router.get('/:slug/messages', requireAuth, async (req, res) => {
  const { error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const after = Number(req.query.after);
  const params = [req.user.id];
  let sql = 'SELECT id, sender, body, created_at FROM support_messages WHERE user_id = ?';
  if (Number.isInteger(after) && after > 0) {
    sql += ' AND id > ?';
    params.push(after);
  }
  sql += ' ORDER BY id';
  const [messages] = await pool.query(sql, params);
  res.json(messages.map(m => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.created_at })));
});

// Conteo de no leídos (2026-09-08) — para el badge del hub "Negocio", sin
// tener que abrir el hilo completo ni marcar nada como leído al consultarlo.
router.get('/:slug/messages/unread-count', requireAuth, async (req, res) => {
  const { error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const [[row]] = await pool.query(
    "SELECT COUNT(*) AS n FROM support_messages WHERE user_id = ? AND sender = 'admin' AND read_at IS NULL",
    [req.user.id]
  );
  res.json({ unread: Number(row.n) });
});

// Marcar leído (2026-09-08) — paso explícito, separado del GET: el
// frontend lo llama al abrir el chat con la pantalla visible, no en un
// intervalo de fondo.
router.post('/:slug/messages/read', requireAuth, async (req, res) => {
  const { error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  await pool.query(
    "UPDATE support_messages SET read_at = NOW() WHERE user_id = ? AND sender = 'admin' AND read_at IS NULL",
    [req.user.id]
  );
  res.json({ ok: true });
});

router.post('/:slug/messages', requireAuth, async (req, res) => {
  const { professional, error } = await findOwnedProfessional(req.params.slug, req.user.id);
  if (error) return res.status(error[0]).json({ error: error[1] });

  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Escribe tu mensaje' });
  // Rechazo explícito en vez de truncar en silencio (2026-09-08) — antes
  // un mensaje de más de 3000 caracteres se guardaba cortado sin avisar.
  if (message.length > 3000) {
    return res.status(400).json({ error: 'El mensaje no puede pasar de 3.000 caracteres' });
  }
  const clientKey = req.body.clientKey ? String(req.body.clientKey).slice(0, 64) : null;

  try {
    await pool.query(
      "INSERT INTO support_messages (user_id, sender, body, client_key) VALUES (?, 'user', ?, ?)",
      [req.user.id, message, clientKey]
    );
  } catch (err) {
    // Reintento con la misma clientKey (doble toque, respuesta perdida):
    // el mensaje ya está guardado de un intento anterior, no se duplica.
    if (err.code === 'ER_DUP_ENTRY' && clientKey) {
      return res.json({ sent: true, duplicate: true });
    }
    throw err;
  }

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
