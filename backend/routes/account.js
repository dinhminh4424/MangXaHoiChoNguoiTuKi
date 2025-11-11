// // routes/account.js
// const express = require("express");
// const bcrypt = require("bcryptjs");
// const User = require("../models/User");
// const auth = require("../middleware/auth");
// const mailService = require("../services/mailService");
// const { logUserActivity } = require("../logging/userActivityLogger");
// const router = express.Router();

// // Lấy thông tin profile
// router.get("/profile", auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select(
//       "-password -resetPasswordOTP -resetPasswordExpire"
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Người dùng không tồn tại",
//       });
//     }

//     res.json({
//       success: true,
//       data: { user },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Cập nhật thông tin profile
// router.put("/profile", auth, async (req, res) => {
//   try {
//     const { fullName, bio, location, interests, skills } = req.body;

//     const user = await User.findById(req.user.userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Người dùng không tồn tại",
//       });
//     }

//     // Cập nhật các trường cơ bản
//     if (fullName !== undefined) user.fullName = fullName;

//     // Cập nhật profile
//     if (user.profile) {
//       if (bio !== undefined) user.profile.bio = bio;
//       if (location !== undefined) user.profile.location = location;
//       if (interests !== undefined) user.profile.interests = interests;
//       if (skills !== undefined) user.profile.skills = skills;
//     }

//     await user.save();

//     const updatedUser = await User.findById(req.user.userId).select(
//       "-password -resetPasswordOTP -resetPasswordExpire"
//     );

//     logUserActivity({
//       action: "account.update_profile",
//       req,
//       res,
//       userId: req.user.userId,
//       role: user.role,
//       target: { type: "user", id: req.user.userId },
//       description: "Người dùng cập nhật thông tin profile",
//       payload: {
//         updatedFields: { fullName, bio, location, interests, skills },
//       },
//     });

//     res.json({
//       success: true,
//       message: "Cập nhật profile thành công",
//       data: { user: updatedUser },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Đổi mật khẩu (cần mật khẩu cũ)
// router.post("/change-password", auth, async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
//       });
//     }

//     const user = await User.findById(req.user.userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Người dùng không tồn tại",
//       });
//     }

//     // Kiểm tra mật khẩu hiện tại
//     const isCurrentPasswordValid = await user.comparePassword(currentPassword);
//     if (!isCurrentPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         message: "Mật khẩu hiện tại không đúng",
//       });
//     }

//     // Cập nhật mật khẩu mới
//     user.password = newPassword;
//     await user.save();

//     // Gửi email thông báo đổi mật khẩu
//     await mailService.sendEmail({
//       to: user.email,
//       subject: "🔐 Thông báo đổi mật khẩu - Autism Support",
//       templateName: "PASSWORD_CHANGED",
//       templateData: {
//         name: user.fullName || user.username,
//         appName: "Autism Support",
//         changedAt: new Date().toLocaleString("vi-VN"), // <-- đổi thành changedAt
//         ipAddress: req.ip || req.headers["x-forwarded-for"] || "Không xác định",
//         deviceInfo: req.headers["user-agent"] || "Không xác định",
//         loginLink: `${
//           process.env.FRONTEND_URL || "support@autism-support.vn"
//         }/login`, // thêm link đăng nhập
//         supportEmail: process.env.EMAIL_USER || "support@autism-support.vn",
//       },
//     });

//     logUserActivity({
//       action: "account.change_password",
//       req,
//       res,
//       userId: req.user.userId,
//       role: user.role,
//       target: { type: "user", id: req.user.userId },
//       description: "Người dùng đổi mật khẩu",
//     });

//     res.json({
//       success: true,
//       message: "Đổi mật khẩu thành công",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Yêu cầu OTP để đổi mật khẩu (quên mật khẩu)
// router.post("/request-password-reset", async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       // Không tiết lộ email có tồn tại không (bảo mật)
//       return res.json({
//         success: true,
//         message: "Nếu email tồn tại, chúng tôi đã gửi mã OTP",
//       });
//     }

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

// // Xác minh OTP và đặt lại mật khẩu
// router.post("/reset-password-with-otp", async (req, res) => {
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

