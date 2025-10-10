const express = require("express");
const router = express.Router();
const User = require("../models/user"); // Add this import

router.get("/test-login", async (req, res) => {
  try {
    // Test the admin user exists and can be found
    const adminUser = await User.findOne({ email: "admin@3dprints.com" });

    if (!adminUser) {
      return res.json({ success: false, message: "Admin user not found" });
    }

    res.json({
      success: true,
      message: "Admin user exists in database",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isVerified: adminUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Test login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
