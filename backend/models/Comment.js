const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    parentCommentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: [
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
          type: String,
          enum: ["like", "love", "haha", "sad", "angry", "wow"],
          default: "like",
        },
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    file: {
      type: {
        type: String,
        enum: ["text", "image", "file", "video", "audio"],
      },
      fileUrl: String,
      fileName: String,
      fileSize: Number,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
// QUAN TRỌNG: Index để tối ưu truy vấn phân trang
commentSchema.index({ postID: 1, createdAt: -1 }); // Cho phân trang
commentSchema.index({ postID: 1, isBlocked: 1, createdAt: -1 }); // Cho truy vấn có điều kiện
commentSchema.index({ userID: 1 }); // Tối ưu truy vấn theo người dùng

module.exports = mongoose.model("Comment", commentSchema);
