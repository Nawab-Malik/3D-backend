const express = require("express");
const GalleryImage = require("../models/galleryimage");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
