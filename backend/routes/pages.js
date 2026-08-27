const express = require('express');
const pool = require('../db/pool');
const { CAT_LABELS, CAT_ICONS, CITY_LABELS, CONTACT_EMAIL, FOUNDING_FREE_LIMIT, avatarGradient, initials, formatPrice, esc, pageShell } = require('../views/shared');
const { negocioShell } = require('../views/negocio');
const { directionLinks } = require('../lib/geocode');
const mailer = require('../lib/mailer');
const rateLimit = require('../lib/rate-limit');

const router = express.Router();

const CATEGORIES = Object.keys(CAT_LABELS);
const CITIES = Object.keys(CITY_LABELS);

function mktHeroHtml({ eyebrow, title, sub, ctaHtml }) {
  return `
  <div class="mkt-hero">
    <div class="hero-grain" aria-hidden="true"></div>
    <div class="mkt-hero-inner">
      ${eyebrow ? `<span class="badge-pill reveal" style="--i:0">${esc(eyebrow)}</span>` : ''}
      <h1 class="reveal" style="--i:1">${title}</h1>
      ${sub ? `<p class="reveal" style="--i:2">${esc(sub)}</p>` : ''}
      ${ctaHtml ? `<div class="mkt-hero-cta reveal" style="--i:3">${ctaHtml}</div>` : ''}
    </div>
  </div>`;
}

