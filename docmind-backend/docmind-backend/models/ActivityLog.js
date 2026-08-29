const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "document_uploaded",
        "document_categorized",
        "document_deleted",
        "contact_added",
        "contact_updated",
        "contact_deleted",
        "reminder_created",
        "reminder_completed",
        "login",
        "logout",
        "device_removed",
        "password_changed",
        "2fa_enabled",
        "2fa_disabled",
      ],
      required: true,
    },
    description: { type: String, required: true },
    relatedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    relatedContactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
