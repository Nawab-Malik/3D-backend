const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Cart = require("../models/cart");
const auth = require("../controllers/authcontroller");

// POST /api/orders/create
router.post("/create", auth, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "title price imageUrl"
    );
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let subtotal = 0;
    const orderItems = cart.items.map((ci) => {
      const price = Number(ci.product.price || 0);
      const quantity = Number(ci.quantity || 0);
      const total = price * quantity;
      subtotal += total;
      return {
        product: ci.product._id,
        quantity,
        price,
        total,
      };
    });

    const tax = subtotal * 0.08;
    const grandTotal = subtotal + tax;

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      subtotal,
      tax,
      grandTotal,
      shippingAddress,
      paymentMethod,
    });

    await order.save();

    // clear cart
    cart.items = [];
    await cart.save();

    await order.populate("items.product", "title imageUrl");

    res
      .status(201)
      .json({ success: true, message: "Order created successfully", order });
  } catch (error) {
    console.error("Order creation error:", error);

    if (error?.code === 11000) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Duplicate order number generated. Please try again.",
        });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/orders
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "title imageUrl")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching orders" });
  }
});

// GET /api/orders/:orderId
router.get("/:orderId", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id,
    }).populate("items.product", "title imageUrl");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Fetch order error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching order" });
  }
});

module.exports = router;
