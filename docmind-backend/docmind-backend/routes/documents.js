const express = require("express");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Document = require("../models/Document");
const Reminder = require("../models/Reminder");
const User = require("../models/User");
const { uploadBuffer, deleteFile, signedUrl } = require("../config/cloudStorage");
const { extractText } = require("../utils/textExtraction");
const { analyzeDocument, answerQuestion } = require("../utils/aiService");
const logActivity = require("../utils/logActivity");
const notify = require("../utils/notify");

const router = express.Router();
router.use(requireAuth);

const EXT_FROM_MIME = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/**
 * POST /api/documents/upload
 * Uploads a file to cloud storage, extracts its text, and (unless the
 * caller opts out) kicks off AI analysis before saving the record.
 */
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided." });

    const useAI = req.body.autoAnalyze !== "false";
    const result = await uploadBuffer(req.file.buffer, req.user._id, req.file.originalname);

    const doc = new Document({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileType: EXT_FROM_MIME[req.file.mimetype] || "other",
      fileSizeBytes: req.file.size,
      cloudFileUrl: result.secure_url,
      cloudPublicId: result.public_id,
      cloudResourceType: result.resource_type,
      cloudAccess: "authenticated",
      category: req.body.category || "Other",
      tags: req.body.tags ? req.body.tags.split(",").map((t) => t.trim()) : [],
      isImportant: req.body.isImportant === "true",
      aiProcessingStatus: useAI ? "processing" : "pending",
    });

    const extractedText = await extractText(req.file.buffer, req.file.mimetype);
    doc.extractedText = extractedText;

    if (useAI && extractedText.trim().length > 0) {
      try {
        const analysis = await analyzeDocument(extractedText, req.file.originalname);
        doc.category = req.body.category || analysis.category || "Other";
        doc.aiSummary = analysis.summary;
        doc.aiKeyPoints = analysis.keyPoints || [];
        doc.aiTags = analysis.tags || [];
        doc.aiCategoryConfidence = analysis.categoryConfidence ?? null;
        doc.aiDetectedDates = (analysis.detectedDates || []).map((d) => ({
          label: d.label,
          date: new Date(d.date),
          confirmed: false,
        }));
        doc.aiProcessingStatus = "completed";
      } catch (aiErr) {
        console.error("[ai] analysis failed:", aiErr.message);
        doc.aiProcessingStatus = "failed";
      }
    }

    await doc.save();

    req.user.storageUsedBytes += req.file.size;
    await req.user.save();

    await logActivity(req.user._id, "document_uploaded", `Uploaded ${doc.fileName}`, {
      relatedDocumentId: doc._id,
    });
    if (doc.aiProcessingStatus === "completed") {
      await logActivity(req.user._id, "document_categorized", `AI categorized ${doc.fileName} as ${doc.category}`, {
        relatedDocumentId: doc._id,
      });
      await notify(req.user, "ai_update", `AI analysis complete for ${doc.fileName}.`, { relatedDocumentId: doc._id });
    }

    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents — list with filters, search, sort, pagination.
 * Query params: q, category, fileType, important, favorite, archived, tag,
 *               sort=(recent|name|size), page, limit
 */
