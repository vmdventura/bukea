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

// Red de seguridad de proceso (2026-09-08, encontrada corriendo la suite de
// pruebas: una promesa rechazada sin capturar en una ruta async — ej. un
// INSERT que choca con una llave única en una carrera real entre dos
// peticiones — tumba TODO el proceso de Node en Express 4, cortando a
// cualquier usuario conectado, no solo a quien disparó el error. La causa
// puntual que se encontró (POST /register) ya tiene su propio try/catch
// arriba; esto es la malla de respaldo para cualquier otra que aparezca:
// evita que el servidor entero muera, aunque la petición que causó el
// error puede quedar sin respuesta (el cliente eventualmente hace timeout)
// en vez de recibir un 500 limpio — cubrir eso de verdad requeriría
// envolver cada handler async, fuera de alcance de este cambio puntual.
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection] petición sin capturar, el servidor sigue vivo:', err);
});

const app = express();

// Passenger (cPanel) hace de proxy delante de Node: sin esto, req.ip sería
// siempre 127.0.0.1 y los límites por IP de lib/rate-limit.js no servirían.
app.set('trust proxy', 1);

app.use(express.json());

// Cabeceras de seguridad básicas en todas las respuestas.
//
// La excepción de frame-ancestors para /negocio era para el iframe que la
// app nativa usaba para embeber el panel a pantalla completa — retirado el
// 2026-09-08 (el panel ahora navega de verdad, sin iframe). El build nuevo
// no lo necesita, pero el build 2 (en revisión de Apple al momento de este
// cambio) sí lo usa. ALLOW_LEGACY_PANEL_EMBED (default apagado) es el
// interruptor para reabrirlo en producción, acotado y documentado, mientras
// ese build viejo siga circulando. El build nuevo nunca la enciende.
const ALLOW_LEGACY_PANEL_EMBED = process.env.ALLOW_LEGACY_PANEL_EMBED === '1';
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');   // no adivinar tipos MIME
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (ALLOW_LEGACY_PANEL_EMBED && (req.path === '/negocio' || req.path.endsWith('/negocio'))) {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' capacitor://localhost https://localhost ionic://localhost");
  } else {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  next();
});

// La app empacada (Capacitor) sirve el frontend desde un origen propio
// (capacitor://localhost o https://localhost), distinto al de bukeard.com,
// así que sus peticiones a la API son cross-origin y necesitan CORS.
// CORS_EXTRA_ORIGINS (2026-09-08): orígenes adicionales para pruebas de
// staging (ej. un runner de Playwright en http://127.0.0.1:xxxx), separados
// por coma. Vacío en producción — no se toca el allow-list real del build.
const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'https://localhost',
  'ionic://localhost',
  ...(process.env.CORS_EXTRA_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Vary: Origin siempre, exista o no match — la respuesta a esta misma
  // ruta cambia según el Origin de quien pregunta (cabeceras CORS puestas
  // o no), así que un caché intermedio no debe servir la respuesta de un
  // origen a otro distinto.
  res.setHeader('Vary', 'Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // PATCH agregado (2026-09-08): PATCH /api/auth/name existe desde el
    // 6 de septiembre pero nunca se sumó aquí — un preflight real desde el
    // origen nativo lo habría rechazado (SEC-06).
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
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
app.get('/admin', (req, res) => res.type('html').send(adminShell({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' })));

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
