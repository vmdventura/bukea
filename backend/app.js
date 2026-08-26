require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');

const { ensureReady } = require('./db/init');
const authRouter = require('./routes/auth');
const professionalsRouter = require('./routes/professionals');
const bookingsRouter = require('./routes/bookings');
const pagesRouter = require('./routes/pages');
const adminApiRouter = require('./routes/admin');
const { adminShell } = require('./views/admin');

const app = express();

// Passenger (cPanel) hace de proxy delante de Node: sin esto, req.ip sería
// siempre 127.0.0.1 y los límites por IP de lib/rate-limit.js no servirían.
app.set('trust proxy', 1);

app.use(express.json());

// Cabeceras de seguridad básicas en todas las respuestas.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');   // no adivinar tipos MIME
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Clickjacking: nadie puede meter Bukea en un iframe ajeno. La única
  // excepción es /negocio, que la app nativa (Capacitor) embebe a pantalla
  // completa; frame-ancestors sustituye a X-Frame-Options en ese caso.
  if (req.path === '/negocio' || req.path.endsWith('/negocio')) {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' capacitor://localhost https://localhost ionic://localhost");
  } else {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  next();
});

// La app empacada (Capacitor) sirve el frontend desde un origen propio
// (capacitor://localhost o https://localhost), distinto al de bukeard.com,
// así que sus peticiones a la API son cross-origin y necesitan CORS.
const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'https://localhost',
  'ionic://localhost',
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// cPanel/Passenger reenvía la ruta completa (incluyendo el prefijo de la
// URI configurada, ej. /bukea) sin recortarla, así que la app debe montarse
// bajo ese mismo prefijo en vez de en la raíz.
const BASE = process.env.BASE_PATH || '/bukea';

// El marketplace público (home, perfil compartible, /negocios, /precios)
// vive en la raíz del mismo Express, fuera de BASE — son páginas server-
// rendered de verdad (indexables) que solo enlazan HACIA la app (BASE) para
// reservar o unirse. req.baseUrlPrefix es cómo esas páginas arman esos
// enlaces sin hardcodear el prefijo.
app.use((req, res, next) => { req.baseUrlPrefix = BASE; next(); });
app.use('/', pagesRouter);

app.use(BASE + '/api/auth', authRouter);
app.use(BASE + '/api/professionals', professionalsRouter);
app.use(BASE + '/api/bookings', bookingsRouter);

app.get(BASE + '/api/health', (req, res) => res.json({ ok: true }));

// Panel de administración general — vive en la raíz (como el marketplace
// público), fuera de BASE, porque es una herramienta operativa separada de
// la app de clientes/negocios, con su propio login (ver routes/admin.js).
app.use('/api/admin', adminApiRouter);
app.get('/admin', (req, res) => res.type('html').send(adminShell()));

// index.html y manifest.json referencian BASE_PATH en su contenido (fetch()
// del frontend, start_url/scope del manifest), así que se sirven vía
// plantilla en vez de express.static para poder sustituir el prefijo real.
function sendTemplated(res, filePath, contentType) {
  const contents = fs.readFileSync(filePath, 'utf8')
    .replace(/__BASE_PATH__/g, BASE)
    .replace(/__GOOGLE_CLIENT_ID__/g, process.env.GOOGLE_CLIENT_ID || '')
    .replace(/__APPLE_CLIENT_ID__/g, process.env.APPLE_CLIENT_ID || '');
  res.type(contentType).send(contents);
}

app.get(BASE + '/manifest.json', (req, res) => {
  sendTemplated(res, path.join(__dirname, 'public', 'manifest.json'), 'application/json');
});

app.use(BASE, express.static(path.join(__dirname, 'public'), { index: false }));

app.get(BASE + '/*', (req, res) => {
  sendTemplated(res, path.join(__dirname, 'public', 'index.html'), 'text/html');
});
app.get(BASE, (req, res) => {
  sendTemplated(res, path.join(__dirname, 'public', 'index.html'), 'text/html');
});

const PORT = process.env.PORT || 3000;
ensureReady()
  .then(() => {
    app.listen(PORT, () => console.log(`Bukea backend escuchando en el puerto ${PORT}`));
  })
  .catch(err => {
    console.error('No se pudo preparar la base de datos:', err);
    process.exit(1);
  });
