// Khai Báo
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mailService = require("../services/mailService");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const router = express.Router();
const { normalizeBaseUsername, generateUniqueUsernameFrom } = require("../utils/username");

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
    const normalizedUsernameBase = normalizeBaseUsername(username || fullName || (email ? email.split("@")[0] : "user"));
    const normalizedUsername = await generateUniqueUsernameFrom(normalizedUsernameBase);

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

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        token,
        emailSent: emailResult.success,
      },
    });
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

    // Cập nhật trạng thái online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Tạo token
    const token = generateToken(user._id);

    res.json({
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
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
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

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
      data: null,
    });
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
router.post("/face-login", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user || !user.profile.idCard?.verified) {
      return res
        .status(400)
        .json({ success: false, message: "Tài khoản chưa xác minh khuôn mặt" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "autism_support_secret",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
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

module.exports = router;
