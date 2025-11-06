const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    members: [
      // Danh sách thành viên trong cuộc trò chuyện N - user
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    name: String,
    description: String,
    avatar: String,
    createdBy: {
      // Người tạo nhóm
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admins: [
      {
        // Danh sách quản trị viên nhóm
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      // Tin nhắn cuối cùng trong cuộc trò chuyện
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

// Index để tối ưu truy vấn
chatSchema.index({ members: 1 }); // Tối ưu truy vấn theo thành viên
chatSchema.index({ isGroup: 1, createdAt: -1 }); // Tối ưu truy vấn nhóm theo thời gian tạo

chatSchema.index({
  members: 1,
  isGroup: 1,
});

// THÊM INDEX QUAN TRỌNG - sửa lỗi tạo 2 conversation
chatSchema.index(
  {
    members: 1,
    isGroup: 1,
  },
  {
    unique: false,
  }
);

// Index đặc biệt cho chat 1-1 - đảm bảo không trùng
chatSchema.index(
  {
    members: 1,
    isGroup: 1,
  },
  {
    unique: false,
    partialFilterExpression: { isGroup: false },
  }
);
module.exports = mongoose.model("Chat", chatSchema);
