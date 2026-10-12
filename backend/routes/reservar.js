/* Reserva desde el sitio web (2026-10-11), estilo Fresha: se elige servicio,
   persona, fecha y hora sin cuenta; la cuenta se pide al confirmar. Si no hay
   sesión, se manda a /entrar/cliente con `next` apuntando de vuelta aquí con
   la selección en la URL, así nada se pierde. Usa los mismos endpoints que la
   mini app (/api/professionals/:slug, availability, /api/bookings). */
const express = require('express');
const pool = require('../db/pool');
const { pageShell, esc } = require('../views/shared');
const { wrapAsyncRouter } = require('../lib/async-router');
const { isReservedSlug, SLUG_RE } = require('../lib/reserved-slugs');

const router = wrapAsyncRouter(express.Router());

const RESERVAR_STYLE = `
<style>
  .rs-wrap { max-width: 1040px; margin: 2rem auto 5rem; padding: 0 20px; display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 2rem; align-items: start; }
  .rs-back { grid-column: 1 / -1; color: var(--teal-700); font-weight: 700; text-decoration: none; font-size: 0.9rem; }
  .rs-h1 { grid-column: 1 / -1; font-family: "Fraunces", serif; font-size: clamp(1.7rem, 4vw, 2.3rem); margin: 0; color: var(--teal-900); }
  .rs-sec { background: var(--card); border-radius: 24px; box-shadow: var(--bezel); padding: 1.4rem 1.4rem 1.2rem; margin-bottom: 1.1rem; }
  .rs-sec h2 { font-size: 1.1rem; margin: 0 0 0.9rem; font-family: "Fraunces", serif; color: var(--ink); }
  .rs-opt { display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; box-sizing: border-box; text-align: left; font: inherit; color: var(--ink); background: var(--bg); border: 0; border-radius: 16px; box-shadow: inset 0 0 0 1.5px var(--line); padding: 0.9rem 1.1rem; margin-bottom: 0.6rem; min-height: 56px; cursor: pointer; }
  .rs-opt:hover { box-shadow: inset 0 0 0 1.5px var(--teal-600); }
  .rs-opt.on { box-shadow: inset 0 0 0 2px var(--teal-700); background: var(--teal-100); }
  .rs-opt b { display: block; font-size: 0.98rem; }
  .rs-opt small { display: block; color: var(--soft); font-size: 0.84rem; margin-top: 0.12rem; }
  .rs-opt .price { font-weight: 800; color: var(--teal-900); white-space: nowrap; }
  .rs-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .rs-chip { min-height: 44px; padding: 0 1rem; border-radius: 999px; border: 0; background: var(--bg); box-shadow: inset 0 0 0 1.5px var(--line); font: inherit; font-weight: 700; font-size: 0.88rem; color: var(--ink); cursor: pointer; }
  .rs-chip:hover { box-shadow: inset 0 0 0 1.5px var(--teal-600); }
  .rs-chip.on { background: var(--teal-700); color: #fff; box-shadow: none; }
  .rs-empty { color: var(--soft); font-size: 0.9rem; margin: 0; }
  .rs-bank { font-size: 0.85rem; color: var(--soft); margin: 0.2rem 0 0.7rem; line-height: 1.5; }
  .rs-side { position: sticky; top: 90px; background: var(--card); border-radius: 24px; box-shadow: var(--bezel); padding: 1.4rem; }
  .rs-side h3 { margin: 0 0 0.2rem; font-family: "Fraunces", serif; font-size: 1.15rem; color: var(--teal-900); }
  .rs-side .meta { color: var(--soft); font-size: 0.85rem; margin-bottom: 1rem; }
  .rs-line { display: flex; justify-content: space-between; gap: 1rem; padding: 0.55rem 0; border-top: 1px solid var(--line); font-size: 0.92rem; }
  .rs-line span:first-child { color: var(--soft); }
  .rs-line b { text-align: right; }
  .rs-total { font-size: 1.05rem; }
  .rs-go { width: 100%; min-height: 50px; margin-top: 1rem; border: 0; border-radius: 999px; background: var(--teal-700); color: #fff; font: inherit; font-weight: 800; font-size: 1rem; cursor: pointer; }
  .rs-go:hover:not(:disabled) { background: var(--teal-600); }
  .rs-go:disabled { opacity: 0.5; cursor: not-allowed; }
  .rs-err { display: none; background: #fbe3e0; color: #8a1c14; border-radius: 12px; padding: 0.7rem 0.9rem; font-size: 0.88rem; margin-top: 0.8rem; line-height: 1.4; }
  .rs-done { grid-column: 1 / -1; max-width: 520px; margin: 1rem auto; text-align: center; background: var(--card); border-radius: 28px; box-shadow: var(--bezel); padding: 2.4rem 2rem; }
  .rs-done h2 { font-family: "Fraunces", serif; font-size: 1.8rem; margin: 0 0 0.5rem; color: var(--teal-900); }
  .rs-done p { color: var(--soft); line-height: 1.55; margin: 0 0 1rem; }
  .rs-done .rs-sum { text-align: left; margin: 1.2rem 0; }
  .rs-done a.rs-btn, .rs-done label.rs-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 1.5rem; border-radius: 999px; background: var(--teal-700); color: #fff; font-weight: 800; text-decoration: none; margin: 0.3rem; cursor: pointer; }
  .rs-done a.rs-btn.alt, .rs-done label.rs-btn.alt { background: var(--bg); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--line); }
  @media (max-width: 860px) { .rs-wrap { grid-template-columns: 1fr; } .rs-side { position: static; } }
</style>`;

