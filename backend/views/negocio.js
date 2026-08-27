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
<meta name="theme-color" content="#002626">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" async></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
  .icon { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

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
  .auth-wrap { min-height: 100vh; display: flex; }
  .auth-side {
    display: none; flex: 1 1 42%; position: relative; overflow: hidden; isolation: isolate;
    background: linear-gradient(160deg, oklch(26% 0.05 195), var(--teal-900) 70%);
    color: #fff; padding: 3.5rem 3rem; flex-direction: column; justify-content: space-between;
  }
  .auth-side::before {
    content: ""; position: absolute; z-index: -1; width: 26rem; height: 26rem; top: -9rem; right: -8rem;
    border-radius: 50%; background: radial-gradient(circle, var(--gold-100), transparent 70%); opacity: 0.35;
  }
  .auth-side-brand { display: flex; align-items: center; gap: 0.55rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.2rem; }
  .auth-side-brand .mark { width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; }
  .auth-side h2 { font-size: 2rem; line-height: 1.15; margin: 2.5rem 0 0.8rem; max-width: 15ch; }
  .auth-side-sub { color: rgba(255,255,255,0.78); font-size: 0.95rem; max-width: 34ch; margin: 0 0 2.2rem; }
  .auth-side-perks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1.1rem; }
  .auth-side-perks li { display: flex; align-items: center; gap: 0.8rem; font-size: 0.92rem; }
  .auth-side-perks .icon-badge { width: 36px; height: 36px; border-radius: 11px; background: rgba(255,255,255,0.12); color: #fff; display: flex; align-items: center; justify-content: center; flex: none; }
  .auth-side-foot { color: rgba(255,255,255,0.6); font-size: 0.8rem; }
  @media (min-width: 900px) { .auth-side { display: flex; } }
  .auth-main { flex: 1 1 58%; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; padding: 2rem 1rem; gap: 1rem; }
  .auth-card { width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--line); border-radius: 22px; box-shadow: var(--sh-3); padding: 2.2rem 2rem; text-align: center; }
  .auth-card.wide { max-width: 640px; }
  .auth-brand { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.3rem; color: var(--teal-900); margin-bottom: 1.6rem; }
  .auth-brand .mark { width: 32px; height: 32px; border-radius: 9px; background: var(--teal-600); color: #fff; display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; }
  .auth-card h1 { font-size: 1.4rem; font-weight: 600; color: var(--teal-900); margin-bottom: 0.3rem; }
  .auth-sub { color: var(--soft); font-size: 0.88rem; margin: 0 0 1.4rem; }
  .field { margin-bottom: 1rem; text-align: center; }
  .field label { display: block; font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--soft); margin-bottom: 0.4rem; }
  .field input, .field select { width: 100%; padding: 0.72rem 0.9rem; border-radius: 12px; border: 1.5px solid var(--line); background: var(--bg); font-size: 0.92rem; color: var(--ink); text-align: center; }
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
  .nb-logo-pick { display: flex; justify-content: center; margin-bottom: 1.2rem; }
  .nb-logo-pick img, .nb-logo-placeholder { width: 108px; height: 108px; border-radius: 24px; object-fit: cover; }
  .nb-logo-placeholder { display: flex; align-items: center; justify-content: center; background: var(--teal-50); border: 1.5px dashed var(--line); color: var(--soft); }
  .nb-logo-placeholder .icon { width: 30px; height: 30px; }
  .nb-section-lbl { font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--soft); margin: 1.3rem 0 0.6rem; }
  .nb-section-lbl:first-of-type { margin-top: 0; }
  .nb-progress { height: 4px; border-radius: 999px; background: var(--line); margin: 1.6rem 0 1.6rem; overflow: hidden; }
  .nb-progress-fill { height: 100%; width: 20%; background: var(--teal-600); border-radius: 999px; transition: width 260ms var(--ease); }

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

  /* ===== Negocio (logo, fotos, mapa, ticket) ===== */
  .biz-photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.7rem; margin: 0.9rem 0; }
  .biz-photo-grid:empty { display: none; }
  .biz-photo-item { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 1; background: var(--bg); }
  .biz-photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .biz-photo-item .row-del { position: absolute; top: 0.3rem; right: 0.3rem; background: rgba(10,20,20,0.55); color: #fff; border-radius: 999px; padding: 0.3rem; }
  .biz-photo-item .row-del:hover { background: var(--danger); }
  .biz-map { height: 280px; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); }

  /* Chat de soporte (2026-08-27) — reemplaza el "Abrir ticket" de una sola
     vía por un hilo real con historial, ver routes/professionals.js. */
  .chat-msgs { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem; padding: 0.2rem 0.1rem 0.8rem; }
  .chat-msg { max-width: 78%; padding: 0.6rem 0.85rem; border-radius: 14px; font-size: 0.87rem; line-height: 1.45; white-space: pre-wrap; }
  .chat-msg.user { align-self: flex-end; background: var(--teal-600); color: #fff; border-bottom-right-radius: 4px; }
  .chat-msg.admin { align-self: flex-start; background: var(--bg); border: 1px solid var(--line); border-bottom-left-radius: 4px; }
  .chat-msg time { display: block; font-size: 0.68rem; opacity: 0.65; margin-top: 0.25rem; }
  .chat-composer { display: flex; gap: 0.6rem; align-items: flex-end; }
  .chat-composer textarea { flex: 1; min-height: 42px; max-height: 110px; padding: 0.65rem 0.85rem; border-radius: 12px; border: 1.5px solid var(--line); background: var(--bg); font-size: 0.88rem; color: var(--ink); font-family: inherit; resize: none; }
  .chat-composer textarea:focus { outline: none; border-color: var(--teal-500); }

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
<!-- Ecosistema Lucide (lucide-static, grid 24x24, trazo 2px) — ver DESIGN.md -->
<svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>
<symbol id="n-home" viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></symbol>
<symbol id="n-calendar" viewBox="0 0 24 24"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></symbol>
<symbol id="n-tag" viewBox="0 0 24 24"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></symbol>
<symbol id="n-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
<symbol id="n-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></symbol>
<symbol id="n-user" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>
<symbol id="n-card" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></symbol>
<symbol id="n-logout" viewBox="0 0 24 24"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></symbol>
<symbol id="n-plus" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></symbol>
<symbol id="n-x" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>
<symbol id="n-chev-l" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
<symbol id="n-chev-r" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
<symbol id="n-eye" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="n-eye-off" viewBox="0 0 24 24"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></symbol>
<symbol id="n-camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></symbol>
<symbol id="n-image" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></symbol>
<symbol id="n-building" viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></symbol>
<symbol id="n-share" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></symbol>
<symbol id="n-pin" viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="n-message" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></symbol>
<symbol id="n-trash" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></symbol>
</defs></svg>

<div id="auth" class="auth-wrap">
  <div class="auth-side">
    <a href="/" class="auth-side-brand"><span class="mark">b</span>Bukea negocios</a>
    <div>
      <h2>Tu agenda y tu clientela, sin pagar comisión</h2>
      <p class="auth-side-sub">Todo lo que necesitas para tu negocio de belleza, centralizado en un solo lugar.</p>
      <ul class="auth-side-perks">
        <li><span class="icon-badge"><svg class="icon"><use href="#i-calendar"/></svg></span>Agenda real, con disponibilidad de verdad</li>
        <li><span class="icon-badge"><svg class="icon"><use href="#i-chart"/></svg></span>"Mi Cuadre": cuánto vendiste, sin hoja de cálculo</li>
        <li><span class="icon-badge"><svg class="icon"><use href="#i-whatsapp"/></svg></span>Confirmaciones y recordatorios por WhatsApp</li>
        <li><span class="icon-badge"><svg class="icon"><use href="#i-percent"/></svg></span>Cero comisión, cero suscripción</li>
      </ul>
    </div>
    <p class="auth-side-foot">Gratis para siempre, sin tarjeta de crédito.</p>
  </div>
  <div class="auth-main">
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
      <div class="auth-switch">¿Buscas reservar una cita? <a href="${base}/" style="color:var(--teal-700);font-weight:700;text-decoration:underline">Ve a Bukea para clientes</a></div>
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
    <div class="nb-progress"><div class="nb-progress-fill" id="nb-progress-fill"></div></div>

    <div class="nb-step" id="nb-step-1">
      <h1>¿Cómo te llamas?</h1>
      <p class="auth-sub">Es gratis para siempre, cero comisión. Toma un minuto.</p>
      <p id="nb-error-1" class="auth-error"></p>
      <div class="field">
        <label for="nb-name">Tu nombre</label>
        <input id="nb-name" type="text" placeholder='Ej: Joel "El Fino" Batista'>
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="nbNext(1)">Siguiente</button>
    </div>

    <div class="nb-step" id="nb-step-2" style="display:none">
      <a href="#" class="auth-back" onclick="nbBack(2);return false"><svg class="icon"><use href="#n-chev-l"/></svg>Atrás</a>
      <h1>¿Cómo se llama tu negocio?</h1>
      <p class="auth-sub">Así lo verán tus clientes en Bukea.</p>
      <p id="nb-error-2" class="auth-error"></p>
      <div class="field">
        <label for="nb-business">Nombre del negocio</label>
        <input id="nb-business" type="text" placeholder="Ej: Barbería El Nítido">
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="nbNext(2)">Siguiente</button>
    </div>

    <div class="nb-step" id="nb-step-3" style="display:none">
      <a href="#" class="auth-back" onclick="nbBack(3);return false"><svg class="icon"><use href="#n-chev-l"/></svg>Atrás</a>
      <h1>¿Dónde queda tu negocio?</h1>
      <p class="auth-sub">El sector donde atiendes a tus clientes.</p>
      <p id="nb-error-3" class="auth-error"></p>
      <div class="field">
        <label for="nb-neighborhood">Sector</label>
        <input id="nb-neighborhood" type="text" placeholder="Ej: Villa Consuelo">
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="nbNext(3)">Siguiente</button>
    </div>

    <div class="nb-step" id="nb-step-4" style="display:none">
      <a href="#" class="auth-back" onclick="nbBack(4);return false"><svg class="icon"><use href="#n-chev-l"/></svg>Atrás</a>
      <h1>¿A qué te dedicas?</h1>
      <p class="auth-sub">Elige la categoría que mejor te describe.</p>
      <div class="nb-cat-grid" id="nb-cats"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1.2rem" onclick="nbNext(4)">Siguiente</button>
    </div>

    <div class="nb-step" id="nb-step-5" style="display:none">
      <a href="#" class="auth-back" onclick="nbBack(5);return false"><svg class="icon"><use href="#n-chev-l"/></svg>Atrás</a>
      <h1>Tus servicios</h1>
      <p class="auth-sub">Con duración y precio, para que tus clientes reserven sin llamarte.</p>
      <p id="auth-error-4" class="auth-error"></p>
      <div id="nb-svc-rows"></div>
      <button class="add-row" onclick="nbAddServiceRow()"><svg class="icon" style="width:14px;height:14px"><use href="#n-plus"/></svg> Agregar otro servicio</button>
      <label class="field" style="display:block;margin-top:1.2rem">
        <span style="display:block;font-size:0.8rem;font-weight:600;margin-bottom:0.3rem">¿Cómo conociste Bukea? <span style="font-weight:400;opacity:0.6">(opcional)</span></span>
        <select id="nb-referral" style="width:100%;padding:0.65rem 0.8rem;border:1px solid var(--line, #d5dedd);border-radius:10px;font:inherit;background:#fff">
          <option value="">Prefiero no decir</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="amigo">Un amigo o colega</option>
          <option value="google">Buscando en Google</option>
          <option value="visita">Me visitaron de Bukea</option>
          <option value="otro">Otro</option>
        </select>
      </label>
      <button class="btn btn-primary" id="nb-submit-btn" style="width:100%;justify-content:center;margin-top:1.4rem" onclick="nbSubmit()">Crear mi negocio</button>
    </div>

    <div class="nb-step" id="nb-step-6" style="display:none">
      <h1>Sube el logo de tu negocio</h1>
      <p class="auth-sub">Así te reconocen tus clientes en Bukea. Puedes agregarlo después si prefieres.</p>
      <p id="nb-error-6" class="auth-error"></p>
      <div class="nb-logo-pick">
        <img id="nb-logo-preview" alt="" style="display:none">
        <div class="nb-logo-placeholder" id="nb-logo-placeholder"><svg class="icon"><use href="#n-camera"/></svg></div>
      </div>
      <input type="file" id="nb-logo-file" accept="image/*" style="display:none" onchange="nbLogoPicked(this)">
      <button type="button" class="btn btn-ghost" style="width:100%;justify-content:center" onclick="document.getElementById('nb-logo-file').click()">Elegir foto</button>
      <button class="btn btn-primary" id="nb-logo-btn" style="width:100%;justify-content:center;margin-top:0.8rem" onclick="nbUploadLogo()" disabled>Guardar y continuar</button>
      <div class="auth-switch"><button type="button" onclick="nbSkipLogo()">Omitir por ahora</button></div>
    </div>

    <div class="auth-switch"><button type="button" onclick="nbSkip()">Omitir por ahora</button> · <button onclick="logout()">Cerrar sesión</button></div>
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
    <button class="nav-item" data-panel="social" onclick="showPanel('social')"><svg class="icon"><use href="#n-share"/></svg>Redes sociales</button>
    <button class="nav-item" data-panel="negocio" onclick="showPanel('negocio')"><svg class="icon"><use href="#n-building"/></svg>Negocio</button>
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
        <button class="btn btn-primary" onclick="saveServicios()">Guardar cambios</button>
      </div>
      <div class="card">
        <div id="servicios-list"><p class="empty-hint">Cargando…</p></div>
        <button class="add-row" onclick="addServicioRow()"><svg class="icon" style="width:14px;height:14px"><use href="#n-plus"/></svg> Agregar servicio</button>
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

    <!-- ===== Redes sociales ===== -->
    <div class="panel" id="panel-social">
      <div class="content-head">
        <div>
          <h1>Redes sociales</h1>
          <p>Tus redes, visibles en tu perfil público para que te sigan.</p>
        </div>
        <button class="btn btn-primary" onclick="saveSocial()">Guardar cambios</button>
      </div>
      <div class="card">
        <div class="field">
          <label for="sc-instagram">Instagram</label>
          <input id="sc-instagram" type="text" placeholder="@tunegocio o link completo">
        </div>
        <div class="field">
          <label for="sc-facebook">Facebook</label>
          <input id="sc-facebook" type="text" placeholder="@tunegocio o link completo">
        </div>
        <div class="field">
          <label for="sc-tiktok">TikTok</label>
          <input id="sc-tiktok" type="text" placeholder="@tunegocio o link completo">
        </div>
        <div class="field" style="margin-bottom:0">
          <label for="sc-website">Sitio web</label>
          <input id="sc-website" type="text" placeholder="www.tunegocio.com">
        </div>
      </div>
    </div>

    <!-- ===== Negocio (fotos, mapa, soporte) ===== -->
    <div class="panel" id="panel-negocio">
      <div class="content-head">
        <div>
          <h1>Negocio</h1>
          <p>Fotos, ubicación exacta y soporte directo con el equipo de Bukea.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Logo del negocio</h3></div>
        <div class="nb-logo-pick" style="justify-content:flex-start;gap:1rem;align-items:center">
          <img id="biz-logo-preview" alt="" style="display:none">
          <div class="nb-logo-placeholder" id="biz-logo-placeholder"><svg class="icon"><use href="#n-camera"/></svg></div>
          <div>
            <input type="file" id="biz-logo-file" accept="image/*" style="display:none" onchange="bizLogoPicked(this)">
            <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('biz-logo-file').click()">Cambiar logo</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Fotos del negocio</h3></div>
        <p class="dash-sub">Muéstrale a tus clientes cómo es tu local.</p>
        <div class="biz-photo-grid" id="biz-photo-grid"></div>
        <input type="file" id="biz-photo-file" accept="image/*" style="display:none" onchange="bizPhotoPicked(this)">
        <button class="add-row" onclick="document.getElementById('biz-photo-file').click()"><svg class="icon" style="width:14px;height:14px"><use href="#n-plus"/></svg> Agregar foto</button>
      </div>

      <div class="card">
        <div class="card-head"><h3>Ubicación en el mapa</h3></div>
        <p class="dash-sub">Arrastra el pin a la ubicación exacta de tu negocio.</p>
        <div id="biz-map" class="biz-map"></div>
        <button class="btn btn-primary btn-sm" style="margin-top:0.8rem" onclick="saveBizLocation()">Guardar ubicación</button>
      </div>

      <div class="card">
        <div class="card-head"><h3>Chat con Bukea</h3></div>
        <p class="dash-sub">Escríbenos directo. Te respondemos aquí mismo, no necesitas abrir un ticket aparte.</p>
        <div class="chat-msgs" id="chat-msgs"><p class="dash-sub">Cargando…</p></div>
        <p id="ticket-error" class="auth-error" style="display:none"></p>
        <div class="chat-composer">
          <textarea id="ticket-message" placeholder="Cuéntanos qué necesitas…"></textarea>
          <button class="btn btn-primary btn-sm" onclick="sendChatMessage()"><svg class="icon" style="width:16px;height:16px"><use href="#n-message"/></svg></button>
        </div>
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

  // La app nativa embebe este panel en un iframe y le pasa su sesión ya
  // iniciada por el hash (#app-session=...), para que el dueño no tenga que
  // volver a poner teléfono y PIN dentro del panel. El hash nunca viaja al
  // servidor y se borra de la URL apenas se consume.
  // La app nativa también puede pedir abrir directo en un panel puntual
  // (ej. #panel=negocio para el logo/pin del mapa, #panel=servicios) en vez
  // de caer siempre en "Resumen" — se aplica después del login en boot().
  var requestedPanel = (/[#&]panel=([a-z]+)/.exec(location.hash || '') || [])[1] || null;
  (function adoptAppSession() {
    var m = /[#&]app-session=([^&]+)/.exec(location.hash || '');
    if (!m) return;
    try {
      var s = JSON.parse(decodeURIComponent(m[1]));
      if (s && s.token) localStorage.setItem('bukea_session', JSON.stringify(s));
    } catch (e) { /* hash corrupto: se ignora y el panel pide login normal */ }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  })();
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

    // proSlug() solo vive en este navegador (se guarda al crear el
    // negocio) — un dueño que entra desde otro dispositivo no lo tendría
    // todavía, así que antes de mandarlo al asistente "Crea tu negocio" se
    // le pregunta al servidor si ya es dueño de algo (2026-08-25).
    if (!slug) {
      try {
        var meRes = await fetch(BASE + '/api/professionals/me', { headers: authHeaders() });
        var me = await meRes.json().catch(function () { return {}; });
        if (me.slug) { slug = me.slug; setProSlug(slug); }
      } catch (e) { /* sin conexión: seguimos al asistente, no se pierde nada */ }
    }

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

  var NB_STEPS = 6;
  var nbCurrentStep = 1;

  function nbGoStep(n) {
    nbCurrentStep = n;
    for (var i = 1; i <= NB_STEPS; i++) {
      document.getElementById('nb-step-' + i).style.display = i === n ? 'block' : 'none';
    }
    document.getElementById('nb-progress-fill').style.width = Math.round((n / NB_STEPS) * 100) + '%';
  }

  window.nbBack = function (fromStep) {
    nbGoStep(fromStep - 1);
  };

  // Omitir el asistente de "Crea tu negocio" (2026-08-25) — una cuenta que
  // inicia sesión aquí sin negocio propio (ej. la del admin) no tiene otra
  // salida que cerrar sesión. Este link deja la sesión intacta y manda a
  // la persona al marketplace público, donde sí puede navegar como
  // cualquier visitante logueado.
  window.nbSkip = function () {
    location.href = '/';
  };

  window.nbNext = function (fromStep) {
    var errEl = document.getElementById('nb-error-' + fromStep);
    if (errEl) errEl.style.display = 'none';
    if (fromStep === 1 && !document.getElementById('nb-name').value.trim()) {
      errEl.textContent = 'Dinos tu nombre.'; errEl.style.display = 'block'; return;
    }
    if (fromStep === 2 && !document.getElementById('nb-business').value.trim()) {
      errEl.textContent = 'Dinos el nombre de tu negocio.'; errEl.style.display = 'block'; return;
    }
    if (fromStep === 3 && !document.getElementById('nb-neighborhood').value.trim()) {
      errEl.textContent = 'Dinos en qué sector estás.'; errEl.style.display = 'block'; return;
    }
    nbGoStep(fromStep + 1);
  };

  function showNewBizStep() {
    document.getElementById('auth-login-card').style.display = 'none';
    document.getElementById('auth-step-newbiz').style.display = 'block';
    nbGoStep(1);

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
        body: JSON.stringify({ name: name, businessName: businessName, neighborhood: neighborhood, category: nbSelectedCat, services: services, referralSource: document.getElementById('nb-referral').value || null }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) return showAuthError('auth-error-4', data.error || 'No se pudo crear el negocio.');
      setProSlug(data.slug);
      toast('¡Tu negocio ya está en Bukea!');
      nbGoStep(6);
    } catch (err) {
      showAuthError('auth-error-4', 'No se pudo conectar con el servidor.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Crear mi negocio';
    }
  };

  /* ---------- Logo al final del wizard (opcional) ---------- */
  var nbLogoFile = null;
  window.nbLogoPicked = function (input) {
    nbLogoFile = input.files && input.files[0];
    if (!nbLogoFile) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = document.getElementById('nb-logo-preview');
      img.src = e.target.result;
      img.style.display = 'block';
      document.getElementById('nb-logo-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(nbLogoFile);
    document.getElementById('nb-logo-btn').disabled = false;
  };
  window.nbUploadLogo = async function () {
    if (!nbLogoFile) return;
    var errEl = document.getElementById('nb-error-6');
    errEl.style.display = 'none';
    var btn = document.getElementById('nb-logo-btn');
    btn.disabled = true;
    btn.textContent = 'Subiendo…';
    try {
      var form = new FormData();
      form.append('logo', nbLogoFile);
      var res = await fetch(BASE + '/api/professionals/' + proSlug() + '/logo', {
        method: 'POST', headers: authHeaders(), body: form,
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        errEl.textContent = data.error || 'No se pudo subir el logo.';
        errEl.style.display = 'block';
        return;
      }
      document.getElementById('auth-step-newbiz').style.display = 'none';
      await afterLogin();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar y continuar';
    }
  };
  window.nbSkipLogo = async function () {
    document.getElementById('auth-step-newbiz').style.display = 'none';
    await afterLogin();
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
    renderSocial();
    renderBizLogo();
    renderBizPhotos();
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

  /* ---------- Servicios ---------- */
  function svcRowHtml(s) {
    s = s || {};
    return '<div class="svc-row">' +
      '<input type="text" class="sv-name" placeholder="Servicio (ej: Corte clásico)" value="' + esc(s.name || '') + '">' +
      '<input type="number" class="sv-min" min="5" step="5" placeholder="Min" value="' + (s.durationMin || '') + '">' +
      '<input type="number" class="sv-price" min="0" step="50" placeholder="RD$" value="' + (s.priceCents ? Math.round(s.priceCents / 100) : '') + '">' +
      '<button class="row-del" onclick="this.closest(\\'.svc-row\\').remove()"><svg class="icon"><use href="#n-x"/></svg></button></div>';
  }
  function renderServicios() {
    var svcs = (state.profile && state.profile.services) || [];
    var el = document.getElementById('servicios-list');
    el.innerHTML = svcs.length ? svcs.map(svcRowHtml).join('') : svcRowHtml();
  }
  window.addServicioRow = function () {
    document.getElementById('servicios-list').insertAdjacentHTML('beforeend', svcRowHtml());
  };
  window.saveServicios = async function () {
    var rows = document.querySelectorAll('#servicios-list .svc-row');
    var services = Array.prototype.map.call(rows, function (row) {
      return {
        name: row.querySelector('.sv-name').value.trim(),
        durationMin: Number(row.querySelector('.sv-min').value),
        priceCents: Math.round(Number(row.querySelector('.sv-price').value) * 100),
      };
    }).filter(function (s) { return s.name && s.durationMin > 0 && s.priceCents >= 0; });
    if (!services.length) { toast('Agrega al menos un servicio con nombre, duración y precio.'); return; }

    var slug = proSlug();
    var res = await fetch(BASE + '/api/professionals/' + slug + '/services', {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ services: services }),
    });
    if (!res.ok) { var d = await res.json().catch(function () { return {}; }); toast(d.error || 'No se pudo guardar.'); return; }
    var profRes = await fetch(BASE + '/api/professionals/' + slug, { headers: authHeaders() });
    state.profile = await profRes.json();
    renderServicios();
    toast('Servicios guardados.');
  };

  /* ---------- Redes sociales ---------- */
  function renderSocial() {
    var s = (state.profile && state.profile.social) || {};
    document.getElementById('sc-instagram').value = s.instagram || '';
    document.getElementById('sc-facebook').value = s.facebook || '';
    document.getElementById('sc-tiktok').value = s.tiktok || '';
    document.getElementById('sc-website').value = s.website || '';
  }
  window.saveSocial = async function () {
    var slug = proSlug();
    var res = await fetch(BASE + '/api/professionals/' + slug + '/social', {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({
        instagram: document.getElementById('sc-instagram').value.trim(),
        facebook: document.getElementById('sc-facebook').value.trim(),
        tiktok: document.getElementById('sc-tiktok').value.trim(),
        website: document.getElementById('sc-website').value.trim(),
      }),
    });
    if (!res.ok) { toast('No se pudo guardar.'); return; }
    toast('Redes sociales guardadas.');
  };

  /* ---------- Negocio: logo, fotos, mapa, ticket ---------- */
  var bizMap = null, bizMarker = null;

  function renderBizLogo() {
    var url = state.profile && state.profile.logoUrl;
    var img = document.getElementById('biz-logo-preview');
    var placeholder = document.getElementById('biz-logo-placeholder');
    if (url) {
      img.src = url; img.style.display = 'block'; placeholder.style.display = 'none';
    } else {
      img.style.display = 'none'; placeholder.style.display = 'flex';
    }
  }
  window.bizLogoPicked = async function (input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var form = new FormData();
    form.append('logo', file);
    var res = await fetch(BASE + '/api/professionals/' + proSlug() + '/logo', {
      method: 'POST', headers: authHeaders(), body: form,
    });
    if (!res.ok) { toast('No se pudo subir el logo.'); return; }
    var data = await res.json();
    state.profile.logoUrl = data.logoUrl;
    renderBizLogo();
    toast('Logo actualizado.');
  };

  function photoItemHtml(p) {
    return '<div class="biz-photo-item" data-id="' + p.id + '"><img src="' + p.url + '" alt="">' +
      '<button class="row-del" onclick="deleteBizPhoto(' + p.id + ', this)"><svg class="icon" style="width:16px;height:16px"><use href="#n-x"/></svg></button></div>';
  }
  function renderBizPhotos() {
    var photos = (state.profile && state.profile.photos) || [];
    document.getElementById('biz-photo-grid').innerHTML = photos.map(photoItemHtml).join('');
  }
  window.bizPhotoPicked = async function (input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var form = new FormData();
    form.append('photo', file);
    var res = await fetch(BASE + '/api/professionals/' + proSlug() + '/photos', {
      method: 'POST', headers: authHeaders(), body: form,
    });
    input.value = '';
    if (!res.ok) { toast('No se pudo subir la foto.'); return; }
    var data = await res.json();
    (state.profile.photos = state.profile.photos || []).push({ id: data.id, url: data.url });
    renderBizPhotos();
    toast('Foto agregada.');
  };
  window.deleteBizPhoto = async function (id, btn) {
    var res = await fetch(BASE + '/api/professionals/' + proSlug() + '/photos/' + id, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (!res.ok) { toast('No se pudo borrar la foto.'); return; }
    btn.closest('.biz-photo-item').remove();
    state.profile.photos = (state.profile.photos || []).filter(function (p) { return p.id !== id; });
  };

  function initBizMap() {
    var lat = (state.profile && state.profile.lat) || 18.4861;
    var lng = (state.profile && state.profile.lng) || -69.9312;
    if (!bizMap) {
      bizMap = L.map('biz-map').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(bizMap);
      bizMarker = L.marker([lat, lng], { draggable: true }).addTo(bizMap);
    } else {
      bizMap.invalidateSize();
      bizMap.setView([lat, lng], 15);
      bizMarker.setLatLng([lat, lng]);
    }
  }
  window.saveBizLocation = async function () {
    if (!bizMarker) return;
    var pos = bizMarker.getLatLng();
    var res = await fetch(BASE + '/api/professionals/' + proSlug() + '/location', {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ lat: pos.lat, lng: pos.lng }),
    });
    if (!res.ok) { toast('No se pudo guardar la ubicación.'); return; }
    state.profile.lat = pos.lat;
    state.profile.lng = pos.lng;
    toast('Ubicación guardada.');
  };

  function chatBubbleHtml(m) {
    var when = new Date(m.createdAt || m.created_at);
    var time = isNaN(when) ? '' : when.toLocaleString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return '<div class="chat-msg ' + (m.sender === 'admin' ? 'admin' : 'user') + '">' + esc(m.body) + '<time>' + time + '</time></div>';
  }

  window.loadChat = async function () {
    var box = document.getElementById('chat-msgs');
    try {
      var res = await fetch(BASE + '/api/professionals/' + proSlug() + '/messages', { headers: authHeaders() });
      if (!res.ok) throw new Error();
      var messages = await res.json();
      box.innerHTML = messages.length
        ? messages.map(chatBubbleHtml).join('')
        : '<p class="dash-sub">Todavía no has escrito nada. Cuéntanos qué necesitas.</p>';
      box.scrollTop = box.scrollHeight;
    } catch (err) {
      box.innerHTML = '<p class="dash-sub">No se pudo cargar el chat.</p>';
    }
  };

  window.sendChatMessage = async function () {
    var errEl = document.getElementById('ticket-error');
    errEl.style.display = 'none';
    var textarea = document.getElementById('ticket-message');
    var message = textarea.value.trim();
    if (!message) { errEl.textContent = 'Escribe tu mensaje.'; errEl.style.display = 'block'; return; }
    var res = await fetch(BASE + '/api/professionals/' + proSlug() + '/messages', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ message: message }),
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) { errEl.textContent = data.error || 'No se pudo enviar. Intenta de nuevo.'; errEl.style.display = 'block'; return; }
    textarea.value = '';
    loadChat();
  };

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
    // El mapa de Leaflet necesita medir un contenedor visible — si se crea
    // con el panel oculto (display:none) queda con tamaño 0. Se inicializa
    // recién cuando el usuario entra a "Negocio" por primera vez.
    if (name === 'negocio') { setTimeout(initBizMap, 0); loadChat(); }
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeBookingModal();
  });

  /* ---------- Arranque ---------- */
  (async function boot() {
    // "Ver panel del negocio" desde el panel de administración (2026-08-25)
    // — llega con un token de sesión ya emitido para el dueño real y el
    // slug de su negocio, en vez de pasar por el login. Se limpia de la
    // URL de inmediato para no dejarlo en el historial del navegador.
    var params = new URLSearchParams(location.search);
    var adminToken = params.get('admin_view');
    if (adminToken) {
      setSession({ token: adminToken });
      setProSlug(params.get('slug') || '');
      history.replaceState(null, '', location.pathname);
    }

    if (getSession()) {
      await afterLogin();
      if (requestedPanel) showPanel(requestedPanel);
    }
  })();
})();
</script>
</body>
</html>`;
}

module.exports = { negocioShell };
