const User = require("../models/User");
const Post = require("../models/Post");
const Journal = require("../models/Journal");
const Group = require("../models/Group");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const MoodLog = require("../models/MoodLog");
const Violation = require("../models/Violation");
const NotificationService = require("../services/notificationService");

/**
 * ADMIN CONTROLLER
 * Chứa tất cả các chức năng quản lý dành cho admin
 */

// Dashboard - Thống kê tổng quan
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalJournals,
      totalGroups,
      totalComments,
      totalMessages,
      recentUsers,
      recentPosts,
      moodStats,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Journal.countDocuments(),
      Group.countDocuments(),
      Comment.countDocuments(),
      Message.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("username email role createdAt"),
      Post.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userCreateID", "username"),
      MoodLog.aggregate([
        {
          $group: {
            _id: "$emotion",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Thống kê theo thời gian (7 ngày gần nhất)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [newUsersThisWeek, newPostsThisWeek, newJournalsThisWeek] =
      await Promise.all([
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Journal.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalPosts,
          totalJournals,
          totalGroups,
          totalComments,
          totalMessages,
        },
        weeklyStats: {
          newUsers: newUsersThisWeek,
          newPosts: newPostsThisWeek,
          newJournals: newJournalsThisWeek,
        },
        recentActivity: {
          users: recentUsers,
          posts: recentPosts,
        },
        moodStats,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê dashboard2",
    });
  }
};

// Quản lý người dùng
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const skip = (page - 1) * limit;

    // Tạo filter
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
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

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
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
    const { userId } = req.params;
    const { fullName, email, profile, role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { fullName, email, profile, role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin người dùng",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Không cho phép xóa chính mình
    if (userId === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa chính mình",
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Xóa các dữ liệu liên quan
    await Promise.all([
      Post.deleteMany({ author: userId }),
      Journal.deleteMany({ author: userId }),
      Comment.deleteMany({ author: userId }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
      Group.updateMany({ members: userId }, { $pull: { members: userId } }),
    ]);

    res.json({
      success: true,
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa người dùng",
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

// Quản lý bài viết
// const getAllPosts = async (req, res) => {
//   try {
//     // const { page = 1, limit = 10, postsSearch = [] } = req.query;
//     const { page = 1, limit = 10, email, fromDate, toDate } = req.query;

//     const skip = (page - 1) * limit;

//     let postsSearch = {
//       email,
//       fromDate,
//       toDate,
//     };
//     console.log("================= postsSearch: ", postsSearch);

//     const filter = {};
//     if (postsSearch) {
//       if (postsSearch.email) {
//         filter.$or = [
//           {
//             "userCreateID.username": {
//               $regex: postsSearch.email,
//               $options: "i",
//             },
//           },
//           {
//             "userCreateID.email": { $regex: postsSearch.email, $options: "i" },
//           },
//         ];
//       }
//       if (postsSearch.fromDate && postsSearch.toDate) {
//         const toDateObj = new Date(toDate);
//         toDateObj.setHours(23, 59, 59, 999); // để lấy hết ngày toDate
//         const fromDateObj = new Date(toDateObj);
//         fromDateObj.setHours(0, 0, 0, 0);
//         filter.createdAt = [
//           {
//             $gte: new Date(postsSearch.fromDateObj),
//             $lte: new Date(postsSearch.toDateObj),
//           },
//         ];
//       } else if (postsSearch.fromDate) {
//         const fromDateObj = new Date(toDateObj);
//         fromDateObj.setHours(0, 0, 0, 0);
//         filter.createdAt = {
//           $gte: new Date(postsSearch.fromDateObj),
//         };
//       } else if (postsSearch.toDate) {
//         const toDateObj = new Date(toDate);
//         toDateObj.setHours(23, 59, 59, 999); // để lấy hết ngày toDate
//         filter.createdAt = {
//           $lte: new Date(postsSearch.toDateObj),
//         };
//       }
//     }

//     const [posts, total] = await Promise.all([
//       Post.find(filter)
//         .populate("userCreateID", "username email profile.avatar")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit)),

//       Post.countDocuments(filter),
//     ]);

//     res.json({
//       success: true,
//       data: {
//         posts,
//         pagination: {
//           current: parseInt(page),
//           pages: Math.ceil(total / limit),
//           total,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Get all posts error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Lỗi khi lấy danh sách bài viết",
//     });
//   }
// };

// Trong adminController.js - cập nhật hàm getAllPosts
const getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      email = "",
      username = "",
      postId = "",
      fromDate = "",
      toDate = "",
      status = "",
      minViolations = "",
      maxViolations = "",
      privacy = "",
      hasFiles = "",
    } = req.query;

    const skip = (page - 1) * limit;

    const filter = {};

    // Tìm kiếm theo user (email hoặc username)
    if (email || username) {
      const userFilter = {};
      if (email) userFilter.email = { $regex: email, $options: "i" };
      if (username) userFilter.username = { $regex: username, $options: "i" };

      const users = await User.find(userFilter).select("_id");
      const userIds = users.map((user) => user._id);
      filter.userCreateID = { $in: userIds };
    }

    // Tìm kiếm theo ID bài viết
    if (postId) {
      try {
        filter._id = postId; // Có thể dùng regex nếu muốn tìm kiếm partial
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "ID bài viết không hợp lệ",
        });
      }
    }

    // Lọc theo thời gian
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const fromDateObj = new Date(fromDate);
        fromDateObj.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = fromDateObj;
      }
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDateObj;
      }
    }

    // Lọc theo trạng thái
    if (status === "blocked") {
      filter.isBlocked = true;
    } else if (status === "active") {
      filter.isBlocked = false;
    }

    // Lọc theo số lượng vi phạm
    if (minViolations || maxViolations) {
      filter.violationCount = {};
      if (minViolations) filter.violationCount.$gte = parseInt(minViolations);
      if (maxViolations) filter.violationCount.$lte = parseInt(maxViolations);
    }

    // Lọc theo quyền riêng tư
    if (privacy) {
      filter.privacy = privacy;
    }

    // Lọc bài viết có file đính kèm
    if (hasFiles === "true") {
      filter["files.0"] = { $exists: true };
    } else if (hasFiles === "false") {
      filter.files = { $size: 0 };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate(
          "userCreateID",
          "username email profile.avatar violationCount"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách bài viết",
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("userCreateID", "username email profile.avatar")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "username email",
        },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Get post by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin bài viết",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Xóa các comment liên quan
    await Comment.deleteMany({ post: postId });

    res.json({
      success: true,
      message: "Xóa bài viết thành công",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa bài viết",
    });
  }
};

