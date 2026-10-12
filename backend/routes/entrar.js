/* Puerta de entrada y cuenta del cliente en el sitio web (2026-10-11).
   Estilo Fresha: /entrar pregunta cliente o negocio; /entrar/cliente es una
   sola pantalla para entrar o crear cuenta con correo + código; /cuenta es
   "Mis citas". La sesión se guarda en localStorage como `bukea_session`, la
   misma clave de la mini app (mismo dominio), así que se comparte. */
const express = require('express');
const { PORTAL_URL, pageShell } = require('../views/shared');
const { wrapAsyncRouter } = require('../lib/async-router');

const router = wrapAsyncRouter(express.Router());

const GOOGLE_SVG = '<svg class="social-icon" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>';
const APPLE_SVG = '<svg class="social-icon" viewBox="0 0 17 20" fill="currentColor"><path d="M13.998 10.63c-.024-2.415 1.973-3.573 2.063-3.63-1.126-1.646-2.877-1.872-3.502-1.897-1.49-.152-2.91.877-3.665.877-.755 0-1.923-.856-3.16-.833-1.627.024-3.128.946-3.965 2.402-1.692 2.933-.432 7.28 1.216 9.66.806 1.166 1.767 2.474 3.028 2.427 1.216-.048 1.674-.786 3.144-.786 1.47 0 1.883.786 3.17.762 1.31-.024 2.14-1.19 2.94-2.36.926-1.354 1.307-2.665 1.33-2.734-.03-.012-2.552-.98-2.576-3.888h-.023z"/><path d="M11.578 3.508c.668-.81 1.121-1.937.997-3.06-.964.04-2.13.643-2.822 1.452-.618.719-1.16 1.87-1.014 2.976 1.076.083 2.17-.55 2.839-1.368z"/></svg>';

