const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deviceSessionSchema = new mongoose.Schema(
  {
    deviceLabel: { type: String, required: true }, // e.g. "Chrome - Windows Laptop"
    deviceType: {
      type: String,
      enum: ["mobile", "laptop", "desktop", "tablet"],
      default: "desktop",
    },
    refreshTokenHash: { type: String, required: true },
    ip: String,
    userAgent: String,
    lastActiveAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    profileImageUrl: { type: String, default: null },

    // Security
    twoFactorEnabled: { type: Boolean, default: false },

    // Email verification — proves the person actually owns the inbox they
    // signed up with, not just that the string is formatted like an email.
    emailVerified: { type: Boolean, default: false },
    emailVerificationCodeHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    twoFactorSecret: { type: String, select: false },
    pendingTwoFactorSecret: { type: String, select: false },

    // WebAuthn / passkeys (fingerprint, Face ID, security keys). Each entry
    // is one registered authenticator. publicKey is stored base64-encoded;
    // counter guards against cloned-authenticator replay attacks.
    webauthnCredentials: [
      {
        credentialID: { type: String, required: true },
        publicKey: { type: String, required: true },
        counter: { type: Number, default: 0 },
        transports: [String],
        deviceLabel: { type: String, default: "Passkey" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Transient challenge for an in-progress registration ceremony (login
    // ceremonies use a signed token instead, since the user isn't known yet).
    currentChallenge: { type: String, select: false },
    recoveryEmail: { type: String, default: null },
    devices: [deviceSessionSchema],
    lastLoginAt: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,

    // Preferences (synced across devices)
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      accentColor: { type: String, default: "teal" },
      defaultDocumentView: { type: String, enum: ["grid", "list", "compact"], default: "grid" },
      dashboardLayout: { type: String, enum: ["default", "minimal", "detailed", "custom"], default: "default" },
      autoAiAnalysisOnUpload: { type: Boolean, default: true },
      notifications: {
        reminders: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        aiUpdates: { type: Boolean, default: true },
      },
    },

    storageUsedBytes: { type: Number, default: 0 },
    storageLimitBytes: { type: Number, default: 5 * 1024 * 1024 * 1024 }, // 5GB default
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Generates a 6-digit verification code, stores its bcrypt hash (never the
 * plain code) with a 15-minute expiry, and returns the plain code so the
 * caller can email it. Reused for both initial signup and "resend code".
 */
userSchema.methods.setEmailVerificationCode = async function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  this.emailVerificationCodeHash = await bcrypt.hash(code, salt);
  this.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  return code;
};

userSchema.methods.verifyEmailCode = async function (submittedCode) {
  if (!this.emailVerificationCodeHash || !this.emailVerificationExpires) return false;
  if (this.emailVerificationExpires < new Date()) return false;
  return bcrypt.compare(submittedCode, this.emailVerificationCodeHash);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  delete obj.devices;
  delete obj.emailVerificationCodeHash;
  delete obj.emailVerificationExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
