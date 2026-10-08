const mongoose = require("mongoose");

const CATEGORIES = [
  "Education",
  "Career",
  "Finance",
  "Certificates",
  "Personal",
  "Health",
  "Other",
];

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // pdf, docx, txt, jpg, png
    fileSizeBytes: { type: Number, required: true },

    // Cloud storage
    cloudFileUrl: { type: String, required: true },
    cloudPublicId: { type: String, required: true },
    cloudResourceType: { type: String, default: null },
    // "authenticated" = private, link only via a signed URL. Older uploads are "public".
    cloudAccess: { type: String, enum: ["public", "authenticated"], default: "public" },

    // Organization
    category: { type: String, enum: CATEGORIES, default: "Other" },
    tags: [{ type: String, trim: true }],
    isImportant: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // AI-derived content — always kept separate from user-provided fields
    extractedText: { type: String, default: "" },
    aiSummary: { type: String, default: "" },
    aiKeyPoints: [{ type: String }],
    aiTags: [{ type: String }],
    aiDetectedDates: [
      {
        label: String, // e.g. "Renewal date"
        date: Date,
        confirmed: { type: Boolean, default: false },
        reminderId: { type: mongoose.Schema.Types.ObjectId, ref: "Reminder", default: null },
      },
    ],
    aiCategoryConfidence: { type: Number, default: null }, // 0-1
    aiProcessingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    // Embeddings for semantic search (stored as array; use a vector index
    // in MongoDB Atlas Vector Search or an external vector DB in production)
    embedding: { type: [Number], select: false },

    userNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, category: 1 });
documentSchema.index({ userId: 1, isImportant: 1 });
documentSchema.index({ fileName: "text", extractedText: "text", tags: "text", aiTags: "text" });

documentSchema.statics.CATEGORIES = CATEGORIES;

// Private files must never expose their raw storage address in API responses.
documentSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.cloudAccess === "authenticated") delete ret.cloudFileUrl;
    delete ret.cloudPublicId;
    return ret;
  },
});

module.exports = mongoose.model("Document", documentSchema);
