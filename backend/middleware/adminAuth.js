const User = require("../models/User");

/**
 * Middleware kiểm tra quyền admin
 * Chỉ cho phép user có role "admin" truy cập
 */
const adminAuth = async (req, res, next) => {
  try {
    // Kiểm tra xem có token không
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    // Lấy thông tin user từ database
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Kiểm tra role admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Không có quyền truy cập. Chỉ admin mới có thể truy cập trang này.",
      });
    }

    // Thêm thông tin user vào request để sử dụng trong controller
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xác thực admin",
    });
  }
};

module.exports = adminAuth;
