// routes/adminroutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/product");
const fs = require("fs");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save to uploads directory at root
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB limit
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size is too large. Maximum size is 10MB." });
    }
  }
  next(err);
};

// Admin authentication middleware
const isAdmin = (req, res, next) => {
  // Simple check for demo purposes
  const authHeader = req.headers.authorization;

  if (authHeader === "Bearer admin123") {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
};

// Get all products (for admin)
router.get("/products", isAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product
router.post(
  "/products",
  isAdmin,
  upload.single("image"),
  handleMulterError,
  async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      const { title, categories, description, price, originalPrice, hasVariations, variations } = req.body;

      if (!title || !price) {
        return res
          .status(400)
          .json({ message: "Title and price are required" });
      }

      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : "/uploads/default-product.png";

      const productData = {
        title,
        categories: categories
          ? categories.split(",").map((cat) => cat.trim())
          : [],
        description,
        price: parseFloat(price),
        originalPrice: originalPrice
          ? parseFloat(originalPrice)
          : parseFloat(price),
        imageUrl,
        hasVariations: hasVariations === 'true' || hasVariations === true,
      };

      // Parse and add variations if provided
      if (productData.hasVariations && variations) {
        try {
          const parsedVariations = typeof variations === 'string' 
            ? JSON.parse(variations) 
            : variations;
          productData.variations = parsedVariations;
          // Calculate total stock
          productData.totalStock = parsedVariations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        } catch (e) {
          console.error('Error parsing variations:', e);
          productData.variations = [];
        }
      }

      const product = new Product(productData);
      const savedProduct = await product.save();
      res.status(201).json(savedProduct);
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Update product
router.put(
  "/products/:id",
  isAdmin,
  upload.single("image"),
  handleMulterError,
  async (req, res) => {
    try {
      const { title, categories, description, price, originalPrice, hasVariations, variations } = req.body;

      // Get the current product to check if we need to delete the old image
      const currentProduct = await Product.findById(req.params.id);

      const updateData = {
        title,
        categories: categories
          ? categories.split(",").map((cat) => cat.trim())
          : [],
        description,
        price: parseFloat(price),
        originalPrice: originalPrice
          ? parseFloat(originalPrice)
          : parseFloat(price),
        hasVariations: hasVariations === 'true' || hasVariations === true,
      };

      // Parse and add variations if provided
      if (updateData.hasVariations && variations) {
        try {
          const parsedVariations = typeof variations === 'string' 
            ? JSON.parse(variations) 
            : variations;
          updateData.variations = parsedVariations;
          // Calculate total stock
          updateData.totalStock = parsedVariations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        } catch (e) {
          console.error('Error parsing variations:', e);
          updateData.variations = [];
        }
      } else {
        updateData.variations = [];
        updateData.totalStock = 0;
      }

      if (req.file) {
        // Delete the old image if it exists and is not the default
        if (
          currentProduct &&
          currentProduct.imageUrl &&
          !currentProduct.imageUrl.includes("default-product")
        ) {
          const oldImagePath = path.join(
            __dirname,
            "..",
            currentProduct.imageUrl
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete product
router.delete("/products/:id", isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete the associated image file if it exists
    if (product.imageUrl && !product.imageUrl.includes("default-product")) {
      const imagePath = path.join(__dirname, "..", product.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
