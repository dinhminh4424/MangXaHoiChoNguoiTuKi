const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    // Người theo dõi (follower)
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Người được theo dõi (following)
    following: {
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
followSchema.index({ follower: 1, following: 1 });
followSchema.index({ following: 1, follower: 1 });

// Đảm bảo mỗi cặp follow chỉ có một bản ghi
followSchema.index(
  { follower: 1, following: 1 },
  {
    unique: true,
  }
);

// Không cho phép tự follow chính mình
followSchema.pre("save", async function (next) {
  if (this.follower.toString() === this.following.toString()) {
    const error = new Error("Không thể theo dõi chính mình");
    return next(error);
  }
  next();
});

module.exports = mongoose.model("Follow", followSchema);

