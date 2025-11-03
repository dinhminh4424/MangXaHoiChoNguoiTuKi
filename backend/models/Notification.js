const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận thông báo
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Người gửi thông báo (có thể là hệ thống, admin, hoặc user khác)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Loại thông báo
    type: {
      type: String,
      required: true,
      enum: [
        // Hệ thống báo cáo
        "REPORT_CREATED", // Có báo cáo mới
        "REPORT_RESOLVED", // Báo cáo đã xử lý
        "REPORT_REJECTED", // Báo cáo bị từ chối
        "POST_BLOCKED", // Bài viết bị chặn
        "POST_COMMENT_BLOCKED", // Bài viết bị khoá bình luận
        "COMMENT_BLOCKED", //  Khoá bình luận
        "USER_BANNED", // User bị ban
        "USER_WARNED", // User bị cảnh báo

        // Bài viết và tương tác
        "POST_LIKED", // Bài viết được like
        "POST_COMMENTED", // Có comment mới
        "COMMENT_LIKED", // Comment được like
        "COMMENT_REPLIED", // Có reply comment

        // Tin nhắn và chat
        "NEW_MESSAGE", // Tin nhắn mới
        "GROUP_INVITE", // Lời mời vào nhóm
        "CHAT_REQUEST", // Yêu cầu chat

        // Hệ thống và admin
        "SYSTEM_ANNOUNCEMENT", // Thông báo hệ thống
        "ADMIN_ALERT", // Cảnh báo admin
        "MAINTENANCE_NOTICE", // Thông báo bảo trì
        "FEATURE_UPDATE", // Cập nhật tính năng

        // Bảo mật
        "SECURITY_ALERT", // Cảnh báo bảo mật
        "LOGIN_ATTEMPT", // Đăng nhập mới
        "PASSWORD_CHANGED", // Mật khẩu thay đổi
        "EMAIL_VERIFIED", // Email đã xác thực

        // Hỗ trợ
        "SUPPORT_TICKET_CREATED", // Ticket hỗ trợ được tạo
        "SUPPORT_TICKET_UPDATED", // Ticket hỗ trợ được cập nhật
        "SUPPORT_TICKET_RESOLVED", // Ticket hỗ trợ đã giải quyết
      ],
    },

    // Tiêu đề thông báo
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    // Nội dung thông báo
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Dữ liệu bổ sung (lưu trữ thông tin liên quan)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Trạng thái đọc
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },

    // Mức độ ưu tiên
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    url: {
      type: String,
      default: "",
    },

    // Ảnh hoặc icon
    image: {
      url: { type: String, default: null },
      alt: { type: String, default: "Notification" },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
