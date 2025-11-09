const mongoose = require("mongoose");

/**
 * Announcement Model
 * Site-wide announcement bar configuration
 */
const announcementSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["info", "success", "warning", "danger", "promo"],
            default: "info",
        },
        backgroundColor: {
            type: String,
            default: "#000000",
        },
        textColor: {
            type: String,
            default: "#ffffff",
        },
        link: {
            url: { type: String, trim: true },
            text: { type: String, trim: true },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDismissible: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        priority: {
            type: Number,
            default: 0, // Higher priority announcements shown first
        },
        targetPages: {
            type: [String], // Empty means all pages.
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Indexing for performance
announcementSchema.index({ isActive: 1, priority: -1 });
announcementSchema.index({ startDate: 1, endDate: 1 });

// Method to check if announcement is currently active (Optional, good for local logic)
announcementSchema.methods.isCurrentlyActive = function () {
    if (!this.isActive) return false;

    const now = new Date();
    
    if (this.startDate && now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;

    return true;
};

// 🚀 CORRECTED Static method to get active announcements (Frontend API ke liye zaroori)
announcementSchema.statics.getActiveAnnouncements = async function (page = null) {
    const now = new Date();
    
    // 1. Base Active Status
    const baseConditions = { isActive: true };

    // 2. Date Range Conditions (Check for valid date range OR if date field doesn't exist)
    const dateConditions = {
        $and: [
            // Start Date <= Now OR Start Date not set (exists: false)
            { $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }] },
            // End Date >= Now OR End Date not set (exists: false)
            { $or: [{ endDate: { $gte: now } }, { endDate: { $exists: false } }] }
        ]
    };
    
    // 3. Target Page Conditions
    let targetPageConditions;

    if (page && typeof page === 'string') {
        // If 'page' is provided, targetPages must be empty OR contain the current page string
        targetPageConditions = {
            $or: [
                { targetPages: { $size: 0 } }, // Target is all pages (empty array)
                { targetPages: page },          // Target includes the specific page string
            ],
        };
    } else {
        // If no valid page is specified, only fetch announcements targeted to ALL pages
        targetPageConditions = { targetPages: { $size: 0 } };
    }

    // Combine ALL conditions using $and for accurate filtering
    const finalQuery = {
        $and: [
            baseConditions,
            dateConditions,
            targetPageConditions
        ]
    };

    // Execute the query: Sort by Priority (highest first) and return only the top 1
    return this.find(finalQuery)
        .sort({ priority: -1, createdAt: -1 })
        .limit(1);
};

module.exports = mongoose.model("Announcement", announcementSchema);