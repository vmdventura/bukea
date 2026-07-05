const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.post('/', async (req, res) => {
  const { professionalId, serviceId, clientName, dayLabel, timeLabel, paymentMethod } = req.body;

  if (!professionalId || !serviceId || !clientName || !dayLabel || !timeLabel || !paymentMethod) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const [services] = await pool.query(
    'SELECT id, name, price_cents FROM services WHERE id = ? AND professional_id = ?',
    [serviceId, professionalId]
  );
  const service = services[0];
  if (!service) {
    return res.status(404).json({ error: 'Servicio no encontrado para ese profesional' });
  }

  const [professionals] = await pool.query(
    'SELECT name, business_name FROM professionals WHERE id = ?',
    [professionalId]
  );
  const professional = professionals[0];
  if (!professional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  const [result] = await pool.query(
    `INSERT INTO bookings (professional_id, service_id, client_name, day_label, time_label, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [professionalId, serviceId, clientName, dayLabel, timeLabel, paymentMethod]
  );

  res.status(201).json({
    id: result.insertId,
    professionalName: professional.name,
    businessName: professional.business_name,
    serviceName: service.name,
    priceCents: service.price_cents,
    dayLabel,
    timeLabel,
    paymentMethod,
  });
});

module.exports = router;
