const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

function generateOrderNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1e5)
    .toString(36)
    .toUpperCase();
  return `ORD-${ts}-${rand}`;
}

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, unique: true, default: generateOrderNo },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    
    // Discount information
    couponCode: { type: String, uppercase: true, trim: true },
    discount: { type: Number, default: 0, min: 0 },
    discountType: { type: String, enum: ["percentage", "fixed", "free_shipping"] },
    
    // Shipping information
    shippingCost: { type: Number, default: 0, min: 0 },
    shippingMethod: { type: String, trim: true },
    freeShipping: { type: Boolean, default: false },
    
    tax: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    
    shippingAddress: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    
    // Payment information
    paymentMethod: { type: String, trim: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    
    // Order status and tracking
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    trackingNumber: { type: String, trim: true },
    courierName: { type: String, trim: true },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    
    // Referral information
    referralCode: { type: String, uppercase: true, trim: true },
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Email notifications
    emailsSent: {
      confirmation: { type: Boolean, default: false },
      shipped: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
    },
    
    // Notes
    customerNote: { type: String, trim: true },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
