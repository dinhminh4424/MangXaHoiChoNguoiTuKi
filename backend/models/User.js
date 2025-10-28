const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "supporter", "admin", "doctor"],
      default: "user",
    },
    profile: {
      bio: String,
      interests: [String],
      avatar: String,
      location: String,
      skills: [String],
      coverPhoto: { type: String, default: "" }, // Thêm field coverPhoto
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    violationCount: { type: Number, default: 0, index: true }, // số lần vi phạm
    lastViolationAt: { type: Date, default: null }, //
    active: { type: Boolean, default: true }, // Hoạt dộng

    // CÁC TRƯỜNG CHO RESET PASSWORD
    resetPasswordOTP: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Tạo OTP reset password (6 số)
userSchema.methods.generateResetPasswordOTP = function () {
  // Tạo OTP 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  this.resetPasswordOTP = otp;
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp;
};

// Xác minh OTP
userSchema.methods.verifyResetPasswordOTP = function (otp) {
  return this.resetPasswordOTP === otp && this.resetPasswordExpire > Date.now();
};

//  tự động xóa OTP hết hạn
userSchema.pre("save", function (next) {
  // Nếu OTP tồn tại và đã hết hạn, tự động xóa
  if (
    this.resetPasswordOTP &&
    this.resetPasswordExpire &&
    this.resetPasswordExpire < Date.now()
  ) {
    this.resetPasswordOTP = undefined;
    this.resetPasswordExpire = undefined;
  }
  next();
});

//  method  kiểm tra và xóa OTP hết hạn
userSchema.methods.cleanExpiredOTP = async function () {
  if (this.resetPasswordExpire && this.resetPasswordExpire < Date.now()) {
    this.resetPasswordOTP = undefined;
    this.resetPasswordExpire = undefined;
    await this.save();
  }
};

module.exports = mongoose.model("User", userSchema);
