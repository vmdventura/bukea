const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const IGNORABLE_ALTER_ERRORS = new Set([
  'ER_DUP_FIELDNAME', // la columna ya existe
  'ER_DUP_KEYNAME',   // el índice/UNIQUE ya existe
  'ER_FK_DUP_NAME',   // la llave foránea ya existe
]);

async function safeAlter(sql) {
  try {
    await pool.query(sql);
  } catch (err) {
    if (!IGNORABLE_ALTER_ERRORS.has(err.code)) throw err;
  }
}

// Login con Google/Apple (2026-08-22): el teléfono y el PIN dejan de ser
// obligatorios porque una cuenta puede nacer solo con proveedor social.
async function migrate() {
  await safeAlter(
    "ALTER TABLE professionals ADD COLUMN category VARCHAR(30) NOT NULL DEFAULT 'barberia'"
  );

  await pool.query('ALTER TABLE users MODIFY phone VARCHAR(15) NULL');
  await pool.query('ALTER TABLE users MODIFY pin_salt VARCHAR(40) NULL');
  await pool.query('ALTER TABLE users MODIFY pin_hash VARCHAR(80) NULL');
  await safeAlter('ALTER TABLE users ADD COLUMN email VARCHAR(190)');
  await safeAlter('ALTER TABLE users ADD COLUMN google_sub VARCHAR(255)');
  await safeAlter('ALTER TABLE users ADD COLUMN apple_sub VARCHAR(255)');
  await safeAlter('ALTER TABLE users ADD UNIQUE INDEX idx_users_google_sub (google_sub)');
  await safeAlter('ALTER TABLE users ADD UNIQUE INDEX idx_users_apple_sub (apple_sub)');

  await safeAlter('ALTER TABLE professionals ADD COLUMN owner_user_id INT');
  await safeAlter(
    'ALTER TABLE professionals ADD CONSTRAINT fk_professionals_owner ' +
    'FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL'
  );
}

async function seedProfessional({ slug, category, name, businessName, neighborhood, rating, reviewsCount, services }) {
  const [existing] = await pool.query('SELECT id FROM professionals WHERE slug = ?', [slug]);
  if (existing.length > 0) return;

  const [result] = await pool.query(
    `INSERT INTO professionals (slug, category, name, business_name, neighborhood, rating, reviews_count, accepts_whatsapp, accepts_cash)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
    [slug, category, name, businessName, neighborhood, rating, reviewsCount]
  );
  const professionalId = result.insertId;

  for (const [svcName, duration, priceCents] of services) {
    await pool.query(
      'INSERT INTO services (professional_id, name, duration_min, price_cents) VALUES (?, ?, ?, ?)',
      [professionalId, svcName, duration, priceCents]
    );
  }
}

async function ensureReady() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }

  await migrate();

  await seedProfessional({
    slug: 'joel-el-fino',
    category: 'barberia',
    name: 'Joel "El Fino" Batista',
    businessName: 'Barbería El Nítido',
    neighborhood: 'Villa Consuelo',
    rating: 4.9,
    reviewsCount: 312,
    services: [
      ['Corte clásico', 30, 40000],
      ['Corte + barba', 45, 60000],
      ['Diseño / cerquillo especial', 50, 70000],
    ],
  });

  await seedProfessional({
    slug: 'yesenia-rodriguez',
    category: 'unas',
    name: 'Yesenia Rodríguez',
    businessName: 'Yess Nails Studio',
    neighborhood: 'Villa Consuelo',
    rating: 4.8,
    reviewsCount: 198,
    services: [
      ['Acrílicas', 60, 90000],
      ['Encapsuladas', 75, 110000],
      ['Arte / diseño a mano', 30, 30000],
    ],
  });

  await seedProfessional({
    slug: 'carmen-la-estilista',
    category: 'salon',
    name: 'Carmen la Estilista',
    businessName: 'Salón Carmen',
    neighborhood: 'Villa Consuelo',
    rating: 4.9,
    reviewsCount: 421,
    services: [
      ['Desrizado', 120, 250000],
      ['Tubi', 90, 150000],
      ['Plancha', 45, 80000],
    ],
  });
}

module.exports = { ensureReady };
