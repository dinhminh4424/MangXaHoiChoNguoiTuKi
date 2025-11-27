const mongoose = require("mongoose");

const AppealSchema = new mongoose.Schema(
  {
    email: { type: String },
    reason: {
      type: String,
      default: "Bị khoá tài khoản",
    },
    phone: { type: String },
    name: { type: String },
    message: { type: String },
    files: [
      // mảng file đính kèm (nếu có)
      {
        type: {
          type: String,
          enum: ["text", "image", "file", "video", "audio"],
        },
        fileUrl: String,
        fileName: String,
        fileSize: Number,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "rejected"], // ["đang chờ xử lý", "đang xem xét", "đã giải quyết", "đã từ chối"]
      default: "pending",
    },
    adminNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appeal", AppealSchema);
