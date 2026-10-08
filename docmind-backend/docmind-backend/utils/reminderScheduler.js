const Reminder = require("../models/Reminder");
const User = require("../models/User");
const notify = require("./notify");
const { sendReminderEmail } = require("./email");

const DAY = 24 * 60 * 60 * 1000;

/**
 * Looks for reminders that are a week away or a day away (or just passed) and sends each
 * alert once: an in-app notification plus an email, unless the user turned reminders off.
 */
async function runReminderChecks() {
  try {
    const now = Date.now();
    const candidates = await Reminder.find({
      status: "upcoming",
      date: { $gte: new Date(now - DAY), $lte: new Date(now + 7 * DAY) },
      $or: [{ notified7d: { $ne: true } }, { notified1d: { $ne: true } }],
    }).limit(200);

    for (const reminder of candidates) {
      const daysLeft = Math.ceil((new Date(reminder.date).getTime() - now) / DAY);
      const dayAlert = daysLeft <= 1 && !reminder.notified1d;
      const weekAlert = !dayAlert && daysLeft > 1 && daysLeft <= 7 && !reminder.notified7d;
      if (!dayAlert && !weekAlert) continue;

      const user = await User.findById(reminder.userId);
      if (user && user.preferences?.notifications?.reminders !== false) {
        const when = daysLeft <= 0 ? "is due today" : daysLeft === 1 ? "is due tomorrow" : `is due in ${daysLeft} days`;
        await notify(user, "reminder", `"${reminder.title}" ${when}.`, { relatedReminderId: reminder._id });
        await sendReminderEmail(user, reminder, daysLeft); // never throws
      }

      reminder.notified7d = true;
      if (dayAlert) reminder.notified1d = true;
      await reminder.save();
    }
  } catch (err) {
    console.error("[reminders] check failed:", err.message);
  }
}

function startReminderScheduler() {
  setTimeout(runReminderChecks, 30 * 1000);
  setInterval(runReminderChecks, 60 * 60 * 1000);
  console.log("[reminders] email alerts scheduler started (checks hourly)");
}

module.exports = { startReminderScheduler, runReminderChecks };
