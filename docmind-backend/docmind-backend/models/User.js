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

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  delete obj.devices;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
