const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true }, // HTML rich text từ frontend (đậm, nghiêng, căn giữa, emoji, etc.)
  date: { type: Date, default: Date.now }, // Ngày tạo, dùng để sort lịch sử
  emotions: [String], // Mảng cảm xúc, e.g., ['happy', 'anxious']
  tags: [String], // Mảng tags, e.g., ['#camxuc', '#tientrinh']
  media: [String], // Mảng URLs hình/video (local: /api/uploads/filename)
  isPrivate: { type: Boolean, default: true }, // Private hay share
});

module.exports = mongoose.model("Journal", journalSchema);
// Mô hình Journal cho nhật ký tâm trạng, cảm xúc, và trải nghiệm cá nhân
