const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const GalleryImage = require("../models/galleryimage");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === "Bearer admin123") {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
};

router.get("/", isAdmin, async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const { title } = req.body || {};
    if (!imageUrl) return res.status(400).json({ message: "Image is required" });

    const saved = await GalleryImage.create({ imageUrl, title: title || "" });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const current = await GalleryImage.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Not found" });

    const updateData = {};
    const { title } = req.body || {};
    if (typeof title !== "undefined") updateData.title = title;

    if (req.file) {
      if (current.imageUrl && !current.imageUrl.includes("default")) {
        const oldPath = path.join(__dirname, "..", current.imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await GalleryImage.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const img = await GalleryImage.findById(req.params.id);
    if (!img) return res.status(404).json({ message: "Not found" });

    if (img.imageUrl && !img.imageUrl.includes("default")) {
      const filePath = path.join(__dirname, "..", img.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await GalleryImage.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
