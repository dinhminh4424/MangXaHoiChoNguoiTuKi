// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const auth = async (req, res, next) => {
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
//     const user = await User.findById(decoded.userId).select("-password");

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Token không hợp lệ",
//       });
//     }

//     req.user = {
//       userId: user._id.toString(), // Đảm bảo userId là string để so sánh đúng của back end
//       username: user.username,
//       role: user.role,
//     };

//     next();
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: "Token không hợp lệ",
//     });
//   }
// };

// module.exports = auth;

// mới
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  // Lấy token từ header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Không tìm thấy token",
    });
  }

  try {
    // 1. Xác thực token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "autism_support_secret"
    );

    // 2. Tìm user và CẬP NHẬT TRẠNG THÁI ONLINE luôn
    // Dùng findByIdAndUpdate để vừa lấy user vừa update lastSeen 1 lần cho tiện
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        isOnline: true,
        lastSeen: Date.now(),
      },
      { new: true } // Trả về dữ liệu mới sau khi update
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User không tồn tại hoặc đã bị xóa",
      });
    }

    // 3. Gán thông tin vào req để dùng ở controller sau
    req.user = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    // --- XỬ LÝ RIÊNG KHI TOKEN HẾT HẠN ---
    if (error.name === "TokenExpiredError") {
      try {
        // Giải mã token (không cần verify signature) để lấy userId
        const decodedRaw = jwt.decode(token);

        // Nếu lấy được userId -> Set user thành OFFLINE
        if (decodedRaw && decodedRaw.userId) {
          await User.findByIdAndUpdate(decodedRaw.userId, {
            isOnline: false,
            // Tại đây có thể tính toán cộng dồn totalOnlineMinutes nếu muốn (như logic Logout)
          });
          console.log(
            `User ${decodedRaw.userId} đã được set offline do hết token.`
          );
        }
      } catch (err) {
        console.error("Lỗi khi xử lý token hết hạn:", err);
      }

      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại",
        code: "TOKEN_EXPIRED", // Client dựa vào code này để redirect về trang login
      });
    }

    // Các lỗi khác (Token sai format, giả mạo...)
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

module.exports = auth;