// Quản lý nhật ký
const getAllJournals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const [journals, total] = await Promise.all([
      Journal.find(filter)
        .populate("userId", "username email profile.avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Journal.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        journals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all journals error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách nhật ký",
    });
  }
};

const getJournalById = async (req, res) => {
  try {
    const { journalId } = req.params;
    const journal = await Journal.findById(journalId).populate(
      "author",
      "username email"
    );

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhật ký",
      });
    }

    res.json({
      success: true,
      data: journal,
    });
  } catch (error) {
    console.error("Get journal by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin nhật ký",
    });
  }
};

const deleteJournal = async (req, res) => {
  try {
    const { journalId } = req.params;
    const journal = await Journal.findByIdAndDelete(journalId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhật ký",
      });
    }

    res.json({
      success: true,
      message: "Xóa nhật ký thành công",
    });
  } catch (error) {
    console.error("Delete journal error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa nhật ký",
    });
  }
};

// Quản lý nhóm
const getAllGroups = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate("owner", "username email")
        // .populate("members", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Group.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all groups error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách nhóm",
    });
  }
};

const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate("admin", "username email")
      .populate("members", "username email");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Get group by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin nhóm",
    });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findByIdAndDelete(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Xóa các bài viết trong nhóm
    await Post.deleteMany({ group: groupId });

    res.json({
      success: true,
      message: "Xóa nhóm thành công",
    });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa nhóm",
    });
  }
};

// Quản lý bình luận
const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate("author", "username email")
        .populate("post", "content")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Comment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all comments error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách bình luận",
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bình luận",
      });
    }

    res.json({
      success: true,
      message: "Xóa bình luận thành công",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa bình luận",
    });
  }
};

// Quản lý thông báo
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find()
        .populate("user", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thông báo",
    });
  }
};

const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type = "info" } = req.body;

    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
    });

    await notification.save();

    res.json({
      success: true,
      message: "Tạo thông báo thành công",
      data: notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo thông báo",
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    res.json({
      success: true,
      message: "Xóa thông báo thành công",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa thông báo",
    });
  }
};

// Báo cáo và phân tích
const getUserReports = async (req, res) => {
  try {
    const { period = "30" } = req.query; // Số ngày
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const reports = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Get user reports error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy báo cáo người dùng",
    });
  }
};

const getPostReports = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const reports = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Get post reports error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy báo cáo bài viết: " + error,
    });
  }
};

const getActivityReports = async (req, res) => {
  try {
    const { period = "7" } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [posts, journals, comments, messages] = await Promise.all([
      Post.countDocuments({ createdAt: { $gte: startDate } }),
      Journal.countDocuments({ createdAt: { $gte: startDate } }),
      Comment.countDocuments({ createdAt: { $gte: startDate } }),
      Message.countDocuments({ createdAt: { $gte: startDate } }),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        journals,
        comments,
        messages,
        period: parseInt(period),
      },
    });
  } catch (error) {
    console.error("Get activity reports error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy báo cáo hoạt động",
    });
  }
};

// lấy các repot báo cáo
// const getPostViolation = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status = "all" } = req.query;
//     const skip = limit * (page - 1);
//     const filter = {};
//     if (status != "all") {
//       filter.status = status;
//     }
//     filter.targetType = "Post";

