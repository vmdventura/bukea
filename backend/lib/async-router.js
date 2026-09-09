// Envuelve un express.Router() para que toda ruta async cuyo handler
// rechace (throw dentro de un `async (req, res) => {...}` sin su propio
// try/catch) llame a next(err) en vez de tumbar el proceso entero — antes
// solo la red de seguridad de app.js (process.on('unhandledRejection'))
// evitaba el crash, pero la petición se quedaba colgada hasta el timeout
// del cliente en vez de recibir un 500 limpio. Revisión externa 2026-09-08
// encontró 90 handlers async contra solo 17 try/catch en backend/routes/*.js;
// esto los cubre todos de una vez, en el router en sí, sin tocar cada uno.
function wrapAsyncRouter(router) {
  const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
  for (const method of METHODS) {
    const original = router[method].bind(router);
    router[method] = function (path, ...handlers) {
      const wrapped = handlers.map(fn => {
        if (typeof fn !== 'function' || fn.length > 3) return fn; // deja pasar middlewares (req,res,next) tal cual
        return function (req, res, next) {
          Promise.resolve(fn(req, res, next)).catch(next);
        };
      });
      return original(path, ...wrapped);
    };
  }
  return router;
}

module.exports = { wrapAsyncRouter };
