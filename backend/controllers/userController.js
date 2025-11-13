// controllers/userController.js
const User = require("../models/User");
const Post = require("../models/Post");
const Journal = require("../models/Journal");
const Chat = require("../models/Chat");
const GroupMember = require("../models/GroupMember");
const Comment = require("../models/Comment");
const Message = require("../models/Message");
const MoodLog = require("../models/MoodLog");
const Violation = require("../models/Violation");
const NotificationService = require("../services/notificationService");
const Friend = require("../models/Friend");
const Follow = require("../models/Follow");
const mailService = require("../services/mailService");
const { logUserActivity } = require("../logging/userActivityLogger");

class UserController {
  // [GET] /api/users/me - Lấy thông tin user hiện tại
  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      const [countPost, countFriends, countFollowers, countFollowing] =
        await Promise.all([
          Post.countDocuments({
            userCreateID: user._id,
            isBlocked: false,
          }),
          Friend.countDocuments({
            $or: [{ userA: user._id }, { userB: user._id }],
          }),
          Follow.countDocuments({
            following: user._id,
          }),
          Follow.countDocuments({
            follower: user._id,
          }),
        ]);

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
            countFriends: countFriends,
            countFollowers: countFollowers,
            countFollowing: countFollowing,
            settings: user.settings,
            showOnlineStatus: user.showOnlineStatus,
            allowFriendRequests: user.allowFriendRequests,
            allowMessages: user.allowMessages,
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
  }

  // [GET] /api/users/dashboard - Thống kê dashboard
  async getDashboard(req, res) {
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Không có userId trong token!",
        });
      }

      const { day = 7 } = req.query;
      const dayNumber = parseInt(day);

      const [
        totalPosts,
        totalJournals,
        totalGroups,
        totalComments,
        totalMessages,
        recentPosts,
        moodStats,
      ] = await Promise.all([
        Post.countDocuments({ userCreateID: userId }),
        Journal.countDocuments({ userId: userId }),
        GroupMember.countDocuments({ userId: userId }),
        Comment.countDocuments({ userID: userId }),
        Message.countDocuments({ sender: userId }),
        Post.find({ userCreateID: userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("userCreateID", "username fullName"),
        MoodLog.aggregate([
          {
            $match: {
              userId: userId,
            },
          },
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

      // Thống kê theo thời gian
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - dayNumber);

      const [newPostsThisWeek, newJournalsThisWeek] = await Promise.all([
        Post.countDocuments({
          createdAt: { $gte: daysAgo },
          userCreateID: userId,
        }),
        Journal.countDocuments({
          createdAt: { $gte: daysAgo },
          userId: userId,
        }),
      ]);

      const responseData = {
        success: true,
        data: {
          overview: {
            totalPosts,
            totalJournals,
            totalGroups,
            totalComments,
            totalMessages,
          },
          weeklyStats: {
            newPosts: newPostsThisWeek,
            newJournals: newJournalsThisWeek,
          },
          recentActivity: {
            posts: recentPosts,
          },
          moodStats,
        },
      };

      // Log cho Thống kê
      logUserActivity({
        action: "user.dashboard.view",
        req,
        res,
        userId,
        role: req.user.role,
        target: { type: "dashboard", id: userId },
        description: "Xem thống kê dashboard",
        payload: {
          period: `${dayNumber}days`,
          totalPosts,
          newPostsThisWeek,
          totalJournals,
          newJournalsThisWeek,
          moodStatsCount: moodStats.length,
        },
        meta: { source: "api", view: "dashboard" },
      });

      res.json(responseData);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê dashboard",
        error: error.message,
      });
    }
  }

  // thống kê
  async getUserDashboard(req, res) {
    try {
      const userId = req.user.userId;
      const { period = "7days" } = req.query;

      let dateFilter = {};
      const now = new Date();

      switch (period) {
        case "7days":
          dateFilter = {
            createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) },
          };
          break;
        case "30days":
          dateFilter = {
            createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) },
          };
          break;
        case "90days":
          dateFilter = {
            createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) },
          };
          break;
        case "all":
        default:
          dateFilter = {};
      }

      const userFilter = { userCreateID: userId };
      const journalFilter = { userId: userId };
      const commentFilter = { userID: userId };
      const messageFilter = { sender: userId };

      const [
        totalPosts,
        totalJournals,
        totalGroups,
        totalComments,
        totalMessages,
        recentPosts,
        moodStats,
        timelineStats,
      ] = await Promise.all([
        Post.countDocuments(userFilter),
        Journal.countDocuments(journalFilter),
        GroupMember.countDocuments({ userId: userId }),
        Comment.countDocuments(commentFilter),
        Message.countDocuments(messageFilter),
        Post.find(userFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("userCreateID", "username avatar")
          .select("content likes comments createdAt"),
        MoodLog.aggregate([
          {
            $match: {
              userId: userId,
              ...(period !== "all" && { createdAt: dateFilter.createdAt }),
            },
          },
          {
            $group: {
              _id: "$emotion",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        this.getUserTimelineStats(userId, period),
      ]);

      // Thống kê tuần này
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [newPostsThisWeek, newJournalsThisWeek] = await Promise.all([
        Post.countDocuments({
          createdAt: { $gte: sevenDaysAgo },
          userCreateID: userId,
        }),
        Journal.countDocuments({
          createdAt: { $gte: sevenDaysAgo },
          userId: userId,
        }),
      ]);

      // Log cho Thống kê
      logUserActivity({
        action: "user.dashboard.view",
        req,
        res,
        userId,
        role: req.user.userId,
        target: { type: "dashboard", id: userId },
        description: "Xem thống kê dashboard",
        payload: {
          period: `${dayNumber}days`,
          totalPosts,
          newPostsThisWeek,
          totalJournals,
          totalComments,
          totalGroups,
          newJournalsThisWeek,
          moodStatsCount: moodStats.length,
          totalMessages,
        },
        meta: { source: "api", view: "dashboard" },
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalPosts,
            totalJournals,
            totalGroups,
            totalComments,
            totalMessages,
          },
          weeklyStats: {
            newPosts: newPostsThisWeek,
            newJournals: newJournalsThisWeek,
          },
          recentActivity: {
            posts: recentPosts,
          },
          moodStats,
          timelineStats,
          filter: {
            period,
            label: this.getPeriodLabel(period),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê dashboard",
        error: error.message,
      });
    }
  }

  async getUserTimelineStats(userId, period) {
    const format = this.getDateFormat(period);
    const matchStage = this.getMatchStage(period);

    const [postsTimeline, journalsTimeline, commentsTimeline] =
      await Promise.all([
        Post.aggregate([
          {
            $match: {
              userCreateID: userId,
              ...matchStage,
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: format, date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Journal.aggregate([
          {
            $match: {
              userId: userId,
              ...matchStage,
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: format, date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Comment.aggregate([
          {
            $match: {
              userID: userId,
              ...matchStage,
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: format, date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    return {
      posts: postsTimeline,
      journals: journalsTimeline,
      comments: commentsTimeline,
    };
  }

  getDateFormat(period) {
    switch (period) {
      case "7days":
        return "%Y-%m-%d";
      case "30days":
        return "%Y-%m-%d";
      case "90days":
        return "%Y-%m-%d";
      case "all":
        return "%Y-%m";
      default:
        return "%Y-%m-%d";
    }
  }

  getMatchStage(period) {
    const now = new Date();
    switch (period) {
      case "7days":
        return {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) },
        };
      case "30days":
        return {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) },
        };
      case "90days":
        return {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) },
        };
      case "all":
        return {};
      default:
        return {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) },
        };
    }
  }

  getPeriodLabel(period) {
    const labels = {
      "7days": "7 ngày qua",
      "30days": "30 ngày qua",
      "90days": "90 ngày qua",
      all: "Tất cả",
    };
    return labels[period] || "7 ngày qua";
  }

  // [GET] /api/users/:userId - Lấy thông tin user bằng ID
  async getUserById(req, res) {
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

      const [
        countPost,
        countChat,
        countFriends,
        countFollowers,
        countFollowing,
      ] = await Promise.all([
        Post.countDocuments({
          userCreateID: user._id,
          isBlocked: false,
        }),
        Chat.countDocuments({
          members: user._id,
        }),
        Friend.countDocuments({
          $or: [{ userA: user._id }, { userB: user._id }],
        }),
        Follow.countDocuments({
          following: user._id,
        }),
        Follow.countDocuments({
          follower: user._id,
        }),
      ]);

      // Lấy Danh Sách BẠN  BÈ

      const isFriend = await Friend.find({
        $or: [
          { userA: req.user.userId, userB: user._id },
          { userA: user._id, userB: req.user.userId },
        ],
      });
      console.log("isFriend: ", isFriend);

      let checkViewProfile = true;
      if (user.settings.profileVisibility === "private") {
        checkViewProfile = false;
      } else if (user.settings.profileVisibility === "friends") {
        if (req.user.userId !== req.params.userId && !(isFriend.length > 0)) {
          checkViewProfile = false;
        }
      }

      console.log("checkViewProfile: ", checkViewProfile);

      const userDoc = user.toObject();
      userDoc.countPost = countPost;
      userDoc.countChat = countChat;
      userDoc.countFriends = countFriends;
      userDoc.countFollowers = countFollowers;
      userDoc.countFollowing = countFollowing;
      userDoc.isFriend = isFriend.length > 0;

      userDoc.checkViewProfile = checkViewProfile;

      // log lấy us theo id
      logUserActivity({
        action: "user.profile.view.other",
        req,
        res,
        userId: req.user.userId,
        role: req.user.role,
        target: { type: "user", id: req.params.userId },
        description: "Xem hồ sơ người khác",
        payload: {
          countPost,
          countFriends,
          isSelf: req.user.userId === req.params.userId,
        },
        meta: { source: "api", view: "profile" },
      });

      res.json({
        success: true,
        data: userDoc,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin user",
        error: error.message,
      });
    }
  }

  // [GET] /api/users/username/:userName - Lấy thông tin user bằng username
  async getUserByUsername(req, res) {
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

      // log lấy use theo UserName
      logUserActivity({
        action: "user.profile.view.byUsername",
        req,
        res,
        userId: req.user.userId,
        target: { type: "user", id: user._id },
        description: "Xem hồ sơ bằng username",
        payload: { username: userName },
        meta: { source: "api" },
      });
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
  }

  // [GET] /api/users - Lấy danh sách users (trừ user hiện tại)
  async getUsers(req, res) {
    try {
      const currentUserId = req.user.userId;
      const { search, role, page = 1, limit = 20 } = req.query;

      let query = { _id: { $ne: currentUserId } };

      // Tìm kiếm theo @ username hoặc fullname
      if (search) {
        if (search.startsWith("@")) {
          // Nếu bắt đầu bằng @, chỉ tìm theo username
          const usernameSearch = search.slice(1); // Bỏ ký tự @ ở đầu
          query.username = { $regex: usernameSearch, $options: "i" };
        } else {
          // Không có @, tìm cả username và fullname
          query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
          ];
        }
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

      // Log tìm kiếm người dùng
      logUserActivity({
        action: "user.search",
        req,
        res,
        userId: currentUserId,
        target: { type: "user.list" },
        description: "Tìm kiếm người dùng",
        payload: { search, role, page, limit, results: users.length, total },
        meta: { source: "api" },
      });

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
  }

  // [GET] /api/users/public - Public search for users (no auth required)
  async getUsersPublic(req, res) {
    try {
      const { search, role, page = 1, limit = 20 } = req.query;

      let query = {};

      // Tìm kiếm theo @ username hoặc fullname
      if (search) {
        if (search.startsWith("@")) {
          const usernameSearch = search.slice(1);
          query.username = { $regex: usernameSearch, $options: "i" };
        } else {
          query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
          ];
        }
      }

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
        message: "Lỗi khi tìm kiếm users (public)",
        error: error.message,
      });
    }
  }

  // [PUT] /api/users/profile - Cập nhật profile
  async updateProfile(req, res) {
    try {
      const { fullName, bio, interests, skills } = req.body;

      const userId = req.user.userId;

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

        // Tạo URL cho avatar mới
        const fileUrl = `/api/uploads/images/${file.filename}`;
        updateData["profile.avatar"] = fileUrl;
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");

      // Log Cập nhật hồ sơ

      logUserActivity({
        action: "user.profile.update",
        req,
        res,
        userId,
        target: { type: "user", id: userId },
        description: "Cập nhật hồ sơ",
        payload: {
          updatedFields: Object.keys(updateData),
          hasAvatar: !!req.file,
          hasBio: bio !== undefined,
          fullName,
          interests,
          skills,
        },
        meta: { source: "api" },
      });

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
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin",
        error: error.message,
      });
    }
  }

  // [PUT] /api/users/online-status - Cập nhật trạng thái online
  async updateOnlineStatus(req, res) {
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
  }

  // [GET] /api/users/supporters/list - Lấy danh sách supporters
  async getSupporters(req, res) {
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
  }

  // [GET] /api/users/admin/stats - Thống kê admin
  async getAdminStats(req, res) {
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
  }

  async reportUser(req, res) {
    try {
      const {
        targetType = "User",
        targetId,
        reason,
        notes,
        status = "pending",
      } = req.body;

      const userCurrentId = req.user.userId;

      let files = [];
      if (req.files) {
        files = req.files.map((file) => {
          let fileFolder = "documents";
          if (file.mimetype.startsWith("image/")) {
            fileFolder = "images";
          } else if (file.mimetype.startsWith("video/")) {
            fileFolder = "videos";
          } else if (file.mimetype.startsWith("audio/")) {
            fileFolder = "audio";
          }

          const fileUrl = `/api/uploads/${fileFolder}/${file.filename}`;

          let messageType = "file";
          if (file.mimetype.startsWith("image/")) {
            messageType = "image";
          } else if (file.mimetype.startsWith("video/")) {
            messageType = "video";
          } else if (file.mimetype.startsWith("audio/")) {
            messageType = "audio";
          }

          return {
            type: messageType,
            fileUrl: fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
          };
        });
      }

      if (!targetId || !reason) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu thông tin bắt buộc để báo cáo targetId: " +
            targetId +
            " - reason: " +
            reason,
        });
      }

      const user = await User.findById(targetId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Không tìm thấy user với  targetId: " + targetId,
        });
      }

      // tạo bản ghi mới
      const newViolation = new Violation({
        targetType: targetType,
        targetId: targetId, // id đối tượng
        reason: reason,
        notes: notes,
        status: status,
        files: files,
        userId: targetId, // người bị báo cáo của bài viết
        reportedBy: userCurrentId, // ngừời báo cáo
      });

      await newViolation.save();

      await AddViolationUserByID(user._id, newViolation, userCurrentId, false);

      const reporter = await User.findById(userCurrentId);

      // 1. Gửi thông báo real-time cho admin
      await NotificationService.emitNotificationToAdmins({
        recipient: null, // Gửi cho tất cả admin
        sender: userCurrentId,
        type: "REPORT_CREATED",
        title: "Báo cáo mới cần xử lý",
        message: `Người Dùng đã được báo cáo với lý do: ${reason}`,
        data: {
          violationId: newViolation._id,
          postId: targetId,
          reporterId: userCurrentId,
          reporterName: reporter.fullName || reporter.username,
          reason: reason,
        },
        priority: "high",
        url: `/admin/reports/users/${newViolation._id}`,
      });

      // 2. Gửi thông báo cho TÀI KHOẢN (nếu cần)
      await NotificationService.createAndEmitNotification({
        recipient: newViolation.userId,
        sender: userCurrentId,
        type: "USER_WARNED",
        title: "Bạn đã bị báo cáo",
        message: `Bạn đã được báo cáo vì: ${reason}. Chúng tôi sẽ xem xét và thông báo kết quả.`,
        data: {
          violationId: newViolation._id,
          postId: targetId,
          reason: reason,
        },
        priority: "medium",
        url: `/profile/${targetId}`,
      });

      // Log Báo cáo người dùng
      logUserActivity({
        action: "user.report",
        req,
        res,
        userId: userCurrentId,
        role: req.user.role,
        target: { type: "user", id: targetId },
        description: "Báo cáo người dùng",
        payload: {
          reason,
          hasFiles: files.length > 0,
          violationId: newViolation._id,
          targetUserId: targetId,
        },
        meta: { source: "api", sensitive: true },
      });

      return res.json({
        success: true,
        message: "Báo cáo đã được gửi thành công",
        data: newViolation,
      });
    } catch (error) {
      console.log("Lỗi khi báo cáo user: ", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê",
        error: error.message,
      });
    }
  }
}

