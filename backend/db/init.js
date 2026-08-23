const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const { insertDefaultHours } = require('../lib/hours');
const { geocodeNeighborhood } = require('../lib/geocode');

const IGNORABLE_ALTER_ERRORS = new Set([
  'ER_DUP_FIELDNAME', // la columna ya existe
  'ER_DUP_KEYNAME',   // el índice/UNIQUE ya existe
  'ER_FK_DUP_NAME',   // la llave foránea ya existe
]);

// Algunas versiones de MySQL/MariaDB (visto en producción, 2026-08-23) no
// reportan una llave foránea ya existente como ER_FK_DUP_NAME, sino como
// ER_CANT_CREATE_TABLE con "errno: 121" incrustado en el mensaje — mismo
// caso (nombre de FK duplicado), solo que el motor lo envuelve distinto.
function isDuplicateForeignKey(err) {
  return err.code === 'ER_CANT_CREATE_TABLE' && err.errno === 1005 && /errno: 121/.test(err.sqlMessage || '');
}

async function safeAlter(sql) {
  try {
    await pool.query(sql);
  } catch (err) {
    if (!IGNORABLE_ALTER_ERRORS.has(err.code) && !isDuplicateForeignKey(err)) throw err;
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

  // Fechas y horas reales (2026-08-22): day_label/time_label eran texto
  // libre ("Hoy", "Mañana"); appointment_at pasa a ser la fuente de verdad
  // y day_label/time_label se calculan a partir de él en cada respuesta.
  await safeAlter('ALTER TABLE bookings ADD COLUMN client_user_id INT');
  await safeAlter('ALTER TABLE bookings ADD COLUMN appointment_at DATETIME');
  await safeAlter('ALTER TABLE bookings ADD COLUMN duration_min INT');
  await safeAlter("ALTER TABLE bookings ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'confirmed'");
  await safeAlter(
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_client ' +
    'FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE SET NULL'
  );
  await safeAlter('ALTER TABLE bookings ADD UNIQUE INDEX uq_bookings_slot (professional_id, appointment_at)');

  // Cuentas bancarias + comprobante de pago (2026-08-22 noche)
  await safeAlter('ALTER TABLE bookings ADD COLUMN receipt_path VARCHAR(255)');
  await safeAlter('ALTER TABLE bookings ADD COLUMN receipt_uploaded_at DATETIME');

  // Cédula/RNC del titular en cada cuenta bancaria (2026-08-23) — lo pide
  // el propio flujo dominicano de transferencia para verificar al
  // destinatario. DEFAULT '' evita romper filas ya sembradas sin este dato.
  await safeAlter("ALTER TABLE professional_bank_accounts ADD COLUMN cedula_rnc VARCHAR(20) NOT NULL DEFAULT ''");

  // Búsqueda por mapa (2026-08-23, Leaflet/OpenStreetMap — decisión de
  // Víctor). Coordenadas a nivel de barrio: el registro solo pide "sector",
  // no dirección exacta.
  await safeAlter('ALTER TABLE professionals ADD COLUMN lat DECIMAL(10,7)');
  await safeAlter('ALTER TABLE professionals ADD COLUMN lng DECIMAL(10,7)');

  // Colaboradores/equipo (2026-08-23) — negocios con más de una persona
  // reservable (salones), adelantando parte de la Fase 2 a pedido de Víctor.
  await safeAlter('ALTER TABLE bookings ADD COLUMN collaborator_id INT');
  await safeAlter(
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_collaborator ' +
    'FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE SET NULL'
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

  await insertDefaultHours(professionalId);
}

// Profesionales creados antes de que existiera professional_hours (o
// sembrados por seedProfessional en una corrida anterior) se quedarían sin
// disponibilidad — les asigna el horario por defecto si no tienen ninguno.
async function backfillMissingHours() {
  const [rows] = await pool.query(
    `SELECT p.id FROM professionals p
     LEFT JOIN professional_hours h ON h.professional_id = p.id
     WHERE h.id IS NULL`
  );
  for (const row of rows) {
    await insertDefaultHours(row.id);
  }
}

// Profesionales sin coordenadas (sembrados antes de que existiera el mapa,
// o cuya geocodificación falló en su momento) — los ubica por su sector.
// Nominatim pide no más de 1 solicitud/segundo; como esto corre solo al
// arrancar el servidor y son pocos negocios, un pequeño respiro entre
// llamadas basta para respetarlo sin necesitar una cola.
async function backfillMissingCoordinates() {
  // Tope por arranque para no alargar el boot sin límite si hay muchos
  // negocios sin geocodificar todavía — el resto se completa en el próximo
  // reinicio del servidor.
  const [rows] = await pool.query(
    'SELECT id, neighborhood FROM professionals WHERE lat IS NULL OR lng IS NULL LIMIT 20'
  );
  for (const row of rows) {
    const point = await geocodeNeighborhood(row.neighborhood);
    if (point) {
      await pool.query('UPDATE professionals SET lat = ?, lng = ? WHERE id = ?', [point.lat, point.lng, row.id]);
    }
    await new Promise(resolve => setTimeout(resolve, 1100));
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

  await backfillMissingHours();
  await backfillMissingCoordinates();
}

module.exports = { ensureReady };
