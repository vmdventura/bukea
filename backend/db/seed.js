const pool = require('./pool');
const { ensureReady } = require('./init');

ensureReady()
  .then(() => pool.end())
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
