const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verifies the access token sent in the Authorization header
 * ("Bearer <token>") and attaches the authenticated user to req.user.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Account no longer exists." });
    }

    req.user = user;
    req.deviceId = payload.deviceId;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid authentication token." });
  }
}

module.exports = { requireAuth };