router.get("/", async (req, res, next) => {
  try {
    const { q, category, fileType, important, favorite, archived, deleted, tag, sort = "recent", page = 1, limit = 24 } = req.query;

    const filter = { userId: req.user._id };
    if (category) filter.category = category;
    if (fileType) filter.fileType = fileType;
    if (important === "true") filter.isImportant = true;
    if (favorite === "true") filter.isFavorite = true;
    filter.isDeleted = deleted === "true";
    if (!filter.isDeleted) filter.isArchived = archived === "true";
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    const sortMap = { recent: { createdAt: -1 }, name: { fileName: 1 }, size: { fileSizeBytes: -1 } };

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .sort(sortMap[sort] || sortMap.recent)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select("-extractedText -embedding"),
      Document.countDocuments(filter),
    ]);

    res.json({ documents, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/:id
 */
/**
 * GET /api/documents/:id/access — hands the owner a link to open their own file.
 * The ownership check happens here, so the storage address is never listed publicly.
 */
router.get("/:id/access", async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ message: "Document not found." });
    res.json({ url: signedUrl(doc) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ message: "Document not found." });
    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/documents/:id — update category, tags, favorite/important flags, notes.
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const allowedFields = ["category", "tags", "isImportant", "isFavorite", "isArchived", "userNotes"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const doc = await Document.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, { new: true });
    if (!doc) return res.status(404).json({ message: "Document not found." });

    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/documents/:id/confirm-date — confirm (or ignore) an AI-detected date.
 */
router.patch("/:id/confirm-date", async (req, res, next) => {
  try {
    const { dateIndex, confirmed } = req.body;
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ message: "Document not found." });

    const entry = doc.aiDetectedDates[dateIndex];
    if (!entry) return res.status(400).json({ message: "Invalid date reference." });

    if (confirmed && !entry.reminderId) {
      // Turn the AI-detected date into a real reminder the user will see on
      // the Reminders page and dashboard — not just a flag on the document.
      const reminder = await Reminder.create({
        userId: req.user._id,
        title: entry.label ? `${entry.label} — ${doc.fileName}` : doc.fileName,
        date: entry.date,
        documentId: doc._id,
        source: "ai_detected",
      });
      entry.reminderId = reminder._id;
      await logActivity(req.user._id, "reminder_created", `Reminder created for ${doc.fileName}`);
      await notify(req.user, "reminder", `Reminder set: "${reminder.title}" on ${new Date(reminder.date).toLocaleDateString()}.`, { relatedReminderId: reminder._id });
    } else if (!confirmed && entry.reminderId) {
      // Ignoring a previously-confirmed date removes the reminder it created.
      await Reminder.findByIdAndDelete(entry.reminderId);
      entry.reminderId = null;
    }

    entry.confirmed = !!confirmed;
    await doc.save();

    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/documents/:id
 */
/**
 * DELETE /api/documents/trash — permanently empties the recycle bin.
 * Must be declared before DELETE /:id so Express doesn't treat "trash" as an id.
 */
router.delete("/trash", async (req, res, next) => {
  try {
    const trashed = await Document.find({ userId: req.user._id, isDeleted: true });
    let freedBytes = 0;
    for (const doc of trashed) {
      await deleteFile(doc.cloudPublicId, doc).catch(() => {});
      freedBytes += doc.fileSizeBytes || 0;
    }
    await Document.deleteMany({ userId: req.user._id, isDeleted: true });

    req.user.storageUsedBytes = Math.max(0, req.user.storageUsedBytes - freedBytes);
    await req.user.save();

    res.json({ message: "Recycle bin emptied.", count: trashed.length });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/documents/:id — moves a document to the recycle bin (soft delete).
 * The file stays in cloud storage until it's restored or permanently deleted.
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Document not found." });

    await logActivity(req.user._id, "document_deleted", `Moved ${doc.fileName} to the recycle bin`, { relatedDocumentId: doc._id });
    res.json({ message: "Document moved to recycle bin.", document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/documents/:id/restore — restores a document out of the recycle bin.
 */
router.patch("/:id/restore", async (req, res, next) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Document not found in recycle bin." });

    await logActivity(req.user._id, "document_restored", `Restored ${doc.fileName} from the recycle bin`, { relatedDocumentId: doc._id });
    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/documents/:id/permanent — permanently deletes a document that is
 * already in the recycle bin (removes the cloud file and the DB record).
 */
router.delete("/:id/permanent", async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user._id, isDeleted: true });
    if (!doc) return res.status(404).json({ message: "Document not found in recycle bin." });

    await deleteFile(doc.cloudPublicId, doc);
    req.user.storageUsedBytes = Math.max(0, req.user.storageUsedBytes - doc.fileSizeBytes);
    await req.user.save();

    res.json({ message: "Document permanently deleted." });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/documents/ask — "Ask Your Document" / AI Assistant chat.
 * Body: { question, documentIds: [] }  — empty array means "all documents".
 */
router.post("/ask", async (req, res, next) => {
  try {
    const { question, documentIds } = req.body;
    if (!question) return res.status(400).json({ message: "A question is required." });

    const filter = { userId: req.user._id };
    if (documentIds && documentIds.length > 0) filter._id = { $in: documentIds };

    const documents = await Document.find(filter).limit(20).select("fileName extractedText");
    if (documents.length === 0) {
      return res.json({ answer: "You don't have any documents matching that scope yet.", sourceDocuments: [], followUpQuestions: [] });
    }

    const result = await answerQuestion(question, documents);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
