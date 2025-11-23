// controllers/admin/usersAnalyticsController.js
const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const Violation = require("../../models/Violation");
const AuditLog = require("../../models/AuditLog");
const Notification = require("../../models/Notification");

// Helper function để tính toán khoảng thời gian
const getDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  let startDate,
    endDate = new Date();

  // Ưu tiên custom date range
  if (customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  switch (period) {
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

// A. Thống kê người dùng tổng quan
exports.getUserStats = async (req, res) => {
  try {
    const {
      period = "today",
      startDate: customStart,
      endDate: customEnd,
    } = req.query;

    const { startDate, endDate } = getDateRange(period, customStart, customEnd);

    // Tổng quan người dùng - thực hiện song song
    const [
      totalUsers,
      newUsers,
      activeUsers,
      inactiveUsers,
      topActiveUsers,
      topPosters,
      topReportedUsers,
      recentWarnings,
      userActivityTrend,
      userBehaviorStats,
      anomalyDetection,
    ] = await Promise.all([
      User.countDocuments({ active: true }),
      User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        active: true,
      }),
      User.countDocuments({
        lastSeen: { $gte: startDate, $lte: endDate },
        active: true,
      }),
      User.countDocuments({
        lastSeen: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        active: true,
      }),
      getTopActiveUsers(startDate, endDate),
      getTopPosters(startDate, endDate),
      getTopReportedUsers(startDate, endDate),
      getRecentWarnings(startDate, endDate),
      getUserActivityTrend(startDate, endDate),
      getUserBehaviorStats(startDate, endDate),
      getAnomalyDetection(startDate, endDate),
    ]);

    const userStats = {
      overview: {
        totalUsers,
        newUsers,
        activeUsers,
        inactiveUsers,
        activityRate:
          totalUsers > 0
            ? Number(((activeUsers / totalUsers) * 100).toFixed(1))
            : 0,
      },
      leaderboards: {
        topActiveUsers,
        topPosters,
        topReportedUsers,
      },
      recentWarnings,
      trends: userActivityTrend,
      behavior: userBehaviorStats,
      anomalies: anomalyDetection,
      period: {
        start: startDate,
        end: endDate,
        label: period,
      },
    };

    res.json({
      success: true,
      data: userStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê người dùng",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper functions
async function getTopActiveUsers(startDate, endDate) {
  return await User.aggregate([
    {
      $match: {
        lastSeen: { $gte: startDate, $lte: endDate },
        active: true,
      },
    },
    {
      $lookup: {
        from: "posts",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userCreateID", "$$userId"] },
              createdAt: { $gte: startDate, $lte: endDate },
              isDeletedByUser: false,
            },
          },
        ],
        as: "userPosts",
      },
    },
    {
      $lookup: {
        from: "comments",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userID", "$$userId"] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
        ],
        as: "userComments",
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        lastSeen: 1,
        postCount: { $size: "$userPosts" },
        commentCount: { $size: "$userComments" },
        totalActivity: {
          $add: [{ $size: "$userPosts" }, { $size: "$userComments" }],
        },
      },
    },
    {
      $sort: { totalActivity: -1 },
    },
    {
      $limit: 10,
    },
  ]);
}

async function getTopPosters(startDate, endDate) {
  return await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeletedByUser: false,
        isBlocked: false,
      },
    },
    {
      $group: {
        _id: "$userCreateID",
        postCount: { $sum: 1 },
        totalLikes: { $sum: "$likeCount" },
        totalComments: { $sum: "$commentCount" },
      },
    },
    {
      $sort: { postCount: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: {
        path: "$userInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        username: "$userInfo.username",
        email: "$userInfo.email",
        postCount: 1,
        totalLikes: 1,
        totalComments: 1,
        engagementRate: {
          $cond: {
            if: { $gt: ["$postCount", 0] },
            then: {
              $divide: [
                { $add: ["$totalLikes", "$totalComments"] },
                "$postCount",
              ],
            },
            else: 0,
          },
        },
      },
    },
  ]);
}

async function getTopReportedUsers(startDate, endDate) {
  return await Violation.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$userId",
        reportCount: { $sum: 1 },
        pendingReports: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        approvedReports: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
      },
    },
    {
      $sort: { reportCount: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: {
        path: "$userInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        username: "$userInfo.username",
        email: "$userInfo.email",
        reportCount: 1,
        pendingReports: 1,
        approvedReports: 1,
        warningCount: "$userInfo.warningCount",
        violationCount: "$userInfo.violationCount",
      },
    },
  ]);
}

