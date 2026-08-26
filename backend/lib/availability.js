// Cálculo de disponibilidad real: agenda (horario semanal) - citas ya
// tomadas ese día = horas libres. Reemplaza las etiquetas fijas ("Hoy",
// "Mañana", 4 horas fijas) que tenía el flujo de reserva.

const RD_TZ = 'America/Santo_Domingo';
// Valores por defecto — el panel de administración (Configuración, Fase 2)
// puede ajustarlos por plataforma sin deploy; ver lib/settings.js y los
// parámetros slotMin/bufferMin de computeFreeSlots más abajo.
const SLOT_GRANULARITY_MIN = 15; // separación entre horas ofrecidas
const BOOK_AHEAD_BUFFER_MIN = 30; // no se puede reservar "para ya mismo"

const WEEKDAY_LABELS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function timeToMinutes(hhmmss) {
  const [h, m] = String(hhmmss).split(':').map(Number);
  return h * 60 + m;
}

function minutesToHHMM(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function formatTime12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Fecha y hora actuales en República Dominicana, sin depender del huso
// horario del servidor.
function nowInSantoDomingo() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: RD_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: hour * 60 + Number(parts.minute) };
}

function weekdayOf(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').getUTCDay();
}

function dayLabel(dateStr) {
  const { date: today } = nowInSantoDomingo();
  if (dateStr === today) return 'Hoy';
  const tomorrow = addDays(today, 1);
  if (dateStr === tomorrow) return 'Mañana';
  const [y, m, d] = dateStr.split('-').map(Number);
  const wd = WEEKDAY_LABELS[weekdayOf(dateStr)];
  const wdCap = wd.charAt(0).toUpperCase() + wd.slice(1);
  return `${wdCap} ${d} ${MONTH_LABELS[m - 1]}`;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// hoursRows: filas de professional_hours para UN día (weekday ya filtrado)
// busyRanges: [{startMin, endMin}] de citas confirmadas ese día
// Devuelve horas de inicio (en minutos desde medianoche) donde cabe un
// servicio de duractionMin sin chocar con el horario ni con otra cita.
function computeFreeSlots({
  hoursRows, durationMin, busyRanges, isToday, nowMinutes,
  slotMin = SLOT_GRANULARITY_MIN, bufferMin = BOOK_AHEAD_BUFFER_MIN,
}) {
  const slots = [];
  for (const range of hoursRows) {
    const start = timeToMinutes(range.start_time);
    const end = timeToMinutes(range.end_time);
    for (let t = start; t + durationMin <= end; t += slotMin) {
      if (isToday && t < nowMinutes + bufferMin) continue;
      const overlaps = busyRanges.some(b => t < b.endMin && t + durationMin > b.startMin);
      if (!overlaps) slots.push(t);
    }
  }
  return slots;
}

module.exports = {
  RD_TZ,
  timeToMinutes,
  minutesToHHMM,
  formatTime12h,
  nowInSantoDomingo,
  weekdayOf,
  dayLabel,
  addDays,
  computeFreeSlots,
};
