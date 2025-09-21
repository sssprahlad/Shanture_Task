const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    try {
      const fileTypes = /jpe?g|png|gif/;
      const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = fileTypes.test(file.mimetype);

      if (extName && mimeType) {
        return cb(null, true);
      } else {
        const error = new Error('Error: Only .jpg, .jpeg, .png and .gif formats are allowed!');
        error.code = 'LIMIT_FILE_TYPES';
        return cb(error, false);
      }
    } catch (err) {
      cb(err);
    }
  },
});

module.exports = upload;