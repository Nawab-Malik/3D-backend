const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    categories: [{ type: String }],
    description: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    imageUrl: { type: String, required: true }, // URL or path to image
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
