const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const RECEIPTS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'receipts');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
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

function receiptUrl(req, storedPath) {
  return storedPath ? req.baseUrlPrefix + '/uploads/receipts/' + storedPath.split('/').pop() : null;
}

module.exports = { receiptUpload, receiptUrl };
