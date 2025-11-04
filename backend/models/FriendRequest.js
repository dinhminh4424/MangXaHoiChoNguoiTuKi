const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
  {
    // Người gửi yêu cầu
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Người nhận yêu cầu
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Trạng thái yêu cầu
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },

    // Thời gian chấp nhận/từ chối/hủy
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
friendRequestSchema.index({ requester: 1, recipient: 1 });
friendRequestSchema.index({ recipient: 1, status: 1 });
friendRequestSchema.index({ requester: 1, status: 1 });

// Đảm bảo chỉ có một yêu cầu pending giữa hai user
friendRequestSchema.index(
  { requester: 1, recipient: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

module.exports = mongoose.model("FriendRequest", friendRequestSchema);

