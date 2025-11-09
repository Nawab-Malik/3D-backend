const express = require("express");
const Feedback = require("../models/feedback");
const auth = require("../controllers/authcontroller");
const crypto = require("crypto");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Only customers can submit feedback" });
    }
    const { message, rating, email } = req.body || {};
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Feedback message is required" });
    }
    const submittedEmail = String(email || "").trim().toLowerCase();
    if (!submittedEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const userEmail = String(req.user.email || "").trim().toLowerCase();
    if (userEmail && submittedEmail !== userEmail) {
      return res.status(400).json({ success: false, message: "Email must match your account email" });
    }
    const doc = await Feedback.create({
      user: req.user._id,
      message: message.trim(),
      rating: typeof rating !== "undefined" ? Number(rating) : undefined,
      email: submittedEmail,
    });
    res.status(201).json({ success: true, feedback: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin privileges required" });
    }
    const result = await Feedback.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ success: false, message: "Not found" });

    const isAdmin = req.user && req.user.role === "admin";
    const isOwner = req.user && String(fb.user) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this feedback" });
    }

    await Feedback.deleteOne({ _id: fb._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const list = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name email");

    const withAvatars = list.map((f) => {
      const email = String(f.email || "").trim().toLowerCase();
      let avatarUrl = null;
      if (email) {
        const hash = crypto.createHash("md5").update(email).digest("hex");
        avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=96`;
      }
      return {
        _id: f._id,
        message: f.message,
        rating: f.rating,
        email: f.email,
        user: f.user,
        createdAt: f.createdAt,
        avatarUrl,
      };
    });

    res.json({ success: true, feedback: withAvatars });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
