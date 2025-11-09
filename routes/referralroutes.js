const express = require("express");
const router = express.Router();
const {
  getUserReferralCode,
  getReferralDetails,
  validateReferralCode,
  processReferralReward,
  addReferral,
  getAllReferrals,
} = require("../controllers/referralcontroller");

/**
 * Referral Routes
 */

// Public routes
router.get("/validate/:code", validateReferralCode);
router.post("/add", addReferral);

// Protected routes (would need auth middleware in production)
// For now, these assume req.user is available
router.get("/my-code", getUserReferralCode);
router.get("/my-referrals", getReferralDetails);
router.post("/process-reward", processReferralReward);

// Admin routes
router.get("/all", getAllReferrals);

module.exports = router;
