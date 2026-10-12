// Helpers compartidos por la suite de pruebas de API. Corre contra un
// servidor real ya levantado (TEST_API_BASE) y una base MySQL real
// (TEST_DB_* o las mismas DB_* del .env de staging) — de acuerdo a
// PRUEBAS-E2E-CLIENTE-Y-NEGOCIO.md: "una prueba con respuestas mock no
// cuenta como punta a punta con persistencia real".
require('dotenv').config();
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const API_BASE = process.env.TEST_API_BASE || 'http://127.0.0.1:3000/bukea';
// `node --test` con varios archivos corre CADA archivo en su propio proceso
// (encontrado 2026-09-08: dos archivos arrancando en el mismo milisegundo
// generaban el mismo RUN_ID a partir de Date.now() y colisionaban de
// teléfono, lo que a su vez disparó una carrera real en POST /register —
// ver el fix en routes/auth.js). crypto.randomInt es único por proceso
// aunque arranquen en el mismo instante.
const RUN_ID = process.env.TEST_RUN_ID || String(crypto.randomInt(0, 1e6)).padStart(6, '0');

let pool;
function db() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      dateStrings: true,
    });
  }
  return pool;
}

async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* respuesta no-JSON (ej. sendFile) */ }
  return { status: res.status, ok: res.ok, headers: res.headers, body: json };
}

// Teléfonos dominicanos válidos únicos por corrida (809 + 7 dígitos
// derivados de un contador, para no colisionar entre pruebas del mismo run).
let phoneCounter = 0;
function nextPhone() {
  phoneCounter += 1;
  return '809' + String(RUN_ID).padStart(4, '0').slice(-4) + String(phoneCounter).padStart(3, '0');
}

async function createUser(prefix = 'user') {
  const phone = nextPhone();
  const email = `e2e+${RUN_ID}-${prefix}-${phoneCounter}@staging.invalid`;
  const res = await api('/api/auth/register', {
    method: 'POST',
    body: { phone, name: `E2E ${prefix} ${RUN_ID}`, pin: '1234', email, accountType: 'client' },
  });
  if (res.status !== 201) throw new Error(`No se pudo crear usuario de prueba: ${JSON.stringify(res.body)}`);
  return { ...res.body, phone, email };
}

async function createBusiness(user, overrides = {}) {
  const res = await api('/api/professionals', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + user.token },
    body: {
      name: user.name,
      businessName: `Negocio E2E ${RUN_ID}`,
      neighborhood: 'Piantini',
      category: 'barberia',
      services: [{ name: 'Corte', durationMin: 30, priceCents: 100000 }],
      ...overrides,
    },
  });
  return res;
}

// Borra solo lo creado por esta corrida (prefijo del email/nombre) — nunca
// datos sembrados ni de otra corrida. NO cierra el pool aquí: run-all.js
// carga todos los archivos de prueba en un solo proceso (ver test-shim.js),
// así que este módulo y su pool se comparten entre los 9 archivos — cada
// uno llama cleanup() en su propio `after`, y cerrar el pool en el primero
// rompería a los demás. closeDb() lo cierra una sola vez, al final de todo.
async function cleanup() {
  const conn = db();
  const [users] = await conn.query('SELECT id FROM users WHERE email LIKE ?', [`e2e+${RUN_ID}-%`]);
  const ids = users.map(u => u.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await conn.query(`DELETE FROM bookings WHERE client_user_id IN (${placeholders})`, ids);
    await conn.query(`DELETE FROM professionals WHERE owner_user_id IN (${placeholders})`, ids);
    await conn.query(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
  }
}

async function closeDb() {
  if (pool) await pool.end();
}

module.exports = { api, db, createUser, createBusiness, cleanup, closeDb, nextPhone, RUN_ID, API_BASE };
