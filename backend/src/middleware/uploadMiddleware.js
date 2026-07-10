const multer = require('multer');
const { MAX_UPLOAD_SIZE_BYTES } = require('../config/constants');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const isCsv =
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.toLowerCase().endsWith('.csv');

  if (!isCsv) {
    return cb(new Error('Only .csv files are accepted'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

module.exports = upload;
