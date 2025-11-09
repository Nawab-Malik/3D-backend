const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

/**
 * Email Service
 * Handles all email sending functionality using SendGrid or Nodemailer
 */

// Determine which email service to use
const USE_SENDGRID = process.env.SENDGRID_API_KEY ? true : false;

// Configure SendGrid if API key is available
if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configure Nodemailer as fallback
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email using available service
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    if (USE_SENDGRID) {
      const msg = {
        to,
        from: process.env.FROM_EMAIL || "noreply@yourdomain.com",
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };
      await sgMail.send(msg);
    } else {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || "noreply@yourdomain.com",
        to,
        subject,
        html,
        text,
      });
    }
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Email Templates
 */

// Welcome email with discount code for new subscribers
function getWelcomeEmailTemplate(name, discountCode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .discount-code { background: #ffeb3b; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Store!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name || "there"}!</h2>
          <p>Thank you for subscribing to our newsletter. We're excited to have you with us!</p>
          <p>As a welcome gift, here's a special discount code just for you:</p>
          <div class="discount-code">${discountCode}</div>
          <p>Use this code at checkout to get 10% off your first order!</p>
          <p style="text-align: center;">
            <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/products" class="button">Start Shopping</a>
          </p>
          <p>We'll keep you updated with:</p>
          <ul>
            <li>New product launches</li>
            <li>Exclusive deals and promotions</li>
            <li>Special offers just for subscribers</li>
          </ul>
        </div>
        <div class="footer">
          <p>You received this email because you subscribed to our newsletter.</p>
          <p><a href="${process.env.CLIENT_URL}/unsubscribe">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Order confirmation email
function getOrderConfirmationTemplate(order, user) {
  const itemsList = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product?.title || "Product"}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">£${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">£${item.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: #fff; padding: 15px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-weight: bold; background: #f0f0f0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Thank you for your order, ${user.name}!</h2>
          <p>Your order has been confirmed and will be processed shortly.</p>
          <div class="order-details">
            <h3>Order #${order.orderNo}</h3>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                  <td style="padding: 10px; text-align: right;">£${order.subtotal.toFixed(2)}</td>
                </tr>
                ${
                  order.discount > 0
                    ? `<tr>
                  <td colspan="3" style="padding: 10px; text-align: right; color: green;"><strong>Discount (${order.couponCode}):</strong></td>
                  <td style="padding: 10px; text-align: right; color: green;">-£${order.discount.toFixed(2)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                  <td style="padding: 10px; text-align: right;">${order.freeShipping ? "FREE" : "£" + order.shippingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
                  <td style="padding: 10px; text-align: right;">£${order.tax.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
                  <td style="padding: 10px; text-align: right;"><strong>£${order.grandTotal.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
            <h4>Shipping Address:</h4>
            <p>
              ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
              ${order.shippingAddress.country}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>
          <p style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/track-order?order=${order.orderNo}" class="button">Track Your Order</a>
          </p>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Shipping notification email
function getShippingEmailTemplate(order, user) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .tracking-info { background: #fff; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
        .tracking-number { font-size: 24px; font-weight: bold; color: #000; margin: 15px 0; }
        .button { display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <h2>Great news, ${user.name}!</h2>
          <p>Your order #${order.orderNo} has been shipped and is on its way to you.</p>
          <div class="tracking-info">
            <p><strong>Courier:</strong> ${order.courierName || "Standard Delivery"}</p>
            <p><strong>Tracking Number:</strong></p>
            <div class="tracking-number">${order.trackingNumber || "Will be updated soon"}</div>
            ${
              order.estimatedDelivery
                ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>`
                : ""
            }
            <a href="${process.env.CLIENT_URL}/track-order?order=${order.orderNo}" class="button">Track Your Package</a>
          </div>
          <p>Your package will arrive soon. Thank you for shopping with us!</p>
        </div>
        <div class="footer">
          <p>Need help? Contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Abandoned cart email
function getAbandonedCartEmailTemplate(user, cartItems) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .discount { background: #ffeb3b; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You Left Something Behind!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>We noticed you left some items in your cart. Don't worry, we saved them for you!</p>
          <div class="discount">
            <h3>Complete your purchase now and get 5% off!</h3>
            <p>Use code: <strong>COMEBACK5</strong></p>
          </div>
          <p style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/cart" class="button">Complete Your Order</a>
          </p>
          <p>This offer expires in 24 hours, so hurry!</p>
        </div>
        <div class="footer">
          <p>Questions? We're here to help!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Referral reward email
function getReferralRewardEmailTemplate(user, reward) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .reward-box { background: #4caf50; color: #fff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .reward-code { font-size: 28px; font-weight: bold; margin: 10px 0; }
        .button { display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You've Earned a Reward!</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${user.name}!</h2>
          <p>Great news! Someone used your referral link and made a purchase. Here's your reward:</p>
          <div class="reward-box">
            <h3>Your Reward</h3>
            ${
              reward.type === "coupon"
                ? `
              <p>Discount Code:</p>
              <div class="reward-code">${reward.code}</div>
              <p>Value: £${reward.value} OFF</p>
            `
                : `
              <p>Store Credit Added:</p>
              <div class="reward-code">£${reward.value}</div>
            `
            }
          </div>
          <p>Keep sharing your referral link to earn more rewards!</p>
          <p style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/account/referrals" class="button">View My Referrals</a>
          </p>
        </div>
        <div class="footer">
          <p>Thank you for spreading the word!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send welcome email
async function sendWelcomeEmail(email, name, discountCode) {
  return sendEmail({
    to: email,
    subject: "Welcome! Here's Your Special Discount 🎁",
    html: getWelcomeEmailTemplate(name, discountCode),
  });
}

// Send order confirmation
async function sendOrderConfirmation(order, user) {
  return sendEmail({
    to: user.email,
    subject: `Order Confirmed - #${order.orderNo}`,
    html: getOrderConfirmationTemplate(order, user),
  });
}

// Send shipping notification
async function sendShippingNotification(order, user) {
  return sendEmail({
    to: user.email,
    subject: `Your Order Has Shipped - #${order.orderNo}`,
    html: getShippingEmailTemplate(order, user),
  });
}

// Send abandoned cart email
async function sendAbandonedCartEmail(user, cartItems) {
  return sendEmail({
    to: user.email,
    subject: "Don't Forget Your Items! 🛒",
    html: getAbandonedCartEmailTemplate(user, cartItems),
  });
}

// Send referral reward email
async function sendReferralRewardEmail(user, reward) {
  return sendEmail({
    to: user.email,
    subject: "You've Earned a Reward! 🎉",
    html: getReferralRewardEmailTemplate(user, reward),
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendShippingNotification,
  sendAbandonedCartEmail,
  sendReferralRewardEmail,
};
