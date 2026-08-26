// Parámetros de plataforma editables desde el panel de administración
// (Configuración, Fase 2) sin necesitar un deploy — una sola fila en
// platform_settings (id=1, sembrada en db/init.js). Categorías y listas de
// bancos se quedan fijas en el código a propósito, ver la nota en
// db/init.js.
const pool = require('../db/pool');

const COLUMN_BY_FIELD = {
  bannerEnabled: 'banner_enabled',
  bannerText: 'banner_text',
  bookingBufferMin: 'booking_buffer_min',
  bookingSlotMin: 'booking_slot_min',
};

async function getSettings() {
  const [rows] = await pool.query('SELECT * FROM platform_settings WHERE id = 1');
  const row = rows[0];
  return {
    bannerEnabled: Boolean(row && row.banner_enabled),
    bannerText: row ? row.banner_text : '',
    bookingBufferMin: row ? row.booking_buffer_min : 30,
    bookingSlotMin: row ? row.booking_slot_min : 15,
  };
}

async function updateSettings(patch) {
  const fields = [];
  const params = [];
  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    if (patch[field] === undefined) continue;
    fields.push(`${column} = ?`);
    params.push(field === 'bannerEnabled' ? (patch[field] ? 1 : 0) : patch[field]);
  }
  if (fields.length) {
    await pool.query(`UPDATE platform_settings SET ${fields.join(', ')} WHERE id = 1`, params);
  }
  return getSettings();
}

module.exports = { getSettings, updateSettings };