// Thêm vi phạm cho user theo ID
async function AddViolationUserByID(
  userId,
  violation,
  userAdminId,
  banUser = false
) {
  try {
    if (!userId) return;
    const user = await User.findById(userId);
    if (!user) {
      console.warn("AddViolationUserByID: user not found", userId);
      return;
    }
    const newCount = (user.violationCount || 0) + 1;
    let isActive = newCount <= 5;
    if (banUser || !isActive) {
      isActive = false;
      const vio = await Violation.findById(violation._id);

      vio.status = "auto";
      vio.actionTaken = "auto_baned";

      await vio.save();
    }

    await User.findByIdAndUpdate(userId, {
      active: isActive,
      violationCount: newCount,
      lastViolationAt: new Date(),
    });

    // Thông báo khi bị ban/tạm khoá
    if (!isActive) {
      await NotificationService.createAndEmitNotification({
        recipient: userId,
        sender: userAdminId,
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

    // Gửi email khi bị ban/tạm khoá
    const admin = await User.findById(userAdminId);
    if (!admin) {
      console.warn("AddViolationUserByID: admin not found", userAdminId);
      return;
    }
    await mailService.sendEmail({
      to: user.email,
      subject: "🚫 Tài Khoản Của Bạn Đã Bị Khoá - Autism Support",
      templateName: "USER_BANNED",
      templateData: {
        userName: user.fullName || user.username,
        violationReason: violation.reason,
        severityLevel: "Nghiêm trọng",
        actionTime: new Date().toLocaleString("vi-VN"),
        adminName: admin.fullName || admin.username,
        details: "Tài khoản vi phạm nguyên tắc cộng đồng và đã bị khoá",
      },
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật violation user:", err);
  }
}

module.exports = new UserController();
