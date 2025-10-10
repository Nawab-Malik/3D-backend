const Cart = require("../models/cart");

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne().populate("items.productId");

    if (!cart) {
      cart = new Cart({ items: [] });
      await cart.save();
    }

    // Convert productId to product for frontend compatibility
    const items = cart.items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    let cart = await Cart.findOne();

    if (!cart) {
      cart = new Cart({ items: [] });
    }

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    // Populate and return updated cart in {product, quantity} format
    cart = await Cart.findById(cart._id).populate("items.productId");
    const items = cart.items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    let cart = await Cart.findOne();

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      item => item.productId.toString() !== req.params.id
    );

    await cart.save();

    // Return updated cart
    cart = await Cart.findById(cart._id).populate("items.productId");
    const items = cart.items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
