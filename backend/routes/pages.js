const express = require('express');
const pool = require('../db/pool');
const { PORTAL_URL, PORTAL_REGISTER_URL, APP_STORE_URL, storeButtons, CAT_LABELS, CAT_ICONS, CITY_LABELS, CONTACT_EMAIL, FOUNDING_FREE_LIMIT, avatarGradient, initials, formatPrice, esc, pageShell } = require('../views/shared');
const { negocioShell } = require('../views/negocio');
const { directionLinks } = require('../lib/geocode');
const { nowInSantoDomingo, weekdayOf, formatTime12h } = require('../lib/availability');
const { logoUrl, photoUrl } = require('../lib/uploads');
const mailer = require('../lib/mailer');
const rateLimit = require('../lib/rate-limit');
const { wrapAsyncRouter } = require('../lib/async-router');
const { isReservedSlug, SLUG_RE } = require('../lib/reserved-slugs');

const router = wrapAsyncRouter(express.Router());

const CATEGORIES = Object.keys(CAT_LABELS);

const CITIES = Object.keys(CITY_LABELS);

// Requisito (2026-09-08; relajado 2026-10-12 a pedido de Víctor: basta logo o
// al menos una foto, ya no se exige correo/teléfono verificados)  para aparecer en el marketplace
// público — nunca en el perfil directo (/p/:slug, GET /:slug más abajo).
// Duplicado a propósito en routes/professionals.js (misma condición, mismo
// criterio que directionLinks en lib/geocode.js): son consultas SQL
// independientes en archivos distintos, no vale una capa de indirección
// para una condición de una línea.
// Los 6 negocios demo sembrados (db/init.js) no salen en el marketplace
// (2026-10-12); su perfil directo /p/:slug sigue vivo. No se filtra por
// owner_user_id: Olivercut es real y tampoco tiene dueño asignado.
const VISIBLE_IN_MARKETPLACE_SQL = `(
  slug NOT IN ('joel-el-fino','yesenia-rodriguez','carmen-la-estilista','massiel-nails','estilo-total-rosa','spa-sereno')
  AND (
    verification_required = 0
    OR logo_path IS NOT NULL
    OR EXISTS (SELECT 1 FROM business_photos bp WHERE bp.professional_id = professionals.id)
  )
)`;

const SITE_BASE = process.env.BASE_PATH || '/bukea';
// Hero compartido de las páginas de marketing: mismo lenguaje del home
// (verde profundo, olas, titular en la sans de UI). Sin etiqueta superior:
// el titular lleva el peso. `eyebrow` se acepta por compatibilidad y se ignora.
function mktHeroHtml({ title, sub, ctaHtml, slim }) {
  return `
  <div class="mkt-hero${slim ? ' mkt-hero--slim' : ''}">
    <img class="hero-waves" src="${SITE_BASE}/img/site/hero-waves.svg" alt="" aria-hidden="true" width="712" height="712">
    <div class="mkt-hero-inner">
      <h1 class="reveal" style="--i:0">${title}</h1>
      ${sub ? `<p class="reveal" style="--i:1">${esc(sub)}</p>` : ''}
      ${ctaHtml ? `<div class="mkt-hero-cta reveal" style="--i:2">${ctaHtml}</div>` : ''}
    </div>
  </div>`;
}

function proCardHtml(p, i, base) {
  const avatarUrl = p.logo_path
    ? `${base}/uploads/logos/${p.logo_path.split('/').pop()}`
    : p.first_photo ? `${base}/uploads/business-photos/${p.first_photo.split('/').pop()}` : null;
  return `
    <a class="pro-card reveal" style="--i:${Math.min(i, 9)}" href="/${esc(p.slug)}">
      <div class="pro-avatar" style="background:${avatarGradient(p.slug)}">${avatarUrl ? `<img src="${avatarUrl}" alt="${esc(p.business_name)}">` : esc(initials(p.name))}</div>
      <div class="pro-info">
        <div class="pro-name">${esc(p.name)}</div>
        <div class="pro-meta">${esc(p.business_name)} · ${esc(p.neighborhood)}</div>
        <div class="pro-tags">${esc(p.tags.join(' · '))}</div>
      </div>
      <div class="pro-rating">${p.reviews_count > 0 ? `★ ${Number(p.rating).toFixed(1)} <span>(${p.reviews_count})</span>` : '<span>Nuevo</span>'}</div>
    </a>`;
}

