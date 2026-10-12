// Piezas server-rendered del marketplace público (bukeard.com) — home,
// perfil compartible, "para negocios" y "precios". Viven separadas del
// bundle de la app (backend/public/index.html) porque son páginas de
// verdad (indexables, sin JS de framework) que solo enlazan HACIA la app
// para reservar (?pro=slug) o unirse (?join=1). Mismo sistema de diseño
// que la app — ver DESIGN.md — con una paleta recortada para web.

const CAT_LABELS = {
  barberia: 'Barbería',
  unas: 'Uñas',
  salon: 'Salón',
  maquillaje: 'Maquillaje',
  'cejas-mua': 'Cejas & MUA',
  pilates: 'Pilates',
  entrenador: 'Entrenador Personal',
  'peluqueria-canina': 'Peluquería Canina',
  spa: 'Spa y Masajes',
  trenzas: 'Trenzas y Rastas',
  tatuadores: 'Tatuadores',
  'servicios-profesionales': 'Servicios Profesionales',
};

const CAT_ICONS = {
  barberia: 'c-barberia',
  unas: 'c-unas',
  salon: 'c-salon',
  maquillaje: 'c-maquillaje',
  'cejas-mua': 'c-cejas',
  pilates: 'c-pilates',
  entrenador: 'c-entrenador',
  'peluqueria-canina': 'c-canina',
  spa: 'c-spa',
  trenzas: 'c-trenzas',
  tatuadores: 'c-tatuadores',
  'servicios-profesionales': 'c-servicios-pro',
};

// Ciudades destacadas en el buscador del home — hoy todos los negocios
// reales están en Santo Domingo (es el default, sin filtro); las demás
// existen para que el buscador ya se sienta nacional y muestran el
// estado honesto "sé el primero" cuando alguien filtra por ellas.
const CITY_LABELS = {
  'santo-domingo': 'Santo Domingo',
  santiago: 'Santiago',
  'punta-cana': 'Punta Cana',
  'la-romana': 'La Romana',
  'puerto-plata': 'Puerto Plata',
};

const CONTACT_EMAIL = 'contacto@bukeard.com';

// Decisión de Víctor (2026-08-27): los primeros FOUNDING_FREE_LIMIT
// negocios reales (con dueño, no los sembrados de prueba) quedan gratis
// de por vida, sin importar cuándo se active el cobro para el resto.
// Un solo lugar para este número — lo usan el registro (routes/professionals.js,
// para decidir si el negocio nuevo entra en el cupo) y /precios (para el
// contador y el copy).
const FOUNDING_FREE_LIMIT = 30;

const { getSettings } = require('../lib/settings');
const pool = require('../db/pool');

// Cupos fundadores libres para la etiqueta del menú móvil. Cache corto para
// no consultar la base en cada página (2026-10-11).
let spotsCache = { at: 0, left: null };
async function getFoundingSpotsLeft() {
  if (Date.now() - spotsCache.at < 60000) return spotsCache.left;
  try {
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM professionals WHERE founding_free = 1');
    spotsCache = { at: Date.now(), left: Math.max(0, FOUNDING_FREE_LIMIT - Number(n)) };
  } catch (e) {
    spotsCache = { at: Date.now(), left: null };
  }
  return spotsCache.left;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(150deg,#12938f,#0a4f4d)',
  'linear-gradient(150deg,#c2447a,#7a2650)',
  'linear-gradient(150deg,#7654b8,#3f2c7a)',
  'linear-gradient(150deg,#3d6ea5,#1b3a5c)',
  'linear-gradient(150deg,#a5763d,#5c3a1b)',
];

function avatarGradient(slug) {
  let hash = 0;
  for (const ch of String(slug)) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash];
}

