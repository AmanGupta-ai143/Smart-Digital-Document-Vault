/**
 * Central error handler. Keeps internal error details out of API
 * responses so the frontend only ever gets a safe, user-facing message.
 */
function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl} —`, err.message);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Some fields are invalid.", details: err.errors });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "That value is already in use." });
  }

  if (err instanceof require("multer").MulterError || /Unsupported file type/.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  const message = status === 500 ? "Something went wrong on our end. Please try again." : err.message;
  res.status(status).json({ message });
}

module.exports = errorHandler;
