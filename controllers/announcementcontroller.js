const Announcement = require("../models/announcement");

/**
 * Announcement Controller
 * Manages site-wide announcements
 */

// Get active announcements for frontend
exports.getActiveAnnouncements = async (req, res) => {
  try {
    const { page } = req.query;
    const announcements = await Announcement.getActiveAnnouncements(page);

    res.json(announcements);
  } catch (error) {
    console.error("Get active announcements error:", error);
    res.status(500).json({ message: "Error fetching announcements", error: error.message });
  }
};

// Get all announcements (Admin)
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ priority: -1, createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({ message: "Error fetching announcements", error: error.message });
  }
};

// Create announcement (Admin)
exports.createAnnouncement = async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      createdBy: req.user?.id,
    };

    const announcement = new Announcement(announcementData);
    await announcement.save();

    res.status(201).json({
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ message: "Error creating announcement", error: error.message });
  }
};

// Update announcement (Admin)
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ message: "Error updating announcement", error: error.message });
  }
};

// Toggle announcement active status (Admin)
exports.toggleAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.json({
      message: `Announcement ${announcement.isActive ? "activated" : "deactivated"} successfully`,
      announcement,
    });
  } catch (error) {
    console.error("Toggle announcement error:", error);
    res.status(500).json({ message: "Error toggling announcement", error: error.message });
  }
};

// Delete announcement (Admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ message: "Error deleting announcement", error: error.message });
  }
};
