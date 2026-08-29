const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Notification = require("../models/Notification");

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/notifications?unreadOnly=true
 */
router.get("/", async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.unreadOnly === "true") filter.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/read-all
 */
router.patch("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
