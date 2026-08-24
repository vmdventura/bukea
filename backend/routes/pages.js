const express = require('express');
const pool = require('../db/pool');
const { CAT_LABELS, CAT_ICONS, CITY_LABELS, CONTACT_EMAIL, avatarGradient, initials, formatPrice, esc, pageShell } = require('../views/shared');
const { negocioShell } = require('../views/negocio');
const { directionLinks } = require('../lib/geocode');

const router = express.Router();

const CATEGORIES = Object.keys(CAT_LABELS);
const CITIES = Object.keys(CITY_LABELS);

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
    position: relative; padding: 4.5rem 0 3rem; text-align: center; contain: layout paint; overflow: hidden;
    background:
      radial-gradient(60% 80% at 12% 8%, oklch(70% 0.1 195 / 0.5), transparent 60%),
      radial-gradient(55% 70% at 92% 0%, oklch(84% 0.09 78 / 0.6), transparent 62%),
      radial-gradient(90% 90% at 50% 120%, oklch(93% 0.03 195 / 0.9), transparent 70%),
      linear-gradient(160deg, oklch(96% 0.014 195), oklch(97% 0.014 90) 70%);
    border-radius: 26px;
  }
  .hero-grain {
    position: absolute; inset: 0; z-index: 0; opacity: 0.5; mix-blend-mode: multiply; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .hero-inner { position: relative; z-index: 1; }
  .hero h1 { font-size: clamp(2.1rem, 5vw, 3.2rem); line-height: 1.08; letter-spacing: -0.02em; margin: 0 0 0.7rem; color: var(--teal-900); }
  .hero h1 b { color: var(--teal-600); font-weight: inherit; }
  .hero p { color: var(--soft); font-size: 1.08rem; max-width: 46ch; margin: 0 auto 1.4rem; }
  .badge-row { display: flex; gap: 0.55rem; flex-wrap: wrap; justify-content: center; margin: 1.6rem 0 0; }
  .badge-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; border-radius: 999px; background: var(--card); border: 1px solid var(--line); font-size: 0.82rem; font-weight: 700; color: var(--ink); box-shadow: var(--sh-2); }
  .badge-pill.wa { color: #128c50; }
  .badge-pill.wa .icon { color: var(--whatsapp); }
  .badge-pill.cash .icon { color: var(--cash); }
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
    .hero { padding: 2.2rem 0 1.6rem; border-radius: 20px; }
    .hero h1 { font-size: clamp(1.65rem, 8vw, 3.2rem); }
    .hero p { font-size: 0.98rem; }
    .search-bar { flex-direction: column; align-items: stretch; border-radius: 22px; padding: 0.6rem; gap: 0.1rem; }
    .search-bar .search-field--city { flex: none; }
    .search-divider { width: auto; height: 1px; align-self: stretch; margin: 0.1rem 0.6rem; }
    .search-bar .btn { width: 100%; justify-content: center; margin-top: 0.4rem; }
  }
  .chips { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; margin: 1.6rem 0 0; }
  .chip { display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.5rem 1rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); color: var(--soft); font-size: 0.85rem; font-weight: 700; transition: background 180ms var(--ease-out-quart), border-color 180ms var(--ease-out-quart), color 180ms var(--ease-out-quart), transform 180ms var(--ease-out-quart); }
  .chip .icon { width: 15px; height: 15px; }
  @media (max-width: 560px) {
    .badge-row, .chips { flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start; padding: 0 20px 0.3rem; margin-left: -20px; margin-right: -20px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
    .badge-row::-webkit-scrollbar, .chips::-webkit-scrollbar { display: none; }
    .badge-row .badge-pill, .chips .chip { flex: none; }
  }
  .chip.active, .chip:hover { background: var(--teal-600); border-color: var(--teal-600); color: #fff; transform: translateY(-1px); }
  .stat-line { text-align: center; color: var(--soft); font-size: 0.85rem; margin-top: 1.3rem; }
  .pro-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin: 2.2rem 0; }
  .pro-card { display: flex; align-items: center; gap: 0.9rem; padding: 1rem; text-decoration: none; color: var(--ink); background: var(--card); border: 1px solid var(--line); border-radius: 16px; transition: transform 220ms var(--ease-out-quart), box-shadow 220ms var(--ease-out-quart), border-color 220ms var(--ease-out-quart); }
  .pro-card:hover { transform: translateY(-3px); box-shadow: var(--sh-2); border-color: var(--teal-500); }
  .pro-avatar { width: 48px; height: 48px; border-radius: 50%; flex: none; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: "Fraunces", serif; transition: transform 260ms var(--ease-out-quart); }
  .pro-card:hover .pro-avatar { transform: scale(1.07); }
  .pro-info { flex: 1; min-width: 0; }
  .pro-name { font-weight: 700; font-size: 0.95rem; }
  .pro-meta { color: var(--soft); font-size: 0.8rem; margin-top: 0.15rem; }
  .pro-tags { color: var(--soft); font-size: 0.76rem; margin-top: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pro-rating { flex: none; font-weight: 700; font-size: 0.85rem; color: var(--gold-700); text-align: right; }
  .pro-rating span { display: block; font-weight: 500; color: var(--soft); font-size: 0.72rem; }
  .empty { text-align: center; color: var(--soft); padding: 3rem 1rem; }
  .biz-cta { position: relative; overflow: hidden; isolation: isolate; background: var(--teal-900); color: #fff; border-radius: 24px; padding: 2.4rem; text-align: center; margin: 3.5rem 0; }
  .biz-cta::before { content: ""; position: absolute; z-index: -1; width: 20rem; height: 20rem; top: -8rem; right: -6rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.5; filter: blur(6px); }
  .biz-cta h2 { color: #fff; margin: 0 0 0.5rem; font-size: 1.55rem; }
  .biz-cta p { color: rgba(255,255,255,0.82); max-width: 42ch; margin: 0 auto 1.3rem; }
</style>`;

router.get('/', async (req, res) => {
  const base = req.baseUrlPrefix;
  const q = String(req.query.q || '').trim();
  const categoria = CATEGORIES.includes(req.query.categoria) ? req.query.categoria : null;
  const ciudad = CITIES.includes(req.query.ciudad) ? req.query.ciudad : 'santo-domingo';

  let sql = 'SELECT * FROM professionals WHERE 1=1';
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
    return `<a class="chip${active}" href="/?${p.toString()}"><svg class="icon"><use href="#${CAT_ICONS[key]}"/></svg>${esc(CAT_LABELS[key])}</a>`;
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

  res.type('html').send(pageShell({
    base,
    title: 'Bukea. Reserva tu cita de belleza en República Dominicana',
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

  let sql = 'SELECT slug, name, business_name, neighborhood, category, rating, reviews_count, lat, lng FROM professionals WHERE lat IS NOT NULL AND lng IS NOT NULL';
  const params = [];
  if (categoria) { sql += ' AND category = ?'; params.push(categoria); }

  const [professionals] = await pool.query(sql, params);
  const [[{ withoutPin }]] = await pool.query(
    'SELECT COUNT(*) AS withoutPin FROM professionals WHERE lat IS NULL OR lng IS NULL' + (categoria ? ' AND category = ?' : ''),
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

  res.type('html').send(pageShell({
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
  .profile-avatar { width: 84px; height: 84px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; font-family: "Fraunces", serif; flex: none; box-shadow: var(--sh-2); }
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
  .team-avatar { width: 56px; height: 56px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: "Fraunces", serif; margin-bottom: 0.4rem; transition: transform 220ms var(--ease-out-quart); }
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
    'SELECT bank_name, account_type, account_number, account_holder, cedula_rnc FROM professional_bank_accounts WHERE professional_id = ?',
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
        <div class="svc-name">${esc(b.bank_name)} · ${esc(b.account_type)}</div>
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

  res.type('html').send(pageShell({
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
  .m-feature.-dark { background: var(--teal-900); border-color: var(--teal-900); color: #fff; position: relative; overflow: hidden; isolation: isolate; }
  .m-feature.-dark::before { content: ""; position: absolute; z-index: -1; width: 14rem; height: 14rem; top: -6rem; right: -5rem; border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.45; }
  .m-feature.-dark h3 { color: #fff; }
  .m-feature.-dark p { color: rgba(255,255,255,0.78); }
  .m-feature.-dark .icon-badge { background: rgba(255,255,255,0.14); color: #fff; }
  @media (max-width: 720px) {
    .m-bento { grid-template-columns: 1fr; }
    .m-feature.-lg { grid-column: span 1; }
  }

  .price-card { position: relative; overflow: hidden; isolation: isolate; max-width: 420px; margin: 2.5rem auto; padding: 2.2rem; text-align: center; }
  .price-card::before { content: ""; position: absolute; z-index: -1; width: 16rem; height: 16rem; top: -7rem; left: -5rem; border-radius: 50%; background: radial-gradient(circle, var(--teal-100), transparent 70%); }
  .price-card .amount { font-family: "Fraunces", serif; font-size: 3rem; color: var(--teal-700); margin: 0.4rem 0; }
  .price-card .amount small { font-size: 1rem; color: var(--soft); font-weight: 400; }
  .price-list { text-align: left; list-style: none; padding: 0; margin: 1.4rem 0; color: var(--soft); font-size: 0.9rem; }
  .price-list li { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.4rem 0; }
  .price-list li .icon { color: var(--cash); margin-top: 0.15rem; }

  .m-section-head { text-align: center; margin: 0 0 1.6rem; }
  .m-section-head h2 { font-size: clamp(1.5rem, 3vw, 1.9rem); color: var(--teal-900); margin: 0 0 0.4rem; }
  .m-section-head p { color: var(--soft); font-size: 0.95rem; max-width: 46ch; margin: 0 auto; }

  .m-steps { list-style: none; padding: 0; margin: 0 0 3.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
  .m-step { padding: 1.6rem 1.4rem 1.4rem; }
  .m-step .num { font-family: "Fraunces", serif; font-size: 1.7rem; font-weight: 700; color: var(--teal-500); display: block; margin-bottom: 0.6rem; }
  .m-step h3 { margin: 0 0 0.4rem; font-size: 1.02rem; color: var(--teal-900); }
  .m-step p { margin: 0; color: var(--soft); font-size: 0.87rem; line-height: 1.55; }
  @media (max-width: 720px) { .m-steps { grid-template-columns: 1fr; } }

  .m-cats { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin: 0 0 3.5rem; }

  .m-faq { max-width: 720px; margin: 0 auto 3.5rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .m-faq details { padding: 1.1rem 1.3rem; }
  .m-faq summary { cursor: pointer; font-weight: 700; color: var(--teal-900); font-size: 0.95rem; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .m-faq summary::-webkit-details-marker { display: none; }
  .m-faq summary::after { content: "+"; font-size: 1.3rem; line-height: 1; color: var(--teal-600); transition: transform 200ms var(--ease-out-quart); flex: none; }
  .m-faq details[open] summary::after { transform: rotate(45deg); }
  .m-faq p { margin: 0.8rem 0 0; color: var(--soft); font-size: 0.88rem; line-height: 1.6; }
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

router.get('/negocios', (req, res) => {
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
  <div class="m-hero">
    <div class="atmosphere" aria-hidden="true"><span></span><span></span></div>
    <h1 class="reveal" style="--i:0">Tu agenda y tu clientela, sin pagar comisión</h1>
    <p class="reveal" style="--i:1">Bukea es la app de reservas hecha para el negocio de belleza dominicano: WhatsApp, pagos a la dominicana y agenda real, de raíz.</p>
    <a class="btn btn-primary reveal" style="--i:2" href="/negocio">Únete a Bukea, es gratis</a>
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
  res.type('html').send(pageShell({
    base,
    title: 'Bukea para negocios. Agenda, WhatsApp y cero comisión',
    description: 'Bukea es gratis para negocios de belleza en República Dominicana: agenda real, Mi Cuadre, WhatsApp nativo y pagos a la dominicana.',
    canonicalPath: 'https://www.bukeard.com/negocios',
    bodyHtml: body,
  }));
});

router.get('/precios', (req, res) => {
  const base = req.baseUrlPrefix;
  const perks = [
    'Perfil público con tus servicios y horario',
    'Agenda con disponibilidad real',
    'Reservas ilimitadas, sin comisión',
    '"Mi Cuadre", cuánto vendiste hoy, en la semana y en el mes',
    'Recordatorio por WhatsApp para tus clientes',
    'Agrega a tu equipo y deja que cada quien reciba sus propias citas',
  ].map(t => `<li><svg class="icon"><use href="#i-check"/></svg>${t}</li>`).join('');

  const body = `
${MARKETING_STYLE}
<div class="wrap">
  <div class="m-hero">
    <div class="atmosphere" aria-hidden="true"><span></span><span></span></div>
    <h1 class="reveal" style="--i:0">Bukea es gratis</h1>
    <p class="reveal" style="--i:1">Sin suscripción, sin comisión por cliente nuevo, sin tarjeta para empezar. Así de simple, mientras construimos la mejor app de reservas de belleza del país.</p>
  </div>

  <div class="card price-card reveal" style="--i:2">
    <div>Para tu negocio</div>
    <div class="amount">RD$0<small>/mes</small></div>
    <ul class="price-list">${perks}</ul>
    <a class="btn btn-primary" href="/negocio">Únete gratis</a>
  </div>

  <p class="reveal" style="--i:3;text-align:center;color:var(--soft);font-size:0.85rem;max-width:48ch;margin:0 auto 2.5rem">
    Cuando llegue el momento de cobrar, los negocios fundadores mantienen condiciones especiales. Nunca vas a pagar más que lo que aceptaste al unirte.
  </p>

  <div class="m-hero reveal" style="padding-top:0">
    <h1 style="font-size:1.6rem">Para el cliente, siempre gratis</h1>
    <p>Explora, reserva y gestiona tus citas sin costo, hoy y siempre.</p>
  </div>
</div>`;
  res.type('html').send(pageShell({
    base,
    title: 'Precios de Bukea. Gratis para negocios y clientes',
    description: 'Bukea es 100% gratis: sin suscripción, sin comisión, sin tarjeta para empezar.',
    canonicalPath: 'https://www.bukeard.com/precios',
    bodyHtml: body,
  }));
});

const LEGAL_STYLE = `
<style>
  .legal-prose { max-width: 68ch; margin: 0 auto 3rem; }
  .legal-prose h2 { font-size: 1.1rem; color: var(--teal-900); margin: 1.8rem 0 0.5rem; }
  .legal-prose h2:first-child { margin-top: 0; }
  .legal-prose p, .legal-prose li { color: var(--soft); line-height: 1.65; font-size: 0.94rem; }
  .legal-prose ul { margin: 0 0 0.9rem; padding-left: 1.2rem; }
  .legal-prose .updated { margin-top: 2.2rem; padding-top: 1.2rem; border-top: 1px solid var(--line); font-size: 0.82rem; }
</style>`;

router.get('/blog', (req, res) => {
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
  res.type('html').send(pageShell({
    base,
    title: 'Blog. Bukea',
    description: 'Historias, consejos y novedades de Bukea. Muy pronto.',
    canonicalPath: 'https://www.bukeard.com/blog',
    bodyHtml: body,
  }));
});

router.get('/contacto', (req, res) => {
  const base = req.baseUrlPrefix;
  const body = `
${MARKETING_STYLE}
<div class="wrap">
  <div class="m-hero">
    <div class="atmosphere" aria-hidden="true"><span></span><span></span></div>
    <h1 class="reveal" style="--i:0">Hablemos</h1>
    <p class="reveal" style="--i:1">¿Tienes una pregunta, una idea o algo que no funciona como debería? Escríbenos directamente.</p>
  </div>
  <div class="card price-card reveal" style="--i:2">
    <div style="display:flex;flex-direction:column;align-items:center;gap:0.9rem;text-align:center">
      <div class="icon-badge"><svg class="icon"><use href="#i-mail"/></svg></div>
      <div>
        <div style="font-weight:700;font-size:1.1rem;color:var(--teal-900)">${CONTACT_EMAIL}</div>
        <div style="color:var(--soft);font-size:0.85rem;margin-top:0.25rem">Te respondemos en menos de 48 horas</div>
      </div>
      <a class="btn btn-primary" href="mailto:${CONTACT_EMAIL}">Escribir un correo</a>
    </div>
  </div>
</div>`;
  res.type('html').send(pageShell({
    base,
    title: 'Contacto. Bukea',
    description: 'Escríbenos a Bukea para preguntas, soporte o alianzas.',
    canonicalPath: 'https://www.bukeard.com/contacto',
    bodyHtml: body,
  }));
});

router.get('/privacidad', (req, res) => {
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
  res.type('html').send(pageShell({
    base,
    title: 'Política de privacidad. Bukea',
    description: 'Cómo Bukea recoge, usa y protege tus datos.',
    canonicalPath: 'https://www.bukeard.com/privacidad',
    bodyHtml: body,
  }));
});

router.get('/terminos', (req, res) => {
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
  res.type('html').send(pageShell({
    base,
    title: 'Términos de servicio. Bukea',
    description: 'Condiciones de uso de Bukea para clientes y negocios.',
    canonicalPath: 'https://www.bukeard.com/terminos',
    bodyHtml: body,
  }));
});

module.exports = router;
