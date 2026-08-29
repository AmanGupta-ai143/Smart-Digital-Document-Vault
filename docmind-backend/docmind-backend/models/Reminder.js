const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    notes: { type: String, default: "" },
    repeat: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly", "yearly"],
      default: "none",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },

    status: {
      type: String,
      enum: ["upcoming", "completed", "dismissed"],
      default: "upcoming",
    },

    // Set true when the reminder originated from AI date-detection rather
    // than a manual entry, and was confirmed by the user.
    source: { type: String, enum: ["manual", "ai_detected"], default: "manual" },
  },
  { timestamps: true }
);

reminderSchema.index({ userId: 1, date: 1 });
reminderSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);
