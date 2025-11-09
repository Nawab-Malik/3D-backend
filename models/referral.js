const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Referral Model
 * Manages user referral system with rewards
 */
const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    referrals: [
      {
        referee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        referredAt: { type: Date, default: Date.now },
        orderPlaced: { type: Boolean, default: false },
        orderNo: String,
        orderDate: Date,
        rewardGiven: { type: Boolean, default: false },
        rewardType: {
          type: String,
          enum: ["coupon", "credit", "points"],
        },
        rewardValue: Number,
        rewardCode: String, // Coupon code or credit ID
      },
    ],
    totalReferrals: {
      type: Number,
      default: 0,
    },
    successfulReferrals: {
      type: Number,
      default: 0, // Referrals that resulted in purchases
    },
    totalRewardsEarned: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Generate unique referral code
function generateReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Pre-save hook to generate referral code
referralSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    let code;
    let exists = true;

    while (exists) {
      code = generateReferralCode();
      const existing = await this.constructor.findOne({ referralCode: code });
      if (!existing) exists = false;
    }

    this.referralCode = code;
  }
  next();
});

// Method to add a new referral
referralSchema.methods.addReferral = function (refereeId) {
  // Check if user already referred
  const alreadyReferred = this.referrals.some(
    (ref) => ref.referee.toString() === refereeId.toString()
  );

  if (alreadyReferred) {
    return { success: false, message: "User already referred" };
  }

  this.referrals.push({
    referee: refereeId,
    referredAt: new Date(),
  });

  this.totalReferrals += 1;
  return { success: true };
};

// Method to mark referral as successful and give reward
referralSchema.methods.markReferralSuccess = async function (refereeId, orderNo, rewardDetails) {
  const referral = this.referrals.find(
    (ref) => ref.referee.toString() === refereeId.toString()
  );

  if (!referral) {
    return { success: false, message: "Referral not found" };
  }

  if (referral.orderPlaced) {
    return { success: false, message: "Reward already processed for this referral" };
  }

  referral.orderPlaced = true;
  referral.orderNo = orderNo;
  referral.orderDate = new Date();
  referral.rewardGiven = true;
  referral.rewardType = rewardDetails.type;
  referral.rewardValue = rewardDetails.value;
  referral.rewardCode = rewardDetails.code;

  this.successfulReferrals += 1;
  this.totalRewardsEarned += rewardDetails.value || 0;

  await this.save();
  return { success: true, reward: rewardDetails };
};

// Static method to find by code
referralSchema.statics.findByCode = function (code) {
  return this.findOne({ referralCode: code.toUpperCase(), isActive: true });
};

// Indexes
referralSchema.index({ referrer: 1, isActive: 1 });
referralSchema.index({ "referrals.referee": 1 });

module.exports = mongoose.model("Referral", referralSchema);