//     // Xác minh OTP
//     if (!user.verifyResetPasswordOTP(otp)) {
//       return res.status(400).json({
//         success: false,
//         message: "Mã OTP không hợp lệ hoặc đã hết hạn",
//       });
//     }

//     // Cập nhật mật khẩu mới
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

//     logUserActivity({
//       action: "account.password_reset",
//       req,
//       res,
//       userId: user._id.toString(),
//       role: user.role,
//       target: { type: "user", id: user._id.toString() },
//       description: "Người dùng đặt lại mật khẩu bằng OTP",
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

// // Lấy lịch sử hoạt động của user
// router.get("/activity-logs", auth, async (req, res) => {
//   try {
//     const { page = 1, limit = 20, action, startDate, endDate } = req.query;

//     const ClientLog = require("../models/ClientLog");

//     let query = { userId: req.user.userId };

//     // Lọc theo action
//     if (action) {
//       query.event = { $regex: action, $options: "i" };
//     }

//     // Lọc theo thời gian
//     if (startDate || endDate) {
//       query.timestamp = {};
//       if (startDate) query.timestamp.$gte = new Date(startDate);
//       if (endDate) query.timestamp.$lte = new Date(endDate);
//     }

//     const logs = await ClientLog.find(query)
//       .sort({ timestamp: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .select("-__v");

//     const total = await ClientLog.countDocuments(query);

//     res.json({
//       success: true,
//       data: {
//         logs,
//         pagination: {
//           current: parseInt(page),
//           total: Math.ceil(total / limit),
//           results: logs.length,
//           totalLogs: total,
//         },
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

// // Xoá tài khoản (soft delete)
// router.delete("/deactivate", auth, async (req, res) => {
//   try {
//     const { reason, password } = req.body;

//     if (!password) {
//       return res.status(400).json({
//         success: false,
//         message: "Vui lòng nhập mật khẩu để xác nhận",
//       });
//     }

//     const user = await User.findById(req.user.userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Người dùng không tồn tại",
//       });
//     }

//     // Xác nhận mật khẩu
//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         message: "Mật khẩu không đúng",
//       });
//     }

//     // Soft delete - đánh dấu không active
//     user.active = false;
//     user.deactivatedAt = new Date();
//     user.deactivationReason = reason;
//     await user.save();

//     // Gửi email thông báo
//     await mailService.sendEmail({
//       to: user.email,
//       subject: "Tài khoản đã được vô hiệu hóa - Autism Support",
//       templateName: "ACCOUNT_DEACTIVATED",
//       templateData: {
//         name: user.fullName || user.username,
//         deactivationTime: new Date().toLocaleString("vi-VN"),
//         reason: reason || "Người dùng tự nguyện",
//         reactivationPeriod: "30 ngày",
//         supportEmail: process.env.EMAIL_USER,
//       },
//     });

//     logUserActivity({
//       action: "account.deactivate",
//       req,
//       res,
//       userId: req.user.userId,
//       role: user.role,
//       target: { type: "user", id: req.user.userId },
//       description: "Người dùng vô hiệu hóa tài khoản",
//       payload: { reason },
//     });

//     res.json({
//       success: true,
//       message: "Tài khoản đã được vô hiệu hóa thành công",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// // Kích hoạt lại tài khoản
// router.post("/reactivate", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Tài khoản không tồn tại",
//       });
//     }

//     // Kiểm tra mật khẩu
//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         message: "Mật khẩu không đúng",
//       });
//     }

//     // Kiểm tra xem tài khoản có bị deactivated không
//     if (user.active) {
//       return res.status(400).json({
//         success: false,
//         message: "Tài khoản đã được kích hoạt",
//       });
//     }

//     // Kích hoạt lại
//     user.active = true;
//     user.deactivatedAt = undefined;
//     user.deactivationReason = undefined;
//     await user.save();

//     // Gửi email thông báo
//     await mailService.sendEmail({
//       to: user.email,
//       subject: "Tài khoản đã được kích hoạt lại - Autism Support",
//       templateName: "ACCOUNT_REACTIVATED",
//       templateData: {
//         name: user.fullName || user.username,
//         reactivationTime: new Date().toLocaleString("vi-VN"),
//         loginLink: `${process.env.FRONTEND_URL}/login`,
//       },
//     });

