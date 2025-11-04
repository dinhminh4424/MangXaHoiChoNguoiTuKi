const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema(
  {
    // User A
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User B
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
friendSchema.index({ userA: 1, userB: 1 });
friendSchema.index({ userB: 1, userA: 1 });

// Đảm bảo mỗi cặp bạn bè chỉ có một bản ghi
friendSchema.index(
  { userA: 1, userB: 1 },
  {
    unique: true,
  }
);

// Đảm bảo userA luôn nhỏ hơn userB để tránh duplicate
friendSchema.pre("save", async function (next) {
  if (this.userA.toString() > this.userB.toString()) {
    [this.userA, this.userB] = [this.userB, this.userA];
  }
  next();
});

module.exports = mongoose.model("Friend", friendSchema);

