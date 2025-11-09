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
    const { productId, quantity = 1, variation } = req.body;
    const userId = req.user?.id;
    
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if same product with same variation exists
    const existingItem = cart.items.find(item => {
      const productMatch = item.product.toString() === productId;
      
      // If no variations, just match by product
      if (!variation && !item.variation) return productMatch;
      
      // If one has variation and other doesn't, they're different
      if (!variation || !item.variation) return false;
      
      // Both have variations, check if they match
      const variationMatch = 
        item.variation.variationId?.toString() === variation.variationId?.toString() ||
        (item.variation.color === variation.color && item.variation.size === variation.size);
      
      return productMatch && variationMatch;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const newItem = { product: productId, quantity };
      if (variation) {
        newItem.variation = variation;
      }
      cart.items.push(newItem);
    }

    await cart.save();

    // Populate and return updated cart
    cart = await Cart.findById(cart._id).populate("items.product");
    const items = cart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      variation: item.variation
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
