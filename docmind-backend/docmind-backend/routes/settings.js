const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Document = require("../models/Document");
const Contact = require("../models/Contact");
const Reminder = require("../models/Reminder");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

const router = express.Router();
router.use(requireAuth);

/**
 * PATCH /api/settings/preferences — theme, accent color, default views,
 * dashboard layout, notification toggles. Synced across all devices
 * because it's stored on the user record, not locally.
 */
router.patch("/preferences", async (req, res, next) => {
  try {
    req.user.preferences = { ...req.user.preferences.toObject(), ...req.body };
    await req.user.save();
    res.json({ preferences: req.user.preferences });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/settings/storage
 */
router.get("/storage", async (req, res) => {
  res.json({
    usedBytes: req.user.storageUsedBytes,
    limitBytes: req.user.storageLimitBytes,
  });
});

/**
 * GET /api/settings/insights — lightweight "Personal Vault Insights" stats
 * used on the dashboard's AI Insight card.
 */
router.get("/insights", async (req, res, next) => {
  try {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [uploadsThisMonth, byCategory] = await Promise.all([
      Document.countDocuments({ userId: req.user._id, createdAt: { $gte: monthAgo } }),
      Document.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ uploadsThisMonth, byCategory });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/settings/export — bundles the user's own data as a downloadable
 * JSON file (profile, documents' metadata, contacts, reminders, activity).
 * File contents, not just links, are included so the export is genuinely
 * self-contained if the person wants to keep a copy outside the vault.
 */
router.get("/export", async (req, res, next) => {
  try {
    const [documents, contacts, reminders, activity] = await Promise.all([
      Document.find({ userId: req.user._id }).select("-embedding"),
      Contact.find({ userId: req.user._id }),
      Reminder.find({ userId: req.user._id }),
      ActivityLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(500),
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      profile: req.user.toSafeJSON(),
      documents,
      contacts,
      reminders,
      activity,
    };

    res.setHeader("Content-Disposition", `attachment; filename="docmind-export-${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(exportBundle, null, 2));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/settings/account — permanently deletes the user's account.
 * In production this should also cascade-delete documents/contacts/
 * reminders and remove files from cloud storage inside a transaction.
 */
router.delete("/account", async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