const HOME_STYLE = `
<style>
  /* Renovación 2026-10-11 (dirección A "Aire", ref. Fresha): hero claro de
     borde a borde con dos manchas de color suaves (teal y durazno), titular
     grande en la sans de UI, buscador en píldora blanca. Sustituye al hero
     oscuro con tarjeta redondeada. */
  .hero {
    position: relative; padding: 4rem 20px 3.2rem; text-align: center; contain: layout paint; overflow: hidden;
    margin: 0 -20px; border-radius: 0 0 36px 36px;
    background:
      radial-gradient(40% 60% at 92% 0%, oklch(78% 0.1 78 / 0.28), transparent 70%),
      linear-gradient(160deg, var(--deep), oklch(30% 0.06 195));
  }
  .hero-waves { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none; }
  .hero-inner { position: relative; z-index: 1; }
  .hero h1 { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-weight: 800; font-size: clamp(2.3rem, 6vw, 4rem); line-height: 1.02; letter-spacing: -0.035em; margin: 0 auto 0.9rem; max-width: 16ch; color: var(--white); }
  .hero h1 b { font-weight: inherit; color: oklch(94% 0.05 78); }
  .hero p { color: rgba(255,255,255,0.86); font-size: 1.08rem; max-width: 46ch; margin: 0 auto 1.8rem; }
  .badge-row { display: flex; gap: 0.55rem; flex-wrap: wrap; justify-content: center; margin: 1.6rem 0 0; }
  .badge-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; border-radius: 999px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.28); font-size: 0.82rem; font-weight: 700; color: var(--white); }
  .badge-pill .icon { color: var(--white); }
  .search-bar { display: flex; align-items: center; gap: 0.4rem; background: var(--card); border: 1.5px solid var(--line); border-radius: 999px; padding: 0.4rem 0.5rem 0.4rem 1.2rem; max-width: 620px; margin: 0 auto; box-shadow: var(--sh-2); transition: box-shadow 200ms var(--ease-out-quart), border-color 200ms var(--ease-out-quart); }
  .search-bar:focus-within { border-color: var(--teal-500); box-shadow: 0 0 0 4px rgba(15,133,131,0.22), var(--sh-2); }
  .search-bar .search-field { display: flex; align-items: center; gap: 0.55rem; flex: 1; min-width: 0; color: var(--soft); }
  .search-bar .search-field--city { flex: 0 1 152px; }
  .search-bar input, .search-bar select { border: none; background: none; font: inherit; font-size: 0.92rem; color: var(--ink); width: 100%; padding: 0.7rem 0; appearance: none; -webkit-appearance: none; }
  .search-bar input::placeholder { color: var(--soft); }
  .search-bar input:focus, .search-bar select:focus { outline: none; }
  .search-bar select { cursor: pointer; }
  .search-divider { width: 1px; align-self: stretch; margin: 0.5rem 0; background: var(--line); flex: none; }
  .search-bar .btn { flex: none; padding: 0.75rem 1.3rem; }
  @media (max-width: 560px) {
    /* Rediseño del hero móvil (2026-08-27, ref. Fresha): antes el degradado
       vivía dentro de una tarjeta con bordes redondeados metida en el
       padding de .wrap (20px), así que el texto y el buscador quedaban
       pegados a los bordes de ESA tarjeta — se sentía "estirado". Ahora el
       degradado se extiende de borde a borde de la pantalla (sin tarjeta
       de por medio, como el fondo lila de Fresha) y solo el buscador
       blanco queda inset con aire real alrededor, igual que allá. */
    .hero { padding: 2.4rem 20px 1.8rem; border-radius: 0 0 28px 28px; }
    .hero h1 { font-size: clamp(1.65rem, 8vw, 3.2rem); }
    .hero p { font-size: 0.98rem; }
    /* Cada campo pasa a ser su propia tarjeta redondeada apilada (como
       "Todos los tratamientos" / "Ubicación actual" / fecha en Fresha),
       en vez de una sola píldora dividida por líneas finas. */
    .search-bar { flex-direction: column; align-items: stretch; background: none; border: none; box-shadow: none; padding: 0; gap: 0.7rem; }
    .search-bar .search-field { background: var(--card); border: 1.5px solid var(--line); border-radius: 14px; padding: 0.2rem 1rem; }
    .search-bar .search-field--city { flex: none; }
    .search-divider { display: none; }
    .search-bar .btn { width: 100%; justify-content: center; border-radius: 14px; padding: 0.9rem 1.3rem; }
  }
  .chips { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; margin: 1.6rem 0 0; }
  /* Base clara (2026-08-27): .chip se reusa fuera del hero oscuro del home
     (en /mapa, directo sobre el fondo claro de la página) — el estilo
     original solo tenía sentido sobre el degradado oscuro y quedaba texto
     blanco casi invisible sobre fondo casi blanco. Esta es la base clara;
     el hero oscuro la sobrescribe más abajo con .hero .chip. */
  .chip { display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.5rem 1rem; min-height: 44px; box-sizing: border-box; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); color: var(--ink); font-size: 0.85rem; font-weight: 700; transition: background 180ms var(--ease-out-quart), border-color 180ms var(--ease-out-quart), color 180ms var(--ease-out-quart), transform 180ms var(--ease-out-quart); }
  .chip .icon { width: 15px; height: 15px; }
  .chip.active, .chip:hover { background: var(--deep); border-color: var(--deep); color: var(--white); transform: translateY(-1px); }
  .chip:active { transform: scale(0.96); transition-duration: 100ms; }
  /* Píldoras de categoría del hero, versión minimalista (2026-08-27): el
     borde translúcido se sentía "enmarcado" — se quita del todo y el
     relleno tenue solo se aclara al pasar el mouse, sin anillo alrededor. */
  .hero .chip { border-color: var(--line); background: rgba(255,255,255,0.75); color: var(--ink); padding: 0.4rem 0.8rem; min-height: 36px; font-size: 0.78rem; }
  .hero .chip .icon { width: 13px; height: 13px; }
  .hero .chip:hover { background: var(--white); border-color: var(--ink); color: var(--ink); }
  .hero .chip.active { background: var(--ink); border-color: var(--ink); color: var(--white); }
  /* Muchas categorías (9 + "Todos" = 10): la cuadrícula de 5 columnas
     iguales dejaba mucho aire suelto alrededor de las etiquetas cortas
     ("Todos", "Uñas") porque cada columna medía lo mismo que la más larga
     ("Entrenador Personal"). Vuelve al envolvido natural (cada píldora
     mide lo que su texto necesita, gap fijo y compacto) — se sigue viendo
     ordenado porque el hero ya tiene aire propio a los lados (28px). */
  .hero .chips { gap: 0.5rem; }
  /* Solo desde tablet/desktop: en móvil el envolvido natural ya acomoda
     bien las píldoras y este salto forzado dejaba a "Pilates" solo en su
     propia fila. */
  @media (min-width: 561px) {
    .hero .chip-break { flex-basis: 100%; height: 0; }
  }
  @media (max-width: 560px) {
    /* En móvil estas filas se deslizan en vez de envolver (nowrap +
       overflow-x). Sin nada que lo avise, el borde cortado a mitad de
       una píldora se lee como un error de layout, no como "desliza para
       ver más" — la máscara difumina el borde para dar esa pista visual. */
    .chips {
      flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start;
      padding: 0 20px 0.3rem; margin-left: -20px; margin-right: -20px;
      scrollbar-width: none; -webkit-overflow-scrolling: touch;
      mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 28px), transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 28px), transparent);
    }
    .chips::-webkit-scrollbar { display: none; }
    .chips .chip { flex: none; }
    .chips .chip:last-child { margin-right: 28px; }
    /* El hero tiene demasiadas categorías para deslizar cómodo en una
       fila: se envuelven en varias líneas compactas en vez de eso. */
    .hero .chips {
      flex-wrap: wrap; overflow-x: visible; justify-content: center;
      padding: 0; margin-left: 0; margin-right: 0; gap: 0.5rem;
      mask-image: none; -webkit-mask-image: none;
    }
    .hero .chips .chip { flex: initial; }
    .hero .chips .chip:last-child { margin-right: 0; }
    /* Solo 2 píldoras (no una lista larga como las categorías): en vez de
       deslizar, se envuelven y se achican un toque para que quepan bien
       en una pantalla angosta sin cortarse a la mitad. */
    .badge-row { gap: 0.45rem; }
    .badge-pill { font-size: 0.76rem; padding: 0.4rem 0.7rem; }
  }
  .sec-title { font-size: clamp(1.7rem, 3.2vw, 2.4rem); letter-spacing: -0.025em; margin: 3.4rem 0 1rem; color: var(--ink); }
  .cat-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 1.2rem; }
  .cat-tile { display: flex; flex-direction: column; align-items: center; gap: 0.7rem; padding: 1.1rem 0.5rem 0.9rem; text-align: center; text-decoration: none; color: var(--ink); background: var(--card); border: 0; border-radius: 20px; box-shadow: var(--bezel); font-size: 0.82rem; font-weight: 700; transition: transform 600ms var(--ease-out-quart), box-shadow 600ms var(--ease-out-quart); }
  .cat-ico { width: 56px; height: 56px; border-radius: 50%; background: var(--teal-100); color: var(--teal-700); display: flex; align-items: center; justify-content: center; transition: background 220ms var(--ease-out-quart), color 220ms var(--ease-out-quart); }
  .cat-ico .icon { width: 26px; height: 26px; }
  .cat-tile:hover { transform: translateY(-4px); box-shadow: var(--bezel-hover); }
  .cat-tile:hover .cat-ico, .cat-tile.active .cat-ico { background: var(--teal-600); color: var(--white); }
  .cat-tile.active { box-shadow: 0 0 0 1.5px var(--teal-600), 0 0 0 7px var(--teal-100), 0 24px 44px -24px rgba(15,60,58,0.3); }
  .cat-tile:active { transform: scale(0.97); transition-duration: 100ms; }
  @media (max-width: 560px) {
    .cat-row { display: flex; overflow-x: auto; gap: 0.6rem; margin: 0 -20px; padding: 0.8rem 20px 1.6rem; scroll-padding-left: 20px; scroll-snap-type: x proximity; scrollbar-width: none; }
    .cat-row::-webkit-scrollbar { display: none; }
    .cat-tile { flex: none; width: 104px; scroll-snap-align: start; }
  }
  /* Secciones inspiradas en pelao.do (2026-10-11): preguntas y respuestas,
     banda de la app, funciones para negocios y pasos. Paleta y copy de Bukea. */
  .hero .store-btns { margin-top: 0; }
  .hero .store-btn { background: var(--white); color: var(--deep); }
  .hero .store-btn:hover { background: var(--teal-100); }
  .hero .store-btn { padding: 0.45rem 0.95rem 0.45rem 0.8rem; font-size: 0.9rem; }
  .sec-sub { text-align: center; color: var(--soft); margin: -0.4rem auto 1.6rem; max-width: 52ch; }
  .sec-center { text-align: center; margin-top: 6.5rem; }
  /* Hero partido: texto a la izquierda, la app real a la derecha (2026-10-11). */
  .hero { text-align: left; padding: 4.5rem 48px 0; }
  .hero-inner { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr); gap: 2.5rem; align-items: end; }
  .hero-copy { padding-bottom: 3.6rem; }
  .hero h1 { margin: 0 0 1rem; max-width: 13ch; font-size: clamp(2.5rem, 5.4vw, 4.4rem); }
  .hero p { margin: 0 0 1.9rem; max-width: 44ch; }
  .hero .search-bar { margin: 0; max-width: 560px; }
  .hero .badge-row, .hero .store-btns { justify-content: center; max-width: 560px; }
  .hero .hero-dl-label { max-width: 560px; margin: 1.6rem 0 0.8rem; text-align: center; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.01em; color: rgba(255,255,255,0.72); }
  .hero-phone { justify-self: center; width: min(330px, 100%); height: 480px; overflow: hidden; animation: phone-rise 1100ms var(--ease-out-quart) 150ms both; }
  .hero-phone-img { display: block; width: 100%; height: auto; filter: drop-shadow(0 -18px 50px rgba(0,0,0,0.35)); }
  @keyframes phone-rise { from { opacity: 0; transform: translateY(56px); } to { opacity: 1; transform: none; } }
  @media (max-width: 900px) {
    .hero { text-align: center; padding: 3rem 20px 2.4rem; }
    .hero-inner { grid-template-columns: 1fr; }
    .hero-copy { padding-bottom: 0; }
    .hero h1, .hero p, .hero .search-bar { margin-left: auto; margin-right: auto; }
    .hero .badge-row, .hero .store-btns, .hero .hero-dl-label { margin-left: auto; margin-right: auto; }
    .hero-phone { display: none; }
  }
  /* Movimiento del home (2026-10-11): solo transform y opacidad, nada oculto sin JS ni con movimiento reducido */
  @media (prefers-reduced-motion: no-preference) {
    @keyframes waves-drift { from { transform: scale(1.06) translate3d(-1.6%, 0, 0); } to { transform: scale(1.06) translate3d(1.6%, -1.2%, 0); } }
    @keyframes phone-float { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, -12px, 0); } }
    @keyframes tile-in { from { opacity: 0; transform: translateY(22px) scale(0.96); } }
    @keyframes row-in { from { opacity: 0; transform: translateX(-14px); } }
    @keyframes chip-in { from { opacity: 0; transform: translateY(8px) scale(0.9); } }
    @keyframes chip-pick { from { background: var(--card); color: var(--ink); transform: scale(1); } 45% { transform: scale(1.12); } }
    @keyframes chip-ring { from { opacity: 0.7; transform: scale(1); } to { opacity: 0; transform: scale(1.55, 1.9); } }
    @keyframes pin-drop { from { opacity: 0; transform: translateY(-30px); } 60% { opacity: 1; } }
    @keyframes pin-ripple { from { opacity: 0.45; transform: scale(0.2); } to { opacity: 0; transform: scale(2.6); } }
    @keyframes slow-zoom { from { transform: scale(1); } to { transform: scale(1.09); } }
    .hero-waves { animation: waves-drift 34s ease-in-out infinite alternate; }
    .hero-phone-img { animation: phone-float 6.5s ease-in-out 1.4s infinite alternate; }
    .hero.is-offscreen .hero-waves, .hero.is-offscreen .hero-phone-img { animation-play-state: paused; }
    .js .cat-row:not(.in) .cat-tile { opacity: 0; }
    .js .cat-row.in .cat-tile { animation: tile-in 680ms var(--ease-out-quart) backwards; animation-delay: calc(var(--k, 0) * 55ms); }
    .js .qa:not(.in) :is(.d-price > div, .d-hours i, .d-pin, .d-nav i) { opacity: 0; }
    .js .qa.in .d-price > div { animation: row-in 560ms var(--ease-out-quart) backwards; }
    .js .qa.in .d-price > div:nth-child(1) { animation-delay: 300ms; }
    .js .qa.in .d-price > div:nth-child(2) { animation-delay: 400ms; }
    .js .qa.in .d-price > div:nth-child(3) { animation-delay: 500ms; }
    .js .qa.in .d-price > div:nth-child(4) { animation-delay: 600ms; }
    .js .qa.in .d-hours i { animation: chip-in 480ms var(--ease-out-quart) backwards; animation-delay: calc(300ms + var(--k, 0) * 45ms); }
    .d-hours i { position: relative; }
    .d-hours i.on::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: 0 0 0 2px var(--teal-600); opacity: 0; pointer-events: none; }
    .js .qa.in .d-hours i.on { animation: chip-pick 720ms var(--ease-out-quart) 1.3s backwards; }
    .js .qa.in .d-hours i.on::after { animation: chip-ring 1000ms var(--ease-out-quart) 1.3s; }
    .js .qa.in .d-pin { animation: pin-drop 700ms var(--ease-out-quart) 400ms backwards; }
    .d-ripple { transform-box: fill-box; transform-origin: center; opacity: 0; }
    .js .qa.in .d-ripple { animation: pin-ripple 1100ms var(--ease-out-quart) 950ms; }
    .js .qa.in .d-nav i { animation: chip-in 480ms var(--ease-out-quart) backwards; animation-delay: calc(900ms + var(--k, 0) * 90ms); }
    .step .n, .step::before { transition: opacity 700ms var(--ease-out-quart), transform 700ms var(--ease-out-quart), color 700ms var(--ease-out-quart); transition-delay: calc(var(--i, 0) * 140ms + 250ms); }
    .js .step:not(.in) .n { opacity: 0.18; transform: scale(0.78); color: var(--soft); }
    .js .step:not(.in)::before { transform: translateX(-50%) scale(0); }
    .js .f3.in .f3-bg { animation: slow-zoom 22s ease-out forwards; transform-origin: 50% 25%; }
  }
  .d-hours i:nth-child(1) { --k: 0; }
  .d-hours i:nth-child(2) { --k: 1; }
  .d-hours i:nth-child(3) { --k: 2; }
  .d-hours i:nth-child(4) { --k: 3; }
  .d-hours i:nth-child(5) { --k: 4; }
  .d-hours i:nth-child(6) { --k: 5; }
  .d-hours i:nth-child(7) { --k: 6; }
  .d-hours i:nth-child(8) { --k: 7; }
  .d-hours i:nth-child(9) { --k: 8; }
  .d-nav i:nth-child(1) { --k: 0; }
  .d-nav i:nth-child(2) { --k: 1; }
  .d-nav i:nth-child(3) { --k: 2; }
  @media (prefers-reduced-motion: reduce) { .hero-phone { animation: none; } }
  /* Fichas de categoría con la fotografía de la app */
  .cat-ico.cat-photo { width: 72px; height: 72px; background: var(--teal-100); overflow: hidden; box-shadow: 0 0 0 1px rgba(15,100,98,0.1); }
  .cat-ico.cat-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 700ms var(--ease-out-quart); }
  .cat-tile:hover .cat-ico.cat-photo { background: var(--teal-100); }
  .cat-tile:hover .cat-ico.cat-photo img { transform: scale(1.08); }
  /* Funciones: panel principal y lista sin tarjetas */
  /* Sesiones de la home: bandas de ancho completo con una línea fina de unión */
  .band { position: relative; isolation: isolate; padding: 5rem 0; }
  .band::before { content: ""; position: absolute; z-index: -1; top: 0; bottom: 0; left: 50%; width: 100vw; transform: translateX(-50%); background: var(--band-bg, transparent); }
  .band::after { content: ""; position: absolute; top: 0; left: 50%; width: min(560px, 70%); height: 1px; transform: translateX(-50%); background: linear-gradient(to right, transparent, oklch(62% 0.09 195 / 0.55), transparent); }
  .band--a::after { display: none; }
  .band--a { padding-top: 4rem; }
  .band--b { --band-bg: var(--band-alt); }
  .band--b::before { background-image: var(--dots-band); }
  .biz-cta.biz-cta { background-image: var(--dots-white); }
  .band--c { padding-bottom: 1rem; }
  .band .cat-section .sec-title, .band > .sec-center:first-child, .band--c > .f3:first-child { margin-top: 0; }
  /* Preguntas: tarjetas altas, pregunta arriba y respuesta en el pie verde */
  /* Preguntas: tarjetas iguales y centradas, con un fragmento de la app que demuestra cada respuesta */
  .qa-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6rem; margin-top: 2.4rem; align-items: stretch; }
  .qa { display: flex; flex-direction: column; border-radius: 28px; overflow: hidden; background: var(--card); box-shadow: var(--bezel); text-align: center; }
  .qa-top { display: flex; flex-direction: column; align-items: center; gap: 0.9rem; padding: 1.6rem 1.5rem 0.4rem; }
  .qa-ico { width: 52px; height: 52px; border-radius: 50%; background: var(--teal-100); color: var(--teal-700); display: inline-flex; align-items: center; justify-content: center; }
  .qa-ico .icon { width: 24px; height: 24px; }
  .qa-top h3 { font-family: "Fraunces", serif; font-weight: 600; font-size: 1.65rem; line-height: 1.08; letter-spacing: -0.01em; margin: 0; }
  .qa-demo { flex: 1; display: flex; padding: 0.8rem 1.4rem 1.5rem; text-align: left; }
  .d-box { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 210px; padding: 1rem 1.1rem; border-radius: 20px; background: var(--teal-50); box-shadow: inset 0 0 0 1px var(--line); }
  .qa-bot { display: flex; gap: 0.7rem; align-items: center; justify-content: center; text-align: left; min-height: 96px; padding: 1.2rem 1.5rem; background: var(--teal-600); color: var(--white); }
  .qa-bot p { margin: 0; font-weight: 600; font-size: 0.95rem; line-height: 1.5; }
  .qa-bot .icon { width: 22px; height: 22px; padding: 3px; border-radius: 50%; background: var(--white); color: var(--teal-600); stroke-width: 3; flex: none; }
  .d-price > div { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-top: 1px solid var(--line); font-size: 0.84rem; }
  .d-price > div:first-child { border-top: 0; }
  .d-price span { font-weight: 700; }
  .d-price small { display: block; color: var(--soft); font-weight: 500; font-size: 0.72rem; }
  .d-price b { font-weight: 800; }
  .d-hours > small { display: block; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--soft); margin-bottom: 0.6rem; }
  .d-hours > div { display: flex; flex-wrap: wrap; gap: 0.45rem; }
  .d-hours i { font-style: normal; font-weight: 700; font-size: 0.82rem; padding: 0.5rem 0.9rem; border-radius: 999px; background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
  .d-hours i.on { background: var(--teal-600); color: var(--white); box-shadow: none; }
  .d-map svg { display: block; width: 100%; height: 118px; border-radius: 14px; }
  .d-nav { display: flex; gap: 0.4rem; margin-top: 0.6rem; flex-wrap: wrap; }
  .d-nav i { font-style: normal; font-weight: 700; font-size: 0.72rem; padding: 0.35rem 0.65rem; border-radius: 999px; background: var(--teal-50); box-shadow: inset 0 0 0 1px var(--line); }
  /* Franja de descarga, clara */
  .dl-strip { display: grid; grid-template-columns: auto 1fr auto; gap: 1.6rem; align-items: center; margin: 4rem 0 0; padding: 1.5rem 2rem; border-radius: 28px; background: var(--card); box-shadow: var(--bezel); }
  .dl-strip-ico { width: 54px; height: 54px; border-radius: 16px; background: var(--teal-100); color: var(--teal-700); display: flex; align-items: center; justify-content: center; }
  .dl-strip-ico .icon { width: 26px; height: 26px; }
  .dl-strip-tx h3 { font-family: "Fraunces", serif; font-weight: 600; font-size: 1.5rem; line-height: 1.1; margin: 0 0 0.25rem; }
  .dl-strip-tx p { margin: 0; color: var(--soft); font-size: 0.92rem; max-width: 44ch; }
  .dl-strip-act { display: flex; align-items: center; gap: 1.4rem; }
  .dl-strip .store-btns { justify-content: flex-start; }
  .dl-qr { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
  .dl-qr img { width: 72px; height: 72px; padding: 4px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px var(--line); }
  .dl-qr small { font-size: 0.62rem; font-weight: 600; color: var(--soft); }
  @media (max-width: 900px) {
    .band { padding: 3.2rem 0; }
    .qa-grid { grid-template-columns: 1fr; gap: 1.2rem; }
    .qa-demo { padding-bottom: 1.2rem; }
    .dl-strip { grid-template-columns: 1fr; padding: 1.4rem; margin-top: 2.6rem; }
    .dl-strip-act { flex-wrap: wrap; }
    .dl-qr { display: none; }
  }
  /* Funciones: bloque verde profundo con la foto a la izquierda y la tabla en
     un panel oscuro a la derecha (versión V3 aprobada, 2026-10-11). */
  /* Funciones en versión "historia" (2026-10-11): la foto a toda la altura como
     una story vertical, con la estación visible abajo; título y tabla a la derecha. */
  .f3 { position: relative; isolation: isolate; border-radius: 44px; background: var(--deep); padding: 3rem; margin-top: 2.4rem; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 3rem; align-items: stretch; box-shadow: 0 0 0 8px rgba(15,100,98,0.06), 0 50px 90px -40px rgba(15,60,58,0.7); }
  .f3-story { position: relative; margin: 0; overflow: hidden; isolation: isolate; border-radius: 30px; min-height: 700px; background: oklch(18% 0.03 195); box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 30px 60px -28px rgba(0,0,0,0.7); }
  .f3-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 20% 0%; z-index: -2; }
  .f3-r { display: flex; flex-direction: column; justify-content: center; gap: 1.6rem; color: var(--white); }
  .f3-head { text-align: center; }
  .f3-head h2 { font-family: "Fraunces", serif; font-weight: 600; font-size: clamp(2rem, 3.4vw, 2.7rem); line-height: 1.02; letter-spacing: -0.02em; margin: 0 0 0.7rem; color: var(--white); }
  .f3-head p { margin: 0; color: rgba(255,255,255,0.85); line-height: 1.6; max-width: 46ch; margin-left: auto; margin-right: auto; }
  .f3-panel { background: rgba(9,38,37,0.82); border-radius: 28px; padding: 0.3rem 1.6rem 0.8rem; color: var(--white); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14); }
  .f3-table { width: 100%; border-collapse: collapse; }
  .f3-table th, .f3-table td { padding: 0.85rem 0.4rem; text-align: left; border-top: 1px solid rgba(255,255,255,0.12); font-size: 0.88rem; vertical-align: middle; }
  .f3-table thead th { border-top: 0; padding-top: 1.2rem; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.55); font-weight: 800; }
  .f3-table tbody tr:first-child th, .f3-table tbody tr:first-child td { border-top: 0; }
  .f3-table tbody th { width: 34%; font-weight: 800; }
  .f3-table tbody th div { display: flex; gap: 0.7rem; align-items: center; }
  .f3-table td { color: rgba(255,255,255,0.78); line-height: 1.45; }
  .f3-table td.ok { width: 40px; text-align: right; }
  .f3-fi { width: 38px; height: 38px; border-radius: 12px; flex: none; background: rgba(255,255,255,0.1); color: var(--white); display: inline-flex; align-items: center; justify-content: center; }
  .f3-chk { width: 22px; height: 22px; border-radius: 50%; background: #25a35a; color: var(--white); display: inline-flex; align-items: center; justify-content: center; }
  .f3-chk .icon { width: 13px; height: 13px; stroke-width: 3.2; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  /* Pasos: línea de tiempo, sin tarjetas */
  .steps { list-style: none; margin: 2.4rem 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; position: relative; }
  .step { position: relative; padding-top: 1.8rem; border-top: 1px solid var(--line); text-align: center; }
  .step::before { content: ""; position: absolute; top: -4px; left: 50%; transform: translateX(-50%); width: 7px; height: 7px; border-radius: 50%; background: var(--gold-600); }
  .step .n { display: block; font-family: "Fraunces", serif; font-weight: 600; font-size: 3.2rem; line-height: 1; color: var(--teal-600); margin-bottom: 0.9rem; font-variant-numeric: lining-nums; }
  .step h3 { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 1rem; margin: 0 0 0.35rem; }
  .step p { margin: 0 auto; max-width: 26ch; font-size: 0.88rem; color: var(--soft); line-height: 1.55; }
  @media (max-width: 900px) {
    .steps { grid-template-columns: repeat(2, 1fr); }
    .f3 { grid-template-columns: 1fr; padding: 1.2rem; gap: 1.6rem; }
    .f3-story { min-height: 0; aspect-ratio: 9 / 14; }
    .f3-r { display: contents; }
    .f3-head { order: -2; padding: 0.6rem 0.4rem 0; }
    .f3-story { order: -1; }
      .f3-panel { padding: 0.4rem 1rem 0.8rem; background: rgba(9,38,37,0.94); }
    .f3-table thead { display: none; }
    .f3-table tr { display: block; padding: 0.7rem 0; border-top: 1px solid rgba(255,255,255,0.12); }
    .f3-table tbody tr:first-child { border-top: 0; }
    .f3-table th, .f3-table td { display: block; width: auto !important; border: 0 !important; padding: 0.2rem 0.4rem !important; text-align: left !important; }
  }
  @media (max-width: 560px) { .steps { grid-template-columns: 1fr; }  }
  .stat-line { text-align: center; color: var(--soft); font-size: 0.85rem; margin-top: 1.3rem; }
  .pro-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin: 2.4rem 0; }
  .pro-card { display: flex; align-items: center; gap: 0.9rem; padding: 1.15rem; text-decoration: none; color: var(--ink); background: var(--card); border: 0; border-radius: 20px; box-shadow: var(--bezel); transition: transform 220ms var(--ease-out-quart), box-shadow 220ms var(--ease-out-quart), border-color 220ms var(--ease-out-quart); }
  .pro-card:hover { transform: translateY(-4px); box-shadow: var(--bezel-hover); }
  .pro-card:active { transform: scale(0.985); transition-duration: 100ms; }
  .pro-avatar { width: 48px; height: 48px; border-radius: 50%; flex: none; color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: "Fraunces", serif; transition: transform 260ms var(--ease-out-quart); overflow: hidden; }
  .pro-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pro-card:hover .pro-avatar { transform: scale(1.07); }
  .pro-info { flex: 1; min-width: 0; }
  .pro-name { font-weight: 700; font-size: 0.95rem; }
  .pro-meta { color: var(--soft); font-size: 0.8rem; margin-top: 0.15rem; }
  .pro-tags { color: var(--soft); font-size: 0.76rem; margin-top: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pro-rating { flex: none; font-weight: 700; font-size: 0.85rem; color: var(--gold-700); text-align: right; }
  .pro-rating span { display: block; font-weight: 500; color: var(--soft); font-size: 0.72rem; }
  .empty { text-align: center; color: var(--soft); padding: 3rem 1rem; }
  .biz-cta { position: relative; overflow: hidden; isolation: isolate; background: var(--deep); color: var(--white); border-radius: 32px; padding: 3.4rem 2.4rem; text-align: center; margin: 6rem 0 3.5rem; box-shadow: 0 0 0 7px rgba(15,100,98,0.06); }
  .biz-cta::before { content: ""; position: absolute; z-index: -1; width: 20rem; height: 20rem; top: -8rem; right: -6rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.5; filter: blur(6px); }
  .biz-cta h2 { color: var(--white); margin: 0 0 0.5rem; font-size: 1.55rem; }
  .biz-cta p { color: rgba(255,255,255,0.82); max-width: 42ch; margin: 0 auto 1.3rem; }
</style>`;

