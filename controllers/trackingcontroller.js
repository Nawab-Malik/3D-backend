const Order = require("../models/order");
const User = require("../models/user");
const { sendShippingNotification } = require("../utils/emailService");

/**
 * Tracking Controller
 * Handles order tracking operations
 */

// Track order by order number
exports.trackByOrderNumber = async (req, res) => {
  try {
    const { orderNo } = req.params;

    const order = await Order.findOne({ orderNo }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Return tracking information
    res.json({
      orderNo: order.orderNo,
      status: order.status,
      statusHistory: order.statusHistory,
      trackingNumber: order.trackingNumber,
      courierName: order.courierName,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      items: order.items,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ message: "Error tracking order", error: error.message });
  }
};

// Track order by email
exports.trackByEmail = async (req, res) => {
  try {
    const { email, orderNo } = req.body;

    if (!email || !orderNo) {
      return res.status(400).json({ message: "Email and order number are required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "No orders found for this email" });
    }

    // Find order
    const order = await Order.findOne({
      orderNo,
      user: user._id,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      orderNo: order.orderNo,
      status: order.status,
      statusHistory: order.statusHistory,
      trackingNumber: order.trackingNumber,
      courierName: order.courierName,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      items: order.items,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error("Track by email error:", error);
    res.status(500).json({ message: "Error tracking order", error: error.message });
  }
};

// Update order tracking (Admin)
exports.updateTracking = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { trackingNumber, courierName, estimatedDelivery, status, note } = req.body;

    const order = await Order.findOne({ orderNo });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update tracking details
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierName) order.courierName = courierName;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

    // Update status if provided
    if (status && status !== order.status) {
      order.status = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status}`,
        updatedBy: req.user?.id,
      });

      // Send email notification for shipping status
      if (status === "shipped" && !order.emailsSent.shipped) {
        const user = await User.findById(order.user);
        if (user) {
          sendShippingNotification(order, user).catch((err) =>
            console.error("Shipping notification error:", err)
          );
          order.emailsSent.shipped = true;
        }
      }

      // Mark delivered date
      if (status === "delivered") {
        order.deliveredAt = new Date();
        if (!order.emailsSent.delivered) {
          order.emailsSent.delivered = true;
        }
      }
    }

    await order.save();

    res.json({
      message: "Tracking information updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update tracking error:", error);
    res.status(500).json({ message: "Error updating tracking", error: error.message });
  }
};

// Bulk update order status (Admin)
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { orderNos, status, note } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({ message: "Order numbers array is required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const updates = [];

    for (const orderNo of orderNos) {
      const order = await Order.findOne({ orderNo });
      if (order) {
        order.status = status;
        order.statusHistory.push({
          status,
          timestamp: new Date(),
          note: note || `Bulk status update to ${status}`,
          updatedBy: req.user?.id,
        });

        if (status === "delivered") {
          order.deliveredAt = new Date();
        }

        await order.save();
        updates.push(orderNo);
      }
    }

    res.json({
      message: `${updates.length} orders updated successfully`,
      updatedOrders: updates,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ message: "Error updating orders", error: error.message });
  }
};
