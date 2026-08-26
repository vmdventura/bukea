const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const RECEIPTS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'receipts');
const LOGOS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'logos');
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'business-photos');
// Carpetas nuevas (logos, business-photos) no vienen con .gitkeep en cada
// deploy — se crean solas al arrancar, igual que receipts ya existía.
for (const dir of [RECEIPTS_DIR, LOGOS_DIR, PHOTOS_DIR]) fs.mkdirSync(dir, { recursive: true });
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — comprobantes son fotos de teléfono o PDF, no video

const receiptUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, RECEIPTS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${req.params.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF'));
    }
    cb(null, true);
  },
});

// Logo y galería del negocio (2026-08-25) — mismo patrón que receiptUpload,
// pero solo imágenes (nunca PDF: son fotos, no comprobantes).
const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, LOGOS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${req.params.slug}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME.has(file.mimetype)) return cb(new Error('Solo se aceptan imágenes (JPG, PNG, WEBP)'));
    cb(null, true);
  },
});

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PHOTOS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${req.params.slug}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME.has(file.mimetype)) return cb(new Error('Solo se aceptan imágenes (JPG, PNG, WEBP)'));
    cb(null, true);
  },
});

// Absoluta (no solo el path) — la app empaquetada de iOS no comparte
// origen con bukeard.com, así que un link relativo abriría en el sitio
// equivocado (o en ninguno).
function receiptUrl(req, storedPath) {
  if (!storedPath) return null;
  return `${req.protocol}://${req.get('host')}${req.baseUrlPrefix}/uploads/receipts/${storedPath.split('/').pop()}`;
}

function logoUrl(req, storedPath) {
  if (!storedPath) return null;
  return `${req.protocol}://${req.get('host')}${req.baseUrlPrefix}/uploads/logos/${storedPath.split('/').pop()}`;
}

function photoUrl(req, storedPath) {
  if (!storedPath) return null;
  return `${req.protocol}://${req.get('host')}${req.baseUrlPrefix}/uploads/business-photos/${storedPath.split('/').pop()}`;
}

module.exports = {
  receiptUpload, receiptUrl, RECEIPTS_DIR,
  logoUpload, logoUrl, LOGOS_DIR,
  photoUpload, photoUrl, PHOTOS_DIR,
};