router.get('/', async (req, res) => {
  const base = req.baseUrlPrefix;
  const q = String(req.query.q || '').trim();
  const categoria = CATEGORIES.includes(req.query.categoria) ? req.query.categoria : null;
  const ciudad = CITIES.includes(req.query.ciudad) ? req.query.ciudad : 'santo-domingo';

  let sql = `SELECT * FROM professionals WHERE hidden_at IS NULL AND ${VISIBLE_IN_MARKETPLACE_SQL}`;
  const params = [];
  if (categoria) { sql += ' AND category = ?'; params.push(categoria); }
  // Todavía no hay columna de ciudad — los negocios reales de hoy son
  // todos de Santo Domingo, así que filtrar por otra ciudad da 0
  // resultados a propósito (estado honesto "sé el primero", ver abajo).
  if (ciudad !== 'santo-domingo') { sql += ' AND neighborhood LIKE ?'; params.push(`%${CITY_LABELS[ciudad]}%`); }
  if (q) {
    sql += ' AND (name LIKE ? OR business_name LIKE ? OR neighborhood LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  // Más recientes primero (2026-10-12): que los negocios nuevos se vean en el inicio.
  sql += ' ORDER BY created_at DESC, id DESC LIMIT 60';

  const [professionals] = await pool.query(sql, params);
  const ids = professionals.map(p => p.id);
  let tagsById = {};
  if (ids.length > 0) {
    const [services] = await pool.query(
      'SELECT professional_id, name FROM services WHERE professional_id IN (?) ORDER BY id',
      [ids]
    );
    tagsById = services.reduce((acc, s) => {
      (acc[s.professional_id] ||= []).push(s.name);
      return acc;
    }, {});
  }
  professionals.forEach(p => { p.tags = (tagsById[p.id] || []).slice(0, 3); });
  // Sin logo, la tarjeta usa la primera foto del negocio antes de caer en iniciales.
  const noLogoIds = professionals.filter(p => !p.logo_path).map(p => p.id);
  if (noLogoIds.length > 0) {
    const [firstPhotos] = await pool.query(
      'SELECT professional_id, path FROM business_photos WHERE professional_id IN (?) ORDER BY id DESC',
      [noLogoIds]
    );
    const byId = {};
    firstPhotos.forEach(r => { byId[r.professional_id] = r.path; });
    professionals.forEach(p => { if (!p.logo_path && byId[p.id]) p.first_photo = byId[p.id]; });
  }

  const baseParams = () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (ciudad !== 'santo-domingo') p.set('ciudad', ciudad);
    return p;
  };

  // Categorías como fichas grandes con pictograma (2026-10-11, renovación
  // estilo Fresha): reemplazan los chips del hero, mismos enlaces y filtro.
  const CAT_PHOTOS = new Set(['barberia', 'unas', 'salon', 'maquillaje', 'cejas-mua', 'pilates', 'entrenador', 'peluqueria-canina', 'spa', 'trenzas', 'tatuadores', 'servicios-profesionales']);
  const catIcon = (key) => CAT_PHOTOS.has(key)
    ? `<span class="cat-ico cat-photo"><img src="${base}/img/site/cat-${key}.webp" alt="" width="72" height="72" loading="lazy" decoding="async"></span>`
    : `<span class="cat-ico"><svg class="icon"><use href="#${CAT_ICONS[key]}"/></svg></span>`;
  let tileK = 0;
  const catTile = (href, active, iconHtml, label) =>
    `<a class="cat-tile${active ? ' active' : ''}" style="--k:${tileK++}" href="${href}"${active ? ' aria-current="true"' : ''}>${iconHtml}<span>${esc(label)}</span></a>`;
  const allChipQs = baseParams().toString();
  const catTiles = CATEGORIES.map(key => {
      const p = baseParams();
      p.set('categoria', key);
      return catTile(`/?${p.toString()}`, categoria === key, catIcon(key), CAT_LABELS[key]);
    }).join('')
    + catTile(`/${allChipQs ? '?' + allChipQs : ''}`, !categoria, '<span class="cat-ico"><svg class="icon"><use href="#i-search"/></svg></span>', 'Todos');

  const grid = professionals.length
    ? professionals.map((p, i) => proCardHtml(p, i, base)).join('')
    : ciudad !== 'santo-domingo'
      ? `<p class="empty">Todavía no tenemos profesionales en ${esc(CITY_LABELS[ciudad])}, <a href="/unete" style="color:var(--teal-700);font-weight:700">sé el primero en unirte</a>.</p>`
      : '<p class="empty">No encontramos profesionales con esa búsqueda todavía. Vuelve pronto, seguimos sumando negocios.</p>';

  const body = `
${HOME_STYLE}
<div class="wrap">
  <div class="hero" id="hero">
    <img class="hero-waves" src="${base}/img/site/hero-waves.svg" alt="" aria-hidden="true" width="712" height="712">
    <div class="hero-inner">
    <div class="hero-copy">
    <h1 class="reveal" style="--i:0">Bukea tu cita en <b>60 segundos</b></h1>
    <p class="reveal" style="--i:1">Barbería, uñas, salón, cejas y maquillaje en toda República Dominicana. Reserva en segundos, paga en efectivo o transferencia, sin comisión.</p>
    <form class="search-bar reveal" style="--i:2" method="get" action="/">
      <div class="search-field">
        <svg class="icon"><use href="#i-search"/></svg>
        <input type="text" name="q" value="${esc(q)}" placeholder="Servicio o profesional…">
      </div>
      <span class="search-divider" aria-hidden="true"></span>
      <div class="search-field search-field--city">
        <svg class="icon"><use href="#i-map-pin"/></svg>
        <select name="ciudad" aria-label="Ciudad">
          ${CITIES.map(key => `<option value="${key}"${ciudad === key ? ' selected' : ''}>${esc(CITY_LABELS[key])}</option>`).join('')}
        </select>
      </div>
      ${categoria ? `<input type="hidden" name="categoria" value="${esc(categoria)}">` : ''}
      <button class="btn btn-primary" type="submit">Buscar</button>
    </form>
    <div class="badge-row reveal" style="--i:3">
      <span class="badge-pill wa"><svg class="icon"><use href="#i-whatsapp"/></svg>Reserva por WhatsApp</span>
      <span class="badge-pill cash"><svg class="icon"><use href="#i-cash"/></svg>Efectivo o transferencia</span>
    </div>
    <p class="hero-dl-label reveal" style="--i:4">Descarga la app gratis para iPhone y Android</p>
    ${storeButtons()}
    </div>
    <div class="hero-phone" aria-hidden="true">
      <img class="hero-phone-img" src="${base}/img/site/phone-hero.webp" alt="" width="640" height="1266" fetchpriority="high" decoding="async">
    </div>
    </div>
  </div>

  <div class="band band--a">
  <section class="cat-section" aria-labelledby="cat-title">
    <h2 id="cat-title" class="sec-title">Explora por categoría</h2>
    <div class="cat-row rv">${catTiles}</div>
  </section>

  <h2 class="sec-title">${categoria ? esc(CAT_LABELS[categoria]) : 'Recién llegados a tu zona'}</h2>
  <div class="pro-grid">${grid}</div>

  </div>

  <div class="band band--b">
  <h2 class="sec-title sec-center">Reservar es así de fácil</h2>
  <p class="sec-sub">Lo que siempre preguntas por WhatsApp ya está en cada perfil. Sin llamadas y sin vueltas.</p>
  <div class="qa-grid">
    <div class="qa reveal" style="--i:0"><div class="qa-top"><span class="qa-ico"><svg class="icon"><use href="#i-cash"/></svg></span><h3>¿Cuánto cuesta?</h3></div><div class="qa-demo" aria-hidden="true"><div class="d-box"><div class="d-price"><div><span>Corte clásico<small>45 min</small></span><b>RD$ 500</b></div><div><span>Corte y barba<small>1 h</small></span><b>RD$ 700</b></div><div><span>Cerquillo<small>15 min</small></span><b>RD$ 200</b></div><div><span>Corte de niño<small>30 min</small></span><b>RD$ 400</b></div></div></div></div><div class="qa-bot"><svg class="icon"><use href="#i-check"/></svg><p>Cada servicio con su precio en RD$ y lo que dura. Sin sorpresas.</p></div></div>
    <div class="qa reveal" style="--i:1"><div class="qa-top"><span class="qa-ico"><svg class="icon"><use href="#i-clock"/></svg></span><h3>¿Tienen espacio hoy?</h3></div><div class="qa-demo" aria-hidden="true"><div class="d-box"><div class="d-hours"><small>Hoy, horas libres</small><div><i>9:00</i><i>10:30</i><i class="on">11:30</i><i>1:00</i><i>2:00</i><i>3:30</i><i>4:30</i><i>5:00</i><i>6:00</i></div></div></div></div><div class="qa-bot"><svg class="icon"><use href="#i-check"/></svg><p>Solo salen las horas libres de verdad. Toca una y reserva.</p></div></div>
    <div class="qa reveal" style="--i:2"><div class="qa-top"><span class="qa-ico"><svg class="icon"><use href="#i-map-pin"/></svg></span><h3>¿Dónde queda?</h3></div><div class="qa-demo" aria-hidden="true"><div class="d-box"><div class="d-map"><svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="240" height="110" fill="#dcefee"/><path d="M-10 70 L90 40 L170 60 L250 20" stroke="#fff" stroke-width="9" fill="none"/><path d="M60 -5 L80 115" stroke="#fff" stroke-width="7" fill="none"/><path d="M150 -5 L135 115" stroke="#fff" stroke-width="6" fill="none"/><path d="M-5 100 L250 85" stroke="#fff" stroke-width="5" fill="none"/><g transform="translate(112 34)"><ellipse class="d-ripple" cy="44" rx="12" ry="4.5" fill="#0f8583"/><g class="d-pin"><path d="M0 0c-9 0-16 7-16 16 0 12 16 28 16 28s16-16 16-28c0-9-7-16-16-16z" fill="#0f8583"/><circle cy="16" r="6" fill="#fff"/></g></g></svg><div class="d-nav"><i>Google Maps</i><i>Apple Maps</i><i>Waze</i></div></div></div></div><div class="qa-bot"><svg class="icon"><use href="#i-check"/></svg><p>Con el mapa llegas en Google Maps, Apple Maps o Waze.</p></div></div>
  </div>

  <section class="dl-strip reveal" aria-label="Descarga la app">
    <span class="dl-strip-ico"><svg class="icon"><use href="#i-smartphone"/></svg></span>
    <div class="dl-strip-tx"><h3>Lleva Bukea en tu celular</h3><p>Reserva tus citas o maneja tu negocio desde la app. Gratis para iPhone y Android.</p></div>
    <div class="dl-strip-act">
      ${storeButtons()}
      <div class="dl-qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(APP_STORE_URL)}" alt="Código QR para descargar la app" width="72" height="72" loading="lazy"><small>Escanea con tu cámara</small></div>
    </div>
  </section>
  </div>

  <div class="band band--c">
  <section class="f3 reveal" aria-labelledby="f3-title">
    <figure class="f3-story">
      <img class="f3-bg" src="${base}/img/site/feat-lead.webp" alt="Manicurista dominicana chateando con una clienta desde su estación" width="900" height="1350" loading="lazy" decoding="async">
    </figure>
    <div class="f3-r">
      <div class="f3-head">
        <h2 id="f3-title">Todo lo que necesitas para tu negocio</h2>
        <p>Para barberos, estilistas y manicuristas. Sin computadora y sin comisión.</p>
  </div>
    <div class="f3-panel">
      <table class="f3-table">
        <thead><tr><th scope="col">Función</th><th scope="col">Detalle</th><th scope="col"><span class="sr-only">Incluido</span></th></tr></thead>
        <tbody><tr class="reveal" style="--i:0"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-link"/></svg></span>Tu link propio</div></th><td>Un link para tu bio y tu WhatsApp. Tus clientes reservan solos.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr><tr class="reveal" style="--i:1"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-camera"/></svg></span>Fotos de tu trabajo</div></th><td>Tu logo y tu galería en el perfil.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr><tr class="reveal" style="--i:2"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-cash"/></svg></span>Precios claros</div></th><td>Cada servicio con precio en RD$ y duración.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr><tr class="reveal" style="--i:3"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-calendar"/></svg></span>Agenda en vivo</div></th><td>Por día, semana y mes. Sin citas a la misma hora.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr><tr class="reveal" style="--i:4"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-whatsapp"/></svg></span>Avisos por WhatsApp</div></th><td>Confirmaciones y recordatorios.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr><tr class="reveal" style="--i:5"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-clock"/></svg></span>Tu horario, tus reglas</div></th><td>Solo se ofrecen tus horas libres.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr><tr class="reveal" style="--i:6"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-chart"/></svg></span>Mi Cuadre</div></th><td>Lo vendido hoy, en la semana y en el mes.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr><tr class="reveal" style="--i:7"><th scope="row"><div><span class="f3-fi"><svg class="icon"><use href="#i-percent"/></svg></span>Pagos a la dominicana</div></th><td>Efectivo o transferencia. Cero comisión.</td><td class="ok"><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span></td></tr></tbody>
      </table>
    </div>
    </div>
  </section>

  <h2 class="sec-title sec-center">¿Cómo funciona?</h2>
  <p class="sec-sub">Menos de 5 minutos.</p>
  <ol class="steps">
    ${[
      ['Crea tu cuenta', 'Tu nombre, tu teléfono y un PIN. Sin tarjeta.'],
      ['Pon tus servicios, tu horario y tus fotos', 'Desde el celular o la computadora.'],
      ['Comparte tu link', 'En tu bio de Instagram, en tu estado de WhatsApp y con cada cliente.'],
      ['Recibe citas solas', 'Te suena la app. Tú trabajas y la agenda anota.'],
    ].map(([h, p], i) => `<li class="step reveal" style="--i:${i}"><span class="n">${i + 1}</span><h3>${h}</h3><p>${p}</p></li>`).join('')}
  </ol>

  <div class="biz-cta reveal">
    <h2>¿Tienes un negocio con citas?</h2>
    <p>Agenda, clientela y "Mi Cuadre" en un solo lugar, y por ahora, 100% gratis. Cero comisión, cero suscripción.</p>
    <a class="btn btn-primary has-ico" href="${PORTAL_URL}">Entrar a Mi Negocio<span class="btn-ico"><svg class="icon"><use href="#i-arrow-up-right"/></svg></span></a>
  </div>
  </div>
</div>`;

  res.type('html').send(await pageShell({
    base,
    title: 'Bukea, tu cita en 60 segundos',
    description: 'Bukea tu cita de barbería, uñas, salón, cejas y maquillaje en República Dominicana. Paga en efectivo o transferencia, sin comisión.',
    canonicalPath: 'https://www.bukeard.com/',
    bodyHtml: body,
  }));
});

const MAP_STYLE = `
<style>
  .map-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; margin: 1.4rem 0 1rem; }
  .map-top h1 { font-size: 1.6rem; margin: 0; color: var(--teal-900); }
  #bukea-map { width: 100%; height: 56vh; min-height: 340px; border-radius: 18px; border: 1px solid var(--line); margin-bottom: 1.4rem; }
  .leaflet-popup-content b { display: block; margin-bottom: 0.15rem; }
  .leaflet-popup-content a.btn { display: inline-block; margin-top: 0.4rem; padding: 0.35rem 0.8rem; font-size: 0.78rem; }
</style>`;

// Búsqueda por mapa (2026-08-23, Leaflet + OpenStreetMap — gratis, sin API
// key, decisión de Víctor). Las coordenadas son a nivel de sector, no de
// dirección exacta, porque el registro del negocio hoy solo pide "sector"
// (ver lib/geocode.js) — suficiente para "quién está cerca de mí".
router.get('/mapa', async (req, res) => {
  const base = req.baseUrlPrefix;
  const categoria = CATEGORIES.includes(req.query.categoria) ? req.query.categoria : null;

  let sql = `SELECT slug, name, business_name, neighborhood, category, rating, reviews_count, lat, lng FROM professionals WHERE hidden_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL AND ${VISIBLE_IN_MARKETPLACE_SQL}`;
  const params = [];
  if (categoria) { sql += ' AND category = ?'; params.push(categoria); }

  const [professionals] = await pool.query(sql, params);
  const [[{ withoutPin }]] = await pool.query(
    'SELECT COUNT(*) AS withoutPin FROM professionals WHERE hidden_at IS NULL AND (lat IS NULL OR lng IS NULL)' + (categoria ? ' AND category = ?' : ''),
    categoria ? [categoria] : []
  );

  const chips = CATEGORIES.map(key => {
    const active = categoria === key ? ' active' : '';
    return `<a class="chip${active}" href="/mapa?categoria=${key}"><svg class="icon"><use href="#${CAT_ICONS[key]}"/></svg>${esc(CAT_LABELS[key])}</a>`;
  }).join('');
  const allChip = `<a class="chip${!categoria ? ' active' : ''}" href="/mapa">Todos</a>`;

  const pins = professionals.map(p => ({
    slug: p.slug,
    name: p.name,
    businessName: p.business_name,
    neighborhood: p.neighborhood,
    rating: Number(p.rating),
    reviewsCount: p.reviews_count,
    lat: Number(p.lat),
    lng: Number(p.lng),
  }));

  const body = `
${HOME_STYLE}
${MAP_STYLE}
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<div class="wrap">
  <div class="map-top">
    <h1>Profesionales cerca de ti</h1>
    <a href="/${categoria ? '?categoria=' + categoria : ''}" style="color:var(--teal-700);font-weight:700;text-decoration:none;font-size:0.88rem">Ver como lista →</a>
  </div>
  <div class="chips" style="margin-bottom:1rem">${allChip}${chips}</div>
  <div id="bukea-map"></div>
  <p class="stat-line">${pins.length} profesional${pins.length === 1 ? '' : 'es'} en el mapa${withoutPin > 0 ? ` · ${withoutPin} más sin ubicación todavía` : ''}.</p>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var PINS = ${JSON.stringify(pins)};
  var BASE = ${JSON.stringify(base)};
  var map = L.map('bukea-map');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  if (PINS.length === 0) {
    map.setView([18.4861, -69.9312], 12); // Santo Domingo por defecto
  } else {
    var bounds = L.latLngBounds(PINS.map(function (p) { return [p.lat, p.lng]; }));
    PINS.forEach(function (p) {
      var rating = p.reviewsCount > 0 ? ('★ ' + p.rating.toFixed(1) + ' (' + p.reviewsCount + ')') : 'Nuevo en Bukea';
      var popup = '<b>' + p.name.replace(/</g, '&lt;') + '</b>' +
        p.businessName.replace(/</g, '&lt;') + ' · ' + p.neighborhood.replace(/</g, '&lt;') + '<br>' + rating +
        '<br><a class="btn btn-primary" href="' + '/' + encodeURIComponent(p.slug) + '/reservar' + '">Bukear cita</a>' +
        ' <a href="/' + encodeURIComponent(p.slug) + '">Ver perfil</a>';
      L.marker([p.lat, p.lng]).addTo(map).bindPopup(popup);
    });
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }
})();
</script>`;

  res.type('html').send(await pageShell({
    base,
    title: 'Bukea en el mapa. Profesionales de belleza cerca de ti',
    description: 'Encuentra en el mapa barberías, salones de uñas y más cerca de ti en Santo Domingo.',
    canonicalPath: 'https://www.bukeard.com/mapa',
    bodyHtml: body,
  }));
});

const PROFILE_STYLE = `
<style>
  .profile-hero {
    position: relative; overflow: hidden; contain: layout paint; display: flex; gap: 1.6rem; align-items: center; flex-wrap: wrap;
    margin: 0 -20px; padding: 3rem 20px 2.6rem; border-radius: 0 0 36px 36px; color: var(--white);
    background: radial-gradient(40% 60% at 92% 0%, oklch(78% 0.1 78 / 0.28), transparent 70%), linear-gradient(160deg, var(--deep), oklch(30% 0.06 195));
  }
  .profile-hero .hero-waves { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none; }
  .profile-hero > :not(.hero-waves) { position: relative; z-index: 1; }
  .profile-hero .profile-avatar { box-shadow: 0 0 0 4px rgba(255,255,255,0.22), var(--sh-2); width: 96px; height: 96px; font-size: 2rem; }
  .profile-hero .profile-meta { color: rgba(255,255,255,0.82); }
  .profile-hero .badge { background: rgba(255,255,255,0.16); color: var(--white); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.28); }
  @media (max-width: 560px) { .profile-hero { padding: 2.2rem 20px 2rem; border-radius: 0 0 28px 28px; } }
  .profile-avatar { width: 84px; height: 84px; border-radius: 50%; color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; font-family: "Fraunces", serif; flex: none; box-shadow: var(--sh-2); overflow: hidden; }
  .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .profile-hero h1 { margin: 0 0 0.3rem; font-size: clamp(1.7rem, 4vw, 2.4rem); color: var(--white); }
  .profile-meta { color: var(--soft); font-size: 0.95rem; display: flex; flex-direction: column; gap: 0.2rem; }
  .profile-badges { display: flex; gap: 0.5rem; margin-top: 0.6rem; flex-wrap: wrap; }
  #profile-map { width: 100%; height: 260px; border-radius: 16px; border: 1px solid var(--line); margin-bottom: 1rem; }
  .svc-list { margin: 1.6rem 0; }
  .svc-row { display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 0.6rem; margin: 0 -0.6rem; border-bottom: 1px solid var(--line); border-radius: 10px; transition: background 180ms var(--ease-out-quart); }
  .svc-row:hover { background: var(--teal-50); }
  .svc-row:last-child { border-bottom: none; }
  .svc-name { font-weight: 700; font-size: 0.95rem; }
  .svc-dur { color: var(--soft); font-size: 0.8rem; margin-top: 0.1rem; }
  .svc-price { font-weight: 700; color: var(--teal-700); }
  .cta-row { position: sticky; bottom: 1rem; margin: 1.6rem 0; text-align: center; }
  .cta-row .btn { width: 100%; max-width: 360px; justify-content: center; padding: 0.9rem 1.5rem; font-size: 1rem; }
  .team-grid { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1.6rem 0; }
  .team-member { display: flex; flex-direction: column; align-items: center; text-align: center; width: 84px; }
  .team-avatar { width: 56px; height: 56px; border-radius: 50%; color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: "Fraunces", serif; margin-bottom: 0.4rem; transition: transform 220ms var(--ease-out-quart); }
  .team-member:hover .team-avatar { transform: scale(1.08) rotate(-3deg); }
  .team-name { font-weight: 700; font-size: 0.8rem; line-height: 1.2; }
  .team-role { color: var(--soft); font-size: 0.72rem; }

  /* Perfil "tipo Fresha" (2026-08-27): cubierta con foto, estado
     abierto/cerrado en vivo, botón por servicio, horario semanal y
     negocios cercanos — mismo contenido que se espera de un perfil real,
     con la identidad visual de Bukea (teal/dorado), no la de Fresha. */
  .profile-cover { margin: 1.4rem 0 0; border-radius: 20px; overflow: hidden; }
  .profile-cover img { width: 100%; max-height: 260px; object-fit: cover; display: block; }

  .status-pill { display: inline-flex; align-items: center; padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
  .status-pill.-open { background: var(--teal-100); color: var(--teal-700); }
  .status-pill.-closed { background: var(--line); color: var(--soft); }

  .photo-strip { display: flex; gap: 0.7rem; overflow-x: auto; margin: 1rem 0 1.6rem; padding-bottom: 0.3rem; }
  .photo-strip img { width: 160px; height: 120px; object-fit: cover; border-radius: 14px; flex: none; }

  .btn-sm { padding: 0.5rem 0.9rem; font-size: 0.82rem; }

  .hours-list { margin: 1.2rem 0; }
  .hours-row { display: flex; justify-content: space-between; padding: 0.55rem 0.6rem; font-size: 0.88rem; color: var(--soft); border-bottom: 1px solid var(--line); }
  .hours-row:last-child { border-bottom: none; }
  .hours-row span:first-child { font-weight: 700; color: var(--ink); }
  .hours-row.-today { color: var(--teal-700); }
  .hours-row.-today span:first-child { color: var(--teal-700); }

  .nearby-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin: 1.4rem 0 2rem; }
  .nearby-card { display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; color: var(--ink); padding: 1.2rem 0.8rem; border: 1px solid var(--line); border-radius: 16px; background: var(--card); transition: transform 200ms var(--ease-out-quart), box-shadow 200ms var(--ease-out-quart); }
  .nearby-card:hover { transform: translateY(-3px); box-shadow: var(--sh-2); }
  .nearby-avatar { width: 48px; height: 48px; border-radius: 50%; color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: "Fraunces", serif; margin-bottom: 0.6rem; }
  .nearby-name { font-weight: 700; font-size: 0.85rem; }
  .nearby-meta { color: var(--soft); font-size: 0.75rem; margin-top: 0.2rem; }
</style>`;