function initials(name) {
  const clean = String(name || '').replace(/"[^"]*"/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Con separador de miles (2026-09-06, a pedido de Víctor: "en buen
// dominicano" — RD$1,000 en vez de RD$1000) para que se lea de un vistazo.
function formatPrice(cents) {
  return 'RD$ ' + Math.round(cents / 100).toLocaleString('en-US');
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

// <head> + estilos compartidos por las 4 páginas del marketplace. BASE es
// el prefijo donde vive la app (p.ej. /app) — todo lo que enlaza HACIA la
// app (Bukear cita, Únete, login) pasa por ahí.
// Sprite de íconos — ecosistema Lucide (lucide-static, grid 24x24, trazo 2px),
// la misma fuente que lucide-react/lucide-react-native. Excepciones a
// propósito, sin equivalente en Lucide: i-whatsapp (marca) y los pictogramas
// de categoría c-* (ilustrativos, propios de Bukea). Ver DESIGN.md.
const ICON_SPRITE = `<svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>
<symbol id="i-search" viewBox="0 0 24 24"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></symbol>
<symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M4 19.5 5.3 15.6A8 8 0 1 1 8.7 19L4 19.5Z"/><path d="M9 12.3l1.8 1.8 4-4.3"/></symbol>
<symbol id="i-cash" viewBox="0 0 24 24"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></symbol>
<symbol id="i-percent" viewBox="0 0 24 24"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="i-map-pin" viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>
<symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
<symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></symbol>
<symbol id="i-arrow-up-right" viewBox="0 0 24 24"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></symbol>
<symbol id="i-camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></symbol>
<symbol id="i-smartphone" viewBox="0 0 24 24"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></symbol>
<symbol id="i-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></symbol>
<symbol id="i-facebook" viewBox="0 0 24 24"><path d="M14 8.5h2.5V5h-2.5c-2.2 0-4 1.8-4 4v2H8v3.5h2v6.5h3.5v-6.5h2.6l.4-3.5h-3v-2c0-.55.45-1 1-1Z"/></symbol>
<symbol id="i-instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/></symbol>
<symbol id="i-tiktok" viewBox="0 0 24 24"><path d="M15 3v10.8a3.2 3.2 0 1 1-2.6-3.15"/><path d="M15 3c.4 2.4 2.1 4.2 4.5 4.5"/></symbol>
<symbol id="c-barberia" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M19.5 4.5 8.3 15.7"/><path d="M14.6 14.4 19.5 19.5"/><path d="M8.3 8.3 11.8 11.8"/></symbol>
<symbol id="c-unas" viewBox="0 0 24 24"><rect x="9.6" y="2.6" width="4.8" height="2.6" rx="0.8"/><path d="M10.6 5.2v2.1h2.8V5.2"/><path d="M8.5 7.3h7a1 1 0 0 1 1 1.1l-.85 9.3a2 2 0 0 1-2 1.8h-3.3a2 2 0 0 1-2-1.8l-.85-9.3a1 1 0 0 1 1-1.1Z"/></symbol>
<symbol id="c-salon" viewBox="0 0 24 24"><circle cx="15.5" cy="8.5" r="4.5"/><circle cx="15.5" cy="8.5" r="1.8"/><path d="M11.2 5.3C8 5.8 5 7 5 8.5"/><path d="M11.2 11.7C8 11.2 5 10 5 8.5"/><path d="M14 12.8 12.3 19.5a1.8 1.8 0 0 1-1.8 1.5H8.5"/><path d="M1 5.5c.8-.8 1.6-.8 2.4 0s1.6.8 2.4 0"/><path d="M.5 8.5c.9-.9 1.8-.9 2.7 0s1.8.9 2.7 0"/><path d="M1 11.5c.8-.8 1.6-.8 2.4 0s1.6.8 2.4 0"/></symbol>
<symbol id="c-maquillaje" viewBox="0 0 24 24"><path d="M9.3 10.6 11 5.4h2l1.7 5.2"/><rect x="9.4" y="10.6" width="5.2" height="5.4" rx="0.6"/><rect x="9" y="16" width="6" height="5.4" rx="1.2"/></symbol>
<symbol id="c-cejas" viewBox="0 0 24 24"><path d="M18.4 2.9 14 7.3l-1.6-1.6a1.6 1.6 0 0 0-2.3 0L8.3 7.5l8.2 8.2 1.8-1.8a1.6 1.6 0 0 0 0-2.3L16.7 10l4.4-4.4a1.8 1.8 0 1 0-2.7-2.7Z"/><path d="M9.2 8.6c-1.8 2.7-3.6 3.2-6.2 3.6l7.2 9c1.8-.9 5.4-4.4 5.4-6.2"/><path d="M13.6 16.4 4.8 14.2"/></symbol>
<symbol id="c-entrenador" viewBox="0 0 24 24"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></symbol>
<symbol id="c-canina" viewBox="0 0 24 24"><path d="M11.25 16.25h1.5L12 17z"/><path d="M16 14v.5"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/><path d="M8 14v.5"/><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 4.75c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/></symbol>
<symbol id="c-spa" viewBox="0 0 24 24"><path d="M12 21c-4.4 0-8-3.1-8-7.5 2.5 0 4.7 1 6.2 2.6C10.6 13.5 11.2 10 12 7c.8 3 1.4 6.5 1.8 9.1 1.5-1.6 3.7-2.6 6.2-2.6 0 4.4-3.6 7.5-8 7.5Z"/><path d="M12 7c-.8-1.8-2.3-3.2-4.2-3.9C9 2.4 10.6 2 12 2s3 .4 4.2 1.1C14.3 3.8 12.8 5.2 12 7Z"/></symbol>
<symbol id="c-pilates" viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="1.7"/><path d="M12 6.2v5.4"/><path d="M12 8 8.3 4.8"/><path d="M12 8l3.7-3.2"/><path d="M12 11.6 8 19"/><path d="M12 11.6l4.4 7.2"/><path d="M4.5 21.5h15"/></symbol>
<symbol id="c-trenzas" viewBox="0 0 24 24"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></symbol>
<symbol id="c-tatuadores" viewBox="0 0 24 24"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></symbol>
<symbol id="c-servicios-pro" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></symbol>
</defs></svg>`;

// Banner de anuncio (2026-08-24, Configuración del panel de administración)
// — texto corto activable/desactivable sin deploy, para avisos de
// mantenimiento o promociones del piloto. Solo en el marketplace público
// por ahora (no en el panel de negocio ni en la app empacada).
async function pageShell({ base, title, description, canonicalPath, bodyHtml, ogImage }) {
  const settings = await getSettings();
  const spotsLeft = await getFoundingSpotsLeft();
  const spotsBadge = spotsLeft ? `<span class="menu-badge">${spotsLeft} cupos gratis</span>` : '';
  const bannerHtml = settings.bannerEnabled && settings.bannerText
    ? `<div class="site-banner">${esc(settings.bannerText)}</div>`
    : '';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#002626">
<link rel="canonical" href="${esc(canonicalPath)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="color-scheme" content="light">
<script>(function(){try{var t=sessionStorage.getItem('bukea_theme');if(t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<link rel="icon" type="image/png" sizes="32x32" href="${base}/favicon-32.png">
<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap"></noscript>
<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>
<style>
  :root {
    color-scheme: light;
    --deep: oklch(24% 0.045 195);
    --teal-hover: oklch(37% 0.075 195);
    --glass: rgba(250,253,252,0.72);
    --glass-solid: rgba(250,253,252,0.9);
    --teal-900: oklch(24% 0.045 195);
    --teal-700: oklch(37% 0.075 195);
    --teal-600: oklch(46% 0.09 195);
    --teal-500: oklch(55% 0.095 195);
    --teal-100: oklch(93% 0.035 195);
    --teal-50:  oklch(97% 0.018 195);
    --gold-700: oklch(48% 0.11 68);
    --gold-600: oklch(70% 0.13 75);
    --gold-100: oklch(94% 0.05 78);
    --white: #fff;
    --whatsapp: #25d366;
    --whatsapp-light: #6fe3ab;
    --cash: oklch(48% 0.1 150);
    --ink:  oklch(21% 0.02 200);
    --soft: oklch(44% 0.028 200);
    --bg:   oklch(97% 0.01 195);
    --card: oklch(99% 0.004 195);
    --line: oklch(89% 0.014 195);
    --band-alt: oklch(94.5% 0.022 195);
    /* Patrón Polka Dots de Hero Patterns (Steve Schoger, CC BY 4.0) al 4 % */
    --dots-teal: url("data:image/svg+xml,%3Csvg%20width%3D%2720%27%20height%3D%2720%27%20viewBox%3D%270%200%2020%2020%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27%230f8583%27%20fill-opacity%3D%270.04%27%20fill-rule%3D%27evenodd%27%3E%3Ccircle%20cx%3D%273%27%20cy%3D%273%27%20r%3D%273%27%2F%3E%3Ccircle%20cx%3D%2713%27%20cy%3D%2713%27%20r%3D%273%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");
    --dots-white: url("data:image/svg+xml,%3Csvg%20width%3D%2720%27%20height%3D%2720%27%20viewBox%3D%270%200%2020%2020%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27%23ffffff%27%20fill-opacity%3D%270.04%27%20fill-rule%3D%27evenodd%27%3E%3Ccircle%20cx%3D%273%27%20cy%3D%273%27%20r%3D%273%27%2F%3E%3Ccircle%20cx%3D%2713%27%20cy%3D%2713%27%20r%3D%273%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");
    --dots-band: var(--dots-teal);
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-out-quart: cubic-bezier(0.32, 0.72, 0, 1);
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --sh-2: 0 10px 30px -12px rgba(15,60,58,0.18);
    /* Doble bisel (2026-10-11, high-end-visual-design): anillo exterior
       concéntrico + borde de pelo + luz interior, sin bordes grises. Se
       hace con sombras para no tocar el marcado de cada tarjeta. */
    --bezel: 0 0 0 1px rgba(15,100,98,0.06), 0 0 0 6px rgba(15,100,98,0.04), 0 24px 44px -24px rgba(15,60,58,0.3), inset 0 1px 0 rgba(255,255,255,0.9);
    --bezel-hover: 0 0 0 1px rgba(15,100,98,0.12), 0 0 0 7px rgba(15,100,98,0.07), 0 30px 50px -22px rgba(15,60,58,0.38), inset 0 1px 0 rgba(255,255,255,0.9);
    --sh-3: 0 14px 34px rgba(15,40,38,0.12);
    --sh-teal: 0 8px 20px rgba(10,79,77,0.22);
  }
  /* Tema oscuro (2026-10-11): el atributo data-theme lo fija el script del
     head (preferencia guardada o la del sistema). Las superficies oscuras de
     marca usan --deep (constante); --teal-900 pasa a ser el color de texto
     fuerte y por eso se aclara aquí. */
  :root[data-theme="dark"] {
    color-scheme: dark;
    --bezel-nav: 0 0 0 1px rgba(255,255,255,0.09), 0 16px 40px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08);
    --teal-900: oklch(92% 0.025 195);
    --teal-700: oklch(80% 0.1 190);
    --teal-100: oklch(30% 0.05 195);
    --teal-50:  oklch(21% 0.03 195);
    --gold-700: oklch(82% 0.1 78);
    --gold-100: oklch(32% 0.05 78);
    --ink:  oklch(94% 0.01 195);
    --soft: oklch(74% 0.02 195);
    --bg:   oklch(15.5% 0.02 195);
    --card: oklch(20.5% 0.025 195);
    --line: oklch(31% 0.03 195);
    --band-alt: oklch(18.5% 0.03 195);
    --dots-band: var(--dots-white);
    --glass: rgba(18,30,30,0.72);
    --glass-solid: rgba(18,30,30,0.92);
    --sh-2: 0 10px 30px -12px rgba(0,0,0,0.6);
    --sh-3: 0 14px 34px rgba(0,0,0,0.5);
    --bezel: 0 0 0 1px rgba(255,255,255,0.07), 0 0 0 6px rgba(255,255,255,0.03), 0 24px 44px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07);
    --bezel-hover: 0 0 0 1px rgba(255,255,255,0.14), 0 0 0 7px rgba(255,255,255,0.05), 0 30px 50px -22px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
  }
  .theme-toggle { width: 40px; height: 40px; border-radius: 50%; border: 0; background: transparent; color: var(--soft); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: background 500ms var(--ease-out-quart), color 500ms var(--ease-out-quart), transform 500ms var(--ease-out-quart); }
  .theme-toggle:hover { background: var(--teal-100); color: var(--teal-700); }
  .theme-toggle:active { transform: scale(0.92); }
  .theme-toggle .i-sun { display: none; }
  :root[data-theme="dark"] .theme-toggle .i-sun { display: block; }
  :root[data-theme="dark"] .theme-toggle .i-moon { display: none; }
  /* Superficies del navegador tematizadas: selección, cursor, barra de scroll,
     subrayado y numerales. */
  ::selection { background: var(--teal-600); color: #fff; }
  input, textarea, select { caret-color: var(--teal-600); }
  html { scrollbar-width: thin; scrollbar-color: oklch(62% 0.05 195) transparent; }
  a:not([class]) { text-underline-offset: 3px; text-decoration-thickness: 1px; }
  .pro-rating, .step .n { font-variant-numeric: tabular-nums lining-nums; }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { overflow-x: clip; margin: 0; font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--ink); }
  h1, h2, h3, .display { font-family: "Fraunces", Georgia, serif; text-wrap: balance; }
  p { text-wrap: pretty; }
  a { color: inherit; }
  img { max-width: 100%; }
  .icon { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }

  /* Foco de teclado visible en todo el sitio — nunca lo suprimimos sin
     un reemplazo con contraste real (WCAG 2.4.7). */
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2.5px solid var(--teal-600); outline-offset: 2px; border-radius: 4px;
  }

  .site-banner { background: var(--gold-100); color: var(--gold-700); text-align: center; font-size: 0.85rem; font-weight: 700; padding: 0.55rem 20px; }
  /* Navegación isla flotante (2026-10-11): píldora de vidrio separada del
     borde superior, en lugar de una barra pegada de lado a lado. */
  .site-header-wrap { position: sticky; top: 0; z-index: 40; padding: 14px 20px 0; pointer-events: none; }
  .site-header-wrap .site-header {
    pointer-events: auto; max-width: 1040px; margin: 0 auto; padding: 8px 10px 8px 18px; border-radius: 999px;
    background: var(--glass); backdrop-filter: blur(18px) saturate(1.4); -webkit-backdrop-filter: blur(18px) saturate(1.4);
    box-shadow: var(--bezel-nav, 0 0 0 1px rgba(15,100,98,0.07), 0 16px 40px -16px rgba(15,60,58,0.22), inset 0 1px 0 rgba(255,255,255,0.9));
    transition: box-shadow 600ms var(--ease-out-quart), background 600ms var(--ease-out-quart);
  }
  .site-header-wrap.scrolled .site-header { background: var(--glass-solid); box-shadow: 0 0 0 1px rgba(15,100,98,0.1), 0 20px 46px -14px rgba(15,60,58,0.3), inset 0 1px 0 rgba(255,255,255,0.9); }
  @media (max-width: 640px) { .site-header-wrap { padding: 10px 12px 0; } .site-header-wrap .site-header { padding: 6px 8px 6px 12px; } }
  .site-header { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 0.55rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.3rem; text-decoration: none; color: var(--ink); }
  .brand .mark { width: 34px; height: 34px; border-radius: 10px; background: var(--teal-600); color: var(--white); display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; transition: transform 240ms var(--ease-out-quart); }
  .brand:hover .mark { transform: rotate(-6deg) scale(1.05); }
  .site-nav { display: flex; align-items: center; gap: 1.1rem; font-size: 0.86rem; font-weight: 700; }
  .site-nav a:not(.btn), .nav-dropdown-toggle {
    display: inline-flex; align-items: center; gap: 0.3rem; min-height: 44px; padding: 0.4rem 0.15rem;
    text-decoration: none; color: var(--soft); position: relative; background: none; border: none;
    font: inherit; font-weight: 700; cursor: pointer;
    text-transform: uppercase; letter-spacing: 0.03em;
  }
  .nav-short { display: none; }
  .site-nav a:not(.btn):not(.nav-cta-negocio)::after, .nav-dropdown-toggle::after { content: ""; position: absolute; left: 0; right: 100%; bottom: 8px; height: 2px; background: var(--teal-600); border-radius: 2px; transition: right 220ms var(--ease-out-quart); }
  .site-nav a:not(.btn):not(.nav-cta-negocio):hover, .nav-dropdown-toggle:hover { color: var(--teal-700); }
  .site-nav a:not(.btn):not(.nav-cta-negocio):hover::after, .nav-dropdown-toggle:hover::after { right: 0; }
  .nav-dropdown { position: relative; }
  .nav-dropdown-toggle .icon { width: 20px; height: 20px; }
  .site-nav a.nav-cta-negocio { display: inline-flex; align-items: center; gap: 0.6rem; background: var(--teal-600); color: var(--white); padding: 0.3rem 0.35rem 0.3rem 1.05rem; border-radius: 999px; font-weight: 800; text-transform: none; letter-spacing: 0; font-size: 0.88rem; min-height: 40px; box-shadow: var(--sh-teal); transition: background 500ms var(--ease-out-quart), transform 500ms var(--ease-out-quart); }
  .site-nav a.nav-cta-negocio:hover { background: var(--teal-hover); color: var(--white); }
  .site-nav a.nav-cta-negocio:active { transform: scale(0.97); }
  /* Menú renovado (2026-10-11, ref. Fresha): grupos con título, filas con
     flecha, tarjeta aparte "Para negocios". En móvil la tarjeta ocupa el
     ancho del header y se desplaza si hace falta. */
  .site-nav { gap: 0.55rem; }
  .site-nav a.nav-login { text-transform: none; letter-spacing: 0; font-size: 0.9rem; color: var(--ink); padding: 0.4rem 0.7rem; }
  .site-nav a.nav-login::after { content: none; }
  .site-nav a.nav-login:hover { color: var(--teal-700); }
  .site-nav a.nav-pill-negocios { display: inline-flex; align-items: center; min-height: 40px; padding: 0 1.1rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); color: var(--ink); text-transform: none; letter-spacing: 0; font-size: 0.9rem; font-weight: 700; transition: border-color 200ms var(--ease-out-quart), color 200ms var(--ease-out-quart); }
  .site-nav a.nav-pill-negocios::after { content: none; }
  .site-nav a.nav-pill-negocios:hover { border-color: var(--teal-500); color: var(--teal-700); }
  .menu-mobile-only { display: none !important; }
  .site-nav a.nav-session { font-weight: 700; }
  .site-nav a.nav-unete { font-weight: 800; color: var(--teal-700); }
  .site-header { position: relative; }
  .nav-dropdown { position: static; }
  .nav-dropdown-toggle { gap: 0.55rem; padding: 0 0.95rem 0 1.1rem !important; min-height: 40px !important; border-radius: 999px; border: 1.5px solid var(--line) !important; background: var(--card) !important; color: var(--ink) !important; text-transform: none !important; letter-spacing: 0 !important; font-size: 0.9rem; transition: border-color 200ms var(--ease-out-quart), background 200ms var(--ease-out-quart); }
  .nav-dropdown-toggle::after { content: none !important; }
  .nav-dropdown-toggle:hover, .nav-dropdown.open .nav-dropdown-toggle { border-color: var(--teal-500) !important; color: var(--teal-700) !important; }
  .nav-dropdown-toggle .ic-close { display: none; }
  .nav-dropdown.open .nav-dropdown-toggle .ic-open { display: none; }
  .nav-dropdown.open .nav-dropdown-toggle .ic-close { display: block; }
  .nav-dropdown-menu {
    position: absolute; top: calc(100% + 10px); right: 0; width: min(340px, 100%);
    background: var(--card); border-radius: 24px; padding: 0.7rem;
    box-shadow: 0 0 0 1px rgba(15,100,98,0.08), 0 28px 60px -18px rgba(15,60,58,0.32);
    display: flex; flex-direction: column; gap: 0.5rem; max-height: calc(100dvh - 110px); overflow-y: auto;
    opacity: 0; visibility: hidden; transform: translateY(-6px) scale(0.98); transform-origin: top right;
    transition: opacity 220ms var(--ease-out-quart), transform 220ms var(--ease-out-quart), visibility 0s linear 220ms;
    z-index: 50;
  }
  .nav-dropdown.open .nav-dropdown-menu { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
  .menu-group { background: var(--bg); border-radius: 18px; padding: 0.35rem; }
  .menu-title { margin: 0; padding: 0.55rem 0.8rem 0.3rem; font-size: 0.78rem; font-weight: 800; color: var(--soft); }
  .site-nav .nav-dropdown-menu a:not(.btn) { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; min-height: 44px; padding: 0.6rem 0.8rem; border-radius: 12px; color: var(--ink); text-transform: none; letter-spacing: 0; font-size: 0.93rem; font-weight: 600; }
  .site-nav .nav-dropdown-menu a:not(.btn)::after { content: none; }
  .site-nav .nav-dropdown-menu a:not(.btn):hover { background: var(--teal-50); color: var(--teal-700); }
  .site-nav .nav-dropdown-menu a.menu-accent { color: var(--teal-700); font-weight: 800; }
  .nav-dropdown-menu .icon { width: 18px; height: 18px; flex: none; color: var(--soft); }
  .site-nav .nav-dropdown-menu a.menu-biz { background: var(--deep); color: var(--white); padding: 0.95rem 1rem; border-radius: 18px; }
  .site-nav .nav-dropdown-menu a.menu-biz:hover { background: var(--teal-700); color: var(--white); }
  .menu-biz span { display: flex; flex-direction: column; gap: 0.15rem; }
  .menu-biz b { font-size: 1rem; font-weight: 800; }
  .menu-biz small { font-size: 0.78rem; font-weight: 500; opacity: 0.8; }
  .nav-dropdown-menu a.menu-biz .icon { color: var(--gold-600); width: 20px; height: 20px; }
  .menu-mobile { display: none; }
  .menu-badge { display: inline-block; margin-left: 0.5rem; padding: 0.15rem 0.55rem; border-radius: 999px; background: var(--gold-100, #f3e6c4); color: var(--gold-700, #8a6420); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.02em; vertical-align: 1px; }
  .menu-theme { display: flex; align-items: center; justify-content: space-between; padding: 0.1rem 0.8rem 0.1rem 1rem; font-size: 0.85rem; font-weight: 600; color: var(--soft); }

  .btn { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 999px; padding: 0.7rem 1.3rem; font-weight: 700; font-size: 0.92rem; text-decoration: none; border: none; cursor: pointer; font-family: inherit; transition: transform 200ms var(--ease-out-quart), box-shadow 200ms var(--ease-out-quart), background 200ms var(--ease-out-quart); }
  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: translateY(0) scale(0.97); transition-duration: 90ms; }
  .btn-ico { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.18); display: inline-flex; align-items: center; justify-content: center; flex: none; transition: transform 500ms var(--ease-out-quart), background 500ms var(--ease-out-quart); }
  .btn-ico .icon { width: 15px; height: 15px; stroke-width: 2.2; }
  .btn:hover .btn-ico, .nav-cta-negocio:hover .btn-ico { transform: translate(2px, -1px) scale(1.08); background: rgba(255,255,255,0.28); }
  .btn.has-ico { padding: 0.35rem 0.4rem 0.35rem 1.4rem; gap: 0.8rem; }
  .btn-primary { background: var(--teal-600); color: var(--white); box-shadow: var(--sh-teal); }
  .btn-primary:hover { background: var(--teal-hover); box-shadow: 0 12px 26px rgba(10,79,77,0.28); }
  .btn-ghost { background: var(--card); color: var(--teal-700); border: 1.5px solid var(--line); }
  .btn-ghost:hover { border-color: var(--teal-500); }
  .badge { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--teal-100); color: var(--teal-700); border-radius: 999px; padding: 0.3rem 0.7rem; font-size: 0.78rem; font-weight: 700; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh-2); }
  .card:active { transform: scale(0.985); transition: transform 120ms var(--ease-out-quart); }

  .atmosphere { position: absolute; inset: -2rem -1rem auto -1rem; height: 26rem; overflow: hidden; z-index: -1; pointer-events: none; }
  .atmosphere span { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.4; animation: atmosphere-drift 16s var(--ease) infinite alternate; }
  .atmosphere span:nth-child(1) { width: 22rem; height: 22rem; background: var(--teal-500); top: -9rem; left: -6rem; }
  .atmosphere span:nth-child(2) { width: 16rem; height: 16rem; background: var(--gold-100); top: -2rem; right: -4rem; opacity: 0.7; animation-duration: 20s; animation-delay: -6s; }
  /* Deriva ambiental muy sutil (2026-08-27): los blobs de fondo del hero
     estaban estáticos; este movimiento lento (solo transform, nunca se
     nota "animándose" a simple vista, se siente como aire vivo detrás del
     texto) es la clase de detalle que separa un fondo decorativo de uno
     con presencia. Se apaga entero bajo reduced-motion más abajo. */
  @keyframes atmosphere-drift {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(1.4rem, -1rem) scale(1.06); }
  }

  /* Motion: entrada visible por defecto (SEO / sin JS), la mejora la
     resta y la revela con IntersectionObserver — ver DESIGN.md/animate.md.
     Ajustado 2026-08-27: 700ms se sentía perezoso comparado con el resto
     de las micro-interacciones del sitio (150-300ms); se acorta a 480ms y
     se suma una escala sutil (0.97->1) al translateY para que la entrada
     se sienta como que el elemento "llega", no solo que aparece. */
  .js .reveal { opacity: 0; transform: translateY(18px); transition: opacity 760ms var(--ease-out-quart), transform 760ms var(--ease-out-quart); transition-delay: calc(var(--i, 0) * 60ms); }
  .js .reveal.in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .js .reveal { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
    .atmosphere span { animation: none !important; }
    html { scroll-behavior: auto; }
  }

  /* Footer verde profundo con acentos dorados (2026-08-27, a pedido de
     Víctor — referencia visual que compartió: "ayuda y refuerza al site
     con más identidad"). Antes era un footer claro genérico; el verde
     oscuro + dorado es la misma paleta "joyería" que ya usa el resto de
     Bukea (categorías del home, badges), llevada al footer para cerrar
     la página con una nota de marca en vez de deshacerse en gris neutro. */
  .store-btns { display: flex; gap: 0.7rem; flex-wrap: wrap; justify-content: center; }
  .store-btn { display: inline-flex; align-items: center; gap: 0.65rem; padding: 0.55rem 1.1rem 0.55rem 0.9rem; border-radius: 14px; background: oklch(12% 0.02 200); color: var(--white); text-decoration: none; font-weight: 800; font-size: 1rem; line-height: 1.1; transition: transform 200ms var(--ease-out-quart), background 200ms var(--ease-out-quart); }
  .store-btn:hover { transform: translateY(-2px); background: var(--deep); }
  .store-btn small { display: block; font-size: 0.64rem; font-weight: 600; opacity: 0.8; margin-bottom: 0.1rem; }
  .store-ico { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
  .store-ico svg { width: 22px; height: 22px; }
  .site-footer { background: var(--deep) var(--dots-white); margin-top: 4rem; font-size: 0.85rem; color: rgba(255,255,255,0.68); }
  .site-footer a { color: rgba(255,255,255,0.68); text-decoration: none; }
  .site-footer a:hover { color: var(--gold-600); }
  .site-footer .footer-brand .brand { color: var(--white); }
  .site-footer .footer-brand .brand .mark { border: 1px solid rgba(201, 164, 92, 0.5); }
  .site-footer { position: relative; }
  .site-footer::before { content: ""; position: absolute; top: 0; left: 8%; right: 8%; height: 1px; background: linear-gradient(to right, transparent, oklch(80% 0.12 78 / 0.8), transparent); }
  .footer-grid { display: grid; grid-template-columns: 1.7fr repeat(4, 1fr); gap: 2rem; padding: 3.2rem 20px 2.2rem; }
  .footer-stores { justify-content: flex-start; margin: 1.1rem 0 1.1rem; }
  .footer-stores .store-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); color: var(--white); padding: 0.4rem 0.85rem 0.4rem 0.7rem; font-size: 0.86rem; }
  .footer-stores .store-btn:hover { background: var(--white); color: var(--deep); }
  .site-footer .store-btn { color: var(--white); }
  .site-footer .store-btn:hover { color: var(--deep); }
  .footer-brand p { margin: 0.9rem 0 0; max-width: 30ch; line-height: 1.55; color: rgba(255,255,255,0.6); }
  .footer-col h4 { margin: 0 0 0.9rem; font-size: 0.78rem; color: var(--gold-600); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
  .footer-col a, .footer-col .footer-soon { display: block; padding: 0.32rem 0; font-size: 0.87rem; }
  .footer-col .footer-soon { color: rgba(255,255,255,0.45); }
  .footer-col a { display: flex; align-items: center; gap: 0.4rem; }
  /* Redes sociales del footer (2026-08-27): antes era una lista vertical
     de texto ("↗ Facebook", "↗ TikTok"...) que ocupaba toda una columna
     por sí sola — se reemplaza por una fila compacta de íconos redondos,
     patrón más elegante y estándar de footer. */
  .footer-social-row { display: flex; gap: 0.6rem; margin-top: 0.2rem; }
  .footer-social-row a {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 50%; flex: none;
    background: none; border: 1px solid rgba(201, 164, 92, 0.5); color: var(--gold-600);
    transition: background 180ms var(--ease-out-quart), color 180ms var(--ease-out-quart), border-color 180ms var(--ease-out-quart), transform 180ms var(--ease-out-quart);
  }
  .footer-social-row a:hover { background: var(--gold-600); color: var(--deep); border-color: var(--gold-600); transform: translateY(-2px); }
  .footer-social-row a:active { transform: scale(0.9); transition-duration: 100ms; }
  .footer-social-row .icon { width: 18px; height: 18px; }
  .footer-credit a { text-decoration: underline; text-underline-offset: 3px; }
  .footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; padding: 1.1rem 20px; border-top: 1px solid rgba(255,255,255,0.12); font-size: 0.78rem; color: rgba(255,255,255,0.6); }
  @media (max-width: 820px) {
    .footer-grid { grid-template-columns: repeat(2, 1fr); }
    .footer-brand { grid-column: 1 / -1; }
  }
  @media (max-width: 640px) {
    /* Header móvil (2026-08-27, a pedido de Víctor): antes quedaba el pill
       "Regístrate" a la izquierda y el ícono de menú a la derecha, con un
       vacío grande entre los dos porque .site-nav envolvía en una segunda
       fila. Ahora la fila del header tiene solo dos elementos balanceados
       (logo + menú) y "Regístrate" pasa a ser el primer ítem, destacado,
       dentro del menú desplegable — un solo punto de entrada, no dos. */
    .site-header { padding-top: 12px; padding-bottom: 12px; }
    .brand { font-size: 1.15rem; }
    .site-nav { gap: 0.2rem; }
    .site-nav a.nav-login, .site-nav > a.nav-pill-negocios { display: none; }
    .menu-mobile-only { display: block !important; }
    .nav-menu-label { display: none; }
    .nav-dropdown-toggle { width: 40px; padding: 0 !important; justify-content: center; border-color: transparent !important; background: transparent !important; }
    .nav-dropdown-menu { left: 0; right: 0; width: auto; transform-origin: top center; }
    .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 1.6rem; padding: 2.4rem 20px 1.6rem; }
    .footer-brand { grid-column: 1 / -1; }
  }
