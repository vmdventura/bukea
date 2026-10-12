// Punto de entrada de la suite (ver test-shim.js para el porqué de no usar
// `node --test` directamente). Uso: node tests/api/run-all.js
// Requiere el servidor de staging corriendo (TEST_API_BASE, default
// http://127.0.0.1:3000/bukea) y RATE_LIMIT_DISABLED=1 en su .env.
const fs = require('fs');
const path = require('path');
const { runAll, setCurrentFile } = require('./test-shim');
const { closeDb } = require('./helpers');

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.test.js'))
  .sort();

console.log(`Bukea — suite de pruebas de API (${files.length} archivos)\n`);

for (const file of files) {
  console.log(`\n${file}`);
  setCurrentFile(file);
  require(path.join(dir, file));
}

runAll()
  .then(async ok => {
    await closeDb();
    process.exit(ok ? 0 : 1);
  })
  .catch(async err => {
    console.error(err);
    await closeDb().catch(() => {});
    process.exit(1);
  });
