const mongoose = require("mongoose");

const variationSchema = new mongoose.Schema({
  color: { type: String, trim: true },
  colorHex: { type: String, trim: true }, // Hex color code for display
  size: { type: String, trim: true },
  price: { type: Number, min: 0 }, // Optional: Override base price
  stock: { type: Number, min: 0, default: 0 },
  sku: { type: String, trim: true }, // Optional: Unique SKU for this variation
  isActive: { type: Boolean, default: true }
}, { _id: true });

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    categories: [{ type: String, trim: true }],
    price: { type: Number, required: true, min: 0 }, // Base price if no variations
    originalPrice: { type: Number, min: 0 },
    imageUrl: { type: String, trim: true },
    hasVariations: { type: Boolean, default: false },
    variations: [variationSchema],
    totalStock: { type: Number, default: 0 } // Sum of all variation stocks
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
