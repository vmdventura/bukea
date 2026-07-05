const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function ensureReady() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }

  const [existing] = await pool.query('SELECT id FROM professionals WHERE slug = ?', ['joel-el-fino']);
  if (existing.length > 0) return;

  const [result] = await pool.query(
    `INSERT INTO professionals (slug, name, business_name, neighborhood, rating, reviews_count, accepts_whatsapp, accepts_cash)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
    ['joel-el-fino', 'Joel "El Fino" Batista', 'Barbería El Nítido', 'Villa Consuelo', 4.9, 312]
  );
  const professionalId = result.insertId;

  const services = [
    ['Corte clásico', 30, 40000],
    ['Corte + barba', 45, 60000],
    ['Diseño / cerquillo especial', 50, 70000],
  ];
  for (const [name, duration, priceCents] of services) {
    await pool.query(
      'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
      [professionalId, name, duration, priceCents]
    );
  }
  console.log('Profesional y servicios de prueba creados.');
}

module.exports = { ensureReady };
