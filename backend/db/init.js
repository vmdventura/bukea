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

  // Recuperar PIN por email (2026-08-23) — auth_codes servía solo para el
  // código de WhatsApp (phone obligatorio); ahora también guarda el código
  // de "olvidé mi PIN" por email, así que phone pasa a ser opcional.
  await pool.query('ALTER TABLE auth_codes MODIFY phone VARCHAR(15) NULL');
  await safeAlter('ALTER TABLE auth_codes ADD COLUMN email VARCHAR(190)');
  await safeAlter('ALTER TABLE auth_codes ADD INDEX idx_auth_codes_email (email)');

  // Panel de administración general (2026-08-24). role distingue una cuenta
  // normal (client, default) de la del superadmin — se asigna a mano por
  // SQL, nunca desde la app (ver db/make-admin.js). disabled_at/hidden_at
  // son "ocultar sin borrar": una cuenta desactivada no puede iniciar
  // sesión (ver lib/auth-middleware.js y routes/auth.js), un negocio oculto
  // desaparece del marketplace público pero sigue existiendo en la base.
  await safeAlter("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'client'");
  await safeAlter('ALTER TABLE users ADD COLUMN disabled_at DATETIME');
  await safeAlter('ALTER TABLE professionals ADD COLUMN hidden_at DATETIME');

  // Atribución: cómo conoció Bukea el negocio (pregunta opcional del
  // asistente de registro, 2026-08-26 — dato para la validación de calle).
  await safeAlter('ALTER TABLE professionals ADD COLUMN referral_source VARCHAR(40)');

  // Fase 2 del panel de administración (2026-08-24): moderación, métricas,
  // comunicación y configuración.
  //
  // Moderación: verified_at en cada cuenta bancaria — un admin la revisa
  // (nombre y cédula/RNC coherentes con el negocio) y le da el badge de
  // verificada. No bloquea que se publique (el flujo del dueño no cambia),
  // solo cambia si el cliente la ve marcada como revisada.
  await safeAlter('ALTER TABLE professional_bank_accounts ADD COLUMN verified_at DATETIME');

  // Comunicación: registro de cada mensaje manual que un admin le manda a
  // un usuario desde su ficha (WhatsApp o correo), para saber qué se envió
  // y si falló.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS message_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      channel VARCHAR(20) NOT NULL,
      subject VARCHAR(190),
      body TEXT NOT NULL,
      status VARCHAR(20) NOT NULL,
      error_message VARCHAR(255),
      sent_by_admin_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (sent_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Configuración: una sola fila (id=1) con los parámetros que hoy estaban
  // fijos en el código — banner del marketplace, colchón mínimo de
  // antelación y tamaño de slot de la disponibilidad. Categorías y listas
  // de bancos se quedan fijas en el código a propósito por ahora: cada
  // categoría nueva necesita también un ícono y una entrada en el
  // marketplace, así que editarlas de verdad es un cambio de código, no de
  // datos — no vale la pena una UI de configuración que solo edita la mitad
  // del trabajo real.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id TINYINT PRIMARY KEY,
      banner_enabled TINYINT(1) NOT NULL DEFAULT 0,
      banner_text VARCHAR(280) NOT NULL DEFAULT '',
      booking_buffer_min INT NOT NULL DEFAULT 30,
      booking_slot_min INT NOT NULL DEFAULT 15,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query('INSERT IGNORE INTO platform_settings (id) VALUES (1)');

  // Logo, redes sociales y galería de fotos del negocio (2026-08-25) —
  // completar el perfil más allá de nombre/sector/categoría, a pedido de
  // Víctor. logo_path sigue el mismo patrón que receipt_path (nombre de
  // archivo en disco, se arma la URL absoluta con receiptUrl-like helper).
  await safeAlter('ALTER TABLE professionals ADD COLUMN logo_path VARCHAR(255)');
  await safeAlter('ALTER TABLE professionals ADD COLUMN social_instagram VARCHAR(190)');
  await safeAlter('ALTER TABLE professionals ADD COLUMN social_facebook VARCHAR(190)');
  await safeAlter('ALTER TABLE professionals ADD COLUMN social_tiktok VARCHAR(190)');
  await safeAlter('ALTER TABLE professionals ADD COLUMN social_website VARCHAR(190)');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      professional_id INT NOT NULL,
      path VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Verificación de correo obligatoria al registrarse (2026-08-27, a pedido
  // de Víctor tras ver el flujo de otra app). email_verified_at NULL =
  // pendiente. El backfill con corte de fecha da por verificadas a todas
  // las cuentas que ya existían antes de este cambio (no tiene sentido
  // bloquear a alguien que llevaba semanas usando Bukea sin este paso) —
  // el corte es fijo a propósito, así una cuenta nueva de verdad después de
  // esa fecha nunca se marca verificada por accidente en un reinicio.
  await safeAlter('ALTER TABLE users ADD COLUMN email_verified_at DATETIME');
  await pool.query(
    "UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL AND created_at < '2026-08-27 12:00:00'"
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE INDEX idx_email_verifications_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Chat de soporte para dueños de negocio (2026-08-27) — reemplaza el
  // "Abrir ticket" de una sola vía (correo, sin respuesta visible en la
  // app) por un hilo real: el dueño escribe desde "Mi negocio", un admin
  // responde desde el panel, y ambos ven el mismo historial.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      sender VARCHAR(10) NOT NULL,
      body TEXT NOT NULL,
      read_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
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
