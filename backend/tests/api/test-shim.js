// Runner mínimo propio (2026-09-08) — `node --test` spawnea cada archivo
// como su propio proceso hijo y relee resultados por IPC/TAP; en esta
// máquina ese relevo resultó errático (colgados intermitentes de 8s+ sin
// ninguna razón reproducible: ni locks en MySQL, ni el servidor lento — el
// mismo código corrido con `node -e` directo, sin `node --test`, pasa
// rápido y limpio cada vez). Este shim implementa la misma firma que usan
// los archivos de prueba (`test(name, fn)`, `after(fn)`) pero corre todo
// en un solo proceso, sin subprocesos ni TAP — evita esa capa por completo
// en vez de perseguir un bug de infraestructura ajeno al código que se
// está probando. Ver tests/api/run-all.js.
const tests = [];
const afterHooks = [];

function test(name, fn) {
  tests.push({ name, fn, file: currentFile });
}

function after(fn) {
  afterHooks.push({ fn, file: currentFile });
}

let currentFile = null;
function setCurrentFile(file) {
  currentFile = file;
}

async function runAll() {
  let pass = 0;
  let fail = 0;
  const failures = [];

  for (const t of tests) {
    process.stdout.write(`  ${t.name} ... `);
    try {
      await t.fn();
      pass++;
      console.log('OK');
    } catch (err) {
      fail++;
      failures.push({ name: t.name, file: t.file, err });
      console.log('FAIL');
    }
  }

  for (const h of afterHooks) {
    try {
      await h.fn();
    } catch (err) {
      console.error(`  (after hook de ${h.file} falló: ${err.message})`);
    }
  }

  console.log('');
  console.log(`${pass} pasaron, ${fail} fallaron, ${tests.length} en total`);
  if (failures.length > 0) {
    console.log('\nFallos:');
    for (const f of failures) {
      console.log(`\n- [${f.file}] ${f.name}`);
      console.log(`  ${f.err.stack || f.err}`);
    }
  }
  return fail === 0;
}

module.exports = { test, after, runAll, setCurrentFile };
