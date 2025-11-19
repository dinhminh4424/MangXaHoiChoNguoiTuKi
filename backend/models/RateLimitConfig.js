// models/RateLimitConfig.js
const mongoose = require("mongoose");

const RateLimitConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: true,
    // enum: ["postCreation", "search", "report", "login", "comment", "upload", "global"]
  },
  name: { type: String, required: true }, // Tên hiển thị
  description: String, // Mô tả
  windowMs: { type: Number, required: true }, // Thời gian (ms)
  max: { type: Number, required: true }, // Số lần tối đa
  enabled: { type: Boolean, default: true }, // Bật/tắt
  skipRoles: [{ type: String, enum: ["admin", "supporter", "doctor"] }], // Roles được bỏ qua
  customMessage: String, // Message tùy chỉnh
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin cập nhật
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Index để tìm kiếm nhanh
RateLimitConfigSchema.index({ key: 1 });
RateLimitConfigSchema.index({ enabled: 1 });

module.exports = mongoose.model("RateLimitConfig", RateLimitConfigSchema);
