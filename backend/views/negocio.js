// Panel de negocio de escritorio ("Mi cuenta") — vive en bukeard.com/negocio,
// separado del bundle móvil de la app (backend/public/index.html). Reusa
// exactamente los mismos endpoints de API (bajo BASE) y el mismo login por
// teléfono+PIN que ya existía — esto es solo una superficie nueva para verlos
// en pantalla grande, con un calendario real por día/colaborador (inspirado
// en el panel de Fresha, ver docs de la sesión que lo diseñó).
const { CAT_LABELS, ICON_SPRITE } = require('./shared');

function negocioShell({ base, googleClientId, appleClientId }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mi cuenta. Bukea</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0f6f6b">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" async></script>
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
    --danger: oklch(55% 0.18 25);
    --danger-100: oklch(94% 0.04 25);
    --ink:  oklch(21% 0.02 200);
    --soft: oklch(44% 0.028 200);
    --bg:   oklch(97% 0.01 195);
    --card: oklch(99% 0.004 195);
    --line: oklch(89% 0.014 195);
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --sh-2: 0 4px 14px rgba(15,40,38,0.07);
    --sh-3: 0 14px 34px rgba(15,40,38,0.12);
    --sh-teal: 0 8px 20px rgba(10,79,77,0.22);
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; font-family: "Plus Jakarta Sans", system-ui, sans-serif; background: var(--bg); color: var(--ink); }
  h1, h2, h3 { font-family: "Fraunces", Georgia, serif; margin: 0; }
  a { color: inherit; }
  button, input, select { font-family: inherit; }
  .icon { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
    outline: 2.5px solid var(--teal-600); outline-offset: 2px; border-radius: 4px;
  }

  .btn { display: inline-flex; align-items: center; gap: 0.45rem; border-radius: 999px; padding: 0.65rem 1.2rem; font-weight: 700; font-size: 0.88rem; text-decoration: none; border: none; cursor: pointer; transition: transform 160ms var(--ease), background 160ms var(--ease), box-shadow 160ms var(--ease); }
  .btn:hover { transform: translateY(-1px); }
  .btn-primary { background: var(--teal-600); color: #fff; box-shadow: var(--sh-teal); }
  .btn-primary:hover { background: var(--teal-700); }
  .btn-ghost { background: var(--card); color: var(--teal-700); border: 1.5px solid var(--line); }
  .btn-ghost:hover { border-color: var(--teal-500); }
  .btn-danger { background: var(--danger-100); color: var(--danger); }
  .btn:disabled { opacity: 0.5; cursor: default; transform: none; }
  .btn-sm { padding: 0.45rem 0.85rem; font-size: 0.8rem; }
  .btn-icon { width: 36px; height: 36px; padding: 0; justify-content: center; border-radius: 999px; background: var(--card); border: 1.5px solid var(--line); color: var(--soft); }
  .btn-icon:hover { border-color: var(--teal-500); color: var(--teal-700); }

  /* ===== Login ===== */
  .auth-wrap { min-height: 100vh; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; padding: 2rem 1rem; gap: 1rem; }
  .auth-card { width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--line); border-radius: 22px; box-shadow: var(--sh-3); padding: 2.2rem 2rem; }
  .auth-card.wide { max-width: 640px; }
  .auth-brand { display: flex; align-items: center; gap: 0.5rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.3rem; color: var(--teal-900); margin-bottom: 1.6rem; }
  .auth-brand .mark { width: 32px; height: 32px; border-radius: 9px; background: var(--teal-600); color: #fff; display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; }
  .auth-card h1 { font-size: 1.4rem; font-weight: 600; color: var(--teal-900); margin-bottom: 0.3rem; }
  .auth-sub { color: var(--soft); font-size: 0.88rem; margin: 0 0 1.4rem; }
  .field { margin-bottom: 1rem; }
  .field label { display: block; font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--soft); margin-bottom: 0.4rem; }
  .field input, .field select { width: 100%; padding: 0.72rem 0.9rem; border-radius: 12px; border: 1.5px solid var(--line); background: var(--bg); font-size: 0.92rem; color: var(--ink); }
  .field input:focus, .field select:focus { outline: none; border-color: var(--teal-500); box-shadow: 0 0 0 4px rgba(15,133,131,0.14); }
  .auth-error { color: var(--danger); font-size: 0.82rem; margin: 0 0 0.9rem; display: none; }
  .auth-switch { text-align: center; margin-top: 1.2rem; font-size: 0.85rem; color: var(--soft); }
  .auth-switch button { background: none; border: none; color: var(--teal-700); font-weight: 700; cursor: pointer; font-size: inherit; text-decoration: underline; }
  .auth-back { display: inline-flex; align-items: center; gap: 0.3rem; color: var(--soft); font-size: 0.82rem; text-decoration: none; margin-bottom: 1.2rem; }
  .auth-back:hover { color: var(--teal-700); }

  .social-divider { display: flex; align-items: center; gap: 0.8rem; margin: 1.1rem 0; font-size: 0.76rem; color: var(--soft); }
  .social-divider::before, .social-divider::after { content: ""; flex: 1; height: 1px; background: var(--line); }
  .social-btn { width: 100%; background: var(--bg); border: 1.5px solid var(--line); border-radius: 12px; padding: 0.68rem; margin-bottom: 0.6rem; cursor: pointer; font-family: inherit; font-size: 0.88rem; font-weight: 700; color: var(--ink); display: flex; align-items: center; justify-content: center; gap: 0.6rem; transition: border-color 160ms var(--ease), background 160ms var(--ease); }
  .social-btn:hover { border-color: var(--teal-500); background: var(--card); }
  .social-btn:disabled { cursor: not-allowed; opacity: 0.55; }
  .social-btn .social-icon { width: 18px; height: 18px; flex: none; }
  .social-btn .soon { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: var(--teal-100); color: var(--teal-700); border-radius: 999px; padding: 0.15rem 0.5rem; }

  /* ===== Crear negocio (sesión sin negocio vinculado todavía) ===== */
  .nb-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.55rem; margin-bottom: 0.3rem; }
  .nb-cat-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem; padding: 0.8rem 0.5rem; border-radius: 14px; border: 1.5px solid var(--line); background: var(--bg); cursor: pointer; font-size: 0.78rem; font-weight: 700; color: var(--soft); text-align: center; }
  .nb-cat-card:hover { border-color: var(--teal-500); }
  .nb-cat-card.sel { border-color: var(--teal-600); background: var(--teal-50); color: var(--teal-800, var(--teal-700)); }
  .nb-svc-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
  .nb-svc-row input { padding: 0.6rem 0.75rem; border-radius: 10px; border: 1.5px solid var(--line); background: var(--bg); font-size: 0.85rem; color: var(--ink); min-width: 0; }
  .nb-section-lbl { font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--soft); margin: 1.3rem 0 0.6rem; }
  .nb-section-lbl:first-of-type { margin-top: 0; }

  /* ===== Dashboard shell ===== */
  #dash { display: none; min-height: 100vh; }
  #dash.show { display: flex; }
  .sidebar { width: 240px; flex: none; background: var(--teal-900); color: rgba(255,255,255,0.88); display: flex; flex-direction: column; padding: 1.4rem 1rem; position: sticky; top: 0; height: 100vh; }
  .sidebar-brand { display: flex; align-items: center; gap: 0.55rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.2rem; color: #fff; padding: 0 0.5rem; margin-bottom: 1.6rem; text-decoration: none; }
  .sidebar-brand .mark { width: 30px; height: 30px; border-radius: 9px; background: rgba(255,255,255,0.14); display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; }
  .sidebar-biz { padding: 0 0.5rem; margin-bottom: 1.5rem; }
  .sidebar-biz .name { font-weight: 700; font-size: 0.95rem; color: #fff; }
  .sidebar-biz .cat { font-size: 0.78rem; color: rgba(255,255,255,0.6); }
  .nav-item { display: flex; align-items: center; gap: 0.7rem; padding: 0.7rem 0.75rem; border-radius: 12px; color: rgba(255,255,255,0.75); text-decoration: none; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: none; background: none; width: 100%; text-align: left; margin-bottom: 0.15rem; }
  .nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
  .nav-item.active { background: rgba(255,255,255,0.14); color: #fff; }
  .nav-item .icon { color: inherit; }
  .sidebar-foot { margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.12); }

  .content { flex: 1; min-width: 0; padding: 2rem 2.4rem 3rem; }
  .content-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.6rem; flex-wrap: wrap; }
  .content-head h1 { font-size: 1.6rem; font-weight: 600; color: var(--teal-900); }
  .content-head p { color: var(--soft); font-size: 0.9rem; margin: 0.25rem 0 0; }

  .panel { display: none; }
  .panel.show { display: block; animation: fadein 260ms var(--ease); }
  @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

  .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.9rem; margin-bottom: 1.8rem; }
  .stat-card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 1.1rem 1.2rem; box-shadow: var(--sh-2); }
  .stat-card .lbl { font-size: 0.78rem; color: var(--soft); font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
  .stat-card .val { font-family: "Fraunces", serif; font-size: 1.7rem; font-weight: 600; color: var(--teal-900); margin-top: 0.3rem; }
  .stat-card .sub { font-size: 0.78rem; color: var(--soft); margin-top: 0.15rem; }

  /* ===== Dashboard (Resumen) ===== */
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  .dash-grid .card { margin-top: 0; }
  .dash-sub { color: var(--soft); font-size: 0.8rem; margin: -0.6rem 0 0.9rem; }
  .dash-chart-total { font-family: "Fraunces", serif; font-size: 1.6rem; font-weight: 600; color: var(--teal-900); }
  .dash-chart-meta { color: var(--soft); font-size: 0.82rem; margin: 0.15rem 0 0.9rem; }
  .icon-badge { width: 42px; height: 42px; border-radius: 12px; background: var(--teal-100); color: var(--teal-700); display: flex; align-items: center; justify-content: center; flex: none; }
  .dash-table-head { display: grid; grid-template-columns: 2fr 1fr 1fr; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: var(--soft); padding: 0 0 0.6rem; border-bottom: 1px solid var(--line); }
  .dash-table-row { display: grid; grid-template-columns: 2fr 1fr 1fr; font-size: 0.86rem; padding: 0.65rem 0; border-bottom: 1px solid var(--line); align-items: center; }
  .dash-table-row:last-child { border-bottom: none; }
  .dash-table-row span:first-child { font-weight: 700; }
  @media (max-width: 980px) { .dash-grid { grid-template-columns: 1fr; } }

  .card { background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh-2); padding: 1.4rem; }
  .card + .card { margin-top: 1.1rem; }
  .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap; }
  .card-head h3 { font-size: 1.05rem; font-weight: 600; color: var(--teal-900); }

  .list-row { display: flex; align-items: center; gap: 0.9rem; padding: 0.8rem 0; border-bottom: 1px solid var(--line); }
  .list-row:last-child { border-bottom: none; }
  .list-row .avatar { width: 40px; height: 40px; border-radius: 999px; background: var(--teal-100); color: var(--teal-700); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.82rem; flex: none; }
  .list-row .info { flex: 1; min-width: 0; }
  .list-row .info .t1 { font-weight: 700; font-size: 0.9rem; }
  .list-row .info .t2 { font-size: 0.8rem; color: var(--soft); }
  .list-row .badge { font-size: 0.72rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 999px; background: var(--teal-50); color: var(--teal-700); text-transform: uppercase; letter-spacing: 0.02em; }
  .list-row .badge.cancelled { background: var(--danger-100); color: var(--danger); }
  .empty-hint { color: var(--soft); font-size: 0.88rem; padding: 1.2rem 0; text-align: center; }

  /* ===== Calendario (vista mensual) ===== */
  .cal-toolbar { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.2rem; flex-wrap: wrap; }
  .cal-toolbar .cal-date { font-weight: 700; font-size: 1rem; color: var(--teal-900); min-width: 15ch; }
  .cal-toolbar .spacer { flex: 1; }
  .cal-wrap { background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh-2); overflow-x: auto; }
  .cal-month-grid { display: grid; grid-template-columns: repeat(7, minmax(122px, 1fr)); min-width: 800px; }
  .cal-month-head { padding: 0.7rem 0.5rem; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: var(--soft); text-align: center; border-bottom: 1px solid var(--line); background: var(--teal-50); }
  .cal-month-cell { min-height: 108px; padding: 0.5rem; border-top: 1px solid var(--line); border-left: 1px solid var(--line); display: flex; flex-direction: column; gap: 0.25rem; cursor: pointer; transition: background 140ms var(--ease); }
  .cal-month-cell:hover { background: var(--teal-50); }
  .cal-month-cell:nth-child(7n+1) { border-left: none; }
  .cal-month-cell.pad { background: var(--bg); cursor: default; }
  .cal-month-cell.pad:hover { background: var(--bg); }
  .cal-daynum { font-size: 0.78rem; font-weight: 700; color: var(--soft); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none; }
  .cal-month-cell.today .cal-daynum { background: var(--teal-600); color: #fff; }
  .cal-chip { font-size: 0.68rem; font-weight: 700; padding: 0.18rem 0.4rem; border-radius: 6px; background: var(--teal-100); color: var(--teal-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
  .cal-chip:hover { background: var(--teal-500); color: #fff; }
  .cal-chip.cancelled { background: var(--danger-100); color: var(--danger); text-decoration: line-through; }
  .cal-more { font-size: 0.68rem; font-weight: 800; color: var(--teal-700); cursor: pointer; padding: 0.1rem 0.4rem; }

  /* ===== Servicios / Horario / Equipo / Cuentas forms ===== */
  .svc-row, .team-row, .bank-row { display: grid; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
  .svc-row { grid-template-columns: 2fr 1fr 1fr auto; }
  .team-row { grid-template-columns: 1.2fr 1fr auto; }
  .bank-row { grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto; }
  .svc-row input, .team-row input, .bank-row input, .bank-row select {
    padding: 0.6rem 0.75rem; border-radius: 10px; border: 1.5px solid var(--line); background: var(--bg); font-size: 0.85rem; color: var(--ink); min-width: 0;
  }
  .row-del { background: none; border: none; color: var(--soft); cursor: pointer; padding: 0.3rem; }
  .row-del:hover { color: var(--danger); }
  .add-row { background: none; border: 1.5px dashed var(--line); border-radius: 10px; padding: 0.6rem; width: 100%; font-size: 0.82rem; font-weight: 700; color: var(--teal-700); cursor: pointer; margin: 0.4rem 0 0.9rem; }
  .add-row:hover { border-color: var(--teal-500); }

  .hour-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.55rem 0; border-bottom: 1px solid var(--line); }
  .hour-row:last-child { border-bottom: none; }
  .hour-row .day { width: 90px; font-weight: 700; font-size: 0.85rem; text-transform: capitalize; flex: none; }
  .hour-row input[type=checkbox] { width: 17px; height: 17px; accent-color: var(--teal-600); }
  .hour-row input[type=time] { padding: 0.4rem 0.5rem; border-radius: 8px; border: 1.5px solid var(--line); background: var(--bg); font-size: 0.82rem; }
  .hour-row input[type=time]:disabled { opacity: 0.4; }
  .hour-row .sep { color: var(--soft); font-size: 0.78rem; }

  .toast { position: fixed; bottom: 1.4rem; right: 1.4rem; background: var(--teal-900); color: #fff; padding: 0.75rem 1.1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; box-shadow: var(--sh-3); opacity: 0; transform: translateY(8px); transition: opacity 200ms var(--ease), transform 200ms var(--ease); pointer-events: none; z-index: 80; }
  .toast.show { opacity: 1; transform: none; }

  /* Modal detalle de cita */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(10,25,24,0.45); display: none; align-items: center; justify-content: center; z-index: 60; padding: 1rem; }
  .modal-backdrop.show { display: flex; }
  .modal { width: 100%; max-width: 380px; background: var(--card); border-radius: 20px; box-shadow: var(--sh-3); padding: 1.6rem; }
  .modal h3 { font-size: 1.15rem; margin-bottom: 0.2rem; }
  .modal .modal-sub { color: var(--soft); font-size: 0.85rem; margin-bottom: 1rem; }
  .modal-line { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--line); font-size: 0.86rem; }
  .modal-line:last-of-type { border-bottom: none; }
  .modal-line span:first-child { color: var(--soft); }
  .modal-line span:last-child { font-weight: 700; text-align: right; }
  .modal-actions { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
  .modal-actions .btn { flex: 1; justify-content: center; }
  .modal-close { position: absolute; top: 1.1rem; right: 1.1rem; }
  .modal { position: relative; }

  @media (max-width: 860px) {
    #dash.show { flex-direction: column; }
    .sidebar { width: 100%; height: auto; position: static; flex-direction: row; align-items: center; overflow-x: auto; padding: 0.8rem 1rem; }
    .sidebar-brand, .sidebar-biz { display: none; }
    .nav-item { flex: none; width: auto; white-space: nowrap; }
    .sidebar-foot { margin-top: 0; margin-left: auto; padding-top: 0; border-top: none; }
    .content { padding: 1.4rem 1.1rem 2.4rem; }
  }
  @media (prefers-color-scheme: dark) {
    :root { color-scheme: light; }
  }
</style>
</head>
<body>
${ICON_SPRITE}
<svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>
<symbol id="n-home" viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-6h3v6H17a1 1 0 0 0 1-1V10"/></symbol>
<symbol id="n-calendar" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="6.5"/><line x1="16" y1="3" x2="16" y2="6.5"/></symbol>
<symbol id="n-tag" viewBox="0 0 24 24"><path d="M12.6 3.5H6a2.5 2.5 0 0 0-2.5 2.5v6.6a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l6.6-6.6a2 2 0 0 0 0-2.8l-8.8-8.8a2 2 0 0 0-1.4-.6Z"/><circle cx="8.3" cy="8.3" r="1.4"/></symbol>
<symbol id="n-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.3"/><path d="M12 7v5.3l3.6 2.1"/></symbol>
<symbol id="n-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c0-3.4 2.8-5.8 6.2-5.8s6.2 2.4 6.2 5.8"/><circle cx="17.3" cy="8.6" r="2.6"/><path d="M15.5 14.7c2.5.4 4.2 2.4 4.2 5.3"/></symbol>
<symbol id="n-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7"/></symbol>
<symbol id="n-card" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><line x1="2.5" y1="9.5" x2="21.5" y2="9.5"/><line x1="5.5" y1="15" x2="9.5" y2="15"/></symbol>
<symbol id="n-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><line x1="21" y1="12" x2="9" y2="12"/></symbol>
<symbol id="n-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
<symbol id="n-x" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></symbol>
<symbol id="n-chev-l" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></symbol>
<symbol id="n-chev-r" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
<symbol id="n-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></symbol>
<symbol id="n-eye-off" viewBox="0 0 24 24"><path d="M3.5 3.5l17 17"/><path d="M10.6 5.6C11 5.6 11.5 5.5 12 5.5c6 0 9.5 6.5 9.5 6.5a17.5 17.5 0 0 1-3.3 4.2M6.6 6.6C4.2 8.1 2.5 12 2.5 12S6 18.5 12 18.5c1.3 0 2.5-.3 3.6-.8"/><path d="M9.9 9.9a2.8 2.8 0 0 0 3.9 3.9"/></symbol>
</defs></svg>

<div id="auth" class="auth-wrap">
  <div class="auth-card" id="auth-login-card">
    <a href="/" class="auth-brand"><span class="mark">b</span>Bukea negocios</a>

    <div id="auth-step-phone">
      <h1>Entra a tu cuenta</h1>
      <p class="auth-sub">Gestiona tu calendario, servicios y equipo desde aquí.</p>
      <p id="auth-error" class="auth-error"></p>
      <div class="field">
        <label for="a-phone">Teléfono</label>
        <input id="a-phone" type="tel" placeholder="809 000 0000" autocomplete="tel">
      </div>
      <button class="btn btn-primary" id="a-check-btn" style="width:100%" onclick="authCheck()">Continuar</button>

      <div class="social-divider">o usa tus redes</div>
      <button class="social-btn" id="s-google-btn" onclick="loginWithGoogle()">
        <svg class="social-icon" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
        <span class="social-label">Continuar con Google</span>
      </button>
      <button class="social-btn" id="s-apple-btn" onclick="loginWithApple()">
        <svg class="social-icon" viewBox="0 0 17 20" fill="currentColor"><path d="M13.998 10.63c-.024-2.415 1.973-3.573 2.063-3.63-1.126-1.646-2.877-1.872-3.502-1.897-1.49-.152-2.91.877-3.665.877-.755 0-1.923-.856-3.16-.833-1.627.024-3.128.946-3.965 2.402-1.692 2.933-.432 7.28 1.216 9.66.806 1.166 1.767 2.474 3.028 2.427 1.216-.048 1.674-.786 3.144-.786 1.47 0 1.883.786 3.17.762 1.31-.024 2.14-1.19 2.94-2.36.926-1.354 1.307-2.665 1.33-2.734-.03-.012-2.552-.98-2.576-3.888h-.023z"/><path d="M11.578 3.508c.668-.81 1.121-1.937.997-3.06-.964.04-2.13.643-2.822 1.452-.618.719-1.16 1.87-1.014 2.976 1.076.083 2.17-.55 2.839-1.368z"/></svg>
        <span class="social-label">Continuar con Apple</span>
      </button>
      <p id="auth-error-social" class="auth-error"></p>
    </div>

    <div id="auth-step-pin" style="display:none">
      <a href="#" class="auth-back" onclick="authBackToPhone();return false"><svg class="icon"><use href="#n-chev-l"/></svg>Atrás</a>
      <h1 id="auth-pin-title">Ingresa tu PIN</h1>
      <p class="auth-sub" id="auth-pin-sub">El PIN de 4 dígitos de tu cuenta Bukea.</p>
      <p id="auth-error-2" class="auth-error"></p>
      <div class="field">
        <label for="a-pin">PIN</label>
        <input id="a-pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••">
      </div>
      <button class="btn btn-primary" id="a-login-btn" style="width:100%" onclick="authLogin()">Entrar</button>
    </div>

    <div id="auth-step-new" style="display:none">
      <a href="#" class="auth-back" onclick="authBackToPhone();return false"><svg class="icon"><use href="#n-chev-l"/></svg>Atrás</a>
      <h1>Crea tu cuenta</h1>
      <p class="auth-sub">Es la misma cuenta que usas en la app de Bukea.</p>
      <p id="auth-error-3" class="auth-error"></p>
      <div class="field">
        <label for="a-name">Tu nombre</label>
        <input id="a-name" type="text" placeholder='Ej: Joel "El Fino" Batista'>
      </div>
      <div class="field">
        <label for="a-newpin">Crea un PIN de 4 dígitos</label>
        <input id="a-newpin" type="password" inputmode="numeric" maxlength="4" placeholder="••••">
      </div>
      <button class="btn btn-primary" id="a-register-btn" style="width:100%" onclick="authRegister()">Crear cuenta y continuar</button>
    </div>
  </div>

  <div class="auth-card wide" id="auth-step-newbiz" style="display:none">
    <a href="/" class="auth-brand"><span class="mark">b</span>Bukea negocios</a>
    <h1>Registra tu negocio</h1>
    <p class="auth-sub">Es gratis para siempre, cero comisión. Toma un minuto.</p>
    <p id="auth-error-4" class="auth-error"></p>

    <div class="field">
      <label for="nb-name">Tu nombre</label>
      <input id="nb-name" type="text" placeholder='Ej: Joel "El Fino" Batista'>
    </div>
    <div class="field">
      <label for="nb-business">Nombre del negocio</label>
      <input id="nb-business" type="text" placeholder="Ej: Barbería El Nítido">
    </div>
    <div class="field">
      <label for="nb-neighborhood">Sector</label>
      <input id="nb-neighborhood" type="text" placeholder="Ej: Villa Consuelo">
    </div>

    <p class="nb-section-lbl">¿A qué te dedicas?</p>
    <div class="nb-cat-grid" id="nb-cats"></div>

    <p class="nb-section-lbl">Tus servicios</p>
    <div id="nb-svc-rows"></div>
    <button class="add-row" onclick="nbAddServiceRow()"><svg class="icon" style="width:14px;height:14px"><use href="#n-plus"/></svg> Agregar otro servicio</button>

    <button class="btn btn-primary" id="nb-submit-btn" style="width:100%;justify-content:center;margin-top:1.4rem" onclick="nbSubmit()">Crear mi negocio</button>
    <div class="auth-switch"><button onclick="logout()">Cerrar sesión</button></div>
  </div>
  </div>
</div>

<div id="dash">
  <aside class="sidebar">
    <a href="/" class="sidebar-brand"><span class="mark">b</span>Bukea</a>
    <div class="sidebar-biz">
      <div class="name" id="sb-name">—</div>
      <div class="cat" id="sb-cat">—</div>
    </div>
    <button class="nav-item active" data-panel="resumen" onclick="showPanel('resumen')"><svg class="icon"><use href="#n-home"/></svg>Resumen</button>
    <button class="nav-item" data-panel="calendario" onclick="showPanel('calendario')"><svg class="icon"><use href="#n-calendar"/></svg>Calendario</button>
    <button class="nav-item" data-panel="servicios" onclick="showPanel('servicios')"><svg class="icon"><use href="#n-tag"/></svg>Servicios</button>
    <button class="nav-item" data-panel="horario" onclick="showPanel('horario')"><svg class="icon"><use href="#n-clock"/></svg>Horario</button>
    <button class="nav-item" data-panel="equipo" onclick="showPanel('equipo')"><svg class="icon"><use href="#n-users"/></svg>Equipo</button>
    <button class="nav-item" data-panel="cuentas" onclick="showPanel('cuentas')"><svg class="icon"><use href="#n-card"/></svg>Cuentas bancarias</button>
    <button class="nav-item" data-panel="perfil" onclick="showPanel('perfil')"><svg class="icon"><use href="#n-user"/></svg>Mi perfil</button>
    <div class="sidebar-foot">
      <button class="nav-item" onclick="logout()"><svg class="icon"><use href="#n-logout"/></svg>Cerrar sesión</button>
    </div>
  </aside>

  <div class="content">
    <!-- ===== Resumen ===== -->
    <div class="panel show" id="panel-resumen">
      <div class="content-head">
        <div>
          <h1>Resumen</h1>
          <p>Cómo le está yendo a tu negocio en Bukea.</p>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-card"><div class="lbl">Hoy</div><div class="val" id="st-today-count">—</div><div class="sub" id="st-today-cents"></div></div>
        <div class="stat-card"><div class="lbl">Últimos 7 días</div><div class="val" id="st-week-count">—</div><div class="sub" id="st-week-cents"></div></div>
        <div class="stat-card"><div class="lbl">Este mes</div><div class="val" id="st-month-count">—</div><div class="sub" id="st-month-cents"></div></div>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card-head"><h3>Ventas recientes</h3></div>
          <p class="dash-sub">Últimos 7 días</p>
          <div class="dash-chart-total" id="chart-total">RD$0</div>
          <p class="dash-chart-meta" id="chart-meta">0 citas</p>
          <div id="ventas-chart"></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Próximas citas</h3><button class="btn btn-ghost btn-sm" onclick="showPanel('calendario')">Ver calendario</button></div>
          <p class="dash-sub">Próximos 7 días</p>
          <div id="resumen-list"><p class="empty-hint">Cargando…</p></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Actividad de citas</h3></div>
          <div id="actividad-list"><p class="empty-hint">Cargando…</p></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Próximas citas de hoy</h3></div>
          <div id="hoy-list"><p class="empty-hint">Cargando…</p></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Mejores servicios</h3></div>
          <div id="mejores-servicios-table"><p class="empty-hint">Cargando…</p></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Mejor miembro del equipo</h3></div>
          <div id="mejor-equipo-table"><p class="empty-hint">Cargando…</p></div>
        </div>
      </div>
    </div>

    <!-- ===== Calendario ===== -->
    <div class="panel" id="panel-calendario">
      <div class="content-head">
        <div>
          <h1>Calendario</h1>
          <p>Las citas de tu negocio, mes por mes.</p>
        </div>
      </div>
      <div class="cal-toolbar">
        <button class="btn-icon" onclick="calShiftMonth(-1)" aria-label="Mes anterior"><svg class="icon"><use href="#n-chev-l"/></svg></button>
        <span class="cal-date" id="cal-date-label">—</span>
        <button class="btn-icon" onclick="calShiftMonth(1)" aria-label="Mes siguiente"><svg class="icon"><use href="#n-chev-r"/></svg></button>
        <button class="btn btn-ghost btn-sm" onclick="calGoToday()">Hoy</button>
        <div class="spacer"></div>
      </div>
      <div class="cal-wrap">
        <div id="cal-grid"></div>
      </div>
    </div>

    <!-- ===== Servicios ===== -->
    <div class="panel" id="panel-servicios">
      <div class="content-head">
        <div>
          <h1>Servicios</h1>
          <p>Lo que ofreces y sus precios. Se muestran así en tu perfil público.</p>
        </div>
      </div>
      <div class="card">
        <div id="servicios-list"><p class="empty-hint">Cargando…</p></div>
      </div>
    </div>

    <!-- ===== Horario ===== -->
    <div class="panel" id="panel-horario">
      <div class="content-head">
        <div>
          <h1>Horario semanal</h1>
          <p>Cuándo estás disponible para citas. Se aplica igual a todo el equipo.</p>
        </div>
        <button class="btn btn-primary" onclick="saveHours()">Guardar cambios</button>
      </div>
      <div class="card">
        <div id="hours-list"><p class="empty-hint">Cargando…</p></div>
      </div>
    </div>

    <!-- ===== Equipo ===== -->
    <div class="panel" id="panel-equipo">
      <div class="content-head">
        <div>
          <h1>Equipo</h1>
          <p>Quién más atiende citas en tu negocio, además de ti.</p>
        </div>
        <button class="btn btn-primary" onclick="saveTeam()">Guardar cambios</button>
      </div>
      <div class="card">
        <p class="empty-hint" style="padding-top:0;text-align:left" id="team-owner-hint"></p>
        <div id="team-list"></div>
        <button class="add-row" onclick="addTeamRow()"><svg class="icon" style="width:14px;height:14px"><use href="#n-plus"/></svg> Agregar colaborador</button>
      </div>
    </div>

    <!-- ===== Cuentas bancarias ===== -->
    <div class="panel" id="panel-cuentas">
      <div class="content-head">
        <div>
          <h1>Cuentas bancarias</h1>
          <p>Para que tus clientes te paguen por transferencia. Se ven en tu perfil público.</p>
        </div>
        <button class="btn btn-primary" onclick="saveBanks()">Guardar cambios</button>
      </div>
      <div class="card">
        <div id="banks-list"></div>
        <button class="add-row" onclick="addBankRow()"><svg class="icon" style="width:14px;height:14px"><use href="#n-plus"/></svg> Agregar cuenta</button>
      </div>
    </div>

    <!-- ===== Mi perfil ===== -->
    <div class="panel" id="panel-perfil">
      <div class="content-head">
        <div>
          <h1>Mi perfil</h1>
          <p>La información de tu negocio, visible en tu perfil público.</p>
        </div>
        <button class="btn btn-primary" onclick="savePerfil()">Guardar cambios</button>
      </div>
      <div class="card">
        <p id="perfil-error" class="auth-error" style="margin-bottom:1rem"></p>
        <div class="field">
          <label for="pf-name">Tu nombre</label>
          <input id="pf-name" type="text" placeholder='Ej: Joel "El Fino" Batista'>
        </div>
        <div class="field">
          <label for="pf-business">Nombre del negocio</label>
          <input id="pf-business" type="text" placeholder="Ej: Barbería El Nítido">
        </div>
        <div class="field">
          <label for="pf-category">Categoría</label>
          <select id="pf-category"></select>
        </div>
        <div class="field" style="margin-bottom:0">
          <label for="pf-neighborhood">Sector</label>
          <input id="pf-neighborhood" type="text" placeholder="Ej: Villa Consuelo">
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal-backdrop" id="booking-modal-backdrop" onclick="if(event.target===this) closeBookingModal()">
  <div class="modal">
    <button class="btn-icon modal-close" onclick="closeBookingModal()" aria-label="Cerrar"><svg class="icon"><use href="#n-x"/></svg></button>
    <h3 id="bm-client">—</h3>
    <p class="modal-sub" id="bm-service">—</p>
    <div class="modal-line"><span>Fecha</span><span id="bm-date">—</span></div>
    <div class="modal-line"><span>Atiende</span><span id="bm-collab">—</span></div>
    <div class="modal-line"><span>Pago</span><span id="bm-pay">—</span></div>
    <div class="modal-line"><span>Precio</span><span id="bm-price">—</span></div>
    <div class="modal-actions">
      <button class="btn btn-danger" id="bm-cancel-btn" onclick="cancelBookingFromModal()">Cancelar cita</button>
    </div>
  </div>
</div>

<div class="modal-backdrop" id="day-agenda-backdrop" onclick="if(event.target===this) closeDayAgenda()">
  <div class="modal" style="max-width:420px">
    <button class="btn-icon modal-close" onclick="closeDayAgenda()" aria-label="Cerrar"><svg class="icon"><use href="#n-x"/></svg></button>
    <h3 id="da-date">—</h3>
    <div id="da-list" style="margin-top:0.8rem;max-height:60vh;overflow-y:auto"></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
(function () {
  var BASE = ${JSON.stringify(base)};
  var CAT_LABELS = ${JSON.stringify(CAT_LABELS)};
  var GOOGLE_CLIENT_ID = ${JSON.stringify(googleClientId || '')};
  var APPLE_CLIENT_ID = ${JSON.stringify(appleClientId || '')};

  /* ---------- Sesión ---------- */
  function getSession() {
    try { return JSON.parse(localStorage.getItem('bukea_session')); } catch (e) { return null; }
  }
  function setSession(s) { localStorage.setItem('bukea_session', JSON.stringify(s)); }
  function proSlug() { return localStorage.getItem('bukea_pro_slug'); }
  function setProSlug(slug) { localStorage.setItem('bukea_pro_slug', slug); }
  function authHeaders() {
    var s = getSession();
    return s && s.token ? { Authorization: 'Bearer ' + s.token } : {};
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._h);
    toast._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  window.toast = toast;

  /* ---------- Login: teléfono → PIN (existente) o crear cuenta ---------- */
  var pendingPhone = '';

  function showAuthError(id, msg) {
    var el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
  }
  function hideAuthErrors() {
    ['auth-error', 'auth-error-2', 'auth-error-3', 'auth-error-4', 'auth-error-social'].forEach(function (id) {
      document.getElementById(id).style.display = 'none';
    });
  }

  /* ---------- Login social: Google / Apple ---------- */
  function initSocialLogin() {
    var gBtn = document.getElementById('s-google-btn');
    var aBtn = document.getElementById('s-apple-btn');
    if (GOOGLE_CLIENT_ID && window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, ux_mode: 'popup' });
    } else if (gBtn) {
      gBtn.disabled = true;
      gBtn.querySelector('.social-label').innerHTML = 'Continuar con Google <span class="soon">Próximamente</span>';
    }
    if (APPLE_CLIENT_ID && window.AppleID) {
      AppleID.auth.init({
        clientId: APPLE_CLIENT_ID, scope: 'name email',
        redirectURI: window.location.origin + '/negocio', usePopup: true,
      });
    } else if (aBtn) {
      aBtn.disabled = true;
      aBtn.querySelector('.social-label').innerHTML = 'Continuar con Apple <span class="soon">Próximamente</span>';
    }
  }
  window.addEventListener('load', initSocialLogin);

  window.loginWithGoogle = function () {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    google.accounts.id.prompt();
  };
  function handleGoogleCredential(response) {
    socialLogin('/api/auth/google', { idToken: response.credential });
  }

  window.loginWithApple = async function () {
    if (!APPLE_CLIENT_ID || !window.AppleID) return;
    hideAuthErrors();
    try {
      var result = await AppleID.auth.signIn();
      var fullName = result.user && result.user.name
        ? [result.user.name.firstName, result.user.name.lastName].filter(Boolean).join(' ') : null;
      await socialLogin('/api/auth/apple', { idToken: result.authorization.id_token, name: fullName });
    } catch (err) {
      if (err && err.error === 'popup_closed_by_user') return;
      showAuthError('auth-error-social', 'No se pudo iniciar sesión con Apple.');
    }
  };

  async function socialLogin(path, body) {
    hideAuthErrors();
    try {
      var res = await fetch(BASE + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) return showAuthError('auth-error-social', data.error || 'No se pudo iniciar sesión.');
      setSession(data);
      await afterLogin();
    } catch (err) {
      showAuthError('auth-error-social', 'No se pudo conectar con el servidor.');
    }
  }

  window.authCheck = async function () {
    hideAuthErrors();
    var phone = document.getElementById('a-phone').value.trim();
    if (!phone) return showAuthError('auth-error', 'Escribe tu número de teléfono.');
    var btn = document.getElementById('a-check-btn');
    btn.disabled = true;
    try {
      var res = await fetch(BASE + '/api/auth/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) return showAuthError('auth-error', data.error || 'No se pudo verificar el número.');
      pendingPhone = phone;
      if (data.exists) {
        document.getElementById('auth-step-phone').style.display = 'none';
        document.getElementById('auth-pin-sub').textContent = 'Hola ' + (data.name || '') + ', ingresa tu PIN.';
        document.getElementById('auth-step-pin').style.display = 'block';
        document.getElementById('a-pin').focus();
      } else {
        document.getElementById('auth-step-phone').style.display = 'none';
        document.getElementById('auth-step-new').style.display = 'block';
        document.getElementById('a-name').focus();
      }
    } catch (err) {
      showAuthError('auth-error', 'No se pudo conectar con el servidor.');
    } finally {
      btn.disabled = false;
    }
  };

  window.authBackToPhone = function () {
    hideAuthErrors();
    document.getElementById('auth-step-pin').style.display = 'none';
    document.getElementById('auth-step-new').style.display = 'none';
    document.getElementById('auth-step-phone').style.display = 'block';
  };

  window.authLogin = async function () {
    hideAuthErrors();
    var pin = document.getElementById('a-pin').value.trim();
    if (!/^\\d{4}$/.test(pin)) return showAuthError('auth-error-2', 'El PIN debe ser de 4 dígitos.');
    var btn = document.getElementById('a-login-btn');
    btn.disabled = true;
    try {
      var res = await fetch(BASE + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone, pin: pin }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) return showAuthError('auth-error-2', data.error || 'PIN incorrecto.');
      setSession(data);
      await afterLogin();
    } catch (err) {
      showAuthError('auth-error-2', 'No se pudo conectar con el servidor.');
    } finally {
      btn.disabled = false;
    }
  };

  window.authRegister = async function () {
    hideAuthErrors();
    var name = document.getElementById('a-name').value.trim();
    var pin = document.getElementById('a-newpin').value.trim();
    if (!name) return showAuthError('auth-error-3', 'Dinos tu nombre.');
    if (!/^\\d{4}$/.test(pin)) return showAuthError('auth-error-3', 'El PIN debe ser de 4 dígitos.');
    var btn = document.getElementById('a-register-btn');
    btn.disabled = true;
    try {
      var res = await fetch(BASE + '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone, name: name, pin: pin }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) return showAuthError('auth-error-3', data.error || 'No se pudo crear la cuenta.');
      setSession(data);
      await afterLogin();
    } catch (err) {
      showAuthError('auth-error-3', 'No se pudo conectar con el servidor.');
    } finally {
      btn.disabled = false;
    }
  };

  window.logout = function () {
    localStorage.removeItem('bukea_session');
    localStorage.removeItem('bukea_pro_slug');
    location.reload();
  };

  /* ---------- Estado del negocio ---------- */
  var state = { profile: null, bookings: [], hours: [], calMonth: startOfMonth() };

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function startOfMonth() {
    var d = startOfToday();
    d.setDate(1);
    return d;
  }

  async function afterLogin() {
    var slug = proSlug();
    if (!slug) {
      showNewBizStep();
      return;
    }
    document.getElementById('auth').style.display = 'none';
    document.getElementById('dash').classList.add('show');
    await loadAll();
  }

  /* ---------- Crear negocio (sesión sin negocio vinculado todavía) ---------- */
  var NB_CATS = Object.keys(CAT_LABELS);
  var nbSelectedCat = NB_CATS[0];

  function nbSvcRowHtml() {
    return '<div class="nb-svc-row">' +
      '<input class="nb-svc-name" type="text" placeholder="Servicio (ej: Corte clásico)">' +
      '<input class="nb-svc-min" type="number" min="5" step="5" placeholder="Min">' +
      '<input class="nb-svc-price" type="number" min="0" step="50" placeholder="RD$">' +
      '<button class="row-del" onclick="this.closest(\\'.nb-svc-row\\').remove()"><svg class="icon"><use href="#n-x"/></svg></button></div>';
  }
  window.nbAddServiceRow = function () {
    document.getElementById('nb-svc-rows').insertAdjacentHTML('beforeend', nbSvcRowHtml());
  };
  window.nbPickCat = function (cat) {
    nbSelectedCat = cat;
    document.querySelectorAll('#nb-cats .nb-cat-card').forEach(function (b) {
      b.classList.toggle('sel', b.dataset.cat === cat);
    });
  };

  function showNewBizStep() {
    document.getElementById('auth-login-card').style.display = 'none';
    document.getElementById('auth-step-newbiz').style.display = 'block';

    var catsEl = document.getElementById('nb-cats');
    catsEl.innerHTML = NB_CATS.map(function (cat) {
      return '<button type="button" class="nb-cat-card' + (cat === nbSelectedCat ? ' sel' : '') + '" data-cat="' + cat + '" onclick="nbPickCat(\\'' + cat + '\\')">' + esc(CAT_LABELS[cat]) + '</button>';
    }).join('');

    var rowsEl = document.getElementById('nb-svc-rows');
    if (!rowsEl.children.length) rowsEl.innerHTML = nbSvcRowHtml();
  }

  window.nbSubmit = async function () {
    document.getElementById('auth-error-4').style.display = 'none';
    var name = document.getElementById('nb-name').value.trim();
    var businessName = document.getElementById('nb-business').value.trim();
    var neighborhood = document.getElementById('nb-neighborhood').value.trim();

    var services = [];
    document.querySelectorAll('#nb-svc-rows .nb-svc-row').forEach(function (row) {
      var svcName = row.querySelector('.nb-svc-name').value.trim();
      var min = Number(row.querySelector('.nb-svc-min').value);
      var price = Number(row.querySelector('.nb-svc-price').value);
      if (svcName && min > 0 && price > 0) {
        services.push({ name: svcName, durationMin: min, priceCents: Math.round(price * 100) });
      }
    });

    if (!name || !businessName || !neighborhood) {
      return showAuthError('auth-error-4', 'Completa tu nombre, el del negocio y el sector.');
    }
    if (!services.length) {
      return showAuthError('auth-error-4', 'Agrega al menos un servicio con duración y precio.');
    }

    var btn = document.getElementById('nb-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Creando negocio…';
    try {
      var res = await fetch(BASE + '/api/professionals', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({ name: name, businessName: businessName, neighborhood: neighborhood, category: nbSelectedCat, services: services }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) return showAuthError('auth-error-4', data.error || 'No se pudo crear el negocio.');
      setProSlug(data.slug);
      document.getElementById('auth-step-newbiz').style.display = 'none';
      toast('¡Tu negocio ya está en Bukea!');
      await afterLogin();
    } catch (err) {
      showAuthError('auth-error-4', 'No se pudo conectar con el servidor.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Crear mi negocio';
    }
  };

  async function loadAll() {
    var slug = proSlug();
    var [profileRes, bookingsRes, hoursRes] = await Promise.all([
      fetch(BASE + '/api/professionals/' + slug, { headers: authHeaders() }),
      fetch(BASE + '/api/professionals/' + slug + '/bookings', { headers: authHeaders() }),
      fetch(BASE + '/api/professionals/' + slug + '/hours', { headers: authHeaders() }),
    ]);
    if (profileRes.status === 401 || profileRes.status === 403) return logout();
    state.profile = await profileRes.json();
    state.bookings = bookingsRes.ok ? await bookingsRes.json() : [];
    state.hours = hoursRes.ok ? await hoursRes.json() : [];

    document.getElementById('sb-name').textContent = state.profile.businessName;
    document.getElementById('sb-cat').textContent = CAT_LABELS[state.profile.category] || state.profile.category;

    renderStats();
    renderResumenList();
    renderVentasChart();
    renderActividad();
    renderCitasHoy();
    renderMejoresServicios();
    renderMejorEquipo();
    renderCalendar();
    renderServicios();
    renderHours();
    renderTeam();
    renderBanks();
    renderPerfil();
  }

  function money(cents) {
    return 'RD$' + Math.round((cents || 0) / 100).toLocaleString('es-DO');
  }

  async function fetchStats() {
    var slug = proSlug();
    var res = await fetch(BASE + '/api/professionals/' + slug + '/stats', { headers: authHeaders() });
    return res.ok ? res.json() : null;
  }

  async function renderStats() {
    var s = await fetchStats();
    if (!s) return;
    document.getElementById('st-today-count').textContent = s.today.count;
    document.getElementById('st-today-cents').textContent = money(s.today.totalCents) + ' vendido';
    document.getElementById('st-week-count').textContent = s.last7Days.count;
    document.getElementById('st-week-cents').textContent = money(s.last7Days.totalCents) + ' vendido';
    document.getElementById('st-month-count').textContent = s.month.count;
    document.getElementById('st-month-cents').textContent = money(s.month.totalCents) + ' vendido';
  }

  function initials(name) {
    return (name || '?').trim().split(/\\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function upcomingBookings() {
    var now = new Date();
    var in7Days = new Date(now.getTime() + 7 * 86400000);
    return state.bookings
      .filter(function (b) { return b.status !== 'cancelled' && b.appointmentAt && new Date(b.appointmentAt) >= now && new Date(b.appointmentAt) <= in7Days; })
      .sort(function (a, b) { return new Date(a.appointmentAt) - new Date(b.appointmentAt); })
      .slice(0, 8);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function emptyDashHtml(icon, title, sub) {
    return '<div style="text-align:center;padding:2.2rem 1rem">' +
      '<div class="icon-badge" style="margin:0 auto 0.9rem"><svg class="icon"><use href="#' + icon + '"/></svg></div>' +
      '<div style="font-weight:700;color:var(--teal-900);margin-bottom:0.3rem">' + esc(title) + '</div>' +
      '<div style="color:var(--soft);font-size:0.85rem">' + esc(sub) + '</div>' +
      '</div>';
  }

  function renderResumenList() {
    var list = upcomingBookings();
    var el = document.getElementById('resumen-list');
    if (!list.length) { el.innerHTML = emptyDashHtml('n-calendar', 'Tu calendario está vacío', 'Cuando tengas reservas para los próximos días, aparecerán aquí.'); return; }
    el.innerHTML = list.map(function (b) {
      return '<div class="list-row" style="cursor:pointer" onclick="openBookingModal(' + b.id + ')">' +
        '<div class="avatar">' + initials(b.clientName) + '</div>' +
        '<div class="info"><div class="t1">' + esc(b.clientName) + '</div>' +
        '<div class="t2">' + esc(b.serviceName) + ' · ' + esc(b.dayLabel) + ' ' + esc(b.timeLabel) + (b.collaboratorName ? ' · ' + esc(b.collaboratorName) : '') + '</div></div>' +
        '<span class="badge">' + money(b.priceCents) + '</span>' +
        '</div>';
    }).join('');
  }

  /* ---------- Ventas recientes (gráfico de 7 días) ---------- */
  var DOW_FMT = new Intl.DateTimeFormat('es-DO', { weekday: 'short', day: 'numeric' });

  function last7Days() {
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = startOfToday();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }

  function renderVentasChart() {
    var byDay = last7Days().map(function (d) {
      var dayBookings = state.bookings.filter(function (b) {
        return b.appointmentAt && sameDay(new Date(b.appointmentAt), d) && b.status !== 'cancelled';
      });
      return { date: d, count: dayBookings.length, cents: dayBookings.reduce(function (s, b) { return s + (b.priceCents || 0); }, 0) };
    });

    var totalCents = byDay.reduce(function (s, d) { return s + d.cents; }, 0);
    var totalCount = byDay.reduce(function (s, d) { return s + d.count; }, 0);
    document.getElementById('chart-total').textContent = money(totalCents) + ' vendido';
    document.getElementById('chart-meta').textContent = totalCount + (totalCount === 1 ? ' cita' : ' citas');

    var max = Math.max.apply(null, byDay.map(function (d) { return d.cents; }).concat([1]));
    var W = 560, H = 160, pad = 26;
    var stepX = (W - pad * 2) / (byDay.length - 1);
    var points = byDay.map(function (d, i) {
      return { x: pad + i * stepX, y: H - pad - (d.cents / max) * (H - pad * 2), d: d };
    });
    var linePath = points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    var areaPath = linePath + ' L' + points[points.length - 1].x.toFixed(1) + ',' + (H - pad) + ' L' + points[0].x.toFixed(1) + ',' + (H - pad) + ' Z';
    var dotsHtml = points.map(function (p) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5" fill="var(--teal-600)"><title>' + esc(DOW_FMT.format(p.d.date)) + ': ' + money(p.d.cents) + '</title></circle>';
    }).join('');
    var labelsHtml = points.map(function (p) {
      return '<text x="' + p.x.toFixed(1) + '" y="' + (H - 6) + '" font-size="9" fill="var(--soft)" text-anchor="middle">' + esc(DOW_FMT.format(p.d.date)) + '</text>';
    }).join('');

    document.getElementById('ventas-chart').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:150px;display:block">' +
        '<defs><linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--teal-500)" stop-opacity="0.28"/><stop offset="100%" stop-color="var(--teal-500)" stop-opacity="0"/></linearGradient></defs>' +
        '<path d="' + areaPath + '" fill="url(#chartFade)" stroke="none"/>' +
        '<path d="' + linePath + '" fill="none" stroke="var(--teal-600)" stroke-width="2"/>' +
        dotsHtml + labelsHtml +
      '</svg>';
  }

  /* ---------- Actividad de citas / Próximas citas de hoy ---------- */
  function renderActividad() {
    var list = state.bookings.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 6);
    var el = document.getElementById('actividad-list');
    if (!list.length) { el.innerHTML = emptyDashHtml('n-clock', 'Sin actividad todavía', 'Las citas que recibas aparecerán aquí.'); return; }
    el.innerHTML = list.map(function (b) {
      var cancelled = b.status === 'cancelled';
      return '<div class="list-row" style="cursor:pointer" onclick="openBookingModal(' + b.id + ')">' +
        '<div class="info"><div class="t1">' + esc(b.serviceName) + '</div>' +
        '<div class="t2">' + esc(b.dayLabel) + ' ' + esc(b.timeLabel) + ' · ' + esc(b.clientName) + '</div></div>' +
        '<span class="badge' + (cancelled ? ' cancelled' : '') + '">' + (cancelled ? 'Cancelada' : 'Reservada') + '</span>' +
        '</div>';
    }).join('');
  }

  function renderCitasHoy() {
    var today = startOfToday();
    var list = state.bookings.filter(function (b) {
      return b.appointmentAt && sameDay(new Date(b.appointmentAt), today) && b.status !== 'cancelled';
    }).sort(function (a, b) { return new Date(a.appointmentAt) - new Date(b.appointmentAt); });
    var el = document.getElementById('hoy-list');
    if (!list.length) { el.innerHTML = emptyDashHtml('n-calendar', 'No tienes citas hoy', 'Cuando tengas una reserva para hoy, aparecerá aquí.'); return; }
    el.innerHTML = list.map(function (b) {
      return '<div class="list-row" style="cursor:pointer" onclick="openBookingModal(' + b.id + ')">' +
        '<div class="avatar">' + initials(b.clientName) + '</div>' +
        '<div class="info"><div class="t1">' + esc(b.clientName) + '</div>' +
        '<div class="t2">' + esc(b.serviceName) + ' · ' + esc(b.timeLabel) + (b.collaboratorName ? ' · ' + esc(b.collaboratorName) : '') + '</div></div>' +
        '<span class="badge">' + money(b.priceCents) + '</span>' +
        '</div>';
    }).join('');
  }

  /* ---------- Mejores servicios / Mejor miembro del equipo ---------- */
  function monthBounds(offset) {
    var d = startOfMonth();
    d.setMonth(d.getMonth() + offset);
    return { start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) };
  }

  function rankedCounts(keyFn) {
    var thisM = monthBounds(0), lastM = monthBounds(-1);
    var counts = {};
    state.bookings.forEach(function (b) {
      if (!b.appointmentAt || b.status === 'cancelled') return;
      var d = new Date(b.appointmentAt);
      var key = keyFn(b);
      if (!key) return;
      counts[key] = counts[key] || { thisMonth: 0, lastMonth: 0 };
      if (d >= thisM.start && d < thisM.end) counts[key].thisMonth++;
      else if (d >= lastM.start && d < lastM.end) counts[key].lastMonth++;
    });
    return Object.keys(counts).map(function (key) { return { name: key, c: counts[key] }; })
      .sort(function (a, b) { return (b.c.thisMonth - a.c.thisMonth) || (b.c.lastMonth - a.c.lastMonth); });
  }

  function renderDashTable(elId, rows, icon, emptyTitle, emptySub, colLabel) {
    var el = document.getElementById(elId);
    if (!rows.length) { el.innerHTML = emptyDashHtml(icon, emptyTitle, emptySub); return; }
    el.innerHTML =
      '<div class="dash-table-head"><span>' + esc(colLabel) + '</span><span>Este mes</span><span>Último mes</span></div>' +
      rows.slice(0, 6).map(function (r) {
        return '<div class="dash-table-row"><span>' + esc(r.name) + '</span><span>' + r.c.thisMonth + '</span><span>' + r.c.lastMonth + '</span></div>';
      }).join('');
  }

  function renderMejoresServicios() {
    var rows = rankedCounts(function (b) { return b.serviceName; });
    renderDashTable('mejores-servicios-table', rows, 'n-tag', 'Sin datos todavía', 'Cuando tengas reservas, verás aquí tus servicios más pedidos.', 'Servicio');
  }

  function renderMejorEquipo() {
    var rows = rankedCounts(function (b) { return b.collaboratorName || (state.profile ? state.profile.name : 'Titular'); });
    renderDashTable('mejor-equipo-table', rows, 'n-users', 'Sin datos todavía', 'Cuando tengas reservas, verás aquí quién atiende más citas.', 'Miembro del equipo');
  }

  /* ---------- Calendario (vista mensual) ---------- */
  var MONTH_FMT = new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' });
  var DATE_FMT = new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });
  var DAY_HEAD_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var CAL_MAX_CHIPS = 3;

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function capitalize(s) { return s.replace(/^./, function (c) { return c.toUpperCase(); }); }

  window.calShiftMonth = function (delta) {
    var d = new Date(state.calMonth);
    d.setDate(1);
    d.setMonth(d.getMonth() + delta);
    state.calMonth = d;
    renderCalendar();
  };
  window.calGoToday = function () {
    state.calMonth = startOfMonth();
    renderCalendar();
  };

  function renderCalendar() {
    document.getElementById('cal-date-label').textContent = capitalize(MONTH_FMT.format(state.calMonth));

    var year = state.calMonth.getFullYear(), month = state.calMonth.getMonth();
    var startOffset = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    var today = startOfToday();

    var byDay = {};
    state.bookings.forEach(function (b) {
      if (!b.appointmentAt) return;
      var d = new Date(b.appointmentAt);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      (byDay[d.getDate()] = byDay[d.getDate()] || []).push(b);
    });
    Object.keys(byDay).forEach(function (day) {
      byDay[day].sort(function (a, b) { return new Date(a.appointmentAt) - new Date(b.appointmentAt); });
    });

    var headsHtml = DAY_HEAD_NAMES.map(function (n) { return '<div class="cal-month-head">' + n + '</div>'; }).join('');

    var cellsHtml = '';
    for (var i = 0; i < totalCells; i++) {
      var dayNum = i - startOffset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cellsHtml += '<div class="cal-month-cell pad"></div>';
        continue;
      }
      var isToday = sameDay(new Date(year, month, dayNum), today);
      var evs = byDay[dayNum] || [];
      var chipsHtml = evs.slice(0, CAL_MAX_CHIPS).map(function (b) {
        var cancelled = b.status === 'cancelled';
        return '<div class="cal-chip' + (cancelled ? ' cancelled' : '') + '" onclick="event.stopPropagation();openBookingModal(' + b.id + ')">' + esc(b.timeLabel) + ' ' + esc(b.clientName) + '</div>';
      }).join('');
      var moreHtml = evs.length > CAL_MAX_CHIPS
        ? '<div class="cal-more" onclick="event.stopPropagation();openDayAgenda(' + dayNum + ')">+' + (evs.length - CAL_MAX_CHIPS) + ' más</div>' : '';
      cellsHtml +=
        '<div class="cal-month-cell' + (isToday ? ' today' : '') + '" onclick="openDayAgenda(' + dayNum + ')">' +
          '<span class="cal-daynum">' + dayNum + '</span>' + chipsHtml + moreHtml +
        '</div>';
    }

    document.getElementById('cal-grid').innerHTML = '<div class="cal-month-grid">' + headsHtml + cellsHtml + '</div>';
  }

  window.openDayAgenda = function (dayNum) {
    var year = state.calMonth.getFullYear(), month = state.calMonth.getMonth();
    var date = new Date(year, month, dayNum);
    var evs = state.bookings.filter(function (b) {
      return b.appointmentAt && sameDay(new Date(b.appointmentAt), date);
    }).sort(function (a, b) { return new Date(a.appointmentAt) - new Date(b.appointmentAt); });

    document.getElementById('da-date').textContent = capitalize(DATE_FMT.format(date));
    var list = document.getElementById('da-list');
    if (!evs.length) {
      list.innerHTML = '<p class="empty-hint">No hay citas este día.</p>';
    } else {
      list.innerHTML = evs.map(function (b) {
        var cancelled = b.status === 'cancelled';
        return '<div class="list-row" style="cursor:pointer" onclick="closeDayAgenda();openBookingModal(' + b.id + ')">' +
          '<div class="avatar">' + initials(b.clientName) + '</div>' +
          '<div class="info"><div class="t1">' + esc(b.clientName) + '</div>' +
          '<div class="t2">' + esc(b.serviceName) + ' · ' + esc(b.timeLabel) + (b.collaboratorName ? ' · ' + esc(b.collaboratorName) : '') + '</div></div>' +
          '<span class="badge' + (cancelled ? ' cancelled' : '') + '">' + (cancelled ? 'Cancelada' : money(b.priceCents)) + '</span>' +
          '</div>';
      }).join('');
    }
    document.getElementById('day-agenda-backdrop').classList.add('show');
  };
  window.closeDayAgenda = function () {
    document.getElementById('day-agenda-backdrop').classList.remove('show');
  };

  var modalBookingId = null;
  window.openBookingModal = function (id) {
    var b = state.bookings.find(function (x) { return x.id === id; });
    if (!b) return;
    modalBookingId = id;
    document.getElementById('bm-client').textContent = b.clientName;
    document.getElementById('bm-service').textContent = b.serviceName;
    document.getElementById('bm-date').textContent = b.dayLabel + ' · ' + b.timeLabel;
    document.getElementById('bm-collab').textContent = b.collaboratorName || (state.profile ? state.profile.name : '—');
    document.getElementById('bm-pay').textContent = b.paymentMethod === 'cash' ? 'Efectivo' : (b.paymentMethod === 'transfer' ? 'Transferencia' : (b.paymentMethod || '—'));
    document.getElementById('bm-price').textContent = money(b.priceCents);
    var cancelBtn = document.getElementById('bm-cancel-btn');
    cancelBtn.style.display = b.status === 'cancelled' ? 'none' : 'flex';
    document.getElementById('booking-modal-backdrop').classList.add('show');
  };
  window.closeBookingModal = function () {
    document.getElementById('booking-modal-backdrop').classList.remove('show');
    modalBookingId = null;
  };
  window.cancelBookingFromModal = async function () {
    if (!modalBookingId) return;
    if (!confirm('¿Cancelar esta cita? Esta acción no se puede deshacer.')) return;
    try {
      var res = await fetch(BASE + '/api/bookings/' + modalBookingId + '/cancel', {
        method: 'POST', headers: authHeaders(),
      });
      if (!res.ok) { toast('No se pudo cancelar la cita.'); return; }
      var b = state.bookings.find(function (x) { return x.id === modalBookingId; });
      if (b) b.status = 'cancelled';
      closeBookingModal();
      renderCalendar();
      renderResumenList();
      toast('Cita cancelada.');
    } catch (err) {
      toast('No se pudo conectar con el servidor.');
    }
  };

  /* ---------- Servicios (solo lectura por ahora) ---------- */
  function renderServicios() {
    var svcs = (state.profile && state.profile.services) || [];
    var el = document.getElementById('servicios-list');
    if (!svcs.length) { el.innerHTML = '<p class="empty-hint">Todavía no tienes servicios cargados.</p>'; return; }
    el.innerHTML = svcs.map(function (s) {
      return '<div class="list-row"><div class="info"><div class="t1">' + esc(s.name) + '</div>' +
        '<div class="t2">' + s.durationMin + ' min</div></div><span class="badge">' + money(s.priceCents) + '</span></div>';
    }).join('') + '<p class="empty-hint" style="text-align:left;padding-top:0.9rem">Para agregar o cambiar servicios, por ahora hazlo desde la app móvil (próximamente aquí también).</p>';
  }

  /* ---------- Horario ---------- */
  var DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  function renderHours() {
    var el = document.getElementById('hours-list');
    el.innerHTML = state.hours.map(function (d) {
      return '<div class="hour-row" data-weekday="' + d.weekday + '">' +
        '<input type="checkbox" ' + (d.open ? 'checked' : '') + ' onchange="toggleHourDay(this)">' +
        '<span class="day">' + DAY_NAMES[d.weekday] + '</span>' +
        '<input type="time" class="h-start" value="' + d.startTime + '" ' + (d.open ? '' : 'disabled') + '>' +
        '<span class="sep">a</span>' +
        '<input type="time" class="h-end" value="' + d.endTime + '" ' + (d.open ? '' : 'disabled') + '>' +
        '</div>';
    }).join('');
  }
  window.toggleHourDay = function (checkbox) {
    var row = checkbox.closest('.hour-row');
    var open = checkbox.checked;
    row.querySelector('.h-start').disabled = !open;
    row.querySelector('.h-end').disabled = !open;
  };
  window.saveHours = async function () {
    var rows = document.querySelectorAll('#hours-list .hour-row');
    var days = Array.prototype.map.call(rows, function (row) {
      return {
        weekday: Number(row.dataset.weekday),
        open: row.querySelector('input[type=checkbox]').checked,
        startTime: row.querySelector('.h-start').value,
        endTime: row.querySelector('.h-end').value,
      };
    });
    var slug = proSlug();
    var res = await fetch(BASE + '/api/professionals/' + slug + '/hours', {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ days: days }),
    });
    if (!res.ok) { var d = await res.json().catch(function(){return{};}); toast(d.error || 'No se pudo guardar el horario.'); return; }
    toast('Horario guardado.');
  };

  /* ---------- Equipo ---------- */
  function renderTeam() {
    var owner = state.profile ? state.profile.name : '';
    document.getElementById('team-owner-hint').innerHTML = '<strong>' + esc(owner) + '</strong> es el titular del negocio. Siempre puede atender citas y no se puede quitar aquí.';
    var extra = ((state.profile && state.profile.collaborators) || []).filter(function (c) { return c.id !== null; });
    var el = document.getElementById('team-list');
    el.innerHTML = extra.map(teamRowHtml).join('');
  }
  function teamRowHtml(c) {
    return '<div class="team-row"><input type="text" class="tm-name" placeholder="Nombre" value="' + esc(c.name || '') + '">' +
      '<input type="text" class="tm-role" placeholder="Rol (ej: Estilista)" value="' + esc(c.role || '') + '">' +
      '<button class="row-del" onclick="this.closest(\\'.team-row\\').remove()"><svg class="icon"><use href="#n-x"/></svg></button></div>';
  }
  window.addTeamRow = function () {
    document.getElementById('team-list').insertAdjacentHTML('beforeend', teamRowHtml({ name: '', role: '' }));
  };
  window.saveTeam = async function () {
    var rows = document.querySelectorAll('#team-list .team-row');
    var collaborators = Array.prototype.map.call(rows, function (row) {
      return { name: row.querySelector('.tm-name').value.trim(), role: row.querySelector('.tm-role').value.trim() };
    }).filter(function (c) { return c.name; });
    var slug = proSlug();
    var res = await fetch(BASE + '/api/professionals/' + slug + '/collaborators', {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ collaborators: collaborators }),
    });
    if (!res.ok) { var d = await res.json().catch(function(){return{};}); toast(d.error || 'No se pudo guardar el equipo.'); return; }
    var profRes = await fetch(BASE + '/api/professionals/' + slug, { headers: authHeaders() });
    state.profile = await profRes.json();
    renderTeam();
    renderCalendar();
    toast('Equipo guardado.');
  };

  /* ---------- Cuentas bancarias ---------- */
  var BANK_NAMES = ['Banreservas', 'Banco Popular', 'BHD', 'Scotiabank', 'Banco Santa Cruz', 'Asociación Popular', 'APAP', 'Otro'];
  var ACCOUNT_TYPES = ['Ahorros', 'Corriente'];
  function bankRowHtml(b) {
    b = b || {};
    return '<div class="bank-row">' +
      '<select class="bk-bank">' + BANK_NAMES.map(function (n) { return '<option' + (b.bankName === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>' +
      '<select class="bk-type">' + ACCOUNT_TYPES.map(function (t) { return '<option' + (b.accountType === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
      '<input type="text" class="bk-number" placeholder="No. de cuenta" value="' + esc(b.accountNumber || '') + '">' +
      '<input type="text" class="bk-holder" placeholder="Titular" value="' + esc(b.accountHolder || '') + '">' +
      '<input type="text" class="bk-cedula" placeholder="Cédula/RNC" value="' + esc(b.cedulaRnc || '') + '">' +
      '<button class="row-del" onclick="this.closest(\\'.bank-row\\').remove()"><svg class="icon"><use href="#n-x"/></svg></button></div>';
  }
  function renderBanks() {
    var banks = (state.profile && state.profile.bankAccounts) || [];
    document.getElementById('banks-list').innerHTML = banks.map(bankRowHtml).join('');
  }
  window.addBankRow = function () {
    document.getElementById('banks-list').insertAdjacentHTML('beforeend', bankRowHtml());
  };
  window.saveBanks = async function () {
    var rows = document.querySelectorAll('#banks-list .bank-row');
    var accounts = Array.prototype.map.call(rows, function (row) {
      return {
        bankName: row.querySelector('.bk-bank').value,
        accountType: row.querySelector('.bk-type').value,
        accountNumber: row.querySelector('.bk-number').value.trim(),
        accountHolder: row.querySelector('.bk-holder').value.trim(),
        cedulaRnc: row.querySelector('.bk-cedula').value.trim(),
      };
    }).filter(function (a) { return a.accountNumber && a.accountHolder && a.cedulaRnc; });
    var slug = proSlug();
    var res = await fetch(BASE + '/api/professionals/' + slug + '/bank-accounts', {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ accounts: accounts }),
    });
    if (!res.ok) { var d = await res.json().catch(function(){return{};}); toast(d.error || 'No se pudo guardar.'); return; }
    toast('Cuentas guardadas.');
  };

  /* ---------- Mi perfil ---------- */
  function renderPerfil() {
    if (!state.profile) return;
    document.getElementById('pf-name').value = state.profile.name || '';
    document.getElementById('pf-business').value = state.profile.businessName || '';
    document.getElementById('pf-neighborhood').value = state.profile.neighborhood || '';
    var sel = document.getElementById('pf-category');
    sel.innerHTML = Object.keys(CAT_LABELS).map(function (key) {
      return '<option value="' + key + '"' + (key === state.profile.category ? ' selected' : '') + '>' + esc(CAT_LABELS[key]) + '</option>';
    }).join('');
  }

  window.savePerfil = async function () {
    document.getElementById('perfil-error').style.display = 'none';
    var name = document.getElementById('pf-name').value.trim();
    var businessName = document.getElementById('pf-business').value.trim();
    var neighborhood = document.getElementById('pf-neighborhood').value.trim();
    var category = document.getElementById('pf-category').value;

    if (!name || !businessName || !neighborhood) {
      return showAuthError('perfil-error', 'Completa tu nombre, el del negocio y el sector.');
    }

    var slug = proSlug();
    var res = await fetch(BASE + '/api/professionals/' + slug + '/profile', {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ name: name, businessName: businessName, neighborhood: neighborhood, category: category }),
    });
    if (!res.ok) {
      var d = await res.json().catch(function () { return {}; });
      return showAuthError('perfil-error', d.error || 'No se pudo guardar tu perfil.');
    }
    var profRes = await fetch(BASE + '/api/professionals/' + slug, { headers: authHeaders() });
    state.profile = await profRes.json();
    document.getElementById('sb-name').textContent = state.profile.businessName;
    document.getElementById('sb-cat').textContent = CAT_LABELS[state.profile.category] || state.profile.category;
    renderTeam();
    renderCalendar();
    toast('Perfil guardado.');
  };

  /* ---------- Navegación de panel ---------- */
  window.showPanel = function (name) {
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('show', p.id === 'panel-' + name); });
    document.querySelectorAll('.nav-item[data-panel]').forEach(function (b) { b.classList.toggle('active', b.dataset.panel === name); });
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeBookingModal();
  });

  /* ---------- Arranque ---------- */
  (async function boot() {
    if (getSession()) {
      await afterLogin();
    }
  })();
})();
</script>
</body>
</html>`;
}

module.exports = { negocioShell };
