const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      enum: ["reminder", "ai_update", "security", "account"],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    relatedReminderId: { type: mongoose.Schema.Types.ObjectId, ref: "Reminder" },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
