const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
