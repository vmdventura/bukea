const pool = require('../db/pool');

// Horario por defecto para un profesional recién registrado: martes a
// sábado 9:00-18:00, domingo y lunes cerrado. Todavía no hay pantalla para
// que el profesional lo edite (queda para una siguiente pasada) — esto le
// da disponibilidad real desde el primer día en vez de un horario vacío.
const DEFAULT_WEEKLY_HOURS = [2, 3, 4, 5, 6].map(weekday => ({
  weekday,
  startTime: '09:00:00',
  endTime: '18:00:00',
}));

async function insertDefaultHours(professionalId) {
  for (const h of DEFAULT_WEEKLY_HOURS) {
    await pool.query(
      'INSERT INTO professional_hours (professional_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)',
      [professionalId, h.weekday, h.startTime, h.endTime]
    );
  }
}

module.exports = { DEFAULT_WEEKLY_HOURS, insertDefaultHours };
