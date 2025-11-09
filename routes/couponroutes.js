const express = require("express");
const router = express.Router();
const {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  useCoupon,
} = require("../controllers/couponcontroller");

/**
 * Coupon Routes
 */

// Public routes
router.post("/validate", validateCoupon);

// Protected routes (would need auth middleware in production)
router.post("/use", useCoupon);

// Admin routes (would need admin auth middleware in production)
router.get("/", getAllCoupons);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
