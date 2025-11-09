const mongoose = require("mongoose");

/**
 * Coupon Model
 * Handles discount codes with various discount types and validation rules
 */
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number, // Maximum discount amount for percentage coupons
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number, // Total times this coupon can be used
      min: 0,
    },
    usagePerUser: {
      type: Number, // Times one user can use this coupon
      default: 1,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
        orderNo: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableCategories: [String], // Empty array means all categories
    excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for faster lookups
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ expiryDate: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  
  // Check if coupon is active
  if (!this.isActive) {
    return { valid: false, message: "This coupon is inactive" };
  }

  // Check dates
  if (now < this.startDate) {
    return { valid: false, message: "This coupon is not yet active" };
  }
  
  if (now > this.expiryDate) {
    return { valid: false, message: "This coupon has expired" };
  }

  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }

  return { valid: true, message: "Coupon is valid" };
};

// Method to check if user can use this coupon
couponSchema.methods.canUserUse = function (userId) {
  const userUsage = this.usedBy.filter(
    (u) => u.user.toString() === userId.toString()
  );
  
  if (userUsage.length >= this.usagePerUser) {
    return {
      valid: false,
      message: "You have already used this coupon the maximum number of times",
    };
  }

  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (subtotal, shippingCost = 0) {
  let discount = 0;
  let freeShipping = false;

  if (this.discountType === "percentage") {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === "fixed") {
    discount = this.discountValue;
    if (discount > subtotal) {
      discount = subtotal; // Can't discount more than the subtotal
    }
  } else if (this.discountType === "free_shipping") {
    freeShipping = true;
    discount = shippingCost;
  }

  return {
    discount: Number(discount.toFixed(2)),
    freeShipping,
  };
};

module.exports = mongoose.model("Coupon", couponSchema);
