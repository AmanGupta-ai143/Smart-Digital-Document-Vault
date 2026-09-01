const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
} = require("../utils/tokens");
const logActivity = require("../utils/logActivity");
const notify = require("../utils/notify");
const { sendLoginAlertEmail } = require("../utils/email");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Please check the highlighted fields.", errors: errors.array() });
  }
  next();
}

/**
 * POST /api/auth/signup
 */
router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const user = new User({ name, email });
      await user.setPassword(password);
      await user.save();

      await logActivity(user._id, "login", "Account created and signed in for the first time.");

      const { accessToken, refreshToken } = await issueSession(user, req);
      res.status(201).json({
        user: user.toSafeJSON(),
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/login
 */
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, deviceLabel, deviceType } = req.body;
      const user = await User.findOne({ email }).select("+passwordHash");

      if (!user) {
        return res.status(401).json({ message: "Incorrect email or password." });
      }

      if (user.lockedUntil && user.lockedUntil > Date.now()) {
        return res.status(423).json({ message: "Account temporarily locked due to failed attempts. Try again later." });
      }

      const valid = await user.comparePassword(password);
      if (!valid) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await user.save();
        return res.status(401).json({ message: "Incorrect email or password." });
      }

      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;

      if (user.twoFactorEnabled) {
        await user.save();
        const pendingToken = jwt.sign({ sub: user._id.toString(), type: "2fa_pending", deviceLabel, deviceType }, process.env.JWT_SECRET, { expiresIn: "10m" });
        return res.json({ requires2FA: true, pendingToken });
      }

      user.lastLoginAt = new Date();

      const { accessToken, refreshToken } = await issueSession(user, req, deviceLabel, deviceType);
      await user.save();
      await logActivity(user._id, "login", "Signed in successfully.", {
        metadata: { deviceLabel: deviceLabel || "Unknown device" },
      });

      res.json({ user: user.toSafeJSON(), accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/2fa/login-verify — second step of login when the account
 * has two-factor authentication enabled. Exchanges the short-lived
 * pendingToken from /login plus a valid TOTP code for a real session.
 */
router.post(
  "/2fa/login-verify",
  [body("pendingToken").notEmpty(), body("token").isLength({ min: 6, max: 6 })],
  validate,
  async (req, res, next) => {
    try {
      const { pendingToken, token } = req.body;
      let payload;
      try {
        payload = jwt.verify(pendingToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ message: "Your sign-in attempt expired. Please log in again." });
      }
      if (payload.type !== "2fa_pending") return res.status(401).json({ message: "Invalid verification request." });

      const user = await User.findById(payload.sub).select("+twoFactorSecret");
      if (!user || !user.twoFactorEnabled) return res.status(401).json({ message: "Invalid verification request." });

      const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: "base32", token, window: 1 });
      if (!verified) return res.status(401).json({ message: "That code is incorrect or expired." });

      user.lastLoginAt = new Date();
      const { accessToken, refreshToken } = await issueSession(user, req, payload.deviceLabel, payload.deviceType);
      await user.save();
      await logActivity(user._id, "login", "Signed in successfully with two-factor authentication.", {
        metadata: { deviceLabel: payload.deviceLabel || "Unknown device" },
      });

      res.json({ user: user.toSafeJSON(), accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

async function issueSession(user, req, deviceLabel = "Unknown device", deviceType = "desktop") {
  const refreshTokenRaw = generateRefreshToken();
  const refreshTokenHash = await hashRefreshToken(refreshTokenRaw);

  user.devices.push({
    deviceLabel,
    deviceType,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  await user.save();

  const device = user.devices[user.devices.length - 1];
  const accessToken = signAccessToken(user._id.toString(), device._id.toString());

  await notify(user, "security", `New sign-in from ${deviceLabel}.`);

  // Best-effort, non-blocking — a slow or failed email provider should
  // never delay or break someone's login.
  if (user.preferences?.notifications?.security !== false) {
    sendLoginAlertEmail(user, { deviceLabel, ip: req.ip, time: new Date().toLocaleString() }).catch(() => {});
  }

  return { accessToken, refreshToken: `${device._id}.${refreshTokenRaw}` };
}

/**
 * POST /api/auth/refresh — exchange a valid refresh token for a new access token.
 */
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshToken.includes(".")) {
      return res.status(401).json({ message: "Invalid session token." });
    }

    const [deviceId, raw] = refreshToken.split(".");
    const user = await User.findOne({ "devices._id": deviceId });
    if (!user) return res.status(401).json({ message: "Session not recognized." });

    const device = user.devices.id(deviceId);
    const valid = await compareRefreshToken(raw, device.refreshTokenHash);
    if (!valid) return res.status(401).json({ message: "Session not recognized." });

    device.lastActiveAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user._id.toString(), deviceId);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout — remove the current device session.
 */
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    req.user.devices = req.user.devices.filter((d) => d._id.toString() !== req.deviceId);
    await req.user.save();
    await logActivity(req.user._id, "logout", "Signed out of this device.");
    res.json({ message: "Signed out." });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/sessions — list active devices for the Security Center.
 */
router.get("/sessions", requireAuth, async (req, res) => {
  const sessions = req.user.devices.map((d) => ({
    id: d._id,
    deviceLabel: d.deviceLabel,
    deviceType: d.deviceType,
    lastActiveAt: d.lastActiveAt,
    createdAt: d.createdAt,
    isCurrentDevice: d._id.toString() === req.deviceId,
  }));
  res.json({ sessions });
});

/**
 * DELETE /api/auth/sessions/:id — remotely log out a specific device.
 */
router.delete("/sessions/:id", requireAuth, async (req, res, next) => {
  try {
    req.user.devices = req.user.devices.filter((d) => d._id.toString() !== req.params.id);
    await req.user.save();
    await logActivity(req.user._id, "device_removed", "Logged out a device remotely.");
    res.json({ message: "Device signed out." });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/auth/sessions — log out all devices except the current one.
 */
router.delete("/sessions", requireAuth, async (req, res, next) => {
  try {
    req.user.devices = req.user.devices.filter((d) => d._id.toString() === req.deviceId);
    await req.user.save();
    await logActivity(req.user._id, "device_removed", "Logged out all other devices.");
    res.json({ message: "All other devices signed out." });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/change-password
 */
router.post(
  "/change-password",
  requireAuth,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 8 })],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select("+passwordHash");
      const valid = await user.comparePassword(req.body.currentPassword);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect." });

      await user.setPassword(req.body.newPassword);
      await user.save();
      await logActivity(user._id, "password_changed", "Password changed.");
      res.json({ message: "Password updated." });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/auth/me
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

/* ------------------------------------------------------------------ */
/*  Two-Factor Authentication (TOTP — compatible with Google           */
/*  Authenticator, Authy, 1Password, etc.)                             */
/* ------------------------------------------------------------------ */

/**
 * POST /api/auth/2fa/setup — generates a new TOTP secret and returns a
 * QR code the user scans with an authenticator app. The secret isn't
 * activated until they confirm it via /2fa/verify with a real code —
 * this avoids locking someone out from a secret they never actually saved.
 */
router.post("/2fa/setup", requireAuth, async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: `DocMind AI (${req.user.email})` });
    req.user.pendingTwoFactorSecret = secret.base32;
    await req.user.save();

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qrCodeDataUrl, manualEntryKey: secret.base32 });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/2fa/verify — confirms setup with a real 6-digit code
 * from the authenticator app, then turns 2FA on.
 */
router.post("/2fa/verify", requireAuth, [body("token").isLength({ min: 6, max: 6 })], validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+pendingTwoFactorSecret");
    if (!user.pendingTwoFactorSecret) {
      return res.status(400).json({ message: "Start setup again — no pending 2FA secret found." });
    }

    const verified = speakeasy.totp.verify({ secret: user.pendingTwoFactorSecret, encoding: "base32", token: req.body.token, window: 1 });
    if (!verified) return res.status(401).json({ message: "That code is incorrect or expired." });

    user.twoFactorSecret = user.pendingTwoFactorSecret;
    user.pendingTwoFactorSecret = undefined;
    user.twoFactorEnabled = true;
    await user.save();

    await logActivity(user._id, "2fa_enabled", "Two-factor authentication enabled.");
    await notify(user, "security", "Two-factor authentication was enabled on your account.");

    res.json({ message: "Two-factor authentication enabled.", user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/2fa/disable — requires the current password as
 * confirmation before turning off a security feature.
 */
router.post("/2fa/disable", requireAuth, [body("password").notEmpty()], validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+passwordHash");
    const valid = await user.comparePassword(req.body.password);
    if (!valid) return res.status(401).json({ message: "Password is incorrect." });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.pendingTwoFactorSecret = undefined;
    await user.save();

    await logActivity(user._id, "2fa_disabled", "Two-factor authentication disabled.");
    await notify(user, "security", "Two-factor authentication was turned off on your account.");

    res.json({ message: "Two-factor authentication disabled.", user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