const PROFILE_V3_STYLE = `
<style>
  /* Plantilla única de perfil (2026-10-12): hero asimétrico con foto protagonista. */
  .pf { padding-bottom: 0; }
  .pf-band:last-child { margin-bottom: 2.4rem; }
  .pf-hero { display: grid; grid-template-columns: 1fr 1.05fr; gap: 2.6rem; align-items: start; padding: 2.2rem 0 1.6rem; }
  .pf-hero .pf-copy { padding-top: 0.3rem; }
  .pf-hero.-nophoto { align-items: center; }
  .pf-hero.-nophoto { grid-template-columns: 1fr 0.8fr; }
  .pf-copy { min-width: 0; }
  .pf-badge { display: inline-block; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.02em; padding: 0.3rem 0.7rem; border-radius: 999px; background: var(--gold-100, #f3e6c4); color: var(--gold-700, #8a6420); }
  .pf-badge.-rated { background: var(--teal-100); color: var(--teal-700); }
  .pf-name { margin: 0.8rem 0 0; font-size: clamp(2rem, 5vw, 2.9rem); line-height: 1.03; letter-spacing: -0.025em; color: var(--ink); text-wrap: balance; }
  .pf-lock { margin: 0.9rem 0 0; display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem 0.8rem; }
  .pf-lock .l1 { font-family: "Fraunces", serif; font-style: italic; font-size: clamp(1.35rem, 3vw, 1.7rem); line-height: 1.1; color: var(--teal-700); }
  .pf-lock .l2 { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; color: var(--teal-700); background: var(--teal-100); padding: 0.45rem 0.8rem 0.45rem 0.65rem; border-radius: 999px; }
  .pf-lock .l2 svg { width: 15px; height: 15px; }
  .pf-by { margin: 0.8rem 0 0; color: var(--soft); font-size: 0.95rem; }
  .pf-facts { display: flex; flex-wrap: wrap; gap: 0.5rem 1.3rem; margin: 1rem 0 0; padding: 0; list-style: none; }
  .pf-facts li { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.88rem; font-weight: 600; color: var(--ink); }
  .pf-facts svg { width: 17px; height: 17px; color: var(--teal-600); flex: none; }
  .pf-actions { display: flex; align-items: center; gap: 0.7rem; margin-top: 1.4rem; flex-wrap: wrap; }
  .pf-actions .btn { min-height: 50px; padding: 0 1.7rem; justify-content: center; }
  .pf-meta { margin: 0.8rem 0 0; font-size: 0.82rem; color: var(--soft); }
  .pf-meta b { color: var(--ink); }
  .pf-collage { position: relative; display: grid; grid-template-columns: 1.35fr 1fr; grid-template-rows: 13rem 13rem; gap: 0.6rem; }
  .pf-collage img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pf-collage .a { grid-row: 1 / 3; border-radius: 28px 12px 12px 28px; }
  .pf-collage .b { border-radius: 12px 28px 12px 12px; }
  .pf-collage .c { border-radius: 12px 12px 28px 12px; }
  .pf-collage.-two .b { grid-row: 1 / 3; border-radius: 12px 28px 28px 12px; }
  .pf-collage.-one { grid-template-columns: 1fr; }
  .pf-collage.-one .a { border-radius: 28px; }
  .pf-collage .pf-logo { position: absolute; left: -2.4rem; bottom: 1.4rem; width: 8.4rem; height: 8.4rem; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 6px var(--bg), 0 12px 24px -8px rgba(15,60,58,0.5); }
  .pf-all { position: absolute; right: 0.9rem; bottom: 0.9rem; display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(246,251,251,0.94); color: var(--ink); font-weight: 800; font-size: 0.78rem; padding: 0.5rem 0.85rem; border-radius: 999px; box-shadow: 0 8px 18px -8px rgba(0,0,0,0.45); text-decoration: none; }
  .pf-all svg { width: 16px; height: 16px; }
  .pf-plate { position: relative; aspect-ratio: 1 / 1; max-height: 22rem; border-radius: 28px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: "Fraunces", serif; font-size: 4.5rem; font-weight: 700; overflow: hidden; }
  .pf-plate img { width: 100%; height: 100%; object-fit: cover; }
  .pf-main { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.6rem; align-items: start; }
  .pf-sec { margin: 0 0 1.8rem; }
  .pf-sec h2 { font-size: 1.35rem; margin: 0 0 0.8rem; }
  .pf-svc { background: var(--card); border-radius: 18px; padding: 0.3rem 0; box-shadow: 0 0 0 1px rgba(15,100,98,0.08); }
  .pf-row { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; padding: 0.85rem 1.1rem; border-top: 1px solid var(--line); }
  .pf-row:first-child { border-top: 0; }
  .pf-row b { display: block; font-size: 0.95rem; }
  .pf-row small { color: var(--soft); font-size: 0.8rem; }
  .pf-row .r { display: flex; align-items: center; gap: 0.8rem; flex: none; }
  .pf-price { font-weight: 800; font-size: 0.95rem; white-space: nowrap; }
  .pf-more { margin-top: 0.7rem; background: none; border: 0; padding: 0.4rem 0; font: inherit; font-weight: 700; font-size: 0.88rem; color: var(--teal-700); cursor: pointer; }
  .pf-extra[hidden] { display: none; }
  .pf-card { background: var(--card); border-radius: 18px; padding: 1rem 1.1rem; margin-bottom: 1rem; box-shadow: 0 0 0 1px rgba(15,100,98,0.08); }
  .pf-card h2 { font-size: 1.15rem; margin: 0 0 0.6rem; }
  .pf-hours .hours-row { padding: 0.35rem 0; border: 0; }
  .pf-acc summary { display: flex; justify-content: space-between; align-items: center; cursor: pointer; list-style: none; font-weight: 700; font-size: 0.95rem; }
  .pf-acc summary::-webkit-details-marker { display: none; }
  .pf-acc summary small { display: block; color: var(--soft); font-weight: 500; font-size: 0.8rem; margin-top: 0.15rem; }
  .pf-acc summary::after { content: ""; width: 0.55rem; height: 0.55rem; border-right: 2px solid var(--soft); border-bottom: 2px solid var(--soft); transform: rotate(45deg); transition: transform 200ms var(--ease-out-quart); margin-right: 0.3rem; }
  .pf-acc[open] summary::after { transform: rotate(-135deg); }
  .pf-acc-body { margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .pf-bank { padding-top: 0.7rem; border-top: 1px solid var(--line); font-size: 0.85rem; }
  .pf-bank b { display: block; font-size: 0.9rem; }
  .pf-bank span { color: var(--soft); }
  .pf-bank .num { display: block; margin-top: 0.2rem; font-weight: 800; color: var(--ink); font-variant-numeric: tabular-nums; }
  .pf-dirs { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .pf-gal { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.6rem; scroll-snap-type: x proximity; scrollbar-width: thin; scrollbar-color: var(--teal-100) transparent; -webkit-overflow-scrolling: touch; }
  .pf-gal img { width: 13rem; height: 9.5rem; object-fit: cover; border-radius: 14px; flex: none; scroll-snap-align: start; }
  .pf-cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(8.2rem, 1fr)); gap: 0.7rem; }
  .pf-cat { display: flex; flex-direction: column; align-items: center; gap: 0.55rem; padding: 0.9rem 0.5rem; border-radius: 18px; background: var(--card); box-shadow: 0 0 0 1px rgba(15,100,98,0.08); text-decoration: none; color: var(--ink); font-weight: 700; font-size: 0.85rem; text-align: center; transition: transform 220ms var(--ease-out-quart), box-shadow 220ms var(--ease-out-quart); }
  .pf-cat:hover { transform: translateY(-3px); box-shadow: 0 0 0 1px rgba(15,100,98,0.14), 0 14px 26px -16px rgba(15,60,58,0.4); }
  .pf-cat-ico { width: 4rem; height: 4rem; border-radius: 50%; overflow: hidden; background: var(--teal-100); display: flex; align-items: center; justify-content: center; color: var(--teal-700); }
  .pf-cat-ico img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pf-cat-ico .icon { width: 1.6rem; height: 1.6rem; }
  .pf-band { position: relative; padding: 1.9rem 0 0.2rem; margin-top: 0.6rem; }
  .pf-band.-tint { --band: color-mix(in srgb, var(--teal-100) 75%, var(--bg)); background: var(--band); box-shadow: 0 0 0 100vmax var(--band); clip-path: inset(0 -100vmax); }
  .pf-band.-tint::before, .pf-band.-tint::after { content: ""; position: absolute; left: -100vmax; right: -100vmax; height: 1px; background: rgba(15,100,98,0.26); }
  .pf-band.-tint::before { top: 0; }
  .pf-band.-tint::after { bottom: 0; }
  .pf-band.-tint .pf-sec { margin-bottom: 1.6rem; }
  .pf-band.-plain { padding-top: 2.2rem; }
  .pf-sticky { display: none; }
  @media (max-width: 860px) {
    .pf-hero, .pf-hero.-nophoto { grid-template-columns: 1fr; gap: 1.4rem; padding-top: 1rem; }
    .pf-collage { order: -1; grid-template-rows: 9rem 9rem; }
    .pf-collage .pf-logo { left: auto; right: 0.8rem; bottom: auto; top: -2.2rem; width: 6.4rem; height: 6.4rem; }
    .pf-main { grid-template-columns: 1fr; }
    .pf { padding-bottom: 5rem; }
    .pf-actions .btn-primary { flex: 1; }
    .pf-sticky { display: block; position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; padding: 0.7rem 14px calc(0.9rem + env(safe-area-inset-bottom)); background: linear-gradient(to top, var(--bg) 70%, transparent); }
    .pf-sticky .btn { width: 100%; min-height: 52px; justify-content: center; box-shadow: 0 12px 26px -10px rgba(11,80,78,0.7); }
  }
</style>`;

async function profilePage(req, res, next) {
  const base = req.baseUrlPrefix;
  const slug = String(req.params.slug || '').toLowerCase();
  if (!SLUG_RE.test(slug) || isReservedSlug(slug)) return next();
  const [rows] = await pool.query('SELECT * FROM professionals WHERE slug = ?', [slug]);
  const p = rows[0];
  if (!p) return next();

  const [services] = await pool.query(
    'SELECT id, name, duration_min, price_cents FROM services WHERE professional_id = ? AND archived_at IS NULL ORDER BY id',
    [p.id]
  );
  const [bankAccounts] = await pool.query(
    'SELECT bank_name, account_type, account_number, account_holder, cedula_rnc, verified_at FROM professional_bank_accounts WHERE professional_id = ?',
    [p.id]
  );
  const [collaboratorRows] = await pool.query(
    'SELECT name, role FROM collaborators WHERE professional_id = ? ORDER BY id',
    [p.id]
  );
  const [photoRows] = await pool.query(
    'SELECT path FROM business_photos WHERE professional_id = ? ORDER BY id',
    [p.id]
  );
  const [hourRows] = await pool.query(
    'SELECT weekday, start_time, end_time FROM professional_hours WHERE professional_id = ? ORDER BY weekday, start_time',
    [p.id]
  );
  const bookHref = `/${encodeURIComponent(p.slug)}/reservar`;

  const IC = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
    img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
  };

  // Sector en dos piezas: "Quita sueño, Haina" o "Quita sueño Haina" (si termina
  // en un municipio conocido) se muestran como frase grande + etiqueta. Si no se
  // puede separar, todo el sector va en la etiqueta.
  const MUNICIPIOS = ['santo domingo este', 'santo domingo oeste', 'santo domingo norte', 'santo domingo', 'los alcarrizos', 'boca chica', 'pedro brand', 'san cristóbal', 'san cristobal', 'haina', 'santiago', 'la romana', 'puerto plata', 'san pedro de macorís', 'higüey', 'la vega'];
  const titleCase = t => t.charAt(0).toUpperCase() + t.slice(1);
  let sectorLead = '';
  let sectorTag = String(p.neighborhood || '').trim();
  const bySep = sectorTag.split(/\s*[,;]\s*|\s+[-–—]\s+/).filter(Boolean);
  if (bySep.length >= 2) {
    sectorLead = bySep[0]; sectorTag = bySep.slice(1).join(', ');
  } else {
    const low = sectorTag.toLowerCase();
    const mun = MUNICIPIOS.find(m => low.endsWith(' ' + m));
    if (mun) { sectorLead = sectorTag.slice(0, sectorTag.length - mun.length).trim(); sectorTag = sectorTag.slice(sectorTag.length - mun.length); }
  }
  sectorLead = titleCase(sectorLead);
  sectorTag = titleCase(sectorTag);

  // Estado de hoy y próximo horario, calculados con las horas reales del negocio.
  const { date: today, minutes: nowMin } = nowInSantoDomingo();
  const todayWeekday = weekdayOf(today);
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const todayHours = hourRows.filter(h => h.weekday === todayWeekday);
  const openRow = todayHours.find(h => toMin(h.start_time) <= nowMin && nowMin < toMin(h.end_time));
  const nextToday = todayHours.filter(h => toMin(h.start_time) > nowMin).sort((a, b) => toMin(a.start_time) - toMin(b.start_time))[0];
  const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  let nextText = '';
  if (openRow) {
    nextText = `Abierto hasta las <b>${formatTime12h(openRow.end_time.slice(0, 5))}</b>`;
  } else if (nextToday) {
    nextText = `Abre hoy a las <b>${formatTime12h(nextToday.start_time.slice(0, 5))}</b>`;
  } else if (hourRows.length) {
    for (let i = 1; i <= 7; i++) {
      const wd = (todayWeekday + i) % 7;
      const rows = hourRows.filter(h => h.weekday === wd).sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
      if (rows.length) {
        nextText = `Abre ${i === 1 ? 'mañana' : 'el ' + DAY_LABELS[wd].toLowerCase()} a las <b>${formatTime12h(rows[0].start_time.slice(0, 5))}</b>`;
        break;
      }
    }
  }
  const minCents = services.length ? Math.min(...services.map(s => s.price_cents)) : null;
  const metaLine = [
    minCents !== null ? `Desde <b>${formatPrice(minCents)}</b>` : '',
    nextText,
  ].filter(Boolean).join('. ');

  const rated = p.reviews_count > 0;
  const badgeHtml = rated
    ? `<span class="pf-badge -rated">★ ${Number(p.rating).toFixed(1)} (${p.reviews_count} reseñas)</span>`
    : '<span class="pf-badge">Nuevo en Bukea</span>';

  const payBits = [p.accepts_cash ? 'Efectivo' : '', bankAccounts.length ? 'transferencia' : ''].filter(Boolean);
  const payText = payBits.length ? titleCase(payBits.join(' y ')) : '';
  const factsHtml = [
    p.accepts_whatsapp ? `<li>${IC.msg}Responde por WhatsApp</li>` : '',
    payText ? `<li>${IC.cash}${esc(payText)}</li>` : '',
  ].join('');

  const lockHtml = (sectorLead || sectorTag) ? `
      <p class="pf-lock">${sectorLead ? `<span class="l1">${esc(sectorLead)}</span>` : ''}${sectorTag ? `<span class="l2">${IC.pin}${esc(sectorTag)}</span>` : ''}</p>` : '';

  // Foto protagonista: collage de 1 a 3 fotos; sin fotos, el logo (o las iniciales) en una placa.
  const photoUrls = photoRows.map(ph => photoUrl(req, ph.path));
  const logoSrc = p.logo_path ? logoUrl(req, p.logo_path) : null;
  let visualHtml;
  if (photoUrls.length) {
    const cls = photoUrls.length >= 3 ? '' : photoUrls.length === 2 ? ' -two' : ' -one';
    const slots = ['a', 'b', 'c'].slice(0, Math.min(photoUrls.length, 3));
    visualHtml = `<div class="pf-collage${cls} reveal in" style="--i:1">
      ${slots.map((c, i) => `<img class="${c}" src="${photoUrls[i]}" alt="${esc(p.business_name)}"${i ? ' loading="lazy"' : ''}>`).join('')}
      ${logoSrc ? `<img class="pf-logo" src="${logoSrc}" alt="">` : ''}
      ${photoUrls.length > 1 ? `<a class="pf-all" href="#fotos">${IC.img}Ver las ${photoUrls.length} fotos</a>` : ''}
    </div>`;
  } else {
    visualHtml = `<div class="pf-plate reveal in" style="--i:1;background:${avatarGradient(p.slug)}">${logoSrc ? `<img src="${logoSrc}" alt="${esc(p.business_name)}">` : esc(initials(p.name))}</div>`;
  }

  const SVC_VISIBLE = 8;
  const svcRow = s => `
      <div class="pf-row">
        <div><b>${esc(s.name)}</b><small>${s.duration_min} min</small></div>
        <div class="r"><span class="pf-price">${formatPrice(s.price_cents)}</span><a class="btn btn-ghost btn-sm" href="${bookHref}?servicio=${s.id}">Reservar</a></div>
      </div>`;
  const svcShown = services.slice(0, SVC_VISIBLE).map(svcRow).join('');
  const svcRest = services.slice(SVC_VISIBLE).map(svcRow).join('');
  const svcHtml = services.length
    ? `<div class="pf-svc">${svcShown}<div class="pf-extra" id="svc-extra" hidden>${svcRest}</div></div>${svcRest ? `<button type="button" class="pf-more" id="svc-more" data-total="${services.length}">Ver los ${services.length} servicios</button>` : ''}`
    : '<p class="empty">Todavía no hay servicios cargados.</p>';

  const hoursByDay = {};
  hourRows.forEach(h => { (hoursByDay[h.weekday] ||= []).push(h); });
  const hoursHtml = [1, 2, 3, 4, 5, 6, 0].map(wd => {
    const rows = hoursByDay[wd];
    const isToday = wd === todayWeekday;
    const rangeText = rows
      ? rows.map(h => `${formatTime12h(h.start_time.slice(0, 5))} a ${formatTime12h(h.end_time.slice(0, 5))}`).join(', ')
      : 'Cerrado';
    return `<div class="hours-row${isToday ? ' -today' : ''}"><span>${DAY_LABELS[wd]}${isToday ? ', hoy' : ''}</span><span>${rangeText}</span></div>`;
  }).join('');

  const galleryHtml = photoUrls.length > 1 ? `
  <div class="pf-sec reveal" id="fotos" style="--i:2"><h2>Fotos</h2>
    <div class="pf-gal">${photoUrls.map(u => `<img src="${u}" alt="${esc(p.business_name)}" loading="lazy">`).join('')}</div>
  </div>` : '';

  const teamHtml = collaboratorRows.length ? `
  <div class="pf-sec reveal" style="--i:3"><h2>Equipo</h2>
    <div class="team-grid" style="margin:0">
      <div class="team-member"><div class="team-avatar" style="background:${avatarGradient(p.slug)}">${esc(initials(p.name))}</div><div class="team-name">${esc(p.name.split(' ')[0])}</div><div class="team-role">Titular</div></div>
      ${collaboratorRows.map(c => `<div class="team-member"><div class="team-avatar" style="background:${avatarGradient(c.name)}">${esc(initials(c.name))}</div><div class="team-name">${esc(c.name.split(' ')[0])}</div><div class="team-role">${esc(c.role || '')}</div></div>`).join('')}
    </div>
  </div>` : '';

  const banksHtml = bankAccounts.length ? `
    <details class="pf-card pf-acc">
      <summary><span>Cuentas para transferir<small>${bankAccounts.length} ${bankAccounts.length === 1 ? 'cuenta' : 'cuentas'}${bankAccounts.some(b => b.verified_at) ? ', verificada' : ''}</small></span></summary>
      <div class="pf-acc-body">
        ${bankAccounts.map(b => `<div class="pf-bank"><b>${esc(b.bank_name)}, ${esc(b.account_type)}${b.verified_at ? ' <span class="badge" style="vertical-align:middle">✓ Verificada</span>' : ''}</b><span>${esc(b.account_holder)}. Cédula/RNC ${esc(b.cedula_rnc)}</span><span class="num">${esc(b.account_number)}</span></div>`).join('')}
      </div>
    </details>` : '';

  // Otros servicios por categoría (2026-10-12), no otros negocios: así el perfil
  // no manda clientela a la competencia directa y enseña lo que hay en Bukea.
  const PF_CAT_PHOTOS = new Set(['barberia', 'unas', 'salon', 'maquillaje', 'cejas-mua', 'pilates', 'entrenador', 'peluqueria-canina', 'spa', 'trenzas', 'tatuadores', 'servicios-profesionales']);
  const otherCats = CATEGORIES.filter(k => k !== p.category);
  const nearbyHtml = otherCats.length ? `
  <div class="pf-sec reveal" style="--i:6"><h2>Explora otros servicios</h2>
    <div class="pf-cats">
      ${otherCats.map(k => `<a class="pf-cat" href="/?categoria=${k}">
        <span class="pf-cat-ico">${PF_CAT_PHOTOS.has(k)
          ? `<img src="${base}/img/site/cat-${k}.webp" alt="" width="64" height="64" loading="lazy" decoding="async">`
          : `<svg class="icon"><use href="#${CAT_ICONS[k]}"/></svg>`}</span>
        <span>${esc(CAT_LABELS[k])}</span></a>`).join('')}
    </div>
  </div>` : '';

  const lat = p.lat !== null ? Number(p.lat) : null;
  const lng = p.lng !== null ? Number(p.lng) : null;
  const links = directionLinks(p.name, p.neighborhood, lat, lng);
  const firstName = esc(p.name.split(' ')[0]);

  const body = `
${PROFILE_STYLE}
${PROFILE_V3_STYLE}
${lat !== null && lng !== null ? '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">' : ''}
<div class="wrap pf">
  <section class="pf-hero${photoUrls.length || logoSrc ? '' : ' -nophoto'}">
    <div class="pf-copy reveal in" style="--i:0">
      ${badgeHtml}
      <h1 class="pf-name">${esc(p.business_name)}</h1>${lockHtml}
      <p class="pf-by">${esc(p.name)}, ${esc((CAT_LABELS[p.category] || p.category).toLowerCase())}</p>
      ${factsHtml ? `<ul class="pf-facts">${factsHtml}</ul>` : ''}
      <div class="pf-actions">
        <a class="btn btn-primary" href="${bookHref}">Bukear cita</a>
        ${services.length ? '<a class="btn btn-ghost" href="#servicios">Ver servicios</a>' : ''}
      </div>
      ${metaLine ? `<p class="pf-meta">${metaLine}</p>` : ''}
    </div>
    ${visualHtml}
  </section>

  ${galleryHtml ? `<div class="pf-band -tint">${galleryHtml}</div>` : ''}

  <div class="pf-band -plain"><div class="pf-main">
    <div>
      <div class="pf-sec reveal" id="servicios" style="--i:1"><h2>Servicios</h2>${svcHtml}</div>
      ${teamHtml}
    </div>
    <aside>
      ${hourRows.length ? `<div class="pf-card pf-hours reveal" style="--i:2"><h2>Horario</h2>${hoursHtml}</div>` : ''}
      <div class="pf-card reveal" style="--i:3"><h2>Cómo llegar</h2>
        ${lat !== null && lng !== null ? '<div id="profile-map"></div>' : ''}
        <div class="pf-dirs">
          <a class="btn btn-ghost btn-sm" href="${links.google}" target="_blank" rel="noopener">Google Maps</a>
          <a class="btn btn-ghost btn-sm" href="${links.apple}" target="_blank" rel="noopener">Apple Maps</a>
          <a class="btn btn-ghost btn-sm" href="${links.waze}" target="_blank" rel="noopener">Waze</a>
        </div>
      </div>
      ${banksHtml}
    </aside>
  </div></div>

  ${nearbyHtml ? `<div class="pf-band -tint">${nearbyHtml}</div>` : ''}
</div>
<div class="pf-sticky"><a class="btn btn-primary" href="${bookHref}">Bukear cita con ${firstName}</a></div>
<script>
(function () {
  var more = document.getElementById('svc-more');
  if (more) more.addEventListener('click', function () {
    var extra = document.getElementById('svc-extra');
    var open = extra.hasAttribute('hidden');
    if (open) { extra.removeAttribute('hidden'); more.textContent = 'Ver menos'; }
    else { extra.setAttribute('hidden', ''); more.textContent = 'Ver los ' + more.getAttribute('data-total') + ' servicios'; }
  });
})();
</script>
${lat !== null && lng !== null ? `
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var map = L.map('profile-map', { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false }).setView([${lat}, ${lng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.marker([${lat}, ${lng}]).addTo(map);
})();
</script>` : ''}`;

  res.type('html').send(await pageShell({
    base,
    title: `${p.name}, ${p.business_name} | Bukea`,
    description: `Reserva con ${p.name} en ${p.business_name}, ${p.neighborhood}. ${services.map(s => s.name).join(', ')}.`,
    canonicalPath: `https://www.bukeard.com/${esc(p.slug)}`,
    bodyHtml: body,
  }));
}

