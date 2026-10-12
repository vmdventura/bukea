// Normaliza y valida los 4 campos de redes sociales del negocio
// (2026-09-08). Antes se guardaban tal cual, sin validar — un negocio
// podía guardar `javascript:alert(1)` en "website" y ese valor terminaría
// en un enlace real del perfil público el día que se renderice ahí.
//
// Reglas: Instagram/TikTok guardan el handle sin `@` (aceptan `@handle`,
// `handle` o la URL completa del dominio). Facebook guarda el handle o el
// path de la URL. Website guarda una URL https/http canónica — nunca
// `javascript:`, `data:` ni otro esquema.

const IG_RE = /^[A-Za-z0-9._]{1,30}$/;
const TIKTOK_RE = /^[A-Za-z0-9._]{1,24}$/;
const FB_RE = /^[A-Za-z0-9.]{3,60}$/;

function stripAt(value) {
  return value.replace(/^@/, '');
}

function extractPathHandle(value, hosts) {
  try {
    const url = new URL(value.startsWith('http') ? value : 'https://' + value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (!hosts.includes(host)) return null;
    const path = url.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
    return path ? stripAt(path) : null;
  } catch {
    return null;
  }
}

function normalizeHandle(raw, { re, hosts }) {
  const value = raw.trim();
  if (!value) return { value: null, error: null };

  let handle = value;
  if (/^https?:\/\//i.test(value) || hosts.some(h => value.toLowerCase().includes(h))) {
    const extracted = extractPathHandle(value, hosts);
    if (!extracted) return { value: null, error: 'Ese enlace no parece de esta red' };
    handle = extracted;
  } else {
    handle = stripAt(value);
  }

  if (!re.test(handle)) {
    return { value: null, error: 'Usuario no válido para esta red' };
  }
  return { value: handle, error: null };
}

function normalizeWebsite(raw) {
  const value = raw.trim();
  if (!value) return { value: null, error: null };
  let url;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : 'https://' + value);
  } catch {
    return { value: null, error: 'Ingresa un sitio web válido' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { value: null, error: 'El sitio debe empezar con http:// o https://' };
  }
  return { value: url.href, error: null };
}

// Devuelve { value: {instagram,facebook,tiktok,website}, errors: {campo: msg} }.
// `errors` viene vacío cuando todo es válido; los campos con error quedan
// en null dentro de `value` (no se guarda basura a medias).
function normalizeSocial({ instagram, facebook, tiktok, website }) {
  const errors = {};
  const ig = normalizeHandle(String(instagram || '').slice(0, 190), { re: IG_RE, hosts: ['instagram.com'] });
  const tk = normalizeHandle(String(tiktok || '').slice(0, 190), { re: TIKTOK_RE, hosts: ['tiktok.com'] });
  const fb = normalizeHandle(String(facebook || '').slice(0, 190), { re: FB_RE, hosts: ['facebook.com', 'fb.com'] });
  const site = normalizeWebsite(String(website || '').slice(0, 190));

  if (ig.error) errors.instagram = ig.error;
  if (tk.error) errors.tiktok = tk.error;
  if (fb.error) errors.facebook = fb.error;
  if (site.error) errors.website = site.error;

  return {
    value: { instagram: ig.value, facebook: fb.value, tiktok: tk.value, website: site.value },
    errors,
  };
}

module.exports = { normalizeSocial };
