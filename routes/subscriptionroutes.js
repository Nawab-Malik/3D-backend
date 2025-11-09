const express = require("express");
const router = express.Router();
const {
  createSubscription,
  getAllSubscriptions,
  unsubscribe,
  updatePreferences,
  deleteSubscription,
} = require("../controllers/subscriptioncontroller");

/**
 * Subscription Routes
 */

// Public routes
router.post("/", createSubscription);
router.post("/unsubscribe", unsubscribe);
router.put("/preferences", updatePreferences);

// Admin routes (would need admin auth middleware in production)
router.get("/", getAllSubscriptions);
router.delete("/:id", deleteSubscription);

module.exports = router;
