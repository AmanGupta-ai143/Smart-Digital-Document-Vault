const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

function signAccessToken(userId, deviceId) {
  return jwt.sign({ sub: userId, deviceId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString("hex");
  return raw;
}

async function hashRefreshToken(raw) {
  return bcrypt.hash(raw, 10);
}

async function compareRefreshToken(raw, hash) {
  return bcrypt.compare(raw, hash);
}

module.exports = { signAccessToken, generateRefreshToken, hashRefreshToken, compareRefreshToken };
