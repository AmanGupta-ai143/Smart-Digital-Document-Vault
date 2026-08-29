const ActivityLog = require("../models/ActivityLog");

/**
 * Records a user-facing application event. Never log raw sensitive
 * content (document text, passwords, tokens) — only what happened.
 */
async function logActivity(userId, type, description, extra = {}) {
  try {
    await ActivityLog.create({ userId, type, description, ...extra });
  } catch (err) {
    console.error("[activity] failed to log:", err.message);
  }
}

module.exports = logActivity;