const MARKETING_STYLE = `
<style>
  .m-hero { position: relative; padding: 4rem 0 1rem; text-align: center; contain: layout paint; }
  .m-hero h1 { font-size: clamp(2rem, 4.5vw, 2.9rem); letter-spacing: -0.02em; color: var(--teal-900); margin: 0 0 0.7rem; }
  .m-hero p { color: var(--soft); font-size: 1.05rem; max-width: 50ch; margin: 0 auto 1.7rem; }

  /* Hero verde compartido (2026-08-27): mismo tratamiento oscuro con grano
     y pastilla que el home, reusado en /contacto, /negocios y /nosotros
     para que el sitio se sienta una sola cosa y no páginas sueltas con
     estilos distintos. mktHeroHtml() en este archivo arma el markup. */
  .mkt-hero {
    position: relative; padding: 4.6rem 20px 4.2rem; text-align: center; overflow: hidden; contain: layout paint;
    margin: 0 -20px; border-radius: 0 0 36px 36px;
    background:
      radial-gradient(40% 60% at 92% 0%, oklch(78% 0.1 78 / 0.28), transparent 70%),
      linear-gradient(160deg, var(--deep), oklch(30% 0.06 195));
  }
  .mkt-hero .hero-waves { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none; }
  .mkt-hero-inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }
  .mkt-hero h1 { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-weight: 800; font-size: clamp(2.1rem, 5.2vw, 3.4rem); line-height: 1.04; letter-spacing: -0.03em; margin: 0 auto 0.9rem; max-width: 18ch; color: var(--white); }
  .mkt-hero p { color: rgba(255,255,255,0.86); font-size: 1.06rem; max-width: 50ch; margin: 0 auto; line-height: 1.6; }
  .mkt-hero .mkt-hero-cta { margin-top: 1.7rem; }
  .mkt-hero .store-btn { background: var(--white); color: var(--deep); padding: 0.45rem 0.95rem 0.45rem 0.8rem; font-size: 0.9rem; }
  .mkt-hero .store-btn:hover { background: var(--teal-100); }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes mkt-waves { from { transform: scale(1.06) translate3d(-1.6%, 0, 0); } to { transform: scale(1.06) translate3d(1.6%, -1.2%, 0); } }
    .mkt-hero .hero-waves { animation: mkt-waves 34s ease-in-out infinite alternate; }
  }
  .mkt-hero--slim { padding: 3rem 20px 2.6rem; margin-bottom: 2.4rem; }
  .mkt-hero--slim h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); }
  @media (max-width: 560px) { .mkt-hero { padding: 3rem 20px 2.8rem; border-radius: 0 0 28px 28px; } }

  /* Franja de cifras entre el hero y el bento (2026-08-27, segunda pasada:
     la primera versión era una fila suelta con demasiado aire alrededor —
     se veía "huérfana", sin relación visual con nada. Ahora es una
     tarjeta que se monta sobre el borde inferior del hero (margin-top
     negativo), centrada y con su propio fondo, así queda anclada en vez
     de flotando sola en medio de la página. */
  .m-highlights {
    display: flex; justify-content: center; gap: 2.6rem; flex-wrap: wrap;
    max-width: 640px; margin: -1.6rem auto 2.8rem; padding: 1.3rem 2.2rem;
    background: var(--card); border: 1px solid var(--line); border-radius: 20px;
    box-shadow: var(--sh-3); position: relative; z-index: 2; text-align: center;
  }
  .m-highlights > div { display: flex; flex-direction: column; gap: 0.15rem; }
  .m-highlights b { font-family: "Fraunces", serif; font-size: 1.4rem; color: var(--teal-700); }
  .m-highlights span { font-size: 0.78rem; color: var(--soft); }
  @media (max-width: 560px) { .m-highlights { gap: 1.4rem 2rem; margin: -1.2rem 20px 2.2rem; padding: 1.1rem 1.4rem; } }

  /* Bento: dos tarjetas grandes (los diferenciadores) + cuatro de apoyo,
     nunca del mismo tamaño — evita la cuadrícula idéntica de "features". */
  .m-bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2.6rem 0; }
  .m-feature { padding: 1.6rem; display: flex; flex-direction: column; gap: 0.7rem; transition: transform 220ms var(--ease-out-quart), box-shadow 220ms var(--ease-out-quart); }
  .m-feature:hover { transform: translateY(-3px); box-shadow: var(--sh-3); }
  .icon-badge { width: 42px; height: 42px; border-radius: 12px; background: var(--teal-100); color: var(--teal-700); display: flex; align-items: center; justify-content: center; flex: none; }
  .m-feature h3 { margin: 0; font-size: 1.05rem; color: var(--teal-900); }
  .m-feature p { margin: 0; color: var(--soft); font-size: 0.88rem; line-height: 1.5; }
  .m-feature.-lg { grid-column: span 2; }
  .m-feature.-lg .icon-badge { width: 50px; height: 50px; }
  .m-feature.-lg .icon-badge .icon { width: 26px; height: 26px; }
  .m-feature.-lg h3 { font-size: 1.3rem; }
  .m-feature.-dark { background: var(--deep); border-color: var(--deep); color: var(--white); position: relative; overflow: hidden; isolation: isolate; }
  .m-feature.-dark::before { content: ""; position: absolute; z-index: -1; width: 14rem; height: 14rem; top: -6rem; right: -5rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.45; }
  .m-feature.-dark h3 { color: var(--white); }
  .m-feature.-dark p { color: rgba(255,255,255,0.78); }
  .m-feature.-dark .icon-badge { background: rgba(255,255,255,0.14); color: var(--white); }
  @media (max-width: 720px) {
    .m-bento { grid-template-columns: 1fr; }
    .m-feature.-lg { grid-column: span 1; }
  }

  .price-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 880px; margin: 2.5rem auto 0.5rem; align-items: stretch; }
  .price-card { position: relative; overflow: hidden; isolation: isolate; padding: 2.2rem; text-align: center; display: flex; flex-direction: column; }
  .price-card::before { content: ""; position: absolute; z-index: -1; width: 16rem; height: 16rem; top: -7rem; left: -5rem; border-radius: 50%; background: radial-gradient(circle, var(--teal-100), transparent 70%); }
  .price-card.-plus::before { background: radial-gradient(circle, var(--gold-100), transparent 70%); }
  .price-card .amount { font-family: "Fraunces", serif; font-size: 3rem; color: var(--teal-700); margin: 0.4rem 0; }
  .price-card .amount small { font-size: 1rem; color: var(--soft); font-weight: 400; }
  .plan-badge { align-self: center; background: var(--gold-100); color: var(--gold-700); font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: 999px; margin: 0 0 0.9rem; }
  .price-list { text-align: left; list-style: none; padding: 0; margin: 1.4rem 0; color: var(--soft); font-size: 0.9rem; flex: 1; }
  .price-list li { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.4rem 0; }
  .price-list li .icon { color: var(--cash); margin-top: 0.15rem; }
  .price-list .price-list-lead { color: var(--ink); font-weight: 700; padding-bottom: 0.6rem; }
  .price-card .btn { align-self: center; }

  .m-section-head { text-align: center; margin: 4.5rem 0 2rem; }
  .m-section-head:first-child { margin-top: 0; }
  .m-section-head h2 { font-size: clamp(1.7rem, 3.2vw, 2.4rem); letter-spacing: -0.025em; color: var(--ink); margin: 0 0 0.6rem; }
  .m-section-head p { color: var(--soft); font-size: 1rem; max-width: 52ch; margin: 0 auto; line-height: 1.55; }

  .m-steps { list-style: none; padding: 0; margin: 0 0 3.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
  .m-step { padding: 1.6rem 1.4rem 1.4rem; text-align: center; }
  .m-step .num { font-family: "Fraunces", serif; font-size: 1.7rem; font-weight: 700; color: var(--teal-500); display: inline-block; margin-bottom: 0.6rem; }
  .m-step h3 { margin: 0 0 0.4rem; font-size: 1.02rem; color: var(--teal-900); }
  .m-step p { margin: 0; color: var(--soft); font-size: 0.87rem; line-height: 1.55; }
  @media (max-width: 720px) { .m-steps { grid-template-columns: 1fr; } }

  .m-cats { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin: 0 0 3.5rem; }
  /* .chip no vive en MARKETING_STYLE por defecto (solo en HOME_STYLE) —
     esta página lo usa en .m-cats sin ese bloque cargado, así que se
     replica aquí la versión clara (mismo criterio que en HOME_STYLE). */
  .m-cats .chip { display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.5rem 1rem; min-height: 44px; box-sizing: border-box; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); color: var(--ink); font-size: 0.85rem; font-weight: 700; transition: background 180ms var(--ease-out-quart), border-color 180ms var(--ease-out-quart), color 180ms var(--ease-out-quart); }
  .m-cats .chip .icon { width: 15px; height: 15px; }
  .m-cats .chip:hover { background: var(--deep); border-color: var(--deep); color: var(--white); }

  .m-faq { max-width: 720px; margin: 0 auto 3.5rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .m-faq details { padding: 1.1rem 1.3rem; }
  .m-faq summary { cursor: pointer; font-weight: 700; color: var(--teal-900); font-size: 0.95rem; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .m-faq summary::-webkit-details-marker { display: none; }
  .m-faq summary::after { content: "+"; font-size: 1.3rem; line-height: 1; color: var(--teal-600); transition: transform 200ms var(--ease-out-quart); flex: none; }
  .m-faq details[open] summary::after { transform: rotate(45deg); }
  .m-faq p { margin: 0.8rem 0 0; color: var(--soft); font-size: 0.88rem; line-height: 1.6; }

  /* .biz-cta vivía solo en HOME_STYLE — /negocios y /nosotros la usan sin
     ese bloque cargado y quedaba como texto plano sin tarjeta (mismo
     motivo que .chip en .m-cats, ver arriba). */
  .biz-cta { position: relative; overflow: hidden; isolation: isolate; background: var(--deep); color: var(--white); border-radius: 24px; padding: 2.4rem; text-align: center; margin: 3.5rem 0; }
  .biz-cta::before { content: ""; position: absolute; z-index: -1; width: 20rem; height: 20rem; top: -8rem; right: -6rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.5; filter: blur(6px); }
  .biz-cta h2 { color: var(--white); margin: 0 0 0.5rem; font-size: 1.55rem; }
  .biz-cta p { color: rgba(255,255,255,0.82); max-width: 42ch; margin: 0 auto 1.3rem; }

  /* Franja de acceso para dueños (2026-08-27): /negocios es exclusiva para
     negocios (marketing a prospectos + entrada para quien ya tiene cuenta),
     nunca para clientes finales — separación que Fresha resuelve con un
     dominio propio (partners.fresha.com, ver docs/ANALISIS-SITIO-FRESHA.md
     §"Partner account"), acá basta una franja fija arriba de todo el
     contenido de marketing, siempre visible, para que un dueño que llega
     de fuera de la app no tenga que leer toda la página para encontrar
     dónde entrar. */
  .m-access-bar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: center; gap: 0.9rem; flex-wrap: wrap; background: var(--deep); color: var(--white); padding: 0.7rem 1.2rem; text-align: center; font-size: 0.88rem; }
  .m-access-bar span { color: rgba(255,255,255,0.82); }
  .m-access-bar .btn { padding: 0.5rem 1.1rem; font-size: 0.85rem; }
  .m-access-bar .btn-primary { background: var(--gold-700); }
  .m-access-bar .btn-primary:hover { background: oklch(44% 0.11 68); }
</style>`;

// Panel de negocio de escritorio ("Mi cuenta") — pantalla completa, con su
// propio shell de app (sidebar + calendario), separado de pageShell() porque
// no lleva la cabecera/pie del marketplace público. Ver views/negocio.js.
router.get('/negocio', (req, res) => {
  res.type('html').send(negocioShell({
    base: req.baseUrlPrefix,
    siteUrl: '/',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    appleClientId: process.env.APPLE_CLIENT_ID || '',
  }));
});

// /negocios y /tunegocio llevan directo al acceso de Mi Negocio, sin página
// intermedia (2026-10-11). El registro de negocios nuevos vive en /unete.
router.get('/negocios', (req, res) => res.redirect(302, PORTAL_URL));

