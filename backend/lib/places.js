// Búsqueda de negocios con Google Places API (New), para armar la lista de
// prospectos del panel de administración (2026-10-12). Necesita la variable de
// entorno GOOGLE_PLACES_API_KEY con "Places API (New)" activada en Google Cloud.
// Solo lee datos públicos de Google Maps; no envía nada a nadie.

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELDS = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.nationalPhoneNumber',
  'places.websiteUri', 'places.rating', 'places.userRatingCount', 'places.googleMapsUri',
  'places.businessStatus', 'nextPageToken',
].join(',');

const QUERIES = {
  barberia: 'barbería',
  unas: 'salón de uñas',
};

function isConfigured() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

// Usuario de Instagram dentro de un enlace o texto. Ignora rutas que no son
// perfiles (p, reel, explore, accounts, etc.).
const IG_RESERVED = new Set(['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'about', 'directory', 'legal', 'developer', 'direct', 'web', 'sharer', 'share']);
function instagramHandle(text) {
  if (!text) return null;
  const re = /instagram\.com\/(?:_u\/)?([A-Za-z0-9._]{2,30})(?=[/?#"'\s<)]|$)/gi;
  let m;
  while ((m = re.exec(String(text)))) {
    const h = m[1].replace(/\.+$/, '');
    if (!IG_RESERVED.has(h.toLowerCase())) return h.toLowerCase();
  }
  return null;
}

// Si el sitio web del negocio no es Instagram, se mira su HTML buscando un
// enlace a Instagram (la mayoría de sitios y linktrees lo ponen). Tiempo
// límite corto y tamaño máximo para no colgar la búsqueda.
async function instagramFromWebsite(url) {
  if (!url) return null;
  const direct = instagramHandle(url);
  if (direct) return direct;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BukeaBot/1.0)' } });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 600000);
    return instagramHandle(html);
  } catch (e) {
    return null;
  }
}

async function searchPage(textQuery, pageToken) {
  const body = { textQuery, languageCode: 'es', regionCode: 'DO', pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': FIELDS,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data.error && data.error.message) || ('Google respondió ' + res.status);
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Busca negocios de una categoría en un sector. Hasta `maxPages` páginas de 20.
async function searchProspects({ category, sector, maxPages = 3 }) {
  const label = QUERIES[category];
  if (!label) throw new Error('Categoría no válida');
  const textQuery = `${label} en ${sector}, República Dominicana`;
  const found = [];
  let token;
  for (let page = 0; page < maxPages; page++) {
    const data = await searchPage(textQuery, token);
    for (const p of data.places || []) {
      if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') continue;
      found.push({
        placeId: p.id,
        name: (p.displayName && p.displayName.text) || '',
        address: p.formattedAddress || null,
        phone: p.nationalPhoneNumber || null,
        website: p.websiteUri || null,
        rating: typeof p.rating === 'number' ? p.rating : null,
        reviewsCount: p.userRatingCount || 0,
        mapsUrl: p.googleMapsUri || null,
      });
    }
    token = data.nextPageToken;
    if (!token) break;
  }
  // Instagram en paralelo, de a pocos para no abrir cientos de conexiones.
  const queue = found.filter(f => f.website);
  for (let i = 0; i < queue.length; i += 6) {
    await Promise.all(queue.slice(i, i + 6).map(async f => { f.instagram = await instagramFromWebsite(f.website); }));
  }
  return found;
}

module.exports = { isConfigured, searchProspects, instagramHandle, QUERIES };
