const Referral = require("../models/referral");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const { sendReferralRewardEmail } = require("../utils/emailService");

/**
 * Referral Controller
 * Manages referral system
 */

// Get or create referral code for user
exports.getUserReferralCode = async (req, res) => {
  try {
    const userId = req.user.id;

    let referral = await Referral.findOne({ referrer: userId });

    if (!referral) {
      // Create new referral record
      referral = new Referral({
        referrer: userId,
      });
      await referral.save();
    }

    const referralLink = `${process.env.CLIENT_URL}/signup?ref=${referral.referralCode}`;

    res.json({
      referralCode: referral.referralCode,
      referralLink,
      totalReferrals: referral.totalReferrals,
      successfulReferrals: referral.successfulReferrals,
      totalRewardsEarned: referral.totalRewardsEarned,
    });
  } catch (error) {
    console.error("Get referral code error:", error);
    res.status(500).json({ message: "Error fetching referral code", error: error.message });
  }
};

// Get referral details with history
exports.getReferralDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const referral = await Referral.findOne({ referrer: userId }).populate("referrals.referee", "name email");

    if (!referral) {
      return res.json({
        referralCode: null,
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewardsEarned: 0,
        referrals: [],
      });
    }

    res.json({
      referralCode: referral.referralCode,
      referralLink: `${process.env.CLIENT_URL}/signup?ref=${referral.referralCode}`,
      totalReferrals: referral.totalReferrals,
      successfulReferrals: referral.successfulReferrals,
      totalRewardsEarned: referral.totalRewardsEarned,
      referrals: referral.referrals,
    });
  } catch (error) {
    console.error("Get referral details error:", error);
    res.status(500).json({ message: "Error fetching referral details", error: error.message });
  }
};

// Validate referral code during signup
exports.validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;

    const referral = await Referral.findByCode(code);

    if (!referral) {
      return res.status(404).json({ message: "Invalid referral code" });
    }

    res.json({
      valid: true,
      referrerId: referral.referrer,
    });
  } catch (error) {
    console.error("Validate referral code error:", error);
    res.status(500).json({ message: "Error validating referral code", error: error.message });
  }
};

// Process referral on new user order
exports.processReferralReward = async (req, res) => {
  try {
    const { userId, orderNo, orderTotal } = req.body;

    const user = await User.findById(userId);

    if (!user || !user.referredBy) {
      return res.json({ message: "No referral to process" });
    }

    // Find referrer's referral record
    const referral = await Referral.findOne({ referrer: user.referredBy });

    if (!referral) {
      return res.json({ message: "Referral record not found" });
    }

    // Check if already processed
    const existingReferral = referral.referrals.find((ref) => ref.referee.toString() === userId.toString());

    if (existingReferral && existingReferral.orderPlaced) {
      return res.json({ message: "Referral already processed" });
    }

    // Create reward coupon for referrer
    const rewardCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const rewardValue = 10; // £10 reward

    const rewardCoupon = new Coupon({
      code: rewardCode,
      description: "Referral reward",
      discountType: "fixed",
      discountValue: rewardValue,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usagePerUser: 1,
      isActive: true,
    });

    await rewardCoupon.save();

    // Mark referral as successful
    const result = await referral.markReferralSuccess(userId, orderNo, {
      type: "coupon",
      value: rewardValue,
      code: rewardCode,
    });

    if (result.success) {
      // Send reward email to referrer
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        sendReferralRewardEmail(referrer, {
          type: "coupon",
          value: rewardValue,
          code: rewardCode,
        }).catch((err) => console.error("Referral email error:", err));
      }

      res.json({
        message: "Referral reward processed successfully",
        reward: result.reward,
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Process referral reward error:", error);
    res.status(500).json({ message: "Error processing referral reward", error: error.message });
  }
};

// Add referral when user signs up with code
exports.addReferral = async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    const referral = await Referral.findByCode(referralCode);

    if (!referral) {
      return res.status(404).json({ message: "Invalid referral code" });
    }

    // Prevent self-referral
    if (referral.referrer.toString() === newUserId.toString()) {
      return res.status(400).json({ message: "You cannot refer yourself" });
    }

    // Add referral
    const result = referral.addReferral(newUserId);

    if (result.success) {
      await referral.save();

      // Update new user's referredBy field
      await User.findByIdAndUpdate(newUserId, { referredBy: referral.referrer });

      res.json({ message: "Referral recorded successfully" });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Add referral error:", error);
    res.status(500).json({ message: "Error adding referral", error: error.message });
  }
};

// Get all referrals (Admin)
exports.getAllReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate("referrer", "name email")
      .populate("referrals.referee", "name email")
      .sort({ successfulReferrals: -1 });

    res.json(referrals);
  } catch (error) {
    console.error("Get all referrals error:", error);
    res.status(500).json({ message: "Error fetching referrals", error: error.message });
  }
};
