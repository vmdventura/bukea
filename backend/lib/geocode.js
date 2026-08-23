// Geocodificación gratuita vía Nominatim (OpenStreetMap) — decisión de
// Víctor 2026-08-23: sin API key, sin tarjeta, a cambio de menos precisión
// que Google Maps. Como el registro del negocio hoy solo pide "sector"
// (no una dirección completa), el pin queda a nivel de barrio, no de
// puerta — suficiente para "quién está cerca de mí", no para navegación
// exacta. Cuando se agregue un campo de dirección real, este mismo
// geocodificador sirve sin cambios.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// La política de uso de Nominatim exige un User-Agent identificable y
// máximo 1 solicitud/segundo — nunca se llama desde el navegador del
// cliente, solo desde el servidor al registrar o editar un negocio.
const USER_AGENT = 'BukeaApp/1.0 (+https://www.bukeard.com; contacto: hola@bukeard.com)';
const TIMEOUT_MS = 5000;

async function geocode(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=do&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
    if (!res.ok) throw new Error('Nominatim respondió ' + res.status);
    const results = await res.json();
    if (!results[0]) return null;
    return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
  } finally {
    clearTimeout(timeout);
  }
}

// Best-effort: si Nominatim falla o no responde a tiempo, el negocio se
// registra igual, solo sin pin en el mapa hasta la próxima corrección.
async function geocodeNeighborhood(neighborhood) {
  try {
    return await geocode(`${neighborhood}, Santo Domingo, República Dominicana`);
  } catch (err) {
    console.error('No se pudo geocodificar "' + neighborhood + '":', err.message);
    return null;
  }
}

module.exports = { geocodeNeighborhood };
