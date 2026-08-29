const mongoose = require("mongoose");

const CATEGORIES = ["Family", "Friends", "Emergency", "College", "Work", "Doctor", "Other"];

const contactSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    name: { type: String, required: true, trim: true },
    profileImageUrl: { type: String, default: null },
    phoneNumber: { type: String, required: true, trim: true },
    alternateNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    category: { type: String, enum: CATEGORIES, default: "Other" },
    notes: { type: String, default: "" },

    isFavorite: { type: Boolean, default: false },
    isEmergencyContact: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contactSchema.index({ userId: 1, category: 1 });
contactSchema.index({ userId: 1, isEmergencyContact: 1 });
contactSchema.index({ name: "text", notes: "text" });

contactSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model("Contact", contactSchema);
