const Coupon = require("../models/coupon");

/**
 * Coupon Controller
 * Manages coupon operations
 */

// Validate and apply coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, userId } = req.body;

    if (!code || subtotal === undefined) {
      return res.status(400).json({ message: "Coupon code and subtotal are required" });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Check if coupon is valid
    const validation = coupon.isValid();
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Check if user can use this coupon
    if (userId) {
      const userValidation = coupon.canUserUse(userId);
      if (!userValidation.valid) {
        return res.status(400).json({ message: userValidation.message });
      }
    }

    // Check minimum purchase requirement
    if (coupon.minimumPurchase && subtotal < coupon.minimumPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of £${coupon.minimumPurchase} required for this coupon`,
      });
    }

    // Calculate discount
    const { discount, freeShipping } = coupon.calculateDiscount(subtotal);

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discount,
        freeShipping,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({ message: "Error validating coupon", error: error.message });
  }
};

// Get all coupons (Admin)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("Get coupons error:", error);
    res.status(500).json({ message: "Error fetching coupons", error: error.message });
  }
};

// Create coupon (Admin)
exports.createCoupon = async (req, res) => {
  try {
    const couponData = {
      ...req.body,
      createdBy: req.user?.id,
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    res.status(201).json({
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }
    res.status(500).json({ message: "Error creating coupon", error: error.message });
  }
};

// Update coupon (Admin)
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({ message: "Error updating coupon", error: error.message });
  }
};

// Delete coupon (Admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({ message: "Error deleting coupon", error: error.message });
  }
};

// Mark coupon as used
exports.useCoupon = async (req, res) => {
  try {
    const { code, userId, orderNo } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Add to used list
    coupon.usedBy.push({
      user: userId,
      orderNo,
      usedAt: new Date(),
    });
    coupon.usedCount += 1;

    await coupon.save();

    res.json({ message: "Coupon usage recorded" });
  } catch (error) {
    console.error("Use coupon error:", error);
    res.status(500).json({ message: "Error recording coupon usage", error: error.message });
  }
};