//     // Tạo token mới
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || "autism_support_secret",
//       { expiresIn: "7d" }
//     );

//     res.json({
//       success: true,
//       message: "Tài khoản đã được kích hoạt lại thành công",
//       data: {
//         token,
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           fullName: user.fullName,
//           role: user.role,
//         },
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

// // Export settings
// router.get("/export-data", auth, async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const [userData, posts, journals, comments] = await Promise.all([
//       User.findById(userId).select(
//         "-password -resetPasswordOTP -resetPasswordExpire"
//       ),
//       Post.find({ userCreateID: userId }).select("-__v"),
//       Journal.find({ userId: userId }).select("-__v"),
//       Comment.find({ userID: userId }).select("-__v"),
//     ]);

//     const exportData = {
//       exportedAt: new Date().toISOString(),
//       user: userData,
//       posts: posts,
//       journals: journals,
//       comments: comments,
//     };

//     // Trả về JSON file hoặc có thể lưu file và trả về link download
//     res.json({
//       success: true,
//       data: exportData,
//       message: "Dữ liệu đã được xuất thành công",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// });

// module.exports = router;

// routes/account.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const Group = require("../models/Group");
const Journal = require("../models/Journal");
const Todo = require("../models/Todo");
const Comment = require("../models/Comment");
const ClientLog = require("../models/ClientLog");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const mailService = require("../services/mailService");
const { logUserActivity } = require("../logging/userActivityLogger");
const router = express.Router();

// Lấy thông tin profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -resetPasswordOTP -resetPasswordExpire"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Cập nhật thông tin profile
router.put(
  "/profile",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  auth,
  async (req, res) => {
    try {
      const { fullName, bio, location, interests, skills } = req.body;

      const updateData = {};

      // Cập nhật các trường cơ bản
      if (fullName !== undefined) updateData.fullName = fullName;
      if (bio !== undefined) updateData["profile.bio"] = bio;
      if (location !== undefined) updateData["profile.location"] = location;

      // Xử lý mảng interests và skills
      if (interests !== undefined) {
        updateData["profile.interests"] = Array.isArray(interests)
          ? interests
          : interests
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
      }

      if (skills !== undefined) {
        updateData["profile.skills"] = Array.isArray(skills)
          ? skills
          : skills
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
      }

      // Hàm xóa file cũ
      const deleteOldFile = async (fileUrl, fileType) => {
        if (!fileUrl || fileUrl.includes(`default-${fileType}`)) {
          return;
        }

        try {
          let filename;
          if (fileUrl.includes("/api/uploads/images/")) {
            filename = fileUrl.split("/api/uploads/images/")[1];
          } else if (fileUrl.includes("/uploads/images/")) {
            filename = fileUrl.split("/uploads/images/")[1];
          }

          if (filename) {
            const oldFilePath = path.join(
              __dirname,
              "..",
              "uploads",
              "images",
              filename
            );
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
              console.log(`Đã xóa ${fileType} cũ:`, oldFilePath);
            }
          }
        } catch (deleteError) {
          console.error(`Lỗi khi xóa ${fileType} cũ:`, deleteError);
        }
      };

      // Lấy user hiện tại
      const currentUser = await User.findById(req.user.userId);

      // Xử lý avatar
      if (req.files && req.files.avatar) {
        const avatarFile = req.files.avatar[0];

        // Xóa avatar cũ
        if (currentUser.profile?.avatar) {
          await deleteOldFile(currentUser.profile.avatar, "avatar");
        }

        // Tạo URL cho avatar mới
        const avatarUrl = `/api/uploads/images/${avatarFile.filename}`;
        updateData["profile.avatar"] = avatarUrl;
      }

      // Xử lý cover photo
      if (req.files && req.files.coverPhoto) {
        const coverPhotoFile = req.files.coverPhoto[0];

        // Xóa cover photo cũ
        if (currentUser.profile?.coverPhoto) {
          await deleteOldFile(currentUser.profile.coverPhoto, "cover-photo");
        }

        // Tạo URL cho cover photo mới
        const coverPhotoUrl = `/api/uploads/images/${coverPhotoFile.filename}`;
        updateData["profile.coverPhoto"] = coverPhotoUrl;
      }

      // Cập nhật user
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");

      res.json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: user,
      });
    } catch (error) {
      // Xóa file mới upload nếu có lỗi
      if (req.files) {
        Object.values(req.files).forEach((files) => {
          files.forEach((file) => {
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            } catch (deleteError) {
              console.error("Lỗi khi xóa file tạm:", deleteError);
            }
          });
        });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin",
        error: error.message,
      });
    }
  }
);

