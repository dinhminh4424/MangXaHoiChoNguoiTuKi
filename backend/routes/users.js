const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const Chat = require("../models/Chat");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const FileManager = require("../utils/fileManager");
const router = express.Router();

// Lấy thông tin user hiện tại
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    const countPost = await Post.countDocuments({
      userCreateID: user._id,
      isBlocked: false,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profile: user.profile,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
          countPost: countPost,
        },
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

// Lấy danh sách users (trừ user hiện tại)
router.get("/", auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { search, role, page = 1, limit = 20 } = req.query;

    let query = { _id: { $ne: currentUserId } };

    // Tìm kiếm theo tên hoặc username
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Lọc theo role
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ isOnline: -1, fullName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: users.length,
        totalUsers: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách users",
      error: error.message,
    });
  }
});

// Lấy thông tin user bằng ID
router.get("/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("profile.interests");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    const countPost = await Post.countDocuments({
      userCreateID: user._id,
      isBlocked: false,
    });

    const countChat = await Chat.countDocuments({
      members: user._id,
    });

    user.countPost = countPost;

    const userDoc = user.toObject();
    userDoc.countPost = countPost;
    userDoc.countChat = countChat;

    res.json({
      success: true,
      data: userDoc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin user",
      error: error.message,
    });
  }
});

// Lấy thông tin user bằng username
router.get("/username/:userName", auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.userName })
      .select("-password")
      .populate("profile.interests");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin user",
      error: error.message,
    });
  }
});

// Cập nhật thông tin user
router.put(
  "/profile",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { fullName, bio, interests, skills } = req.body;

      const updateData = {};

      if (fullName) updateData.fullName = fullName;
      if (bio !== undefined) updateData["profile.bio"] = bio;
      if (interests !== undefined) updateData["profile.interests"] = interests;
      if (skills !== undefined) updateData["profile.skills"] = skills;

      let file = req.file;
      if (file) {
        // Lấy user hiện tại để xóa avatar cũ
        const currentUser = await User.findById(req.user.userId);

        // Xóa avatar cũ nếu tồn tại và không phải avatar mặc định
        if (
          currentUser.profile?.avatar &&
          !currentUser.profile.avatar.includes("default-avatar")
        ) {
          try {
            const avatarUrl = currentUser.profile.avatar;
            let filename;

            if (avatarUrl.includes("/api/uploads/images/")) {
              filename = avatarUrl.split("/api/uploads/images/")[1];
            } else if (avatarUrl.includes("/uploads/images/")) {
              filename = avatarUrl.split("/uploads/images/")[1];
            }

            if (filename) {
              const oldAvatarPath = path.join(
                __dirname,
                "..",
                "uploads",
                "images",
                filename
              );
              if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
                console.log("Đã xóa avatar cũ:", oldAvatarPath);
              }
            }
          } catch (deleteError) {
            console.error("Lỗi khi xóa avatar cũ:", deleteError);
          }
        }

        // Tạo URL cho avatar mới - SỬA LỖI Ở ĐÂY
        const fileUrl = `/api/uploads/images/${file.filename}`;
        updateData["profile.avatar"] = fileUrl; // ✅ SỬA THÀNH "profile.avatar"
      }

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
      // Xóa file nếu có lỗi
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin",
        error: error.message,
      });
    }
  },
  upload.errorHandler
);

// cập nhật Image cover
router.put("/imageCover", auth, upload.single("file"), async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: "Ko có user cần thay đổi " + error,
        error: error,
      });
    }

    const file = req.file;
    if (file) {
      // Lấy user hiện tại để xóa avatar cũ

      // Xóa avatar cũ nếu tồn tại và không phải avatar mặc định
      if (currentUser.profile?.coverPhoto) {
        try {
          const imageCoverUrl = currentUser.profile.coverPhoto;

          FileManager.deleteSingleFile(imageCoverUrl);
        } catch (deleteError) {
          console.error("Lỗi khi xóa avatar cũ:", deleteError);
          return;
        }
      }

      // Tạo URL cho avatar mới - SỬA LỖI Ở ĐÂY
      const fileUrl = `/api/uploads/images/${file.filename}`;
      console.log("coverPhoto: ", fileUrl);
      currentUser.profile.coverPhoto = fileUrl;

      await currentUser.save();

      res.status(200).json({
        success: true,
        message: "Cập nhật Image Cover thành cồng",
        user: currentUser,
      });
    } else {
      console.log("===================== Ko ảnh =====================");
      res.status(400).json({
        success: false,
        message: "Lỗi ko ảnh: ",
        error,
        error: error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: ",
      error,
      error: error,
    });
  }
});
// Cập nhật trạng thái online
router.put("/online-status", auth, async (req, res) => {
  try {
    const { isOnline } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        isOnline: isOnline,
        lastSeen: isOnline ? new Date() : user.lastSeen,
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      data: {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái",
      error: error.message,
    });
  }
});

// Tìm kiếm supporters (người hỗ trợ)
router.get("/supporters/list", auth, async (req, res) => {
  try {
    const supporters = await User.find({ role: "supporter" })
      .select("-password")
      .sort({ isOnline: -1, fullName: 1 });

    res.json({
      success: true,
      data: supporters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách supporters",
      error: error.message,
    });
  }
});

// Thống kê user (cho admin)
router.get("/admin/stats", auth, async (req, res) => {
  try {
    // Kiểm tra role admin
    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        onlineUsers,
        roleDistribution: userStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
      error: error.message,
    });
  }
});

module.exports = router;
