const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    // Referral system
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    referralCode: { type: String, uppercase: true, trim: true },
    
    // Store credit and rewards
    storeCredit: { type: Number, default: 0, min: 0 },
    rewardPoints: { type: Number, default: 0, min: 0 },
    
    // Marketing preferences
    subscribed: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
