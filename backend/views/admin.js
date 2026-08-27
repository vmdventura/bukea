// Panel de administración general (/admin) — Fase 1 del concepto: dashboard,
// usuarios, negocios y reservas, operables desde una sola pantalla. Vive
// fuera de BASE (como el marketplace público) porque es una herramienta
// operativa separada de la app de clientes/negocios, con su propio login
// (teléfono+PIN de una cuenta con role = 'admin', ver routes/admin.js).
// No indexable, sin JS de framework: un único archivo con fetch() al API.

function adminShell() {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel de administración. Bukea</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#002626">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --teal-900: oklch(24% 0.045 195);
    --teal-800: oklch(30% 0.055 195);
    --teal-700: oklch(37% 0.075 195);
    --teal-600: oklch(46% 0.09 195);
    --teal-500: oklch(55% 0.095 195);
    --teal-100: oklch(93% 0.035 195);
    --teal-50:  oklch(97% 0.018 195);
    --gold-700: oklch(48% 0.11 68);
    --gold-100: oklch(94% 0.05 78);
    --good: oklch(52% 0.13 150);
    --good-100: oklch(94% 0.045 150);
    --danger: oklch(55% 0.18 25);
    --danger-100: oklch(94% 0.04 25);
    --ink:  oklch(21% 0.02 200);
    --soft: oklch(44% 0.028 200);
    --faint: oklch(58% 0.02 200);
    --bg:   oklch(97% 0.01 195);
    --card: oklch(99% 0.004 195);
    --line: oklch(89% 0.014 195);
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --sh-2: 0 4px 14px rgba(15,40,38,0.07);
    --sh-3: 0 14px 34px rgba(15,40,38,0.14);
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; font-family: "Plus Jakarta Sans", system-ui, sans-serif; background: var(--bg); color: var(--ink); font-size: 14.5px; }
  h1, h2, h3 { font-family: "Fraunces", Georgia, serif; margin: 0; }
  a { color: inherit; }
  button, input, select { font-family: inherit; font-size: inherit; }
  .icon { width: 17px; height: 17px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
    outline: 2.5px solid var(--teal-600); outline-offset: 2px; border-radius: 4px;
  }

  .btn { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 999px; padding: 0.6rem 1.1rem; font-weight: 700; font-size: 0.86rem; text-decoration: none; border: none; cursor: pointer; transition: transform 140ms var(--ease), background 140ms var(--ease); white-space: nowrap; }
  .btn:hover { transform: translateY(-1px); }
  .btn:disabled { opacity: 0.5; cursor: default; transform: none; }
  .btn-primary { background: var(--teal-600); color: #fff; }
  .btn-primary:hover { background: var(--teal-700); }
  .btn-ghost { background: var(--card); color: var(--teal-700); border: 1.5px solid var(--line); }
  .btn-ghost:hover { border-color: var(--teal-500); }
  .btn-danger { background: var(--danger-100); color: var(--danger); }
  .btn-danger:hover { background: oklch(90% 0.06 25); }
  .btn-sm { padding: 0.42rem 0.85rem; font-size: 0.78rem; }

  /* ===== Login ===== */
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: linear-gradient(160deg, oklch(26% 0.05 195), var(--teal-900) 75%); }
  .auth-card { width: 100%; max-width: 380px; background: var(--card); border-radius: 22px; box-shadow: var(--sh-3); padding: 2.2rem 2rem; }
  .auth-brand { display: flex; align-items: center; gap: 0.5rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.25rem; color: var(--teal-900); margin-bottom: 0.3rem; }
  .auth-brand .mark { width: 32px; height: 32px; border-radius: 9px; background: var(--teal-600); color: #fff; display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; }
  .auth-sub { color: var(--soft); font-size: 0.86rem; margin: 0 0 1.5rem; }
  .field { margin-bottom: 1rem; }
  .field label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--soft); margin-bottom: 0.35rem; }
  .field input, .field select { width: 100%; padding: 0.7rem 0.85rem; border-radius: 11px; border: 1.5px solid var(--line); background: var(--bg); color: var(--ink); }
  .field input:focus, .field select:focus { outline: none; border-color: var(--teal-500); box-shadow: 0 0 0 4px rgba(15,133,131,0.14); }
  .auth-error { color: var(--danger); font-size: 0.82rem; margin: 0 0 0.9rem; display: none; }
  #login-form .btn { width: 100%; justify-content: center; padding: 0.75rem; }

  /* ===== App shell ===== */
  #app-screen { display: none; }
  .app { display: flex; min-height: 100vh; }
  aside { width: 226px; flex: none; background: var(--teal-900); color: rgba(255,255,255,0.72); display: flex; flex-direction: column; padding: 20px 12px; position: sticky; top: 0; height: 100vh; }
  .logo { font-family: "Fraunces", serif; font-weight: 700; font-size: 22px; color: #fff; padding: 4px 12px 2px; }
  .logo small { display: block; font-family: "Plus Jakarta Sans", sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold-100); margin-top: 3px; }
  nav { margin-top: 24px; display: flex; flex-direction: column; gap: 2px; }
  .navlabel { font-size: 10px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.32); padding: 16px 12px 6px; }
  nav button { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: 0; color: inherit; font-weight: 600; padding: 9px 12px; border-radius: 9px; cursor: pointer; text-align: left; }
  nav button:hover { background: rgba(255,255,255,0.08); color: #fff; }
  nav button.active { background: var(--teal-600); color: #fff; }
  nav button.soon { opacity: 0.4; cursor: default; }
  nav button.soon:hover { background: none; color: inherit; }
  nav button .tag { margin-left: auto; font-size: 9px; font-weight: 700; background: rgba(255,255,255,0.14); border-radius: 999px; padding: 2px 7px; }
  .adminfoot { margin-top: auto; display: flex; align-items: center; gap: 9px; padding: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
  .adminfoot .dot { width: 30px; height: 30px; border-radius: 100px; background: var(--gold-100); color: var(--gold-700); display: grid; place-items: center; font-weight: 800; font-size: 12px; flex: none; }
  .adminfoot b { color: #fff; font-size: 12.5px; display: block; line-height: 1.2; }
  .adminfoot button { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 11px; cursor: pointer; padding: 0; text-decoration: underline; }

  .main { flex: 1; min-width: 0; padding: 26px 30px 60px; }
  .topbar { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
  .topbar h1 { font-size: 24px; font-weight: 600; }
  .topbar .sub { color: var(--faint); font-size: 12.5px; margin-top: 3px; }
  .topbar .spacer { flex: 1; }
  .search { display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 8px 12px; width: min(280px, 100%); color: var(--faint); }
  .search input { border: 0; background: none; color: var(--ink); outline: none; width: 100%; }

  .view { display: none; }
  .view.active { display: block; }

  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 20px; }
  .kpi { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; box-shadow: var(--sh-2); }
  .kpi .klabel { font-size: 11.5px; font-weight: 700; color: var(--faint); letter-spacing: 0.03em; text-transform: uppercase; }
  .kpi b { display: block; font-family: "Fraunces", serif; font-size: 28px; font-weight: 600; margin: 4px 0 2px; font-variant-numeric: tabular-nums; color: var(--teal-800); }
  .kpi span.d { font-size: 12px; color: var(--faint); }

  .grid2 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 14px; margin-bottom: 20px; }
  @media (max-width: 980px) { .grid2 { grid-template-columns: 1fr; } }
  .panel { background: var(--card); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--sh-2); padding: 18px 20px; }
  .panel h2 { font-size: 14.5px; font-weight: 700; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
  .panel h2 .icon { color: var(--teal-600); }
  .panel .phint { font-size: 12px; color: var(--faint); margin: 0 0 14px; }
  .chart svg { width: 100%; height: 150px; display: block; }

  .alerts { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
  .alert { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 9px; font-size: 13px; background: var(--gold-100); color: var(--gold-700); }
  .alert svg { width: 16px; height: 16px; flex: none; margin-top: 1px; }
  .alert b { display: block; }
  .alert span { opacity: 0.82; font-size: 12px; }
  .alert.empty { background: var(--good-100); color: var(--good); }

  /* ===== Soporte (chat con dueños de negocio) ===== */
  .support-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; align-items: start; height: calc(100vh - 140px); }
  .support-threadlist { padding: 8px; overflow-y: auto; height: 100%; }
  .support-thread-item { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: 0; padding: 10px; border-radius: 10px; cursor: pointer; text-align: left; color: inherit; }
  .support-thread-item:hover { background: var(--teal-50); }
  .support-thread-item.active { background: var(--teal-100); }
  .support-thread-item .stmeta { flex: 1; min-width: 0; }
  .support-thread-item b { display: block; font-size: 13px; }
  .support-thread-item small { display: block; color: var(--faint); font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .support-thread-item .stbadge { flex: none; background: var(--danger); color: #fff; font-size: 10px; font-weight: 800; border-radius: 999px; min-width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; padding: 0 5px; }
  .support-thread { display: flex; flex-direction: column; height: 100%; padding: 0; overflow: hidden; }
  .support-thread-head { padding: 14px 18px; border-bottom: 1px solid var(--line); flex: none; }
  .support-thread-head b { display: block; font-size: 14px; }
  .support-thread-head small { color: var(--faint); }
  .support-msgs { flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
  .support-msg { max-width: 72%; padding: 9px 13px; border-radius: 14px; font-size: 13px; line-height: 1.45; white-space: pre-wrap; }
  .support-msg.user { align-self: flex-start; background: var(--teal-50); border-bottom-left-radius: 4px; }
  .support-msg.admin { align-self: flex-end; background: var(--teal-600); color: #fff; border-bottom-right-radius: 4px; }
  .support-msg time { display: block; font-size: 10px; opacity: 0.6; margin-top: 3px; }
  .support-reply { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line); flex: none; }
  .support-reply textarea { flex: 1; resize: none; min-height: 40px; max-height: 100px; border: 1.5px solid var(--line); border-radius: 12px; padding: 9px 12px; font: inherit; font-size: 13px; }
  .support-reply textarea:focus { outline: none; border-color: var(--teal-500); }

  .tablewrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); padding: 8px 12px 8px 0; border-bottom: 1px solid var(--line); white-space: nowrap; }
  td { padding: 10px 12px 10px 0; border-bottom: 1px solid var(--line); vertical-align: middle; white-space: nowrap; }
  tbody tr:last-child td { border-bottom: 0; }
  tbody tr:hover td { background: var(--teal-50); }
  td .who { display: flex; align-items: center; gap: 9px; white-space: normal; }
  .dot { width: 28px; height: 28px; border-radius: 100px; flex: none; display: grid; place-items: center; font-weight: 800; font-size: 11px; background: var(--teal-100); color: var(--teal-700); }
  td .who b { display: block; line-height: 1.25; }
  td .who small { color: var(--faint); font-size: 11.5px; }
  td.num { font-variant-numeric: tabular-nums; }

  .chip { display: inline-block; font-size: 10.5px; font-weight: 700; border-radius: 999px; padding: 3px 9px; }
  .chip.ok { background: var(--good-100); color: var(--good); }
  .chip.off { background: var(--danger-100); color: var(--danger); }
  .chip.mid { background: var(--gold-100); color: var(--gold-700); }
  .chip.teal { background: var(--teal-100); color: var(--teal-700); }

  .rowactions { display: flex; gap: 5px; }
  .iconbtn { background: none; border: 1px solid var(--line); border-radius: 7px; padding: 5px 6px; cursor: pointer; color: var(--soft); display: grid; place-items: center; }
  .iconbtn:hover { border-color: var(--teal-500); color: var(--teal-700); }
  .iconbtn svg { width: 14px; height: 14px; }

  .filters { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; }
  .f { background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 6px 13px; font-size: 12px; font-weight: 700; color: var(--soft); cursor: pointer; }
  .f.on { background: var(--teal-600); border-color: var(--teal-600); color: #fff; }

  .empty-state { text-align: center; padding: 2.4rem 1rem; color: var(--faint); font-size: 13px; }

  /* ===== Modal ===== */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(10,25,24,0.5); display: none; align-items: flex-start; justify-content: center; padding: 5vh 16px; overflow-y: auto; z-index: 100; }
  .modal-backdrop.open { display: flex; }
  .modal { width: 100%; max-width: 560px; background: var(--card); border-radius: 18px; box-shadow: var(--sh-3); padding: 1.6rem 1.7rem; margin-bottom: 5vh; }
  .modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
  .modal-head h2 { font-size: 1.2rem; }
  .modal-close { background: none; border: none; cursor: pointer; color: var(--faint); padding: 4px; border-radius: 8px; }
  .modal-close:hover { color: var(--ink); background: var(--teal-50); }
  .modal-section { margin-bottom: 1.2rem; }
  .modal-section h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--faint); margin: 0 0 0.6rem; }
  .kv { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem 1rem; font-size: 13px; }
  .kv div b { display: block; font-size: 10.5px; color: var(--faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .mini-table { width: 100%; font-size: 12.5px; border-collapse: collapse; }
  .mini-table td { padding: 6px 8px 6px 0; border-bottom: 1px solid var(--line); }
  .modal-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.4rem; }
  .modal-msg { font-size: 12.5px; padding: 0.6rem 0.8rem; border-radius: 9px; margin: 0 0 1rem; display: none; }
  .modal-msg.show.ok { display: block; background: var(--good-100); color: var(--good); }
  .modal-msg.show.err { display: block; background: var(--danger-100); color: var(--danger); }
  .inline-form { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-end; margin-top: 0.6rem; }
  .inline-form .field { margin-bottom: 0; flex: 1; min-width: 140px; }

  @media (max-width: 780px) {
    .app { flex-direction: column; }
    aside { width: 100%; height: auto; position: static; flex-direction: row; align-items: center; padding: 12px 14px; overflow-x: auto; }
    .logo small { display: none; }
    nav { margin: 0 0 0 10px; flex-direction: row; }
    .navlabel, .adminfoot { display: none; }
    nav button .tag { display: none; }
    nav button { padding: 8px 10px; white-space: nowrap; }
    .main { padding: 18px 16px 50px; }
  }
</style>
</head>
<body>

<div class="auth-wrap" id="login-screen">
  <div class="auth-card">
    <div class="auth-brand"><span class="mark">b</span>Bukea</div>
    <p class="auth-sub">Panel de administración general. Solo cuentas autorizadas.</p>
    <p class="auth-error" id="login-error"></p>
    <form id="login-form">
      <div class="field">
        <label for="login-phone">Teléfono</label>
        <input type="tel" id="login-phone" placeholder="809 555 0134" autocomplete="username" required>
      </div>
      <div class="field">
        <label for="login-pin">PIN</label>
        <input type="password" id="login-pin" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="current-password" required>
      </div>
      <button class="btn btn-primary" type="submit" id="login-submit">Entrar</button>
    </form>
  </div>
</div>

<div class="app" id="app-screen">
  <aside>
    <div class="logo">Bukea<small>Admin general</small></div>
    <nav aria-label="Módulos">
      <button class="navbtn active" data-view="dash">
        <svg class="icon" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        Dashboard
      </button>
      <button class="navbtn" data-view="users">
        <svg class="icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Usuarios
      </button>
      <button class="navbtn" data-view="biz">
        <svg class="icon" viewBox="0 0 24 24"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
        Negocios
      </button>
      <button class="navbtn" data-view="bookings">
        <svg class="icon" viewBox="0 0 24 24"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
        Reservas
      </button>
      <div class="navlabel">Fase 2</div>
      <button class="navbtn" data-view="moderation">
        <svg class="icon" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
        Moderación
      </button>
      <button class="navbtn" data-view="metrics">
        <svg class="icon" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
        Métricas
      </button>
      <button class="navbtn" data-view="communication">
        <svg class="icon" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        Comunicación
      </button>
      <button class="navbtn" data-view="support">
        <svg class="icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        Soporte<span class="tag" id="support-navtag" style="display:none"></span>
      </button>
      <button class="navbtn" data-view="settings">
        <svg class="icon" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        Configuración
      </button>
    </nav>
    <div class="adminfoot">
      <div class="dot" id="admin-initial">A</div>
      <div style="flex:1;min-width:0">
        <b id="admin-name">Admin</b>
        <button id="logout-btn" type="button">Cerrar sesión</button>
      </div>
    </div>
  </aside>

  <div class="main">

    <!-- Dashboard -->
    <section class="view active" id="view-dash">
      <div class="topbar">
        <div><h1>Dashboard</h1><div class="sub" id="dash-date"></div></div>
      </div>
      <div class="kpis" id="dash-kpis"><div class="empty-state">Cargando…</div></div>
      <div class="grid2">
        <div class="panel">
          <h2><svg class="icon" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>Reservas por día</h2>
          <p class="phint">Últimos 30 días, confirmadas.</p>
          <div class="chart" id="dash-chart"></div>
        </div>
        <div class="panel">
          <h2><svg class="icon" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>Requiere atención</h2>
          <p class="phint">Alertas operativas de hoy.</p>
          <div class="alerts" id="dash-alerts"></div>
        </div>
      </div>
      <div class="panel">
        <h2><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Actividad reciente</h2>
        <p class="phint">Últimas reservas y registros.</p>
        <div class="tablewrap" id="dash-activity"></div>
      </div>
    </section>

    <!-- Usuarios -->
    <section class="view" id="view-users">
      <div class="topbar">
        <div><h1>Usuarios</h1><div class="sub" id="users-count"></div></div>
        <div class="spacer"></div>
        <label class="search"><svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input type="text" id="users-search" placeholder="Nombre, teléfono o email"></label>
        <button class="btn btn-ghost" id="users-export-btn">Exportar CSV</button>
      </div>
      <div class="filters" id="users-filters">
        <button class="f on" data-provider="">Todos</button>
        <button class="f" data-provider="phone">Teléfono y PIN</button>
        <button class="f" data-provider="google">Google</button>
        <button class="f" data-provider="apple">Apple</button>
      </div>
      <div class="panel"><div class="tablewrap" id="users-table"><div class="empty-state">Cargando…</div></div></div>
    </section>

    <!-- Negocios -->
    <section class="view" id="view-biz">
      <div class="topbar">
        <div><h1>Negocios</h1><div class="sub" id="biz-count"></div></div>
        <div class="spacer"></div>
        <label class="search"><svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input type="text" id="biz-search" placeholder="Nombre, negocio o sector"></label>
        <button class="btn btn-ghost" id="biz-export-btn">Exportar CSV</button>
        <button class="btn btn-primary" id="biz-create-btn"><svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></svg>Crear negocio</button>
      </div>
      <div class="filters" id="biz-filters">
        <button class="f on" data-filter="">Todos</button>
        <button class="f" data-filter="no-owner">Sin dueño real</button>
        <button class="f" data-filter="no-hours">Sin horario</button>
        <button class="f" data-filter="no-coords">Sin ubicación</button>
        <button class="f" data-filter="hidden">Ocultos</button>
      </div>
      <div class="panel"><div class="tablewrap" id="biz-table"><div class="empty-state">Cargando…</div></div></div>
    </section>

    <!-- Reservas -->
    <section class="view" id="view-bookings">
      <div class="topbar">
        <div><h1>Reservas</h1><div class="sub" id="bookings-count"></div></div>
        <div class="spacer"></div>
        <label class="search"><svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input type="text" id="bookings-search" placeholder="Cliente o negocio"></label>
        <button class="btn btn-ghost" id="bookings-export-btn">Exportar CSV</button>
      </div>
      <div class="filters" id="bookings-filters">
        <button class="f on" data-status="" data-range="">Todas</button>
        <button class="f" data-status="" data-range="today">Hoy</button>
        <button class="f" data-status="" data-range="week">Esta semana</button>
        <button class="f" data-status="confirmed" data-range="">Confirmadas</button>
        <button class="f" data-status="cancelled" data-range="">Canceladas</button>
      </div>
      <div class="panel"><div class="tablewrap" id="bookings-table"><div class="empty-state">Cargando…</div></div></div>
    </section>

    <!-- Moderación -->
    <section class="view" id="view-moderation">
      <div class="topbar"><div><h1>Moderación</h1><div class="sub">Cuentas bancarias y comprobantes de pago</div></div></div>

      <div class="panel" style="margin-bottom:20px">
        <h2><svg class="icon" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Cuentas bancarias</h2>
        <p class="phint">Revisa que el titular y la cédula/RNC coincidan con el negocio antes de marcarlas como verificadas. Se publican igual mientras tanto, solo cambia el badge que ve el cliente.</p>
        <div class="filters" id="bank-filters">
          <button class="f on" data-filter="">Todas</button>
          <button class="f" data-filter="unverified">Sin verificar</button>
          <button class="f" data-filter="verified">Verificadas</button>
        </div>
        <div class="tablewrap" id="bank-table"><div class="empty-state">Cargando…</div></div>
      </div>

      <div class="panel">
        <h2><svg class="icon" viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>Comprobantes de pago</h2>
        <p class="phint">Últimos 100 comprobantes subidos por clientes.</p>
        <div class="tablewrap" id="receipts-table"><div class="empty-state">Cargando…</div></div>
      </div>
    </section>

    <!-- Métricas -->
    <section class="view" id="view-metrics">
      <div class="topbar"><div><h1>Métricas</h1><div class="sub">Crecimiento, activación y retención</div></div></div>

      <div class="kpis" id="metrics-kpis"><div class="empty-state">Cargando…</div></div>

      <div class="grid2">
        <div class="panel">
          <h2><svg class="icon" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>Crecimiento semanal</h2>
          <p class="phint">Usuarios (teal) y negocios (dorado) nuevos, últimas 12 semanas.</p>
          <div class="chart" id="metrics-chart"></div>
        </div>
        <div class="panel">
          <h2><svg class="icon" viewBox="0 0 24 24"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>Por categoría</h2>
          <p class="phint">Negocios y reservas confirmadas.</p>
          <div class="tablewrap" id="metrics-category"></div>
        </div>
      </div>

      <div class="grid2">
        <div class="panel">
          <h2><svg class="icon" viewBox="0 0 24 24"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.55 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>Top sectores</h2>
          <p class="phint">Reservas confirmadas por sector.</p>
          <div class="tablewrap" id="metrics-sector"></div>
        </div>
        <div class="panel">
          <h2><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Top negocios del mes</h2>
          <p class="phint">Volumen agendado y tasa de cancelación.</p>
          <div class="tablewrap" id="metrics-top-businesses"></div>
        </div>
      </div>
    </section>

    <!-- Comunicación -->
    <section class="view" id="view-communication">
      <div class="topbar"><div><h1>Comunicación</h1><div class="sub">Canales, mensajes de prueba y registro de envíos</div></div></div>

      <div class="kpis" id="comm-status"><div class="empty-state">Cargando…</div></div>

      <div class="panel">
        <h2><svg class="icon" viewBox="0 0 24 24"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>Registro de envíos</h2>
        <p class="phint">Últimos 50 mensajes manuales enviados desde el panel. Para escribirle a un usuario, entra a su ficha en Usuarios.</p>
        <div class="tablewrap" id="comm-log"><div class="empty-state">Cargando…</div></div>
      </div>
    </section>

    <!-- Soporte -->
    <section class="view" id="view-support">
      <div class="topbar"><div><h1>Soporte</h1><div class="sub">Chats con dueños de negocio que escriben desde "Mi negocio"</div></div></div>
      <div class="support-layout">
        <div class="panel support-threadlist" id="support-threads"><div class="empty-state">Cargando…</div></div>
        <div class="panel support-thread" id="support-thread">
          <div class="empty-state">Elige un chat de la lista para verlo aquí.</div>
        </div>
      </div>
    </section>

    <!-- Configuración -->
    <section class="view" id="view-settings">
      <div class="topbar"><div><h1>Configuración</h1><div class="sub">Parámetros de la plataforma, sin deploy</div></div></div>

      <div class="panel" style="margin-bottom:20px;max-width:560px">
        <h2><svg class="icon" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>Banner del marketplace</h2>
        <p class="phint">Aviso corto arriba del sitio público (bukeard.com). Para mantenimiento o promociones del piloto.</p>
        <p class="modal-msg" id="settings-banner-msg"></p>
        <div class="field"><label><input type="checkbox" id="settings-banner-enabled" style="width:auto;margin-right:6px">Mostrar banner</label></div>
        <div class="field"><label>Texto</label><input type="text" id="settings-banner-text" maxlength="280" placeholder="Bukea estará en mantenimiento el domingo de 2am a 4am"></div>
        <button class="btn btn-primary btn-sm" id="settings-banner-save">Guardar banner</button>
      </div>

      <div class="panel" style="max-width:560px">
        <h2><svg class="icon" viewBox="0 0 24 24"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>Parámetros de reserva</h2>
        <p class="phint">Aplican a toda la plataforma, en la próxima consulta de disponibilidad.</p>
        <p class="modal-msg" id="settings-booking-msg"></p>
        <div class="kv" style="margin-bottom:0.8rem">
          <div class="field"><label>Colchón mínimo de antelación (min)</label><input type="number" id="settings-buffer" min="0" max="240"></div>
          <div class="field"><label>Tamaño de slot (min)</label><input type="number" id="settings-slot" min="5" max="60"></div>
        </div>
        <button class="btn btn-primary btn-sm" id="settings-booking-save">Guardar parámetros</button>
      </div>

      <p class="phint" style="max-width:560px;margin-top:1rem">Categorías de negocio y listas de bancos se quedan fijas en el código por ahora: cada categoría nueva necesita también un ícono propio, así que editarlas de verdad es un cambio de código, no de datos.</p>
    </section>

  </div>
</div>

<div class="modal-backdrop" id="modal-backdrop">
  <div class="modal" id="modal-content"></div>
</div>

<script>
(function () {
  'use strict';
  var API = '/api/admin';
  var TOKEN_KEY = 'bukea_admin_token';
  var NAME_KEY = 'bukea_admin_name';
  var CATS = { barberia: 'Barbería', unas: 'Uñas', salon: 'Salón', maquillaje: 'Maquillaje', 'cejas-mua': 'Cejas & MUA', pilates: 'Pilates' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function initials(name) {
    var words = String(name || '').split(/\\s+/).filter(Boolean);
    if (!words.length) return '?';
    return words.length === 1 ? words[0][0].toUpperCase() : (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  function money(cents) { return 'RD$ ' + Math.round((cents || 0) / 100).toLocaleString('es-DO'); }
  function fmtDateTime(v) {
    if (!v) return '—';
    var d = new Date(v.replace(' ', 'T'));
    if (isNaN(d)) return v;
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' });
  }
  function fmtDate(v) {
    if (!v) return '—';
    var d = new Date(v.replace(' ', 'T'));
    if (isNaN(d)) return v;
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

  function getToken() { return localStorage.getItem(TOKEN_KEY); }

  function downloadCsv(path, filename) {
    fetch(API + path, { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo exportar');
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(function (err) { alert(err.message); });
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { Authorization: 'Bearer ' + getToken() };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (res) {
      if (res.status === 404 && path !== '/login') {
        logout();
        throw new Error('Tu sesión expiró, entra de nuevo');
      }
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Algo salió mal');
        return data;
      });
    });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  }

  /* ===== Login ===== */
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = document.getElementById('login-phone').value;
    var pin = document.getElementById('login-pin').value;
    var submitBtn = document.getElementById('login-submit');
    loginError.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';
    fetch(API + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone, pin: pin }) })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) {
        if (!r.ok) { throw new Error(r.data.error || 'No se pudo entrar'); }
        localStorage.setItem(TOKEN_KEY, r.data.token);
        localStorage.setItem(NAME_KEY, r.data.name);
        startApp();
      })
      .catch(function (err) {
        loginError.textContent = err.message;
        loginError.style.display = 'block';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
      });
  });
  document.getElementById('logout-btn').addEventListener('click', logout);

  /* ===== Modal ===== */
  var backdrop = document.getElementById('modal-backdrop');
  var modalEl = document.getElementById('modal-content');
  function openModal(html) {
    modalEl.innerHTML = html;
    backdrop.classList.add('open');
  }
  function closeModal() { backdrop.classList.remove('open'); modalEl.innerHTML = ''; }
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  function modalMsg(text, ok) {
    var el = modalEl.querySelector('.modal-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'modal-msg show ' + (ok ? 'ok' : 'err');
  }

  /* ===== Nav ===== */
  var loaders = {};
  document.querySelectorAll('.navbtn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.navbtn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
      var view = btn.dataset.view;
      document.getElementById('view-' + view).classList.add('active');
      window.scrollTo({ top: 0 });
      if (loaders[view]) loaders[view]();
    });
  });

  /* ===== Dashboard ===== */
  function renderChart(daily) {
    var byDate = {};
    daily.forEach(function (d) { byDate[d.date] = d.count; });
    var days = [];
    var today = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(byDate[d.toISOString().slice(0, 10)] || 0);
    }
    var max = Math.max.apply(null, days.concat([1]));
    var W = 600, H = 150, pad = 8;
    var stepX = (W - pad * 2) / (days.length - 1);
    var pts = days.map(function (v, i) {
      var x = pad + i * stepX;
      var y = H - 20 - (v / max) * (H - 40);
      return [x, y];
    });
    var line = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + (H - 20) + ' L' + pts[0][0].toFixed(1) + ',' + (H - 20) + ' Z';
    var last = pts[pts.length - 1];
    document.getElementById('dash-chart').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Reservas por día">' +
      '<line x1="0" y1="' + (H - 20) + '" x2="' + W + '" y2="' + (H - 20) + '" stroke="var(--line)"/>' +
      '<path d="' + esc(area) + '" fill="var(--teal-600)" opacity="0.09"></path>' +
      '<path d="' + esc(line) + '" fill="none" stroke="var(--teal-600)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="4" fill="var(--teal-600)"></circle>' +
      '</svg>';
  }

  function loadDashboard() {
    document.getElementById('dash-date').textContent = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    api('/dashboard').then(function (d) {
      document.getElementById('dash-kpis').innerHTML =
        '<div class="kpi"><span class="klabel">Usuarios</span><b>' + d.kpis.users.total + '</b><span class="d">+' + d.kpis.users.thisWeek + ' esta semana</span></div>' +
        '<div class="kpi"><span class="klabel">Negocios activos</span><b>' + d.kpis.businesses.total + '</b><span class="d">+' + d.kpis.businesses.thisWeek + ' esta semana</span></div>' +
        '<div class="kpi"><span class="klabel">Reservas del mes</span><b>' + d.kpis.bookingsThisMonth + '</b><span class="d">mes en curso</span></div>' +
        '<div class="kpi"><span class="klabel">Volumen agendado</span><b>' + money(d.kpis.volumeCentsThisMonth) + '</b><span class="d">mes a la fecha</span></div>';

      renderChart(d.dailyBookings);

      var alerts = [];
      d.alerts.noHours.forEach(function (p) {
        alerts.push('<div class="alert"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><div><b>' + esc(p.businessName) + '</b><span>Sin horario configurado, todavía no reservable</span></div></div>');
      });
      d.alerts.noCoords.forEach(function (p) {
        alerts.push('<div class="alert"><svg viewBox="0 0 24 24"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.55 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg><div><b>' + esc(p.businessName) + '</b><span>Sin ubicación en el mapa</span></div></div>');
      });
      d.alerts.recentReceipts.forEach(function (r) {
        alerts.push('<div class="alert"><svg viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg><div><b>' + esc(r.clientName) + '</b><span>Comprobante para ' + esc(r.professionalName) + ', ' + fmtDateTime(r.uploadedAt) + '</span></div></div>');
      });
      document.getElementById('dash-alerts').innerHTML = alerts.length ? alerts.join('') : '<div class="alert empty">Todo en orden. Sin alertas por ahora.</div>';

      var rows = d.recentActivity.bookings.map(function (b) {
        var chip = b.status === 'cancelled' ? '<span class="chip off">Cancelada</span>' : '<span class="chip teal">Reserva</span>';
        return '<tr><td>' + chip + '</td><td>' + esc(b.clientName) + ' · ' + esc(b.serviceName) + ' con ' + esc(b.professionalName) + '</td><td>' + fmtDateTime(b.createdAt) + '</td></tr>';
      }).concat(d.recentActivity.users.map(function (u) {
        return '<tr><td><span class="chip ok">Registro</span></td><td>Nueva cuenta: ' + esc(u.name) + '</td><td>' + fmtDateTime(u.createdAt) + '</td></tr>';
      }));
      document.getElementById('dash-activity').innerHTML = rows.length
        ? '<table><thead><tr><th>Evento</th><th>Detalle</th><th>Cuándo</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>'
        : '<div class="empty-state">Sin actividad todavía.</div>';
    }).catch(function (err) { document.getElementById('dash-kpis').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  loaders.dash = loadDashboard;

  /* ===== Usuarios ===== */
  var usersFilter = { q: '', provider: '' };
  function loadUsers() {
    var qs = new URLSearchParams();
    if (usersFilter.q) qs.set('q', usersFilter.q);
    if (usersFilter.provider) qs.set('provider', usersFilter.provider);
    api('/users?' + qs.toString()).then(function (rows) {
      document.getElementById('users-count').textContent = rows.length + ' cuenta' + (rows.length === 1 ? '' : 's');
      if (!rows.length) { document.getElementById('users-table').innerHTML = '<div class="empty-state">No encontramos usuarios con ese filtro.</div>'; return; }
      var providerLabel = { phone: 'Teléfono', google: 'Google', apple: 'Apple' };
      var body = rows.map(function (u) {
        return '<tr>' +
          '<td><div class="who"><div class="dot">' + esc(initials(u.name)) + '</div><div><b>' + esc(u.name) + '</b>' + (u.ownsBusinessSlug ? '<small>Dueño de negocio</small>' : '<small>Cliente</small>') + '</div></div></td>' +
          '<td>' + esc(u.phone || u.email || '—') + '</td>' +
          '<td><span class="chip teal">' + providerLabel[u.provider] + '</span></td>' +
          '<td class="num">' + u.bookingsCount + '</td>' +
          '<td>' + fmtDate(u.createdAt) + '</td>' +
          '<td>' + (u.disabled ? '<span class="chip off">Desactivado</span>' : '<span class="chip ok">Activo</span>') + '</td>' +
          '<td><div class="rowactions">' +
            '<button class="iconbtn" data-user-view="' + u.id + '" title="Ver ficha"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg></button>' +
          '</div></td></tr>';
      }).join('');
      document.getElementById('users-table').innerHTML = '<table><thead><tr><th>Usuario</th><th>Contacto</th><th>Login</th><th>Reservas</th><th>Registro</th><th>Estado</th><th></th></tr></thead><tbody>' + body + '</tbody></table>';
      document.querySelectorAll('[data-user-view]').forEach(function (btn) {
        btn.addEventListener('click', function () { openUserModal(btn.dataset.userView); });
      });
    }).catch(function (err) { document.getElementById('users-table').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  loaders.users = loadUsers;
  document.getElementById('users-search').addEventListener('input', debounce(function (e) { usersFilter.q = e.target.value.trim(); loadUsers(); }, 300));
  document.getElementById('users-filters').addEventListener('click', function (e) {
    var btn = e.target.closest('.f');
    if (!btn) return;
    document.querySelectorAll('#users-filters .f').forEach(function (b) { b.classList.remove('on'); });
    btn.classList.add('on');
    usersFilter.provider = btn.dataset.provider;
    loadUsers();
  });
  document.getElementById('users-export-btn').addEventListener('click', function () {
    var qs = new URLSearchParams({ format: 'csv' });
    if (usersFilter.q) qs.set('q', usersFilter.q);
    if (usersFilter.provider) qs.set('provider', usersFilter.provider);
    downloadCsv('/users?' + qs.toString(), 'usuarios-bukea.csv');
  });

  function openUserModal(id) {
    openModal('<div class="empty-state">Cargando…</div>');
    api('/users/' + id).then(function (u) {
      var bookingsHtml = u.bookings.length
        ? '<table class="mini-table">' + u.bookings.slice(0, 8).map(function (b) {
            var statusChip = b.status === 'cancelled' ? '<span class="chip off">Cancelada</span>' : '<span class="chip ok">Confirmada</span>';
            return '<tr><td>' + esc(b.serviceName) + '</td><td>' + esc(b.professionalName) + '</td><td>' + fmtDateTime(b.appointmentAt || b.createdAt) + '</td><td>' + statusChip + '</td></tr>';
          }).join('') + '</table>'
        : '<p class="phint" style="margin:0">Sin reservas todavía.</p>';
      var ownedHtml = u.ownedBusinesses.length
        ? u.ownedBusinesses.map(function (b) { return '<span class="chip teal">' + esc(b.businessName) + '</span>'; }).join(' ')
        : '';

      openModal(
        '<div class="modal-head"><h2>' + esc(u.name) + '</h2><button class="modal-close" data-close>&times;</button></div>' +
        '<p class="modal-msg"></p>' +
        '<div class="modal-section"><h3>Datos de la cuenta</h3>' +
        '<div class="kv">' +
          '<div><b>Teléfono</b>' + esc(u.phone || '—') + '</div>' +
          '<div><b>Email</b>' + esc(u.email || '—') + '</div>' +
          '<div><b>Login</b>' + esc({phone:'Teléfono y PIN',google:'Google',apple:'Apple'}[u.provider]) + '</div>' +
          '<div><b>Registro</b>' + fmtDate(u.createdAt) + '</div>' +
        '</div></div>' +
        (ownedHtml ? '<div class="modal-section"><h3>Dueño de</h3>' + ownedHtml + '</div>' : '') +
        '<div class="modal-section"><h3>Editar</h3>' +
        '<div class="inline-form">' +
          '<div class="field" style="flex:1.4"><label>Nombre</label><input type="text" id="edit-user-name" value="' + esc(u.name) + '"></div>' +
          '<div class="field" style="flex:1.4"><label>Email</label><input type="email" id="edit-user-email" value="' + esc(u.email || '') + '"></div>' +
          '<button class="btn btn-ghost btn-sm" id="save-user-btn">Guardar</button>' +
        '</div></div>' +
        '<div class="modal-section"><h3>Reservas recientes</h3>' + bookingsHtml + '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost btn-sm" id="reset-pin-btn">Resetear PIN</button>' +
          '<button class="btn ' + (u.disabled ? 'btn-primary' : 'btn-danger') + ' btn-sm" id="toggle-disabled-btn">' + (u.disabled ? 'Reactivar cuenta' : 'Desactivar cuenta') + '</button>' +
        '</div>' +
        '<div class="modal-section"><h3>Enviar mensaje</h3>' +
        '<div class="inline-form" style="align-items:stretch">' +
          '<div class="field" style="flex:0 0 130px"><label>Canal</label><select id="message-channel">' +
            '<option value="whatsapp"' + (!u.phone ? ' disabled' : '') + '>WhatsApp</option>' +
            '<option value="email"' + (!u.email ? ' disabled' : '') + '>Correo</option>' +
          '</select></div>' +
          '<div class="field" style="flex:2"><label>Mensaje</label><input type="text" id="message-text" placeholder="Escribe el mensaje…"></div>' +
          '<button class="btn btn-ghost btn-sm" id="send-message-btn">Enviar</button>' +
        '</div></div>'
      );

      modalEl.querySelector('[data-close]').addEventListener('click', closeModal);
      modalEl.querySelector('#send-message-btn').addEventListener('click', function () {
        var channel = document.getElementById('message-channel').value;
        var text = document.getElementById('message-text').value.trim();
        if (!text) return;
        api('/users/' + id + '/message', { method: 'POST', body: { channel: channel, text: text } })
          .then(function () { modalMsg('Mensaje enviado.', true); document.getElementById('message-text').value = ''; })
          .catch(function (err) { modalMsg(err.message, false); });
      });
      modalEl.querySelector('#save-user-btn').addEventListener('click', function () {
        api('/users/' + id, { method: 'PATCH', body: { name: document.getElementById('edit-user-name').value, email: document.getElementById('edit-user-email').value } })
          .then(function () { modalMsg('Guardado.', true); loadUsers(); })
          .catch(function (err) { modalMsg(err.message, false); });
      });
      modalEl.querySelector('#reset-pin-btn').addEventListener('click', function () {
        if (!confirm('¿Generar un PIN nuevo para ' + u.name + '? Su sesión actual se cerrará.')) return;
        api('/users/' + id + '/reset-pin', { method: 'POST' })
          .then(function (r) { modalMsg('PIN nuevo: ' + r.newPin + '. Compártelo con el usuario, no se volverá a mostrar.', true); })
          .catch(function (err) { modalMsg(err.message, false); });
      });
      modalEl.querySelector('#toggle-disabled-btn').addEventListener('click', function () {
        var verb = u.disabled ? 'reactivar' : 'desactivar';
        if (!confirm('¿Seguro que quieres ' + verb + ' la cuenta de ' + u.name + '?')) return;
        api('/users/' + id + '/toggle-disabled', { method: 'POST' })
          .then(function () { closeModal(); loadUsers(); })
          .catch(function (err) { modalMsg(err.message, false); });
      });
    }).catch(function (err) { openModal('<div class="empty-state">' + esc(err.message) + '</div>'); });
  }

  /* ===== Negocios ===== */
  var bizFilter = { q: '', filter: '' };
  function loadBusinesses() {
    var qs = new URLSearchParams();
    if (bizFilter.q) qs.set('q', bizFilter.q);
    if (bizFilter.filter) qs.set('filter', bizFilter.filter);
    api('/businesses?' + qs.toString()).then(function (rows) {
      document.getElementById('biz-count').textContent = rows.length + ' negocio' + (rows.length === 1 ? '' : 's');
      if (!rows.length) { document.getElementById('biz-table').innerHTML = '<div class="empty-state">No encontramos negocios con ese filtro.</div>'; return; }
      var body = rows.map(function (p) {
        var status = p.hidden ? '<span class="chip off">Oculto</span>'
          : !p.hasOwner ? '<span class="chip mid">Sin reclamar</span>'
          : !p.hasHours ? '<span class="chip mid">Sin horario</span>'
          : '<span class="chip ok">Publicado</span>';
        return '<tr>' +
          '<td><div class="who"><div class="dot">' + esc(initials(p.name)) + '</div><div><b>' + esc(p.businessName) + '</b><small>' + esc(p.name) + '</small></div></div></td>' +
          '<td>' + esc(CATS[p.category] || p.category) + '</td>' +
          '<td>' + esc(p.neighborhood) + '</td>' +
          '<td class="num">' + p.bookingsThisMonth + '</td>' +
          '<td class="num">' + (p.reviewsCount > 0 ? p.rating.toFixed(1) : '—') + '</td>' +
          '<td>' + status + '</td>' +
          '<td><div class="rowactions"><button class="iconbtn" data-biz-view="' + p.id + '" title="Ver ficha"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg></button></div></td>' +
          '</tr>';
      }).join('');
      document.getElementById('biz-table').innerHTML = '<table><thead><tr><th>Negocio</th><th>Categoría</th><th>Sector</th><th>Reservas del mes</th><th>Rating</th><th>Estado</th><th></th></tr></thead><tbody>' + body + '</tbody></table>';
      document.querySelectorAll('[data-biz-view]').forEach(function (btn) {
        btn.addEventListener('click', function () { openBusinessModal(btn.dataset.bizView); });
      });
    }).catch(function (err) { document.getElementById('biz-table').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  loaders.biz = loadBusinesses;
  document.getElementById('biz-search').addEventListener('input', debounce(function (e) { bizFilter.q = e.target.value.trim(); loadBusinesses(); }, 300));
  document.getElementById('biz-filters').addEventListener('click', function (e) {
    var btn = e.target.closest('.f');
    if (!btn) return;
    document.querySelectorAll('#biz-filters .f').forEach(function (b) { b.classList.remove('on'); });
    btn.classList.add('on');
    bizFilter.filter = btn.dataset.filter;
    loadBusinesses();
  });
  document.getElementById('biz-export-btn').addEventListener('click', function () {
    var qs = new URLSearchParams({ format: 'csv' });
    if (bizFilter.q) qs.set('q', bizFilter.q);
    if (bizFilter.filter) qs.set('filter', bizFilter.filter);
    downloadCsv('/businesses?' + qs.toString(), 'negocios-bukea.csv');
  });

  function catOptions(selected) {
    return Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + (k === selected ? ' selected' : '') + '>' + CATS[k] + '</option>'; }).join('');
  }

  function openBusinessModal(id) {
    openModal('<div class="empty-state">Cargando…</div>');
    api('/businesses/' + id).then(function (p) {
      var servicesHtml = p.services.length
        ? p.services.map(function (s) { return '<div>' + esc(s.name) + ' · ' + s.durationMin + ' min · ' + money(s.priceCents) + '</div>'; }).join('')
        : '<span class="phint">Sin servicios cargados.</span>';
      var weekdayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      var hoursHtml = p.hours.length
        ? p.hours.map(function (h) { return weekdayNames[h.weekday] + ' ' + h.startTime + '–' + h.endTime; }).join(' · ')
        : '<span class="phint">Sin horario configurado.</span>';
      var teamHtml = p.collaborators.length ? ' · Equipo: ' + p.collaborators.map(function (c) { return esc(c.name); }).join(', ') : '';
      var referralNames = { instagram: 'Instagram', tiktok: 'TikTok', amigo: 'Un amigo o colega', google: 'Google', visita: 'Visita de Bukea', otro: 'Otro' };
      var referralHtml = p.referralSource ? '<p class="phint" style="margin:0.3rem 0 0">Conoció Bukea por: <b>' + esc(referralNames[p.referralSource] || p.referralSource) + '</b></p>' : '';

      openModal(
        '<div class="modal-head"><h2>' + esc(p.businessName) + '</h2><button class="modal-close" data-close>&times;</button></div>' +
        '<p class="modal-msg"></p>' +
        '<div class="modal-section"><h3>Titular</h3>' +
        (p.owner
          ? '<div class="kv"><div><b>Nombre</b>' + esc(p.owner.name) + '</div><div><b>Teléfono</b>' + esc(p.owner.phone || '—') + '</div></div>'
          : '<p class="phint" style="margin:0 0 0.5rem">Sin dueño real, sembrado por el sistema.</p>') +
        referralHtml +
        '<div class="inline-form"><div class="field" style="flex:1.6"><label>Transferir a (teléfono)</label><input type="tel" id="transfer-phone" placeholder="809 555 0134"></div><button class="btn btn-ghost btn-sm" id="transfer-btn">Transferir</button></div>' +
        '</div>' +
        '<div class="modal-section"><h3>Editar perfil</h3>' +
        '<div class="kv" style="margin-bottom:0.6rem">' +
          '<div class="field"><label>Nombre del profesional</label><input type="text" id="edit-biz-name" value="' + esc(p.name) + '"></div>' +
          '<div class="field"><label>Nombre del negocio</label><input type="text" id="edit-biz-business" value="' + esc(p.businessName) + '"></div>' +
          '<div class="field"><label>Sector</label><input type="text" id="edit-biz-neighborhood" value="' + esc(p.neighborhood) + '"></div>' +
          '<div class="field"><label>Categoría</label><select id="edit-biz-category">' + catOptions(p.category) + '</select></div>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" id="save-biz-btn">Guardar cambios</button>' +
        '</div>' +
        '<div class="modal-section"><h3>Servicios</h3><div style="font-size:12.5px">' + servicesHtml + '</div></div>' +
        '<div class="modal-section"><h3>Horario</h3><p style="font-size:12.5px;margin:0">' + hoursHtml + teamHtml + '</p></div>' +
        '<div class="modal-actions">' +
          '<a class="btn btn-ghost btn-sm" href="/p/' + esc(p.slug) + '" target="_blank" rel="noopener">Ver perfil público</a>' +
          (p.owner ? '<button class="btn btn-ghost btn-sm" id="impersonate-btn">Ver panel del negocio</button>' : '') +
          '<button class="btn ' + (p.hidden ? 'btn-primary' : 'btn-danger') + ' btn-sm" id="toggle-hidden-btn">' + (p.hidden ? 'Publicar de nuevo' : 'Ocultar del marketplace') + '</button>' +
        '</div>'
      );

      modalEl.querySelector('[data-close]').addEventListener('click', closeModal);
      modalEl.querySelector('#save-biz-btn').addEventListener('click', function () {
        api('/businesses/' + id, { method: 'PATCH', body: {
          name: document.getElementById('edit-biz-name').value,
          businessName: document.getElementById('edit-biz-business').value,
          neighborhood: document.getElementById('edit-biz-neighborhood').value,
          category: document.getElementById('edit-biz-category').value,
        } }).then(function () { modalMsg('Guardado.', true); loadBusinesses(); }).catch(function (err) { modalMsg(err.message, false); });
      });
      modalEl.querySelector('#transfer-btn').addEventListener('click', function () {
        var phone = document.getElementById('transfer-phone').value;
        if (!phone) return;
        if (!confirm('¿Transferir este negocio a ese teléfono?')) return;
        api('/businesses/' + id + '/transfer', { method: 'POST', body: { phone: phone } })
          .then(function (r) { modalMsg('Transferido a ' + r.newOwnerName + '.', true); loadBusinesses(); })
          .catch(function (err) { modalMsg(err.message, false); });
      });
      modalEl.querySelector('#toggle-hidden-btn').addEventListener('click', function () {
        var verb = p.hidden ? 'publicar de nuevo' : 'ocultar del marketplace';
        if (!confirm('¿Seguro que quieres ' + verb + ' este negocio?')) return;
        api('/businesses/' + id + '/toggle-hidden', { method: 'POST' })
          .then(function () { closeModal(); loadBusinesses(); })
          .catch(function (err) { modalMsg(err.message, false); });
      });
      var impersonateBtn = modalEl.querySelector('#impersonate-btn');
      if (impersonateBtn) {
        impersonateBtn.addEventListener('click', function () {
          if (!confirm('Vas a entrar al panel de ' + p.businessName + ' como su dueño. Si el dueño tiene una sesión abierta en otro dispositivo, se cerrará. ¿Continuar?')) return;
          api('/businesses/' + id + '/impersonate', { method: 'POST' })
            .then(function (r) {
              window.open('/negocio?admin_view=' + encodeURIComponent(r.token) + '&slug=' + encodeURIComponent(r.slug), '_blank');
            })
            .catch(function (err) { modalMsg(err.message, false); });
        });
      }
    }).catch(function (err) { openModal('<div class="empty-state">' + esc(err.message) + '</div>'); });
  }

  document.getElementById('biz-create-btn').addEventListener('click', function () {
    openModal(
      '<div class="modal-head"><h2>Crear negocio</h2><button class="modal-close" data-close>&times;</button></div>' +
      '<p class="modal-msg"></p>' +
      '<p class="phint" style="margin:0 0 1rem">Para montar el negocio de un profesional tú mismo durante la validación de calle. Se crea con el horario por defecto (martes a sábado, 9am-6pm); edítalo después desde su ficha.</p>' +
      '<div class="field"><label>Nombre del profesional</label><input type="text" id="new-biz-name"></div>' +
      '<div class="field"><label>Nombre del negocio</label><input type="text" id="new-biz-business"></div>' +
      '<div class="field"><label>Sector</label><input type="text" id="new-biz-neighborhood"></div>' +
      '<div class="field"><label>Categoría</label><select id="new-biz-category">' + catOptions('') + '</select></div>' +
      '<div class="field"><label>Teléfono del titular (opcional, debe tener cuenta ya)</label><input type="tel" id="new-biz-owner-phone" placeholder="809 555 0134"></div>' +
      '<div class="modal-actions"><button class="btn btn-primary btn-sm" id="create-biz-btn">Crear negocio</button></div>'
    );
    modalEl.querySelector('[data-close]').addEventListener('click', closeModal);
    modalEl.querySelector('#create-biz-btn').addEventListener('click', function () {
      api('/businesses', { method: 'POST', body: {
        name: document.getElementById('new-biz-name').value,
        businessName: document.getElementById('new-biz-business').value,
        neighborhood: document.getElementById('new-biz-neighborhood').value,
        category: document.getElementById('new-biz-category').value,
        ownerPhone: document.getElementById('new-biz-owner-phone').value,
      } }).then(function () { closeModal(); loadBusinesses(); }).catch(function (err) { modalMsg(err.message, false); });
    });
  });

  /* ===== Reservas ===== */
  var bookingsFilter = { q: '', status: '', range: '' };
  function loadBookings() {
    var qs = new URLSearchParams();
    if (bookingsFilter.q) qs.set('q', bookingsFilter.q);
    if (bookingsFilter.status) qs.set('status', bookingsFilter.status);
    if (bookingsFilter.range) qs.set('range', bookingsFilter.range);
    api('/bookings?' + qs.toString()).then(function (rows) {
      document.getElementById('bookings-count').textContent = rows.length + ' reserva' + (rows.length === 1 ? '' : 's');
      if (!rows.length) { document.getElementById('bookings-table').innerHTML = '<div class="empty-state">No encontramos reservas con ese filtro.</div>'; return; }
      var payLabel = { cash: 'Efectivo', bank: 'Transferencia', tpago: 'tPago', card: 'Tarjeta' };
      var body = rows.map(function (b) {
        var statusChip = b.status === 'cancelled' ? '<span class="chip off">Cancelada</span>' : '<span class="chip ok">Confirmada</span>';
        var payChip = '<span class="chip mid">' + esc(payLabel[b.paymentMethod] || b.paymentMethod) + '</span>' + (b.receiptUrl ? ' <a class="chip teal" href="' + esc(b.receiptUrl) + '" target="_blank" rel="noopener" style="text-decoration:none">Comprobante</a>' : '');
        return '<tr>' +
          '<td><div class="who"><div class="dot">' + esc(initials(b.clientName)) + '</div><b>' + esc(b.clientName) + '</b></div></td>' +
          '<td>' + esc(b.professionalName) + (b.collaboratorName ? '<br><small style="color:var(--faint)">Atiende: ' + esc(b.collaboratorName) + '</small>' : '') + '</td>' +
          '<td>' + esc(b.serviceName) + ' · ' + money(b.priceCents) + '</td>' +
          '<td>' + fmtDateTime(b.appointmentAt || b.createdAt) + '</td>' +
          '<td>' + payChip + '</td>' +
          '<td>' + statusChip + '</td>' +
          '<td>' + (b.status !== 'cancelled' ? '<div class="rowactions"><button class="iconbtn" data-cancel="' + b.id + '" title="Cancelar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></button></div>' : '') + '</td>' +
          '</tr>';
      }).join('');
      document.getElementById('bookings-table').innerHTML = '<table><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Fecha y hora</th><th>Pago</th><th>Estado</th><th></th></tr></thead><tbody>' + body + '</tbody></table>';
      document.querySelectorAll('[data-cancel]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('¿Cancelar esta reserva?')) return;
          api('/bookings/' + btn.dataset.cancel + '/cancel', { method: 'POST' }).then(loadBookings).catch(function (err) { alert(err.message); });
        });
      });
    }).catch(function (err) { document.getElementById('bookings-table').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  loaders.bookings = loadBookings;
  document.getElementById('bookings-search').addEventListener('input', debounce(function (e) { bookingsFilter.q = e.target.value.trim(); loadBookings(); }, 300));
  document.getElementById('bookings-filters').addEventListener('click', function (e) {
    var btn = e.target.closest('.f');
    if (!btn) return;
    document.querySelectorAll('#bookings-filters .f').forEach(function (b) { b.classList.remove('on'); });
    btn.classList.add('on');
    bookingsFilter.status = btn.dataset.status;
    bookingsFilter.range = btn.dataset.range;
    loadBookings();
  });
  document.getElementById('bookings-export-btn').addEventListener('click', function () {
    var qs = new URLSearchParams({ format: 'csv' });
    if (bookingsFilter.q) qs.set('q', bookingsFilter.q);
    if (bookingsFilter.status) qs.set('status', bookingsFilter.status);
    if (bookingsFilter.range) qs.set('range', bookingsFilter.range);
    downloadCsv('/bookings?' + qs.toString(), 'reservas-bukea.csv');
  });

  /* ===== Moderación ===== */
  var bankFilter = '';
  function loadBankAccounts() {
    var qs = bankFilter ? '?filter=' + bankFilter : '';
    api('/moderation/bank-accounts' + qs).then(function (rows) {
      if (!rows.length) { document.getElementById('bank-table').innerHTML = '<div class="empty-state">Sin cuentas bancarias todavía.</div>'; return; }
      var body = rows.map(function (b) {
        return '<tr>' +
          '<td><b>' + esc(b.businessName) + '</b><br><small style="color:var(--faint)">' + esc(b.professionalName) + '</small></td>' +
          '<td>' + esc(b.bankName) + ' · ' + esc(b.accountType) + '</td>' +
          '<td>' + esc(b.accountNumber) + '</td>' +
          '<td>' + esc(b.accountHolder) + '<br><small style="color:var(--faint)">Cédula/RNC ' + esc(b.cedulaRnc) + '</small></td>' +
          '<td>' + (b.verified ? '<span class="chip ok">Verificada</span>' : '<span class="chip mid">Sin verificar</span>') + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" data-toggle-bank="' + b.id + '">' + (b.verified ? 'Quitar verificación' : 'Verificar') + '</button></td>' +
          '</tr>';
      }).join('');
      document.getElementById('bank-table').innerHTML = '<table><thead><tr><th>Negocio</th><th>Banco</th><th>Número</th><th>Titular</th><th>Estado</th><th></th></tr></thead><tbody>' + body + '</tbody></table>';
      document.querySelectorAll('[data-toggle-bank]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          api('/bank-accounts/' + btn.dataset.toggleBank + '/toggle-verified', { method: 'POST' }).then(loadBankAccounts).catch(function (err) { alert(err.message); });
        });
      });
    }).catch(function (err) { document.getElementById('bank-table').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  document.getElementById('bank-filters').addEventListener('click', function (e) {
    var btn = e.target.closest('.f');
    if (!btn) return;
    document.querySelectorAll('#bank-filters .f').forEach(function (b) { b.classList.remove('on'); });
    btn.classList.add('on');
    bankFilter = btn.dataset.filter;
    loadBankAccounts();
  });

  function loadReceipts() {
    api('/moderation/receipts').then(function (rows) {
      if (!rows.length) { document.getElementById('receipts-table').innerHTML = '<div class="empty-state">Sin comprobantes todavía.</div>'; return; }
      var body = rows.map(function (r) {
        return '<tr>' +
          '<td><b>' + esc(r.clientName) + '</b></td>' +
          '<td>' + esc(r.professionalBusinessName) + '</td>' +
          '<td>' + fmtDateTime(r.uploadedAt) + '</td>' +
          '<td>' + (r.status === 'cancelled' ? '<span class="chip off">Cancelada</span>' : '<span class="chip ok">Confirmada</span>') + '</td>' +
          '<td><div class="rowactions">' +
            '<a class="iconbtn" href="' + esc(r.receiptUrl) + '" target="_blank" rel="noopener" title="Ver comprobante"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg></a>' +
            '<button class="iconbtn" data-delete-receipt="' + r.bookingId + '" title="Eliminar comprobante"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div></td></tr>';
      }).join('');
      document.getElementById('receipts-table').innerHTML = '<table><thead><tr><th>Cliente</th><th>Negocio</th><th>Subido</th><th>Reserva</th><th></th></tr></thead><tbody>' + body + '</tbody></table>';
      document.querySelectorAll('[data-delete-receipt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('¿Eliminar este comprobante? No se puede deshacer.')) return;
          api('/bookings/' + btn.dataset.deleteReceipt + '/receipt', { method: 'DELETE' }).then(loadReceipts).catch(function (err) { alert(err.message); });
        });
      });
    }).catch(function (err) { document.getElementById('receipts-table').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  loaders.moderation = function () { loadBankAccounts(); loadReceipts(); };

  /* ===== Métricas ===== */
  function renderDualChart(elId, seriesA, seriesB) {
    var weeks = [];
    for (var i = 11; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i * 7);
      weeks.push(d.toISOString().slice(0, 10));
    }
    function toWeekMap(series) {
      var m = {};
      series.forEach(function (s) { m[s.weekStart] = s.count; });
      return m;
    }
    var mapA = toWeekMap(seriesA), mapB = toWeekMap(seriesB);
    var valuesA = weeks.map(function (w) { return mapA[w] || 0; });
    var valuesB = weeks.map(function (w) { return mapB[w] || 0; });
    var max = Math.max.apply(null, valuesA.concat(valuesB).concat([1]));
    var W = 600, H = 150, pad = 8;
    var stepX = (W - pad * 2) / (weeks.length - 1);
    function toPath(values, color) {
      var pts = values.map(function (v, i) { return [pad + i * stepX, H - 20 - (v / max) * (H - 40)]; });
      var line = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
      return '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>';
    }
    document.getElementById(elId).innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Crecimiento semanal">' +
      '<line x1="0" y1="' + (H - 20) + '" x2="' + W + '" y2="' + (H - 20) + '" stroke="var(--line)"/>' +
      toPath(valuesA, 'var(--teal-600)') + toPath(valuesB, 'var(--gold-700)') +
      '</svg>';
  }

  function loadMetrics() {
    api('/metrics').then(function (m) {
      document.getElementById('metrics-kpis').innerHTML =
        '<div class="kpi"><span class="klabel">Negocios registrados</span><b>' + m.funnel.registered + '</b><span class="d">con al menos 1 servicio: ' + m.funnel.withServices + '</span></div>' +
        '<div class="kpi"><span class="klabel">Alguna vez reservados</span><b>' + m.funnel.everBooked + '</b><span class="d">con reserva este mes: ' + m.funnel.bookedThisMonth + '</span></div>' +
        '<div class="kpi"><span class="klabel">Clientes que repiten</span><b>' + m.retention.repeatPct + '%</b><span class="d">' + m.retention.repeatClients + ' de ' + m.retention.totalClients + ' clientes</span></div>';

      renderDualChart('metrics-chart', m.growth.users, m.growth.businesses);

      document.getElementById('metrics-category').innerHTML = m.byCategory.length
        ? '<table><thead><tr><th>Categoría</th><th>Negocios</th><th>Reservas</th></tr></thead><tbody>' +
          m.byCategory.map(function (r) { return '<tr><td>' + esc(CATS[r.category] || r.category) + '</td><td class="num">' + r.businesses + '</td><td class="num">' + r.bookings + '</td></tr>'; }).join('') +
          '</tbody></table>'
        : '<div class="empty-state">Sin datos todavía.</div>';

      document.getElementById('metrics-sector').innerHTML = m.bySector.length
        ? '<table><thead><tr><th>Sector</th><th>Reservas</th></tr></thead><tbody>' +
          m.bySector.map(function (r) { return '<tr><td>' + esc(r.neighborhood) + '</td><td class="num">' + r.bookings + '</td></tr>'; }).join('') +
          '</tbody></table>'
        : '<div class="empty-state">Sin datos todavía.</div>';

      document.getElementById('metrics-top-businesses').innerHTML = m.topBusinesses.length
        ? '<table><thead><tr><th>Negocio</th><th>Volumen</th><th>Cancelación</th></tr></thead><tbody>' +
          m.topBusinesses.map(function (r) { return '<tr><td>' + esc(r.businessName) + '</td><td class="num">' + money(r.volumeCents) + '</td><td class="num">' + r.cancellationPct + '%</td></tr>'; }).join('') +
          '</tbody></table>'
        : '<div class="empty-state">Sin datos todavía.</div>';
    }).catch(function (err) { document.getElementById('metrics-kpis').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  loaders.metrics = loadMetrics;

  /* ===== Comunicación ===== */
  function loadCommunication() {
    api('/communication/status').then(function (s) {
      document.getElementById('comm-status').innerHTML =
        '<div class="kpi"><span class="klabel">WhatsApp</span><b style="font-size:16px">' + (s.whatsapp ? '<span class="chip ok">Configurado</span>' : '<span class="chip off">Sin configurar</span>') + '</b>' +
          '<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-test-channel="whatsapp"' + (s.whatsapp ? '' : ' disabled') + '>Enviar prueba</button></div>' +
        '<div class="kpi"><span class="klabel">Correo</span><b style="font-size:16px">' + (s.mail ? '<span class="chip ok">Configurado</span>' : '<span class="chip off">Sin configurar</span>') + '</b>' +
          '<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-test-channel="email"' + (s.mail ? '' : ' disabled') + '>Enviar prueba</button></div>';
      document.querySelectorAll('[data-test-channel]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.disabled = true;
          api('/communication/test', { method: 'POST', body: { channel: btn.dataset.testChannel } })
            .then(function () { alert('Mensaje de prueba enviado.'); loadCommunicationLog(); })
            .catch(function (err) { alert(err.message); })
            .finally(function () { btn.disabled = false; });
        });
      });
    }).catch(function (err) { document.getElementById('comm-status').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
    loadCommunicationLog();
  }
  function loadCommunicationLog() {
    api('/communication/log').then(function (rows) {
      if (!rows.length) { document.getElementById('comm-log').innerHTML = '<div class="empty-state">Sin envíos todavía.</div>'; return; }
      var body = rows.map(function (m) {
        var statusChip = m.status === 'sent' ? '<span class="chip ok">Enviado</span>' : '<span class="chip off">Falló</span>';
        return '<tr><td>' + esc({whatsapp:'WhatsApp',email:'Correo'}[m.channel] || m.channel) + '</td><td>' + esc(m.userName || '—') + '</td><td style="white-space:normal;max-width:280px">' + esc(m.body.slice(0, 120)) + '</td><td>' + statusChip + '</td><td>' + fmtDateTime(m.createdAt) + '</td></tr>';
      }).join('');
      document.getElementById('comm-log').innerHTML = '<table><thead><tr><th>Canal</th><th>Para</th><th>Mensaje</th><th>Estado</th><th>Cuándo</th></tr></thead><tbody>' + body + '</tbody></table>';
    }).catch(function (err) { document.getElementById('comm-log').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  loaders.communication = loadCommunication;

  /* ===== Soporte (chat con dueños de negocio) ===== */
  var supportActiveUserId = null;
  function loadSupport() {
    api('/support/threads').then(function (threads) {
      var unreadTotal = threads.reduce(function (n, t) { return n + t.unread; }, 0);
      var tag = document.getElementById('support-navtag');
      if (unreadTotal > 0) { tag.textContent = unreadTotal; tag.style.display = ''; } else { tag.style.display = 'none'; }

      if (!threads.length) {
        document.getElementById('support-threads').innerHTML = '<div class="empty-state">Todavía no hay mensajes.</div>';
        return;
      }
      document.getElementById('support-threads').innerHTML = threads.map(function (t) {
        return '<button class="support-thread-item' + (t.userId === supportActiveUserId ? ' active' : '') + '" data-uid="' + t.userId + '">' +
          '<div class="dot">' + esc(initials(t.name)) + '</div>' +
          '<div class="stmeta"><b>' + esc(t.name) + '</b><small>' + esc((t.lastBody || '').slice(0, 40)) + '</small></div>' +
          (t.unread > 0 ? '<span class="stbadge">' + t.unread + '</span>' : '') +
          '</button>';
      }).join('');
      document.querySelectorAll('.support-thread-item').forEach(function (btn) {
        btn.addEventListener('click', function () { openSupportThread(Number(btn.dataset.uid), threads); });
      });
      // Si ya había un chat abierto, refresca sus mensajes (por si llegó uno nuevo).
      if (supportActiveUserId && threads.some(function (t) { return t.userId === supportActiveUserId; })) {
        openSupportThread(supportActiveUserId, threads);
      }
    }).catch(function (err) { document.getElementById('support-threads').innerHTML = '<div class="empty-state">' + esc(err.message) + '</div>'; });
  }
  function openSupportThread(userId, threads) {
    supportActiveUserId = userId;
    document.querySelectorAll('.support-thread-item').forEach(function (b) { b.classList.toggle('active', Number(b.dataset.uid) === userId); });
    var t = threads.filter(function (x) { return x.userId === userId; })[0];
    api('/support/threads/' + userId).then(function (messages) {
      var bubbles = messages.map(function (m) {
        return '<div class="support-msg ' + m.sender + '">' + esc(m.body) + '<time>' + fmtDateTime(m.created_at) + '</time></div>';
      }).join('');
      document.getElementById('support-thread').innerHTML =
        '<div class="support-thread-head"><b>' + esc(t ? t.name : '') + '</b><small>' + esc(t ? t.phone || '' : '') + '</small></div>' +
        '<div class="support-msgs" id="support-msgs">' + (bubbles || '<div class="empty-state">Sin mensajes.</div>') + '</div>' +
        '<div class="support-reply"><textarea id="support-reply-text" placeholder="Escribe tu respuesta…"></textarea><button class="btn btn-primary btn-sm" id="support-reply-send">Enviar</button></div>';
      var msgsEl = document.getElementById('support-msgs');
      msgsEl.scrollTop = msgsEl.scrollHeight;
      document.getElementById('support-reply-send').addEventListener('click', function () {
        var ta = document.getElementById('support-reply-text');
        var text = ta.value.trim();
        if (!text) return;
        this.disabled = true;
        api('/support/threads/' + userId, { method: 'POST', body: { message: text } })
          .then(function () { ta.value = ''; loadSupport(); })
          .catch(function (err) { alert(err.message); })
          .finally(function () { document.getElementById('support-reply-send').disabled = false; });
      });
      // Ya se marcaron leídos en el servidor al abrir el hilo — refresca la
      // lista para que el badge de "sin leer" desaparezca.
      loadSupportBadgeOnly();
    });
  }
  function loadSupportBadgeOnly() {
    api('/support/threads').then(function (threads) {
      var unreadTotal = threads.reduce(function (n, t) { return n + t.unread; }, 0);
      var tag = document.getElementById('support-navtag');
      if (unreadTotal > 0) { tag.textContent = unreadTotal; tag.style.display = ''; } else { tag.style.display = 'none'; }
      var items = document.querySelectorAll('.support-thread-item');
      threads.forEach(function (t, i) {
        var badge = items[i] && items[i].querySelector('.stbadge');
        if (badge) { if (t.unread > 0) { badge.textContent = t.unread; } else { badge.remove(); } }
      });
    });
  }
  loaders.support = loadSupport;

  /* ===== Configuración ===== */
  function loadSettings() {
    api('/settings').then(function (s) {
      document.getElementById('settings-banner-enabled').checked = s.bannerEnabled;
      document.getElementById('settings-banner-text').value = s.bannerText;
      document.getElementById('settings-buffer').value = s.bookingBufferMin;
      document.getElementById('settings-slot').value = s.bookingSlotMin;
    }).catch(function (err) { document.getElementById('settings-banner-msg').textContent = err.message; });
  }
  loaders.settings = loadSettings;
  function settingsMsg(id, text, ok) {
    var el = document.getElementById(id);
    el.textContent = text;
    el.className = 'modal-msg show ' + (ok ? 'ok' : 'err');
  }
  document.getElementById('settings-banner-save').addEventListener('click', function () {
    api('/settings', { method: 'PATCH', body: {
      bannerEnabled: document.getElementById('settings-banner-enabled').checked,
      bannerText: document.getElementById('settings-banner-text').value,
    } }).then(function () { settingsMsg('settings-banner-msg', 'Guardado.', true); }).catch(function (err) { settingsMsg('settings-banner-msg', err.message, false); });
  });
  document.getElementById('settings-booking-save').addEventListener('click', function () {
    api('/settings', { method: 'PATCH', body: {
      bookingBufferMin: Number(document.getElementById('settings-buffer').value),
      bookingSlotMin: Number(document.getElementById('settings-slot').value),
    } }).then(function () { settingsMsg('settings-booking-msg', 'Guardado.', true); }).catch(function (err) { settingsMsg('settings-booking-msg', err.message, false); });
  });

  /* ===== Arranque ===== */
  function startApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    var name = localStorage.getItem(NAME_KEY) || 'Admin';
    document.getElementById('admin-name').textContent = name;
    document.getElementById('admin-initial').textContent = initials(name);
    loadDashboard();
  }

  if (getToken()) {
    api('/me').then(startApp).catch(logout);
  }
})();
</script>
</body>
</html>`;
}

module.exports = { adminShell };
