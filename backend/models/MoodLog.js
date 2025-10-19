// models/MoodLog.js
const mongoose = require("mongoose");

const moodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    emotion: {
      type: String,
      required: true,
      enum: [
        "happy",
        "sad",
        "angry",
        "surprised",
        "fearful",
        "disgusted",
        "neutral",
      ],
    },
    intensity: {
      type: Number,
      required: true,
      min: 0.1,
      max: 1,
    },
    description: String,
    detectedFrom: {
      type: String,
      enum: ["camera", "manual", "image"],
      default: "manual",
    },
    imageData: String,
    tags: [String],
    activities: [String],
    note: String,
    isShared: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

moodLogSchema.index({ userId: 1, createdAt: -1 });
moodLogSchema.index({ emotion: 1, createdAt: -1 });

module.exports = mongoose.model("MoodLog", moodLogSchema);
