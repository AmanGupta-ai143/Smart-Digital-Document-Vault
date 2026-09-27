const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Document = require("../models/Document");
const Contact = require("../models/Contact");
const Reminder = require("../models/Reminder");

const router = express.Router();
router.use(requireAuth);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/search?q=college
 * Unified search across documents, contacts, and reminders, grouped by
 * type, used to power the global search bar.
 */
router.get("/", async (req, res, next) => {
  try {
    const { q, category, date } = req.query;
    if (!q || q.trim().length === 0) return res.json({ documents: [], contacts: [], reminders: [] });

    const docFilter = { userId: req.user._id, $text: { $search: q } };
    if (category) docFilter.category = category;
    if (date === "recent") {
      docFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (date === "older") {
      docFilter.createdAt = { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const [documents, contacts, reminders] = await Promise.all([
      Document.find(docFilter)
        .select("fileName category tags aiTags isImportant createdAt")
        .limit(8),
      // Category/date filters are document-specific (per spec section 15), so
      // contacts/reminders are skipped entirely once either is set, rather
      // than silently ignoring a filter the user asked for.
      category || date
        ? Promise.resolve([])
        : Contact.find({ userId: req.user._id, $text: { $search: q } })
            .select("name category phoneNumber isFavorite")
            .limit(8),
      category || date
        ? Promise.resolve([])
        : Reminder.find({ userId: req.user._id, title: { $regex: escapeRegex(q.trim()), $options: "i" } })
            .select("title date status priority")
            .limit(8),
    ]);

    res.json({ documents, contacts, reminders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
