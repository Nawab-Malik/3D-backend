const express = require("express");
const router = express.Router();
const auth = require("../controllers/authcontroller");
const Cart = require("../models/cart");
const Product = require("../models/product");

// GET /api/cart
router.get("/", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "title price imageUrl description"
    );

    if (!cart) {
      return res.json({ success: true, cart: { items: [], totalItems: 0 } });
    }

    res.json({ success: true, cart });
  } catch (error) {
    console.error("Cart fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching cart" });
  }
});

// POST /api/cart/add
router.post("/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    const idx = cart.items.findIndex(
      (it) => it.product.toString() === productId
    );
    if (idx > -1) cart.items[idx].quantity += Number(quantity);
    else cart.items.push({ product: productId, quantity: Number(quantity) });

    await cart.save();
    await cart.populate("items.product", "title price imageUrl description");

    res.json({ success: true, message: "Product added to cart", cart });
  } catch (error) {
    console.error("Add to cart error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error adding to cart" });
  }
});

// PUT /api/cart/update/:itemId  (itemId = subdocument _id)
router.put("/update/:itemId", auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!Number.isFinite(quantity) || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });

    item.quantity = Number(quantity);
    await cart.save();
    await cart.populate("items.product", "title price imageUrl description");

    res.json({ success: true, message: "Cart updated", cart });
  } catch (error) {
    console.error("Update cart error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating cart" });
  }
});

// DELETE /api/cart/remove/:itemId
router.delete("/remove/:itemId", auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    cart.items.pull(itemId);
    await cart.save();
    await cart.populate("items.product", "title price imageUrl description");

    res.json({ success: true, message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Remove cart item error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error removing from cart" });
  }
});

// DELETE /api/cart/clear
router.delete("/clear", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Cart cleared",
      cart: { items: [], totalItems: 0 },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error clearing cart" });
  }
});

module.exports = router;