async function getRecentWarnings(startDate, endDate) {
  return await User.aggregate([
    {
      $match: {
        active: true,
        // BẮT BUỘC: Phải có vi phạm trong khoảng thời gian đã chọn
        lastViolationAt: { $gte: startDate, $lte: endDate },

        // (Tùy chọn) Nếu bạn muốn lọc thêm là phải có ít nhất 1 lỗi thì mở dòng dưới
        // $or: [{ warningCount: { $gt: 0 } }, { violationCount: { $gt: 0 } }]
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        warningCount: 1,
        violationCount: 1,
        lastViolationAt: 1,
        lastSeen: 1, // Thêm lastSeen để biết họ còn onl không

        // Logic Risk Level của bạn rất tốt, giữ nguyên
        riskLevel: {
          $switch: {
            branches: [
              // Ưu tiên 1: Vi phạm nhiều (High)
              { case: { $gte: ["$violationCount", 3] }, then: "high" },
              // Ưu tiên 2: Cảnh báo nhiều (Medium)
              { case: { $gte: ["$warningCount", 2] }, then: "medium" },
            ],
            default: "low",
          },
        },
      },
    },
    {
      // Sắp xếp: Ưu tiên người vừa vi phạm gần nhất, sau đó đến số lượng vi phạm
      $sort: {
        lastViolationAt: -1, // Mới nhất lên đầu (Quan trọng với 'Recent')
        violationCount: -1, // Ai vi phạm nhiều lên đầu
      },
    },
    {
      $limit: 20,
    },
  ]);
}
async function getUserActivityTrend(startDate, endDate) {
  return await User.aggregate([
    {
      $match: {
        lastSeen: { $gte: startDate, $lte: endDate },
        active: true,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$lastSeen" },
        },
        activeUsers: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        date: "$_id",
        activeUsers: 1,
        _id: 0,
      },
    },
  ]);
}

async function getUserBehaviorStats(startDate, endDate) {
  const [postFrequency, searchFrequency, onlineTime] = await Promise.all([
    Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeletedByUser: false,
        },
      },
      {
        $group: {
          _id: "$userCreateID",
          postCount: { $sum: 1 },
          daysActive: {
            $addToSet: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
      },
      {
        $project: {
          postCount: 1,
          uniqueDays: { $size: "$daysActive" },
          avgPostsPerDay: {
            $cond: {
              if: { $gt: [{ $size: "$daysActive" }, 0] },
              then: { $divide: ["$postCount", { $size: "$daysActive" }] },
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          avgPostFrequency: { $avg: "$avgPostsPerDay" },
          maxPostFrequency: { $max: "$avgPostsPerDay" },
          totalPosts: { $sum: "$postCount" },
        },
      },
    ]),

    AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          action: { $regex: "search", $options: "i" },
        },
      },
      {
        $group: {
          _id: "$actorId",
          searchCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          avgSearchesPerUser: { $avg: "$searchCount" },
          totalSearches: { $sum: "$searchCount" },
          uniqueSearchers: { $sum: 1 },
        },
      },
    ]),

    User.aggregate([
      {
        $match: {
          lastSeen: { $gte: startDate, $lte: endDate },
          active: true,
          lastLogin: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          username: 1,
          onlineMinutes: {
            $divide: [{ $subtract: ["$lastSeen", "$lastLogin"] }, 60000],
          },
        },
      },
      {
        $match: {
          onlineMinutes: { $gt: 0, $lt: 24 * 60 * 7 }, // Loại bỏ giá trị bất thường (> 1 tuần)
        },
      },
      {
        $group: {
          _id: null,
          avgOnlineTime: { $avg: "$onlineMinutes" },
          maxOnlineTime: { $max: "$onlineMinutes" },
          minOnlineTime: { $min: "$onlineMinutes" },
          totalUsers: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    postFrequency: postFrequency[0] || {
      avgPostFrequency: 0,
      maxPostFrequency: 0,
      totalPosts: 0,
    },
    searchFrequency: searchFrequency[0] || {
      avgSearchesPerUser: 0,
      totalSearches: 0,
      uniqueSearchers: 0,
    },
    onlineTime: onlineTime[0] || {
      avgOnlineTime: 0,
      maxOnlineTime: 0,
      minOnlineTime: 0,
      totalUsers: 0,
    },
  };
}

async function getAnomalyDetection(startDate, endDate) {
  const [suspiciousUsers, highReportUsers, spamUsers] = await Promise.all([
    User.aggregate([
      {
        $match: {
          active: true,
          $or: [{ warningCount: { $gte: 1 } }, { violationCount: { $gte: 1 } }],
        },
      },
      {
        $lookup: {
          from: "violations",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
          ],
          as: "recentViolations",
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userCreateID", "$$userId"] },
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
          ],
          as: "recentPosts",
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          fullName: 1,
          warningCount: 1,
          violationCount: 1,
          lastSeen: 1,
          lastViolationAt: 1,
          recentViolationCount: { $size: "$recentViolations" },
          recentPostCount: { $size: "$recentPosts" },
          riskScore: {
            $add: [
              { $multiply: ["$warningCount", 10] },
              { $multiply: ["$violationCount", 20] },
              { $multiply: ["$recentViolationCount", 30] },
            ],
          },
        },
      },
      {
        $addFields: {
          riskLevel: {
            $switch: {
              branches: [
                { case: { $gte: ["$riskScore", 50] }, then: "high" },
                { case: { $gte: ["$riskScore", 20] }, then: "medium" },
              ],
              default: "low",
            },
          },
        },
      },
      {
        $sort: { riskScore: -1 },
      },
      {
        $limit: 50,
      },
    ]),

    Violation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$userId",
          reportCount: { $sum: 1 },
          uniqueReporters: { $addToSet: "$reportedBy" },
        },
      },
      {
        $match: {
          reportCount: { $gte: 3 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          username: "$userInfo.username",
          email: "$userInfo.email",
          reportCount: 1,
          uniqueReporters: { $size: "$uniqueReporters" },
          reportFrequency: {
            $cond: {
              if: { $gt: [{ $size: "$uniqueReporters" }, 0] },
              then: {
                $divide: ["$reportCount", { $size: "$uniqueReporters" }],
              },
              else: 0,
            },
          },
        },
      },
      {
        $sort: { reportCount: -1 },
      },
    ]),

    Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          type: "FORCE_LOGOUT",
        },
      },
      {
        $group: {
          _id: "$recipient",
          totalViolations: { $sum: 1 },
          uniqueDates: {
            $addToSet: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
          },
        },
      },
      {
        $addFields: {
          uniqueDaysCount: { $size: "$uniqueDates" },
        },
      },
      {
        $addFields: {
          avgViolationsPerDay: {
            $divide: ["$totalViolations", { $max: ["$uniqueDaysCount", 1] }],
          },
        },
      },
      {
        $match: {
          avgViolationsPerDay: { $gte: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          username: "$userInfo.username",
          email: "$userInfo.email",
          totalViolations: 1,
          avgViolationsPerDay: 1,
          uniqueDaysCount: 1,
        },
      },
      {
        $sort: { avgViolationsPerDay: -1 },
      },
    ]),
  ]);

  return {
    suspiciousUsers,
    highReportUsers,
    spamUsers,
    summary: {
      totalSuspicious: suspiciousUsers.length,
      totalHighRisk: suspiciousUsers.filter((u) => u.riskLevel === "high")
        .length,
      totalMediumRisk: suspiciousUsers.filter((u) => u.riskLevel === "medium")
        .length,
    },
  };
}

