require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');

const { ensureReady } = require('./db/init');
const authRouter = require('./routes/auth');
const professionalsRouter = require('./routes/professionals');
const bookingsRouter = require('./routes/bookings');
const pagesRouter = require('./routes/pages');

const app = express();
app.use(express.json());

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
