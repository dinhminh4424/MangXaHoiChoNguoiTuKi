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
      required: false,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
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

      // cccd
      idCard: {
        number: String,
        fullName: String,
        dob: String,
        address: String,
        issueDate: String,
        expiryDate: String,
        frontImage: String, // URL ảnh mặt trước
        selfieImage: String, // ảnh selfie dùng để đăng nhập
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
      },

      // LƯU DESCRIPTOR KHUÔN MẶT (128 số)
      faceDescriptor: {
        type: [Number],
        default: null,
        validate: {
          validator: function (v) {
            // Cho phép null hoặc undefined
            if (!Array.isArray(v)) return !v;
            return v.length === 128;
          },
          message: "Face descriptor phải có đúng 128 giá trị",
        },
      },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép nhiều document có giá trị null/undefined, nhưng phải unique nếu có giá trị
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true, // Tương tự googleId
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
  // UPDATED: Chỉ hash nếu password tồn tại và bị thay đổi
  // (Ngăn lỗi khi user social login (không có pass) được lưu)
  if (!this.password || !this.isModified("password")) {
    return next();
  }

  // Kiểm tra xem password có phải là chuỗi rỗng không (phòng trường hợp)
  if (this.password && this.password.length > 0) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // UPDATED: Nếu user không có password (vd: social login), luôn trả về false
  if (!this.password) {
    return false;
  }
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
