const mongoose = require("mongoose");
const validator = require("validator");

/**
 * Subscription Model
 * Manages email subscriptions for marketing
 */
const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email address",
      },
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["popup", "footer", "checkout", "manual"],
      default: "popup",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
    welcomeEmailSentAt: {
      type: Date,
    },
    discountCode: {
      type: String, // Welcome discount code given to subscriber
      uppercase: true,
    },
    tags: [String], // For segmentation
    preferences: {
      newProducts: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Indexes
subscriptionSchema.index({ email: 1, isActive: 1 });
subscriptionSchema.index({ subscribedAt: -1 });

// Method to unsubscribe
subscriptionSchema.methods.unsubscribe = function () {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
