const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
// Mô hình Notification cho thông báo hệ thống, tin nhắn mới, nhắc nhở, etc.
// Các thông báo có thể được đánh dấu là đã đọc hoặc chưa đọc
