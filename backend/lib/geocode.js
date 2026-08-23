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

// Mismo cálculo de enlaces que usa el frontend (ver directionLinks() en
// index.html) — server-side para el perfil público, que no corre el JS
// de la app. Con coordenadas reales si ya se geocodificó; si no, busca por
// texto (nombre + sector) mientras tanto.
function directionLinks(name, neighborhood, lat, lng) {
  const place = `${name} ${neighborhood}, Santo Domingo, República Dominicana`.trim();
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  return {
    google: hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`,
    apple: hasCoords
      ? `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`
      : `https://maps.apple.com/?q=${encodeURIComponent(place)}`,
    waze: hasCoords
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(place)}&navigate=yes`,
  };
}

module.exports = { geocodeNeighborhood, directionLinks };
