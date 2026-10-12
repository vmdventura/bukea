// Nombres que no pueden ser el enlace corto de un negocio (bukeard.com/<slug>),
// porque ya son rutas del sitio o carpetas del servidor. Se usa al registrar un
// negocio (routes/professionals.js) y al resolver el enlace corto (routes/pages.js).
const BASE_NAME = (process.env.BASE_PATH || '/bukea').replace(/^\/+|\/+$/g, '').toLowerCase();

const RESERVED = new Set([
  'p', 'unete', 'entrar', 'reservar', 'cuenta', 'perfil', 'app', 'api', 'admin', 'negocio', 'negocios', 'tunegocio', 'mapa', 'nosotros', 'precios',
  'descargar', 'blog', 'contacto', 'privacidad', 'terminos', 'uploads', 'img',
  'static', 'assets', 'favicon', 'robots', 'sitemap', 'manifest', 'login', 'registro',
  'ayuda', 'bukea', 'bukeard', 'www', 'health', 'soporte', 'inicio',
  BASE_NAME,
]);

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,59}$/;

function isReservedSlug(slug) {
  return RESERVED.has(String(slug).toLowerCase());
}

module.exports = { isReservedSlug, SLUG_RE };
