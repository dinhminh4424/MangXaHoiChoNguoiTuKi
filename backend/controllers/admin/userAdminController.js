const User = require("../../models/User");
const Post = require("../../models/Post");
const Journal = require("../../models/Journal");
const Group = require("../../models/Group");
const Comment = require("../../models/Comment");
const Message = require("../../models/Message");
const MoodLog = require("../../models/MoodLog");
const Violation = require("../../models/Violation");
const Follow = require("../../models/Follow");
const Friend = require("../../models/Friend");
const FriendRequest = require("../../models/FriendRequest");
const GroupMember = require("../../models/GroupMember");
const Notification = require("../../models/Notification");
const EmergencyContact = require("../../models/EmergencyContact");
const EmergencyRequest = require("../../models/EmergencyRequest");
const AccessLog = require("../../models/AccessLog");
const AuditLog = require("../../models/AuditLog");
const ClientLog = require("../../models/ClientLog");
const Todo = require("../../models/Todo");
const BackupLog = require("../../models/BackupLog");
const FileManager = require("../../utils/FileManager"); // Import FileManager utility

// controllers/admin/userAdminController.js
const UserDeletionService = require("../../services/UserDeletionService");

// Quản lý người dùng

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Tạo filter
    const filter = {};

    // Tìm kiếm
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    // Lọc theo role
    if (role) {
      filter.role = role;
    }

    // Lọc theo trạng thái
    if (status === "active") {
      filter.active = true;
    } else if (status === "banned") {
      filter.active = false;
    } else if (status === "online") {
      filter.isOnline = true;
    } else if (status === "offline") {
      filter.isOnline = false;
    }

    // Lọc theo ngày
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // Sắp xếp
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách người dùng",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role, profile } = req.body;

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

    const user = new User({
      username,
      email,
      password,
      fullName,
      role: role || "user",
      profile: profile || {},
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: { user },
      message: "Tạo người dùng thành công",
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo người dùng",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(405).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Lấy thống kê của user
    const [postsCount, journalsCount, groupsCount] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Journal.countDocuments({ author: userId }),
      Group.countDocuments({ members: userId }),
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          postsCount,
          journalsCount,
          groupsCount,
        },
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin người dùng",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    const { username, email, fullName, role, profile, active } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra trùng email/username
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email đã tồn tại",
        });
      }
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username đã tồn tại",
        });
      }
    }

    // Cập nhật thông tin
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (profile) updateData.profile = { ...user.profile, ...profile };

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      data: { user: updatedUser },
      message: "Cập nhật người dùng thành công",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật người dùng",
    });
  }
};

const updateActiveUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      console.error("Ko có id:", id);
      return res.status(404).json({
        success: false,
        message: "Lỗi khi cập nhật Trạng thái hoạt động người dùng",
      });
    }
    const user = await User.findById(id);

    if (!user) {
      console.error("Ko có id:", id);
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy người dùng với id: " + id,
      });
    }

    user.active = !user.active;

    await user.save();

    console.log("");

    return res.status(200).json({
      success: true,
      message: "Cạp nhật thành công",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật Trạng thái hoạt động người dùng : " + error,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedBy = req.user.userId;
    const userRole = req.user.role;

    // Không cho phép xóa chính mình
    if (userId === deletedBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa chính mình",
      });
    }

    // Sử dụng service để xoá hoàn toàn
    const result = await UserDeletionService.deleteUserCompletely(
      userId,
      deletedBy,
      userRole,
      req
    );

    res.json({
      success: true,
      message: "Xóa người dùng và tất cả dữ liệu liên quan thành công",
      data: result,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    let statusCode = 500;
    let errorMessage = "Lỗi khi xóa người dùng";

    if (error.message === "Không thể xóa chính mình") {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message === "Không có quyền xóa user này") {
      statusCode = 403;
      errorMessage = error.message;
    } else if (error.message === "User not found") {
      statusCode = 404;
      errorMessage = "Không tìm thấy người dùng";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "supporter", "admin", "doctor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role không hợp lệ",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật role thành công",
      data: user,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật role",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  createUser,
  deleteUser,
  updateUserRole,
  updateActiveUser,
};