router.get('/nosotros', async (req, res) => {
  const base = req.baseUrlPrefix;

  const valueCards = [
    { icon: 'i-calendar', h: 'Reservas mientras duermes', p: 'Tu horario real está visible las 24 horas. Un cliente que te escribe a las 11 de la noche puede reservar solo, sin esperar a que le contestes.' },
    { icon: 'i-whatsapp', h: 'Menos citas que se caen', p: 'El recordatorio llega por WhatsApp, no por una notificación que nadie abre. Menos "se me olvidó" es más sillas ocupadas cada día.' },
    { icon: 'i-link', h: 'Más alcance, no más trabajo', p: 'Tu enlace de Bukea vive en tu bio y tu estado. Cada persona que lo abre y reserva es un cliente que te encontró solo, sin que movieras un dedo.' },
    { icon: 'i-percent', h: 'Todo lo que vendes es tuyo', p: 'Cero comisión por cliente nuevo. Lo que factura tu negocio no se reparte con nadie.' },
  ].map((f, i) => `
    <div class="card reveal" style="--i:${i}">
      <div class="icon-badge"><svg class="icon"><use href="#${f.icon}"/></svg></div>
      <h3>${f.h}</h3>
      <p>${f.p}</p>
    </div>`).join('');

  const body = `
${MARKETING_STYLE}
<style>
  .m-story { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 3rem; align-items: center; margin: 3rem 0 4rem; }
  .m-story h2 { font-size: clamp(1.5rem, 3vw, 1.9rem); color: var(--teal-900); margin: 0 0 1rem; }
  .m-story p { color: var(--soft); font-size: 0.96rem; line-height: 1.7; margin: 0 0 1rem; }
  .m-story-card { background: var(--deep); color: var(--white); border-radius: 22px; padding: 2rem; position: relative; overflow: hidden; isolation: isolate; }
  .m-story-card::before { content: ""; position: absolute; z-index: -1; width: 16rem; height: 16rem; top: -6rem; right: -6rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.4; }
  .m-story-card .stat { font-family: "Fraunces", serif; font-size: 2.6rem; line-height: 1; margin: 0 0 0.3rem; }
  .m-story-card .stat-label { font-size: 0.85rem; color: rgba(255,255,255,0.78); margin: 0 0 1.6rem; padding-bottom: 1.6rem; border-bottom: 1px solid rgba(255,255,255,0.14); }
  .m-story-card .stat-label:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
  @media (max-width: 820px) { .m-story { grid-template-columns: 1fr; gap: 2rem; margin: 2.2rem 0 3rem; } }

  /* Vitrina de "Tus ventas al día" (2026-08-27) — se separa del resto de
     las tarjetas porque es, a propósito, lo más importante que resaltar
     de la sección: no una tarjeta más entre otras cinco, sino la pieza
     que demuestra que Bukea no es solo una agenda. */
  .m-spotlight { display: grid; grid-template-columns: 1fr 1fr; gap: 2.6rem; align-items: center; background: var(--card); border: 2px solid var(--gold-600); border-radius: 24px; padding: 2.6rem; margin: 0 0 3rem; box-shadow: var(--sh-3); }
  .m-spotlight .icon-badge { width: 54px; height: 54px; margin-bottom: 1rem; }
  .m-spotlight .icon-badge .icon { width: 26px; height: 26px; }
  .m-spotlight h3 { font-size: 1.5rem; color: var(--teal-900); margin: 0 0 0.7rem; }
  .m-spotlight > div > p { color: var(--soft); font-size: 0.95rem; line-height: 1.65; margin: 0; }
  .m-spotlight-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1.1rem; }
  .m-spotlight-list li { display: flex; gap: 0.75rem; align-items: flex-start; font-size: 0.9rem; color: var(--ink); line-height: 1.55; }
  .m-spotlight-list li .icon { color: var(--cash); flex: none; margin-top: 0.15rem; width: 18px; height: 18px; }
  @media (max-width: 820px) { .m-spotlight { grid-template-columns: 1fr; gap: 1.6rem; padding: 1.8rem; } }

  /* Bloque de valores restantes: en bloques iguales y centrados (a
     diferencia de .m-bento, que mezcla tamaños a propósito para las
     secciones donde eso da jerarquía) — aquí todos pesan lo mismo. */
  .m-value-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem; margin: 0 0 3.5rem; }
  .m-value-grid .card { text-align: center; padding: 1.8rem 1.4rem; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
  .m-value-grid h3 { margin: 0; font-size: 0.98rem; color: var(--teal-900); }
  .m-value-grid p { margin: 0; color: var(--soft); font-size: 0.85rem; line-height: 1.5; }
  @media (max-width: 860px) { .m-value-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .m-value-grid { grid-template-columns: 1fr; } }

  .m-bento-center .m-feature { text-align: center; align-items: center; }
  .m-bento-center .icon-badge { margin: 0 auto; }
</style>
<div class="wrap">
  ${mktHeroHtml({
    eyebrow: 'Sobre Bukea',
    title: 'Tu proyecto se merece algo mejor que un chat perdido',
    sub: 'Bukea es para cualquier persona que necesita poder reservar citas sin perder clientes en el camino: salones, barberías, entrenadores, spas y más. Tan fácil como debería haber sido siempre.',
  })}

  <div class="m-story reveal">
    <div>
      <h2>El problema que no se hablaba</h2>
      <p>En República Dominicana, la mayoría de los negocios que trabajan con citas (salones, barberías, entrenadores, spas, talleres) todavía agenda por WhatsApp, por Instagram o a mano en un cuaderno. Funciona, hasta que no: una cita se pierde entre mensajes, un cliente no recibe respuesta a tiempo y se va con otro, o el negocio no tiene forma de saber, sin sacar cuentas, si el mes va mejor o peor que el anterior.</p>
      <p>Las apps de reservas que existen no fueron pensadas para acá: asumen pago con tarjeta, cobran comisión por cada cliente y llegan traducidas, no construidas para cómo trabajamos de verdad, con efectivo, transferencia y WhatsApp como canal principal.</p>
      <p>Bukea existe para llenar exactamente ese espacio: la herramienta hecha desde República Dominicana para cualquier persona que necesita reservar citas sin perder clientes en el camino.</p>
    </div>
    <div class="m-story-card">
      <div class="stat">WhatsApp</div>
      <div class="stat-label">Confirmaciones y recordatorios llegan por ahí, el mismo canal donde ya hablas con tu clientela todos los días</div>
      <div class="stat">Efectivo y transferencia</div>
      <div class="stat-label">Cómo se paga de verdad en RD, de primera clase desde el día uno, no como una opción secundaria</div>
    </div>
  </div>

  <div class="m-section-head reveal">
    <h2>Cómo Bukea ayuda a vender más</h2>
    <p>No es solo una agenda bonita. Cada función existe para que reserves más citas y se te caigan menos.</p>
  </div>

  <div class="m-spotlight reveal">
    <div>
      <div class="icon-badge"><svg class="icon"><use href="#i-chart"/></svg></div>
      <h3>Tus ventas al día, sin sacar cuentas a mano</h3>
      <p>Con "Mi Cuadre" tienes tu cierre del día en tiempo real: cuánto vendiste, ya sea en efectivo o por depósito, sin hoja de cálculo ni cuaderno.</p>
    </div>
    <ul class="m-spotlight-list">
      <li><svg class="icon"><use href="#i-check"/></svg>Cierre del día automático: sabes cuánto entró en efectivo y cuánto en depósito, al instante.</li>
      <li><svg class="icon"><use href="#i-check"/></svg>Agrega los datos de todas tus cuentas bancarias, para que cada cliente transfiera a la que prefieras.</li>
      <li><svg class="icon"><use href="#i-check"/></svg>Tu cliente deposita y te adjunta el comprobante de manera automática, sin que tengas que pedírselo.</li>
    </ul>
  </div>

  <div class="m-value-grid">${valueCards}</div>

  <div class="m-section-head reveal">
    <h2>Lo que no vamos a cambiar</h2>
    <p>Tres decisiones que tomamos desde el primer día y que no dependen de cuánto crezca Bukea.</p>
  </div>
  <div class="m-bento m-bento-center">
    <div class="card m-feature reveal" style="--i:0">
      <div class="icon-badge"><svg class="icon"><use href="#i-users"/></svg></div>
      <h3>El profesional es la estrella</h3>
      <p>Tu perfil te sigue a ti, no al local. Si te mudas de sitio, tu clientela te encuentra igual.</p>
    </div>
    <div class="card m-feature reveal" style="--i:1">
      <div class="icon-badge"><svg class="icon"><use href="#i-cash"/></svg></div>
      <h3>Efectivo y transferencia primero</h3>
      <p>Nunca van a ser la opción "de segunda" frente a la tarjeta. Así paga la mayoría de tu clientela hoy.</p>
    </div>
    <div class="card m-feature -dark reveal" style="--i:2">
      <div class="icon-badge"><svg class="icon"><use href="#i-percent"/></svg></div>
      <h3>Cero comisión para empezar</h3>
      <p>Los negocios que se unen ahora mantienen sus condiciones cuando llegue el momento de cobrar.</p>
    </div>
  </div>

  <div class="biz-cta reveal">
    <h2>Súmate a la próxima generación de negocios dominicanos</h2>
    <p>Crea tu perfil gratis y empieza a recibir reservas hoy mismo.</p>
    <a class="btn btn-primary" href="${PORTAL_URL}">Crear mi cuenta de negocio</a>
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Nosotros. La historia detrás de Bukea',
    description: 'Bukea nació para llenar un vacío real en República Dominicana: reservas pensadas para WhatsApp, efectivo y transferencia, para cualquiera que necesite reservar citas sin perder clientes.',
    canonicalPath: 'https://www.bukeard.com/nosotros',
    bodyHtml: body,
  }));
});

/* Página "Únete" (2026-10-11): fusiona lo que decían /negocios y /precios en
   una sola página para dueños de negocio. Orden: acceso a Mi Negocio (solo
   login), ventajas de Bukea frente a otras apps, cupos fundadores gratis,
   precio posterior (1 mes de prueba y RD$500/mes) y pasos. /contacto queda
   fuera a propósito. El cobro y la prueba de 1 mes todavía no existen en el
   backend: esta página solo comunica la oferta. */
router.get('/unete', async (req, res) => {
  const base = req.baseUrlPrefix;
  const PRICE = 500;

  const [[{ foundingCount }]] = await pool.query('SELECT COUNT(*) AS foundingCount FROM professionals WHERE founding_free = 1');
  const spotsLeft = Math.max(0, FOUNDING_FREE_LIMIT - foundingCount);
  const soldOut = spotsLeft === 0;
  const pct = Math.min(100, Math.round((Math.min(foundingCount, FOUNDING_FREE_LIMIT) / FOUNDING_FREE_LIMIT) * 100));

  const cmp = [
    ['i-percent', 'Comisión por cliente nuevo', 'Suelen cobrar por cada cliente nuevo', 'Cero comisión, siempre'],
    ['i-whatsapp', 'WhatsApp', 'Correo o SMS genérico', 'Confirmaciones y recordatorios nativos'],
    ['i-cash', 'Cobro a la dominicana', 'Pensadas para pago con tarjeta', 'Efectivo y transferencia con cédula y comprobante'],
    ['i-map-pin', 'Moneda y soporte', 'Precios en dólares y soporte genérico', 'Pesos dominicanos y soporte en español dominicano'],
    ['i-link', 'Tu perfil y tu clientela', 'El cliente queda ligado al local', 'El perfil es tuyo y te sigue si te mudas'],
    ['i-users', 'Para tus clientes', 'Depende del plan', 'Gratis siempre'],
  ].map((r, i) => `<tr class="reveal" style="--i:${i}"><th scope="row">${r[1]}</th><td class="u-no"><span class="u-lab">Apps internacionales</span><svg class="icon u-x" aria-hidden="true"><use href="#i-x"/></svg>${r[2]}</td><td class="u-yes"><span class="u-lab">Bukea</span><span class="f3-chk"><svg class="icon"><use href="#i-check"/></svg></span>${r[3]}</td></tr>`).join('');

  const mnItems = [
    ['i-chart', 'Mi Cuadre', 'Cuánto vendiste hoy, en la semana y en el mes, separado en efectivo y depósito. Sin libreta ni Excel.', true],
    ['i-cash', 'Tus cuentas bancarias', 'Con cédula o RNC del titular. Tu cliente las copia con un toque al pagar y te adjunta su comprobante.', true],
    ['i-calendar', 'Agenda sin choques', 'Reservas 24/7 con tu horario real. Dos clientes nunca quedan a la misma hora.'],
    ['i-whatsapp', 'WhatsApp de verdad', 'Confirmaciones y recordatorios desde un número propio de Bukea.'],
    ['i-clock', 'Tu horario, tus reglas', 'Edita tus días y horas. Solo se ofrecen tus horas libres.'],
    ['i-users', 'Tu equipo también reserva', 'Suma a quienes atienden contigo. Cada cliente elige quién lo atiende.'],
    ['i-link', 'Un enlace para tu bio', 'Tu perfil público para Instagram y WhatsApp, con servicios, horario y mapa.'],
    ['i-percent', 'Cero comisión', 'Nunca te cobramos por cliente nuevo. Lo que vendes es tuyo.'],
  ].map((f, k) => `<li class="u-mn-i${f[3] ? ' -hi' : ''} reveal" style="--i:${k}"><span class="u-mn-ico"><svg class="icon"><use href="#${f[0]}"/></svg></span><div><h3>${f[1]}</h3><p>${f[2]}</p></div></li>`).join('');

  const perks = [
    'Perfil público con tus servicios y horario',
    'Agenda con disponibilidad real',
    'Reservas ilimitadas, sin comisión',
    'Mi Cuadre y reportes',
    'Recordatorios por WhatsApp',
    'Equipo y soporte en español',
  ].map(t => `<li><svg class="icon"><use href="#i-check"/></svg>${t}</li>`).join('');

  const steps = [
    ['Crea tu negocio', 'Entra con tu cuenta, agrega tus servicios y tu horario en pocos minutos.'],
    [soldOut ? 'Empieza tu mes de prueba' : 'Recibe tu cupo fundador', soldOut ? 'Un mes completo sin costo y sin tarjeta.' : 'Si aún quedan cupos, entras gratis al instante.'],
    ['Comparte tu enlace', 'En tu bio de Instagram, tu estado de WhatsApp y con cada cliente.'],
  ].map(([h, t], i) => `<li class="step reveal" style="--i:${i}"><span class="n">${i + 1}</span><h3>${h}</h3><p>${t}</p></li>`).join('');

  const faq = [
    { q: '¿Qué pasa cuando se llenan los 30 cupos?', a: `Cada negocio nuevo tiene 1 mes de prueba sin costo. Después paga RD$${PRICE} al mes. Los fundadores no pagan.` },
    { q: '¿Necesito tarjeta para empezar?', a: 'No. Creas tu cuenta y empiezas, sin tarjeta.' },
    { q: '¿Cobran comisión por cliente nuevo?', a: 'Nunca. Lo que vendes es tuyo.' },
    { q: '¿Cómo me pagan mis clientes?', a: 'Efectivo o transferencia, con tus cuentas bancarias visibles en tu perfil y el comprobante adjunto a la cita.' },
    { q: '¿Puedo tener más de una persona atendiendo?', a: 'Sí. Cada persona aparece como opción al reservar y tú ves quién atiende cada cita.' },
  ].map(f => `<details class="u-faq-i"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');

  const ctaLabel = soldOut ? 'Empezar mi mes de prueba' : 'Asegura tu cupo gratis';

  const body = `
${MARKETING_STYLE}
${HOME_STYLE}
<style>
  .band .sec-center { margin-top: 4.5rem; }
  .band > .sec-center:first-child { margin-top: 0; }
  .band { padding: 4.5rem 0; }
  .band--a { padding-top: 2.6rem; }
  .band--c { padding-bottom: 1rem; }
  .u-mn { margin: 1.4rem 0 0; padding: 3.4rem 2.6rem 2.6rem; border-radius: 40px; background: var(--deep); color: var(--white); position: relative; overflow: hidden; isolation: isolate; box-shadow: 0 0 0 8px rgba(15,100,98,0.07), 0 40px 70px -40px rgba(8,40,38,0.7); }
  .u-mn::before { content: ""; position: absolute; z-index: -1; width: 30rem; height: 30rem; top: -14rem; right: -8rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 68%); opacity: 0.28; }
  .u-mn-head { text-align: center; max-width: 52rem; margin: 0 auto 2.6rem; }
  .u-mn-head h2 { font-family: "Fraunces", serif; font-weight: 600; font-size: clamp(2rem, 4.6vw, 3.2rem); line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 0.9rem; color: var(--white); }
  .u-mn-head p { margin: 0 auto; color: rgba(255,255,255,0.82); font-size: 1.05rem; line-height: 1.6; max-width: 46ch; }
  .u-mn-body { max-width: 940px; margin: 0 auto; }
  .u-mn-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0 3rem; }
  .u-mn-i { display: flex; gap: 0.9rem; align-items: flex-start; padding: 1.15rem 0; border-top: 1px solid rgba(255,255,255,0.18); }
  .u-mn-i:nth-child(n+3):nth-child(-n+4) { border-top: 0; padding-top: 0; }
  .u-mn-i.-hi { border-top: 0; padding: 1.5rem 1.5rem; margin-bottom: 1.6rem; border-radius: 22px; background: rgba(255,255,255,0.07); box-shadow: inset 0 0 0 1.5px rgba(201,164,92,0.6); gap: 1.1rem; }
  .u-mn-i.-hi .u-mn-ico { width: 52px; height: 52px; border-radius: 16px; background: var(--gold-600); color: var(--deep); }
  .u-mn-i.-hi .u-mn-ico .icon { width: 26px; height: 26px; }
  .u-mn-i.-hi h3 { font-family: "Fraunces", serif; font-weight: 600; font-size: 1.5rem; margin-bottom: 0.4rem; }
  .u-mn-i.-hi p { font-size: 0.95rem; color: rgba(255,255,255,0.84); }
  .u-mn-ico { flex: none; width: 42px; height: 42px; border-radius: 13px; background: rgba(255,255,255,0.1); color: var(--white); display: inline-flex; align-items: center; justify-content: center; }
  .u-mn-ico .icon { width: 21px; height: 21px; }
  .u-mn-ico.-gold { background: var(--gold-600); color: var(--deep); }
  .u-mn-i h3 { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 1rem; font-weight: 800; margin: 0 0 0.25rem; color: var(--white); }
  .u-mn-i p { margin: 0; font-size: 0.88rem; line-height: 1.55; color: rgba(255,255,255,0.74); }
  .u-mn-proof { max-width: 940px; margin: 2.8rem auto 0; padding: 2rem 2rem 1.8rem; border-radius: 28px; background: rgba(255,255,255,0.06); box-shadow: inset 0 0 0 1.5px rgba(201,164,92,0.55); text-align: center; }
  .u-mn-proof-t { display: flex; flex-direction: column; align-items: center; gap: 0.9rem; margin-bottom: 1.6rem; }
  .u-mn-proof-t h3 { font-family: "Fraunces", serif; font-weight: 600; font-size: 1.6rem; margin: 0 0 0.3rem; color: var(--white); }
  .u-mn-proof-t p { margin: 0 auto; color: rgba(255,255,255,0.78); font-size: 0.95rem; max-width: 46ch; }
  .u-mn-steps { list-style: none; margin: 0; padding: 1.5rem 0 0; display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid rgba(255,255,255,0.16); }
  .u-mn-steps li { display: flex; flex-direction: column; align-items: center; gap: 0.7rem; padding: 0 1.4rem; font-size: 0.92rem; line-height: 1.5; color: rgba(255,255,255,0.88); }
  .u-mn-steps li + li { border-left: 1px solid rgba(255,255,255,0.16); }
  .u-mn-steps b { flex: none; width: 30px; height: 30px; border-radius: 50%; background: var(--gold-600); color: var(--deep); display: grid; place-items: center; font-size: 0.88rem; }
  .u-hero { padding-bottom: 3rem; }
  .u-choose { margin-top: 1.6rem; }
  .u-choose-t { font-weight: 800; color: var(--white); font-size: 1.05rem; margin: 0 0 0.9rem; }
  .u-choose-btns { display: flex; gap: 0.7rem; justify-content: center; flex-wrap: wrap; }
  .u-choose-btns .btn { min-height: 48px; }
  .u-choose .u-ghost { background: rgba(255,255,255,0.12); color: var(--white); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.4); justify-content: center; }
  .u-choose .u-ghost:hover { background: rgba(255,255,255,0.22); }
  .mkt-hero p.u-choose-n { font-size: 0.85rem; color: rgba(255,255,255,0.72); margin: 0.9rem auto 0; max-width: 40ch; }
  .u-hc { margin: 1.8rem auto 0; max-width: 440px; padding: 1.3rem 1.6rem 1.2rem; border-radius: 24px; background: rgba(255,255,255,0.09); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2), 0 24px 40px -28px rgba(0,0,0,0.6); }
  .u-hc-n { font-family: "Fraunces", serif; font-weight: 600; font-size: 3.2rem; line-height: 1; letter-spacing: -0.02em; color: var(--white); }
  .u-hc-l { font-size: 0.92rem; color: rgba(255,255,255,0.82); margin-top: 0.3rem; }
  .u-hc-bar { height: 8px; border-radius: 999px; background: rgba(255,255,255,0.16); overflow: hidden; margin: 0.9rem auto 0.8rem; max-width: 300px; }
  .u-hc-bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--teal-600), var(--gold-600)); }
  .mkt-hero p.u-hc-note { font-size: 0.88rem; color: rgba(255,255,255,0.8); margin: 0; }
  .u-hc-note b { color: var(--gold-600); font-size: 1rem; }
  .u-hr { height: 1px; border: 0; margin: 2.4rem auto 0; width: min(560px, 70%); background: linear-gradient(to right, transparent, oklch(62% 0.09 195 / 0.5), transparent); }
  .u-plans { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.8rem; max-width: 900px; margin: 2.8rem auto 0; align-items: stretch; }
  .u-plan { position: relative; padding: 2.8rem 2rem 2.2rem; border-radius: 32px; background: var(--card); box-shadow: var(--bezel); display: flex; flex-direction: column; align-items: center; text-align: center; overflow: hidden; isolation: isolate; }
  .u-plan::before { content: ""; position: absolute; z-index: -1; width: 16rem; height: 16rem; top: -8rem; left: 50%; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, var(--teal-100), transparent 70%); opacity: 0.9; }
  .u-plan.-f { box-shadow: 0 0 0 2px var(--gold-600), 0 24px 44px -24px rgba(15,60,58,0.3); }
  .u-plan.-f::before { background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.55; }
  .u-plan.-p { background: var(--deep); color: var(--white); box-shadow: 0 0 0 2px var(--teal-600), 0 0 0 10px rgba(15,133,131,0.14), 0 40px 70px -30px rgba(8,40,38,0.65); transform: translateY(-10px); padding-top: 3.2rem; }
  .u-plan.-p::before { background: radial-gradient(circle, var(--teal-600), transparent 70%); opacity: 0.45; }
  .u-plan.-f .tag { background: var(--gold-600); color: var(--deep); }
  .u-plan .tag { display: inline-block; background: var(--teal-600); color: var(--white); font-size: 0.76rem; font-weight: 800; letter-spacing: 0.1em; padding: 0.4rem 0.95rem; border-radius: 999px; text-transform: uppercase; margin-bottom: 1.1rem; }
  .u-plan h3 { font-family: "Fraunces", serif; font-weight: 600; font-size: 1.7rem; margin: 0; letter-spacing: -0.01em; }
  .u-plan .amount { font-family: "Fraunces", serif; font-weight: 600; font-size: clamp(2.8rem, 5vw, 3.5rem); line-height: 1; letter-spacing: -0.03em; color: var(--teal-900); margin: 0.9rem 0 0.2rem; }
  .u-plan .amount small { display: block; font-family: "Plus Jakarta Sans", sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--soft); margin: 0.5rem 0 0; }
  .u-plan > p { color: var(--soft); font-size: 0.92rem; line-height: 1.55; max-width: 32ch; margin: 0.9rem 0 1.3rem; }
  .u-plan ul { list-style: none; padding: 1.3rem 0 0; margin: 0 0 1.8rem; display: grid; gap: 0.7rem; flex: 1; align-content: start; width: 100%; max-width: 300px; border-top: 1px solid var(--line); justify-items: stretch; text-align: left; }
  .u-plan li { display: flex; gap: 0.6rem; align-items: flex-start; justify-content: flex-start; font-size: 0.92rem; line-height: 1.4; }
  .u-plan li .icon { color: var(--cash); width: 18px; height: 18px; flex: none; margin-top: 0.12rem; }
  .u-plan.-f .amount small { color: var(--gold-700); }
  .u-plan.-p .amount { color: var(--gold-600); font-size: clamp(3.4rem, 6vw, 4.6rem); }
  .u-plan.-p .amount small { color: rgba(255,255,255,0.85); }
  .u-plan.-p > p { color: rgba(255,255,255,0.82); }
  .u-plan.-p ul { border-top-color: rgba(255,255,255,0.22); }
  .u-plan.-p li .icon { color: #5fd08f; }
  .u-plan.-p .tag { background: var(--gold-600); color: var(--deep); }
  .u-plan.-p h3 { color: var(--white); }
  .u-plan.-p .btn[aria-disabled="true"] { color: var(--white); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.45); }
  .u-plan .btn { width: 100%; max-width: 280px; justify-content: center; }
  .u-plans .btn, .mkt-hero-cta .btn, .biz-cta .btn { min-height: 46px; }
  .u-plan .btn[aria-disabled="true"] { background: transparent; color: var(--soft); box-shadow: inset 0 0 0 1.5px var(--line); cursor: default; pointer-events: none; }
  .u-f3 { grid-template-columns: 1fr; max-width: 980px; margin-left: auto; margin-right: auto; }
  .u-f3 .f3-table tbody th { width: 30%; }
  .u-f3 .f3-table th:not(:first-child), .u-f3 .f3-table td { border-left: 1px solid rgba(255,255,255,0.14); padding-left: 1.1rem; }
  .u-f3 .f3-table th:first-child { padding-right: 1.1rem; }
  .u-f3 .f3-table thead th { text-align: center; font-size: 0.82rem; letter-spacing: 0.1em; font-weight: 800; color: var(--white); padding: 1.3rem 0.6rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.32); }
  .u-gold { font-weight: inherit; color: var(--gold-600); }
  .u-f3 .f3-table thead th:last-child { font-size: 1rem; }
  .u-f3 .f3-table thead th:last-child { color: var(--gold-600); }
  @media (min-width: 821px) {
    .u-f3 .f3-table tbody th, .u-f3 .f3-table tbody td { border-top: 1px solid rgba(255,255,255,0.32) !important; padding-top: 1.1rem; padding-bottom: 1.1rem; }
  }
  .f3-table td.u-no { color: rgba(255,255,255,0.58); width: 31%; }
  .f3-table td.u-yes { color: var(--white); font-weight: 700; font-size: 1rem; line-height: 1.4; }
  .f3-table td.u-yes .f3-chk { width: 24px; height: 24px; margin-right: 0.6rem; vertical-align: middle; }
  .u-x { color: #e48d72; width: 14px; height: 14px; stroke-width: 3; margin-right: 0.55rem; vertical-align: -2px; }
  .u-lab { display: none; }
  .u-steps { grid-template-columns: repeat(3, 1fr); max-width: 920px; margin-left: auto; margin-right: auto; }
  .u-faq { max-width: 760px; margin: 1.6rem auto 0; display: grid; gap: 0.7rem; }
  .u-faq-i { background: var(--card); border-radius: 18px; box-shadow: var(--bezel); padding: 0 1.3rem; }
  .u-faq-i summary { cursor: pointer; font-weight: 700; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 1rem; min-height: 56px; }
  .u-faq-i summary::-webkit-details-marker { display: none; }
  .u-faq-i summary:focus-visible { outline: 2px solid var(--teal-600); outline-offset: 4px; border-radius: 12px; }
  .u-faq-i summary::after { content: "+"; color: var(--teal-600); font-weight: 800; }
  .u-faq-i[open] summary::after { content: "−"; }
  .u-faq-i p { margin: 0 0 1.1rem; color: var(--soft); line-height: 1.6; font-size: 0.92rem; }
  @media (max-width: 820px) {
      .u-plan.-p { transform: none; }
    .u-mn { padding: 2.2rem 1.2rem 1.4rem; border-radius: 28px; }
    .u-mn-list, .u-mn-steps { grid-template-columns: 1fr; }
    .u-mn-steps li { padding: 1.1rem 0; }
    .u-mn-steps li + li { border-left: 0; border-top: 1px solid rgba(255,255,255,0.16); }
      .u-mn-i.-hi { margin-bottom: 1rem; }
    .u-mn-i:nth-child(n+3):nth-child(-n+4) { border-top: 1px solid rgba(255,255,255,0.18); padding-top: 1.15rem; }
    .u-mn-i:nth-child(3) { border-top: 0; padding-top: 0; }
    .u-mn-proof { padding: 1.4rem 1.2rem; }
      .u-steps { grid-template-columns: 1fr; }
    .u-lab { display: block; font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 800; color: rgba(255,255,255,0.5); margin-bottom: 0.2rem; }
  }
</style>
<div class="m-access-bar">
  <span>¿Ya tienes tu negocio en Bukea?</span>
  <a class="btn btn-primary" href="${PORTAL_URL}">Iniciar sesión en Mi Negocio</a>
</div>
<div class="wrap">
  <div class="mkt-hero u-hero">
    <img class="hero-waves" src="${SITE_BASE}/img/site/hero-waves.svg" alt="" aria-hidden="true" width="712" height="712">
    <div class="mkt-hero-inner">
      <h1 class="reveal" style="--i:0">Tu agenda llena, sin comisiones</h1>
      <p class="reveal" style="--i:1">En Bukea creemos en apoyar a los negocios dominicanos, y por eso regalamos ${FOUNDING_FREE_LIMIT} cuentas gratis de por vida a los primeros en registrarse.</p>
      <div class="u-hc reveal" style="--i:2" role="group" aria-label="Cupos fundadores">
        <div class="u-hc-n">${spotsLeft}</div>
        <div class="u-hc-l">${soldOut ? 'cupos fundadores completos' : (spotsLeft === 1 ? 'cupo gratis disponible' : 'cupos gratis disponibles')} de ${FOUNDING_FREE_LIMIT}</div>
        <div class="u-hc-bar" aria-hidden="true"><i style="width:${100 - pct}%"></i></div>
        <p class="u-hc-note">Después, 1 mes de prueba gratis y <b>RD$${PRICE}</b> al mes.</p>
      </div>
      <div class="u-choose reveal" style="--i:3">
        <p class="u-choose-t">¿Cómo quieres unirte?</p>
        <div class="u-choose-btns">
          <a class="btn btn-primary has-ico" href="${PORTAL_REGISTER_URL}">${soldOut ? 'Tengo un negocio, empezar mi mes de prueba' : 'Tengo un negocio'}<span class="btn-ico"><svg class="icon"><use href="#i-arrow-up-right"/></svg></span></a>
          <a class="btn u-ghost" href="/entrar/cliente">Soy cliente</a>
        </div>
        <p class="u-choose-n">Si tienes un negocio, te haremos unas preguntas para armar tu perfil.</p>
      </div>
    </div>
  </div>

  <hr class="u-hr" aria-hidden="true">
  <section class="u-mn" aria-labelledby="mn-title">
    <div class="u-mn-head reveal">
      <h2 id="mn-title"><b class="u-gold">Mi Negocio</b>, todo tu negocio en un solo lugar</h2>
      <p>El panel de Bukea para manejar tus citas, tus cobros y tu equipo, desde el celular o la computadora.</p>
    </div>
    <div class="u-mn-body">
      <ul class="u-mn-list">${mnItems}</ul>
    </div>
    <div class="u-mn-proof reveal">
      <div class="u-mn-proof-t">
        <span class="u-mn-ico -gold"><svg class="icon"><use href="#i-cash"/></svg></span>
        <div>
          <h3>Comprobantes de pago adjuntos a cada cita</h3>
          <p>Se acabó pedir la captura por WhatsApp y buscarla entre mil mensajes.</p>
        </div>
      </div>
      <ol class="u-mn-steps">
        <li><b>1</b><span>Tu cliente reserva y elige transferencia. Ve tus cuentas bancarias en el mismo paso.</span></li>
        <li><b>2</b><span>Sube su comprobante desde la reserva o después, desde Mis citas.</span></li>
        <li><b>3</b><span>Tú lo ves en la cita, con la cuenta y el monto, y sabes quién ya pagó.</span></li>
      </ol>
    </div>
  </section>

  <hr class="u-hr" aria-hidden="true">
  <div class="band band--a">
    <h2 class="sec-title sec-center">Planes y precios</h2>
    <p class="sec-sub">Gratis de por vida para los primeros ${FOUNDING_FREE_LIMIT}. Para el resto, un mes de prueba y un solo plan.</p>
    <div class="u-plans">
      <div class="u-plan -f reveal" style="--i:0">
        <span class="tag">Fundadores, ${FOUNDING_FREE_LIMIT} cupos</span>
        <h3>Miembro fundador</h3>
        <div class="amount">RD$0<small>de por vida</small></div>
        <p><strong>Sé uno de los ${FOUNDING_FREE_LIMIT} primeros miembros fundadores</strong> y disfruta de tu membresía de por vida en Bukea.</p>
        <ul>${perks}<li><svg class="icon"><use href="#i-check"/></svg>Insignia de fundador en tu perfil</li></ul>
        <a class="btn btn-primary" href="${PORTAL_REGISTER_URL}">${soldOut ? 'Cupos completos' : 'Asegurar mi cupo gratis'}</a>
      </div>
      <div class="u-plan -p reveal" style="--i:1">
        <span class="tag -teal">1 mes de prueba gratis</span>
        <h3>Plan Bukea</h3>
        <div class="amount">RD$${PRICE}<small>al mes</small></div>
        <p>Para los negocios que entren después del cupo ${FOUNDING_FREE_LIMIT}. El primer mes es gratis y luego se cobra.</p>
        <ul>${perks}</ul>
        ${soldOut ? `<a class="btn btn-primary" href="${PORTAL_REGISTER_URL}">Empezar mi mes de prueba</a>` : '<span class="btn btn-primary" aria-disabled="true">Disponible al agotarse los cupos</span>'}
      </div>
    </div>
    <p class="sec-sub" style="margin-top:1.6rem">Para el cliente, Bukea es gratis siempre.</p>
  </div>

  <div class="band band--c">
    <section class="f3 u-f3 reveal" aria-labelledby="f3-title">
      <div class="f3-r">
        <div class="f3-head">
          <h2 id="f3-title">Por qué <b class="u-gold">Bukea</b> y no otra app</h2>
          <p>Hecha en República Dominicana, para cómo se trabaja aquí.</p>
        </div>
        <div class="f3-panel">
          <table class="f3-table">
            <thead><tr><th scope="col">Lo que necesitas</th><th scope="col">Apps internacionales</th><th scope="col">Bukea</th></tr></thead>
            <tbody>${cmp}</tbody>
          </table>
        </div>
      </div>
    </section>

    <h2 class="sec-title sec-center">Empieza en tres pasos</h2>
    <p class="sec-sub">Menos de 5 minutos.</p>
    <ol class="steps u-steps">${steps}</ol>

    <h2 class="sec-title sec-center">Preguntas frecuentes</h2>
    <div class="u-faq">${faq}</div>

    <div class="biz-cta reveal">
      <h2>${soldOut ? 'Empieza tu mes de prueba' : `Quedan ${spotsLeft} cupos gratis`}</h2>
      <p>Crea tu perfil en minutos y comparte tu enlace por WhatsApp.</p>
      <a class="btn btn-primary has-ico" href="${PORTAL_REGISTER_URL}">${soldOut ? 'Empezar mi mes de prueba' : 'Asegura tu cupo'}<span class="btn-ico"><svg class="icon"><use href="#i-arrow-up-right"/></svg></span></a>
    </div>
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Únete a Bukea. Gratis para los primeros 30 negocios',
    description: `Los primeros ${FOUNDING_FREE_LIMIT} negocios entran gratis a Bukea. Después, 1 mes de prueba y RD$${PRICE} al mes. Cero comisión, WhatsApp y pagos a la dominicana.`,
    canonicalPath: 'https://www.bukeard.com/unete',
    bodyHtml: body,
  }));
});

router.get('/descargar', async (req, res) => {
  const base = req.baseUrlPrefix;
  const qr = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=296x296&margin=0&data=${encodeURIComponent(url)}`;

  const body = `
${MARKETING_STYLE}
${DOWNLOAD_STYLE}
<div class="wrap">
  ${mktHeroHtml({
    title: 'Descarga Bukea para iPhone y Android',
    sub: 'Reserva tu próxima cita o gestiona tu negocio de belleza desde el celular. Gratis para ti y para tu clientela.',
    ctaHtml: storeButtons(),
  })}

  <div class="dl-grid">
    <div class="dl-card reveal" style="--i:0">
      <div class="dl-qr-wrap"><img class="dl-qr" src="${qr(APP_STORE_URL)}" alt="Código QR para descargar Bukea" width="148" height="148" loading="lazy"></div>
      <h3>Para reservar tu cita</h3>
      <p>Explora barberías, salones y manicuristas, mira precios y horas libres y reserva en segundos. Paga en efectivo o transferencia.</p>
      <a class="btn btn-primary" href="${base}/">Abrir en el navegador</a>
    </div>
    <div class="dl-card dl-card--deep reveal" style="--i:1">
      <div class="dl-qr-wrap"><img class="dl-qr" src="${qr(APP_STORE_URL)}" alt="Código QR para descargar Bukea" width="148" height="148" loading="lazy"></div>
      <h3>Para tu negocio</h3>
      <p>Tu agenda y tu clientela, sin pagar comisión. Crea tu perfil, arma tu horario y recibe reservas, todo desde el celular.</p>
      <a class="btn btn-on-deep" href="${PORTAL_URL}">Entrar a Mi Negocio</a>
    </div>
  </div>

  <p class="dl-note reveal" style="--i:2">¿Prefieres no instalar nada? Bukea también funciona en el navegador de tu celular, en <b>bukeard.com</b>.</p>
</div>`;

  res.type('html').send(await pageShell({
    base,
    title: 'Descarga Bukea. Reserva o gestiona tu negocio',
    description: 'Descarga Bukea para iPhone y Android. Reserva tu cita o gestiona tu negocio de belleza, gratis.',
    canonicalPath: 'https://www.bukeard.com/descargar',
    bodyHtml: body,
  }));
});