</style>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9P6W5CRECN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-9P6W5CRECN');
</script>
</head>
<body>
${ICON_SPRITE}
${bannerHtml}
<header class="site-header-wrap">
  <div class="wrap site-header">
    <a class="brand" href="/"><span class="mark">b</span>Bukea</a>
    <nav class="site-nav" aria-label="Principal">
      <a href="/entrar" class="nav-login nav-session" data-session-link>Iniciar sesión</a>
      <a href="/unete" class="nav-pill-negocios">Para negocios</a>
      <div class="nav-dropdown">
        <button type="button" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="site-menu" aria-label="Menú">
          <span class="nav-menu-label">Menú</span>
          <svg class="icon ic-open"><use href="#i-menu"/></svg>
          <svg class="icon ic-close"><use href="#i-x"/></svg>
        </button>
        <div class="nav-dropdown-menu" id="site-menu">
          <div class="menu-group menu-mobile-only">
            <p class="menu-title">Tu cuenta</p>
            <a href="/entrar" class="menu-accent" data-session-link>Iniciar sesión o registrarte<svg class="icon"><use href="#i-chevron-right"/></svg></a>
            <a href="/unete">Para negocios<svg class="icon"><use href="#i-chevron-right"/></svg></a>
          </div>
          <div class="menu-group">
            <p class="menu-title">Bukea</p>
            <a href="/">Inicio<svg class="icon"><use href="#i-chevron-right"/></svg></a>
            <a href="/nosotros">Nosotros<svg class="icon"><use href="#i-chevron-right"/></svg></a>
            <a href="/descargar">Descargar la app<svg class="icon"><use href="#i-chevron-right"/></svg></a>
            <a href="/blog">Blog<svg class="icon"><use href="#i-chevron-right"/></svg></a>
            <a href="/contacto">Ayuda y contacto<svg class="icon"><use href="#i-chevron-right"/></svg></a>
          </div>
          <a href="/unete" class="menu-biz"><span><b>¿Tienes un negocio?</b><small>Únete a Bukea${spotsBadge}</small></span><svg class="icon"><use href="#i-arrow-up-right"/></svg></a>
          <div class="menu-theme"><span>Tema oscuro</span><button type="button" class="theme-toggle" aria-label="Cambiar entre tema claro y oscuro"><svg class="icon i-moon"><use href="#i-moon"/></svg><svg class="icon i-sun"><use href="#i-sun"/></svg></button></div>
        </div>
      </div>
    </nav>
  </div>
