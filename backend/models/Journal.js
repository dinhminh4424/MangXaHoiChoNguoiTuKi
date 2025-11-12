const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Nội dung là bắt buộc"],
    },
    // --- CÁC TRƯỜNG NÂNG CẤP ---
    moodRating: {
      type: Number,
      min: 0,
      max: 100,
      default: null, // Cho phép không đánh giá
    },
    moodTriggers: {
      type: [String], // Các yếu tố kích hoạt (ví dụ: "công việc", "gia đình", "bạn bè")
      default: [],
    },
    // --- CÁC TRƯỜNG HIỆN CÓ ---
    emotions: {
      type: [String], // Các cảm xúc cụ thể (ví dụ: "vui", "buồn", "lo lắng")
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    media: {
      type: [String],
      default: [],
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Index để tối ưu query thống kê
journalSchema.index({ userId: 1, date: -1 });

const Journal = mongoose.model("Journal", journalSchema);

module.exports = Journal;