//     const [reportsPost, total] = await Promise.all([
//       Violation.find(filter)
//         .populate("reportedBy", "username email profile.avatar")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit)),
//       Violation.countDocuments(filter),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: {
//         reportsPost,
//         pagination: {
//           current: parseInt(page),
//           pages: Math.ceil(total / limit),
//           total,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy báo cáo:", error);
//     res.status(500).json({
//       success: false,
//       message: "Lỗi khi lấy báo cáo bài viết ",
//     });
//   }
// };

const getPostViolation = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      dateFrom = "",
      dateTo = "",
      search = "",
      reportId = "",
    } = req.query;
    const skip = limit * (page - 1);

    const filter = { targetType: "Post" };

    if (status !== "all") {
      filter.status = status;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    if (search) {
      filter.$or = [
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    if (reportId) {
      filter.$or = [{ _id: { $regex: reportId, $options: "i" } }];
    }

    const [reportsPost, total] = await Promise.all([
      Violation.find(filter)
        .populate("reportedBy", "username email profile.avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Violation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reportsPost,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy báo cáo bài viết",
    });
  }
};

// Thêm API cập nhật violation
// const updateViolationStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, actionTaken, reviewedAt } = req.body;

//     const violation = await Violation.findByIdAndUpdate(
//       id,
//       {
//         status,
//         actionTaken,
//         reviewedAt,
//         reviewedBy: req.user.userId, // Giả sử có thông tin user từ auth middleware
//       },
//       { new: true }
//     ).populate("reportedBy", "username email profile.avatar");

//     if (!violation) {
//       return res.status(404).json({
//         success: false,
//         message: "Không tìm thấy báo cáo",
//       });
//     }

//     // Nếu action là block_post hoặc ban_user, cập nhật bài viết hoặc user
//     if (actionTaken === "block_post") {
//       await Post.findByIdAndUpdate(violation.targetId, { isBlocked: true });
//     } else if (actionTaken === "ban_user") {
//       await User.findByIdAndUpdate(violation.userId, {
//         active: false,
//         violationCount: { $inc: 1 },
//         lastViolationAt: new Date(),
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: violation,
//       message: "Cập nhật trạng thái thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi khi cập nhật báo cáo:", error);
//     res.status(500).json({
//       success: false,
//       message: "Lỗi khi cập nhật báo cáo",
//     });
//   }
// };
const updateViolationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken = "block_post", reviewedAt } = req.body;

    const violation = await Violation.findById(id)
      .populate("reportedBy", "username email profile.avatar")
      .populate("userId", "username email fullName");

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo cáo",
      });
    }

    const updatedViolation = await Violation.findByIdAndUpdate(
      id,
      {
        status,
        actionTaken,
        reviewedAt,
        reviewedBy: req.user.userId,
      },
      { new: true }
    ).populate("reportedBy", "username email profile.avatar");

    // Thông báo real-time dựa trên action
    if (actionTaken === "block_post") {
      await Post.findByIdAndUpdate(violation.targetId, { isBlocked: true });

      // Thông báo cho người đăng bài
      await NotificationService.createAndEmitNotification({
        recipient: violation.userId,
        sender: req.user._id,
        type: "POST_BLOCKED",
        title: "Bài viết đã bị ẩn",
        message: `Bài viết của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`,
        data: {
          violationId: violation._id,
          postId: violation.targetId,
          reason: violation.reason,
          action: "blocked",
        },
        priority: "high",
        url: `/posts/${violation.targetId}`,
      });
    } else if (actionTaken === "ban_user") {
      await User.findByIdAndUpdate(violation.userId, {
        active: false,
        $inc: { violationCount: 1 },
        lastViolationAt: new Date(),
      });

      // Thông báo cho người bị ban
      await NotificationService.createAndEmitNotification({
        recipient: violation.userId,
        sender: req.user._id,
        type: "USER_BANNED",
        title: "Tài khoản bị tạm ngưng",
        message: `Tài khoản của bạn đã bị tạm ngưng do vi phạm nguyên tắc cộng đồng.`,
        data: {
          violationId: violation._id,
          reason: violation.reason,
          action: "banned",
        },
        priority: "urgent",
        url: `/support`,
      });
    }

    // Thông báo cho admin về việc xử lý hoàn tất
    await NotificationService.emitNotificationToAdmins({
      recipient: null,
      sender: req.user._id,
      type: "REPORT_RESOLVED",
      title: "Báo cáo đã được xử lý",
      message: `Báo cáo #${violation._id} đã được ${
        req.user.fullName || req.user.username
      } xử lý.`,
      data: {
        violationId: violation._id,
        actionTaken: actionTaken,
        resolvedBy: req.user._id,
      },
      priority: "medium",
      url: `/admin/reports/${violation._id}`,
    });

    return res.status(200).json({
      success: true,
      data: updatedViolation,
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật báo cáo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật báo cáo",
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  getAllPosts,
  getPostById,
  deletePost,
  getAllJournals,
  getJournalById,
  deleteJournal,
  getAllGroups,
  getGroupById,
  deleteGroup,
  getAllComments,
  deleteComment,
  getAllNotifications,
  createNotification,
  deleteNotification,
  getUserReports,
  getPostReports,
  getActivityReports,
  getPostViolation,
  updateViolationStatus,
};
