const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../lib/auth-middleware');
const { receiptUpload, receiptUrl } = require('../lib/uploads');
const {
  nowInSantoDomingo, weekdayOf, dayLabel, formatTime12h, timeToMinutes,
} = require('../lib/availability');

const router = express.Router();

// Reservar ahora exige sesión (el frontend ya la pide en el paso de
// confirmar) — permite guardar quién reservó y que "Mis citas" se lea del
// servidor en vez de localStorage.
router.post('/', requireAuth, async (req, res) => {
  const { professionalId, serviceId, date, time, paymentMethod, collaboratorId } = req.body;
  const clientName = req.user.name;

  if (!professionalId || !serviceId || !date || !time || !paymentMethod) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ error: 'Fecha u hora inválida' });
  }

  const [services] = await pool.query(
    'SELECT id, name, price_cents, duration_min FROM services WHERE id = ? AND professional_id = ?',
    [serviceId, professionalId]
  );
  const service = services[0];
  if (!service) {
    return res.status(404).json({ error: 'Servicio no encontrado para ese profesional' });
  }

  // collaboratorId es opcional (null/ausente = lo atiende el titular). Si
  // viene, debe pertenecer al mismo negocio — evita colar el id de un
  // colaborador de otro profesional.
  let collaboratorName = null;
  if (collaboratorId) {
    const [collaboratorRows] = await pool.query(
      'SELECT name FROM collaborators WHERE id = ? AND professional_id = ?',
      [collaboratorId, professionalId]
    );
    if (!collaboratorRows[0]) {
      return res.status(400).json({ error: 'Ese colaborador no pertenece a este negocio' });
    }
    collaboratorName = collaboratorRows[0].name;
  }

  const [professionals] = await pool.query(
    'SELECT name, business_name, neighborhood, lat, lng FROM professionals WHERE id = ?',
    [professionalId]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  // Revalida contra el horario real y las citas ya tomadas — nunca confiar
  // en que el horario que mandó el cliente sigue libre (pudo cambiar entre
  // que cargó la pantalla y que dio "Confirmar").
  const [hoursRows] = await pool.query(
    'SELECT start_time, end_time FROM professional_hours WHERE professional_id = ? AND weekday = ?',
    [professionalId, weekdayOf(date)]
  );
  const startMin = timeToMinutes(time);
  const withinHours = hoursRows.some(
    h => startMin >= timeToMinutes(h.start_time) && startMin + service.duration_min <= timeToMinutes(h.end_time)
  );
  if (!withinHours) {
    return res.status(409).json({ error: 'Ese horario ya no está disponible — elige otro' });
  }

  const { date: today, minutes: nowMinutes } = nowInSantoDomingo();
  if (date < today || (date === today && startMin <= nowMinutes)) {
    return res.status(409).json({ error: 'Esa hora ya pasó — elige otra' });
  }

  const appointmentAt = `${date} ${time}:00`;

  try {
    const [result] = await pool.query(
      `INSERT INTO bookings
         (professional_id, service_id, collaborator_id, client_user_id, client_name, day_label, time_label,
          appointment_at, duration_min, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        professionalId, serviceId, collaboratorId || null, req.user.id, clientName,
        dayLabel(date), formatTime12h(time),
        appointmentAt, service.duration_min, paymentMethod,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      professionalName: professional.name,
      businessName: professional.business_name,
      neighborhood: professional.neighborhood,
      lat: professional.lat !== null ? Number(professional.lat) : null,
      lng: professional.lng !== null ? Number(professional.lng) : null,
      serviceName: service.name,
      priceCents: service.price_cents,
      dayLabel: dayLabel(date),
      timeLabel: formatTime12h(time),
      paymentMethod,
      collaboratorName,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Alguien acaba de tomar ese horario — elige otro' });
    }
    throw err;
  }
});

// "Mis citas" del cliente, leídas del servidor por su sesión — antes vivían
// solo en localStorage y se perdían al cambiar de teléfono o de dispositivo.
router.get('/me', requireAuth, async (req, res) => {
  const [bookings] = await pool.query(
    `SELECT b.id, b.status, b.payment_method, b.appointment_at, b.day_label, b.time_label, b.receipt_path,
            p.name AS professional_name, p.business_name, p.slug AS professional_slug,
            p.neighborhood, p.lat, p.lng,
            s.name AS service_name, s.price_cents,
            c.name AS collaborator_name
     FROM bookings b
     JOIN professionals p ON p.id = b.professional_id
     JOIN services s ON s.id = b.service_id
     LEFT JOIN collaborators c ON c.id = b.collaborator_id
     WHERE b.client_user_id = ?
     ORDER BY COALESCE(b.appointment_at, b.created_at) DESC`,
    [req.user.id]
  );

  res.json(
    bookings.map(b => ({
      id: b.id,
      status: b.status,
      professionalName: b.professional_name,
      professionalSlug: b.professional_slug,
      businessName: b.business_name,
      neighborhood: b.neighborhood,
      lat: b.lat !== null ? Number(b.lat) : null,
      lng: b.lng !== null ? Number(b.lng) : null,
      serviceName: b.service_name,
      priceCents: b.price_cents,
      paymentMethod: b.payment_method,
      dayLabel: b.appointment_at ? dayLabel(b.appointment_at.slice(0, 10)) : b.day_label,
      timeLabel: b.appointment_at ? formatTime12h(b.appointment_at.slice(11, 16)) : b.time_label,
      isPast: b.appointment_at ? b.appointment_at < nowInSantoDomingo().date + ' 00:00:00' : false,
      receiptUrl: receiptUrl(req, b.receipt_path),
      collaboratorName: b.collaborator_name || null,
    }))
  );
});

// Cancelar una cita — la puede cancelar el cliente que la hizo o el dueño
// del negocio (mismo endpoint sirve al panel "Mi negocio" y a "Mis citas").
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.client_user_id, p.owner_user_id
     FROM bookings b
     JOIN professionals p ON p.id = b.professional_id
     WHERE b.id = ?`,
    [req.params.id]
  );
  const booking = rows[0];
  if (!booking) return res.status(404).json({ error: 'Cita no encontrada' });

  const isClient = booking.client_user_id === req.user.id;
  const isOwner = booking.owner_user_id === req.user.id;
  if (!isClient && !isOwner) {
    return res.status(403).json({ error: 'No puedes cancelar esta cita' });
  }

  await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ id: Number(req.params.id), status: 'cancelled' });
});

// Comprobante de pago (2026-08-22 noche) — el cliente que pagó por
// transferencia adjunta la foto/PDF del comprobante, en el momento de
// reservar o después desde "Mis citas". Solo el cliente dueño de la cita
// puede subirlo (no el negocio — el negocio solo lo ve).
router.post('/:id/receipt', requireAuth, (req, res) => {
  receiptUpload.single('receipt')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const [rows] = await pool.query('SELECT client_user_id FROM bookings WHERE id = ?', [req.params.id]);
    const booking = rows[0];
    if (!booking) return res.status(404).json({ error: 'Cita no encontrada' });
    if (booking.client_user_id !== req.user.id) {
      return res.status(403).json({ error: 'No puedes adjuntar un comprobante a esta cita' });
    }
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo del comprobante' });

    await pool.query(
      'UPDATE bookings SET receipt_path = ?, receipt_uploaded_at = NOW() WHERE id = ?',
      [req.file.filename, req.params.id]
    );
    res.json({ id: Number(req.params.id), receiptUrl: receiptUrl(req, req.file.filename) });
  });
});

module.exports = router;