const ENTRAR_STYLE = `
<style>
  .ent-wrap { max-width: 460px; margin: 3rem auto 5rem; padding: 0 20px; }
  .ent-card { background: var(--card); border-radius: 28px; box-shadow: var(--bezel); padding: 2.4rem 2rem 2rem; }
  .ent-card h1 { font-family: "Fraunces", serif; font-weight: 600; font-size: 1.9rem; text-align: center; margin: 0 0 0.5rem; color: var(--teal-900); letter-spacing: -0.01em; }
  .ent-sub { text-align: center; color: var(--soft); font-size: 0.95rem; line-height: 1.55; margin: 0 0 1.6rem; }
  .ent-opt { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.2rem; border-radius: 18px; background: var(--bg); box-shadow: inset 0 0 0 1.5px var(--line); text-decoration: none; color: var(--ink); margin-bottom: 0.8rem; min-height: 64px; transition: box-shadow 200ms var(--ease-out-quart), transform 200ms var(--ease-out-quart); }
  .ent-opt:hover { box-shadow: inset 0 0 0 1.5px var(--teal-600); transform: translateY(-2px); }
  .ent-opt b { display: block; font-size: 1.02rem; }
  .ent-opt small { display: block; color: var(--soft); font-size: 0.85rem; margin-top: 0.15rem; }
  .ent-opt .icon { width: 20px; height: 20px; flex: none; color: var(--teal-600); }
  .ent-field { margin-bottom: 1rem; }
  .ent-field label { display: block; font-size: 0.76rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--soft); margin-bottom: 0.4rem; }
  .ent-field input { width: 100%; box-sizing: border-box; border: 1.5px solid var(--line); background: var(--bg); border-radius: 14px; padding: 0.85rem 1rem; font: inherit; font-size: 1rem; color: var(--ink); }
  .ent-field input:focus { outline: none; border-color: var(--teal-600); box-shadow: 0 0 0 4px rgba(15,133,131,0.18); }
  .ent-hint { color: var(--soft); font-size: 0.82rem; margin: -0.4rem 0 1.1rem; }
  .ent-btn { width: 100%; min-height: 48px; border: 0; border-radius: 999px; background: var(--teal-700); color: #fff; font: inherit; font-weight: 800; font-size: 0.98rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
  .ent-btn:hover { background: var(--teal-600); }
  .ent-btn:disabled { opacity: 0.6; cursor: wait; }
  .ent-link { display: block; text-align: center; margin-top: 1.1rem; color: var(--soft); font-size: 0.88rem; }
  .ent-link a, .ent-link button { color: var(--teal-700); font-weight: 700; background: none; border: 0; padding: 0; font: inherit; font-weight: 700; cursor: pointer; text-decoration: underline; }
  .ent-error { display: none; background: #fbe3e0; color: #8a1c14; border-radius: 12px; padding: 0.7rem 0.9rem; font-size: 0.88rem; margin: 0 0 1rem; line-height: 1.4; }
  .ent-error.ok { background: #e3f4ee; color: #0e5a45; }
  .ent-step[hidden] { display: none; }
  .ent-or { display: flex; align-items: center; gap: 0.8rem; color: var(--soft); font-size: 0.8rem; margin: 1.3rem 0 1rem; }
  .ent-or::before, .ent-or::after { content: ""; flex: 1; height: 1px; background: var(--line); }
  .ent-social { width: 100%; min-height: 48px; border-radius: 999px; background: var(--bg); box-shadow: inset 0 0 0 1.5px var(--line); border: 0; font: inherit; font-weight: 700; font-size: 0.95rem; color: var(--ink); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.7rem; margin-bottom: 0.6rem; }
  .ent-social:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--teal-600); }
  .ent-social:disabled { opacity: 0.55; cursor: not-allowed; }
  .ent-social .social-icon { width: 18px; height: 18px; flex: none; }
  .ent-social .soon { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: var(--teal-100); color: var(--teal-700); border-radius: 999px; padding: 0.15rem 0.5rem; }
  .cta-hello { font-family: "Fraunces", serif; font-size: 2rem; margin: 0 0 0.3rem; color: var(--teal-900); }
  .cta-wrap { max-width: 760px; margin: 2.4rem auto 5rem; padding: 0 20px; }
  .cta-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.6rem; }
  .cta-head p { margin: 0; color: var(--soft); }
  .cta-out { background: none; border: 0; color: var(--teal-700); font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; min-height: 44px; }
  .cta-sec { font-size: 1.15rem; margin: 2rem 0 0.8rem; color: var(--ink); font-family: "Fraunces", serif; }
  .cta-appt { background: var(--card); border-radius: 20px; box-shadow: var(--bezel); padding: 1.1rem 1.3rem; margin-bottom: 0.9rem; display: grid; grid-template-columns: 1fr auto; gap: 0.4rem 1rem; align-items: center; }
  .cta-appt h3 { margin: 0; font-size: 1.05rem; }
  .cta-appt .meta { color: var(--soft); font-size: 0.88rem; }
  .cta-appt .when { font-weight: 800; color: var(--teal-900); }
  .cta-actions { grid-column: 1 / -1; display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.4rem; }
  .cta-actions a, .cta-actions button { min-height: 40px; padding: 0 1rem; border-radius: 999px; font: inherit; font-weight: 700; font-size: 0.86rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; border: 0; background: var(--bg); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--line); }
  .cta-actions .danger { color: #8a1c14; }
  .chip-st { font-size: 0.72rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 999px; background: #e3f4ee; color: #0e5a45; white-space: nowrap; }
  .chip-st.off { background: #eceff0; color: #5b6b6a; }
  .cta-empty { background: var(--card); border-radius: 20px; box-shadow: var(--bezel); padding: 2rem; text-align: center; color: var(--soft); }
  .cta-empty a { display: inline-flex; margin-top: 1rem; min-height: 46px; align-items: center; padding: 0 1.4rem; border-radius: 999px; background: var(--teal-700); color: #fff; font-weight: 800; text-decoration: none; }
</style>`;

router.get('/entrar', async (req, res) => {
  const body = `${ENTRAR_STYLE}
<div class="ent-wrap">
  <div class="ent-card">
    <h1>Regístrate o inicia sesión</h1>
    <p class="ent-sub">Elige cómo quieres entrar a Bukea.</p>
    <a class="ent-opt" href="/entrar/cliente"><span><b>Bukea para clientes</b><small>Reserva en negocios de belleza cerca de ti</small></span><svg class="icon"><use href="#i-chevron-right"/></svg></a>
    <a class="ent-opt" href="${PORTAL_URL}"><span><b>Bukea para negocios</b><small>Gestiona tu negocio y hazlo crecer</small></span><svg class="icon"><use href="#i-chevron-right"/></svg></a>
  </div>
</div>`;
  res.type('html').send(await pageShell({
    base: req.baseUrlPrefix,
    title: 'Regístrate o inicia sesión. Bukea',
    description: 'Entra a Bukea como cliente o como negocio.',
    canonicalPath: 'https://www.bukeard.com/entrar',
    bodyHtml: body,
  }));
});

