const express = require("express");
const { body, validationResult } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const Reminder = require("../models/Reminder");
const Document = require("../models/Document");
const logActivity = require("../utils/logActivity");
const notify = require("../utils/notify");

const router = express.Router();
router.use(requireAuth);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Please check the highlighted fields.", errors: errors.array() });
  next();
}

/**
 * GET /api/reminders?status=upcoming|completed|dismissed
 */
router.get("/", async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const reminders = await Reminder.find(filter).sort({ date: 1 }).populate("documentId", "fileName");
    res.json({ reminders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reminders/ai-detected — surfaces unconfirmed AI date detections
 * across all of the user's documents so they can be turned into reminders.
 */
router.get("/ai-detected", async (req, res, next) => {
  try {
    const documents = await Document.find({
      userId: req.user._id,
      "aiDetectedDates.0": { $exists: true },
    }).select("fileName aiDetectedDates");

    const suggestions = [];
    documents.forEach((doc) => {
      doc.aiDetectedDates.forEach((d, index) => {
        if (!d.confirmed) {
          suggestions.push({ documentId: doc._id, fileName: doc.fileName, dateIndex: index, label: d.label, date: d.date });
        }
      });
    });

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reminders
 */
router.post(
  "/",
  [body("title").trim().notEmpty(), body("date").isISO8601()],
  validate,
  async (req, res, next) => {
    try {
      const reminder = await Reminder.create({ ...req.body, userId: req.user._id });

      if (req.body.source === "ai_detected" && req.body.documentId && req.body.dateIndex !== undefined) {
        await Document.updateOne(
          { _id: req.body.documentId, userId: req.user._id },
          { $set: { [`aiDetectedDates.${req.body.dateIndex}.confirmed`]: true } }
        );
      }

      await logActivity(req.user._id, "reminder_created", `Created reminder "${reminder.title}"`);
      await notify(req.user, "reminder", `Reminder set: "${reminder.title}" on ${new Date(reminder.date).toLocaleDateString()}.`, { relatedReminderId: reminder._id });
      res.status(201).json({ reminder });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/reminders/:id
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });

    if (req.body.status === "completed") {
      await logActivity(req.user._id, "reminder_completed", `Completed reminder "${reminder.title}"`);
    }
    res.json({ reminder });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/reminders/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });
    res.json({ message: "Reminder deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