router.get('/p/:slug/reservar', (req, res) => res.redirect(301, `/${encodeURIComponent(req.params.slug)}/reservar`));

router.get('/:slug/reservar', async (req, res, next) => {
  const base = req.baseUrlPrefix;
  const slug = String(req.params.slug || '').toLowerCase();
  if (!SLUG_RE.test(slug) || isReservedSlug(slug)) return next();
  const [rows] = await pool.query('SELECT slug, name, business_name FROM professionals WHERE slug = ?', [slug]);
  const p = rows[0];
  if (!p) return next();
  const body = `${RESERVAR_STYLE}
<div class="rs-wrap" id="rs-root">
  <a class="rs-back" href="/${esc(p.slug)}">Volver al perfil</a>
  <h1 class="rs-h1">Reserva con ${esc(p.name.split(' ')[0])}</h1>
  <div id="rs-main">
    <div class="rs-sec"><h2>Servicio</h2><div id="rs-services"><p class="rs-empty">Cargando...</p></div></div>
    <div class="rs-sec" id="rs-team-sec" hidden><h2>Con quién</h2><div id="rs-team"></div></div>
    <div class="rs-sec" id="rs-date-sec" hidden><h2>Fecha</h2><div class="rs-chips" id="rs-dates"></div></div>
    <div class="rs-sec" id="rs-time-sec" hidden><h2>Hora</h2><div class="rs-chips" id="rs-times"></div></div>
    <div class="rs-sec" id="rs-pay-sec" hidden><h2>Cómo pagas</h2><div id="rs-pay"></div></div>
  </div>
  <aside class="rs-side" id="rs-side">
    <h3 id="rs-biz"></h3>
    <div class="meta" id="rs-loc"></div>
    <div id="rs-sum"></div>
    <div class="rs-err" id="rs-err"></div>
    <button class="rs-go" id="rs-go" type="button" disabled>Elige un servicio</button>
  </aside>
</div>
<script>
(function () {
  var BASE = ${JSON.stringify(base)}, SLUG = ${JSON.stringify(p.slug)};
  var API = BASE + '/api/professionals/' + encodeURIComponent(SLUG);
  var qs = new URLSearchParams(location.search);
  var st = { service: Number(qs.get('servicio')) || null, collab: qs.has('persona') ? (qs.get('persona') === '0' ? null : Number(qs.get('persona'))) : undefined, date: qs.get('fecha') || null, time: qs.get('hora') || null, pay: qs.get('pago') || null };
  var pro = null;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function money(c) { return 'RD$' + (Number(c || 0) / 100).toLocaleString('es-DO'); }
  function session() { try { var s = JSON.parse(localStorage.getItem('bukea_session')); return s && s.token ? s : null; } catch (e) { return null; } }
  function showErr(m) { var e = $('rs-err'); e.textContent = m; e.style.display = m ? 'block' : 'none'; }
  function svc() { return pro && pro.services.filter(function (s) { return s.id === st.service; })[0]; }
  function person() {
    if (!pro || st.collab === undefined) return null;
    return pro.collaborators.filter(function (c) { return c.id === st.collab; })[0] || null;
  }
  function stateUrl() {
    var u = new URLSearchParams();
    if (st.service) u.set('servicio', st.service);
    if (st.collab !== undefined) u.set('persona', st.collab === null ? '0' : st.collab);
    if (st.date) u.set('fecha', st.date);
    if (st.time) u.set('hora', st.time);
    if (st.pay) u.set('pago', st.pay);
    return '/' + encodeURIComponent(SLUG) + '/reservar?' + u.toString();
  }
  function opt(title, sub, price, on, click) {
    var b = el('button', 'rs-opt' + (on ? ' on' : '')); b.type = 'button';
    var l = el('span'); l.appendChild(el('b', '', title)); if (sub) l.appendChild(el('small', '', sub));
    b.appendChild(l); if (price) b.appendChild(el('span', 'price', price));
    b.onclick = click; return b;
  }
  function t12(t) { var h = Number(t.slice(0, 2)), m = t.slice(3, 5); return (h % 12 || 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function chip(label, on, click) { var b = el('button', 'rs-chip' + (on ? ' on' : ''), label); b.type = 'button'; b.onclick = click; return b; }

  function renderServices() {
    var c = $('rs-services'); c.textContent = '';
    if (!pro.services.length) c.appendChild(el('p', 'rs-empty', 'Este negocio todavía no tiene servicios cargados.'));
    pro.services.forEach(function (s) {
      c.appendChild(opt(s.name, s.durationMin + ' min', money(s.priceCents), s.id === st.service, function () { st.service = s.id; st.date = null; st.time = null; render(); }));
    });
  }
  function renderTeam() {
    var sec = $('rs-team-sec');
    if (!st.service || pro.collaborators.length < 2) { sec.hidden = true; if (st.service && st.collab === undefined) st.collab = null; return; }
    sec.hidden = false; var c = $('rs-team'); c.textContent = '';
    pro.collaborators.forEach(function (m) {
      c.appendChild(opt(m.name, m.role, '', st.collab === m.id, function () { st.collab = m.id; render(); }));
    });
    if (st.collab === undefined) $('rs-team-sec').querySelector('h2').textContent = 'Con quién (elige una persona)';
  }
  var daysCache = {};
  async function renderDates() {
    var sec = $('rs-date-sec');
    var teamOk = pro.collaborators.length < 2 || st.collab !== undefined;
    if (!st.service || !teamOk) { sec.hidden = true; return; }
    sec.hidden = false; var c = $('rs-dates');
    if (!daysCache[st.service]) {
      c.textContent = 'Cargando...';
      var r = await fetch(API + '/availability/days?serviceId=' + st.service + '&days=14');
      daysCache[st.service] = r.ok ? await r.json() : [];
    }
    c.textContent = '';
    var days = daysCache[st.service].filter(function (d) { return d.hasSlots; });
    if (!days.length) c.appendChild(el('p', 'rs-empty', 'No hay horarios disponibles en los próximos días.'));
    days.forEach(function (d) { c.appendChild(chip(d.label, d.date === st.date, function () { st.date = d.date; st.time = null; render(); })); });
  }
  async function renderTimes() {
    var sec = $('rs-time-sec');
    if (!st.service || !st.date) { sec.hidden = true; return; }
    sec.hidden = false; var c = $('rs-times'); c.textContent = 'Cargando...';
    var r = await fetch(API + '/availability/times?serviceId=' + st.service + '&date=' + st.date);
    var d = r.ok ? await r.json() : { times: [] };
    c.textContent = '';
    if (!d.times.length) c.appendChild(el('p', 'rs-empty', 'Ese día ya no tiene horarios libres.'));
    d.times.forEach(function (t) { c.appendChild(chip(t.label, t.time === st.time, function () { st.time = t.time; render(); })); });
  }
  function renderPay() {
    var sec = $('rs-pay-sec');
    if (!st.time) { sec.hidden = true; return; }
    sec.hidden = false; var c = $('rs-pay'); c.textContent = '';
    var methods = [];
    if (pro.acceptsCash) methods.push(['cash', 'Efectivo', 'Pagas en el negocio']);
    if (pro.bankAccounts.length) methods.push(['bank', 'Transferencia', 'Pagas por transferencia y puedes adjuntar el comprobante']);
    if (!methods.length) methods.push(['cash', 'Pago en el negocio', 'Pagas cuando llegues']);
    if (!st.pay || !methods.some(function (m) { return m[0] === st.pay; })) st.pay = methods[0][0];
    methods.forEach(function (m) { c.appendChild(opt(m[1], m[2], '', st.pay === m[0], function () { st.pay = m[0]; render(); })); });
    if (st.pay === 'bank') {
      c.appendChild(el('p', 'rs-bank', 'Cuentas para transferir:'));
      pro.bankAccounts.forEach(function (b) {
        c.appendChild(el('p', 'rs-bank', b.bankName + ' ' + b.accountType + ', ' + b.accountNumber + ', a nombre de ' + b.accountHolder + '. Cédula/RNC ' + b.cedulaRnc));
      });
    }
  }
  function line(k, v, cls) { var d = el('div', 'rs-line' + (cls ? ' ' + cls : '')); d.appendChild(el('span', '', k)); d.appendChild(el('b', '', v)); return d; }
  function renderSummary() {
    var s = svc(), c = $('rs-sum'); c.textContent = '';
    var go = $('rs-go');
    if (s) {
      c.appendChild(line('Servicio', s.name));
      var m = person(); if (m && pro.collaborators.length > 1) c.appendChild(line('Con', m.name));
      if (st.date && st.time) {
        var day = (daysCache[st.service] || []).filter(function (d) { return d.date === st.date; })[0];
        c.appendChild(line('Cuándo', (day ? day.label : st.date) + ', ' + t12(st.time)));
      }
      if (st.pay) c.appendChild(line('Pago', st.pay === 'bank' ? 'Transferencia' : 'Efectivo'));
      c.appendChild(line('Total', money(s.priceCents), 'rs-total'));
    }
    var ready = s && st.date && st.time && st.pay;
    go.disabled = !ready;
    go.textContent = !s ? 'Elige un servicio' : !ready ? 'Completa los pasos' : (session() ? 'Confirmar reserva' : 'Continuar para reservar');
  }
  async function render() {
    showErr('');
    renderServices(); renderTeam(); await renderDates(); await renderTimes(); renderPay(); renderSummary();
    if (history.replaceState) history.replaceState(null, '', stateUrl());
  }

  async function confirmBooking() {
    var sess = session();
    if (!sess) { location.href = '/entrar/cliente?next=' + encodeURIComponent(stateUrl()); return; }
    var go = $('rs-go'); go.disabled = true; go.textContent = 'Reservando...'; showErr('');
    try {
      var body = { professionalId: pro.id, serviceId: st.service, date: st.date, time: st.time, paymentMethod: st.pay };
      if (st.collab) body.collaboratorId = st.collab;
      var r = await fetch(BASE + '/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sess.token }, body: JSON.stringify(body) });
      var d = await r.json().catch(function () { return {}; });
      if (r.status === 401) { localStorage.removeItem('bukea_session'); location.href = '/entrar/cliente?next=' + encodeURIComponent(stateUrl()); return; }
      if (!r.ok) { showErr(d.error || 'No se pudo crear la reserva.'); if (r.status === 409) { st.time = null; daysCache = {}; render(); } else renderSummary(); return; }
      done(d, sess);
    } catch (e) { showErr('No se pudo conectar con el servidor.'); renderSummary(); }
  }
  function done(d, sess) {
    var root = $('rs-root'); root.textContent = '';
    var box = el('div', 'rs-done');
    box.appendChild(el('h2', '', 'Reserva confirmada'));
    box.appendChild(el('p', '', d.businessName + ', ' + d.neighborhood));
    var sum = el('div', 'rs-sum');
    sum.appendChild(line('Servicio', d.serviceName));
    sum.appendChild(line('Cuándo', d.dayLabel + ', ' + d.timeLabel));
    if (d.collaboratorName) sum.appendChild(line('Con', d.collaboratorName));
    sum.appendChild(line('Total', money(d.priceCents), 'rs-total'));
    box.appendChild(sum);
    box.appendChild(el('p', '', 'Tu cita quedó guardada en tu cuenta. Puedes verla o cancelarla en Mi cuenta.'));
    if (st.pay === 'bank') {
      var lab = el('label', 'rs-btn alt', 'Adjuntar comprobante');
      var inp = el('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,application/pdf'; inp.hidden = true;
      inp.onchange = async function () {
        if (!inp.files[0]) return;
        var fd = new FormData(); fd.append('receipt', inp.files[0]);
        var r = await fetch(BASE + '/api/bookings/' + d.id + '/receipt', { method: 'POST', headers: { Authorization: 'Bearer ' + sess.token }, body: fd });
        lab.firstChild.textContent = r.ok ? 'Comprobante enviado' : 'No se pudo enviar, intenta de nuevo';
      };
      lab.appendChild(inp); box.appendChild(lab);
    }
    var a = el('a', 'rs-btn', 'Ver mis citas'); a.href = '/cuenta'; box.appendChild(a);
    root.appendChild(box);
    window.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, '', '/cuenta');
  }
  $('rs-go').onclick = confirmBooking;

  fetch(API).then(function (r) { return r.json(); }).then(function (d) {
    pro = d; $('rs-biz').textContent = d.businessName; $('rs-loc').textContent = d.neighborhood;
    if (st.service && !svc()) st.service = null;
    render();
  }).catch(function () { $('rs-services').textContent = 'No se pudo cargar el negocio. Intenta de nuevo.'; });
})();
</script>`;
  res.type('html').send(await pageShell({
    base,
    title: `Reservar con ${p.name}. Bukea`,
    description: `Reserva tu cita con ${p.name} en ${p.business_name}.`,
    canonicalPath: `https://www.bukeard.com/${esc(p.slug)}/reservar`,
    bodyHtml: body,
  }));
});

module.exports = router;
