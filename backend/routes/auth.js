// // Khai Báo
// const express = require("express");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const mailService = require("../services/mailService");
// const router = express.Router();

// // Tạo token JWT với (userId) và thời gian hết hạn
// const generateToken = (userId) => {
//   return jwt.sign(
//     { userId },
//     process.env.JWT_SECRET || "autism_support_secret",
//     {
//       expiresIn: "7d", // Token hợp lệ trong 7 ngày
//     }
//   );
// };

// // Middleware xác thực
// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Không tìm thấy token",
//       });
//     }

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "autism_support_secret"
//     );
//     req.user = await User.findById(decoded.userId);
//     next();
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: "Token không hợp lệ",
//     });
//   }
// };

// // Đăng ký
// router.post("/register", async (req, res) => {
//   try {
//     const { username, email, password, fullName, role } = req.body; // Lấy dữ liệu từ body

//     // Kiểm tra user đã tồn tại
//     const existingUser = await User.findOne({
//       // tim kiếm 1 user có email hoặc username trùng
//       $or: [{ email }, { username }],
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "Email hoặc username đã tồn tại",
//       });
//     }

//     // Tạo user mới
//     const user = new User({
//       username,
//       email,
//       password,
//       fullName,
//       role: role || "user",
//     });

//     await user.save(); // Lưu user vào DB

//     const emailResult = await mailService.sendEmail({
//       to: user.email,
//       subject: "🎉 Đăng ký thành công - Chào mừng đến với Autism Support!",
//       templateName: "REGISTRATION_SUCCESS",
//       templateData: {
//         name: user.fullName || user.username,
//         username: user.username,
//         email: user.email,
//         registrationTime: new Date().toLocaleString("vi-VN"),
//         loginLink: `${process.env.FRONTEND_URL}/login`,
//       },
//     });

//     // Tạo token
//     const token = generateToken(user._id);

//     res.status(201).json({
//       success: true,
//       message: "Đăng ký thành công",
//       data: {
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           fullName: user.fullName,
//           role: user.role,
//         },
//         token,
//         emailSent: emailResult.success,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Yêu cầu OTP reset password
// router.post("/forgot-password", async (req, res) => {
//   try {
//     const { email } = req.body;

//     console.log("email: ", email)

//     const user = await User.findOne({ email });
//     if (!user) {
//       // Không cho biết email có tồn tại hay không (bảo mật)
//       return res.json({
//         success: true,
//         message: "Nếu email tồn tại, chúng tôi đã gửi mã OTP",
//       });
//     }

//     // Tạo OTP reset password
//     const otp = user.generateResetPasswordOTP();
//     await user.save();

//     // Gửi email OTP
//     const emailResult = await mailService.sendEmail({
//       to: user.email,
//       subject: "Mã OTP đặt lại mật khẩu - Autism Support",
//       templateName: "PASSWORD_RESET_OTP",
//       templateData: {
//         name: user.fullName || user.username,
//         otp: otp,
//         expiryTime: "10 phút",
//       },
//     });

//     res.json({
//       success: true,
//       message: "Đã gửi mã OTP đến email của bạn",
//       emailSent: emailResult.success,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Xác minh OTP và reset password
// router.post("/reset-password", async (req, res) => {
//   try {
//     const { email, otp, newPassword } = req.body;

//     if (!email || !otp || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "Thiếu thông tin: email, OTP hoặc mật khẩu mới",
//       });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Thông tin không hợp lệ",
//       });
//     }

//     // Tự động xóa OTP hết hạn trước khi kiểm tra
//     await user.cleanExpiredOTP();

//     // Kiểm tra OTP
//     if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Mã OTP không hợp lệ hoặc đã hết hạn",
//       });
//     }

//     // Cập nhật mật khẩu mới và xóa OTP
//     user.password = newPassword;
//     user.resetPasswordOTP = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     // Gửi email xác nhận
//     await mailService.sendEmail({
//       to: user.email,
//       subject: "Mật khẩu đã được đặt lại thành công - Autism Support",
//       templateName: "PASSWORD_RESET_SUCCESS",
//       templateData: {
//         name: user.fullName || user.username,
//         resetTime: new Date().toLocaleString("vi-VN"),
//         ipAddress: req.ip,
//         deviceInfo: req.headers["user-agent"],
//         loginLink: `${process.env.FRONTEND_URL}/login`,
//         supportEmail: process.env.EMAIL_USER,
//       },
//     });

//     res.json({
//       success: true,
//       message: "Đặt lại mật khẩu thành công",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Đăng nhập
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body; // Lấy dữ liệu từ body

//     // Tìm user bằng email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Email hoặc mật khẩu không đúng",
//       });
//     }

//     // Kiểm tra password
//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//       return res.status(401).json({
//         success: false,
//         message: "Email hoặc mật khẩu không đúng",
//       });
//     }

//     // Kiểm tra ghoạt động
//     if (user.active == false) {
//       return res.status(401).json({
//         success: false,
//         message: "Tài Khoản Đã Bị Khoá",
//       });
//     }

//     // Cập nhật trạng thái online
//     user.isOnline = true;
//     user.lastSeen = new Date();
//     await user.save();

//     // Tạo token
//     const token = generateToken(user._id);

//     res.json({
//       // trả về thông tin user và token
//       success: true,
//       message: "Đăng nhập thành công",
//       data: {
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           fullName: user.fullName,
//           role: user.role,
//           profile: user.profile,
//         },
//         token,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Đăng xuất
// router.post("/logout", async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     await User.findByIdAndUpdate(
//       userId,
//       { $set: { isOnline: false, lastSeen: Date.now } },
//       { new: true }
//     );

//     res.status(201).json({
//       success: true,
//       message: "Đăng xuất thành công",
//       data: null,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Server error", error: error.message });
//   }
// });

// module.exports = router;

// Khai Báo
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mailService = require("../services/mailService");
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

module.exports = router;
