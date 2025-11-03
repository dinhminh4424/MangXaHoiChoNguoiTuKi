const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userCreateID: {
      // người tạo bài viết (thuộc về User)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
      index: true,
      required: false,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    likes: [
      // người thích (thuộc về User)
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        emotion: {
          type: String, // e.g., 'like', 'love', 'haha', 'sad', etc.
          enum: ["like", "love", "haha", "sad", "angry", "wow"],
          default: "like",
        },
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    editedAt: Date,
    content: {
      // nội dung bài viết
      type: String,
      trim: true,
      default: "",
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
    privacy: {
      // trạng thái bài viết: công khai, riêng tư, bạn bè
      type: String,
      enum: ["public", "private", "friends"],
      default: "private",
    },
    isAnonymous: {
      // ẩn danh
      type: Boolean,
      default: false,
    },
    violationCount: { type: Number, default: 0 }, // đém lỗi
    isBlocked: {
      // bài viết bị ẩn do vi phạm
      type: Boolean,
      default: false,
    },
    isBlockedComment: {
      // bài viết bị ẩn do vi phạm
      type: Boolean,
      default: false,
    },
    emotions: [String], // Mảng cảm xúc, e.g., ['happy', 'anxious']
    tags: [String], // Mảng tags, e.g., ['#camxuc', '#tientrinh']

    isDeletedByUser: {
      // Bài viết bị xóa bởi người dùng
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// QUAN TRỌNG: Index để tối ưu truy vấn phân trang
postSchema.index({ userCreateID: 1, createdAt: -1 }); // Cho phân trang
postSchema.index({ userCreateID: 1, createdAt: -1, status: 1 }); // Cho truy vấn có điều kiện
postSchema.index({ emotions: 1 }); // Tối ưu truy vấn theo cảm xúc
postSchema.index({ tags: 1 }); // Tối ưu truy vấn theo tags

// Cập nhật lại likeCount khi có thay đổi trong mảng likes (MIDDLEWARE) => chạy trước khi lưu
postSchema.pre("save", function (next) {
  if (this.isModified("likes")) {
    this.likeCount = this.likes.length;
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
