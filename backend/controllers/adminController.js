const User = require("../models/User");
const Post = require("../models/Post");
const Journal = require("../models/Journal");
const Group = require("../models/Group");
const GroupMember = require("../models/GroupMember");
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
    const {
      range = "30d",
      startDate: startParam,
      endDate: endParam,
      groupBy: groupByParam = "auto",
    } = req.query;

    const timezone = "Asia/Ho_Chi_Minh";

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let rangeEnd = endParam ? new Date(endParam) : now;
    if (Number.isNaN(rangeEnd.getTime())) {
      rangeEnd = now;
    }
    rangeEnd = new Date(rangeEnd.getTime());
    rangeEnd.setHours(23, 59, 59, 999);

    const createStartFromDays = (days) => {
      const start = new Date(rangeEnd.getTime());
      start.setDate(start.getDate() - (Number(days) - 1));
      start.setHours(0, 0, 0, 0);
      return start;
    };

    let rangeStart;

    switch (range) {
      case "7d":
        rangeStart = createStartFromDays(7);
        break;
      case "30d":
        rangeStart = createStartFromDays(30);
        break;
      case "90d":
        rangeStart = createStartFromDays(90);
        break;
      case "180d":
        rangeStart = createStartFromDays(180);
        break;
      case "365d":
        rangeStart = createStartFromDays(365);
        break;
      case "mtd": {
        rangeStart = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
        rangeStart.setHours(0, 0, 0, 0);
        break;
      }
      case "ytd": {
        rangeStart = new Date(rangeEnd.getFullYear(), 0, 1);
        rangeStart.setHours(0, 0, 0, 0);
        break;
      }
      case "custom":
        if (startParam) {
          const parsed = new Date(startParam);
          if (!Number.isNaN(parsed.getTime())) {
            rangeStart = new Date(parsed.getTime());
            rangeStart.setHours(0, 0, 0, 0);
          }
        }
        break;
      default:
        rangeStart = createStartFromDays(30);
        break;
    }

    if (!rangeStart) {
      rangeStart = createStartFromDays(30);
    }

    if (rangeStart > rangeEnd) {
      rangeStart = createStartFromDays(30);
    }

    const diffMs = Math.max(1, rangeEnd.getTime() - rangeStart.getTime());
    const prevEnd = new Date(rangeStart.getTime() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    prevStart.setHours(0, 0, 0, 0);

    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let effectiveGroupBy = groupByParam;
    if (!effectiveGroupBy || effectiveGroupBy === "auto") {
      if (diffDays > 365) {
        effectiveGroupBy = "year";
      } else if (diffDays > 90) {
        effectiveGroupBy = "month";
      } else {
        effectiveGroupBy = "day";
      }
    }

    if (!["day", "month", "year"].includes(effectiveGroupBy)) {
      effectiveGroupBy = "day";
    }

    const groupFormatMap = {
      day: "%Y-%m-%d",
      month: "%Y-%m",
      year: "%Y",
    };

    const makeDateGroupExpression = (field) => ({
      $dateToString: {
        format: groupFormatMap[effectiveGroupBy] || "%Y-%m-%d",
        date: field,
        timezone,
      },
    });

    const countDocumentsInRange = (Model, start, end) =>
      Model.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      });

    const buildTimeSeries = (Model) =>
      Model.aggregate([
        {
          $match: {
            createdAt: {
              $gte: rangeStart,
              $lte: rangeEnd,
            },
          },
        },
        {
          $group: {
            _id: makeDateGroupExpression("$createdAt"),
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

    const calcGrowth = (current, previous) => {
      const delta = current - previous;
      const growthRate =
        previous === 0 ? (current > 0 ? 100 : 0) : (delta / previous) * 100;
      return {
        current,
        previous,
        delta,
        growthRate: Math.round(growthRate * 100) / 100,
      };
    };

    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalMessages,
      totalJournals,
      totalGroups,
      totalMoodLogs,
      totalViolations,
      likesTotalAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      Post.countDocuments(),
      Comment.countDocuments(),
      Message.countDocuments(),
      Journal.countDocuments(),
      Group.countDocuments(),
      MoodLog.countDocuments(),
      Violation.countDocuments(),
      Post.aggregate([
        { $unwind: "$likes" },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),
    ]);

    const totalLikes = likesTotalAgg[0]?.total || 0;

    const [
      usersCurrent,
      usersPrevious,
      postsCurrent,
      postsPrevious,
      commentsCurrent,
      commentsPrevious,
      messagesCurrent,
      messagesPrevious,
      journalsCurrent,
      journalsPrevious,
      violationsCurrent,
      violationsPrevious,
      groupsCurrent,
      groupsPrevious,
      moodLogsCurrent,
      moodLogsPrevious,
      likesCurrentAgg,
      likesPreviousAgg,
    ] = await Promise.all([
      countDocumentsInRange(User, rangeStart, rangeEnd),
      countDocumentsInRange(User, prevStart, prevEnd),
      countDocumentsInRange(Post, rangeStart, rangeEnd),
      countDocumentsInRange(Post, prevStart, prevEnd),
      countDocumentsInRange(Comment, rangeStart, rangeEnd),
      countDocumentsInRange(Comment, prevStart, prevEnd),
      countDocumentsInRange(Message, rangeStart, rangeEnd),
      countDocumentsInRange(Message, prevStart, prevEnd),
      countDocumentsInRange(Journal, rangeStart, rangeEnd),
      countDocumentsInRange(Journal, prevStart, prevEnd),
      countDocumentsInRange(Violation, rangeStart, rangeEnd),
      countDocumentsInRange(Violation, prevStart, prevEnd),
      countDocumentsInRange(Group, rangeStart, rangeEnd),
      countDocumentsInRange(Group, prevStart, prevEnd),
      countDocumentsInRange(MoodLog, rangeStart, rangeEnd),
      countDocumentsInRange(MoodLog, prevStart, prevEnd),
      Post.aggregate([
        { $unwind: "$likes" },
        {
          $match: {
            "likes.createdAt": { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),
      Post.aggregate([
        { $unwind: "$likes" },
        {
          $match: {
            "likes.createdAt": { $gte: prevStart, $lte: prevEnd },
          },
        },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),
    ]);

    const likesCurrent = likesCurrentAgg[0]?.total || 0;
    const likesPrevious = likesPreviousAgg[0]?.total || 0;

    const [
      usersSeries,
      postsSeries,
      commentsSeries,
      messagesSeries,
      journalsSeries,
      violationsSeries,
      moodSeries,
      likesSeries,
    ] = await Promise.all([
      buildTimeSeries(User),
      buildTimeSeries(Post),
      buildTimeSeries(Comment),
      buildTimeSeries(Message),
      buildTimeSeries(Journal),
      buildTimeSeries(Violation),
      buildTimeSeries(MoodLog),
      Post.aggregate([
        { $unwind: "$likes" },
        {
          $match: {
            "likes.createdAt": { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        {
          $group: {
            _id: makeDateGroupExpression("$likes.createdAt"),
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const mergeSeries = (series, key, map) => {
      series.forEach((item) => {
        const dateKey = item._id;
        if (!map.has(dateKey)) {
          map.set(dateKey, { date: dateKey });
        }
        map.get(dateKey)[key] = item.count;
      });
    };

    const seriesMap = new Map();
    mergeSeries(usersSeries, "users", seriesMap);
    mergeSeries(postsSeries, "posts", seriesMap);
    mergeSeries(commentsSeries, "comments", seriesMap);
    mergeSeries(messagesSeries, "messages", seriesMap);
    mergeSeries(journalsSeries, "journals", seriesMap);
    mergeSeries(violationsSeries, "violations", seriesMap);
    mergeSeries(moodSeries, "moodLogs", seriesMap);
    mergeSeries(likesSeries, "likes", seriesMap);

    const trendSeries = Array.from(seriesMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((entry) => {
        const posts = entry.posts || 0;
        const comments = entry.comments || 0;
        const messages = entry.messages || 0;
        const journals = entry.journals || 0;
        const violations = entry.violations || 0;
        const moodLogs = entry.moodLogs || 0;
        const likes = entry.likes || 0;
        const users = entry.users || 0;
        const interactions = comments + messages + likes;
        return {
          date: entry.date,
          users,
          posts,
          comments,
          messages,
          journals,
          violations,
          moodLogs,
          likes,
          interactions,
        };
      });

    const [
      violationStatusAgg,
      violationTargetAgg,
      moodStatsCurrent,
      moodStatsOverall,
      recentUsers,
      recentPosts,
      topPosts,
    ] = await Promise.all([
      Violation.aggregate([
        {
          $match: {
            createdAt: { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Violation.aggregate([
        {
          $match: {
            createdAt: { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        {
          $group: {
            _id: "$targetType",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      MoodLog.aggregate([
        {
          $match: {
            createdAt: { $gte: rangeStart, $lte: rangeEnd },
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
      MoodLog.aggregate([
        {
          $group: {
            _id: "$emotion",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      User.find({ createdAt: { $gte: rangeStart } })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("username email role createdAt"),
      Post.find({ createdAt: { $gte: rangeStart } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("userCreateID", "username"),
      Post.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } })
        .sort({ likeCount: -1, commentCount: -1 })
        .limit(5)
        .select("content likeCount commentCount warningCount createdAt")
        .populate("userCreateID", "username"),
    ]);

    const violationStatus = violationStatusAgg.reduce(
      (acc, item) => ({
        ...acc,
        [item._id || "unknown"]: item.count,
      }),
      {
        pending: 0,
        reviewed: 0,
        approved: 0,
        rejected: 0,
        auto: 0,
      }
    );

    const periodInteractions = commentsCurrent + messagesCurrent + likesCurrent;
    const previousInteractions =
      commentsPrevious + messagesPrevious + likesPrevious;

    const overview = {
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalMessages,
      totalJournals,
      totalGroups,
      totalMoodLogs,
      totalViolations,
      totalLikes,
    };

    const periodOverview = {
      users: usersCurrent,
      posts: postsCurrent,
      comments: commentsCurrent,
      messages: messagesCurrent,
      journals: journalsCurrent,
      violations: violationsCurrent,
      groups: groupsCurrent,
      moodLogs: moodLogsCurrent,
      likes: likesCurrent,
      interactions: periodInteractions,
    };

    const growth = {
      users: calcGrowth(usersCurrent, usersPrevious),
      posts: calcGrowth(postsCurrent, postsPrevious),
      comments: calcGrowth(commentsCurrent, commentsPrevious),
      messages: calcGrowth(messagesCurrent, messagesPrevious),
      journals: calcGrowth(journalsCurrent, journalsPrevious),
      violations: calcGrowth(violationsCurrent, violationsPrevious),
      groups: calcGrowth(groupsCurrent, groupsPrevious),
      moodLogs: calcGrowth(moodLogsCurrent, moodLogsPrevious),
      likes: calcGrowth(likesCurrent, likesPrevious),
      interactions: calcGrowth(periodInteractions, previousInteractions),
    };

    const activityBreakdown = {
      content: [
        { key: "posts", label: "Bài viết", count: postsCurrent },
        { key: "journals", label: "Nhật ký", count: journalsCurrent },
        { key: "groups", label: "Nhóm mới", count: groupsCurrent },
      ],
      interaction: [
        { key: "comments", label: "Bình luận", count: commentsCurrent },
        { key: "messages", label: "Tin nhắn", count: messagesCurrent },
        { key: "likes", label: "Lượt thích", count: likesCurrent },
      ],
      moderation: [
        { key: "violations", label: "Vi phạm mới", count: violationsCurrent },
      ],
    };

    const requestedRange = {
      range,
      groupBy: effectiveGroupBy,
      startDate: rangeStart,
      endDate: rangeEnd,
      previousStart: prevStart,
      previousEnd: prevEnd,
      periodDays: diffDays,
    };

    const responsePayload = {
      requestedRange,
      overview,
      periodOverview,
      growth,
      trendSeries,
      activityBreakdown,
      violationSummary: {
        status: violationStatus,
        byTarget: violationTargetAgg.map((item) => ({
          targetType: item._id,
          count: item.count,
        })),
      },
      moodStats: moodStatsCurrent.map((item) => ({
        emotion: item._id,
        count: item.count,
      })),
      overallMoodStats: moodStatsOverall.map((item) => ({
        emotion: item._id,
        count: item.count,
      })),
      recentActivity: {
        users: recentUsers,
        posts: recentPosts,
      },
      topPosts,
    };

    return res.json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê dashboard",
    });
  }
};

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

//  cập nhật hàm getAllPosts
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

const block_un_Post = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết: " + postId,
      });
    }

    const active = post.isBlocked || true;
    post.isBlocked = !active;
    await post.save();

    res.json({
      success: true,
      message: active ? "Bài viết đã bị chặn" : "Bài viết đã được mở lại",
      data: post,
    });
  } catch (error) {
    console.error("Block post error (Lỗi khi chặn/mở bài viết):", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi chặn/mở bài viết",
    });
  }
};

const block_un_PostComment = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết: " + postId,
      });
    }
    const active = post.isBlockedComment || true;
    post.isBlockedComment = !active;
    await post.save();
    res.json({
      success: true,
      message: active ? "Bình luận đã bị chặn" : "Bình luận đã được mở lại",
      data: post,
    });
  } catch (error) {
    console.error("Block comment error (Lỗi khi chặn/mở bình luận):", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi chặn/mở bình luận",
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
const mongoose = require("mongoose");

const getAllJournals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      searchId = "", // Thêm searchId
      emotion = "",
      privacy = "",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Tạo filter
    const filter = {};

    // Tìm kiếm theo ID (ưu tiên cao nhất)
    if (searchId) {
      try {
        // Chuyển đổi string ID thành ObjectId
        filter._id = new mongoose.Types.ObjectId(searchId);
      } catch (error) {
        // Nếu ID không hợp lệ, trả về mảng rỗng
        return res.json({
          success: true,
          data: {
            journals: [],
            pagination: {
              current: parseInt(page),
              pages: 0,
              total: 0,
            },
          },
        });
      }
    }
    // Tìm kiếm theo tiêu đề và nội dung (chỉ khi không tìm theo ID)
    else if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Lọc theo cảm xúc
    if (emotion) {
      filter.emotions = { $in: [emotion] };
    }

    // Lọc theo quyền riêng tư
    if (privacy === "private") {
      filter.isPrivate = true;
    } else if (privacy === "public") {
      filter.isPrivate = false;
    }

    // Lọc theo ngày
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filter.date.$gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    // Sắp xếp
    const sort = {};
    if (sortBy === "title") {
      sort.title = sortOrder === "asc" ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    const [journals, total] = await Promise.all([
      Journal.find(filter)
        .populate("userId", "username email profile.avatar")
        .sort(sort)
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
      "userId",
      "username email profile.avatar"
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
const getJournalStats = async (req, res) => {
  try {
    const [
      totalJournals,
      privateJournals,
      todayJournals,
      thisWeekJournals,
      thisMonthJournals,
      lastMonthJournals,
      withMedia,
      emotionDistribution,
      privacyDistribution,
      topWriters,
      avgMediaPerJournal,
    ] = await Promise.all([
      Journal.countDocuments(),
      Journal.countDocuments({ isPrivate: true }),
      Journal.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Journal.countDocuments({
        date: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      }),
      Journal.countDocuments({
        date: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      Journal.countDocuments({
        date: {
          $gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1
          ),
          $lte: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
        },
      }),
      Journal.countDocuments({ media: { $exists: true, $ne: [] } }),
      Journal.aggregate([
        { $unwind: "$emotions" },
        { $group: { _id: "$emotions", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Journal.aggregate([
        { $group: { _id: "$isPrivate", count: { $sum: 1 } } },
      ]),
      Journal.aggregate([
        {
          $group: {
            _id: "$userId",
            journalCount: { $sum: 1 },
            lastJournal: { $max: "$date" },
          },
        },
        { $sort: { journalCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            username: "$user.username",
            avatar: "$user.profile.avatar",
            journalCount: 1,
            lastJournal: 1,
          },
        },
      ]),
      Journal.aggregate([
        { $project: { mediaCount: { $size: { $ifNull: ["$media", []] } } } },
        { $group: { _id: null, avg: { $avg: "$mediaCount" } } },
      ]),
    ]);

    // Tính tỷ lệ tăng trưởng
    const growthRate = lastMonthJournals
      ? ((thisMonthJournals - lastMonthJournals) / lastMonthJournals) * 100
      : thisMonthJournals > 0
      ? 100
      : 0;

    // Tìm cảm xúc phổ biến nhất
    const topEmotionData = emotionDistribution[0];
    const topEmotion = topEmotionData ? topEmotionData._id : null;
    const topEmotionCount = topEmotionData ? topEmotionData.count : 0;

    res.json({
      success: true,
      data: {
        totalJournals,
        privateJournals,
        todayJournals,
        thisWeekJournals,
        thisMonthJournals,
        withMedia,
        topEmotion,
        topEmotionCount,
        growthRate: Math.round(growthRate * 100) / 100,
        emotionDistribution: emotionDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        privacyDistribution: privacyDistribution.reduce((acc, curr) => {
          acc[curr._id ? "private" : "public"] = curr.count;
          return acc;
        }, {}),
        topWriters,
        avgMediaPerJournal:
          Math.round((avgMediaPerJournal[0]?.avg || 0) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Get journal stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê nhật ký",
    });
  }
};

// Quản lý nhóm
const getAllGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      visibility = "",
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
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Lọc theo category
    if (category) {
      filter.category = { $in: [category] };
    }

    // Lọc theo visibility
    if (visibility) {
      filter.visibility = visibility;
    }

    // Lọc theo trạng thái
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }

    // Lọc theo ngày
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Sắp xếp
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate("owner", "username email profile.avatar")
        .populate("moderators", "username email")
        .sort(sort)
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

const getGroupStats = async (req, res) => {
  try {
    const [
      totalGroups,
      activeGroups,
      publicGroups,
      privateGroups,
      totalMembers,
      groupsWithReports,
      totalReports,
    ] = await Promise.all([
      Group.countDocuments(),
      Group.countDocuments({ active: true }),
      Group.countDocuments({ visibility: "public" }),
      Group.countDocuments({ visibility: "private" }),
      GroupMember.countDocuments({ status: "active" }),
      Group.countDocuments({ reportCount: { $gt: 0 } }),
      Group.aggregate([
        { $group: { _id: null, total: { $sum: "$reportCount" } } },
      ]),
    ]);

    // Phân bố theo category
    const categoryDistribution = await Group.aggregate([
      { $unwind: "$category" },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Phân bố theo visibility
    const visibilityDistribution = await Group.aggregate([
      { $group: { _id: "$visibility", count: { $sum: 1 } } },
    ]);

    // Top groups by members
    const topGroupsByMembers = await Group.find()
      .sort({ memberCount: -1 })
      .limit(10)
      .select("name memberCount visibility active");

    // Thống kê tháng này
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newGroupsThisMonth = await Group.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Thống kê tháng trước
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const endOfLastMonth = new Date(startOfMonth);
    endOfLastMonth.setDate(0);

    const newGroupsLastMonth = await Group.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const growthRate = newGroupsLastMonth
      ? ((newGroupsThisMonth - newGroupsLastMonth) / newGroupsLastMonth) * 100
      : newGroupsThisMonth > 0
      ? 100
      : 0;

    // Avg members per group
    const avgMembersResult = await Group.aggregate([
      { $group: { _id: null, avg: { $avg: "$memberCount" } } },
    ]);
    const avgMembersPerGroup = avgMembersResult[0]?.avg || 0;

    res.json({
      success: true,
      data: {
        totalGroups,
        activeGroups,
        publicGroups,
        privateGroups,
        totalMembers,
        groupsWithReports,
        totalReports: totalReports[0]?.total || 0,
        categoryDistribution: categoryDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        visibilityDistribution: visibilityDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        topGroupsByMembers,
        newGroupsThisMonth,
        growthRate: Math.round(growthRate * 100) / 100,
        avgMembersPerGroup: Math.round(avgMembersPerGroup * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Get group stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê nhóm",
    });
  }
};

const createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      visibility = "private",
      category = ["all"],
      tags = [],
      emotionTags = [],
    } = req.body;

    // Kiểm tra nhóm đã tồn tại
    const existingGroup = await Group.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Tên nhóm đã tồn tại",
      });
    }

    if (req.files) {
      // Multer lưu file theo tên field → req.files['fieldName'] là mảng
      if (req.files.avatar && req.files.avatar[0]) {
        avatarUrl = `/api/uploads/images/${req.files.avatar[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        coverPhotoUrl = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
      }
    }

    // Xử lý file upload
    let avatar = req.files?.avatar ? req.files.avatar[0].path : "";
    let coverPhoto = req.files?.coverPhoto ? req.files.coverPhoto[0].path : "";

    if (req.files) {
      // Multer lưu file theo tên field → req.files['fieldName'] là mảng
      if (req.files.avatar && req.files.avatar[0]) {
        avatar = `/api/uploads/images/${req.files.avatar[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        coverPhoto = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
      }
    }

    // Xử lý mảng category, tags, emotionTags
    const categoryArray = Array.isArray(category) ? category : [category];
    const tagsArray = Array.isArray(tags)
      ? tags
      : tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
    const emotionTagsArray = Array.isArray(emotionTags)
      ? emotionTags
      : emotionTags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);

    const group = new Group({
      name,
      description,
      visibility,
      category: categoryArray,
      tags: tagsArray,
      emotionTags: emotionTagsArray,
      avatar,
      coverPhoto,
      owner: req.user.userId,
      moderators: [req.user.userId],
    });

    await group.save();

    // Tạo group member cho owner
    const groupMember = new GroupMember({
      groupId: group._id,
      userId: req.user.userId,
      role: "owner",
      status: "active",
    });

    await groupMember.save();

    // Cập nhật memberCount
    group.memberCount = 1;
    await group.save();

    res.status(201).json({
      success: true,
      data: { group },
      message: "Tạo nhóm thành công",
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo nhóm",
    });
  }
};

const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate("owner", "username email profile.avatar fullName")
      .populate("moderators", "username email profile.avatar");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Lấy thống kê của group
    const [membersCount, postsCount] = await Promise.all([
      GroupMember.countDocuments({ groupId, status: "active" }),
      Post.countDocuments({ groupId }),
    ]);

    res.json({
      success: true,
      data: {
        group,
        stats: {
          membersCount,
          postsCount,
        },
      },
    });
  } catch (error) {
    console.error("Get group by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin nhóm",
    });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      name,
      description,
      visibility,
      category,
      tags,
      emotionTags,
      active,
    } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Kiểm tra trùng tên
    if (name && name !== group.name) {
      const existingGroup = await Group.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: groupId },
      });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm đã tồn tại",
        });
      }
    }

    // Xử lý file upload
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (visibility) updateData.visibility = visibility;
    if (active !== undefined) updateData.active = active;

    // Xử lý mảng
    if (category) {
      updateData.category = Array.isArray(category) ? category : [category];
    }
    if (tags) {
      updateData.tags = Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
    }
    if (emotionTags) {
      updateData.emotionTags = Array.isArray(emotionTags)
        ? emotionTags
        : emotionTags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
    }

    // Xử lý file upload nếu có
    // if (req.files?.avatar) {
    //   updateData.avatar = req.files.avatar[0].path;
    // }
    // if (req.files?.coverPhoto) {
    //   updateData.coverPhoto = req.files.coverPhoto[0].path;
    // }

    if (req.files) {
      // Multer lưu file theo tên field → req.files['fieldName'] là mảng
      if (req.files.avatar && req.files.avatar[0]) {
        updateData.avatar = `/api/uploads/images/${req.files.avatar[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        updateData.coverPhoto = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "username email profile.avatar")
      .populate("moderators", "username email");

    res.json({
      success: true,
      data: { group: updatedGroup },
      message: "Cập nhật nhóm thành công",
    });
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật nhóm",
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

    // Xóa các dữ liệu liên quan
    await Promise.all([
      GroupMember.deleteMany({ groupId }),
      Post.deleteMany({ groupId }),
      // Xóa các comments liên quan đến posts trong group
      Comment.deleteMany({
        postId: { $in: await Post.find({ groupId }).select("_id") },
      }),
    ]);

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

const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20, role = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    const filter = { groupId };
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [members, total] = await Promise.all([
      GroupMember.find(filter)
        .populate("userId", "username email profile.avatar fullName")
        .populate("invitedBy", "username")
        .sort({ joinedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      GroupMember.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get group members error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thành viên",
    });
  }
};

const updateGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role, status } = req.body;

    const groupMember = await GroupMember.findOne({
      _id: memberId,
      groupId,
    });

    if (!groupMember) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thành viên",
      });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedMember = await GroupMember.findByIdAndUpdate(
      memberId,
      updateData,
      { new: true }
    ).populate("userId", "username email profile.avatar");

    res.json({
      success: true,
      data: { member: updatedMember },
      message: "Cập nhật thành viên thành công",
    });
  } catch (error) {
    console.error("Update group member error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thành viên",
    });
  }
};

// Lấy các report Group
const getGroupViolation = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      dateFrom = "",
      dateTo = "",
      search = "",
      reportId = "",
      id = "",
    } = req.query;

    const skip = limit * (page - 1);

    const filter = { targetType: "Group" };

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

    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      );
    }

    if (reportId) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: reportId,
            options: "i",
          },
        },
      });
    }

    if (id) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$targetId" },
            regex: id,
            options: "i",
          },
        },
      });
    }

    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }

    const [reportsGroup, total] = await Promise.all([
      Violation.find(filter)
        .populate("reportedBy", "username email profile.avatar")
        .populate("targetId", "name description avatar memberCount visibility")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Violation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reportsGroup,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo nhóm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy báo cáo nhóm",
    });
  }
};

// Cập nhật violation Group
const updateViolationGroupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken = "warning", reviewedAt } = req.body;

    const violation = await Violation.findById(id)
      .populate("reportedBy", "username email profile.avatar")
      .populate("targetId", "name owner memberCount")
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
    )
      .populate("reportedBy", "username email profile.avatar")
      .populate("targetId", "name owner memberCount");

    const group = await Group.findById(violation.targetId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm liên quan",
      });
    }

    // Thông báo real-time dựa trên action
    if (actionTaken === "block_group") {
      await Group.findByIdAndUpdate(violation.targetId, {
        active: false,
      });

      // Thông báo cho chủ nhóm
      await NotificationService.createAndEmitNotification({
        recipient: group.owner,
        sender: req.user._id,
        type: "GROUP_BLOCKED",
        title: "Nhóm đã bị chặn",
        message: `Nhóm "${group.name}" của bạn đã bị chặn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`,
        data: {
          violationId: violation._id,
          groupId: violation.targetId,
          reason: violation.reason,
          action: "blocked",
        },
        priority: "high",
        url: `/groups/${violation.targetId}`,
      });

      // Tăng lỗi cho chủ nhóm
      await AddViolationUserByID(
        group.owner,
        violation,
        req.user.userId,
        false
      );
    } else if (actionTaken === "warning") {
      // Tăng warning count cho group
      const updatedGroup = await Group.findByIdAndUpdate(
        violation.targetId,
        { $inc: { warningCount: 1 } },
        { new: true }
      );

      const newWarningCount = updatedGroup.warningCount || 0;

      // Nếu đạt >5 thì block group
      if (newWarningCount >= 5) {
        await Group.findByIdAndUpdate(violation.targetId, {
          active: false,
        });
        await AddViolationUserByID(
          group.owner,
          violation,
          req.user.userId,
          false
        );
      }

      await NotificationService.createAndEmitNotification({
        recipient: group.owner,
        sender: req.user._id,
        type: newWarningCount >= 5 ? "GROUP_BLOCKED" : "GROUP_WARNED",
        title: newWarningCount >= 5 ? "Nhóm đã bị chặn" : "Cảnh báo nhóm",
        message:
          newWarningCount >= 5
            ? `Nhóm "${group.name}" của bạn đã bị chặn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`
            : `Nhóm "${group.name}" của bạn nhận được cảnh báo vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}. Số cảnh báo hiện tại: ${newWarningCount}`,
        data: {
          violationId: violation._id,
          groupId: violation.targetId,
          reason: violation.reason,
          action: newWarningCount >= 5 ? "blocked" : "warning",
        },
        priority: newWarningCount >= 5 ? "high" : "medium",
        url: `/groups/${violation.targetId}`,
      });
    }

    if (status === "rejected") {
      // Giảm report count nếu báo cáo bị từ chối
      let reportCount = group.reportCount || 1;
      group.reportCount = Math.max(reportCount - 1, 0);
      await group.save();
    }

    // Thông báo cho admin về việc xử lý hoàn tất
    await NotificationService.emitNotificationToAdmins({
      recipient: null,
      sender: req.user._id,
      type: "REPORT_RESOLVED",
      title: "Báo cáo nhóm đã được xử lý",
      message: `Báo cáo nhóm #${violation._id} đã được ${
        req.user.fullName || req.user.username
      } xử lý.`,
      data: {
        violationId: violation._id,
        actionTaken: actionTaken,
        resolvedBy: req.user._id,
      },
      priority: "medium",
      url: `/admin/reports/groups/${violation._id}`,
    });

    return res.status(200).json({
      success: true,
      data: updatedViolation,
      message: "Cập nhật trạng thái báo cáo nhóm thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật báo cáo nhóm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật báo cáo nhóm",
    });
  }

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
      if (banUser) {
        isActive = false;
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
    } catch (err) {
      console.error("Lỗi khi cập nhật violation user:", err);
    }
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
      id = "",
    } = req.query;
    const skip = limit * (page - 1);

    console.log("req.params: ", req.params);

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

    // Xử lý search và reportId
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      );
    }

    // if (reportId) {
    //   filter.$or = [{ _id: { $regex: reportId, $options: "i" } }];
    // }

    // Tìm kiếm theo reportId - chuyển _id thành string
    if (reportId) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: reportId,
            options: "i",
          },
        },
      });
    }

    if (id) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$targetId" },
            regex: id,
            options: "i",
          },
        },
      });
    }

    // Kết hợp điều kiện tìm kiếm
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
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

// lấy các report Bình Luận
const getCommentViolation = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      dateFrom = "",
      dateTo = "",
      search = "",
      reportId = "",
      id = "",
    } = req.query;

    const skip = limit * (page - 1);

    const filter = { targetType: "Comment" };

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

    // Xử lý search và reportId
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      );
    }

    // Tìm kiếm theo reportId - chuyển _id thành string
    if (reportId) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: reportId,
            options: "i",
          },
        },
      });
    }

    if (id) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$targetId" },
            regex: id,
            options: "i",
          },
        },
      });
    }

    // Kết hợp điều kiện tìm kiếm
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }

    const [reportsComment, total] = await Promise.all([
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
        reportsComment,
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
      const post = await Post.findByIdAndUpdate(violation.targetId, {
        isBlocked: true,
      });

      if (post) {
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
        // Cập nhật số lần vi phạm của người dùng
        await AddViolationUserByID(
          violation.userId,
          violation,
          req.user._id,
          false
        );
      }
    } else if (actionTaken === "ban_user") {
      // Cập nhật số lần vi phạm và khoá tài khoản người dùng
      await AddViolationUserByID(
        violation.userId,
        violation,
        req.user._id,
        true
      );
    } else if (actionTaken === "block_comment") {
      await Post.findByIdAndUpdate(violation.targetId, {
        isBlockedComment: true,
      });
      await NotificationService.createAndEmitNotification({
        recipient: violation.userId,
        sender: req.user._id,
        type: "POST_COMMENT_BLOCKED",
        title: "Bài viết đã bị ẩn Bình Luận/ không tương tác với Bình Luận",
        message: `Comment của bài viết của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`,
        data: {
          violationId: violation._id,
          postId: violation.targetId,
          reason: violation.reason,
          action: "blocked",
        },
        priority: "high",
        url: `/posts/${violation.targetId}`,
      });
    } else if (actionTaken === "warning") {
      // tăng warning bằng $inc để tránh race condition và trả về giá trị mới
      const updatedPost = await Post.findByIdAndUpdate(
        violation.targetId,
        { $inc: { warningCount: 1 } },
        { new: true }
      );

      if (!updatedPost) throw new Error("Không tìm thấy bình luận");

      const newWarningCount = updatedPost.warningCount || 0;

      // nếu đạt >5 thì block comment và tăng vi phạm user
      if (newWarningCount > 5) {
        await Post.findByIdAndUpdate(violation.targetId, {
          isBlocked: true,
        });
        await AddViolationUserByID(
          updatedPost.userCreateID,
          violation,
          req.user.userId,
          false
        );
      }
      await NotificationService.createAndEmitNotification({
        recipient: updatedPost.userCreateID,
        sender: req.user._id,
        type: newWarningCount >= 5 ? "POST_BLOCKED" : "USER_WARNED",
        title:
          newWarningCount >= 5
            ? "Bạn có 1 bài viết vi phạm tiêu chuẩn cộng đồng và đã bị ẩn"
            : "Cảnh báo bài viết vi phạm",
        message:
          newWarningCount >= 5
            ? `Bài viết của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`
            : `Bạn có cảnh báo về bài viết vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}. Số cảnh báo hiện tại: ${newWarningCount}`,
        data: {
          violationId: violation._id,
          postId: updatedPost.postID,
          reason: violation.reason,
          action: newWarningCount >= 5 ? "banned" : "warning",
        },
        priority: newWarningCount >= 5 ? "high" : "medium",
        url: `/posts/${updatedPost.postID}`,
      });

      if (newWarningCount >= 5) {
        // Cập nhật số lần vi phạm của người dùng
        await AddViolationUserByID(
          updatedPost.userCreateID,
          violation,
          req.user._id,
          false
        );
      }
    }

    if (status == "rejected") {
      const post = await Post.findById(violation.targetId);
      let reportCount = post.reportCount || 1;
      post.reportCount = reportCount - 1;

      await post.save();
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
      if (banUser) {
        isActive = false;
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
    } catch (err) {
      console.error("Lỗi khi cập nhật violation user:", err);
    }
  }
};

// Cập nhật violation comment
const updateViolationCommentStatus = async (req, res) => {
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
    )
      .populate("reportedBy", "username email profile.avatar")
      .populate("userId", "username email fullName");

    const comment = await Comment.findById(violation.targetId);

    if (!comment && violation.targetType === "Comment") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bình luận liên quan",
      });
    }

    // Thông báo real-time dựa trên action
    if (actionTaken === "block_post") {
      //1
      // khoá bài viết, + lỗi cho người dùng ( nếu quá nhiều lỗi khoá user)

      // khoá bài viết liên quan tới comment
      const post = await Post.findByIdAndUpdate(
        comment.postID,
        { isBlocked: true },
        { new: true }
      );
      // thông báo cho chủ bài (post.userCreateID), không dùng violation.userId
      if (post) {
        await NotificationService.createAndEmitNotification({
          recipient: post.userCreateID,
          sender: req.user._id,
          type: "POST_BLOCKED",
          title: "Bài viết đã bị ẩn",
          message: `Bài viết của bạn đã bị ẩn do có các bình luận ảnh hưởng xấu. Lý do: ${violation.reason}`,
          data: {
            violationId: violation._id,
            postId: post._id,
            reason: violation.reason,
            action: "blocked",
          },
          priority: "high",
          url: `/posts/${post._id}`,
        });

        // tăng lỗi cho người tạo bài
        await AddViolationUserByID(
          post.userCreateID,
          violation,
          req.user.userId,
          false
        );
      }
    } else if (actionTaken === "ban_user") {
      // 2
      await AddViolationUserByID(
        comment.userID,
        violation,
        req.user.userId,
        true
      );
    } else if (actionTaken === "block_comment") {
      console.log("Blocking comment ID:", violation.targetId);
      // ẩn comment
      await Comment.findByIdAndUpdate(violation.targetId, {
        isBlocked: true,
      });

      // Thông báo cho người viết comment
      await NotificationService.createAndEmitNotification({
        recipient: comment.userID,
        sender: req.user._id,
        type: "POST_COMMENT_BLOCKED",
        title: "Bình luận đã bị ẩn",
        message: `Comment của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`,
        data: {
          violationId: violation._id,
          postId: comment.postID,
          reason: violation.reason,
          action: "blocked",
        },
        priority: "high",
        url: `/posts/${comment.postID}`,
      });

      // tăng lỗi cho user comment
      await AddViolationUserByID(
        comment.userID,
        violation,
        req.user.userId,
        false
      );
    } else if (actionTaken === "warning") {
      // tăng warning bằng $inc để tránh race condition và trả về giá trị mới
      const updatedComment = await Comment.findByIdAndUpdate(
        violation.targetId,
        { $inc: { warningCount: 1 } },
        { new: true }
      );

      if (!updatedComment) throw new Error("Không tìm thấy bình luận");

      const newWarningCount = updatedComment.warningCount || 0;

      // nếu đạt >5 thì block comment và tăng vi phạm user
      if (newWarningCount > 5) {
        await Comment.findByIdAndUpdate(violation.targetId, {
          isBlocked: true,
        });
        await AddViolationUserByID(
          updatedComment.userID,
          violation,
          req.user.userId,
          false
        );
      }

      if (status == "rejected") {
        let reportCount = comment.reportCount || 1;
        comment.reportCount = reportCount - 1;

        await comment.save();
      }
      await NotificationService.createAndEmitNotification({
        recipient: updatedComment.userID,
        sender: req.user._id,
        type: newWarningCount >= 5 ? "COMMENT_BLOCKED" : "USER_WARNED",
        title:
          newWarningCount >= 5
            ? "Bạn có 1 bình luận vi phạm tiêu chuẩn cộng đồng và đã bị ẩn"
            : "Cảnh báo bình luận vi phạm",
        message:
          newWarningCount >= 5
            ? `Comment của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`
            : `Bạn có cảnh báo về bình luận vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}. Số cảnh báo hiện tại: ${newWarningCount}`,
        data: {
          violationId: violation._id,
          postId: updatedComment.postID,
          reason: violation.reason,
          action: newWarningCount >= 5 ? "banned" : "warning",
        },
        priority: newWarningCount >= 5 ? "high" : "medium",
        url:
          newWarningCount >= 5 ? `/support` : `/posts/${updatedComment.postID}`,
      });
    }

    if (status == "rejected") {
      let reportCount = comment.reportCount || 1;
      comment.reportCount = reportCount - 1;

      await comment.save();
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
      if (banUser) {
        isActive = false;
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
    } catch (err) {
      console.error("Lỗi khi cập nhật violation user:", err);
    }
  }
};

const getUserViolation = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      dateFrom = "",
      dateTo = "",
      search = "",
      reportId = "",
      id = "",
    } = req.query;
    const skip = limit * (page - 1);

    console.log("req.params: ", req.params);

    const filter = { targetType: "User" };

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

    // Xử lý search và reportId
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      );
    }

    // if (reportId) {
    //   filter.$or = [{ _id: { $regex: reportId, $options: "i" } }];
    // }

    // Tìm kiếm theo reportId - chuyển _id thành string
    if (reportId) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: reportId,
            options: "i",
          },
        },
      });
    }

    if (id) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$targetId" },
            regex: id,
            options: "i",
          },
        },
      });
    }

    // Kết hợp điều kiện tìm kiếm
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
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

const updateViolationUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken = "warning", reviewedAt } = req.body;

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
    if (actionTaken === "ban_user") {
      // Cập nhật số lần vi phạm và khoá tài khoản người dùng
      await AddViolationUserByID(
        violation.userId,
        violation,
        req.user._id,
        true
      );
    } else if (actionTaken === "warning") {
      // tăng warning bằng $inc để tránh race condition và trả về giá trị mới
      const updatedUser = await User.findByIdAndUpdate(
        violation.targetId,
        { $inc: { warningCount: 1 } },
        { new: true }
      );

      if (!updatedUser) throw new Error("Không tìm thấy người dùng");

      const newWarningCount = updatedUser.warningCount || 0;

      if (newWarningCount >= 5) {
        // Cập nhật số lần vi phạm của người dùng
        await AddViolationUserByID(
          updatedUser._id,
          violation,
          req.user._id,
          false
        );
      }
    }
    if (status === "rejected") {
      // Nếu báo cáo bị từ chối, gửi thông báo cho người bị báo cáo
      const user = await User.findById(violation.targetId);
      if (!user) {
        console.warn("Ko tìm thấy user bị báo cáo", violation.targetId);
        return;
      }
      user.violationCount = Math.max((user.violationCount || 1) - 1, 0);
      await user.save();
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
      if (banUser) {
        isActive = false;
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
    } catch (err) {
      console.error("Lỗi khi cập nhật violation user:", err);
    }
  }
};

// Quản lý kháng nghị
const getAllAppeals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      appealStatus = "all",
      dateFrom = "",
      dateTo = "",
      search = "",
      appealId = "",
      violationId = "",
      targetType = "all",
    } = req.query;

    const skip = (page - 1) * limit;

    // Tạo filter cho kháng nghị
    const filter = {
      "appeal.isAppealed": true,
    };

    // Lọc theo trạng thái kháng nghị
    if (appealStatus !== "all") {
      filter["appeal.appealStatus"] = appealStatus;
    }

    // Lọc theo trạng thái violation
    if (status !== "all") {
      filter.status = status;
    }

    // Lọc theo targetType
    if (targetType !== "all") {
      filter.targetType = targetType;
    }

    // Lọc theo thời gian kháng nghị
    if (dateFrom || dateTo) {
      filter["appeal.appealAt"] = {};
      if (dateFrom) filter["appeal.appealAt"].$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter["appeal.appealAt"].$lte = endDate;
      }
    }

    // Xử lý tìm kiếm
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { reason: { $regex: search, $options: "i" } },
        { "appeal.appealReason": { $regex: search, $options: "i" } },
        { "appeal.appealNotes": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      );
    }

    // Tìm kiếm theo appealId (ID của violation)
    if (appealId) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: appealId,
            options: "i",
          },
        },
      });
    }

    // Tìm kiếm theo violationId (targetId)
    if (violationId) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$targetId" },
            regex: violationId,
            options: "i",
          },
        },
      });
    }

    // Kết hợp điều kiện tìm kiếm
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }

    const [appeals, total] = await Promise.all([
      Violation.find(filter)
        .populate("reportedBy", "username email profile.avatar")
        .populate("userId", "username email profile.avatar fullName")
        .populate("appeal.appealReviewedBy", "username email profile.avatar")
        .populate({
          path: "targetId",
          select:
            "name title content username email description avatar memberCount visibility",
        })
        .sort({ "appeal.appealAt": -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Violation.countDocuments(filter),
    ]);

    // Thống kê
    const stats = await Violation.aggregate([
      { $match: { "appeal.isAppealed": true } },
      {
        $group: {
          _id: "$appeal.appealStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        appeals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
        stats: statusStats,
      },
    });
  } catch (error) {
    console.error("Get all appeals error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách kháng nghị",
    });
  }
};

const getAppealById = async (req, res) => {
  try {
    const { appealId } = req.params;

    const appeal = await Violation.findOne({
      _id: appealId,
      "appeal.isAppealed": true,
    })
      .populate("reportedBy", "username email profile.avatar")
      .populate("userId", "username email profile.avatar fullName")
      .populate("reviewedBy", "username email profile.avatar")
      .populate("appeal.appealReviewedBy", "username email profile.avatar")
      .populate({
        path: "targetId",
        select:
          "name title content username email description avatar memberCount visibility isBlocked isPrivate",
      });

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kháng nghị",
      });
    }

    res.json({
      success: true,
      data: appeal,
    });
  } catch (error) {
    console.error("Get appeal by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin kháng nghị",
    });
  }
};

const updateAppealStatus = async (req, res) => {
  try {
    const { appealId } = req.params;
    const { status, appealNotes, actionTaken } = req.body;

    const violation = await Violation.findOne({
      _id: appealId,
      "appeal.isAppealed": true,
    });

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kháng nghị",
      });
    }

    // Cập nhật thông tin kháng nghị
    const updateData = {
      "appeal.appealStatus": status,
      "appeal.appealReviewedBy": req.user.userId,
      "appeal.appealReviewedAt": new Date(),
    };

    if (appealNotes) {
      updateData["appeal.appealNotes"] = appealNotes;
    }

    // Nếu kháng nghị được chấp thuận, cập nhật trạng thái violation
    if (status === "approved") {
      updateData.status = "reviewed";
      if (actionTaken) {
        updateData.actionTaken = actionTaken;

        // Khôi phục đối tượng bị ảnh hưởng
        await handleAppealApproval(violation, actionTaken);
      }
    }

    const updatedAppeal = await Violation.findByIdAndUpdate(
      appealId,
      updateData,
      { new: true }
    )
      .populate("reportedBy", "username email profile.avatar")
      .populate("userId", "username email profile.avatar fullName")
      .populate("appeal.appealReviewedBy", "username email profile.avatar");

    // Gửi thông báo
    await sendAppealNotification(violation, status, req.user);

    res.json({
      success: true,
      data: updatedAppeal,
      message: `Đã ${getAppealStatusText(status)} kháng nghị`,
    });
  } catch (error) {
    console.error("Update appeal status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái kháng nghị",
    });
  }
};

// Hàm xử lý khi kháng nghị được chấp thuận
const handleAppealApproval = async (violation, actionTaken) => {
  try {
    const { targetType, targetId, userId } = violation;

    switch (targetType) {
      case "Post":
        if (actionTaken === "unblock_post") {
          await Post.findByIdAndUpdate(targetId, {
            isBlocked: false,
            warningCount: 0,
          });
        }
        break;

      case "Comment":
        if (actionTaken === "unblock_comment") {
          await Comment.findByIdAndUpdate(targetId, {
            isBlocked: false,
            warningCount: 0,
          });
        }
        break;

      case "User":
        if (actionTaken === "unban_user") {
          await User.findByIdAndUpdate(userId, {
            active: true,
            violationCount: 0,
          });
        }
        break;

      case "Group":
        if (actionTaken === "unblock_group") {
          await Group.findByIdAndUpdate(targetId, {
            active: true,
            warningCount: 0,
          });
        }
        break;
    }
  } catch (error) {
    console.error("Error handling appeal approval:", error);
  }
};

// Hàm gửi thông báo kháng nghị
const sendAppealNotification = async (violation, status, adminUser) => {
  try {
    const statusText = getAppealStatusText(status);
    const targetTypeText = getTargetTypeText(violation.targetType);

    await NotificationService.createAndEmitNotification({
      recipient: violation.userId,
      sender: adminUser._id,
      type: "APPEAL_RESOLVED",
      title: `Kháng nghị đã được ${statusText}`,
      message: `Kháng nghị của bạn về ${targetTypeText} đã được ${statusText.toLowerCase()}. ${
        status === "approved" ? "Nội dung đã được khôi phục." : ""
      }`,
      data: {
        appealId: violation._id,
        targetType: violation.targetType,
        targetId: violation.targetId,
        status: status,
        resolvedBy: adminUser._id,
      },
      priority: "medium",
      url: `/support/appeals/${violation._id}`,
    });

    // Thông báo cho admin
    await NotificationService.emitNotificationToAdmins({
      type: "APPEAL_RESOLVED_ADMIN",
      title: `Kháng nghị đã được xử lý`,
      message: `Kháng nghị #${violation._id} đã được ${
        adminUser.fullName || adminUser.username
      } ${statusText.toLowerCase()}.`,
      data: {
        appealId: violation._id,
        status: status,
        resolvedBy: adminUser._id,
      },
      priority: "low",
      url: `/admin/appeals/${violation._id}`,
    });
  } catch (error) {
    console.error("Error sending appeal notification:", error);
  }
};

// Helper functions
const getAppealStatusText = (status) => {
  const statusMap = {
    pending: "Đang chờ xử lý",
    approved: "Chấp thuận",
    rejected: "Từ chối",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getTargetTypeText = (targetType) => {
  const typeMap = {
    Post: "bài viết",
    Comment: "bình luận",
    User: "người dùng",
    Group: "nhóm",
    Message: "tin nhắn",
  };
  return typeMap[targetType] || targetType;
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  createUser,
  deleteUser,
  updateUserRole,
  getAllPosts,
  getPostById,
  deletePost,
  getAllJournals,
  getJournalStats,
  getJournalById,
  deleteJournal,
  getAllComments,
  deleteComment,
  getAllNotifications,
  createNotification,
  deleteNotification,
  getUserReports,
  getPostReports,
  getCommentViolation,
  getActivityReports,
  getPostViolation,
  updateViolationStatus,
  updateViolationCommentStatus,
  block_un_Post,
  block_un_PostComment,
  updateActiveUser,
  getUserViolation,
  updateViolationUser,
  // group
  updateGroupMember,
  getGroupMembers,
  deleteGroup,
  updateGroup,
  getGroupById,
  createGroup,
  getGroupStats,
  getAllGroups,
  getGroupViolation,
  updateViolationGroupStatus,

  // kháng nghị
  getAllAppeals,
  getAppealById,
  updateAppealStatus,
};
