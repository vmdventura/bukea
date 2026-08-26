CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190),
  pin_salt VARCHAR(40),
  pin_hash VARCHAR(80),
  google_sub VARCHAR(255) UNIQUE,
  apple_sub VARCHAR(255) UNIQUE,
  token VARCHAR(60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Códigos de un solo uso — por teléfono (verificación WhatsApp) o por email
-- (recuperar PIN olvidado, 2026-08-23). Nunca los dos a la vez en una fila.
CREATE TABLE IF NOT EXISTS auth_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15),
  email VARCHAR(190),
  code_hash VARCHAR(80) NOT NULL,
  code_salt VARCHAR(40) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_codes_phone (phone),
  INDEX idx_auth_codes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS professionals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL UNIQUE,
  category VARCHAR(30) NOT NULL,
  name VARCHAR(120) NOT NULL,
  business_name VARCHAR(120) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  accepts_whatsapp TINYINT(1) NOT NULL DEFAULT 1,
  accepts_cash TINYINT(1) NOT NULL DEFAULT 1,
  owner_user_id INT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  logo_path VARCHAR(255),
  social_instagram VARCHAR(190),
  social_facebook VARCHAR(190),
  social_tiktok VARCHAR(190),
  social_website VARCHAR(190),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  duration_min INT NOT NULL,
  price_cents INT NOT NULL,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Horario semanal del profesional. Varias filas por día permiten un hueco
-- (ej. almuerzo): 09:00-13:00 y 15:00-18:00 el mismo martes.
CREATE TABLE IF NOT EXISTS professional_hours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  weekday TINYINT NOT NULL, -- 0=domingo … 6=sábado, igual que Date.getDay() en JS
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
  INDEX idx_professional_hours_pro_day (professional_id, weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Colaboradores (2026-08-23): un negocio (categoría "salon" sobre todo)
-- puede tener varias personas reservables además del profesional titular
-- (que sigue siendo el dueño del perfil — VISION.md "el profesional es el
-- perfil"). La disponibilidad se calcula a nivel de negocio, no por
-- colaborador — todos comparten el mismo horario y las mismas citas
-- ocupan el mismo calendario. Ver nota en CLAUDE.md.
CREATE TABLE IF NOT EXISTS collaborators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  service_id INT NOT NULL,
  collaborator_id INT,
  client_user_id INT,
  client_name VARCHAR(120) NOT NULL,
  day_label VARCHAR(40) NOT NULL,
  time_label VARCHAR(40) NOT NULL,
  appointment_at DATETIME,
  duration_min INT,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
  payment_method VARCHAR(30) NOT NULL,
  receipt_path VARCHAR(255),
  receipt_uploaded_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES professionals(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE SET NULL,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_bookings_slot (professional_id, appointment_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cuentas bancarias del negocio para que el cliente transfiera y copie el
-- número sin llamar. Información voluntariamente pública (el profesional la
-- comparte para que le paguen) — se expone en el perfil público y en el
-- paso de pago de la reserva, sin necesitar sesión.
CREATE TABLE IF NOT EXISTS professional_bank_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  bank_name VARCHAR(80) NOT NULL,
  account_type VARCHAR(30) NOT NULL,
  account_number VARCHAR(60) NOT NULL,
  account_holder VARCHAR(120) NOT NULL,
  cedula_rnc VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Galería de fotos del negocio (2026-08-25), visible en el perfil público.
-- Independiente de logo_path (el logo es uno solo, la galería es 0..N).
CREATE TABLE IF NOT EXISTS business_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
