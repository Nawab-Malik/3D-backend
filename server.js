// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" })); // Restrict in production
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Existing routes
app.use("/api/users", require("./routes/userroutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/productroutes"));
app.use("/api/cart", require("./routes/cartroutes"));
app.use("/api/orders", require("./routes/orderroutes"));
app.use("/api/admin", require("./routes/adminroutes")); // Main admin routes
app.use("/api/admin/orders", require("./routes/adminorders")); // Admin orders under admin path
app.use("/api/test", require("./routes/test"));
app.use("/api/setup", require("./routes/tempadmin"));
app.use("/api/gallery", require("./routes/galleryroutes"));
app.use("/api/admin/gallery", require("./routes/admingallery"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/feedback", require("./routes/feedback"));

// New feature routes
app.use("/api/coupons", require("./routes/couponroutes"));
app.use("/api/subscriptions", require("./routes/subscriptionroutes"));
app.use("/api/announcements", require("./routes/announcementroutes"));
app.use("/api/referrals", require("./routes/referralroutes"));
app.use("/api/shipping", require("./routes/shippingroutes"));
app.use("/api/payment", require("./routes/paymentroutes"));
app.use("/api/tracking", require("./routes/trackingroutes"));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create a default product image if it doesn't exist
const defaultProductImage = path.join(uploadsDir, "default-product.png");
if (!fs.existsSync(defaultProductImage)) {
  // You could create a simple placeholder image here if needed
  console.log("Note: Default product image doesn't exist yet");
}

const PORT = process.env.PORT || 5000;
const DB_PATH =
  process.env.MONGO_URI ||
  "mongodb+srv://root:root@completecoding.vasc6zg.mongodb.net/3Dprints?retryWrites=true&w=majority&appName=CompleteCoding";

// MongoDB Connection
mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
