// models/UserInsight.js (QUAN TRỌNG NHẤT để AI "nhớ" và thấu cảm từng người)
const mongoose = require("mongoose");

const userInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // Tóm tắt tổng quan
  personalitySummary: String, // "Hay lo âu, thích lập kế hoạch chi tiết, sợ đám đông..."

  // Sensory profile
  sensoryTriggers: [String], // ["tiếng ồn lớn", "đèn huỳnh quang", "mùi nước hoa mạnh", "đông người"]
  sensorySoothers: [String], // ["âm nhạc lo-fi", "đeo headphone", "ôm gối nặng"]

  // Communication style
  preferredStyle: [String],

  // Chủ đề yêu thích / cần tránh
  favoriteTopics: [String],
  topicsToAvoid: [String],

  // Emotional patterns
  commonEmotions: [String], // ["lo âu", "quá tải cảm giác", "vui khi routine ổn định"]

  lastUpdated: { type: Date, default: Date.now },
});

userInsightSchema.index({ userId: 1 });
module.exports = mongoose.model("UserInsight", userInsightSchema);
