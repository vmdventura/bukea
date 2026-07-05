const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

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

module.exports = router;
