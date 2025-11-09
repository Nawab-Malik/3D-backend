const express = require("express");
const router = express.Router();
const {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementcontroller");

/**
 * Announcement Routes
 */

// Public routes
router.get("/active", getActiveAnnouncements);

// Admin routes (would need admin auth middleware in production)
router.get("/", getAllAnnouncements);
router.post("/", createAnnouncement);
router.put("/:id", updateAnnouncement);
router.patch("/:id/toggle", toggleAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;
