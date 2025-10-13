const multer = require('multer');

// Configure multer with memory storage (for direct S3 upload)
const storage = multer.memoryStorage();

// File filter to only accept video files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/x-flv',
    'video/x-matroska',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only video files are allowed (mp4, mov, avi, wmv, webm, flv, mkv).'
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
});

module.exports = upload;
