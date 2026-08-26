// Uso único, por línea de comandos, nunca desde la app: promueve una cuenta
// existente (identificada por su teléfono, la misma con la que inicia
// sesión en Bukea) a role = 'admin', lo único que le da acceso a /admin.
//   node db/make-admin.js 8095550123
require('dotenv').config();
const pool = require('./pool');

const phone = String(process.argv[2] || '').replace(/\D/g, '');

if (!phone) {
  console.error('Uso: node db/make-admin.js <telefono>');
  console.error('Ejemplo: node db/make-admin.js 8095550123');
  process.exit(1);
}

pool.query('UPDATE users SET role = ? WHERE phone = ?', ['admin', phone])
  .then(([result]) => {
    if (result.affectedRows === 0) {
      console.log(`No encontramos ninguna cuenta con el teléfono ${phone}. Regístrate primero en la app.`);
    } else {
      console.log(`Listo. La cuenta con teléfono ${phone} ya es administradora — puede entrar en /admin.`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('No se pudo actualizar:', err.message);
    process.exit(1);
  });
