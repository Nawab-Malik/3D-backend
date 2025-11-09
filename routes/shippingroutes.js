const express = require("express");
const router = express.Router();
const {
  calculateShipping,
  getAllShippingRules,
  createShippingRule,
  updateShippingRule,
  deleteShippingRule,
} = require("../controllers/shippingcontroller");

/**
 * Shipping Routes
 */

// Public routes
router.post("/calculate", calculateShipping);

// Admin routes (would need admin auth middleware in production)
router.get("/", getAllShippingRules);
router.post("/", createShippingRule);
router.put("/:id", updateShippingRule);
router.delete("/:id", deleteShippingRule);

module.exports = router;