function proCardHtml(p, i) {
  return `
    <a class="pro-card reveal" style="--i:${Math.min(i, 9)}" href="/p/${esc(p.slug)}">
      <div class="pro-avatar" style="background:${avatarGradient(p.slug)}">${esc(initials(p.name))}</div>
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
  .hero {
    position: relative; padding: 4.5rem 28px 3rem; text-align: center; contain: layout paint; overflow: hidden;
    background:
      radial-gradient(60% 80% at 12% 8%, oklch(38% 0.06 195 / 0.55), transparent 60%),
      radial-gradient(55% 70% at 92% 0%, oklch(30% 0.05 78 / 0.4), transparent 62%),
      linear-gradient(160deg, oklch(26% 0.05 195), var(--teal-900) 70%);
    border-radius: 26px;
  }
  .hero-grain {
    position: absolute; inset: 0; z-index: 0; opacity: 0.25; mix-blend-mode: overlay; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .hero-inner { position: relative; z-index: 1; }
  .hero h1 { font-size: clamp(2.1rem, 5vw, 3.2rem); line-height: 1.08; letter-spacing: -0.02em; margin: 0 0 0.7rem; color: var(--white); }
  .hero h1 b { font-weight: inherit; color: var(--gold-600); }
  .hero p { color: rgba(255,255,255,0.78); font-size: 1.08rem; max-width: 46ch; margin: 0 auto 1.4rem; }
  .badge-row { display: flex; gap: 0.55rem; flex-wrap: wrap; justify-content: center; margin: 1.6rem 0 0; }
  .badge-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.22); font-size: 0.82rem; font-weight: 700; color: var(--white); }
  .badge-pill.wa { color: var(--whatsapp-light); }
  .badge-pill.wa .icon { color: var(--whatsapp-light); }
  .badge-pill.cash .icon { color: oklch(80% 0.1 78); }
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
    .hero {
      padding: 2.4rem 20px 1.8rem; border-radius: 0;
      margin: 0 -20px; width: auto;
    }
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
  .chip.active, .chip:hover { background: var(--teal-900); border-color: var(--teal-900); color: var(--white); transform: translateY(-1px); }
  .chip:active { transform: scale(0.96); transition-duration: 100ms; }
  /* Píldoras de categoría del hero, versión minimalista (2026-08-27): el
     borde translúcido se sentía "enmarcado" — se quita del todo y el
     relleno tenue solo se aclara al pasar el mouse, sin anillo alrededor. */
  .hero .chip { border-color: transparent; background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); padding: 0.4rem 0.75rem; min-height: 36px; font-size: 0.78rem; }
  .hero .chip .icon { width: 13px; height: 13px; }
  .hero .chip:hover { background: rgba(255,255,255,0.14); border-color: transparent; color: var(--white); }
  .hero .chip.active { background: var(--white); border-color: var(--white); color: var(--teal-900); }
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
  .stat-line { text-align: center; color: var(--soft); font-size: 0.85rem; margin-top: 1.3rem; }
  .pro-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin: 2.2rem 0; }
  .pro-card { display: flex; align-items: center; gap: 0.9rem; padding: 1rem; text-decoration: none; color: var(--ink); background: var(--card); border: 1px solid var(--line); border-radius: 16px; transition: transform 220ms var(--ease-out-quart), box-shadow 220ms var(--ease-out-quart), border-color 220ms var(--ease-out-quart); }
  .pro-card:hover { transform: translateY(-3px); box-shadow: var(--sh-2); border-color: var(--teal-500); }
  .pro-card:active { transform: scale(0.985); transition-duration: 100ms; }
  .pro-avatar { width: 48px; height: 48px; border-radius: 50%; flex: none; color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: "Fraunces", serif; transition: transform 260ms var(--ease-out-quart); }
  .pro-card:hover .pro-avatar { transform: scale(1.07); }
  .pro-info { flex: 1; min-width: 0; }
  .pro-name { font-weight: 700; font-size: 0.95rem; }
  .pro-meta { color: var(--soft); font-size: 0.8rem; margin-top: 0.15rem; }
  .pro-tags { color: var(--soft); font-size: 0.76rem; margin-top: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pro-rating { flex: none; font-weight: 700; font-size: 0.85rem; color: var(--gold-700); text-align: right; }
  .pro-rating span { display: block; font-weight: 500; color: var(--soft); font-size: 0.72rem; }
  .empty { text-align: center; color: var(--soft); padding: 3rem 1rem; }
  .biz-cta { position: relative; overflow: hidden; isolation: isolate; background: var(--teal-900); color: var(--white); border-radius: 24px; padding: 2.4rem; text-align: center; margin: 3.5rem 0; }
  .biz-cta::before { content: ""; position: absolute; z-index: -1; width: 20rem; height: 20rem; top: -8rem; right: -6rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.5; filter: blur(6px); }
  .biz-cta h2 { color: var(--white); margin: 0 0 0.5rem; font-size: 1.55rem; }
  .biz-cta p { color: rgba(255,255,255,0.82); max-width: 42ch; margin: 0 auto 1.3rem; }
</style>`;

router.get('/', async (req, res) => {
  const base = req.baseUrlPrefix;
  const q = String(req.query.q || '').trim();
  const categoria = CATEGORIES.includes(req.query.categoria) ? req.query.categoria : null;
  const ciudad = CITIES.includes(req.query.ciudad) ? req.query.ciudad : 'santo-domingo';

  let sql = 'SELECT * FROM professionals WHERE hidden_at IS NULL';
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
  sql += ' ORDER BY rating DESC, reviews_count DESC LIMIT 60';

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

  const baseParams = () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (ciudad !== 'santo-domingo') p.set('ciudad', ciudad);
    return p;
  };

  const chips = CATEGORIES.map(key => {
    const active = categoria === key ? ' active' : '';
    const p = baseParams();
    p.set('categoria', key);
    // "Entrenador Personal" fuerza un salto de línea antes: sin esto queda
    // sola al final de la primera fila en vez de bajar prolija a la segunda.
    const rowBreak = key === 'entrenador' ? '<span class="chip-break" aria-hidden="true"></span>' : '';
    return `${rowBreak}<a class="chip${active}" href="/?${p.toString()}"><svg class="icon"><use href="#${CAT_ICONS[key]}"/></svg>${esc(CAT_LABELS[key])}</a>`;
  }).join('');
  const allChipQs = baseParams().toString();
  const allChip = `<a class="chip${!categoria ? ' active' : ''}" href="/${allChipQs ? '?' + allChipQs : ''}">Todos</a>`;

  const grid = professionals.length
    ? professionals.map(proCardHtml).join('')
    : ciudad !== 'santo-domingo'
      ? `<p class="empty">Todavía no tenemos profesionales en ${esc(CITY_LABELS[ciudad])}, <a href="/negocios" style="color:var(--teal-700);font-weight:700">sé el primero en unirte</a>.</p>`
      : '<p class="empty">No encontramos profesionales con esa búsqueda todavía. Vuelve pronto, seguimos sumando negocios.</p>';

  const body = `
${HOME_STYLE}
<div class="wrap">
  <div class="hero">
    <div class="hero-grain" aria-hidden="true"></div>
    <div class="hero-inner">
    <h1 class="reveal" style="--i:0">Bukea tu cita<br>en menos de <b>60 segundos</b></h1>
    <p class="reveal" style="--i:1">Barbería, uñas, salón, cejas y maquillaje, reserva en segundos, paga en efectivo o transferencia, sin comisión.</p>
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
    <div class="chips reveal" style="--i:4">${allChip}${chips}</div>
    </div>
  </div>

  <div class="pro-grid">${grid}</div>

  <div class="biz-cta reveal">
    <h2>¿Tienes un negocio con citas?</h2>
    <p>Agenda, clientela y "Mi Cuadre" en un solo lugar, y por ahora, 100% gratis. Cero comisión, cero suscripción.</p>
    <a class="btn btn-primary" href="/negocios">Únete a Bukea</a>
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

  let sql = 'SELECT slug, name, business_name, neighborhood, category, rating, reviews_count, lat, lng FROM professionals WHERE hidden_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL';
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
        '<br><a class="btn btn-primary" href="' + BASE + '/?pro=' + encodeURIComponent(p.slug) + '">Bukear cita</a>' +
        ' <a href="/p/' + encodeURIComponent(p.slug) + '">Ver perfil</a>';
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
  .profile-hero { display: flex; gap: 1.4rem; align-items: center; padding: 2rem 0 1.4rem; flex-wrap: wrap; }
  .profile-avatar { width: 84px; height: 84px; border-radius: 50%; color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; font-family: "Fraunces", serif; flex: none; box-shadow: var(--sh-2); }
  .profile-hero h1 { margin: 0 0 0.3rem; font-size: 1.7rem; }
  .profile-meta { color: var(--soft); font-size: 0.95rem; }
  .profile-badges { display: flex; gap: 0.5rem; margin-top: 0.6rem; flex-wrap: wrap; }
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
</style>`;

router.get('/p/:slug', async (req, res) => {
  const base = req.baseUrlPrefix;
  const [rows] = await pool.query('SELECT * FROM professionals WHERE slug = ?', [req.params.slug]);
  const p = rows[0];
  if (!p) {
    return res.status(404).type('html').send(pageShell({
      base,
      title: 'Profesional no encontrado. Bukea',
      description: 'No encontramos ese profesional en Bukea.',
      canonicalPath: `https://www.bukeard.com/p/${esc(req.params.slug)}`,
      bodyHtml: '<div class="wrap"><p class="empty">No encontramos ese profesional. <a href="/">Volver al inicio</a>.</p></div>',
    }));
  }

  const [services] = await pool.query(
    'SELECT name, duration_min, price_cents FROM services WHERE professional_id = ? ORDER BY id',
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

  const svcHtml = services.map(s => `
    <div class="svc-row">
      <div>
        <div class="svc-name">${esc(s.name)}</div>
        <div class="svc-dur">${s.duration_min} min</div>
      </div>
      <div class="svc-price">${formatPrice(s.price_cents)}</div>
    </div>`).join('') || '<p class="empty">Todavía no hay servicios cargados.</p>';

  const badges = [
    p.accepts_whatsapp ? '<span class="badge">Responde por WhatsApp</span>' : '',
    p.accepts_cash ? '<span class="badge">Acepta efectivo</span>' : '',
  ].join('');

  const lat = p.lat !== null ? Number(p.lat) : null;
  const lng = p.lng !== null ? Number(p.lng) : null;
  const links = directionLinks(p.name, p.neighborhood, lat, lng);

  const body = `
${PROFILE_STYLE}
<div class="wrap">
  <div class="profile-hero reveal in" style="--i:0">
    <div class="profile-avatar" style="background:${avatarGradient(p.slug)}">${esc(initials(p.name))}</div>
    <div>
      <h1>${esc(p.name)}</h1>
      <div class="profile-meta">${esc(p.business_name)} · ${esc(p.neighborhood)} · ${CAT_LABELS[p.category] || esc(p.category)}
        ${p.reviews_count > 0 ? ` · ★ ${Number(p.rating).toFixed(1)} (${p.reviews_count} reseñas)` : ' · Nuevo en Bukea'}
      </div>
      <div class="profile-badges">${badges}</div>
    </div>
  </div>

  <h2 class="reveal" style="--i:1">Servicios</h2>
  <div class="svc-list card reveal" style="--i:1;padding:0.4rem 1.2rem">${svcHtml}</div>

  ${bankAccounts.length ? `
  <h2 class="reveal" style="--i:2">Cuentas para transferir</h2>
  <div class="svc-list card reveal" style="--i:2;padding:0.4rem 1.2rem">
    ${bankAccounts.map(b => `
    <div class="svc-row">
      <div>
        <div class="svc-name">${esc(b.bank_name)} · ${esc(b.account_type)}${b.verified_at ? ' <span class="badge" style="vertical-align:middle">✓ Verificada</span>' : ''}</div>
        <div class="svc-dur">${esc(b.account_holder)} · Cédula/RNC ${esc(b.cedula_rnc)}</div>
      </div>
      <div class="svc-price">${esc(b.account_number)}</div>
    </div>`).join('')}
  </div>` : ''}

  ${collaboratorRows.length ? `
  <h2 class="reveal" style="--i:3">Equipo</h2>
  <div class="team-grid reveal" style="--i:3">
    <div class="team-member">
      <div class="team-avatar" style="background:${avatarGradient(p.slug)}">${esc(initials(p.name))}</div>
      <div class="team-name">${esc(p.name.split(' ')[0])}</div>
      <div class="team-role">Titular</div>
    </div>
    ${collaboratorRows.map(c => `
    <div class="team-member">
      <div class="team-avatar" style="background:${avatarGradient(c.name)}">${esc(initials(c.name))}</div>
      <div class="team-name">${esc(c.name.split(' ')[0])}</div>
      <div class="team-role">${esc(c.role || '')}</div>
    </div>`).join('')}
  </div>` : ''}

  <h2 class="reveal" style="--i:4">Cómo llegar</h2>
  <div class="svc-list card reveal" style="--i:4;padding:0.9rem 1.2rem;display:flex;gap:0.6rem;flex-wrap:wrap">
    <a class="btn btn-ghost" href="${links.google}" target="_blank" rel="noopener">Google Maps</a>
    <a class="btn btn-ghost" href="${links.apple}" target="_blank" rel="noopener">Apple Maps</a>
    <a class="btn btn-ghost" href="${links.waze}" target="_blank" rel="noopener">Waze</a>
  </div>

  <div class="cta-row">
    <a class="btn btn-primary" href="${base}/?pro=${encodeURIComponent(p.slug)}">Bukear cita con ${esc(p.name.split(' ')[0])}</a>
  </div>
</div>`;

  res.type('html').send(await pageShell({
    base,
    title: `${p.name}, ${p.business_name} | Bukea`,
    description: `Reserva con ${p.name} en ${p.business_name}, ${p.neighborhood}. ${services.map(s => s.name).join(', ')}.`,
    canonicalPath: `https://www.bukeard.com/p/${esc(p.slug)}`,
    bodyHtml: body,
  }));
});

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
    position: relative; padding: 3.4rem 2.6rem; text-align: center; overflow: hidden; contain: layout paint;
    background:
      radial-gradient(60% 80% at 12% 8%, oklch(38% 0.06 195 / 0.55), transparent 60%),
      radial-gradient(55% 70% at 92% 0%, oklch(30% 0.05 78 / 0.4), transparent 62%),
      linear-gradient(160deg, oklch(26% 0.05 195), var(--teal-900) 70%);
    border-radius: 26px; margin: 2rem 0 0;
  }
  .mkt-hero .hero-grain {
    position: absolute; inset: 0; z-index: 0; opacity: 0.25; mix-blend-mode: overlay; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .mkt-hero-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
  .mkt-hero .badge-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.22); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.02em; color: oklch(80% 0.1 78); margin: 0 0 1.1rem; }
  .mkt-hero h1 { font-size: clamp(2.1rem, 5vw, 3rem); line-height: 1.08; letter-spacing: -0.02em; margin: 0 0 0.7rem; color: var(--white); }
  .mkt-hero p { color: rgba(255,255,255,0.78); font-size: 1.05rem; max-width: 46ch; margin: 0 auto; }
  .mkt-hero .mkt-hero-cta { margin-top: 1.5rem; }
  @media (max-width: 560px) { .mkt-hero { padding: 2.6rem 20px; border-radius: 0; margin: 0 -20px; width: auto; } }

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
  .m-feature.-dark { background: var(--teal-900); border-color: var(--teal-900); color: var(--white); position: relative; overflow: hidden; isolation: isolate; }
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

  .m-section-head { text-align: center; margin: 0 0 1.6rem; }
  .m-section-head h2 { font-size: clamp(1.5rem, 3vw, 1.9rem); color: var(--teal-900); margin: 0 0 0.4rem; }
  .m-section-head p { color: var(--soft); font-size: 0.95rem; max-width: 46ch; margin: 0 auto; }

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
  .m-cats .chip:hover { background: var(--teal-900); border-color: var(--teal-900); color: var(--white); }

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
  .biz-cta { position: relative; overflow: hidden; isolation: isolate; background: var(--teal-900); color: var(--white); border-radius: 24px; padding: 2.4rem; text-align: center; margin: 3.5rem 0; }
  .biz-cta::before { content: ""; position: absolute; z-index: -1; width: 20rem; height: 20rem; top: -8rem; right: -6rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.5; filter: blur(6px); }
  .biz-cta h2 { color: var(--white); margin: 0 0 0.5rem; font-size: 1.55rem; }
  .biz-cta p { color: rgba(255,255,255,0.82); max-width: 42ch; margin: 0 auto 1.3rem; }
</style>`;

// Panel de negocio de escritorio ("Mi cuenta") — pantalla completa, con su
// propio shell de app (sidebar + calendario), separado de pageShell() porque
// no lleva la cabecera/pie del marketplace público. Ver views/negocio.js.
router.get('/negocio', (req, res) => {
  res.type('html').send(negocioShell({
    base: req.baseUrlPrefix,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    appleClientId: process.env.APPLE_CLIENT_ID || '',
  }));
});

router.get('/negocios', async (req, res) => {
  const base = req.baseUrlPrefix;

  const steps = [
    { n: '1', h: 'Crea tu perfil', p: 'Tu nombre, tu negocio, tu categoría y tu sector. Menos de un minuto, sin tarjeta de crédito.' },
    { n: '2', h: 'Comparte tu enlace', p: 'Tu perfil de Bukea, listo para pegar en tu bio de Instagram o en tu estado de WhatsApp.' },
    { n: '3', h: 'Recibe reservas', p: 'Tus clientes ven tu horario real y reservan solos. Tú confirmas y cobras como prefieras.' },
  ].map((s, i) => `
    <li class="card m-step reveal" style="--i:${i}">
      <span class="num">${s.n}</span>
      <h3>${s.h}</h3>
      <p>${s.p}</p>
    </li>`).join('');

  const categoryChips = CATEGORIES.map((key, i) =>
    `<a class="chip reveal" style="--i:${i}" href="/?categoria=${key}"><svg class="icon"><use href="#${CAT_ICONS[key]}"/></svg>${esc(CAT_LABELS[key])}</a>`
  ).join('');

  const faq = [
    { q: '¿Bukea de verdad es gratis?', a: 'Sí. No hay suscripción ni comisión por cada cliente nuevo. Cuando llegue el momento de cobrar, los negocios que se unieron primero mantienen las condiciones con las que empezaron.' },
    { q: '¿Necesito tarjeta de crédito para registrarme?', a: 'No. Creas tu cuenta con tu número de teléfono y un PIN, en menos de un minuto.' },
    { q: '¿Mis clientes tienen que bajar una app?', a: 'No. Reservan desde tu enlace de Bukea en el navegador, sin instalar nada. Tú sí puedes usar la app o el panel de escritorio para gestionar tu negocio.' },
    { q: '¿Cómo me pagan mis clientes?', a: 'Como tú prefieras: efectivo, transferencia (con tus cuentas bancarias visibles en tu perfil) o tPago. Tarjeta llega más adelante.' },
    { q: '¿Puedo tener más de una persona atendiendo citas?', a: 'Sí. Puedes agregar a tu equipo. Cada quien aparece como opción al reservar, y tú ves quién atiende cada cita.' },
  ].map(f => `<details class="card"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');

  const body = `
${MARKETING_STYLE}
<div class="wrap">
  ${mktHeroHtml({
    eyebrow: 'Para negocios de belleza',
    title: 'Tu agenda y tu clientela, sin pagar comisión',
    sub: 'Bukea es la app de reservas hecha para el negocio de belleza dominicano: WhatsApp, pagos a la dominicana y agenda real, de raíz.',
    ctaHtml: '<a class="btn btn-primary" href="/negocio">Únete a Bukea, es gratis</a>',
  })}

  <div class="m-highlights reveal">
    <div><b>0%</b><span>comisión por cliente</span></div>
    <div><b>2 min</b><span>para crear tu perfil</span></div>
    <div><b>WhatsApp</b><span>confirmaciones nativas</span></div>
  </div>

  <div class="m-bento">
    <div class="card m-feature -lg reveal" style="--i:0">
      <div class="icon-badge"><svg class="icon"><use href="#i-calendar"/></svg></div>
      <h3>Agenda real</h3>
      <p>Tus clientes ven tu horario de verdad y reservan sin llamarte. Tú confirmas, cancelas y llevas el control desde tu celular o tu computadora.</p>
    </div>
    <div class="card m-feature reveal" style="--i:1">
      <div class="icon-badge"><svg class="icon"><use href="#i-chart"/></svg></div>
      <h3>Mi Cuadre</h3>
      <p>Cuánto vendiste hoy, en los últimos 7 días y en el mes, sin hoja de cálculo, sin cuaderno.</p>
    </div>
    <div class="card m-feature reveal" style="--i:2">
      <div class="icon-badge"><svg class="icon"><use href="#i-cash"/></svg></div>
      <h3>A la dominicana</h3>
      <p>Efectivo, transferencia y tPago desde el primer día. Tarjeta cuando la necesites.</p>
    </div>
    <div class="card m-feature -lg reveal" style="--i:3">
      <div class="icon-badge"><svg class="icon"><use href="#i-whatsapp"/></svg></div>
      <h3>WhatsApp nativo</h3>
      <p>Confirmaciones y recordatorios donde ya está tu clientela, no una notificación push que nadie abre.</p>
    </div>
    <div class="card m-feature reveal" style="--i:4">
      <div class="icon-badge"><svg class="icon"><use href="#i-users"/></svg></div>
      <h3>Tu equipo también reserva</h3>
      <p>Agrega a las personas que atienden contigo. Cada cliente elige con quién quiere su cita.</p>
    </div>
    <div class="card m-feature -lg -dark reveal" style="--i:5">
      <div class="icon-badge"><svg class="icon"><use href="#i-percent"/></svg></div>
      <h3>Cero comisión</h3>
      <p>Nunca te cobramos por cliente nuevo. Lo que vendes es tuyo.</p>
    </div>
  </div>

  <div class="m-section-head reveal">
    <h2>Cómo funciona</h2>
    <p>De cero a tu primera reserva, sin fricción.</p>
  </div>
  <ol class="m-steps">${steps}</ol>

  <div class="m-section-head reveal">
    <h2>¿Para quién es Bukea?</h2>
    <p>Barbería, uñas, salón, maquillaje, cejas y pilates, cada quien con su propio perfil.</p>
  </div>
  <div class="m-cats">${categoryChips}</div>

  <div class="m-section-head reveal">
    <h2>Preguntas frecuentes</h2>
  </div>
  <div class="m-faq">${faq}</div>

  <div class="biz-cta reveal">
    <h2>Móntate hoy, sin tarjeta</h2>
    <p>Crea tu perfil en menos de 2 minutos y comparte tu enlace por WhatsApp.</p>
    <a class="btn btn-primary" href="/negocio">Crear mi cuenta de negocio</a>
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Bukea para negocios. Agenda, WhatsApp y cero comisión',
    description: 'Bukea es gratis para negocios de belleza en República Dominicana: agenda real, Mi Cuadre, WhatsApp nativo y pagos a la dominicana.',
    canonicalPath: 'https://www.bukeard.com/negocios',
    bodyHtml: body,
  }));
});

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
  .m-story-card { background: var(--teal-900); color: var(--white); border-radius: 22px; padding: 2rem; position: relative; overflow: hidden; isolation: isolate; }
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
    <a class="btn btn-primary" href="/negocio">Crear mi cuenta de negocio</a>
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

router.get('/precios', async (req, res) => {
  const base = req.baseUrlPrefix;
  const basicPerks = [
    'Perfil público con tus servicios y horario',
    'Agenda con disponibilidad real',
    'Reservas ilimitadas, sin comisión',
    '"Mi Cuadre", cuánto vendiste hoy, en la semana y en el mes',
    'Recordatorio por WhatsApp para tus clientes',
    'Hasta 2 personas en tu equipo',
  ].map(t => `<li><svg class="icon"><use href="#i-check"/></svg>${t}</li>`).join('');

  const plusPerks = [
    'Todo lo del plan Básico',
    'WhatsApp ilimitado, sin tope de mensajes',
    'Reportes e insights avanzados de "Mi Cuadre"',
    'Soporte prioritario',
    'Equipo sin límite de personas',
  ].map((t, i) => `<li class="${i === 0 ? 'price-list-lead' : ''}"><svg class="icon"><use href="#i-check"/></svg>${t}</li>`).join('');

  const [[{ foundingCount }]] = await pool.query('SELECT COUNT(*) AS foundingCount FROM professionals WHERE founding_free = 1');
  const spotsLeft = Math.max(0, FOUNDING_FREE_LIMIT - foundingCount);
  const pct = Math.min(100, Math.round((foundingCount / FOUNDING_FREE_LIMIT) * 100));
  const soldOut = spotsLeft === 0;

  // Precio de Plus (decisión de Víctor, 2026-08-27): Plus SIEMPRE es de
  // pago, no hay excepción para fundadores. El plan Básico es gratis hoy
  // para cualquier negocio; lo que ganan los primeros FOUNDING_FREE_LIMIT
  // es que esa gratuidad queda asegurada de por vida para ellos, pase lo
  // que pase con los precios del plan Básico más adelante.
  const PLUS_PRICE = 500;

  const founderNote = soldOut
    ? `Los ${FOUNDING_FREE_LIMIT} cupos fundadores ya están completos. El plan Básico sigue gratis por ahora para negocios nuevos, pero esos ${FOUNDING_FREE_LIMIT} son los únicos con esa gratuidad asegurada de por vida sin importar qué pase después.`
    : `Quedan ${spotsLeft} cupo${spotsLeft === 1 ? '' : 's'} de los ${FOUNDING_FREE_LIMIT} fundadores. Los negocios que se unan dentro de ese cupo aseguran el plan Básico gratis de por vida, sin importar cómo cambien los precios más adelante.`;

  const body = `
${MARKETING_STYLE}
<style>
  .founder-meter { max-width: 700px; margin: 2.5rem auto 0; padding: 2.4rem 3rem; text-align: center; }
  .founder-meter-head { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; margin-bottom: 1.1rem; }
  .founder-meter-head strong { font-family: "Fraunces", serif; font-size: 2.2rem; color: var(--ink); }
  .founder-meter-head span { font-size: 0.85rem; color: var(--soft); font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
  .founder-bar { max-width: 420px; margin: 0 auto; height: 10px; border-radius: 999px; background: var(--line); overflow: hidden; }
  .founder-bar-fill { height: 100%; border-radius: 999px; background: var(--teal-600); transition: width 400ms var(--ease-out-quart); }
  .founder-meter p { max-width: 46ch; margin: 1.1rem auto 0; color: var(--soft); font-size: 0.92rem; }
</style>
<div class="wrap">
  ${mktHeroHtml({
    eyebrow: 'Precios',
    title: 'Bukea es gratis',
    sub: `Sin suscripción, sin comisión por cliente nuevo, sin tarjeta para empezar. Y los primeros ${FOUNDING_FREE_LIMIT} negocios que se unan aseguran el plan Básico gratis de por vida.`,
  })}

  <div class="card founder-meter reveal" style="--i:2">
    <div class="founder-meter-head">
      <strong>${foundingCount} de ${FOUNDING_FREE_LIMIT}</strong>
      <span>${soldOut ? 'Cupos fundadores completos' : 'Cupos fundadores ocupados'}</span>
    </div>
    <div class="founder-bar"><div class="founder-bar-fill" style="width:${pct}%"></div></div>
    <p>${founderNote}</p>
  </div>

  <div class="biz-cta reveal" style="--i:2.5;max-width:700px;margin:1.6rem auto 2.5rem">
    <h2>Únete ahora mismo</h2>
    <p>Cada día que pasa, un cupo fundador se acerca más a llenarse. Crea tu perfil gratis y asegura tu lugar.</p>
    <a class="btn btn-primary" href="/negocio">Crear mi cuenta de negocio</a>
  </div>

  <div class="price-cards">
    <div class="card price-card reveal" style="--i:3">
      ${!soldOut ? '<span class="plan-badge">Gratis para los primeros 50</span>' : ''}
      <div>Básico</div>
      <div class="amount">RD$0<small>/mes</small></div>
      <ul class="price-list">${basicPerks}</ul>
      <a class="btn btn-primary" href="/negocio">Únete gratis</a>
    </div>

    <div class="card price-card -plus reveal" style="--i:4">
      <div>Plus</div>
      <div class="amount">RD$${PLUS_PRICE}<small>/mes</small></div>
      <ul class="price-list">${plusPerks}</ul>
      <a class="btn btn-primary" href="/contacto">Escríbenos</a>
    </div>
  </div>

  <p class="reveal" style="--i:5;text-align:center;color:var(--soft);font-size:0.9rem;max-width:62ch;margin:0.8rem auto 2.5rem;line-height:1.6">
    El plan Básico es gratis hoy para cualquier negocio. Si te unes dentro del cupo fundador, esa gratuidad queda asegurada de por vida para ti, pase lo que pase con los precios más adelante. Plus es un upgrade de pago opcional, disponible para cualquier negocio.
  </p>

  <div class="m-hero reveal" style="padding-top:0">
    <h1 style="font-size:1.6rem">Para el cliente, siempre gratis</h1>
    <p>Explora, reserva y gestiona tus citas sin costo, hoy y siempre.</p>
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Precios de Bukea. Gratis para negocios y clientes',
    description: `Bukea es 100% gratis para negocios y clientes. Los primeros ${FOUNDING_FREE_LIMIT} negocios quedan gratis de por vida.`,
    canonicalPath: 'https://www.bukeard.com/precios',
    bodyHtml: body,
  }));
});

