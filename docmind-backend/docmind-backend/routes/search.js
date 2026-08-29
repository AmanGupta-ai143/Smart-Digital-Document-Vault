const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Document = require("../models/Document");
const Contact = require("../models/Contact");

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/search?q=college
 * Unified search across documents and contacts, grouped by type, used
 * to power the global search bar.
 */
router.get("/", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) return res.json({ documents: [], contacts: [] });

    const [documents, contacts] = await Promise.all([
      Document.find({ userId: req.user._id, $text: { $search: q } })
        .select("fileName category tags aiTags isImportant")
        .limit(8),
      Contact.find({ userId: req.user._id, $text: { $search: q } })
        .select("name category phoneNumber isFavorite")
        .limit(8),
    ]);

    res.json({ documents, contacts });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