</header>
${bodyHtml}
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <a class="brand" href="/"><span class="mark">b</span>Bukea</a>
      <p>Reserva tu próxima cita en República Dominicana. Cero comisión, gratis para siempre para el cliente.</p>
      ${storeButtons('footer-stores')}
      <div class="footer-social-row">
        <a href="https://www.facebook.com/bukeard" target="_blank" rel="noopener" aria-label="Facebook"><svg class="icon"><use href="#i-facebook"/></svg></a>
        <a href="https://www.instagram.com/bukeard" target="_blank" rel="noopener" aria-label="Instagram"><svg class="icon"><use href="#i-instagram"/></svg></a>
        <a href="https://www.tiktok.com/@bukeard" target="_blank" rel="noopener" aria-label="TikTok"><svg class="icon"><use href="#i-tiktok"/></svg></a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Para clientes</h4>
      <a href="/">Buscar y reservar</a>
      <a href="/mapa">Ver en mapa</a>
      <a href="/descargar">Descargar la app</a>
      <a href="/entrar" data-session-link>Iniciar sesión</a>
    </div>
    <div class="footer-col">
      <h4>Para negocios</h4>
      <a href="${PORTAL_URL}">Mi Negocio</a>
      <a href="/unete">Únete</a>
    </div>
    <div class="footer-col">
      <h4>Bukea</h4>
      <a href="/nosotros">Nosotros</a>
      <a href="/blog">Blog</a>
      <a href="/contacto">Ayuda y contacto</a>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <a href="/privacidad">Política de privacidad</a>
      <a href="/terminos">Términos de servicio</a>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <span>© ${new Date().getFullYear()} Bukea · República Dominicana</span>
    <span>Cero comisión, para siempre</span>
  </div>