// TODO(publicación app stores): Bukea todavía no está publicada en App Store
// ni Google Play (ver docs/PLAN.md, Fase 0) — por eso los badges de abajo no
// llevan a ningún lado (decorativos, "Próximamente") y el hero explica que
// hoy Bukea es una app web. Cuando se publique en ambas tiendas:
//   1. Envolver cada <img> de dl-badges en un <a href="{link real de la ficha}">.
//   2. Cambiar el alt de "Próximamente en ..." a "Descárgala en ...".
//   3. Quitar el <p class="dl-soon"> de cada tarjeta.
//   4. Cambiar el <h1>/<p> del hero por:
//      <h1>Descarga la app de Bukea</h1>
//      <p>Reserva tu próxima cita o gestiona tu negocio de belleza desde el
//      celular. Disponible para iOS y Android.</p>
router.get('/descargar', async (req, res) => {
  const base = req.baseUrlPrefix;
  const clientUrl = `https://www.bukeard.com${base}/`;
  const businessUrl = `https://www.bukeard.com${base}/?join=1`;
  const qr = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=296x296&margin=0&data=${encodeURIComponent(url)}`;
  const appleBadge = `
      <div class="dl-badges">
        <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/es-mx?size=250x83" alt="Próximamente en App Store" height="42">
      </div>
      <p class="dl-soon">Muy pronto en la App Store. Por ahora, escanea el código o usa el botón:</p>`;
  const googleBadge = `
      <div class="dl-badges">
        <img src="https://play.google.com/intl/es/badges/static/images/badges/es_badge_web_generic.png" alt="Próximamente en Google Play" height="42">
      </div>
      <p class="dl-soon">Muy pronto en Google Play. Por ahora, escanea el código o usa el botón:</p>`;

  const body = `
${MARKETING_STYLE}
${DOWNLOAD_STYLE}
<div class="wrap">
  <div class="m-hero">
    <div class="atmosphere" aria-hidden="true"><span></span><span></span></div>
    <h1 class="reveal" style="--i:0">Descarga Bukea</h1>
    <p class="reveal" style="--i:1">Bukea es una app web. Escanea el código con tu celular o toca el botón, ábrela en tu navegador y agrégala a tu pantalla de inicio como una app de verdad.</p>
  </div>

  <div class="dl-grid">
    <div class="card dl-card reveal" style="--i:2">
      ${appleBadge}
      <img class="dl-qr" src="${qr(clientUrl)}" alt="Código QR para abrir Bukea" width="148" height="148" loading="lazy">
      <h3>Para reservar tu cita</h3>
      <p>Explora negocios, reserva y gestiona tus citas desde tu celular.</p>
      <a class="btn btn-primary" href="${base}/">Abrir Bukea</a>
    </div>
    <div class="card dl-card reveal" style="--i:3">
      ${googleBadge}
      <img class="dl-qr" src="${qr(businessUrl)}" alt="Código QR para unirte a Bukea como negocio" width="148" height="148" loading="lazy">
      <h3>Para tu negocio</h3>
      <p>Crea tu perfil, arma tu agenda y recibe reservas, gratis.</p>
      <a class="btn btn-primary" href="${base}/?join=1">Unirme a Bukea</a>
    </div>
  </div>

  <p class="reveal" style="--i:4;text-align:center;color:var(--soft);font-size:0.85rem;max-width:52ch;margin:0 auto 2.5rem">
    ¿Primera vez? Escanea, abre Bukea en tu navegador y guárdala en tu pantalla de inicio: un toque y la tienes como una app más, sin ocupar espacio de tienda.
  </p>
</div>`;

  res.type('html').send(await pageShell({
    base,
    title: 'Descarga Bukea. Reserva o gestiona tu negocio',
    description: 'Descarga Bukea escaneando el código QR o abriéndola desde tu navegador. Reserva tu cita o gestiona tu negocio de belleza, gratis.',
    canonicalPath: 'https://www.bukeard.com/descargar',
    bodyHtml: body,
  }));
});

const DOWNLOAD_STYLE = `
<style>
  .dl-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.4rem; margin: 2.6rem 0 3.5rem; }
  .dl-card { padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .dl-card h3 { margin: 0.3rem 0 0; font-size: 1.15rem; color: var(--teal-900); }
  .dl-card p { margin: 0 0 0.8rem; color: var(--soft); font-size: 0.88rem; line-height: 1.5; }
  .dl-qr { width: 148px; height: 148px; border-radius: 14px; border: 1px solid var(--line); padding: 8px; background: var(--white); }
  .dl-card .btn { margin-top: 0.4rem; }
  .dl-badges { display: flex; gap: 0.6rem; justify-content: center; align-items: center; opacity: 0.55; filter: grayscale(0.3); }
  .dl-badges img { height: 42px; width: auto; }
  .dl-soon { margin: 0.5rem 0 1rem; color: var(--soft); font-size: 0.78rem; }
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
  <div class="m-hero">
    <div class="atmosphere" aria-hidden="true"><span></span><span></span></div>
    <h1 class="reveal" style="--i:0">El blog de Bukea</h1>
    <p class="reveal" style="--i:1">Estamos preparando historias de profesionales, consejos de belleza y novedades de la app. Muy pronto por aquí.</p>
    <a class="btn btn-primary reveal" style="--i:2" href="/">Volver al inicio</a>
  </div>
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
        <p><a class="email-link" href="/negocios">Conoce cómo unirte a Bukea →</a></p>
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
  <div class="m-hero" style="padding-bottom:0.5rem">
    <h1>Política de privacidad</h1>
  </div>
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
  <div class="m-hero" style="padding-bottom:0.5rem">
    <h1>Términos de servicio</h1>
  </div>
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

module.exports = router;