// Lấy lịch sử tìm kiếm khả nghi
exports.getSuspiciousSearches = async (req, res) => {
  try {
    const { period = "today", limit = 50 } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const suspiciousSearches = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          action: "search",
          "meta.searchTerm": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            actorId: "$actorId",
            searchTerm: "$meta.searchTerm",
          },
          searchCount: { $sum: 1 },
          firstSearch: { $min: "$timestamp" },
          lastSearch: { $max: "$timestamp" },
          ips: { $addToSet: "$ip" },
        },
      },
      {
        $match: {
          $or: [{ searchCount: { $gte: 10 } }, { ips: { $size: { $gte: 3 } } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.actorId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          username: "$userInfo.username",
          email: "$userInfo.email",
          searchTerm: "$_id.searchTerm",
          searchCount: 1,
          firstSearch: 1,
          lastSearch: 1,
          uniqueIPs: { $size: "$ips" },
          timeSpan: {
            $divide: [
              { $subtract: ["$lastSearch", "$firstSearch"] },
              1000 * 60,
            ],
          },
        },
      },
      {
        $sort: { searchCount: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    res.json({
      success: true,
      data: suspiciousSearches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Suspicious searches error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử tìm kiếm khả nghi",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Chi tiết người dùng cụ thể
exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = "today" } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const [user, userPosts, userComments, userViolations, userSearches] =
      await Promise.all([
        User.findById(userId).select("-password"),
        Post.find({
          userCreateID: userId,
          createdAt: { $gte: startDate, $lte: endDate },
          isDeletedByUser: false,
        })
          .sort({ createdAt: -1 })
          .limit(50),
        Comment.find({
          userID: userId,
          createdAt: { $gte: startDate, $lte: endDate },
        })
          .sort({ createdAt: -1 })
          .limit(50),
        Violation.find({
          userId: userId,
          createdAt: { $gte: startDate, $lte: endDate },
        }).sort({ createdAt: -1 }),
        AuditLog.find({
          actorId: userId,
          action: "search",
          timestamp: { $gte: startDate, $lte: endDate },
        })
          .sort({ timestamp: -1 })
          .limit(50),
      ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    const userDetail = {
      profile: user,
      activity: {
        posts: userPosts.length,
        comments: userComments.length,
        searches: userSearches.length,
        violations: userViolations.length,
      },
      posts: userPosts,
      comments: userComments,
      violations: userViolations,
      searches: userSearches,
      period: {
        start: startDate,
        end: endDate,
      },
    };

    res.json({
      success: true,
      data: userDetail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("User detail error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết người dùng",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
