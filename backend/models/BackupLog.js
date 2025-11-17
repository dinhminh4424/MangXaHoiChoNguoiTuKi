// models/BackupLog.js
const mongoose = require("mongoose");

const backupLogSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    type: {
      type: String,
      enum: ["database", "system", "full"],
      required: true,
    },
    action: {
      type: String,
      enum: ["backup", "restore", "download", "delete"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "in_progress"],
      default: "in_progress",
    },
    progress: { type: Number, default: 0 }, // Thêm progress cho restore
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BackupLog", backupLogSchema);
