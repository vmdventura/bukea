// Genera native/www/ a partir de backend/public/ — reemplaza los mismos
// placeholders que el servidor sustituye en caliente (backend/app.js
// sendTemplated), pero al build-time, porque la app empaquetada no tiene
// servidor propio: solo carga HTML/JSON estáticos locales y llama a la API
// real de bukeard.com por su URL absoluta.
//
// Uso: node build-www.js

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'backend', 'public');
const WWW_DIR = path.join(__dirname, 'www');

// Igual que BASE_PATH en producción, pero absoluto — la app no comparte
// origen con bukeard.com, así que un path relativo ("/app") resolvería
// contra el origen local de Capacitor, no contra el servidor real.
const BASE_PATH = 'https://www.bukeard.com/app';
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

console.log(`\nnative/www/ regenerado desde backend/public/. Base: ${BASE_PATH}`);
