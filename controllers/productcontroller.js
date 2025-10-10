const Product = require("../models/product");

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const products = await Product.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Product.countDocuments();
    res.json({ products, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
