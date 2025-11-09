const Subscription = require("../models/subscription");
const Coupon = require("../models/coupon");
const { sendWelcomeEmail } = require("../utils/emailService");

/**
 * Subscription Controller
 * Manages email subscriptions
 */

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const { email, name, source = "popup" } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if already subscribed
    let subscription = await Subscription.findOne({ email: email.toLowerCase() });

    if (subscription) {
      if (subscription.isActive) {
        return res.status(400).json({ message: "This email is already subscribed" });
      } else {
        // Reactivate subscription
        subscription.isActive = true;
        subscription.subscribedAt = new Date();
        subscription.unsubscribedAt = null;
        await subscription.save();

        return res.json({
          message: "Subscription reactivated successfully",
          subscription,
        });
      }
    }

    // Generate welcome discount code
    const discountCode = `WELCOME${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create welcome coupon
    const welcomeCoupon = new Coupon({
      code: discountCode,
      description: "Welcome discount for new subscriber",
      discountType: "percentage",
      discountValue: 10,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      usagePerUser: 1,
      isActive: true,
    });

    await welcomeCoupon.save();

    // Create subscription
    subscription = new Subscription({
      email,
      name,
      source,
      discountCode,
    });

    await subscription.save();

    // Send welcome email asynchronously
    sendWelcomeEmail(email, name, discountCode)
      .then(() => {
        subscription.welcomeEmailSent = true;
        subscription.welcomeEmailSentAt = new Date();
        subscription.save();
      })
      .catch((error) => {
        console.error("Welcome email error:", error);
      });

    res.status(201).json({
      message: "Successfully subscribed! Check your email for a welcome discount.",
      subscription: {
        email: subscription.email,
        discountCode,
      },
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "This email is already subscribed" });
    }
    res.status(500).json({ message: "Error creating subscription", error: error.message });
  }
};

// Get all subscriptions (Admin)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { isActive, source } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (source) {
      query.source = source;
    }

    const subscriptions = await Subscription.find(query).sort({ subscribedAt: -1 });

    res.json({
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ message: "Error fetching subscriptions", error: error.message });
  }
};

// Unsubscribe
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscription = await Subscription.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    await subscription.unsubscribe();

    res.json({ message: "Successfully unsubscribed" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ message: "Error unsubscribing", error: error.message });
  }
};

// Update subscription preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { email, preferences } = req.body;

    const subscription = await Subscription.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.preferences = { ...subscription.preferences, ...preferences };
    await subscription.save();

    res.json({
      message: "Preferences updated successfully",
      subscription,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Error updating preferences", error: error.message });
  }
};

// Delete subscription (Admin)
exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByIdAndDelete(id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Delete subscription error:", error);
    res.status(500).json({ message: "Error deleting subscription", error: error.message });
  }
};
