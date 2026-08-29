const multer = require("multer");

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "text/plain",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type. Please upload PDF, DOCX, TXT, JPG, or PNG."));
    }
    cb(null, true);
  },
});

module.exports = upload;
