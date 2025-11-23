// models/AiConversation.js
const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi user chỉ có đúng 1 cuộc trò chuyện với AI
    },
    messages: [aiMessageSchema], // Lưu toàn bộ lịch sử
    lastMessageAt: { type: Date, default: Date.now },
    pinned: { type: Boolean, default: false }, // người dùng có ghim Ánh không
  },
  { timestamps: true }
);

aiConversationSchema.index({ userId: 1 });
module.exports = mongoose.model("AiConversation", aiConversationSchema);
