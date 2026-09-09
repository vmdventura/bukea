const express = require('express');
const path = require('path');
const pool = require('../db/pool');
const { requireAuth } = require('../lib/auth-middleware');
const { receiptUpload, receiptUrl, RECEIPTS_DIR, sniffFileType, ALLOWED_MIME } = require('../lib/uploads');
const fs = require('fs');
const { getSettings } = require('../lib/settings');
const push = require('../lib/push');
const { wrapAsyncRouter } = require('../lib/async-router');
const {
  nowInSantoDomingo, weekdayOf, dayLabel, formatTime12h, timeToMinutes, computeFreeSlots,
} = require('../lib/availability');

const router = wrapAsyncRouter(express.Router());

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
    'SELECT id, name, price_cents, duration_min FROM services WHERE id = ? AND professional_id = ? AND archived_at IS NULL',
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
    'SELECT name, business_name, neighborhood, lat, lng, owner_user_id FROM professionals WHERE id = ?',
    [professionalId]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  // Revalida contra el horario real, el colchón de antelación y las citas ya
  // tomadas — nunca confiar en que el horario que mandó el cliente sigue
  // libre (pudo cambiar entre que cargó la pantalla y que dio "Confirmar").
  // Antes solo se comprobaba que cupiera dentro del horario del día: dos
  // servicios con horas de inicio distintas pero que se solapan en el medio
  // (ej. 45 min a las 9:00 y 30 min a las 9:15) pasaban los dos porque
  // UNIQUE(professional_id, appointment_at) solo bloquea el mismo minuto
  // exacto. Ahora se exige que la hora pedida sea uno de los huecos que
  // realmente devuelve el cálculo de disponibilidad (mismo computeFreeSlots
  // que usan los endpoints GET), así el solapamiento y el colchón de
  // antelación se aplican también aquí, no solo en lo que muestra la UI.
  const [hoursRows] = await pool.query(
    'SELECT start_time, end_time FROM professional_hours WHERE professional_id = ? AND weekday = ?',
    [professionalId, weekdayOf(date)]
  );
  const startMin = timeToMinutes(time);
  const { date: today, minutes: nowMinutes } = nowInSantoDomingo();
  const isToday = date === today;

  if (date < today || (isToday && startMin < nowMinutes)) {
    return res.status(409).json({ error: 'Esa hora ya pasó, elige otra' });
  }

  const { bookingSlotMin, bookingBufferMin } = await getSettings();
  const appointmentAt = `${date} ${time}:00`;

  // Reserva atómica (revisión externa 2026-09-08): antes se leía la
  // disponibilidad y se insertaba en dos pasos sueltos del pool — dos
  // clientes pidiendo horarios distintos que se solapan (ej. 45 min a las
  // 9:00 y 30 min a las 9:15) podían pasar los dos la comprobación al mismo
  // tiempo, porque el UNIQUE solo bloquea el mismo minuto exacto, no el
  // solape. Una sola conexión, en transacción, con FOR UPDATE sobre las
  // citas del día del negocio, serializa a cualquier otra reserva del mismo
  // profesional que intente correr en paralelo — la segunda espera a que la
  // primera confirme (o falle) antes de leer "libre".
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [busyRows] = await conn.query(
      `SELECT appointment_at, duration_min FROM bookings
       WHERE professional_id = ? AND status = 'confirmed' AND appointment_at BETWEEN ? AND ?
       FOR UPDATE`,
      [professionalId, `${date} 00:00:00`, `${date} 23:59:59`]
    );
    const busyRanges = busyRows.map(b => {
      const busyStart = timeToMinutes(b.appointment_at.slice(11, 16));
      return { startMin: busyStart, endMin: busyStart + (b.duration_min || 30) };
    });

    const freeSlots = computeFreeSlots({
      hoursRows, durationMin: service.duration_min, busyRanges, isToday, nowMinutes,
      slotMin: bookingSlotMin, bufferMin: bookingBufferMin,
    });
    if (!freeSlots.includes(startMin)) {
      await conn.rollback();
      return res.status(409).json({ error: 'Ese horario ya no está disponible, elige otro' });
    }

    // service_name/price_cents (revisión externa 2026-09-08): foto del
    // servicio al momento de reservar, para que "Mi Cuadre" y el historial
    // no cambien de valor si el negocio edita el precio después. Ver
    // db/init.js (migración) y GET /:slug/bookings, GET /:slug/stats.
    const [result] = await conn.query(
      `INSERT INTO bookings
         (professional_id, service_id, collaborator_id, client_user_id, client_name, day_label, time_label,
          appointment_at, duration_min, service_name, price_cents, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        professionalId, serviceId, collaboratorId || null, req.user.id, clientName,
        dayLabel(date), formatTime12h(time),
        appointmentAt, service.duration_min, service.name, service.price_cents, paymentMethod,
      ]
    );

    await conn.commit();

    // Avisa al dueño del negocio (2026-09-06). No se espera (await) a
    // propósito: si el envío de la notificación falla o tarda, la reserva
    // ya quedó guardada y el cliente no debe notarlo — sendToUser() nunca
    // lanza, pero por si acaso el .catch() es la última red de seguridad.
    push.sendToUser(professional.owner_user_id, {
      title: 'Nueva reserva',
      body: `${clientName} reservó ${service.name} el ${dayLabel(date)} a las ${formatTime12h(time)}`,
      data: { type: 'booking_created', bookingId: result.insertId },
    }).catch(err => console.error('Error notificando la reserva:', err.message));

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
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Alguien acaba de tomar ese horario, elige otro' });
    }
    throw err;
  } finally {
    conn.release();
  }
});

// "Mis citas" del cliente, leídas del servidor por su sesión — antes vivían
// solo en localStorage y se perdían al cambiar de teléfono o de dispositivo.
router.get('/me', requireAuth, async (req, res) => {
  const [bookings] = await pool.query(
    `SELECT b.id, b.status, b.payment_method, b.appointment_at, b.day_label, b.time_label, b.receipt_path,
            p.name AS professional_name, p.business_name, p.slug AS professional_slug,
            p.neighborhood, p.lat, p.lng,
            COALESCE(b.service_name, s.name) AS service_name, COALESCE(b.price_cents, s.price_cents) AS price_cents,
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
      receiptUrl: receiptUrl(req, b.id, b.receipt_path),
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
// Autorización antes de multer (2026-09-08): antes multer escribía el
// archivo en disco antes de comprobar que quien sube es el cliente dueño de
// la cita — una petición ajena dejaba el archivo persistido aunque la
// respuesta terminara en 403. Ahora la cita y su dueño se comprueban primero.
router.post('/:id/receipt', requireAuth, async (req, res, next) => {
  const [rows] = await pool.query('SELECT client_user_id FROM bookings WHERE id = ?', [req.params.id]);
  const booking = rows[0];
  if (!booking) return res.status(404).json({ error: 'Cita no encontrada' });
  if (booking.client_user_id !== req.user.id) {
    return res.status(403).json({ error: 'No puedes adjuntar un comprobante a esta cita' });
  }
  receiptUpload.single('receipt')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo del comprobante' });

    const realType = await sniffFileType(req.file.path);
    if (!realType || !ALLOWED_MIME.has(realType)) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'El archivo no es una imagen (JPG, PNG, WEBP) o PDF válido' });
    }

    await pool.query(
      'UPDATE bookings SET receipt_path = ?, receipt_uploaded_at = NOW() WHERE id = ?',
      [req.file.filename, req.params.id]
    );
    res.json({ id: Number(req.params.id), receiptUrl: receiptUrl(req, req.params.id, req.file.filename) });
  });
});

// Servir el archivo del comprobante (revisión externa 2026-09-08): antes
// vivía bajo public/uploads/receipts, servido por express.static sin
// autenticación — cualquiera con la URL (nombre de archivo difícil de
// adivinar, pero no imposible, y URLs quedan en logs/historial) podía verlo.
// Un comprobante de pago es información sensible; ahora exige sesión y solo
// se sirve al cliente dueño de la cita o al dueño del negocio. RECEIPTS_DIR
// vive fuera de public/ (ver lib/uploads.js), así que ya no hay ruta pública
// que lo alcance sin pasar por aquí.
router.get('/:id/receipt-file', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.receipt_path, b.client_user_id, p.owner_user_id
     FROM bookings b JOIN professionals p ON p.id = b.professional_id
     WHERE b.id = ?`,
    [req.params.id]
  );
  const booking = rows[0];
  if (!booking || !booking.receipt_path) return res.status(404).json({ error: 'Comprobante no encontrado' });
  if (booking.client_user_id !== req.user.id && booking.owner_user_id !== req.user.id) {
    return res.status(403).json({ error: 'No tienes acceso a este comprobante' });
  }
  res.sendFile(path.join(RECEIPTS_DIR, booking.receipt_path));
});

module.exports = router;