// Upload avatar
router.post(
  "/upload-avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được tải lên",
        });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Tạo URL cho avatar mới
      const fileUrl = `/api/uploads/images/${req.file.filename}`;

      if (!user.profile) {
        user.profile = {};
      }

      user.profile.avatar = fileUrl;
      await user.save();

      logUserActivity({
        action: "account.upload_avatar",
        req,
        res,
        userId: req.user.userId,
        role: user.role,
        target: { type: "user", id: req.user.userId },
        description: "Người dùng upload avatar mới",
      });

      res.json({
        success: true,
        message: "Upload avatar thành công",
        data: { avatar: fileUrl },
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi upload avatar",
        error: error.message,
      });
    }
  },
  upload.errorHandler
);

// Upload cover photo
router.post(
  "/upload-cover",
  auth,
  upload.single("coverPhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được tải lên",
        });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Tạo URL cho cover photo mới
      const fileUrl = `/api/uploads/images/${req.file.filename}`;

      if (!user.profile) {
        user.profile = {};
      }

      user.profile.coverPhoto = fileUrl;
      await user.save();

      logUserActivity({
        action: "account.upload_cover",
        req,
        res,
        userId: req.user.userId,
        role: user.role,
        target: { type: "user", id: req.user.userId },
        description: "Người dùng upload cover photo mới",
      });

      res.json({
        success: true,
        message: "Upload cover photo thành công",
        data: { coverPhoto: fileUrl },
      });
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi upload cover photo",
        error: error.message,
      });
    }
  },
  upload.errorHandler
);

