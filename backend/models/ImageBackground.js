// models/Image.js
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    // Core fields for easy usage
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "BannerGroup",
        "AvartarGroup",
        "AvatarUser",
        "BannerUser",
        "Feed",
        "Journal",
        "Other",
      ],
      default: "Other",
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    // File information (grouped)
    file: {
      filename: {
        type: String,
        required: true,
      },
      originalName: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      mimetype: {
        type: String,
        required: true,
      },
      dimensions: {
        width: Number,
        height: Number,
      },
    },

    // Optional fields
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // System fields
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimized indexes for common queries
imageSchema.index({ category: 1, active: 1 });
imageSchema.index({ active: 1, createdAt: -1 });
imageSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("ImageBackground", imageSchema);
