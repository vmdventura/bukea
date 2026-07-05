require('dotenv').config();
const path = require('path');
const express = require('express');

const { ensureReady } = require('./db/init');
const professionalsRouter = require('./routes/professionals');
const bookingsRouter = require('./routes/bookings');

const app = express();
app.use(express.json());

// cPanel/Passenger reenvía la ruta completa (incluyendo el prefijo de la
// URI configurada, ej. /bukea) sin recortarla, así que la app debe montarse
// bajo ese mismo prefijo en vez de en la raíz.
const BASE = process.env.BASE_PATH || '/bukea';

app.use(BASE + '/api/professionals', professionalsRouter);
app.use(BASE + '/api/bookings', bookingsRouter);

app.get(BASE + '/api/health', (req, res) => res.json({ ok: true }));

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