// Đổi mật khẩu (cần mật khẩu cũ)
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu cũ",
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    // Gửi email thông báo đổi mật khẩu
    try {
      await mailService.sendEmail({
        to: user.email,
        subject: "🔐 Thông báo đổi mật khẩu - Autism Support",
        templateName: "PASSWORD_CHANGED",
        templateData: {
          name: user.fullName || user.username,
          appName: "Autism Support",
          changedAt: new Date().toLocaleString("vi-VN"),
          ipAddress:
            req.ip || req.headers["x-forwarded-for"] || "Không xác định",
          deviceInfo: req.headers["user-agent"] || "Không xác định",
          loginLink: `${
            process.env.FRONTEND_URL || "https://autism-support.vn"
          }/login`,
          supportEmail: process.env.EMAIL_USER || "support@autism-support.vn",
        },
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Không throw error vì đổi mật khẩu đã thành công
    }

    logUserActivity({
      action: "account.change_password",
      req,
      res,
      userId: req.user.userId,
      role: user.role,
      target: { type: "user", id: req.user.userId },
      description: "Người dùng đổi mật khẩu",
    });

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Yêu cầu OTP để đổi mật khẩu (quên mật khẩu)
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Không tiết lộ email có tồn tại không (bảo mật)
      return res.json({
        success: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi mã OTP",
      });
    }

    const otp = user.generateResetPasswordOTP();
    await user.save();

    // Gửi email OTP
    try {
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
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      res.status(500).json({
        success: false,
        message: "Lỗi khi gửi email OTP",
        error: emailError.message,
      });
    }
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Xác minh OTP và đặt lại mật khẩu
router.post("/reset-password-with-otp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin: email, OTP hoặc mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
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

    // Gửi email xác nhận
    try {
      await mailService.sendEmail({
        to: user.email,
        subject: "Mật khẩu đã được đặt lại thành công - Autism Support",
        templateName: "PASSWORD_RESET_SUCCESS",
        templateData: {
          name: user.fullName || user.username,
          resetTime: new Date().toLocaleString("vi-VN"),
          ipAddress: req.ip || "Không xác định",
          deviceInfo: req.headers["user-agent"] || "Không xác định",
          loginLink: `${
            process.env.FRONTEND_URL || "https://autism-support.vn"
          }/login`,
          supportEmail: process.env.EMAIL_USER || "support@autism-support.vn",
        },
      });
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
    }

    logUserActivity({
      action: "account.password_reset",
      req,
      res,
      userId: user._id.toString(),
      role: user.role,
      target: { type: "user", id: user._id.toString() },
      description: "Người dùng đặt lại mật khẩu bằng OTP",
    });

    res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error("Error resetting password with OTP:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Lấy lịch sử hoạt động của user
router.get("/activity-logs", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, startDate, endDate } = req.query;

    let query = { userId: req.user.userId };

    // Lọc theo action
    if (action) {
      query.event = { $regex: action, $options: "i" };
    }

    // Lọc theo thời gian
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ClientLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const total = await ClientLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          results: logs.length,
          totalLogs: total,
        },
      },
    });
  } catch (error) {
    console.error("Error getting activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Xoá tài khoản (soft delete)
router.delete("/deactivate", auth, async (req, res) => {
  try {
    const { reason, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu để xác nhận",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Xác nhận mật khẩu
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu không đúng",
      });
    }

    // Soft delete - đánh dấu không active
    user.active = false;
    user.deactivatedAt = new Date();
    user.deactivationReason = reason;
    await user.save();

    // Gửi email thông báo
    try {
      await mailService.sendEmail({
        to: user.email,
        subject: "Tài khoản đã được vô hiệu hóa - Autism Support",
        templateName: "ACCOUNT_DEACTIVATED",
        templateData: {
          name: user.fullName || user.username,
          deactivationTime: new Date().toLocaleString("vi-VN"),
          reason: reason || "Người dùng tự nguyện",
          reactivationPeriod: "30 ngày",
          supportEmail: process.env.EMAIL_USER || "support@autism-support.vn",
        },
      });
    } catch (emailError) {
      console.error("Error sending deactivation email:", emailError);
    }

    logUserActivity({
      action: "account.deactivate",
      req,
      res,
      userId: req.user.userId,
      role: user.role,
      target: { type: "user", id: req.user.userId },
      description: "Người dùng vô hiệu hóa tài khoản",
      payload: { reason },
    });

    res.json({
      success: true,
      message: "Tài khoản đã được vô hiệu hóa thành công",
    });
  } catch (error) {
    console.error("Error deactivating account:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Kích hoạt lại tài khoản
router.post("/reactivate", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Tài khoản không tồn tại",
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu không đúng",
      });
    }

    // Kiểm tra xem tài khoản có bị deactivated không
    if (user.active) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản đã được kích hoạt",
      });
    }

    // Kích hoạt lại
    user.active = true;
    user.deactivatedAt = undefined;
    user.deactivationReason = undefined;
    await user.save();

    // Gửi email thông báo
    try {
      await mailService.sendEmail({
        to: user.email,
        subject: "Tài khoản đã được kích hoạt lại - Autism Support",
        templateName: "ACCOUNT_REACTIVATED",
        templateData: {
          name: user.fullName || user.username,
          reactivationTime: new Date().toLocaleString("vi-VN"),
          loginLink: `${
            process.env.FRONTEND_URL || "https://autism-support.vn"
          }/login`,
        },
      });
    } catch (emailError) {
      console.error("Error sending reactivation email:", emailError);
    }

    // Tạo token mới
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "autism_support_secret",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Tài khoản đã được kích hoạt lại thành công",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Error reactivating account:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Export data
router.get("/export-data", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [userData, posts, journals, comments, todos, groups] =
      await Promise.all([
        User.findById(userId).select(
          "-password -resetPasswordOTP -resetPasswordExpire"
        ),
        Post.find({ userCreateID: userId }).select("-__v"),
        Journal.find({ userId: userId }).select("-__v"),
        Comment.find({ userID: userId }).select("-__v"),
        Todo.find({ createdBy: userId }).select("-__v"),
        Group.find({ owner: userId }).select("-__v"),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userData,
      posts: posts,
      journals: journals,
      comments: comments,
      todos: todos,
      groups: groups,
    };

    res.json({
      success: true,
      data: exportData,
      message: "Dữ liệu đã được xuất thành công",
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

module.exports = router;
