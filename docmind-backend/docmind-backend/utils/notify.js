const Notification = require("../models/Notification");

const PREFERENCE_KEY = {
  reminder: "reminders",
  ai_update: "aiUpdates",
  security: "security",
  account: "account",
};

/**
 * Creates a notification for a user unless they've turned that category
 * off in their preferences. `account` notifications aren't user-toggleable
 * (e.g. this would cover billing/critical account notices).
 */
async function notify(user, category, message, extra = {}) {
  try {
    const prefKey = PREFERENCE_KEY[category];
    if (prefKey && prefKey !== "account" && user.preferences?.notifications?.[prefKey] === false) {
      return null;
    }
    return await Notification.create({ userId: user._id, category, message, ...extra });
  } catch (err) {
    console.error("[notify] failed to create notification:", err.message);
    return null;
  }
}

module.exports = notify;