router.get('/entrar/cliente', async (req, res) => {
  const base = req.baseUrlPrefix;
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  const appleClientId = process.env.APPLE_CLIENT_ID || '';
  const body = `${ENTRAR_STYLE}
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" async></script>
<div class="ent-wrap">
  <div class="ent-card">
    <div class="ent-step" id="s-email">
      <h1>Bukea para clientes</h1>
      <p class="ent-sub">Crea una cuenta o inicia sesión para reservar y gestionar tus citas.</p>
      <p class="ent-error" id="e-email"></p>
      <div class="ent-field"><label for="i-email">Correo</label><input id="i-email" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.com"></div>
      <p class="ent-hint">Te enviaremos un código de verificación.</p>
      <button class="ent-btn" id="b-email" type="button">Continuar</button>
      <div class="ent-or">o</div>
      <button class="ent-social" id="b-google" type="button">${GOOGLE_SVG}<span class="lbl">Continuar con Google</span></button>
      <button class="ent-social" id="b-apple" type="button">${APPLE_SVG}<span class="lbl">Continuar con Apple</span></button>
      <span class="ent-link">¿Tienes un negocio? <a href="${PORTAL_URL}">Ir a Bukea para negocios</a></span>
    </div>
    <div class="ent-step" id="s-code" hidden>
      <h1>Revisa tu correo</h1>
      <p class="ent-sub" id="t-code">Escribe el código de 6 dígitos que te enviamos.</p>
      <p class="ent-error" id="e-code"></p>
      <div class="ent-field"><label for="i-code">Código</label><input id="i-code" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></div>
      <button class="ent-btn" id="b-code" type="button">Verificar</button>
      <span class="ent-link"><button type="button" id="b-resend">Reenviar código</button> · <button type="button" id="b-change">Cambiar correo</button></span>
    </div>
    <div class="ent-step" id="s-name" hidden>
      <h1>Un último paso</h1>
      <p class="ent-sub">Correo verificado. Dinos cómo te llamas para tus citas.</p>
      <p class="ent-error" id="e-name"></p>
      <div class="ent-field"><label for="i-name">Tu nombre</label><input id="i-name" type="text" autocomplete="name" placeholder="Nombre y apellido"></div>
      <div class="ent-field"><label for="i-phone">Teléfono (opcional)</label><input id="i-phone" type="tel" autocomplete="tel" placeholder="809 000 0000"></div>
      <button class="ent-btn" id="b-name" type="button">Crear mi cuenta</button>
    </div>
  </div>
</div>
<script>
(function () {
  var API = ${JSON.stringify(base)} + '/api/auth';
  var EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  var email = '', signup = '';
  function $(id) { return document.getElementById(id); }
  function show(step) { ['s-email', 's-code', 's-name'].forEach(function (s) { $(s).hidden = s !== step; }); }
  function err(id, msg, ok) { var el = $(id); el.textContent = msg; el.className = 'ent-error' + (ok ? ' ok' : ''); el.style.display = 'block'; }
  function clear() { ['e-email', 'e-code', 'e-name'].forEach(function (i) { $(i).style.display = 'none'; }); }
  async function post(path, body) {
    var r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var d = await r.json().catch(function () { return {}; });
    return { ok: r.ok, data: d };
  }
  function done(session) {
    localStorage.setItem('bukea_session', JSON.stringify(session));
    var next = new URLSearchParams(location.search).get('next');
    location.href = next && next.charAt(0) === '/' && next.charAt(1) !== '/' ? next : '/cuenta';
  }
  /* Contador de "Reenviar código" (2026-10-12): el servidor responde al instante y
     fija la espera mínima entre envíos; aquí se muestra como cuenta regresiva. */
  var resendTimer = null;
  function startResend(seconds) {
    var b = $('b-resend'); clearInterval(resendTimer);
    var left = Math.max(0, Math.round(seconds || 0));
    function tick() {
      if (left <= 0) { clearInterval(resendTimer); b.disabled = false; b.textContent = 'Reenviar código'; return; }
      b.disabled = true; b.textContent = 'Reenviar código (' + left + ' s)'; left -= 1;
    }
    tick(); if (left > 0) resendTimer = setInterval(tick, 1000);
  }
  async function sendCode(errId) {
    var r = await post('/email/send', { email: email });
    if (!r.ok) {
      if (r.data.retryAfter) startResend(r.data.retryAfter);
      err(errId, r.data.error || 'No se pudo enviar el código.'); return false;
    }
    if (r.data.devCode) console.info('[dev] código:', r.data.devCode);
    startResend(r.data.resendIn || 30);
    return true;
  }
  $('b-email').onclick = async function () {
    clear(); var v = $('i-email').value.trim().toLowerCase();
    if (!EMAIL.test(v)) return err('e-email', 'Ingresa un correo válido.');
    var b = this; b.disabled = true;
    try { email = v; if (await sendCode('e-email')) { $('t-code').textContent = 'Escribe el código de 6 dígitos que enviamos a ' + email + '.'; $('i-code').value = ''; show('s-code'); $('i-code').focus(); } }
    catch (e) { err('e-email', 'No se pudo conectar con el servidor.'); } finally { b.disabled = false; }
  };
  $('b-code').onclick = async function () {
    clear(); var c = $('i-code').value.trim();
    if (!/^\\d{6}$/.test(c)) return err('e-code', 'El código es de 6 dígitos.');
    var b = this; b.disabled = true;
    try {
      var r = await post('/email/verify', { email: email, code: c });
      if (!r.ok) return err('e-code', r.data.error || 'No se pudo verificar el código.');
      if (r.data.exists) return done(r.data);
      signup = r.data.signupToken; show('s-name'); $('i-name').focus();
    } catch (e) { err('e-code', 'No se pudo conectar con el servidor.'); } finally { b.disabled = false; }
  };
  $('b-name').onclick = async function () {
    clear(); var n = $('i-name').value.trim();
    if (!n) return err('e-name', 'Dinos tu nombre.');
    var b = this; b.disabled = true;
    try {
      var r = await post('/email/register', { signupToken: signup, name: n, phone: $('i-phone').value.trim(), accountType: 'client' });
      if (!r.ok) return err('e-name', r.data.error || 'No se pudo crear la cuenta.');
      done(r.data);
    } catch (e) { err('e-name', 'No se pudo conectar con el servidor.'); } finally { b.disabled = false; }
  };
  /* Google y Apple: crean la cuenta de cliente o entran (2026-10-11). */
  var GOOGLE_ID = ${JSON.stringify(googleClientId)}, APPLE_ID = ${JSON.stringify(appleClientId)};
  async function social(path, body) {
    clear();
    try {
      var r = await post(path, Object.assign({ accountType: 'client' }, body));
      if (!r.ok) return err('e-email', r.data.error || 'No se pudo iniciar sesión.');
      done(r.data);
    } catch (e) { err('e-email', 'No se pudo conectar con el servidor.'); }
  }
  function disableSocial(id, name) { var b = $(id); b.disabled = true; b.querySelector('.lbl').innerHTML = 'Continuar con ' + name + ' <span class="soon">Próximamente</span>'; }
  window.addEventListener('load', function () {
    if (GOOGLE_ID && window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({ client_id: GOOGLE_ID, callback: function (resp) { social('/google', { idToken: resp.credential }); }, ux_mode: 'popup' });
    } else disableSocial('b-google', 'Google');
    if (APPLE_ID && window.AppleID) {
      AppleID.auth.init({ clientId: APPLE_ID, scope: 'name email', redirectURI: window.location.origin + API.replace('/api/auth', '') + '/', usePopup: true });
    } else disableSocial('b-apple', 'Apple');
  });
  $('b-google').onclick = function () { if (GOOGLE_ID && window.google) google.accounts.id.prompt(); };
  $('b-apple').onclick = async function () {
    if (!APPLE_ID || !window.AppleID) return;
    try {
      var res = await AppleID.auth.signIn();
      var name = res.user && res.user.name ? [res.user.name.firstName, res.user.name.lastName].filter(Boolean).join(' ') : null;
      await social('/apple', { idToken: res.authorization.id_token, name: name });
    } catch (e) { if (!e || e.error !== 'popup_closed_by_user') err('e-email', 'No se pudo iniciar sesión con Apple.'); }
  };
  $('b-resend').onclick = async function () { clear(); var b = this; b.disabled = true; try { if (await sendCode('e-code')) err('e-code', 'Te enviamos un código nuevo.', true); } catch (e) { b.disabled = false; err('e-code', 'No se pudo conectar con el servidor.'); } };
  $('b-change').onclick = function () { clear(); show('s-email'); $('i-email').focus(); };
  $('i-email').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('b-email').click(); });
  $('i-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('b-code').click(); });
  $('i-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('b-name').click(); });
})();
</script>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Bukea para clientes. Regístrate o inicia sesión',
    description: 'Crea una cuenta o inicia sesión para reservar y gestionar tus citas en Bukea.',
    canonicalPath: 'https://www.bukeard.com/entrar/cliente',
    bodyHtml: body,
  }));
});

router.get('/cuenta', async (req, res) => {
  const base = req.baseUrlPrefix;
  const body = `${ENTRAR_STYLE}
<div class="cta-wrap" id="cta-root" hidden>
  <div class="cta-head">
    <div><h1 class="cta-hello" id="cta-hello">Mi cuenta</h1><p id="cta-email"></p></div>
    <button class="cta-out" type="button" id="cta-out">Cerrar sesión</button>
  </div>
  <div class="ent-error" id="cta-err"></div>
  <div id="cta-owner" hidden class="cta-empty">Tu cuenta es de negocio. <a href="${PORTAL_URL}">Ir a Mi Negocio</a></div>
  <h2 class="cta-sec">Próximas citas</h2>
  <div id="cta-next"></div>
  <h2 class="cta-sec">Anteriores</h2>
  <div id="cta-past"></div>
</div>
<script>
(function () {
  var BASE = ${JSON.stringify(base)};
  var session; try { session = JSON.parse(localStorage.getItem('bukea_session')); } catch (e) { session = null; }
  if (!session || !session.token) { location.replace('/entrar/cliente'); return; }
  var H = { Authorization: 'Bearer ' + session.token };
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function money(c) { return 'RD$' + (Number(c || 0) / 100).toLocaleString('es-DO'); }
  function logout() { localStorage.removeItem('bukea_session'); location.href = '/'; }
  $('cta-out').onclick = logout;

  function card(b) {
    var c = el('div', 'cta-appt');
    var left = el('div');
    left.appendChild(el('h3', '', b.serviceName));
    left.appendChild(el('div', 'meta', (b.businessName || b.professionalName) + (b.neighborhood ? ' · ' + b.neighborhood : '')));
    left.appendChild(el('div', 'when', b.dayLabel + ', ' + b.timeLabel + ' · ' + money(b.priceCents)));
    c.appendChild(left);
    var cancelled = b.status === 'cancelled';
    c.appendChild(el('span', 'chip-st' + (cancelled || b.isPast ? ' off' : ''), cancelled ? 'Cancelada' : (b.isPast ? 'Completada' : 'Confirmada')));
    var act = el('div', 'cta-actions');
    var see = el('a', '', 'Ver negocio'); see.href = '/' + encodeURIComponent(b.professionalSlug); act.appendChild(see);
    if (!cancelled && !b.isPast) {
      var cb = el('button', 'danger', 'Cancelar cita'); cb.type = 'button';
      cb.onclick = async function () {
        if (!confirm('¿Cancelar esta cita?')) return;
        cb.disabled = true;
        var r = await fetch(BASE + '/api/bookings/' + b.id + '/cancel', { method: 'POST', headers: H });
        if (r.ok) load(); else { cb.disabled = false; var d = await r.json().catch(function () { return {}; }); var e = $('cta-err'); e.textContent = d.error || 'No se pudo cancelar la cita.'; e.style.display = 'block'; }
      };
      act.appendChild(cb);
    }
    c.appendChild(act);
    return c;
  }
  function empty(msg, withCta) {
    var d = el('div', 'cta-empty', msg);
    if (withCta) { var a = el('a', '', 'Explorar negocios'); a.href = '/'; d.appendChild(el('br')); d.appendChild(a); }
    return d;
  }
  async function load() {
    var s = await fetch(BASE + '/api/auth/session', { headers: H });
    if (s.status === 401) return logout();
    var me = await s.json().catch(function () { return {}; });
    $('cta-hello').textContent = 'Hola, ' + ((me.name || session.name || '').split(' ')[0] || 'bienvenido');
    $('cta-email').textContent = me.email || session.email || '';
    if (me.accountType === 'owner') $('cta-owner').hidden = false;
    var r = await fetch(BASE + '/api/bookings/me', { headers: H });
    var list = r.ok ? await r.json() : [];
    var next = list.filter(function (b) { return !b.isPast && b.status !== 'cancelled'; }).reverse();
    var past = list.filter(function (b) { return b.isPast || b.status === 'cancelled'; });
    var n = $('cta-next'), p = $('cta-past'); n.textContent = ''; p.textContent = '';
    if (next.length) next.forEach(function (b) { n.appendChild(card(b)); }); else n.appendChild(empty('Aún no tienes citas próximas.', true));
    if (past.length) past.forEach(function (b) { p.appendChild(card(b)); }); else p.appendChild(empty('Cuando completes una cita, aparecerá aquí.'));
    $('cta-root').hidden = false;
  }
  load().catch(function () { var e = $('cta-err'); e.textContent = 'No se pudo cargar tu cuenta. Intenta de nuevo.'; e.style.display = 'block'; $('cta-root').hidden = false; });
})();
</script>`;
  res.type('html').send(await pageShell({
    base,
    title: 'Mi cuenta. Bukea',
    description: 'Tus citas en Bukea.',
    canonicalPath: 'https://www.bukeard.com/cuenta',
    bodyHtml: body,
  }));
});

module.exports = router;
