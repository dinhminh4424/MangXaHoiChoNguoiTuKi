const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

//Hàm để lấy ngày bắt đầu của tuần (T2)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (CN) đến 6 (T7)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};
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
    //--- Các trường liên quan tới chuỗi ĐĂNG NHẬP ---
    // Số lần đã khôi phục chuỗi đăng nhập trong tuần
    weekly_checkIn_recovery_uses: {
      type: Number,
      default: 0,
    },
    // Ngày bắt đầu của tuần hiện tại (để reset số lần khôi phục chuỗi đăng nhập)
    last_checkIn_recovery_week_start: {
      type: Date,
      default: () => getStartOfWeek(new Date()),
    },
    // Cờ báo mất chuỗi đăng nhập
    has_lost_checkIn_streak: {
      type: Boolean,
      default: false,
    },

    //--- Các trường liên quan tới chuỗi VIẾT NHẬT KÝ ---
    weekly_journal_miss_uses: {
      type: Number,
      default: 0,
    },
    last_journal_miss_week_start: {
      type: Date,
      default: () => getStartOfWeek(new Date()),
    },
    has_lost_journal_streak: {
      type: Boolean,
      default: false,
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
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    violationCount: { type: Number, default: 0, index: true }, // số lần vi phạm
    lastViolationAt: { type: Date, default: null }, //
    active: { type: Boolean, default: true }, // Hoạt dộng

    warningCount: { type: Number, default: 0, index: true },

    // CÁC TRƯỜNG CHO RESET PASSWORD
    resetPasswordOTP: String,
    resetPasswordExpire: Date,

    // Thêm các trường mới
    deactivatedAt: Date, // ngày xoá
    deactivationReason: String, // lý do xoá

    // === TÍNH NĂNG STREAKS ===
    checkInStreak: { type: Number, default: 0 },
    lastCheckInDate: { type: Date },
    journalStreak: { type: Number, default: 0 },
    lastJournalDate: { type: Date },

    // Cài đặt privacy
    settings: {
      emailNotifications: { type: Boolean, default: true }, // thông báo email
      pushNotifications: { type: Boolean, default: true }, // thông báo web
      profileVisibility: {
        type: String,
        enum: ["public", "friends", "private"],
        default: "public",
      }, // ai đc xem profile
      showOnlineStatus: { type: Boolean, default: true }, // hiên thị trạng thái online
      allowFriendRequests: { type: Boolean, default: true }, // cho phép kết bạn
      allowMessages: {
        // ai có thể nhắn tin cho bạn
        type: String,
        enum: ["everyone", "friends", "none"],
        default: "everyone",
      },
    },

    // QR
    qrCode: {
      data: {
        type: String, // URL profile (vd: "https://example.com/profile/123")
        default: null,
      },
      dataURL: {
        // THÊM FIELD NÀY - QR code dạng base64
        type: String,
        default: null,
      },
      options: {
        type: Object, // Các tùy chọn tạo QR
        default: {
          width: 300,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
      },
      generatedAt: {
        // ĐỔI TÊN lastGenerated -> generatedAt
        type: Date,
        default: Date.now,
      },
      expiresAt: {
        // THÊM FIELD expiry
        type: Date,
        default: null,
      },
    },

    // LIÊN HỆ KHẨN CẤP
    // EMAIL LIÊN HỆ KHẨN CẤP
    emergencyContacts: [
      {
        email: {
          type: String,
          trim: true,
        },
        name: {
          type: String,
          trim: true,
        },
        relationship: {
          type: String,
          required: true,
          trim: true,
          enum: ["family", "friend", "spouse", "parent", "sibling", "other"], // ["gia đình", "bạn bè", "vợ/chồng", "cha mẹ", "anh chị em ruột", "khác"]
        },
        phone: {
          type: String,
          trim: true,
        },
        priority: {
          type: String,
          enum: ["high", "medium", "low"],
          default: "medium",
        },

        addedAt: {
          type: Date,
          default: Date.now,
        },
        lastNotified: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
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
