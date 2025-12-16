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
const Todo = require("../models/Todo");
const mailService = require("../services/mailService");
const ImageBackground = require("../models/ImageBackground");
const { logUserActivity } = require("../logging/userActivityLogger");
const QRService = require("../services/qrService");

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
            checkInStreak: user.checkInStreak, // ✅ SỬA: Trả về chuỗi ngày điểm danh
            journalStreak: user.journalStreak, // ✅ THÊM: Trả về chuỗi ngày viết nhật ký
            lastCheckInDate: user.lastCheckInDate, // ✅ THÊM: Trả về ngày điểm danh cuối
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

  async getUserTimelineStats(userId, period) {
    try {
      console.log("🔍 getUserTimelineStats called with:", { userId, period });

      // Lấy dữ liệu thô từ database
      const [posts, journals, comments, moods] = await Promise.all([
        Post.find({
          userCreateID: userId,
          ...getMatchStage(period),
        }).lean(),

        Journal.find({
          userId: userId,
          ...getMatchStage(period),
        }).lean(),

        Comment.find({
          userID: userId,
          ...getMatchStage(period),
        }).lean(),

        MoodLog.find({
          userId: userId,
          ...getMatchStage(period),
        }).lean(),
      ]);

      console.log("📊 Raw data counts:", {
        posts: posts.length,
        journals: journals.length,
        comments: comments.length,
        moods: moods.length,
      });
      function formatDateByPeriod(date, period) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        switch (period) {
          case "7days":
          case "30days":
          case "90days":
            return `${year}-${month}-${day}`;
          case "all":
            return `${year}-${month}`;
          default:
            return `${year}-${month}-${day}`;
        }
      }
      // Xử lý dữ liệu timeline bằng JavaScript thuần
      const processTimelineData = (data) => {
        const grouped = {};

        data.forEach((item) => {
          const date = new Date(item.createdAt);
          const dateKey = formatDateByPeriod(date, period);

          if (dateKey) {
            grouped[dateKey] = (grouped[dateKey] || 0) + 1;
          }
        });

        // Chuyển thành mảng và sắp xếp
        return Object.entries(grouped)
          .map(([_id, count]) => ({ _id, count }))
          .sort((a, b) => a._id.localeCompare(b._id));
      };

      const postsTimeline = processTimelineData(posts);
      const journalsTimeline = processTimelineData(journals);
      const commentsTimeline = processTimelineData(comments);
      const moodsTimeline = processTimelineData(moods);

      console.log("📈 Processed timeline results:", {
        posts: postsTimeline.length,
        journals: journalsTimeline.length,
        comments: commentsTimeline.length,
        moods: moodsTimeline.length,
      });

      // Điền đầy đủ các ngày thiếu trong timeline
      const filledTimeline = fillTimelineGaps(
        {
          posts: postsTimeline,
          journals: journalsTimeline,
          comments: commentsTimeline,
          moods: moodsTimeline,
        },
        period
      );

      return filledTimeline;
    } catch (error) {
      console.error("💥 getUserTimelineStats error:", error);
      return {
        posts: [],
        journals: [],
        comments: [],
        moods: [],
      };
    }
  }

  // Hàm điền khoảng trống timeline
  fillTimelineGaps(timelineData, period) {
    const { posts, journals, comments, moods } = timelineData;

    // Tạo danh sách tất cả các ngày trong khoảng thời gian
    const allDates = generateDateRange(period);

    // Hàm điền dữ liệu cho một loại
    const fillData = (data) => {
      const dataMap = new Map(data.map((item) => [item._id, item.count]));
      return allDates.map((date) => ({
        _id: date,
        count: dataMap.get(date) || 0,
      }));
    };

    return {
      posts: fillData(posts),
      journals: fillData(journals),
      comments: fillData(comments),
      moods: fillData(moods),
    };
  }

  // Hàm tạo danh sách ngày trong khoảng thời gian
  generateDateRange(period) {
    const dates = [];
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "all":
        // Cho tất cả, có thể giới hạn 6 tháng gần nhất
        startDate.setMonth(now.getMonth() - 6);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const current = new Date(startDate);
    const format = getDateFormat(period);

    while (current <= now) {
      let dateKey;

      if (format === "%Y-%m-%d") {
        dateKey = current.toISOString().split("T")[0];
      } else if (format === "%Y-%m") {
        dateKey = `${current.getFullYear()}-${String(
          current.getMonth() + 1
        ).padStart(2, "0")}`;
      }

      if (dateKey && !dates.includes(dateKey)) {
        dates.push(dateKey);
      }

      if (format === "%Y-%m-%d") {
        current.setDate(current.getDate() + 1);
      } else if (format === "%Y-%m") {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return dates;
  }

  // Hàm getDateFormat
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

  // Hàm getMatchStage
  getMatchStage(period) {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "all":
        return {}; // Không filter theo thời gian
      default:
        startDate.setDate(now.getDate() - 7);
    }

    return {
      createdAt: {
        $gte: startDate,
        $lte: now,
      },
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
      // console.log("isFriend: ", isFriend);

      let checkViewProfile = true;
      if (user.settings.profileVisibility === "private") {
        checkViewProfile = false;
      } else if (user.settings.profileVisibility === "friends") {
        if (req.user.userId !== req.params.userId && !(isFriend.length > 0)) {
          checkViewProfile = false;
        }
      }

      // console.log("checkViewProfile: ", checkViewProfile);

      const userDoc = user.toObject();
      userDoc.countPost = countPost;
      userDoc.countChat = countChat;
      userDoc.countFriends = countFriends;
      userDoc.countFollowers = countFollowers;
      userDoc.countFollowing = countFollowing;

      userDoc.isFriend = isFriend.length > 0;

      userDoc.checkViewProfile = checkViewProfile;

      if (!user.profile.coverPhoto) {
        const imageCover = await ImageBackground.findOne({
          active: true,
          category: "BannerUser",
        });

        // console.log(imageCover);
        userDoc.banner = imageCover.file.path;
      }

      userDoc.checkInStreak = user.checkInStreak; // ✅ SỬA
      userDoc.journalStreak = user.journalStreak; // ✅ THÊM

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
          userId: targetId,
          reporterId: userCurrentId,
          reporterName: reporter.fullName || reporter.username,
          reason: reason,
        },
        priority: "high",
        url: `/admin/users/reports/${newViolation._id}`,
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
  // Hàm hỗ trợ - Thống kê dòng thời gian
  // [GET] /api/users/dashboard - Thống kê dashboard nâng cao

  // controllers/userController.js

  // [GET] /api/users/dashboard - Thống kê dashboard nâng cao
  async getDashboard(req, res) {
    try {
      const userId = req.user.userId;
      const { period = "7days" } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Không có userId trong token!",
        });
      }

      // Tính toán thời gian
      const { startDate, endDate } = calculateDateRange(period);

      // Fetch tất cả dữ liệu song song
      const [
        overview,
        periodStats,
        recentPosts,
        journals,
        todos,
        emotionAnalytics,
        behaviorStats,
        socialSupportStats,
        safetyStats,
        timelineStats,
      ] = await Promise.all([
        getOverviewStats(userId),
        getPeriodStats(userId, startDate, endDate),
        getRecentPosts(userId),
        Journal.find({
          userId,
          createdAt: { $gte: startDate, $lte: endDate },
        }).lean(),
        Todo.find({
          createdBy: userId,
          createdAt: { $gte: startDate, $lte: endDate },
        }).lean(),
        calculateEmotionAnalytics(userId, startDate, endDate, period),
        calculateBehaviorStats(userId, startDate, endDate),
        calculateSocialSupportStats(userId, startDate, endDate),
        calculateSafetyStats(userId, startDate, endDate),
        getUserTimelineStats(userId, period),
      ]);

      // Xử lý dữ liệu journal và todo
      const journalAnalytics = calculateJournalAnalytics(journals);
      const personalGrowth = calculatePersonalGrowth(todos);

      // Tạo insights
      const insights = generatePersonalizedInsights({
        moodData: emotionAnalytics.moodDistribution,
        journalData: journalAnalytics,
        behaviorData: behaviorStats,
        socialData: socialSupportStats,
        periodStats,
        personalGrowth,
      });

      // Log activity
      logUserActivity({
        action: "user.dashboard.view",
        req,
        res,
        userId,
        role: req.user.role,
        target: { type: "dashboard", id: userId },
        description: "Xem thống kê dashboard nâng cao",
        payload: {
          period,
          emotionCount: emotionAnalytics.moodDistribution.length,
          journalEntries: journalAnalytics.totalEntries,
          completedTasks: personalGrowth.completedTasks,
        },
        meta: { source: "api", view: "dashboard_enhanced" },
      });

      // Response
      return res.json({
        success: true,
        data: {
          overview,
          periodStats,
          emotionAnalytics,
          journalAnalytics,
          personalGrowth,
          behaviorAnalytics: behaviorStats,
          socialSupport: socialSupportStats,
          safetyAnalytics: safetyStats,
          timelineStats,
          recentActivity: { posts: recentPosts },
          insights,
          filter: { period, label: PERIOD_LABELS[period] || "7 ngày qua" },
        },
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê dashboard",
        error: error.message,
      });
    }
  }

  // ===================================================================== QR CODE
  // [GET] /api/users/:userId/qr - Lấy QR code của user
  async getUserQR(req, res) {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      const profileUrl = `${process.env.FRONTEND_URL}/profile/${user._id}`;

      // KIỂM TRA THEO SCHEMA MỚI
      if (!user.qrCode || !user.qrCode.dataURL) {
        console.log("🆕 Tạo QR code mới cho user:", user.username);
        user.qrCode = await QRService.generatePermanentQR(profileUrl);
        await user.save();
      }

      // RESPONSE PHÙ HỢP
      res.json({
        success: true,
        data: {
          qrDataURL: user.qrCode.dataURL,
          profileUrl: user.qrCode.data,
          user: {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
          },
        },
      });
    } catch (error) {
      console.error("Error getting user QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy QR code",
        error: error.message,
      });
    }
  }

  /**
   * Cập nhật QR code - CHỈ ADMIN HOẶC BẢN THÂN USER
   * TẠO LẠI QR CODE MỚI
   */
  async updateUserQR(req, res) {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // CHỈ admin hoặc chính user đó
      const isOwner = req.user.userId === user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin hoặc chủ tài khoản mới có thể cập nhật QR code",
        });
      }

      const { options = {} } = req.body;
      const profileUrl = `${process.env.FRONTEND_URL}/profile/${user._id}`;

      // TẠO QR CODE MỚI VĨNH VIỄN
      const newQRData = await QRService.generatePermanentQR(profileUrl, {
        color: {
          dark: "#1a56db",
          light: "#ffffff",
        },
        ...options,
      });

      // CẬP NHẬT VÀO DATABASE
      user.qrCode = newQRData;
      await user.save();

      console.log("🔄 Đã cập nhật QR code cho user:", user.username);

      res.json({
        success: true,
        message: "QR code đã được cập nhật thành công",
        data: {
          qrDataURL: newQRData.dataURL,
          updatedBy: isAdmin ? "admin" : "owner",
          // ❌ BỎ: info: QRService.getQRInfo(newQRData)
        },
      });
    } catch (error) {
      console.error("Error updating user QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật QR code",
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

const MOOD_COLORS = {
  happy: "#28a745",
  sad: "#17a2b8",
  angry: "#dc3545",
  anxious: "#ffc107",
  excited: "#e83e8c",
  tired: "#6f42c1",
  neutral: "#20c997",
  fearful: "#fd7e14",
  disgusted: "#6610f2",
  surprised: "#007bff",
};

const PERIOD_LABELS = {
  "7days": "7 ngày qua",
  "30days": "30 ngày qua",
  "90days": "90 ngày qua",
  all: "Tất cả thời gian",
};

const DAY_OF_WEEK_MAP = {
  0: "Chủ nhật",
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Tính toán khoảng thời gian dựa trên period
 */
function calculateDateRange(period) {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case "7days":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30days":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90days":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "all":
      startDate = new Date(0);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  return { startDate, endDate };
}

/**
 * Lấy format ngày theo period
 */
function getDateFormat(period) {
  return period === "all" ? "%Y-%m" : "%Y-%m-%d";
}

/**
 * Format ngày để hiển thị
 */
function formatDateForDisplay(dateString, period) {
  const date = new Date(dateString);
  if (period === "all") {
    return date.toLocaleDateString("vi-VN", {
      month: "2-digit",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

/**
 * Format ngày theo period để grouping
 */
function formatDateByPeriod(date, period) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return period === "all" ? `${year}-${month}` : `${year}-${month}-${day}`;
}

/**
 * Lấy màu cho emotion
 */
function getMoodColor(emotion) {
  return MOOD_COLORS[emotion?.toLowerCase()] || "#007bff";
}

// ==================== DATA FETCHING FUNCTIONS ====================

/**
 * Lấy thống kê tổng quan cơ bản
 */
async function getOverviewStats(userId) {
  const [totalPosts, totalJournals, totalGroups, totalComments, totalMessages] =
    await Promise.all([
      Post.countDocuments({ userCreateID: userId }),
      Journal.countDocuments({ userId }),
      GroupMember.countDocuments({ userId }),
      Comment.countDocuments({ userID: userId }),
      Message.countDocuments({ sender: userId }),
    ]);

  return {
    totalPosts,
    totalJournals,
    totalGroups,
    totalComments,
    totalMessages,
  };
}

/**
 * Lấy thống kê trong kỳ
 */
async function getPeriodStats(userId, startDate, endDate) {
  const dateFilter = { $gte: startDate, $lte: endDate };

  const [newPosts, newJournals, newMoodLogs, newComments] = await Promise.all([
    Post.countDocuments({ userCreateID: userId, createdAt: dateFilter }),
    Journal.countDocuments({ userId, createdAt: dateFilter }),
    MoodLog.countDocuments({ userId, createdAt: dateFilter }),
    Comment.countDocuments({ userID: userId, createdAt: dateFilter }),
  ]);

  return { newPosts, newJournals, newMoodLogs, newComments };
}

/**
 * Lấy bài viết gần đây
 */
async function getRecentPosts(userId, limit = 5) {
  return Post.find({ userCreateID: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userCreateID", "username fullName avatar")
    .select("content likes comments createdAt emotionTags files")
    .lean();
}

// ==================== EMOTION ANALYTICS ====================

/**
 * Lấy dữ liệu cảm xúc thô từ database
 */
async function getRawEmotionData(userId, startDate, endDate) {
  const dateFilter = { $gte: startDate, $lte: endDate };

  const [moodLogs, journals, posts] = await Promise.all([
    MoodLog.find({ userId, createdAt: dateFilter }).lean(),
    Journal.find({
      userId,
      createdAt: dateFilter,
      emotions: { $exists: true, $ne: [] },
    }).lean(),
    Post.find({
      userCreateID: userId,
      createdAt: dateFilter,
      emotionTags: { $exists: true, $ne: [] },
    }).lean(),
  ]);

  return { moodLogs, journals, posts };
}

/**
 * Tính toán phân bố cảm xúc
 */
function calculateMoodDistribution(rawData) {
  const { moodLogs, journals, posts } = rawData;
  const emotionMap = new Map();

  // Xử lý mood logs
  moodLogs.forEach((log) => {
    const emotion = log.emotion?.toLowerCase() || "neutral";
    const intensity = log.intensity || 0.5;
    updateEmotionMap(emotionMap, emotion, intensity, "moodlog");
  });

  // Xử lý journal emotions
  journals.forEach((journal) => {
    (journal.emotions || []).forEach((emotion) => {
      updateEmotionMap(
        emotionMap,
        emotion?.toLowerCase() || "neutral",
        0.5,
        "journal"
      );
    });
  });

  // Xử lý post emotionTags
  posts.forEach((post) => {
    (post.emotionTags || []).forEach((emotion) => {
      updateEmotionMap(
        emotionMap,
        emotion?.toLowerCase() || "neutral",
        0.5,
        "post"
      );
    });
  });

  return buildDistributionFromMap(emotionMap);
}

function updateEmotionMap(emotionMap, emotion, intensity, source) {
  if (emotionMap.has(emotion)) {
    const existing = emotionMap.get(emotion);
    existing.count += 1;
    existing.totalIntensity += intensity;
    existing.intensities.push(intensity);
    if (!existing.sources.includes(source)) existing.sources.push(source);
  } else {
    emotionMap.set(emotion, {
      emotion,
      count: 1,
      totalIntensity: intensity,
      intensities: [intensity],
      sources: [source],
    });
  }
}

function buildDistributionFromMap(emotionMap) {
  const totalCount = Array.from(emotionMap.values()).reduce(
    (sum, item) => sum + item.count,
    0
  );

  return Array.from(emotionMap.values())
    .map((item) => {
      const avgIntensity = item.totalIntensity / item.count;
      const variance =
        item.intensities.reduce(
          (sum, i) => sum + Math.pow(i - avgIntensity, 2),
          0
        ) / item.intensities.length;

      return {
        emotion: item.emotion,
        count: item.count,
        avgIntensity: parseFloat(avgIntensity.toFixed(2)),
        minIntensity: parseFloat(Math.min(...item.intensities).toFixed(2)),
        maxIntensity: parseFloat(Math.max(...item.intensities).toFixed(2)),
        intensityStdDev: parseFloat(Math.sqrt(variance).toFixed(3)),
        percentage:
          totalCount > 0
            ? parseFloat(((item.count / totalCount) * 100).toFixed(1))
            : 0,
        color: getMoodColor(item.emotion),
        sources: item.sources,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Tính toán timeline cảm xúc
 */
function calculateMoodTimeline(rawData, period) {
  const { moodLogs } = rawData;
  if (moodLogs.length === 0) return [];

  const groupedData = {};

  moodLogs.forEach((log) => {
    const groupKey = formatDateByPeriod(new Date(log.createdAt), period);

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = { emotions: [], intensities: [] };
    }

    groupedData[groupKey].emotions.push(
      log.emotion?.toLowerCase() || "neutral"
    );
    groupedData[groupKey].intensities.push(log.intensity || 0.5);
  });

  return Object.entries(groupedData)
    .map(([dateKey, data]) => {
      const emotionCount = {};
      data.emotions.forEach(
        (e) => (emotionCount[e] = (emotionCount[e] || 0) + 1)
      );

      const dominantEmotion =
        Object.entries(emotionCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "neutral";

      return {
        date: formatDateForDisplay(dateKey, period),
        rawDate: dateKey,
        count: data.emotions.length,
        intensity: parseFloat(
          (
            data.intensities.reduce((a, b) => a + b, 0) /
            data.intensities.length
          ).toFixed(2)
        ),
        emotion: dominantEmotion,
        variety: new Set(data.emotions).size,
      };
    })
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
}

/**
 * Tính toán khoảnh khắc cảm xúc mạnh
 */
function calculateEmotionalPeaks(rawData) {
  const { moodLogs } = rawData;

  const peaks = moodLogs
    .filter((log) => (log.intensity || 0) >= 0.7)
    .map((log) => ({
      emotion: log.emotion?.toLowerCase() || "neutral",
      intensity: log.intensity || 0.5,
      timestamp: log.createdAt,
      description: log.description || `Cảm thấy ${log.emotion} mạnh mẽ`,
      trigger: log.trigger || "Không xác định",
      color: getMoodColor(log.emotion),
    }))
    .sort((a, b) => b.intensity - a.intensity);

  // Lấy peak cao nhất cho mỗi loại cảm xúc
  const groupedPeaks = peaks.reduce((acc, peak) => {
    if (!acc[peak.emotion] || peak.intensity > acc[peak.emotion].intensity) {
      acc[peak.emotion] = peak;
    }
    return acc;
  }, {});

  return Object.values(groupedPeaks)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 4);
}

/**
 * Tính toán mẫu cảm xúc theo ngày trong tuần
 */
function calculateEmotionPatterns(rawData) {
  const { moodLogs } = rawData;
  const patterns = {};

  moodLogs.forEach((log) => {
    const dayOfWeek = new Date(log.createdAt).getDay();
    const emotion = log.emotion?.toLowerCase() || "neutral";

    if (!patterns[dayOfWeek]) {
      patterns[dayOfWeek] = { emotions: {}, intensities: [], totalEntries: 0 };
    }

    patterns[dayOfWeek].emotions[emotion] =
      (patterns[dayOfWeek].emotions[emotion] || 0) + 1;
    patterns[dayOfWeek].intensities.push(log.intensity || 0.5);
    patterns[dayOfWeek].totalEntries++;
  });

  return Object.entries(patterns)
    .map(([dayNumber, data]) => {
      const emotions = Object.entries(data.emotions).sort(
        ([, a], [, b]) => b - a
      );
      const intensities = data.intensities;

      return {
        dayOfWeek: parseInt(dayNumber),
        dayName: DAY_OF_WEEK_MAP[dayNumber],
        dominantEmotion: emotions[0]?.[0] || "neutral",
        emotionalVariety: emotions.length,
        totalEntries: data.totalEntries,
        intensityRange: {
          min: Math.min(...intensities),
          max: Math.max(...intensities),
          avg: intensities.reduce((a, b) => a + b, 0) / intensities.length,
        },
      };
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/**
 * Phân tích cường độ cảm xúc
 */
function calculateIntensityAnalysis(rawData) {
  const { moodLogs } = rawData;
  const byEmotion = {};
  const allIntensities = [];

  moodLogs.forEach((log) => {
    const emotion = log.emotion?.toLowerCase() || "neutral";
    const intensity = log.intensity || 0.5;

    if (!byEmotion[emotion]) byEmotion[emotion] = { intensities: [], count: 0 };

    byEmotion[emotion].intensities.push(intensity);
    byEmotion[emotion].count++;
    allIntensities.push(intensity);
  });

  const emotionStats = Object.entries(byEmotion).map(([emotion, data]) => {
    const { intensities } = data;
    const avg = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const variance =
      intensities.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      intensities.length;
    const stdDev = Math.sqrt(variance);

    return {
      emotion,
      stats: {
        average: parseFloat(avg.toFixed(2)),
        minimum: Math.min(...intensities),
        maximum: Math.max(...intensities),
        variability: parseFloat(stdDev.toFixed(3)),
        stability:
          stdDev < 0.3 ? "stable" : stdDev < 0.6 ? "moderate" : "volatile",
      },
    };
  });

  const overallAvg =
    allIntensities.length > 0
      ? allIntensities.reduce((a, b) => a + b, 0) / allIntensities.length
      : 0;

  return {
    byEmotion: emotionStats.sort((a, b) => b.stats.average - a.stats.average),
    overall: {
      overallAvg: parseFloat(overallAvg.toFixed(2)),
      overallMin: allIntensities.length > 0 ? Math.min(...allIntensities) : 0,
      overallMax: allIntensities.length > 0 ? Math.max(...allIntensities) : 0,
      totalEntries: allIntensities.length,
    },
  };
}

/**
 * Tính xu hướng cảm xúc
 */
function calculateEmotionTrends(moodTimeline) {
  if (!moodTimeline || moodTimeline.length < 2) {
    return { trend: "stable", direction: "neutral", change: 0 };
  }

  const midPoint = Math.floor(moodTimeline.length / 2);
  const firstHalf = moodTimeline.slice(0, midPoint);
  const secondHalf = moodTimeline.slice(midPoint);

  const firstAvg =
    firstHalf.reduce((sum, d) => sum + (d.intensity || 0), 0) /
    firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + (d.intensity || 0), 0) /
    secondHalf.length;

  const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  return {
    trend:
      Math.abs(change) < 10
        ? "stable"
        : Math.abs(change) < 30
        ? "moderate"
        : "significant",
    direction: change > 0 ? "improving" : change < 0 ? "declining" : "neutral",
    change: Math.abs(parseFloat(change.toFixed(1))),
    currentAvg: parseFloat(secondAvg.toFixed(2)),
    previousAvg: parseFloat(firstAvg.toFixed(2)),
  };
}

/**
 * Phân tích cảm xúc theo thời gian trong ngày
 */
function calculateTimeOfDayAnalysis(rawData) {
  const { moodLogs } = rawData;

  const timeSlots = {
    morning: { hours: [5, 6, 7, 8, 9, 10, 11], emotions: [], intensities: [] },
    afternoon: { hours: [12, 13, 14, 15, 16], emotions: [], intensities: [] },
    evening: { hours: [17, 18, 19, 20, 21], emotions: [], intensities: [] },
    night: { hours: [22, 23, 0, 1, 2, 3, 4], emotions: [], intensities: [] },
  };

  moodLogs.forEach((log) => {
    const hour = new Date(log.createdAt).getHours();

    for (const [slot, data] of Object.entries(timeSlots)) {
      if (data.hours.includes(hour)) {
        data.emotions.push(log.emotion?.toLowerCase() || "neutral");
        data.intensities.push(log.intensity || 0.5);
        break;
      }
    }
  });

  return Object.entries(timeSlots)
    .map(([timeSlot, data]) => {
      if (data.emotions.length === 0) {
        return {
          timeOfDay: timeSlot,
          totalEntries: 0,
          avgIntensity: 0,
          dominantEmotion: "neutral",
          emotionDistribution: [],
        };
      }

      const emotionCount = {};
      data.emotions.forEach(
        (e) => (emotionCount[e] = (emotionCount[e] || 0) + 1)
      );

      return {
        timeOfDay: timeSlot,
        totalEntries: data.emotions.length,
        avgIntensity: parseFloat(
          (
            data.intensities.reduce((a, b) => a + b, 0) /
            data.intensities.length
          ).toFixed(2)
        ),
        dominantEmotion:
          Object.entries(emotionCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          "neutral",
        emotionDistribution: Object.entries(emotionCount)
          .map(([emotion, count]) => ({ emotion, count }))
          .sort((a, b) => b.count - a.count),
      };
    })
    .filter((slot) => slot.totalEntries > 0)
    .sort((a, b) => b.totalEntries - a.totalEntries);
}

/**
 * Tính toán tổng hợp emotion analytics
 */
async function calculateEmotionAnalytics(userId, startDate, endDate, period) {
  try {
    const rawData = await getRawEmotionData(userId, startDate, endDate);

    const moodDistribution = calculateMoodDistribution(rawData);
    const moodTimeline = calculateMoodTimeline(rawData, period);
    const emotionalPeaks = calculateEmotionalPeaks(rawData);
    const emotionPatterns = calculateEmotionPatterns(rawData);
    const intensityAnalysis = calculateIntensityAnalysis(rawData);
    const emotionTrends = calculateEmotionTrends(moodTimeline);
    const timeOfDayAnalysis = calculateTimeOfDayAnalysis(rawData);

    const dominantEmotions = moodDistribution.slice(0, 3).map((e) => ({
      emotion: e.emotion,
      count: e.count,
      percentage: e.percentage,
      intensity: e.avgIntensity,
      color: e.color,
    }));

    return {
      moodDistribution,
      moodTimeline,
      peakMoments: emotionalPeaks,
      dominantEmotions,
      emotionPatterns,
      intensityAnalysis,
      emotionTrends,
      timeOfDayAnalysis,
      summary: generateEmotionSummary(
        moodDistribution,
        emotionTrends,
        emotionalPeaks
      ),
    };
  } catch (error) {
    console.error("Error in calculateEmotionAnalytics:", error);
    return getDefaultEmotionAnalytics();
  }
}

function generateEmotionSummary(moodDistribution, trends, peaks) {
  const totalEntries = moodDistribution.reduce((sum, e) => sum + e.count, 0);
  const positiveEmotions = moodDistribution
    .filter((e) =>
      ["happy", "excited", "surprised", "neutral"].includes(e.emotion)
    )
    .reduce((sum, e) => sum + e.count, 0);

  const positiveRatio =
    totalEntries > 0 ? (positiveEmotions / totalEntries) * 100 : 0;

  let summary = "Xu hướng cảm xúc ổn định";
  if (trends.direction === "improving" && trends.change > 20) {
    summary = "Tâm trạng đang cải thiện tích cực";
  } else if (trends.direction === "declining" && trends.change > 20) {
    summary = "Cần quan tâm đến sức khỏe tinh thần";
  }

  return {
    summary,
    totalEntries,
    positiveRatio: Math.round(positiveRatio),
    emotionalBalance:
      positiveRatio > 60
        ? "positive"
        : positiveRatio > 40
        ? "balanced"
        : "needs_attention",
    peakMomentsCount: peaks.length,
  };
}

function getDefaultEmotionAnalytics() {
  return {
    moodDistribution: [],
    moodTimeline: [],
    peakMoments: [],
    dominantEmotions: [],
    emotionPatterns: [],
    intensityAnalysis: { byEmotion: [], overall: {} },
    emotionTrends: { trend: "stable", direction: "neutral", change: 0 },
    timeOfDayAnalysis: [],
    summary: {
      summary: "Chưa có đủ dữ liệu để phân tích",
      totalEntries: 0,
      positiveRatio: 0,
    },
  };
}

// ==================== JOURNAL ANALYTICS ====================

function calculateJournalAnalytics(journals) {
  if (!journals || journals.length === 0) {
    return {
      totalEntries: 0,
      avgMoodRating: 0,
      commonTags: [],
      writingFrequency: "không có dữ liệu",
    };
  }

  const totalEntries = journals.length;
  const moodRatings = journals
    .filter((j) => j.moodRating != null)
    .map((j) => j.moodRating);
  const avgMoodRating =
    moodRatings.length > 0
      ? Math.round(moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length)
      : 0;

  // Phân tích tags
  const tagCount = {};
  journals.forEach((j) =>
    (j.tags || []).forEach((tag) => (tagCount[tag] = (tagCount[tag] || 0) + 1))
  );

  const commonTags = Object.entries(tagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  return {
    totalEntries,
    avgMoodRating,
    commonTags,
    writingFrequency: getWritingFrequencyLabel(journals.length),
  };
}

function getWritingFrequencyLabel(count) {
  if (count >= 7) return "hàng ngày";
  if (count >= 3) return "thường xuyên";
  if (count >= 1) return "trung bình";
  return "thỉnh thoảng";
}

// ==================== PERSONAL GROWTH ====================

function calculatePersonalGrowth(todos) {
  if (!todos || todos.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      taskCompletionRate: 0,
      priorityBreakdown: {},
    };
  }

  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.status === "done").length;
  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const priorityBreakdown = {};
  todos.forEach(
    (t) =>
      (priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1)
  );

  return { totalTasks, completedTasks, taskCompletionRate, priorityBreakdown };
}

// ==================== BEHAVIOR STATS ====================

async function calculateBehaviorStats(userId, startDate, endDate) {
  try {
    const dateFilter = { $gte: startDate, $lte: endDate };

    const [messages, posts] = await Promise.all([
      Message.find({ sender: userId, createdAt: dateFilter }).lean(),
      Post.find({ userCreateID: userId, createdAt: dateFilter }).lean(),
    ]);

    // Phân tích thời gian hoạt động
    const onlinePatterns = {};
    messages.forEach((msg) => {
      const hour = new Date(msg.createdAt).getHours();
      onlinePatterns[hour] = (onlinePatterns[hour] || 0) + 1;
    });

    const onlinePatternsArray = Object.entries(onlinePatterns)
      .map(([hour, count]) => ({ _id: parseInt(hour), messageCount: count }))
      .sort((a, b) => a._id - b._id);

    // Tính tương tác
    let totalLikes = 0,
      totalComments = 0;
    posts.forEach((post) => {
      totalLikes += Array.isArray(post.likes) ? post.likes.length : 0;
      totalComments += Array.isArray(post.comments) ? post.comments.length : 0;
    });

    const avgLikes = posts.length > 0 ? totalLikes / posts.length : 0;
    const avgComments = posts.length > 0 ? totalComments / posts.length : 0;

    // Phân tích giờ hoạt động cao điểm
    const preferredActivityTimes = onlinePatternsArray
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 3)
      .map((item) => ({ hour: item._id, count: item.messageCount }));

    return {
      onlinePatterns: onlinePatternsArray,
      interactionFrequency: {
        avgLikes: parseFloat(avgLikes.toFixed(1)),
        avgComments: parseFloat(avgComments.toFixed(1)),
        totalInteractions: totalLikes + totalComments,
      },
      preferredActivityTimes,
    };
  } catch (error) {
    console.error("Error in calculateBehaviorStats:", error);
    return {
      onlinePatterns: [],
      interactionFrequency: {
        avgLikes: 0,
        avgComments: 0,
        totalInteractions: 0,
      },
      preferredActivityTimes: [],
    };
  }
}

// ==================== SOCIAL SUPPORT STATS ====================

async function calculateSocialSupportStats(userId, startDate, endDate) {
  try {
    const dateFilter = { $gte: startDate, $lte: endDate };

    const [posts, groupMembers, messages, comments] = await Promise.all([
      Post.find({ userCreateID: userId, createdAt: dateFilter }).lean(),
      GroupMember.find({ userId }).lean(),
      Message.find({ sender: userId, createdAt: dateFilter }).lean(),
      Comment.find({
        "postID.userCreateID": userId,
        createdAt: dateFilter,
      }).lean(),
    ]);

    let totalLikes = 0,
      totalComments = 0;
    posts.forEach((post) => {
      totalLikes += Array.isArray(post.likes) ? post.likes.length : 0;
      totalComments += Array.isArray(post.comments) ? post.comments.length : 0;
    });

    const avgEngagement =
      posts.length > 0 ? (totalLikes + totalComments) / posts.length : 0;
    const activeGroups = groupMembers.filter(
      (gm) => gm.status === "active"
    ).length;
    const uniqueChats = [
      ...new Set(messages.map((msg) => msg.chatId?.toString())),
    ].length;
    const uniqueCommenters = [
      ...new Set(comments.map((c) => c.userID?.toString())),
    ].length;

    return {
      positiveInteractions: {
        totalLikes,
        totalComments,
        avgEngagement: parseFloat(avgEngagement.toFixed(1)),
      },
      groupSupport: { totalGroups: groupMembers.length, activeGroups },
      messageSupport: { totalMessages: messages.length, uniqueChats },
      receivedSupport: {
        receivedComments: comments.length,
        uniqueSupporters: uniqueCommenters,
      },
    };
  } catch (error) {
    console.error("Error in calculateSocialSupportStats:", error);
    return {
      positiveInteractions: {
        totalLikes: 0,
        totalComments: 0,
        avgEngagement: 0,
      },
      groupSupport: { totalGroups: 0, activeGroups: 0 },
      messageSupport: { totalMessages: 0, uniqueChats: 0 },
      receivedSupport: { receivedComments: 0, uniqueSupporters: 0 },
    };
  }
}

// ==================== SAFETY STATS ====================

async function calculateSafetyStats(userId, startDate, endDate) {
  try {
    const violations = await Violation.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const statusCount = {};
    violations.forEach(
      (v) => (statusCount[v.status] = (statusCount[v.status] || 0) + 1)
    );

    const reportStatus = Object.entries(statusCount).map(([status, count]) => ({
      _id: status,
      count,
    }));

    return { totalReports: violations.length, reportStatus, blockedUsers: 0 };
  } catch (error) {
    console.error("Error in calculateSafetyStats:", error);
    return { totalReports: 0, reportStatus: [], blockedUsers: 0 };
  }
}

// ==================== TIMELINE STATS ====================

async function getUserTimelineStats(userId, period) {
  try {
    const { startDate, endDate } = calculateDateRange(period);
    const dateFilter =
      period === "all" ? {} : { createdAt: { $gte: startDate, $lte: endDate } };

    const [posts, journals, comments, moods] = await Promise.all([
      Post.find({ userCreateID: userId, ...dateFilter }).lean(),
      Journal.find({ userId, ...dateFilter }).lean(),
      Comment.find({ userID: userId, ...dateFilter }).lean(),
      MoodLog.find({ userId, ...dateFilter }).lean(),
    ]);

    const processTimelineData = (data) => {
      const grouped = {};
      data.forEach((item) => {
        const dateKey = formatDateByPeriod(new Date(item.createdAt), period);
        grouped[dateKey] = (grouped[dateKey] || 0) + 1;
      });

      return Object.entries(grouped)
        .map(([_id, count]) => ({ _id, count }))
        .sort((a, b) => a._id.localeCompare(b._id));
    };

    return {
      posts: processTimelineData(posts),
      journals: processTimelineData(journals),
      comments: processTimelineData(comments),
      moods: processTimelineData(moods),
    };
  } catch (error) {
    console.error("Error in getUserTimelineStats:", error);
    return { posts: [], journals: [], comments: [], moods: [] };
  }
}

// ==================== INSIGHTS ====================

function generatePersonalizedInsights(data) {
  const insights = [];
  const { moodData, journalData, periodStats, personalGrowth } = data;

  // Insights về cảm xúc
  if (moodData?.length > 0) {
    const positiveEmotions = ["happy", "excited", "neutral", "surprised"];
    const negativeEmotions = [
      "sad",
      "angry",
      "anxious",
      "fearful",
      "disgusted",
    ];

    const positiveCount = moodData.filter((m) =>
      positiveEmotions.includes(m.emotion)
    ).length;
    const negativeCount = moodData.filter((m) =>
      negativeEmotions.includes(m.emotion)
    ).length;

    if (positiveCount > negativeCount) {
      insights.push(
        "Bạn đang có xu hướng cảm xúc tích cực trong thời gian qua - hãy duy trì nhé!"
      );
    } else if (negativeCount > positiveCount) {
      insights.push(
        "Bạn đang có nhiều cảm xúc tiêu cực, hãy thử các hoạt động thư giãn hoặc chia sẻ với người thân"
      );
    }
  }

  // Insights về nhật ký
  if (journalData?.totalEntries > 0) {
    insights.push(
      `Bạn đã viết ${journalData.totalEntries} bài nhật ký - thói quen tuyệt vời để hiểu bản thân hơn!`
    );

    if (journalData.avgMoodRating > 70) {
      insights.push(
        "Tâm trạng trung bình của bạn khá tốt, điều này thật tuyệt!"
      );
    } else if (journalData.avgMoodRating < 30) {
      insights.push(
        "Tâm trạng của bạn có vẻ đang không ổn, hãy quan tâm đến bản thân nhiều hơn"
      );
    }
  }

  // Insights về hoạt động
  if (periodStats) {
    if (periodStats.newPosts === 0 && periodStats.newJournals === 0) {
      insights.push(
        "Hãy thử chia sẻ cảm xúc hoặc viết nhật ký để bắt đầu hành trình tự nhận thức"
      );
    } else if (periodStats.newPosts > 3 || periodStats.newJournals > 3) {
      insights.push(
        "Bạn đang rất tích cực trong việc thể hiện bản thân - tiếp tục phát huy nhé!"
      );
    }
  }

  // Insights về phát triển cá nhân
  if (personalGrowth?.taskCompletionRate > 80) {
    insights.push(
      `Tỷ lệ hoàn thành nhiệm vụ ${personalGrowth.taskCompletionRate}% - bạn đang làm rất tốt!`
    );
  } else if (
    personalGrowth?.taskCompletionRate < 30 &&
    personalGrowth?.totalTasks > 0
  ) {
    insights.push("Hãy thử chia nhỏ mục tiêu để dễ dàng hoàn thành hơn");
  }

  if (insights.length === 0) {
    insights.push(
      "Hãy bắt đầu ghi lại cảm xúc và hoạt động hàng ngày để nhận được phân tích chi tiết hơn",
      "Thử viết nhật ký vào buổi tối để tổng kết ngày và hiểu rõ cảm xúc của mình"
    );
  }

  return insights.slice(0, 4);
}

module.exports = new UserController();
