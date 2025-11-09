const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Payment Service
 * Handles all Stripe payment operations
 */

/**
 * Create a Stripe Checkout Session
 */
async function createCheckoutSession(orderData) {
  try {
    const { items, customerEmail, orderNo, successUrl, cancelUrl, metadata = {} } = orderData;

    // Convert items to Stripe line items format
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name || item.title,
          description: item.description || "",
          images: item.imageUrl ? [item.imageUrl] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to pence
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (orderData.shippingCost && orderData.shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: "Shipping",
            description: orderData.shippingMethod || "Standard Shipping",
          },
          unit_amount: Math.round(orderData.shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Create discount coupon if applicable
    let discounts = [];
    if (orderData.discount && orderData.discount > 0) {
      // Create a coupon in Stripe for this session
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(orderData.discount * 100),
        currency: "gbp",
        duration: "once",
        name: orderData.couponCode || "Discount",
      });

      discounts = [{ coupon: coupon.id }];
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: orderNo,
      success_url: successUrl || `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.CLIENT_URL}/checkout`,
      metadata: {
        orderNo,
        ...metadata,
      },
      shipping_address_collection: {
        allowed_countries: ["GB", "US", "CA", "AU"], // Customize as needed
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error("Stripe session creation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a Payment Intent (for custom payment flows)
 */
async function createPaymentIntent(amount, currency = "gbp", metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retrieve a checkout session
 */
async function getCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error("Session retrieval error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retrieve a payment intent
 */
async function getPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    console.error("Payment intent retrieval error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a refund
 */
async function createRefund(paymentIntentId, amount = null) {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);

    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error("Refund creation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return { success: true, event };
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle webhook events
 */
async function handleWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      // Payment successful
      const session = event.data.object;
      return {
        type: "payment_success",
        orderNo: session.client_reference_id,
        sessionId: session.id,
        customerEmail: session.customer_email,
        paymentStatus: session.payment_status,
      };

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      return {
        type: "payment_intent_success",
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
      };

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      return {
        type: "payment_failed",
        paymentIntentId: failedPayment.id,
        error: failedPayment.last_payment_error?.message,
      };

    case "charge.refunded":
      const refund = event.data.object;
      return {
        type: "refund",
        chargeId: refund.id,
        amount: refund.amount_refunded / 100,
      };

    default:
      return {
        type: "unhandled",
        eventType: event.type,
      };
  }
}

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  getCheckoutSession,
  getPaymentIntent,
  createRefund,
  verifyWebhookSignature,
  handleWebhookEvent,
};
