const express = require('express');
const pool = require('../db/pool');
const { CAT_LABELS, avatarGradient, initials, formatPrice, esc, pageShell } = require('../views/shared');

const router = express.Router();

const CATEGORIES = Object.keys(CAT_LABELS);

function proCardHtml(p) {
  return `
    <a class="pro-card" href="/p/${esc(p.slug)}">
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
  .hero { padding: 3rem 0 2.5rem; text-align: center; }
  .hero h1 { font-size: clamp(1.9rem, 4vw, 2.8rem); margin: 0 0 0.6rem; color: var(--teal-900); }
  .hero p { color: var(--soft); font-size: 1.05rem; max-width: 46ch; margin: 0 auto 1.8rem; }
  .search-form { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; max-width: 640px; margin: 0 auto; }
  .search-form input, .search-form select { border: 1.5px solid var(--line); background: var(--card); border-radius: 999px; padding: 0.75rem 1.1rem; font-size: 0.92rem; font-family: inherit; color: var(--ink); }
  .search-form input { flex: 1 1 240px; min-width: 0; }
  .search-form button { flex: none; }
  .chips { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; margin: 1.6rem 0 0; }
  .chip { text-decoration: none; padding: 0.5rem 1rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); color: var(--soft); font-size: 0.85rem; font-weight: 700; }
  .chip.active, .chip:hover { background: var(--teal-600); border-color: var(--teal-600); color: #fff; }
  .stat-line { text-align: center; color: var(--soft); font-size: 0.85rem; margin-top: 1rem; }
  .pro-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin: 2rem 0; }
  .pro-card { display: flex; align-items: center; gap: 0.9rem; padding: 1rem; text-decoration: none; color: var(--ink); }
  .pro-avatar { width: 48px; height: 48px; border-radius: 50%; flex: none; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: "Fraunces", serif; }
  .pro-info { flex: 1; min-width: 0; }
  .pro-name { font-weight: 700; font-size: 0.95rem; }
  .pro-meta { color: var(--soft); font-size: 0.8rem; margin-top: 0.15rem; }
  .pro-tags { color: var(--soft); font-size: 0.76rem; margin-top: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pro-rating { flex: none; font-weight: 700; font-size: 0.85rem; color: var(--gold-700); text-align: right; }
  .pro-rating span { display: block; font-weight: 500; color: var(--soft); font-size: 0.72rem; }
  .empty { text-align: center; color: var(--soft); padding: 3rem 1rem; }
  .biz-cta { background: var(--teal-900); color: #fff; border-radius: 22px; padding: 2.2rem; text-align: center; margin: 3rem 0; }
  .biz-cta h2 { color: #fff; margin: 0 0 0.5rem; font-size: 1.5rem; }
  .biz-cta p { color: rgba(255,255,255,0.8); max-width: 42ch; margin: 0 auto 1.2rem; }
</style>`;

router.get('/', async (req, res) => {
  const base = req.baseUrlPrefix;
  const q = String(req.query.q || '').trim();
  const categoria = CATEGORIES.includes(req.query.categoria) ? req.query.categoria : null;

  let sql = 'SELECT * FROM professionals WHERE 1=1';
  const params = [];
  if (categoria) { sql += ' AND category = ?'; params.push(categoria); }
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

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM professionals');

  const chips = CATEGORIES.map(key => {
    const active = categoria === key ? ' active' : '';
    const params2 = new URLSearchParams(q ? { q } : {});
    params2.set('categoria', key);
    return `<a class="chip${active}" href="/?${params2.toString()}">${esc(CAT_LABELS[key])}</a>`;
  }).join('');
  const allChip = `<a class="chip${!categoria ? ' active' : ''}" href="/${q ? '?q=' + encodeURIComponent(q) : ''}">Todos</a>`;

  const grid = professionals.length
    ? professionals.map(proCardHtml).join('')
    : '<p class="empty">No encontramos profesionales con esa búsqueda todavía — vuelve pronto, seguimos sumando negocios.</p>';

  const body = `
${HOME_STYLE}
<div class="wrap">
  <div class="hero">
    <h1>Bukea tu cita de belleza en República Dominicana</h1>
    <p>Barbería, uñas, salón, cejas y maquillaje — reserva en segundos, paga en efectivo o transferencia, sin comisión.</p>
    <form class="search-form" method="get" action="/">
      <input type="text" name="q" value="${esc(q)}" placeholder="Busca un profesional, negocio o sector…">
      ${categoria ? `<input type="hidden" name="categoria" value="${esc(categoria)}">` : ''}
      <button class="btn btn-primary" type="submit">Buscar</button>
    </form>
    <div class="chips">${allChip}${chips}</div>
    <p class="stat-line">${total} profesional${total === 1 ? '' : 'es'} ya en Bukea — gratis para siempre para el cliente.</p>
  </div>

  <div class="pro-grid">${grid}</div>

  <div class="biz-cta">
    <h2>¿Tienes un negocio de belleza?</h2>
    <p>Agenda, clientela y "Mi Cuadre" en un solo lugar — y por ahora, 100% gratis. Cero comisión, cero suscripción.</p>
    <a class="btn btn-primary" href="/negocios">Únete a Bukea</a>
  </div>
</div>`;

  res.type('html').send(pageShell({
    base,
    title: 'Bukea — Reserva tu cita de belleza en República Dominicana',
    description: 'Bukea tu cita de barbería, uñas, salón, cejas y maquillaje en República Dominicana. Paga en efectivo o transferencia, sin comisión.',
    canonicalPath: 'https://www.bukeard.com/',
    bodyHtml: body,
  }));
});

const PROFILE_STYLE = `
<style>
  .profile-hero { display: flex; gap: 1.4rem; align-items: center; padding: 2rem 0 1.4rem; flex-wrap: wrap; }
  .profile-avatar { width: 84px; height: 84px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; font-family: "Fraunces", serif; flex: none; }
  .profile-hero h1 { margin: 0 0 0.3rem; font-size: 1.7rem; }
  .profile-meta { color: var(--soft); font-size: 0.95rem; }
  .profile-badges { display: flex; gap: 0.5rem; margin-top: 0.6rem; flex-wrap: wrap; }
  .svc-list { margin: 1.6rem 0; }
  .svc-row { display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 0; border-bottom: 1px solid var(--line); }
  .svc-row:last-child { border-bottom: none; }
  .svc-name { font-weight: 700; font-size: 0.95rem; }
  .svc-dur { color: var(--soft); font-size: 0.8rem; margin-top: 0.1rem; }
  .svc-price { font-weight: 700; color: var(--teal-700); }
  .cta-row { position: sticky; bottom: 1rem; margin: 1.6rem 0; text-align: center; }
  .cta-row .btn { width: 100%; max-width: 360px; justify-content: center; padding: 0.9rem 1.5rem; font-size: 1rem; }
</style>`;

router.get('/p/:slug', async (req, res) => {
  const base = req.baseUrlPrefix;
  const [rows] = await pool.query('SELECT * FROM professionals WHERE slug = ?', [req.params.slug]);
  const p = rows[0];
  if (!p) {
    return res.status(404).type('html').send(pageShell({
      base,
      title: 'Profesional no encontrado — Bukea',
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
    'SELECT bank_name, account_type, account_number, account_holder FROM professional_bank_accounts WHERE professional_id = ?',
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

  const body = `
${PROFILE_STYLE}
<div class="wrap">
  <div class="profile-hero">
    <div class="profile-avatar" style="background:${avatarGradient(p.slug)}">${esc(initials(p.name))}</div>
    <div>
      <h1>${esc(p.name)}</h1>
      <div class="profile-meta">${esc(p.business_name)} · ${esc(p.neighborhood)} · ${CAT_LABELS[p.category] || esc(p.category)}
        ${p.reviews_count > 0 ? ` · ★ ${Number(p.rating).toFixed(1)} (${p.reviews_count} reseñas)` : ' · Nuevo en Bukea'}
      </div>
      <div class="profile-badges">${badges}</div>
    </div>
  </div>

  <h2>Servicios</h2>
  <div class="svc-list card" style="padding:0.4rem 1.2rem">${svcHtml}</div>

  ${bankAccounts.length ? `
  <h2>Cuentas para transferir</h2>
  <div class="svc-list card" style="padding:0.4rem 1.2rem">
    ${bankAccounts.map(b => `
    <div class="svc-row">
      <div>
        <div class="svc-name">${esc(b.bank_name)} · ${esc(b.account_type)}</div>
        <div class="svc-dur">${esc(b.account_holder)}</div>
      </div>
      <div class="svc-price">${esc(b.account_number)}</div>
    </div>`).join('')}
  </div>` : ''}

  <div class="cta-row">
    <a class="btn btn-primary" href="${base}/?pro=${encodeURIComponent(p.slug)}">Bukear cita con ${esc(p.name.split(' ')[0])}</a>
  </div>
</div>`;

  res.type('html').send(pageShell({
    base,
    title: `${p.name} — ${p.business_name} | Bukea`,
    description: `Reserva con ${p.name} en ${p.business_name}, ${p.neighborhood}. ${services.map(s => s.name).join(', ')}.`,
    canonicalPath: `https://www.bukeard.com/p/${esc(p.slug)}`,
    bodyHtml: body,
  }));
});

const MARKETING_STYLE = `
<style>
  .m-hero { padding: 3rem 0 1rem; text-align: center; }
  .m-hero h1 { font-size: clamp(1.9rem, 4vw, 2.6rem); color: var(--teal-900); margin: 0 0 0.6rem; }
  .m-hero p { color: var(--soft); font-size: 1.05rem; max-width: 50ch; margin: 0 auto 1.6rem; }
  .m-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; margin: 2.5rem 0; }
  .m-feature { padding: 1.4rem; }
  .m-feature h3 { margin: 0 0 0.4rem; font-size: 1.05rem; color: var(--teal-800, var(--teal-700)); }
  .m-feature p { margin: 0; color: var(--soft); font-size: 0.88rem; }
  .price-card { max-width: 420px; margin: 2.5rem auto; padding: 2rem; text-align: center; }
  .price-card .amount { font-family: "Fraunces", serif; font-size: 3rem; color: var(--teal-700); margin: 0.4rem 0; }
  .price-card .amount small { font-size: 1rem; color: var(--soft); font-weight: 400; }
  .price-list { text-align: left; list-style: none; padding: 0; margin: 1.4rem 0; color: var(--soft); font-size: 0.9rem; }
  .price-list li { padding: 0.4rem 0; }
  .price-list li::before { content: "✓ "; color: var(--cash); font-weight: 700; }
</style>`;

router.get('/negocios', (req, res) => {
  const base = req.baseUrlPrefix;
  const body = `
${MARKETING_STYLE}
<div class="wrap">
  <div class="m-hero">
    <h1>Tu agenda, tu clientela — cero comisión</h1>
    <p>Bukea es la app de reservas hecha para el negocio de belleza dominicano: WhatsApp, efectivo/transferencia y fila para walk-ins, de raíz.</p>
    <a class="btn btn-primary" href="${base}/?join=1">Únete a Bukea — es gratis</a>
  </div>

  <div class="m-features">
    <div class="card m-feature"><h3>Agenda real</h3><p>Tus clientes ven tu horario de verdad y reservan sin llamarte. Tú confirmas, cancelas y llevas el control desde tu celular.</p></div>
    <div class="card m-feature"><h3>Mi Cuadre</h3><p>Cuánto vendiste hoy, en los últimos 7 días y en el mes — sin hoja de cálculo, sin cuaderno.</p></div>
    <div class="card m-feature"><h3>A la dominicana</h3><p>Efectivo, transferencia y tPago desde el primer día. Tarjeta cuando la necesites.</p></div>
    <div class="card m-feature"><h3>WhatsApp nativo</h3><p>Confirmaciones y recordatorios donde ya está tu clientela.</p></div>
    <div class="card m-feature"><h3>Fila en vivo</h3><p>Para el walk-in que llega sin cita — turno en tiempo real, sin perder el orden.</p></div>
    <div class="card m-feature"><h3>Cero comisión</h3><p>Nunca te cobramos por cliente nuevo. Lo que vendes es tuyo.</p></div>
  </div>

  <div class="biz-cta" style="background:var(--teal-900)">
    <h2 style="color:#fff">Móntate hoy, sin tarjeta</h2>
    <p>Crea tu perfil en menos de 2 minutos y comparte tu enlace por WhatsApp.</p>
    <a class="btn btn-primary" href="${base}/?join=1">Crear mi cuenta de negocio</a>
  </div>
</div>`;
  res.type('html').send(pageShell({
    base,
    title: 'Bukea para negocios — Agenda, WhatsApp y cero comisión',
    description: 'Bukea es gratis para negocios de belleza en República Dominicana: agenda real, Mi Cuadre, WhatsApp nativo y pagos a la dominicana.',
    canonicalPath: 'https://www.bukeard.com/negocios',
    bodyHtml: body,
  }));
});

router.get('/precios', (req, res) => {
  const base = req.baseUrlPrefix;
  const body = `
${MARKETING_STYLE}
<div class="wrap">
  <div class="m-hero">
    <h1>Bukea es gratis</h1>
    <p>Sin suscripción, sin comisión por cliente nuevo, sin tarjeta para empezar. Así de simple, mientras construimos la mejor app de reservas de belleza del país.</p>
  </div>

  <div class="card price-card">
    <div>Para tu negocio</div>
    <div class="amount">RD$0<small>/mes</small></div>
    <ul class="price-list">
      <li>Perfil público con tus servicios y horario</li>
      <li>Agenda con disponibilidad real</li>
      <li>Reservas ilimitadas, sin comisión</li>
      <li>"Mi Cuadre" — cuánto vendiste hoy, en la semana y en el mes</li>
      <li>Recordatorio por WhatsApp para tus clientes</li>
      <li>Fila en vivo para walk-ins</li>
    </ul>
    <a class="btn btn-primary" href="${base}/?join=1">Únete gratis</a>
  </div>

  <p style="text-align:center;color:var(--soft);font-size:0.85rem;max-width:48ch;margin:0 auto 2.5rem">
    Cuando llegue el momento de cobrar, los negocios fundadores mantienen condiciones especiales — nunca vas a pagar más que lo que aceptaste al unirte.
  </p>

  <div class="m-hero" style="padding-top:0">
    <h1 style="font-size:1.6rem">Para el cliente, siempre gratis</h1>
    <p>Explora, reserva y gestiona tus citas sin costo — hoy y siempre.</p>
  </div>
</div>`;
  res.type('html').send(pageShell({
    base,
    title: 'Precios de Bukea — Gratis para negocios y clientes',
    description: 'Bukea es 100% gratis: sin suscripción, sin comisión, sin tarjeta para empezar.',
    canonicalPath: 'https://www.bukeard.com/precios',
    bodyHtml: body,
  }));
});

module.exports = router;
