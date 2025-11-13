const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema(
  {
    // Kiểu đối tượng bị vi phạm (Post, Comment, User, Message, ...)
    targetType: {
      type: String,
      enum: ["Post", "Comment", "User", "Message", "Group", "Other"],
      required: true,
    },
    // ID của đối tượng (bài viết, bình luận, người dùng, ...)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // ref động: tùy vào targetType sẽ populate đúng model
    },
    // Ai là người vi phạm (nếu có)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Ai báo cáo (người dùng khác hoặc mod)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // lý do
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    // trạng thái
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected", "auto"], // ["đang chờ xử lý", "đã xem xét", "đã phê duyệt", "bị từ chối", "tự động"],
      default: "pending",
    },
    // hành động đã thực hiện
    actionTaken: {
      type: String,
      enum: [
        "none",
        "warning",
        "block_post",
        "block_comment",
        "ban_user",
        "auto_blocked",
        "auto_warned",
        "auto_baned",
      ], // ["không có", "cảnh báo", "chặn bài đăng","chặn bình luận", "cấm người dùng", "cấm tự động",],
      default: "none",
    },
    // ghi chú
    notes: String,
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
    //người xử lý
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // admin/mod xử lý
    },

    // Thông tin kháng cáo
    appeal: {
      isAppealed: {
        // check kháng cáo
        type: Boolean,
        default: false,
      },
      appealReason: {
        // lý do kháng cáo
        type: String,
        trim: true,
      },
      appealAt: {
        type: Date,
      },
      appealStatus: {
        // trạng thái kháng cáo
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled"],
        default: "pending",
      },
      appealReviewedBy: {
        type: mongoose.Schema.Types.ObjectId, // dc sử lý bởi
        ref: "User",
        default: null,
      },
      appealReviewedAt: {
        type: Date, // ngày sử lý
      },
      appealNotes: {
        type: String, // ghi chú kháng cáo
        trim: true,
      },
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
    },
    reviewedAt: Date,
  },
  { timestamps: true }
);

violationSchema.index({ targetType: 1, targetId: 1 });
violationSchema.index({ userId: 1 });
violationSchema.index({ status: 1 });

module.exports = mongoose.model("Violation", violationSchema);
