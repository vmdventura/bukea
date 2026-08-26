// Protección contra fuerza bruta y abuso de los endpoints de credenciales.
// Un PIN de 4 dígitos son solo 10.000 combinaciones — sin esto, probarlas
// todas contra un teléfono conocido toma minutos.
//
// Contadores en memoria del proceso (Passenger corre un solo proceso Node,
// así que no hace falta compartirlos): se reinician al reiniciar la app,
// lo cual está bien — un atacante no controla cuándo reiniciamos.

const buckets = new Map(); // clave -> { count, windowStart, blockedUntil }

const DEFAULTS = { max: 5, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 };

// ¿Alguna de las claves está bloqueada ahora mismo? Devuelve los ms que
// faltan para desbloquear (0 si ninguna lo está).
function check(entries) {
  const now = Date.now();
  let wait = 0;
  for (const e of entries) {
    const b = buckets.get(e.key);
    if (b && b.blockedUntil > now) wait = Math.max(wait, b.blockedUntil - now);
  }
  return wait;
}

// Registra un intento (fallido, o una solicitud más cuando se usa como
// límite de volumen). Si alguna clave excede su máximo dentro de su
// ventana, la bloquea y devuelve los ms de bloqueo.
function hit(entries) {
  const now = Date.now();
  let wait = 0;
  for (const e of entries) {
    const max = e.max || DEFAULTS.max;
    const windowMs = e.windowMs || DEFAULTS.windowMs;
    const blockMs = e.blockMs || DEFAULTS.blockMs;

    let b = buckets.get(e.key);
    if (!b) { b = { count: 0, windowStart: now, blockedUntil: 0 }; buckets.set(e.key, b); }
    if (now - b.windowStart > windowMs) { b.count = 0; b.windowStart = now; }

    b.count += 1;
    if (b.count > max) {
      b.blockedUntil = now + blockMs;
      wait = Math.max(wait, blockMs);
      console.warn(`[rate-limit] bloqueada la clave ${e.key} por ${Math.round(blockMs / 60000)} min (${b.count} intentos)`);
    }
  }
  return wait;
}

// Un login correcto limpia los contadores de esa cuenta (no los de la IP,
// que protegen contra barridos sobre muchas cuentas a la vez).
function clear(keys) {
  for (const k of keys) buckets.delete(k);
}

function waitMessage(waitMs) {
  const min = Math.max(1, Math.ceil(waitMs / 60000));
  return `Demasiados intentos fallidos. Espera ${min} ${min === 1 ? 'minuto' : 'minutos'} y vuelve a intentar`;
}

// Limpieza periódica para que el Map no crezca sin límite.
const CLEAN_MS = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.blockedUntil < now && now - b.windowStart > CLEAN_MS) buckets.delete(k);
  }
}, CLEAN_MS).unref();

module.exports = { check, hit, clear, waitMessage };
