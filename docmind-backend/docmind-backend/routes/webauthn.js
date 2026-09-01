const express = require("express");
const jwt = require("jsonwebtoken");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { signAccessToken, generateRefreshToken, hashRefreshToken } = require("../utils/tokens");
const logActivity = require("../utils/logActivity");
const notify = require("../utils/notify");
const { sendLoginAlertEmail } = require("../utils/email");

const router = express.Router();

const RP_NAME = process.env.WEBAUTHN_RP_NAME || "DocMind AI";
const RP_ID = process.env.WEBAUTHN_RP_ID; // domain only, e.g. "docmind-ai.vercel.app" (or "localhost" for dev)
const RP_ORIGIN = process.env.WEBAUTHN_RP_ORIGIN; // full origin, e.g. "https://docmind-ai.vercel.app"

function requireConfig(res) {
  if (!RP_ID || !RP_ORIGIN) {
    res.status(500).json({
      message: "Passkeys aren't configured on this server yet. Set WEBAUTHN_RP_ID and WEBAUTHN_RP_ORIGIN.",
    });
    return false;
  }
  return true;
}

async function issuePasskeySession(user, req, deviceLabel, deviceType) {
  const refreshTokenRaw = generateRefreshToken();
  const refreshTokenHash = await hashRefreshToken(refreshTokenRaw);

  user.devices.push({
    deviceLabel: deviceLabel || "Passkey device",
    deviceType: deviceType || "desktop",
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  await user.save();

  const device = user.devices[user.devices.length - 1];
  const accessToken = signAccessToken(user._id.toString(), device._id.toString());

  if (user.preferences?.notifications?.security !== false) {
    sendLoginAlertEmail(user, {
      deviceLabel: deviceLabel || "Passkey device",
      ip: req.ip,
      time: new Date().toLocaleString(),
    }).catch(() => {});
  }
  await notify(user, "security", `New passkey sign-in from ${deviceLabel || "a device"}.`);

  return { accessToken, refreshToken: `${device._id}.${refreshTokenRaw}` };
}

/* ------------------------------------------------------------------ */
/*  Registration — adding a passkey to an already-logged-in account    */
/* ------------------------------------------------------------------ */

/**
 * POST /api/webauthn/register/options
 * Starts the "create a passkey" ceremony for the current user.
 * residentKey: 'required' makes this a discoverable credential, which is
 * what enables the usernameless login flow below.
 */
router.post("/register/options", requireAuth, async (req, res, next) => {
  try {
    if (!requireConfig(res)) return;

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: req.user.email,
      userDisplayName: req.user.name,
      userID: new TextEncoder().encode(req.user._id.toString()),
      attestationType: "none",
      excludeCredentials: (req.user.webauthnCredentials || []).map((c) => ({
        id: c.credentialID,
        transports: c.transports,
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
      },
    });

    req.user.currentChallenge = options.challenge;
    await req.user.save();

    res.json(options);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/webauthn/register/verify
 */
router.post("/register/verify", requireAuth, async (req, res, next) => {
  try {
    if (!requireConfig(res)) return;

    const user = await User.findById(req.user._id).select("+currentChallenge");
    if (!user.currentChallenge) {
      return res.status(400).json({ message: "Registration session expired. Please try again." });
    }

    const { deviceLabel, ...attestationResponse } = req.body;

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ message: "Could not verify this passkey. Please try again." });
    }

    const { credential } = verification.registrationInfo;

    user.webauthnCredentials.push({
      credentialID: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64"),
      counter: credential.counter,
      transports: credential.transports || [],
      deviceLabel: deviceLabel || "Passkey",
    });
    user.currentChallenge = undefined;
    await user.save();

    await logActivity(user._id, "2fa_enabled", `Added a passkey ("${deviceLabel || "Passkey"}").`);
    await notify(user, "security", "A new passkey was added to your account.");

    res.json({ message: "Passkey added.", credentialCount: user.webauthnCredentials.length });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/*  Login — usernameless / discoverable-credential flow                */
/* ------------------------------------------------------------------ */

/**
 * POST /api/webauthn/login/options
 * No auth, and deliberately no allowCredentials — the browser shows a
 * picker of whichever passkeys it already has saved for this site, so the
 * user never has to type an email first.
 *
 * We don't know which user this is yet, so the challenge can't be stored
 * on a User document. Instead it's embedded in a short-lived signed token
 * the client round-trips back to /login/verify.
 */
router.post("/login/options", async (req, res, next) => {
  try {
    if (!requireConfig(res)) return;

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "preferred",
    });

    const challengeToken = jwt.sign({ challenge: options.challenge }, process.env.JWT_SECRET, { expiresIn: "5m" });

    res.json({ options, challengeToken });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/webauthn/login/verify
 * Body: { credentialResponse, challengeToken, deviceLabel, deviceType }
 */
router.post("/login/verify", async (req, res, next) => {
  try {
    if (!requireConfig(res)) return;

    const { credentialResponse, challengeToken, deviceLabel, deviceType } = req.body;

    let expectedChallenge;
    try {
      expectedChallenge = jwt.verify(challengeToken, process.env.JWT_SECRET).challenge;
    } catch {
      return res.status(400).json({ message: "This sign-in attempt expired. Please try again." });
    }

    const userHandle = credentialResponse?.response?.userHandle;
    if (!userHandle) {
      return res.status(400).json({ message: "This passkey isn't recognized." });
    }

    const userId = Buffer.from(userHandle, "base64url").toString("utf-8");
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "This passkey isn't recognized." });

    const storedCred = (user.webauthnCredentials || []).find((c) => c.credentialID === credentialResponse.id);
    if (!storedCred) return res.status(401).json({ message: "This passkey isn't recognized." });

    const verification = await verifyAuthenticationResponse({
      response: credentialResponse,
      expectedChallenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedCred.credentialID,
        publicKey: new Uint8Array(Buffer.from(storedCred.publicKey, "base64")),
        counter: storedCred.counter,
        transports: storedCred.transports,
      },
    });

    if (!verification.verified) {
      return res.status(401).json({ message: "This passkey couldn't be verified." });
    }

    storedCred.counter = verification.authenticationInfo.newCounter;
    user.lastLoginAt = new Date();

    const { accessToken, refreshToken } = await issuePasskeySession(user, req, deviceLabel, deviceType);
    await logActivity(user._id, "login", "Signed in with a passkey.", { metadata: { deviceLabel } });

    res.json({ user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/*  Managing passkeys — Security Center                                */
/* ------------------------------------------------------------------ */

/**
 * GET /api/webauthn/credentials
 */
router.get("/credentials", requireAuth, async (req, res) => {
  const credentials = (req.user.webauthnCredentials || []).map((c) => ({
    id: c._id,
    deviceLabel: c.deviceLabel,
    createdAt: c.createdAt,
  }));
  res.json({ credentials });
});

/**
 * DELETE /api/webauthn/credentials/:id
 */
router.delete("/credentials/:id", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const before = user.webauthnCredentials.length;
    user.webauthnCredentials = user.webauthnCredentials.filter((c) => c._id.toString() !== req.params.id);

    if (user.webauthnCredentials.length === before) {
      return res.status(404).json({ message: "Passkey not found." });
    }

    await user.save();
    await logActivity(user._id, "2fa_disabled", "Removed a passkey.");
    res.json({ message: "Passkey removed." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
