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
<style>
  :root {
    --teal-900: oklch(24% 0.045 195);
    --teal-700: oklch(37% 0.075 195);
    --teal-600: oklch(46% 0.09 195);
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
    --sh-2: 0 4px 14px rgba(15,40,38,0.07);
    --sh-teal: 0 8px 20px rgba(10,79,77,0.22);
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--ink); }
  h1, h2, h3, .display { font-family: "Fraunces", Georgia, serif; }
  a { color: inherit; }
  img { max-width: 100%; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
  .site-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
  .brand { display: flex; align-items: center; gap: 0.5rem; font-family: "Fraunces", serif; font-weight: 700; font-size: 1.3rem; text-decoration: none; color: var(--teal-900); }
  .brand .mark { width: 34px; height: 34px; border-radius: 10px; background: var(--teal-600); color: #fff; display: flex; align-items: center; justify-content: center; font-family: "Fraunces", serif; font-style: italic; font-weight: 700; }
  .site-nav { display: flex; align-items: center; gap: 1.4rem; font-size: 0.92rem; font-weight: 600; }
  .site-nav a { text-decoration: none; color: var(--soft); }
  .site-nav a:hover { color: var(--teal-700); }
  .btn { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 999px; padding: 0.7rem 1.3rem; font-weight: 700; font-size: 0.92rem; text-decoration: none; border: none; cursor: pointer; font-family: inherit; transition: transform 160ms var(--ease), box-shadow 160ms var(--ease); }
  .btn:hover { transform: translateY(-1px); }
  .btn-primary { background: var(--teal-600); color: #fff; box-shadow: var(--sh-teal); }
  .btn-ghost { background: var(--card); color: var(--teal-700); border: 1.5px solid var(--line); }
  .badge { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--teal-100); color: var(--teal-700); border-radius: 999px; padding: 0.3rem 0.7rem; font-size: 0.78rem; font-weight: 700; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--sh-2); }
  .site-footer { border-top: 1px solid var(--line); margin-top: 3rem; padding: 2rem 0; color: var(--soft); font-size: 0.85rem; }
  .site-footer a { color: var(--teal-700); text-decoration: none; }
  @media (max-width: 640px) {
    .site-header { flex-wrap: wrap; gap: 0.7rem; }
    .brand { font-size: 1.15rem; }
    .site-nav { width: 100%; justify-content: space-between; gap: 0.7rem; font-size: 0.82rem; }
    .site-nav .btn { padding: 0.55rem 1rem; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header class="site-header">
    <a class="brand" href="/"><span class="mark">b</span>Bukea</a>
    <nav class="site-nav">
      <a href="/negocios">Para negocios</a>
      <a href="/precios">Precios</a>
      <a class="btn btn-ghost" href="${base}/">Entrar</a>
    </nav>
  </header>
</div>
${bodyHtml}
<footer class="site-footer">
  <div class="wrap">
    Bukea — bukea tu cita de belleza en República Dominicana. Cero comisión.
    &nbsp;·&nbsp; <a href="/negocios">Para negocios</a>
    &nbsp;·&nbsp; <a href="/precios">Precios</a>
    &nbsp;·&nbsp; <a href="${base}/">Abrir la app</a>
  </div>
</footer>
</body>
</html>`;
}

module.exports = { CAT_LABELS, avatarGradient, initials, formatPrice, esc, pageShell };
