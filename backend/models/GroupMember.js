const mongoose = require("mongoose");

const groupMemberSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["member", "moderator", "owner"],
      default: "member",
    },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "pending", "banned"], // hoạt dông, kiểm duyệt, bị cấm
      default: "active",
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model("GroupMember", groupMemberSchema);
