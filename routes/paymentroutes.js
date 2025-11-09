const express = require("express");
const router = express.Router();
const {
  createCheckout,
  createIntent,
  verifyPayment,
  handleWebhook,
} = require("../controllers/paymentcontroller");

/**
 * Payment Routes
 */

// Stripe checkout
router.post("/create-checkout", createCheckout);

// Payment intent
router.post("/create-intent", createIntent);

// Verify payment
router.post("/verify", verifyPayment);

// Webhook (raw body needed for signature verification)
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

module.exports = router;