const DOWNLOAD_STYLE = `
<style>
  .dl-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.6rem; margin: 3rem 0 1.6rem; }
  .dl-card { padding: 2.2rem 2rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; border-radius: 28px; background: var(--card); box-shadow: var(--bezel); }
  .dl-qr-wrap { padding: 0.7rem; border-radius: 22px; background: #fff; box-shadow: 0 0 0 1px var(--line); margin-bottom: 0.8rem; }
  .dl-qr { display: block; width: 148px; height: 148px; border-radius: 12px; }
  .dl-card h3 { margin: 0.2rem 0 0; font-family: "Fraunces", serif; font-weight: 600; font-size: 1.5rem; color: var(--teal-900); }
  .dl-card p { margin: 0 0 1rem; color: var(--soft); font-size: 0.92rem; line-height: 1.55; max-width: 36ch; }
  .dl-card--deep { background: var(--deep) var(--dots-white); color: var(--white); }
  .dl-card--deep h3 { color: var(--white); }
  .dl-card--deep p { color: rgba(255,255,255,0.8); }
  .btn-on-deep { background: var(--gold-600); color: var(--deep); }
  .btn-on-deep:hover { background: var(--white); }
  .dl-note { text-align: center; color: var(--soft); font-size: 0.88rem; margin: 0 auto 3rem; }
  @media (max-width: 720px) { .dl-grid { grid-template-columns: 1fr; } }
</style>`;

