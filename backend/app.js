require('dotenv').config();
const path = require('path');
const express = require('express');

const { ensureReady } = require('./db/init');
const authRouter = require('./routes/auth');
const professionalsRouter = require('./routes/professionals');
const bookingsRouter = require('./routes/bookings');
const adminRouter = require('./routes/admin');

const app = express();
app.use(express.json());

// cPanel/Passenger reenvía la ruta completa (incluyendo el prefijo de la
// URI configurada, ej. /bukea) sin recortarla, así que la app debe montarse
// bajo ese mismo prefijo en vez de en la raíz.
const BASE = process.env.BASE_PATH || '/bukea';

app.use(BASE + '/api/auth', authRouter);
app.use(BASE + '/api/professionals', professionalsRouter);
app.use(BASE + '/api/bookings', bookingsRouter);
app.use(BASE + '/admin', adminRouter);

app.get(BASE + '/api/health', (req, res) => res.json({ ok: true }));

// manifest.json trae el prefijo de despliegue (start_url/scope) — se resuelve
// en base a BASE en vez de quedar fijo, para que la PWA instale bien sin
// importar bajo qué subruta viva (/bukea, /app, la raíz del dominio, etc).
app.get(BASE + '/manifest.json', (req, res) => {
  const fs = require('fs');
  const manifest = fs.readFileSync(path.join(__dirname, 'public', 'manifest.json'), 'utf8');
  res.type('application/manifest+json').send(manifest.replaceAll('__BASE__', BASE));
});

app.use(BASE, express.static(path.join(__dirname, 'public')));
app.get(BASE + '/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get(BASE, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
