// Khai Báo
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Ví dụ dùng bcrypt để so sánh mật khẩu
const User = require("../models/User");
const mailService = require("../services/mailService");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const router = express.Router();
const {
  normalizeBaseUsername,
  generateUniqueUsernameFrom,
} = require("../utils/username");
const { logUserActivity } = require("../logging/userActivityLogger");

// Tạo token JWT với (userId) và thời gian hết hạn
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "autism_support_secret",
    {
      expiresIn: "7d",
    }
  );
};

//Hàm để lấy ngày bắt đầu của tuần (T2)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh khi ngày là Chủ Nhật
  return new Date(d.setDate(diff));
};
/**
 * Kiểm tra xem một chuỗi ngày có đạt mốc quan trọng không.
 * @param {number} streak - Số ngày trong chuỗi.
 * @returns {boolean} - True nếu là cột mốc, ngược lại là false.
 */
const isMilestone = (streak) => {
  const milestones = [1, 3, 7, 10, 30, 50, 100, 200, 365, 500, 1000];
  return milestones.includes(streak);
};

/**
 * Xử lý logic tính toán và cập nhật chuỗi ngày điểm danh cho người dùng.
 * @param {object} user - Đối tượng user từ Mongoose.
 * @returns {{milestone: object|null, alreadyCheckedIn: boolean}} - Trả về thông tin cột mốc và trạng thái đã điểm danh.
 */
const handleCheckInStreak = (user) => {
  // Lấy thời gian hiện tại theo múi giờ của server
  const now = new Date();
  // Chuẩn hóa 'hôm nay' về 00:00:00 để so sánh ngày
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let milestoneReached = null;

  const lastCheckIn = user.lastCheckInDate
    ? new Date(user.lastCheckInDate)
    : null;

  // Nếu chưa từng điểm danh
  if (lastCheckIn) {
    // Chuẩn hóa ngày điểm danh cuối cùng về 00:00:00 để so sánh
    const lastCheckInDay = new Date(
      lastCheckIn.getFullYear(),
      lastCheckIn.getMonth(),
      lastCheckIn.getDate()
    );

    // *** FIX: Nếu người dùng bị mất chuỗi, không cho điểm danh ***
    if (user.has_lost_streak) {
      // Trả về một trạng thái đặc biệt để frontend xử lý
      return { milestone: null, alreadyCheckedIn: false, streakLost: true };
    }

    // 1. Kiểm tra xem đã điểm danh hôm nay chưa
    if (lastCheckInDay.getTime() === today.getTime()) {
      return { milestone: null, alreadyCheckedIn: true, streakLost: false };
    }

    // 2. Kiểm tra xem có điểm danh vào ngày hôm qua không
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastCheckInDay.getTime() === yesterday.getTime()) {
      // Điểm danh liên tiếp -> tăng chuỗi
      user.checkInStreak = (user.checkInStreak || 0) + 1;
    } else {
      // Bỏ lỡ ít nhất một ngày -> reset chuỗi về 1
      user.checkInStreak = 1;
    }
  } else {
    // Lần điểm danh đầu tiên
    user.checkInStreak = 1;
  }

  // Kiểm tra cột mốc sau khi cập nhật chuỗi (trước khi lưu vào DB)
  if (isMilestone(user.checkInStreak)) {
    milestoneReached = { type: "check-in", days: user.checkInStreak };
  }

  user.lastCheckInDate = now;

  return {
    milestone: milestoneReached,
    alreadyCheckedIn: false,
    streakLost: false,
  };
};

// Middleware xác thực
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "autism_support_secret"
    );
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

