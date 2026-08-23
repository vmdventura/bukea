require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  // appointment_at guarda la hora de pared de RD tal cual, sin zona horaria.
  // dateStrings evita que mysql2 la reinterprete como hora local del server
  // al convertirla a un objeto Date (que podría correr en otro huso).
  dateStrings: true,
});

module.exports = pool;
