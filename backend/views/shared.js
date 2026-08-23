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
};

const CAT_ICONS = {
  barberia: 'c-barberia',
  unas: 'c-unas',
  salon: 'c-salon',
  maquillaje: 'c-maquillaje',
  'cejas-mua': 'c-cejas',
  pilates: 'c-pilates',
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
// Sprite de íconos — mismo lenguaje visual que la app (trazo 1.75px,
// esquinas redondeadas, sin relleno salvo el check). Ver DESIGN.md.
const ICON_SPRITE = `<svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5"/><line x1="14.7" y1="14.7" x2="20" y2="20"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="6.5"/><line x1="16" y1="3" x2="16" y2="6.5"/></symbol>
<symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M4 19.5 5.3 15.6A8 8 0 1 1 8.7 19L4 19.5Z"/><path d="M9 12.3l1.8 1.8 4-4.3"/></symbol>
<symbol id="i-cash" viewBox="0 0 24 24"><rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.7"/><line x1="4.5" y1="12" x2="5.6" y2="12"/><line x1="18.4" y1="12" x2="19.5" y2="12"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.3"/><path d="M12 7v5.3l3.6 2.1"/></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><line x1="3.5" y1="20" x2="20.5" y2="20"/><rect x="5.5" y="13.5" width="3.4" height="6.5" rx="0.6"/><rect x="10.3" y="8.5" width="3.4" height="11.5" rx="0.6"/><rect x="15.1" y="4.5" width="3.4" height="15.5" rx="0.6"/></symbol>
<symbol id="i-percent" viewBox="0 0 24 24"><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/><line x1="18.2" y1="5.8" x2="5.8" y2="18.2"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></symbol>
<symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="M5 9l7 7 7-7"/></symbol>
<symbol id="i-map-pin" viewBox="0 0 24 24"><path d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 1 0 5.5 10c0 4.9 6.5 11 6.5 11Z"/><circle cx="12" cy="10" r="2.4"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></symbol>
<symbol id="c-barberia" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M19.5 4.5 8.3 15.7"/><path d="M14.6 14.4 19.5 19.5"/><path d="M8.3 8.3 11.8 11.8"/></symbol>
<symbol id="c-unas" viewBox="0 0 24 24"><rect x="9.6" y="2.6" width="4.8" height="2.6" rx="0.8"/><path d="M10.6 5.2v2.1h2.8V5.2"/><path d="M8.5 7.3h7a1 1 0 0 1 1 1.1l-.85 9.3a2 2 0 0 1-2 1.8h-3.3a2 2 0 0 1-2-1.8l-.85-9.3a1 1 0 0 1 1-1.1Z"/></symbol>
<symbol id="c-salon" viewBox="0 0 24 24"><path d="M5 5.5h14v3H5z"/><path d="M6.5 8.5v11M9.7 8.5v11M12.9 8.5v11M16.1 8.5v11M19 8.5v6.5"/></symbol>
<symbol id="c-maquillaje" viewBox="0 0 24 24"><path d="M9.3 10.6 11 5.4h2l1.7 5.2"/><rect x="9.4" y="10.6" width="5.2" height="5.4" rx="0.6"/><rect x="9" y="16" width="6" height="5.4" rx="1.2"/></symbol>
<symbol id="c-cejas" viewBox="0 0 24 24"><path d="M18.4 2.9 14 7.3l-1.6-1.6a1.6 1.6 0 0 0-2.3 0L8.3 7.5l8.2 8.2 1.8-1.8a1.6 1.6 0 0 0 0-2.3L16.7 10l4.4-4.4a1.8 1.8 0 1 0-2.7-2.7Z"/><path d="M9.2 8.6c-1.8 2.7-3.6 3.2-6.2 3.6l7.2 9c1.8-.9 5.4-4.4 5.4-6.2"/><path d="M13.6 16.4 4.8 14.2"/></symbol>
<symbol id="c-pilates" viewBox="0 0 24 24"><circle cx="12" cy="4.3" r="1.9"/><path d="M12 6.6v5.6"/><path d="M12 8.4 7.4 5.6"/><path d="M12 8.4l4.6-2.8"/><path d="M12 12.2 8.3 20"/><path d="M12 12.2l3.7 7.8"/></symbol>
</defs></svg>`;

function pageShell({ base, title, description, canonicalPath, bodyHtml, ogImage }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0f6f6b">
<link rel="canonical" href="${esc(canonicalPath)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<link rel="icon" type="image/png" sizes="32x32" href="${base}/favicon-32.png">
<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
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
    --gold-100: oklch(94% 0.05 78);
    --whatsapp: #25d366;
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
  .icon { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }

  /* Foco de teclado visible en todo el sitio — nunca lo suprimimos sin
     un reemplazo con contraste real (WCAG 2.4.7). */
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2.5px solid var(--teal-600); outline-offset: 2px; border-radius: 4px;
  }

  .site-header-wrap { position: sticky; top: 0; z-index: 40; background: rgba(247,251,250,0.72); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid transparent; transition: box-shadow 260ms var(--ease-out-quart), border-color 260ms var(--ease-out-quart); }
  .site-header-wrap.scrolled { box-shadow: 0 6px 24px rgba(15,40,38,0.08); border-bottom-color: var(--line); }
  .site-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
  .brand { display: flex; align-items: center; gap: 0.55rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.3rem; text-decoration: none; color: var(--teal-900); }
  .brand .mark { width: 34px; height: 34px; border-radius: 10px; background: var(--teal-600); color: #fff; display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; transition: transform 240ms var(--ease-out-quart); }
  .brand:hover .mark { transform: rotate(-6deg) scale(1.05); }
  .site-nav { display: flex; align-items: center; gap: 1.1rem; font-size: 0.86rem; font-weight: 700; }
  .site-nav a:not(.btn), .nav-dropdown-toggle {
    display: inline-flex; align-items: center; gap: 0.3rem; min-height: 44px; padding: 0.4rem 0.15rem;
    text-decoration: none; color: var(--soft); position: relative; background: none; border: none;
    font: inherit; font-weight: 700; cursor: pointer;
    text-transform: uppercase; letter-spacing: 0.03em;
  }
  .nav-short { display: none; }
  .site-nav a:not(.btn)::after, .nav-dropdown-toggle::after { content: ""; position: absolute; left: 0; right: 100%; bottom: 8px; height: 2px; background: var(--teal-600); border-radius: 2px; transition: right 220ms var(--ease-out-quart); }
  .site-nav a:not(.btn):hover, .nav-dropdown-toggle:hover { color: var(--teal-700); }
  .site-nav a:not(.btn):hover::after, .nav-dropdown-toggle:hover::after { right: 0; }
  .icon-chevron { width: 14px; height: 14px; transition: transform 200ms var(--ease-out-quart); }
  .nav-dropdown { position: relative; }
  .nav-dropdown.open .icon-chevron { transform: rotate(180deg); }
  .nav-dropdown-menu {
    position: absolute; top: 100%; left: 50%; transform: translateX(-50%) translateY(6px);
    background: var(--card); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--sh-3);
    padding: 0.45rem; min-width: 190px; display: flex; flex-direction: column; gap: 0.1rem;
    opacity: 0; visibility: hidden; transition: opacity 180ms var(--ease-out-quart), transform 180ms var(--ease-out-quart);
    z-index: 50;
  }
  .nav-dropdown.open .nav-dropdown-menu { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
  .nav-dropdown-menu a { padding: 0.7rem 0.9rem; min-height: auto; border-radius: 9px; color: var(--ink); }
  .nav-dropdown-menu a::after { content: none; }
  .nav-dropdown-menu a:hover { background: var(--teal-50); color: var(--teal-700); }

  .btn { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 999px; padding: 0.7rem 1.3rem; font-weight: 700; font-size: 0.92rem; text-decoration: none; border: none; cursor: pointer; font-family: inherit; transition: transform 200ms var(--ease-out-quart), box-shadow 200ms var(--ease-out-quart), background 200ms var(--ease-out-quart); }
  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: translateY(0) scale(0.97); transition-duration: 90ms; }
  .btn-primary { background: var(--teal-600); color: #fff; box-shadow: var(--sh-teal); }
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

  .site-footer { background: var(--teal-50); border-top: 1px solid var(--line); margin-top: 4rem; font-size: 0.85rem; }
  .site-footer a { color: var(--soft); text-decoration: none; }
  .site-footer a:hover { color: var(--teal-700); }
  .footer-grid { display: grid; grid-template-columns: 1.5fr repeat(4, 1fr); gap: 2rem; padding: 3rem 20px 2rem; }
  .footer-brand p { margin: 0.9rem 0 0; max-width: 30ch; line-height: 1.55; color: var(--soft); }
  .footer-col h4 { margin: 0 0 0.9rem; font-size: 0.85rem; color: var(--ink); font-weight: 800; }
  .footer-col a, .footer-col .footer-soon { display: block; padding: 0.32rem 0; font-size: 0.87rem; }
  .footer-col .footer-soon { color: var(--soft); }
  .footer-col a { display: flex; align-items: center; gap: 0.4rem; }
  .footer-social-arrow { color: var(--teal-600); font-size: 0.9rem; }
  .footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; padding: 1.1rem 20px; border-top: 1px solid var(--line); font-size: 0.78rem; color: var(--soft); }
  @media (max-width: 820px) {
    .footer-grid { grid-template-columns: repeat(2, 1fr); }
    .footer-brand { grid-column: 1 / -1; }
  }
  @media (max-width: 640px) {
    .site-header { flex-wrap: wrap; gap: 0.3rem 0.6rem; padding: 12px 0; }
    .brand { font-size: 1.15rem; }
    .site-nav { width: 100%; justify-content: space-between; gap: 0.2rem; font-size: 0.8rem; }
    .site-nav .btn { padding: 0.55rem 1rem; }
    .site-nav a.nav-home { display: none; }
    .site-nav .nav-long { display: none; }
    .site-nav .nav-short { display: inline; }
    .footer-grid { grid-template-columns: 1fr; gap: 1.6rem; padding: 2.4rem 20px 1.6rem; }
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
<header class="site-header-wrap">
  <div class="wrap site-header">
    <a class="brand" href="/"><span class="mark">b</span>Bukea</a>
    <nav class="site-nav">
      <a href="/" class="nav-home">Inicio</a>
      <a href="${base}/?join=1"><span class="nav-long">Registro negocio</span><span class="nav-short">Regístrate</span></a>
      <div class="nav-dropdown">
        <button type="button" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">
          Menú <svg class="icon icon-chevron"><use href="#i-chevron-down"/></svg>
        </button>
        <div class="nav-dropdown-menu">
          <a href="/negocios">Para negocios</a>
          <a href="/precios">Precios</a>
          <a href="/mapa">Ver en mapa</a>
          <a href="${base}/">Entrar</a>
        </div>
      </div>
      <a href="/contacto">Contacto</a>
    </nav>
  </div>
</header>
${bodyHtml}
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <a class="brand" href="/"><span class="mark">b</span>Bukea</a>
      <p>Reserva tu próxima cita en República Dominicana. Cero comisión, gratis para siempre para el cliente.</p>
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
      <a href="${base}/?join=1">Registra tu negocio</a>
      <a href="${base}/">Abrir la app</a>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <a href="/privacidad">Política de privacidad</a>
      <a href="/terminos">Términos de servicio</a>
    </div>
    <div class="footer-col">
      <h4>Síguenos en nuestras redes sociales</h4>
      <a href="https://www.facebook.com/bukeard" target="_blank" rel="noopener"><span class="footer-social-arrow">↗</span>Facebook</a>
      <a href="https://www.tiktok.com/@bukeard" target="_blank" rel="noopener"><span class="footer-social-arrow">↗</span>TikTok</a>
      <a href="https://www.instagram.com/bukeard" target="_blank" rel="noopener"><span class="footer-social-arrow">↗</span>Instagram</a>
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

module.exports = { CAT_LABELS, CAT_ICONS, CITY_LABELS, CONTACT_EMAIL, avatarGradient, initials, formatPrice, esc, pageShell };
