const {
  createCheckoutSession,
  createPaymentIntent,
  getCheckoutSession,
  verifyWebhookSignature,
  handleWebhookEvent,
} = require("../utils/stripeService");
const Order = require("../models/order");
const { sendOrderConfirmation } = require("../utils/emailService");
const User = require("../models/user");

/**
 * Payment Controller
 * Handles Stripe payment operations
 */

// Create Stripe checkout session
exports.createCheckout = async (req, res) => {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({ message: "Order data is required" });
    }

    // Create checkout session
    const result = await createCheckoutSession(orderData);

    if (result.success) {
      // Update order with Stripe session ID if order exists
      if (orderData.orderId) {
        await Order.findByIdAndUpdate(orderData.orderId, {
          stripeSessionId: result.sessionId,
        });
      }

      res.json({
        success: true,
        sessionId: result.sessionId,
        url: result.url,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error,
      });
    }
  } catch (error) {
    console.error("Create checkout error:", error);
    res.status(500).json({ message: "Error creating checkout session", error: error.message });
  }
};

// Create payment intent
exports.createIntent = async (req, res) => {
  try {
    const { amount, currency = "gbp", orderId } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const result = await createPaymentIntent(amount, currency, { orderId });

    if (result.success) {
      // Update order with payment intent ID if order exists
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          stripePaymentIntentId: result.paymentIntentId,
        });
      }

      res.json({
        success: true,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error,
      });
    }
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ message: "Error creating payment intent", error: error.message });
  }
};

// Verify payment (after checkout)
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const result = await getCheckoutSession(sessionId);

    if (result.success) {
      const session = result.session;

      // Find order by session ID
      const order = await Order.findOne({ stripeSessionId: sessionId });

      if (order) {
        // Update order payment status
        order.paymentStatus = session.payment_status === "paid" ? "paid" : "pending";
        order.status = session.payment_status === "paid" ? "confirmed" : "pending";

        // Add to status history
        order.statusHistory.push({
          status: order.status,
          timestamp: new Date(),
          note: "Payment verified",
        });

        await order.save();

        // Send confirmation email if payment successful
        if (order.paymentStatus === "paid" && !order.emailsSent.confirmation) {
          const user = await User.findById(order.user);
          if (user) {
            sendOrderConfirmation(order, user).catch((err) =>
              console.error("Order confirmation email error:", err)
            );
            order.emailsSent.confirmation = true;
            await order.save();
          }
        }
      }

      res.json({
        success: true,
        paymentStatus: session.payment_status,
        order,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error,
      });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
};

// Stripe webhook handler
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const payload = req.body;

    // Verify webhook signature
    const verification = verifyWebhookSignature(payload, signature);

    if (!verification.success) {
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    // Handle the event
    const eventData = await handleWebhookEvent(verification.event);

    // Process based on event type
    switch (eventData.type) {
      case "payment_success":
        // Find and update order
        const order = await Order.findOne({ orderNo: eventData.orderNo });
        if (order) {
          order.paymentStatus = "paid";
          order.status = "confirmed";
          order.statusHistory.push({
            status: "confirmed",
            timestamp: new Date(),
            note: "Payment successful via webhook",
          });
          await order.save();

          // Send confirmation email
          const user = await User.findById(order.user);
          if (user && !order.emailsSent.confirmation) {
            sendOrderConfirmation(order, user).catch((err) =>
              console.error("Order confirmation email error:", err)
            );
            order.emailsSent.confirmation = true;
            await order.save();
          }
        }
        break;

      case "payment_failed":
        // Update order as failed
        const failedOrder = await Order.findOne({
          stripePaymentIntentId: eventData.paymentIntentId,
        });
        if (failedOrder) {
          failedOrder.paymentStatus = "failed";
          failedOrder.statusHistory.push({
            status: "cancelled",
            timestamp: new Date(),
            note: `Payment failed: ${eventData.error}`,
          });
          await failedOrder.save();
        }
        break;

      default:
        console.log("Unhandled webhook event:", eventData.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};