</footer>
<script>
(function () {
  document.documentElement.classList.add('js');
  var tt = document.querySelector('.theme-toggle');
  if (tt) tt.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { sessionStorage.setItem('bukea_theme', next); } catch (e) {}
  });
  var dd = document.querySelector('.nav-dropdown');
  if (dd) {
    var ddToggle = dd.querySelector('.nav-dropdown-toggle');
    var closeDD = function () { dd.classList.remove('open'); ddToggle.setAttribute('aria-expanded', 'false'); };
    ddToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dd.classList.toggle('open');
      ddToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) closeDD(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDD(); });
  }
  var header = document.querySelector('.site-header-wrap');
  if (header) {
    var raf = null;
    var onScroll = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        header.classList.toggle('scrolled', window.scrollY > 6);
        raf = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroEl = document.getElementById('hero');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { heroEl.classList.toggle('is-offscreen', !e[0].isIntersecting); }).observe(heroEl);
  }
  var targets = document.querySelectorAll('.reveal, .rv');
  if (reduced || !targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(function (el) { io.observe(el); });
  // Red de seguridad: un salto de scroll instantáneo (scrollIntoView,
  // anchor jump) puede mover un elemento de "debajo" a "encima" del
  // viewport en un solo frame sin que el observer llegue a reportarlo
  // como visible — nunca debe quedar contenido invisible. Un barrido
  // manual en scroll/resize cubre ese caso.
  var sweepRaf = null;
  var sweep = function () {
    if (sweepRaf) return;
    sweepRaf = requestAnimationFrame(function () {
      sweepRaf = null;
      document.querySelectorAll('.reveal:not(.in), .rv:not(.in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > -200) {
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    });
  };
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep, { passive: true });
})();
</script>
<script>
/* Enlaces de sesión (2026-10-11): con sesión abierta, "Iniciar sesión" pasa a "Mi cuenta". */
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('bukea_session'));
    if (!s || !s.token) return;
    document.querySelectorAll('[data-session-link]').forEach(function (a) {
      a.href = '/cuenta';
      var icon = a.querySelector('svg');
      a.textContent = 'Mi cuenta';
      if (icon) a.appendChild(icon);
    });
  } catch (e) { /* sin acceso a localStorage: se queda "Iniciar sesión" */ }
})();
</script>
</body>
</html>`;
}

// Portal de negocios (2026-10-11): subdominio propio en producción
// (PORTAL_URL=https://negocio.bukeard.com); en local y mientras el subdominio
// no exista, cae a la ruta /negocio del mismo servidor.
const PORTAL_URL = process.env.PORTAL_URL || '/negocio';
// Registro de negocios nuevos: /unete manda aquí (2026-10-11). Mi Negocio (PORTAL_URL) es solo acceso.
const PORTAL_REGISTER_URL = PORTAL_URL + (/^https?:\/\/[^/]+$/.test(PORTAL_URL) ? '/' : '') + '?registro=1';

// Fichas reales de la app (verificadas 2026-10-11: App Store por bundle
// com.bukea.app, Google Play por id com.bukea.app).
const APP_STORE_URL = 'https://apps.apple.com/do/app/bukea-citas-y-reservas/id6805996215';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.bukea.app';
const APPLE_LOGO = '<svg viewBox="0 0 17 20" fill="currentColor" aria-hidden="true"><path d="M13.998 10.63c-.024-2.415 1.973-3.573 2.063-3.63-1.126-1.646-2.877-1.872-3.502-1.897-1.49-.152-2.91.877-3.665.877-.755 0-1.923-.856-3.16-.833-1.627.024-3.128.946-3.965 2.402-1.692 2.933-.432 7.28 1.216 9.66.806 1.166 1.767 2.474 3.028 2.427 1.216-.048 1.674-.786 3.144-.786 1.47 0 1.883.786 3.17.762 1.31-.024 2.14-1.19 2.94-2.36.926-1.354 1.307-2.665 1.33-2.734-.03-.012-2.552-.98-2.576-3.888h-.023z"/><path d="M11.578 3.508c.668-.81 1.121-1.937.997-3.06-.964.04-2.13.643-2.822 1.452-.618.719-1.16 1.87-1.014 2.976 1.076.083 2.17-.55 2.839-1.368z"/></svg>';
const PLAY_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00d2ff" d="M3.6 1.8c-.3.3-.5.8-.5 1.4v17.6c0 .6.2 1.1.5 1.4l.1.1L13.5 12v-.2L3.7 1.7z"/><path fill="#ffce00" d="M16.8 15.3 13.5 12v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2z"/><path fill="#f43f5e" d="M16.9 15.2 13.5 11.9 3.6 21.8c.4.4 1 .4 1.7.1z"/><path fill="#00e676" d="M16.9 8.6 5.3 2.1c-.7-.4-1.3-.3-1.7.1l9.9 9.7z"/></svg>';
const storeButtons = (cls = '') => `<div class="store-btns ${cls}">
  <a class="store-btn" href="${APP_STORE_URL}" target="_blank" rel="noopener"><span class="store-ico">${APPLE_LOGO}</span><span><small>Descárgala en el</small>App Store</span></a>
  <a class="store-btn" href="${PLAY_STORE_URL}" target="_blank" rel="noopener"><span class="store-ico">${PLAY_LOGO}</span><span><small>Disponible en</small>Google Play</span></a>
</div>`;


module.exports = { PORTAL_URL, PORTAL_REGISTER_URL, APP_STORE_URL, storeButtons, CAT_LABELS, CAT_ICONS, CITY_LABELS, CONTACT_EMAIL, FOUNDING_FREE_LIMIT, avatarGradient, initials, formatPrice, esc, pageShell, ICON_SPRITE };
