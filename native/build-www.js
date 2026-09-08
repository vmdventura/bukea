// Genera native/www/ a partir de backend/public/ — reemplaza los mismos
// placeholders que el servidor sustituye en caliente (backend/app.js
// sendTemplated), pero al build-time, porque la app empaquetada no tiene
// servidor propio: solo carga HTML/JSON estáticos locales y llama a la API
// real por su URL absoluta.
//
// Uso:
//   BUKEA_ENV=production node build-www.js   (default si no se pasa nada)
//   BUKEA_ENV=staging BUKEA_API_BASE=http://192.168.1.20:3000/bukea node build-www.js
//
// BUKEA_ENV=staging exige BUKEA_API_BASE explícito (2026-09-08) — antes el
// script fijaba siempre la API de producción, así que no había forma de
// compilar un build nativo contra staging sin editar el archivo a mano y
// arriesgarse a dejarlo así por error. localhost/127.0.0.1 se rechazan
// porque un dispositivo físico no puede resolverlos contra la Mac.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, '..', 'backend', 'public');
const WWW_DIR = path.join(__dirname, 'www');

const ENV = process.env.BUKEA_ENV || 'production';
if (ENV !== 'production' && ENV !== 'staging') {
  console.error(`BUKEA_ENV inválido: "${ENV}" — usa "production" o "staging".`);
  process.exit(1);
}

let BASE_PATH;
if (ENV === 'production') {
  // Igual que BASE_PATH en producción, pero absoluto — la app no comparte
  // origen con bukeard.com, así que un path relativo ("/app") resolvería
  // contra el origen local de Capacitor, no contra el servidor real.
  BASE_PATH = 'https://www.bukeard.com/app';
} else {
  BASE_PATH = process.env.BUKEA_API_BASE;
  if (!BASE_PATH) {
    console.error('BUKEA_ENV=staging exige BUKEA_API_BASE (ej. http://192.168.1.20:3000/bukea).');
    process.exit(1);
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(BASE_PATH)) {
    console.error('BUKEA_API_BASE no puede ser localhost/127.0.0.1 — un iPhone físico no lo resuelve contra la Mac. Usa la IP de la Mac en la red local (o el simulador, que sí comparte red con el host).');
    process.exit(1);
  }
}

const GOOGLE_CLIENT_ID = '419876529270-l1mtt80qir3sqj6qeo224i441s86c7h6.apps.googleusercontent.com';
const APPLE_CLIENT_ID = 'com.bukea.web';

const TEMPLATED_FILES = ['index.html', 'manifest.json'];
const STATIC_FILES = ['favicon-32.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

function substitute(contents) {
  return contents
    .replace(/__BASE_PATH__/g, BASE_PATH)
    .replace(/__GOOGLE_CLIENT_ID__/g, GOOGLE_CLIENT_ID)
    .replace(/__APPLE_CLIENT_ID__/g, APPLE_CLIENT_ID);
}

fs.rmSync(WWW_DIR, { recursive: true, force: true });
fs.mkdirSync(WWW_DIR, { recursive: true });

for (const name of TEMPLATED_FILES) {
  const contents = fs.readFileSync(path.join(PUBLIC_DIR, name), 'utf8');
  fs.writeFileSync(path.join(WWW_DIR, name), substitute(contents));
  console.log(`✓ ${name} (con BASE_PATH absoluto)`);
}

for (const name of STATIC_FILES) {
  fs.copyFileSync(path.join(PUBLIC_DIR, name), path.join(WWW_DIR, name));
  console.log(`✓ ${name}`);
}

// Microfotos de categoría (img/cats/*.jpg): van también dentro del paquete
// para que carguen al instante y sin red; el loader del frontend usa la
// copia local primero y el servidor como respaldo.
const CATS_DIR = path.join(PUBLIC_DIR, 'img', 'cats');
if (fs.existsSync(CATS_DIR)) {
  const outDir = path.join(WWW_DIR, 'img', 'cats');
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of fs.readdirSync(CATS_DIR)) {
    if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
    fs.copyFileSync(path.join(CATS_DIR, name), path.join(outDir, name));
    console.log(`✓ img/cats/${name}`);
  }
}

// Falla el build si algún placeholder quedó sin sustituir (2026-09-08) —
// mejor un build que no se genera que uno instalado con "__BASE_PATH__"
// literal en el HTML servido.
for (const name of TEMPLATED_FILES) {
  const written = fs.readFileSync(path.join(WWW_DIR, name), 'utf8');
  const leftover = written.match(/__[A-Z_]+__/g);
  if (leftover) {
    console.error(`✗ ${name} tiene placeholders sin sustituir: ${[...new Set(leftover)].join(', ')}`);
    process.exit(1);
  }
}

let commit = 'sin-git';
try { commit = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim(); } catch (e) { /* fuera de un repo git */ }

const buildInfo = {
  env: ENV,
  apiBase: BASE_PATH,
  commit,
  builtAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(WWW_DIR, 'build-info.json'), JSON.stringify(buildInfo, null, 2));
console.log(`✓ build-info.json`);

const hash = require('crypto').createHash('sha256').update(fs.readFileSync(path.join(WWW_DIR, 'index.html'))).digest('hex');
console.log(`\nnative/www/ regenerado desde backend/public/.`);
console.log(`  entorno: ${ENV}`);
console.log(`  API: ${BASE_PATH}`);
console.log(`  commit: ${commit}`);
console.log(`  sha256(index.html): ${hash}`);
