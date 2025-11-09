const mongoose = require("mongoose");

/**
 * ShippingRule Model
 * Manages shipping rates and rules
 */
const shippingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["flat_rate", "free", "weight_based", "price_based"],
      required: true,
    },
    baseRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    // For free shipping threshold
    freeShippingThreshold: {
      type: Number,
      min: 0,
    },
    // For weight-based shipping
    weightRates: [
      {
        minWeight: { type: Number, min: 0 },
        maxWeight: { type: Number, min: 0 },
        rate: { type: Number, min: 0 },
      },
    ],
    // For price-based shipping
    priceRates: [
      {
        minPrice: { type: Number, min: 0 },
        maxPrice: { type: Number, min: 0 },
        rate: { type: Number, min: 0 },
      },
    ],
    applicableCountries: [String], // Empty means all countries
    excludedCountries: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0, // Higher priority rules are checked first
    },
  },
  { timestamps: true }
);

// Method to calculate shipping cost
shippingRuleSchema.methods.calculateShipping = function (orderTotal, weight = 0, country = null) {
  // Check if rule applies to country
  if (country) {
    if (this.excludedCountries.includes(country)) {
      return null; // Rule doesn't apply
    }
    if (this.applicableCountries.length > 0 && !this.applicableCountries.includes(country)) {
      return null; // Rule doesn't apply
    }
  }

  let shippingCost = 0;

  switch (this.type) {
    case "flat_rate":
      shippingCost = this.baseRate;
      break;

    case "free":
      shippingCost = 0;
      break;

    case "price_based":
      // Check if order qualifies for free shipping
      if (this.freeShippingThreshold && orderTotal >= this.freeShippingThreshold) {
        shippingCost = 0;
      } else {
        // Find applicable price tier
        const applicableRate = this.priceRates.find(
          (rate) => orderTotal >= rate.minPrice && orderTotal <= rate.maxPrice
        );
        shippingCost = applicableRate ? applicableRate.rate : this.baseRate;
      }
      break;

    case "weight_based":
      // Find applicable weight tier
      const applicableWeight = this.weightRates.find(
        (rate) => weight >= rate.minWeight && weight <= rate.maxWeight
      );
      shippingCost = applicableWeight ? applicableWeight.rate : this.baseRate;
      break;

    default:
      shippingCost = this.baseRate;
  }

  return Number(shippingCost.toFixed(2));
};

// Static method to get applicable shipping rules
shippingRuleSchema.statics.getApplicableRules = function (country = null) {
  const query = { isActive: true };
  
  if (country) {
    query.$and = [
      { excludedCountries: { $ne: country } },
      {
        $or: [
          { applicableCountries: { $size: 0 } },
          { applicableCountries: country },
        ],
      },
    ];
  }

  return this.find(query).sort({ priority: -1 });
};

// Indexes
shippingRuleSchema.index({ isActive: 1, priority: -1 });

module.exports = mongoose.model("ShippingRule", shippingRuleSchema);