// Đăng ký - LƯU LUÔN VÀ GỬI EMAIL CHÀO MỪNG
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Chuẩn hóa username đầu vào (loại bỏ dấu/khoảng trắng/ký tự đặc biệt)
    const normalizedUsernameBase = normalizeBaseUsername(
      username || fullName || (email ? email.split("@")[0] : "user")
    );
    const normalizedUsername = await generateUniqueUsernameFrom(
      normalizedUsernameBase
    );

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã tồn tại",
      });
    }

    // Tạo user mới - LƯU LUÔN VÀO DATABASE
    const user = new User({
      username: normalizedUsername,
      email,
      password,
      fullName,
      role: role || "user",
    });

    user.active = true;
    user.lastLogin = new Date();

    await user.save();

    // GỬI EMAIL CHÀO MỪNG ĐĂNG KÝ THÀNH CÔNG
    const emailResult = await mailService.sendEmail({
      to: user.email,
      subject: "🎉 Đăng ký thành công - Chào mừng đến với Autism Support!",
      templateName: "REGISTRATION_SUCCESS",
      templateData: {
        name: user.fullName || user.username,
        username: user.username,
        email: user.email,
        registrationTime: new Date().toLocaleString("vi-VN"),
        loginLink: `${process.env.FRONTEND_URL}/login`,
      },
    });

    // Tạo token
    const token = generateToken(user._id);

    const responsePayload = {
      success: true,
      message: "Đăng ký thành công!",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          checkInStreak: user.checkInStreak,
          journalStreak: user.journalStreak,
        },
        milestone: null, // Không còn milestone khi đăng ký
        token,
        emailSent: emailResult.success,
      },
    };

    res.status(201);
    logUserActivity({
      action: "auth.register",
      req,
      res,
      userId: user._id.toString(),
      role: user.role,
      target: { type: "user", id: user._id.toString() },
      description: "Người dùng đăng ký tài khoản",
      payload: {
        email: user.email,
        username: user.username,
      },
      meta: {
        emailSent: emailResult.success,
      },
    });

    return res.json(responsePayload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Yêu cầu OTP reset password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("");
    const user = await User.findOne({ email });
    if (!user) {
      // Không cho biết email có tồn tại hay không (bảo mật)
      return res.json({
        success: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi mã OTP",
      });
    }

    // Tạo OTP reset password
    const otp = user.generateResetPasswordOTP();
    await user.save();

    // Gửi email OTP
    const emailResult = await mailService.sendEmail({
      to: user.email,
      subject: "Mã OTP đặt lại mật khẩu - Autism Support",
      templateName: "PASSWORD_RESET_OTP",
      templateData: {
        name: user.fullName || user.username,
        otp: otp,
        expiryTime: "10 phút",
      },
    });

    res.json({
      success: true,
      message: "Đã gửi mã OTP đến email của bạn",
      emailSent: emailResult.success,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Xác minh OTP và reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin: email, OTP hoặc mật khẩu mới",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Thông tin không hợp lệ",
      });
    }

    // Xác minh OTP
    if (!user.verifyResetPasswordOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Gửi email xác nhận reset thành công
    await mailService.sendEmail({
      to: user.email,
      subject: "Mật khẩu đã được đặt lại thành công - Autism Support",
      templateName: "PASSWORD_RESET_SUCCESS",
      templateData: {
        name: user.fullName || user.username,
        resetTime: new Date().toLocaleString("vi-VN"),
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        loginLink: `${process.env.FRONTEND_URL}/login`,
        supportEmail: process.env.EMAIL_USER,
      },
    });

    res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Đăng nhập - GIỮ NGUYÊN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("================================ req.body: ", req.body);

    // Tìm user bằng email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra hoạt động
    if (user.active == false) {
      return res.status(401).json({
        success: false,
        message: "Tài Khoản Đã Bị Khoá",
      });
    }

    // === LOGIC KHÔI PHỤC CHUỖI KHI LOGIN ===
    // Kiểm tra và reset số lần khôi phục hàng tuần
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Nếu tuần khôi phục cuối đã cũ (trước thứ 2 của tuần này), reset lại
    if (
      !user.last_recovery_week_start ||
      user.last_recovery_week_start < currentWeekStart
    ) {
      user.weekly_recovery_uses = 0;
      user.last_recovery_week_start = currentWeekStart;
    }
    // Cập nhật trạng thái online
    user.isOnline = true;
    user.lastLogin = new Date();
    await user.save();

    // Tạo token
    const token = generateToken(user._id);

    const responsePayload = {
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profile: user.profile,
          checkInStreak: user.checkInStreak,
          journalStreak: user.journalStreak,
          // Thông tin khôi phục chuỗi
          hasLostStreak: user.has_lost_streak,
          canRestore: (user.weekly_recovery_uses || 0) < 2,
          streakToRestore: user.checkInStreak, // Gửi chuỗi cũ để hiển thị
        },
        milestone: null, // Không còn milestone khi đăng nhập
        token,
      },
    };

    res.status(200);
    logUserActivity({
      action: "auth.login",
      req,
      res,
      userId: user._id.toString(),
      role: user.role,
      target: { type: "user", id: user._id.toString() },
      description: "Người dùng đăng nhập",
      payload: {
        email,
        userId: user._id.toString(),
      },
    });

    return res.json(responsePayload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// ĐIỂM DANH HÀNG NGÀY
router.post("/check-in", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Gọi hàm xử lý chuỗi điểm danh
    const { milestone, alreadyCheckedIn, streakLost } =
      handleCheckInStreak(user);

    if (alreadyCheckedIn) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã điểm danh hôm nay rồi!",
        data: {
          checkInStreak: user.checkInStreak,
        },
      });
    }

    if (streakLost) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn đã mất chuỗi! Vui lòng khôi phục hoặc bỏ qua để tiếp tục.",
        data: {
          checkInStreak: user.checkInStreak,
        },
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Điểm danh thành công!",
      data: {
        checkInStreak: user.checkInStreak,
        milestone: milestone,
      },
    });
  } catch (error) {
    console.error("Lỗi khi điểm danh:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// === API KHÔI PHỤC VÀ BỎ QUA CHUỖI ===

// API khôi phục chuỗi
router.post("/streaks/restore", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // 1. Kiểm tra điều kiện khôi phục
    if (!user.has_lost_streak) {
      return res.status(400).json({ message: "Chuỗi của bạn không bị mất." });
    }
    if (user.weekly_recovery_uses >= 2) {
      return res
        .status(403)
        .json({ message: "Bạn đã hết lượt khôi phục chuỗi trong tuần này." });
    }

    // 2. Thực hiện khôi phục
    user.has_lost_streak = false; // Tắt cờ báo mất chuỗi
    user.weekly_recovery_uses += 1; // Tăng số lần đã sử dụng

    // Tăng chuỗi và cập nhật ngày điểm danh thành hôm nay
    user.checkInStreak += 1;
    user.lastCheckInDate = new Date();

    await user.save();

    const milestone = isMilestone(user.checkInStreak)
      ? { type: "check-in", days: user.checkInStreak }
      : null;

    // 3. Trả về trạng thái mới
    res.json({
      success: true,
      message: "Khôi phục chuỗi thành công!",
      data: {
        currentStreak: user.checkInStreak,
        weeklyRecoveryUses: user.weekly_recovery_uses,
        milestone: milestone,
      },
    });
  } catch (error) {
    console.error("Lỗi khi khôi phục chuỗi:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// API từ chối khôi phục (reset chuỗi)
router.post("/streaks/dismiss", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (user.has_lost_streak) {
      // Reset chuỗi về 1 và coi như đã điểm danh hôm nay
      user.checkInStreak = 1;
      user.has_lost_streak = false;
      user.lastCheckInDate = new Date();

      await user.save();
    }

    res.json({
      success: true,
      message: "Chuỗi đã được reset về 0.",
    });
  } catch (error) {
    console.error("Lỗi khi từ chối khôi phục chuỗi:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// LẤY THÔNG TIN USER HIỆN TẠI (ME)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    // Logic kiểm tra và reset lượt khôi phục hàng tuần
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    currentWeekStart.setHours(0, 0, 0, 0);

    if (
      !user.last_recovery_week_start ||
      user.last_recovery_week_start < currentWeekStart
    ) {
      user.weekly_recovery_uses = 0;
      user.last_recovery_week_start = currentWeekStart;
      await user.save();
    }

    // Trả về dữ liệu user đầy đủ, bao gồm cả thông tin khôi phục
    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          canRestore: (user.weekly_recovery_uses || 0) < 2,
          streakToRestore: user.checkInStreak,
          id: user._id, // địt mẹ sửa phải nhìn nào có sải, sửa lỗi hệ thống
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
});

// Đăng xuất - GIỮ NGUYÊN
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
      userId,
      { $set: { isOnline: false, lastSeen: Date.now() } },
      { new: true }
    );

    const responsePayload = {
      success: true,
      message: "Đăng xuất thành công",
      data: null,
    };

    res.status(200);
    logUserActivity({
      action: "auth.logout",
      req,
      res,
      userId: userId.toString(),
      role: req.user?.role,
      target: { type: "user", id: userId.toString() },
      description: "Người dùng đăng xuất",
    });

    return res.json(responsePayload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// LẤY DANH SÁCH USER CÓ KHUÔN MẶT (cho login)
router.get("/face-users", async (req, res) => {
  try {
    const users = await User.find({
      "profile.idCard.verified": true,
      "profile.faceDescriptor": { $exists: true, $ne: null },
    }).select("username profile.faceDescriptor");

    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ĐĂNG NHẬP BẰNG KHUÔN MẶT
// router.post("/face-login", async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const user = await User.findById(userId);

//     if (!user || !user.profile.idCard?.verified) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Tài khoản chưa xác minh khuôn mặt" });
//     }

//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || "autism_support_secret",
//       { expiresIn: "7d" }
//     );

//     // Cập nhật trạng thái online
//     user.isOnline = true;
//     await user.save();

//     const responsePayload = {
//       success: true,
//       message: "Đăng nhập bằng khuôn mặt thành công",
//       data: {
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           fullName: user.fullName,
//           role: user.role,
//           profile: user.profile,
//           checkInStreak: user.checkInStreak,
//           journalStreak: user.journalStreak,
//         },
//         token,
//       },
//     };

//     res.status(200);
//     logUserActivity({
//       action: "auth.face_login",
//       req,
//       res,
//       userId: user._id.toString(),
//       role: user.role,
//       target: { type: "user", id: user._id.toString() },
//       description: "Người dùng đăng nhập bằng khuôn mặt",
//     });

//     return res.json(responsePayload); // Sửa: trả về responsePayload thay vì { success: true, token }
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Lỗi server" });
//   }
// });

// ĐĂNG NHẬP BẰNG KHUÔN MẶT
router.post("/face-login", async (req, res) => {
  try {
    const { userId } = req.body;

    console.log("userId:  ===========", userId);

    if (!userId) {
      console.log("Thiếu userId: ", userId);
      return res.status(400).json({
        success: false,
        message: "Thiếu userId",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log("Người dùng không tồn tại: ", userId);
      return res.status(400).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    if (!user.profile?.idCard?.verified || !user.profile?.faceDescriptor) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản chưa xác minh khuôn mặt",
      });
    }

    // Kiểm tra hoạt động
    if (user.active == false) {
      return res.status(401).json({
        success: false,
        message: "Tài Khoản Đã Bị Khoá",
      });
    }

    const token = generateToken(user._id);

    // Cập nhật trạng thái online
    user.isOnline = true;
    user.lastLogin = new Date();
    await user.save();

    console.log("Profile:", user.profile);
    console.log("ID Card verified:", user.profile?.idCard?.verified);
    console.log("Face descriptor exists:", !!user.profile?.faceDescriptor);
    console.log("User active:", user.active);

    const responsePayload = {
      success: true,
      message: "Đăng nhập bằng khuôn mặt thành công",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profile: user.profile,
          checkInStreak: user.checkInStreak,
          journalStreak: user.journalStreak,
        },
        token,
      },
    };

    logUserActivity({
      action: "auth.face_login",
      req,
      res,
      userId: user._id.toString(),
      role: user.role,
      target: { type: "user", id: user._id.toString() },
      description: "Người dùng đăng nhập bằng khuôn mặt",
    });

    return res.json(responsePayload);
  } catch (error) {
    console.error("Lỗi đăng nhập khuôn mặt:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// XÁC MINH CCCD + LƯU KHUÔN MẶT
// POST /auth/verify-id-face
router.post(
  "/verify-id-face",
  auth,
  upload.fields([
    { name: "cccd", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, number, dob, address, faceDescriptor } = req.body;

      const userId = req.user.userId;
      const user = await User.findById(userId);

      console.log(" =============== req.body: ", req.body);

      if (!req.files.cccd || !req.files.selfie) {
        return res.status(400).json({ success: false, message: "Thiếu ảnh" });
      }

      // Lưu vào profile
      user.profile.idCard = {
        number,
        fullName,
        dob,
        address,
        frontImage: `/api/uploads/images/${req.files.cccd[0].filename}`,
        selfieImage: `/api/uploads/images/${req.files.selfie[0].filename}`,
        verified: true,
        verifiedAt: new Date(),
      };

      // Lưu descriptor
      user.profile.faceDescriptor = JSON.parse(faceDescriptor);

      // console.log(" =============== user: ", user);

      await user.save();

      res.json({
        success: true,
        message: "Xác minh thành công!",
        data: {
          fullName: fullName,
          number: number,
          dob: dob,
          address: address,
          cccdFile: `/api/uploads/images/${req.files.cccd[0].filename}`,
          selfieBlob: `/api/uploads/images/${req.files.selfie[0].filename}`,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
);

// ✅ Export router làm mặc định và các hàm khác để sử dụng nội bộ
module.exports = router;
module.exports._internal = {
  handleCheckInStreak,
  isMilestone,
  generateToken,
};
