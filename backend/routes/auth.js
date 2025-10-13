// Khai Báo
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Tạo token JWT với (userId) và thời gian hết hạn
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "autism_support_secret",
    {
      expiresIn: "7d", // Token hợp lệ trong 7 ngày
    }
  );
};

// Đăng ký
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body; // Lấy dữ liệu từ body

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({
      // tim kiếm 1 user có email hoặc username trùng
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã tồn tại",
      });
    }

    // Tạo user mới
    const user = new User({
      username,
      email,
      password,
      fullName,
      role: role || "user",
    });

    await user.save(); // Lưu user vào DB

    // Tạo token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
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

// Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body; // Lấy dữ liệu từ body

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

    // Cập nhật trạng thái online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Tạo token
    const token = generateToken(user._id);

    res.json({
      // trả về thông tin user và token
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

// Đăng xuất
router.post("/logout", async (req, res) => {
  try {
    const userId = req.user.userId;

    await User.findByIdAndUpdate(
      userId,
      { $set: { isOnline: false, lastSeen: Date.now } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Đăng xuất thành công",
      data: null,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
