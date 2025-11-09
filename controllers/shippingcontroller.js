const ShippingRule = require("../models/shippingrule");

/**
 * Shipping Controller
 * Manages shipping rules and calculations
 */

// Calculate shipping cost
exports.calculateShipping = async (req, res) => {
  try {
    const { orderTotal, weight = 0, country = "GB" } = req.body;

    if (orderTotal === undefined) {
      return res.status(400).json({ message: "Order total is required" });
    }

    // Get applicable shipping rules
    const rules = await ShippingRule.getApplicableRules(country);

    if (rules.length === 0) {
      return res.json({
        shippingCost: 0,
        message: "No shipping rules found",
      });
    }

    // Calculate shipping with the highest priority rule
    const primaryRule = rules[0];
    const shippingCost = primaryRule.calculateShipping(orderTotal, weight, country);

    if (shippingCost === null) {
      return res.status(400).json({ message: "No applicable shipping rule found" });
    }

    res.json({
      shippingCost,
      shippingMethod: primaryRule.name,
      freeShipping: shippingCost === 0,
      freeShippingThreshold: primaryRule.freeShippingThreshold || null,
    });
  } catch (error) {
    console.error("Calculate shipping error:", error);
    res.status(500).json({ message: "Error calculating shipping", error: error.message });
  }
};

// Get all shipping rules (Admin)
exports.getAllShippingRules = async (req, res) => {
  try {
    const rules = await ShippingRule.find().sort({ priority: -1 });
    res.json(rules);
  } catch (error) {
    console.error("Get shipping rules error:", error);
    res.status(500).json({ message: "Error fetching shipping rules", error: error.message });
  }
};

// Create shipping rule (Admin)
exports.createShippingRule = async (req, res) => {
  try {
    const rule = new ShippingRule(req.body);
    await rule.save();

    res.status(201).json({
      message: "Shipping rule created successfully",
      rule,
    });
  } catch (error) {
    console.error("Create shipping rule error:", error);
    res.status(500).json({ message: "Error creating shipping rule", error: error.message });
  }
};

// Update shipping rule (Admin)
exports.updateShippingRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await ShippingRule.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!rule) {
      return res.status(404).json({ message: "Shipping rule not found" });
    }

    res.json({
      message: "Shipping rule updated successfully",
      rule,
    });
  } catch (error) {
    console.error("Update shipping rule error:", error);
    res.status(500).json({ message: "Error updating shipping rule", error: error.message });
  }
};

// Delete shipping rule (Admin)
exports.deleteShippingRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await ShippingRule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({ message: "Shipping rule not found" });
    }

    res.json({ message: "Shipping rule deleted successfully" });
  } catch (error) {
    console.error("Delete shipping rule error:", error);
    res.status(500).json({ message: "Error deleting shipping rule", error: error.message });
  }
};
