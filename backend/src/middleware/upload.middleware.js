const path = require('path');
const multer = require('multer');
const config = require('../config');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.import.maxFileMb * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      const err = new Error('Only .xlsx, .xls, and .csv import files are allowed');
      err.statusCode = 400;
      err.code = 'IMPORT_FILE_TYPE_NOT_ALLOWED';
      return cb(err);
    }
    return cb(null, true);
  },
});

module.exports = {
  uploadImport: upload.single('file'),
};