const LEGAL_STYLE = `
<style>
  .legal-prose { max-width: 68ch; margin: 0 auto 3rem; }
  .legal-prose h2 { font-size: 1.1rem; color: var(--teal-900); margin: 1.8rem 0 0.5rem; }
  .legal-prose h2:first-child { margin-top: 0; }
  .legal-prose p, .legal-prose li { color: var(--soft); line-height: 1.65; font-size: 0.94rem; }
  .legal-prose ul { margin: 0 0 0.9rem; padding-left: 1.2rem; }
  .legal-prose .updated { margin-top: 2.2rem; padding-top: 1.2rem; border-top: 1px solid var(--line); font-size: 0.82rem; }
</style>`;

router.get('/blog', async (req, res) => {
  const base = req.baseUrlPrefix;
  const body = `
${MARKETING_STYLE}
<div class="wrap">
  ${mktHeroHtml({
    title: 'El blog de Bukea',
    sub: 'Estamos preparando historias de profesionales, consejos de belleza y novedades de la app. Muy pronto por aquí.',
    ctaHtml: '<a class="btn btn-primary" href="/">Volver al inicio</a>',
  })}
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Blog. Bukea',
    description: 'Historias, consejos y novedades de Bukea. Muy pronto.',
    canonicalPath: 'https://www.bukeard.com/blog',
    bodyHtml: body,
  }));
});

// Formulario de contacto (2026-08-27) — antes esta página solo tenía un
// enlace mailto:. Protección antispam sin dependencias externas (sin
// captcha, sin API key de terceros):
//   1. Honeypot: campo "sitio-web" oculto por CSS, invisible y sin tabIndex
//      para una persona real, pero que los bots de formularios sí rellenan.
//      Si llega con contenido, se finge éxito sin enviar nada.
//   2. Trampa de tiempo: se manda un timestamp oculto al cargar la página;
//      si el POST llega en menos de 3 segundos, nadie leyó el formulario
//      de verdad — mismo tratamiento que el honeypot.
//   3. Límite por IP (lib/rate-limit.js, igual patrón que el login):
//      8 envíos por hora, bloqueo de 30 min al pasarse.
// Estilos propios de /contacto (2026-08-27, segunda pasada: la primera
// versión era una sola tarjeta chica flotando en medio de una página vacía
// — "se ve una página a medias". Ahora es una sección de dos columnas
// (info de contacto + formulario), como una página de contacto real.
const CONTACT_STYLE = `
<style>
  .contact-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 3rem; align-items: start; margin: 3rem 0 3.5rem; }
  /* Panel izquierdo (ref. mockup de Víctor 2026-08-27): divisores finos
     entre canales, marca de agua "b" fantasma de fondo y frase de cierre,
     separado del formulario por un filete dorado en vez de solo el gap. */
  .contact-info { position: relative; padding: 0.2rem 2.4rem 2.4rem 0; border-right: 1px solid rgba(201, 164, 92, 0.35); }
  .contact-info::before {
    content: "b"; position: absolute; left: -1.2rem; bottom: -1.4rem; z-index: 0; pointer-events: none;
    font-family: "Fraunces", serif; font-style: italic; font-weight: 700; font-size: 18rem; line-height: 1;
    color: var(--teal-900); opacity: 0.05;
  }
  .contact-info > * { position: relative; z-index: 1; }
  .contact-info h2 { font-size: 1.3rem; color: var(--teal-900); margin: 0 0 0.6rem; }
  .contact-info > p { color: var(--soft); font-size: 0.92rem; line-height: 1.6; margin: 0 0 2rem; max-width: 38ch; }
  .contact-channel { display: flex; gap: 0.9rem; align-items: flex-start; padding-bottom: 1.3rem; margin-bottom: 1.3rem; border-bottom: 1px solid var(--line); }
  .contact-channel:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .contact-channel h3 { margin: 0 0 0.2rem; font-size: 0.96rem; color: var(--teal-900); }
  .contact-channel p { margin: 0; font-size: 0.85rem; color: var(--soft); line-height: 1.5; }
  .contact-channel a.email-link { color: var(--teal-700); font-weight: 700; text-decoration: none; }
  .contact-channel a.email-link:hover { text-decoration: underline; }
  .contact-social { display: flex; gap: 0.6rem; margin-top: 1.8rem; }
  .contact-tagline { margin: 2.2rem 0 0; padding-top: 1.2rem; border-top: 1px solid var(--line); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold-700); line-height: 2; }
  .contact-card { padding: 2rem; }
  .contact-card h2 { margin: 0 0 1.4rem; font-size: 1.1rem; color: var(--teal-900); }
  .contact-success { display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem; }
  .contact-success .icon-badge { margin-bottom: 0.6rem; }
  .contact-success p:first-of-type { font-weight: 700; font-size: 1.1rem; color: var(--teal-900); }
  .contact-success p { color: var(--soft); font-size: 0.9rem; margin: 0; }
  .field { margin-bottom: 0.9rem; }
  .field label { font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--soft); display: block; margin-bottom: 0.4rem; }
  .field input, .field textarea, .field select { width: 100%; background: var(--bg); border: 1.5px solid var(--line); border-radius: 13px; padding: 0.72rem 0.95rem; font-size: 0.92rem; font-family: inherit; color: var(--ink); resize: vertical; appearance: none; -webkit-appearance: none; }
  .field select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2344647a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.8rem center; background-size: 18px; padding-right: 2.4rem; cursor: pointer; }
  .field select:invalid { color: var(--soft); }
  .field input:focus, .field textarea:focus, .field select:focus { outline: none; border-color: var(--teal-600); }
  .field-count { margin: 0.35rem 0 0; text-align: right; font-size: 0.74rem; color: var(--soft); }
  @media (max-width: 820px) {
    .contact-grid { grid-template-columns: 1fr; gap: 2.2rem; margin: 2.2rem 0 2.5rem; }
    .contact-info { padding-right: 0; border-right: none; }
  }
</style>`;

function contactInfoHtml() {
  return `
  <div class="contact-info reveal" style="--i:2">
    <h2>Elige tu canal</h2>
    <p>Escríbenos por el que prefieras. Un negocio de verdad detrás de Bukea te responde, no un buzón automático.</p>
    <div class="contact-channel">
      <div class="icon-badge"><svg class="icon"><use href="#i-mail"/></svg></div>
      <div>
        <h3>Correo</h3>
        <p><a class="email-link" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
      </div>
    </div>
    <div class="contact-channel">
      <div class="icon-badge"><svg class="icon"><use href="#i-clock"/></svg></div>
      <div>
        <h3>Tiempo de respuesta</h3>
        <p>Menos de 48 horas, todos los días.</p>
      </div>
    </div>
    <div class="contact-channel">
      <div class="icon-badge"><svg class="icon"><use href="#i-users"/></svg></div>
      <div>
        <h3>¿Tienes un negocio?</h3>
        <p><a class="email-link" href="/unete">Conoce cómo unirte a Bukea →</a></p>
      </div>
    </div>
    <div class="footer-social-row contact-social">
      <a href="https://www.facebook.com/bukeard" target="_blank" rel="noopener" aria-label="Facebook"><svg class="icon"><use href="#i-facebook"/></svg></a>
      <a href="https://www.instagram.com/bukeard" target="_blank" rel="noopener" aria-label="Instagram"><svg class="icon"><use href="#i-instagram"/></svg></a>
      <a href="https://www.tiktok.com/@bukeard" target="_blank" rel="noopener" aria-label="TikTok"><svg class="icon"><use href="#i-tiktok"/></svg></a>
    </div>
    <p class="contact-tagline">Tu belleza.<br>Tu tiempo.<br>Tu elección.</p>
  </div>`;
}

function contactHeroHtml() {
  return mktHeroHtml({
    eyebrow: 'Estamos para ayudarte',
    title: 'Hablemos.',
    sub: '¿Tienes una pregunta, una idea o algo que no funciona como debería? Escríbenos directamente.',
  });
}

// Motivos del formulario de contacto — whitelist server-side (routeo POST)
// para que "asunto" en el correo nunca traiga texto libre inventado.
const CONTACT_SUBJECTS = {
  cuenta: 'Problema con mi cuenta',
  negocio: 'Oferta de negocio / alianza',
  soporte: 'Algo no funciona (soporte técnico)',
  sugerencia: 'Sugerencia o idea',
  otro: 'Otro',
};
const CONTACT_MESSAGE_MAX = 3000;

function contactFormHtml({ error, values }) {
  const v = values || {};
  const msgLen = String(v.message || '').length;
  const subjectOptions = Object.entries(CONTACT_SUBJECTS)
    .map(([key, label]) => `<option value="${key}"${v.subject === key ? ' selected' : ''}>${esc(label)}</option>`)
    .join('');
  return `
  <div class="card contact-card reveal" style="--i:3">
    <h2>Envíanos un mensaje</h2>
    ${error ? `<p style="background:oklch(94% 0.04 25);color:oklch(45% 0.15 25);border-radius:12px;padding:0.7rem 0.9rem;font-size:0.85rem;font-weight:600;margin:0 0 1rem">${esc(error)}</p>` : ''}
    <form method="post" action="/contacto" novalidate>
      <div class="field">
        <label for="ct-name">Tu nombre</label>
        <input id="ct-name" name="name" type="text" required maxlength="100" value="${esc(v.name || '')}">
      </div>
      <div class="field">
        <label for="ct-email">Tu correo</label>
        <input id="ct-email" name="email" type="email" required maxlength="190" value="${esc(v.email || '')}">
      </div>
      <div class="field">
        <label for="ct-subject">Asunto</label>
        <select id="ct-subject" name="subject" required>
          <option value="" disabled${v.subject ? '' : ' selected'}>Elige un motivo…</option>
          ${subjectOptions}
        </select>
      </div>
      <div class="field">
        <label for="ct-message">Mensaje</label>
        <textarea id="ct-message" name="message" required minlength="10" maxlength="${CONTACT_MESSAGE_MAX}" rows="5" oninput="document.getElementById('ct-count').textContent = this.value.length">${esc(v.message || '')}</textarea>
        <p class="field-count"><span id="ct-count">${msgLen}</span> / ${CONTACT_MESSAGE_MAX}</p>
      </div>
      <div aria-hidden="true" style="position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;">
        <label for="ct-website">Sitio web (dejar en blanco)</label>
        <input id="ct-website" name="sitio-web" type="text" tabindex="-1" autocomplete="off">
      </div>
      <input type="hidden" name="ts" value="${Date.now()}">
      <button class="btn btn-primary" type="submit" style="width:100%; justify-content:center; margin-top:0.4rem;">Enviar mensaje</button>
    </form>
  </div>`;
}

function contactSuccessHtml() {
  return `
  <div class="card contact-card reveal" style="--i:3">
    <div class="contact-success">
      <div class="icon-badge"><svg class="icon"><use href="#i-check"/></svg></div>
      <p>¡Mensaje enviado!</p>
      <p>Te respondemos a tu correo en menos de 48 horas.</p>
    </div>
  </div>`;
}

router.get('/contacto', async (req, res) => {
  const base = req.baseUrlPrefix;
  const sent = req.query.enviado === '1';
  const body = `
${MARKETING_STYLE}
${CONTACT_STYLE}
<div class="wrap">
  ${contactHeroHtml()}
  <div class="contact-grid">
    ${contactInfoHtml()}
    ${sent ? contactSuccessHtml() : contactFormHtml({})}
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Contacto. Bukea',
    description: 'Escríbenos a Bukea para preguntas, soporte o alianzas.',
    canonicalPath: 'https://www.bukeard.com/contacto',
    bodyHtml: body,
  }));
});

router.post('/contacto', express.urlencoded({ extended: false }), async (req, res) => {
  const base = req.baseUrlPrefix;
  const ip = req.ip || 'sin-ip';
  const name = String(req.body.name || '').trim().slice(0, 100);
  const email = String(req.body.email || '').trim().slice(0, 190);
  const message = String(req.body.message || '').trim().slice(0, CONTACT_MESSAGE_MAX);
  // Whitelist: un asunto que no venga de las opciones reales del <select>
  // (curl, un bot editando el HTML) cae en "Otro", nunca texto libre.
  const subject = Object.prototype.hasOwnProperty.call(CONTACT_SUBJECTS, req.body.subject) ? req.body.subject : '';
  const honeypot = String(req.body['sitio-web'] || '').trim();
  const ts = Number(req.body.ts) || 0;

  const renderError = async (error) => {
    const body = `
${MARKETING_STYLE}
${CONTACT_STYLE}
<div class="wrap">
  ${contactHeroHtml()}
  <div class="contact-grid">
    ${contactInfoHtml()}
    ${contactFormHtml({ error, values: { name, email, message, subject } })}
  </div>
</div>`;
    res.type('html').send(await pageShell({
      base, title: 'Contacto. Bukea',
      description: 'Escríbenos a Bukea para preguntas, soporte o alianzas.',
      canonicalPath: 'https://www.bukeard.com/contacto',
      bodyHtml: body,
    }));
  };

  // Bots: fingir éxito para no revelar la trampa, sin enviar nada.
  if (honeypot || !ts || Date.now() - ts < 3000) {
    return res.redirect('/contacto?enviado=1');
  }

  const wait = rateLimit.check([{ key: `contact:ip:${ip}` }]);
  if (wait > 0) return renderError(rateLimit.waitMessage(wait));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk || !subject || message.length < 10) {
    return renderError('Completa tu nombre, un correo válido, un asunto y un mensaje de al menos 10 caracteres.');
  }

  rateLimit.hit([{ key: `contact:ip:${ip}`, max: 8, windowMs: 60 * 60 * 1000, blockMs: 30 * 60 * 1000 }]);

  try {
    await mailer.sendContactMessage({ name, email, message, subject: CONTACT_SUBJECTS[subject] });
  } catch (err) {
    console.error('contacto: fallo al enviar', err);
    return renderError('No se pudo enviar el mensaje ahora mismo. Escríbenos directo a ' + CONTACT_EMAIL + '.');
  }

  res.redirect('/contacto?enviado=1');
});

router.get('/privacidad', async (req, res) => {
  const base = req.baseUrlPrefix;
  const body = `
${MARKETING_STYLE}
${LEGAL_STYLE}
<div class="wrap">
  ${mktHeroHtml({ title: 'Política de privacidad', slim: true })}
  <div class="legal-prose">
    <h2>Qué datos recogemos</h2>
    <ul>
      <li>Tu nombre y número de teléfono, para crear tu cuenta y confirmar citas.</li>
      <li>Tu correo, solo si lo agregas. Se usa únicamente para recuperar tu PIN.</li>
      <li>El historial de tus citas.</li>
    </ul>
    <p>Si eres profesional o negocio, también guardamos tus servicios, horario, y las cuentas bancarias que decides mostrar a tus clientes para transferencias.</p>

    <h2>Cómo lo usamos</h2>
    <p>Solo para que la app funcione: confirmar tu identidad, mostrar y gestionar tus citas, y notificarte por WhatsApp. No vendemos tus datos a nadie.</p>

    <h2>Con quién lo compartimos</h2>
    <p>Con el profesional o negocio que reservas, para que sepa quién llega. Con Meta/WhatsApp, para enviarte confirmaciones y recordatorios. Con nadie más.</p>

    <h2>Pagos</h2>
    <p>Bukea no procesa pagos ni guarda datos de tarjetas. Las citas se pagan directamente entre cliente y negocio, en efectivo o transferencia.</p>

    <h2>Tus derechos</h2>
    <p>Puedes pedirnos que borremos tu cuenta y tus datos escribiendo a <a href="mailto:${CONTACT_EMAIL}" style="color:var(--teal-700);font-weight:700">${CONTACT_EMAIL}</a>.</p>

    <p class="updated">Última actualización: agosto 2026. Esta política se irá ampliando a medida que crece Bukea.</p>
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Política de privacidad. Bukea',
    description: 'Cómo Bukea recoge, usa y protege tus datos.',
    canonicalPath: 'https://www.bukeard.com/privacidad',
    bodyHtml: body,
  }));
});

router.get('/terminos', async (req, res) => {
  const base = req.baseUrlPrefix;
  const body = `
${MARKETING_STYLE}
${LEGAL_STYLE}
<div class="wrap">
  ${mktHeroHtml({ title: 'Términos de servicio', slim: true })}
  <div class="legal-prose">
    <h2>Qué es Bukea</h2>
    <p>Bukea conecta a clientes con profesionales de belleza en República Dominicana. Facilitamos la reserva; el servicio en sí lo presta el profesional o negocio, no Bukea.</p>

    <h2>Cuentas</h2>
    <p>Eres responsable de la información que registras y de mantener tu PIN en privado.</p>

    <h2>Reservas y pagos</h2>
    <p>Las citas se pagan directamente al profesional (efectivo, transferencia u otro método que él acepte). Bukea no cobra comisión al cliente. Cancelar o reprogramar depende de la política de cada negocio.</p>

    <h2>Uso aceptable</h2>
    <p>No uses Bukea para acosar, estafar o suplantar a otra persona o negocio.</p>

    <h2>Cambios</h2>
    <p>Podemos actualizar estos términos; avisaremos los cambios importantes dentro de la app.</p>

    <p class="updated">Última actualización: agosto 2026.</p>
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Términos de servicio. Bukea',
    description: 'Condiciones de uso de Bukea para clientes y negocios.',
    canonicalPath: 'https://www.bukeard.com/terminos',
    bodyHtml: body,
  }));
});

// Enlace del negocio (2026-10-12): el perfil público vive en bukeard.com/<slug>,
// sin el prefijo /p/. Va al final del router para no tapar ninguna ruta real, y
// solo responde si el slug existe y no es un nombre reservado; si no, pasa al
// siguiente manejador (admin, la app, el 404). /p/<slug> redirige (301) para
// no romper enlaces ya compartidos.
// Ruta corta fija para dueños: bukeard.com/tunegocio lleva a la página de negocios.
router.get('/tunegocio', (req, res) => res.redirect(302, PORTAL_URL));
router.get('/p/:slug', (req, res) => res.redirect(301, `/${encodeURIComponent(req.params.slug)}`));
router.get('/:slug', profilePage);

module.exports = router;
