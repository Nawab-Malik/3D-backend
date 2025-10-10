// routes/tempadmin.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

// Quick admin creation endpoint
router.get("/setup-admin", async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@3dprints.com" });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: "Admin user already exists",
        user: existingAdmin,
      });
    }

    // Create admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("admin123", saltRounds);

    const adminUser = new User({
      name: "System Admin",
      email: "admin@3dprints.com",
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      phone: "0300-ADMIN00",
    });

    await adminUser.save();

    res.json({
      success: true,
      message: "Admin user created successfully!",
      credentials: {
        email: "admin@3dprints.com",
        password: "admin123",
      },
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      message: "Error creating admin user",
    });
  }
});

module.exports = router;
