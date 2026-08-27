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

const CONTACT_EMAIL = 'hola@bukeard.com';

const { getSettings } = require('../lib/settings');

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

function formatPrice(cents) {
  return 'RD$ ' + Math.round(cents / 100);
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
<symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></symbol>
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
</defs></svg>`;

// Banner de anuncio (2026-08-24, Configuración del panel de administración)
// — texto corto activable/desactivable sin deploy, para avisos de
// mantenimiento o promociones del piloto. Solo en el marketplace público
// por ahora (no en el panel de negocio ni en la app empacada).
async function pageShell({ base, title, description, canonicalPath, bodyHtml, ogImage }) {
  const settings = await getSettings();
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
<link rel="icon" type="image/png" sizes="32x32" href="${base}/favicon-32.png">
<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap"></noscript>
<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>
<style>
  :root {
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
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --sh-2: 0 4px 14px rgba(15,40,38,0.07);
    --sh-3: 0 14px 34px rgba(15,40,38,0.12);
    --sh-teal: 0 8px 20px rgba(10,79,77,0.22);
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--ink); }
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
  .site-header-wrap { position: sticky; top: 0; z-index: 40; background: rgba(247,251,250,0.72); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid transparent; transition: box-shadow 260ms var(--ease-out-quart), border-color 260ms var(--ease-out-quart); }
  .site-header-wrap.scrolled { box-shadow: 0 6px 24px rgba(15,40,38,0.08); border-bottom-color: var(--line); }
  .site-header { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; padding-bottom: 16px; }
  .brand { display: flex; align-items: center; gap: 0.55rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.3rem; text-decoration: none; color: var(--teal-900); }
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
  .nav-cta-negocio { display: inline-flex; align-items: center; background: oklch(94% 0.04 150); color: oklch(38% 0.1 150); padding: 0.4rem 0.9rem; border-radius: 999px; transition: background 200ms var(--ease-out-quart); }
  .nav-cta-negocio:hover { background: oklch(90% 0.06 150); color: var(--teal-900); }
  .nav-dropdown-menu {
    position: absolute; top: 100%; right: 0; transform: translateY(6px);
    background: var(--card); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--sh-3);
    padding: 0.45rem; min-width: 230px; display: flex; flex-direction: column; gap: 0.1rem;
    opacity: 0; visibility: hidden; transition: opacity 180ms var(--ease-out-quart), transform 180ms var(--ease-out-quart);
    z-index: 50;
  }
  .nav-dropdown.open .nav-dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
  .nav-dropdown-menu a { padding: 0.7rem 0.9rem; min-height: auto; border-radius: 9px; color: var(--ink); }
  .nav-dropdown-divider { height: 1px; background: var(--line); margin: 0.35rem 0.4rem; flex: none; }
  .nav-dropdown-menu a::after { content: none; }
  .nav-dropdown-menu a:hover { background: var(--teal-50); color: var(--teal-700); }
  .nav-dropdown-menu a.nav-cta-negocio-item {
    display: none; align-items: center; gap: 0.5rem; background: var(--teal-600); color: var(--white);
    font-weight: 800; margin-bottom: 0.35rem;
  }
  .nav-dropdown-menu a.nav-cta-negocio-item:hover { background: var(--teal-700); color: var(--white); }

  .btn { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 999px; padding: 0.7rem 1.3rem; font-weight: 700; font-size: 0.92rem; text-decoration: none; border: none; cursor: pointer; font-family: inherit; transition: transform 200ms var(--ease-out-quart), box-shadow 200ms var(--ease-out-quart), background 200ms var(--ease-out-quart); }
  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: translateY(0) scale(0.97); transition-duration: 90ms; }
  .btn-primary { background: var(--teal-600); color: var(--white); box-shadow: var(--sh-teal); }
  .btn-primary:hover { background: var(--teal-700); box-shadow: 0 12px 26px rgba(10,79,77,0.28); }
  .btn-ghost { background: var(--card); color: var(--teal-700); border: 1.5px solid var(--line); }
  .btn-ghost:hover { border-color: var(--teal-500); }
  .badge { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--teal-100); color: var(--teal-700); border-radius: 999px; padding: 0.3rem 0.7rem; font-size: 0.78rem; font-weight: 700; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh-2); }

  .atmosphere { position: absolute; inset: -2rem -1rem auto -1rem; height: 26rem; overflow: hidden; z-index: -1; pointer-events: none; }
  .atmosphere span { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.4; }
  .atmosphere span:nth-child(1) { width: 22rem; height: 22rem; background: var(--teal-500); top: -9rem; left: -6rem; }
  .atmosphere span:nth-child(2) { width: 16rem; height: 16rem; background: var(--gold-100); top: -2rem; right: -4rem; opacity: 0.7; }

  /* Motion: entrada visible por defecto (SEO / sin JS), la mejora la
     resta y la revela con IntersectionObserver — ver DESIGN.md/animate.md. */
  .js .reveal { opacity: 0; transform: translateY(18px); transition: opacity 700ms var(--ease-out-expo), transform 700ms var(--ease-out-expo); transition-delay: calc(var(--i, 0) * 60ms); }
  .js .reveal.in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    html { scroll-behavior: auto; }
  }

  /* Footer verde profundo con acentos dorados (2026-08-27, a pedido de
     Víctor — referencia visual que compartió: "ayuda y refuerza al site
     con más identidad"). Antes era un footer claro genérico; el verde
     oscuro + dorado es la misma paleta "joyería" que ya usa el resto de
     Bukea (categorías del home, badges), llevada al footer para cerrar
     la página con una nota de marca en vez de deshacerse en gris neutro. */
  .site-footer { background: var(--teal-900); margin-top: 4rem; font-size: 0.85rem; color: rgba(255,255,255,0.68); }
  .site-footer a { color: rgba(255,255,255,0.68); text-decoration: none; }
  .site-footer a:hover { color: var(--gold-600); }
  .site-footer .footer-brand .brand { color: var(--white); }
  .site-footer .footer-brand .brand .mark { border: 1px solid rgba(201, 164, 92, 0.5); }
  .footer-grid { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 2rem; padding: 3rem 20px 2rem; }
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
  .footer-social-row a:hover { background: var(--gold-600); color: var(--teal-900); border-color: var(--gold-600); transform: translateY(-2px); }
  .footer-social-row .icon { width: 18px; height: 18px; }
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
    .site-nav a.nav-home { display: none; }
    .site-nav > a.nav-cta-negocio { display: none; }
    .nav-dropdown-menu a.nav-cta-negocio-item { display: flex; }
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
    <nav class="site-nav">
      <a href="/" class="nav-home">Inicio</a>
      <a href="/negocio" class="nav-cta-negocio"><span class="nav-long">Registro negocio</span><span class="nav-short">Regístrate</span></a>
      <div class="nav-dropdown">
        <button type="button" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false" aria-label="Menú">
          <svg class="icon"><use href="#i-menu"/></svg>
        </button>
        <div class="nav-dropdown-menu">
          <a href="/negocio" class="nav-cta-negocio-item"><svg class="icon"><use href="#i-users"/></svg>Registra tu negocio, es gratis</a>
          <a href="/negocios">Para negocios</a>
          <a href="/precios">Precios</a>
          <a href="/mapa">Ver en mapa</a>
          <div class="nav-dropdown-divider"></div>
          <a href="/descargar">Descargar la app</a>
          <div class="nav-dropdown-divider"></div>
          <a href="/blog">Blog</a>
          <a href="/contacto">Ayuda y servicio al cliente</a>
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
      <div class="footer-social-row">
        <a href="https://www.facebook.com/bukeard" target="_blank" rel="noopener" aria-label="Facebook"><svg class="icon"><use href="#i-facebook"/></svg></a>
        <a href="https://www.instagram.com/bukeard" target="_blank" rel="noopener" aria-label="Instagram"><svg class="icon"><use href="#i-instagram"/></svg></a>
        <a href="https://www.tiktok.com/@bukeard" target="_blank" rel="noopener" aria-label="TikTok"><svg class="icon"><use href="#i-tiktok"/></svg></a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Bukea</h4>
      <a href="/">Inicio</a>
      <a href="/negocios">Para negocios</a>
      <a href="/precios">Precios</a>
      <a href="/mapa">Ver en mapa</a>
    </div>
    <div class="footer-col">
      <h4>Ayuda</h4>
      <a href="/contacto">Contacto</a>
      <a href="/negocio">Registra tu negocio</a>
      <a href="${base}/">Abrir la app</a>
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
  var targets = document.querySelectorAll('.reveal');
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
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
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
</body>
</html>`;
}

module.exports = { CAT_LABELS, CAT_ICONS, CITY_LABELS, CONTACT_EMAIL, avatarGradient, initials, formatPrice, esc, pageShell, ICON_SPRITE };
