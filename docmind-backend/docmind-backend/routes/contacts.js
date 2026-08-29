const express = require("express");
const { body, validationResult } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const Contact = require("../models/Contact");
const logActivity = require("../utils/logActivity");

const router = express.Router();
router.use(requireAuth);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Please check the highlighted fields.", errors: errors.array() });
  next();
}

/**
 * GET /api/contacts — list with search/category/favorite/emergency filters.
 */
router.get("/", async (req, res, next) => {
  try {
    const { q, category, favorite, emergency } = req.query;
    const filter = { userId: req.user._id };
    if (category) filter.category = category;
    if (favorite === "true") filter.isFavorite = true;
    if (emergency === "true") filter.isEmergencyContact = true;
    if (q) filter.$text = { $search: q };

    const contacts = await Contact.find(filter).sort({ name: 1 });
    res.json({ contacts });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/contacts
 */
router.post(
  "/",
  [body("name").trim().notEmpty(), body("phoneNumber").trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const contact = await Contact.create({ ...req.body, userId: req.user._id });
      await logActivity(req.user._id, "contact_added", `Added contact ${contact.name}`, { relatedContactId: contact._id });
      res.status(201).json({ contact });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/contacts/:id
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!contact) return res.status(404).json({ message: "Contact not found." });

    await logActivity(req.user._id, "contact_updated", `Updated contact ${contact.name}`, { relatedContactId: contact._id });
    res.json({ contact });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/contacts/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!contact) return res.status(404).json({ message: "Contact not found." });

    await logActivity(req.user._id, "contact_deleted", `Deleted contact ${contact.name}`);
    res.json({ message: "Contact deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
