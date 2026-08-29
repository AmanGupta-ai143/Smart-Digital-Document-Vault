const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ActivityLog = require("../models/ActivityLog");

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/activity?page=1&limit=30
 */
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      ActivityLog.countDocuments({ userId: req.user._id }),
    ]);
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
