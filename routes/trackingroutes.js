const express = require("express");
const router = express.Router();
const {
  trackByOrderNumber,
  trackByEmail,
  updateTracking,
  bulkUpdateStatus,
} = require("../controllers/trackingcontroller");

/**
 * Order Tracking Routes
 */

// Public routes
router.get("/:orderNo", trackByOrderNumber);
router.post("/email", trackByEmail);

// Admin routes (would need admin auth middleware in production)
router.put("/:orderNo", updateTracking);
router.post("/bulk-update", bulkUpdateStatus);

module.exports = router;
