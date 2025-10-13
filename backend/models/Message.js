const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      // ID cuộc trò chuyện (thuộc về Chat)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    sender: {
      // Người gửi tin nhắn (thuộc về User)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "video", "audio"],
      default: "text",
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    isReadBy: [
      // Danh sách người dùng đã đọc tin nhắn
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedFor: [
      // Danh sách người dùng đã xóa tin nhắn
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    repliedTo: {
      // Tin nhắn được trả lời (nếu có)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

// QUAN TRỌNG: Index để tối ưu truy vấn phân trang
messageSchema.index({ chatId: 1, createdAt: -1 }); // Cho phân trang
messageSchema.index({ chatId: 1, deletedFor: 1, createdAt: -1 }); // Cho truy vấn có điều kiện
messageSchema.index({ sender: 1 }); // Tối ưu truy vấn theo người gửi

module.exports = mongoose.model("Message", messageSchema);
