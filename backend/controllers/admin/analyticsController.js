// controllers/admin/analyticsController.js
const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const Violation = require("../../models/Violation");
const Journal = require("../../models/Journal");
const EmergencyRequest = require("../../models/EmergencyRequest");
const AuditLog = require("../../models/AuditLog");

// Helper function để tính toán khoảng thời gian với filters
const getDateRange = (period, filters = {}) => {
  const now = new Date();
  let startDate,
    endDate = new Date();

  // Ưu tiên date range từ filters nếu có
  if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
    startDate = new Date(filters.dateRange.start);
    endDate = new Date(filters.dateRange.end);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    return { startDate, endDate };
  }

  // Fallback về period nếu không có filters
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
    case "quarter":
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

// Helper function để build query từ filters
const buildFilterQuery = (filters = {}) => {
  const query = {};

  // User filters
  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.userStatus) {
    if (filters.userStatus === "active") {
      query.active = true;
    } else if (filters.userStatus === "inactive") {
      query.active = false;
    } else if (filters.userStatus === "suspended") {
      query.isSuspended = true;
    } else if (filters.userStatus === "banned") {
      query.isBanned = true;
    }
  }

  if (filters.userSearch) {
    query.$or = [
      { username: { $regex: filters.userSearch, $options: "i" } },
      { email: { $regex: filters.userSearch, $options: "i" } },
      { fullName: { $regex: filters.userSearch, $options: "i" } },
    ];
  }

  return query;
};

// Helper function để build post query từ filters
const buildPostFilterQuery = (filters = {}) => {
  const query = { isDeletedByUser: false };

  if (filters.postType) {
    switch (filters.postType) {
      case "text":
        query.files = { $size: 0 };
        break;
      case "media":
        query.files = { $gt: [] };
        break;
      case "anonymous":
        query.isAnonymous = true;
        break;
      case "emergency":
        query.isEmergency = true;
        break;
    }
  }

  if (filters.privacy) {
    query.privacy = filters.privacy;
  }

  if (filters.contentSearch) {
    query.$or = [
      { content: { $regex: filters.contentSearch, $options: "i" } },
      { title: { $regex: filters.contentSearch, $options: "i" } },
    ];
  }

  if (filters.minLikes) {
    query.likeCount = { $gte: parseInt(filters.minLikes) || 0 };
  }

  if (filters.minComments) {
    query.commentCount = { $gte: parseInt(filters.minComments) || 0 };
  }

  return query;
};

// Helper function để định dạng phản hồi thống nhất
const formatAnalyticsResponse = (data, period, filters = {}) => {
  return {
    success: true,
    period,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    data: data,
    timestamp: new Date().toISOString(),
  };
};

// Helper để parse filters từ query parameters
const parseFiltersFromQuery = (query) => {
  const filters = {};

  Object.keys(query).forEach((key) => {
    if (key.startsWith("filters[")) {
      const filterKey = key.match(/filters\[(.*?)\]/)[1];
      filters[filterKey] = query[key];
    } else if (key.includes("[")) {
      const match = key.match(/(\w+)\[(\w+)\]/);
      if (match) {
        const [_, parentKey, childKey] = match;
        if (!filters[parentKey]) filters[parentKey] = {};
        filters[parentKey][childKey] = query[key];
      }
    }
  });

  return filters;
};

// Tổng quan hệ thống với filters
exports.getOverview = async (req, res) => {
  try {
    const { period = "today" } = req.query;

    // Parse filters từ query parameters
    const filters = parseFiltersFromQuery(req.query);

    const { startDate, endDate } = getDateRange(period, filters);

    console.log(
      `Analytics request - Period: ${period}, Date range: ${startDate} to ${endDate}`
    );

    // A. Chỉ số tổng quan (KPIs) với filters
    const kpis = await getKPIs(startDate, endDate, period, filters);

    // B. Dữ liệu biểu đồ với filters
    const charts = await getChartData(startDate, endDate, period, filters);

    // C. Cảnh báo nhanh với filters
    const alerts = await getQuickAlerts(startDate, endDate, filters);

    const overviewData = {
      kpis,
      charts,
      alerts,
      summary: {
        totalUsers: await User.countDocuments({ active: true }),
        totalPosts: await Post.countDocuments({ isDeletedByUser: false }),
        totalViolations: await Violation.countDocuments(),
        period: {
          start: startDate,
          end: endDate,
        },
      },
    };

    res.json(formatAnalyticsResponse(overviewData, period, filters));
  } catch (error) {
    console.error("Analytics overview error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu tổng quan",
      error: error.message,
    });
  }
};

// A. Lấy chỉ số KPIs với filters
async function getKPIs(startDate, endDate, period, filters = {}) {
  const userFilterQuery = buildFilterQuery(filters);
  const postFilterQuery = buildPostFilterQuery(filters);

  const [
    activeUsers,
    newPosts,
    violations,
    searchActivities,
    conversionRate,
    totalUsers,
    totalPosts,
    totalViolations,
    newUsers,
    engagementRate,
  ] = await Promise.all([
    // Người dùng hoạt động với filters
    User.countDocuments({
      $or: [
        { lastSeen: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } },
      ],
      active: true,
      ...userFilterQuery,
    }),

    // Bài viết mới với filters
    Post.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      ...postFilterQuery,
    }),

    // Báo cáo vi phạm mới
    Violation.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    }),

    // Lượt tìm kiếm (từ AuditLog)
    AuditLog.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate },
      action: "search",
    }),

    // Tính tỷ lệ chuyển đổi
    calculateConversionRate(startDate, endDate, filters),

    // Tổng số (cho context)
    User.countDocuments({ active: true, ...userFilterQuery }),
    Post.countDocuments({ isDeletedByUser: false, ...postFilterQuery }),
    Violation.countDocuments({ status: { $in: ["pending", "reviewed"] } }),

    // Người dùng mới với filters
    User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      active: true,
      ...userFilterQuery,
    }),

    // Tỷ lệ tương tác
    calculateEngagementRate(startDate, endDate, filters),
  ]);

  return {
    activeUsers: {
      current: activeUsers,
      total: totalUsers,
      trend: await calculateTrend("activeUsers", period, filters),
    },
    newPosts: {
      current: newPosts,
      total: totalPosts,
      trend: await calculateTrend("newPosts", period, filters),
    },
    violations: {
      current: violations,
      total: totalViolations,
      trend: await calculateTrend("violations", period, filters),
    },
    searchActivities: {
      current: searchActivities,
      trend: await calculateTrend("searchActivities", period, filters),
    },
    conversionRate: {
      current: conversionRate,
      trend: await calculateTrend("conversionRate", period, filters),
    },
    newUsers: {
      current: newUsers,
      trend: await calculateTrend("newUsers", period, filters),
    },
    engagementRate: {
      current: engagementRate,
      trend: await calculateTrend("engagementRate", period, filters),
    },
  };
}

// B. Lấy dữ liệu biểu đồ với filters
async function getChartData(startDate, endDate, period, filters = {}) {
  const [activeUsersByDay, postsByWeek, violationTypes, userEngagement] =
    await Promise.all([
      getActiveUsersByDay(startDate, endDate, filters),
      getPostsByWeek(startDate, endDate, filters),
      getViolationTypesDistribution(startDate, endDate, filters),
      getUserEngagementData(startDate, endDate, [
        "activeUsers",
        "newUsers",
        "posts",
      ]),
    ]);

  return {
    activeUsersByDay,
    postsByWeek,
    violationTypes,
    userEngagement,
  };
}

// C. Lấy cảnh báo nhanh với filters
async function getQuickAlerts(startDate, endDate, filters = {}) {
  const alerts = [];
  const userFilterQuery = buildFilterQuery(filters);

  try {
    // 1. Người dùng tạo quá nhiều bài trong thời gian ngắn
    const spamUsers = await User.aggregate([
      {
        $match: {
          ...userFilterQuery,
          active: true,
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userCreateID",
          as: "userPosts",
        },
      },
      {
        $addFields: {
          recentPosts: {
            $filter: {
              input: "$userPosts",
              as: "post",
              cond: {
                $and: [
                  { $gte: ["$$post.createdAt", startDate] },
                  { $lte: ["$$post.createdAt", endDate] },
                  { $eq: ["$$post.isDeletedByUser", false] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          postCount: { $size: "$recentPosts" },
        },
      },
      {
        $match: {
          postCount: { $gt: filters.minPosts || 10 },
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          postCount: 1,
          lastSeen: 1,
        },
      },
      {
        $sort: { postCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    if (spamUsers.length > 0) {
      alerts.push({
        type: "SPAM_POSTS",
        severity: "warning",
        message: `${spamUsers.length} người dùng tạo nhiều bài viết bất thường`,
        users: spamUsers,
        count: spamUsers.length,
        date: new Date().toISOString(),
      });
    }

    // 2. User bị báo cáo quá nhiều
    const reportedUsers = await Violation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$userId",
          reportCount: { $sum: 1 },
          reasons: { $addToSet: "$reason" },
        },
      },
      {
        $match: {
          reportCount: { $gt: 3 },
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
        $project: {
          userId: "$_id",
          username: { $arrayElemAt: ["$userInfo.username", 0] },
          email: { $arrayElemAt: ["$userInfo.email", 0] },
          reportCount: 1,
          reasons: 1,
        },
      },
      {
        $sort: { reportCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    if (reportedUsers.length > 0) {
      alerts.push({
        type: "HIGH_REPORTS",
        severity: "high",
        message: `${reportedUsers.length} người dùng nhận nhiều báo cáo`,
        users: reportedUsers,
        count: reportedUsers.length,
        date: new Date().toISOString(),
      });
    }

    // 3. Tìm kiếm tăng đột biến
    const searchStats = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          action: "search",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          searchCount: { $sum: 1 },
        },
      },
      {
        $sort: { searchCount: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    if (searchStats.length > 0 && searchStats[0].searchCount > 500) {
      alerts.push({
        type: "SEARCH_SPIKE",
        severity: "medium",
        message: `Lượt tìm kiếm tăng đột biến: ${searchStats[0].searchCount} lượt/ngày`,
        date: searchStats[0]._id,
        count: searchStats[0].searchCount,
      });
    }

    // 4. Bài viết có engagement cao bất thường
    const highEngagementPosts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeletedByUser: false,
          $or: [{ likeCount: { $gt: 100 } }, { commentCount: { $gt: 50 } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userCreateID",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $project: {
          content: { $substr: ["$content", 0, 100] },
          likeCount: 1,
          commentCount: 1,
          createdAt: 1,
          author: { $arrayElemAt: ["$author.username", 0] },
          engagement: { $add: ["$likeCount", "$commentCount"] },
        },
      },
      {
        $sort: { engagement: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    if (highEngagementPosts.length > 0) {
      alerts.push({
        type: "HIGH_ENGAGEMENT",
        severity: "info",
        message: `${highEngagementPosts.length} bài viết có tương tác rất cao`,
        posts: highEngagementPosts,
        count: highEngagementPosts.length,
        date: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error generating alerts:", error);
  }

  return alerts;
}

// Helper functions được cập nhật với filters
async function calculateConversionRate(startDate, endDate, filters = {}) {
  const userFilterQuery = buildFilterQuery(filters);
  const postFilterQuery = buildPostFilterQuery(filters);

  const [newUsersWithPosts, totalNewUsers] = await Promise.all([
    User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      active: true,
      ...userFilterQuery,
      _id: {
        $in: await Post.distinct("userCreateID", {
          createdAt: { $gte: startDate, $lte: endDate },
          ...postFilterQuery,
        }),
      },
    }),
    User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      active: true,
      ...userFilterQuery,
    }),
  ]);

  return totalNewUsers > 0
    ? parseFloat(((newUsersWithPosts / totalNewUsers) * 100).toFixed(2))
    : 0;
}

async function calculateEngagementRate(startDate, endDate, filters = {}) {
  const postFilterQuery = buildPostFilterQuery(filters);

  const engagementStats = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        ...postFilterQuery,
      },
    },
    {
      $group: {
        _id: null,
        totalEngagement: {
          $sum: { $add: ["$likeCount", "$commentCount"] },
        },
        postCount: { $sum: 1 },
      },
    },
  ]);

  if (engagementStats.length === 0 || engagementStats[0].postCount === 0) {
    return 0;
  }

  return parseFloat(
    (engagementStats[0].totalEngagement / engagementStats[0].postCount).toFixed(
      2
    )
  );
}

async function getActiveUsersByDay(startDate, endDate, filters = {}) {
  const userFilterQuery = buildFilterQuery(filters);

  const result = await User.aggregate([
    {
      $match: {
        lastSeen: { $gte: startDate, $lte: endDate },
        active: true,
        ...userFilterQuery,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$lastSeen" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        date: "$_id",
        activeUsers: "$count",
        _id: 0,
      },
    },
  ]);

  // Fill missing dates với giá trị 0
  return fillMissingDates(result, startDate, endDate, "activeUsers");
}

async function getPostsByWeek(startDate, endDate, filters = {}) {
  const postFilterQuery = buildPostFilterQuery(filters);

  const result = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        ...postFilterQuery,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%U", date: "$createdAt" }, // Year-Week number
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        week: "$_id",
        newPosts: "$count",
        _id: 0,
      },
    },
  ]);

  return result;
}

async function getViolationTypesDistribution(startDate, endDate, filters = {}) {
  const result = await Violation.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$reason",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $project: {
        reason: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);

  return result;
}

async function getUserEngagementData(startDate, endDate, metrics = []) {
  const [dailyActive, newRegistrations, userPosts] = await Promise.all([
    // Daily active users
    User.aggregate([
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
      { $sort: { _id: 1 } },
    ]),

    // New registrations
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          active: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // User posts activity
    Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeletedByUser: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          posts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Merge data by date
  const dateMap = new Map();

  dailyActive.forEach((item) => {
    dateMap.set(item._id, {
      date: item._id,
      activeUsers: item.activeUsers || 0,
      newUsers: 0,
      posts: 0,
    });
  });

  newRegistrations.forEach((item) => {
    if (dateMap.has(item._id)) {
      dateMap.get(item._id).newUsers = item.newUsers || 0;
    } else {
      dateMap.set(item._id, {
        date: item._id,
        activeUsers: 0,
        newUsers: item.newUsers || 0,
        posts: 0,
      });
    }
  });

  userPosts.forEach((item) => {
    if (dateMap.has(item._id)) {
      dateMap.get(item._id).posts = item.posts || 0;
    } else {
      dateMap.set(item._id, {
        date: item._id,
        activeUsers: 0,
        newUsers: 0,
        posts: item.posts || 0,
      });
    }
  });

  return Array.from(dateMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days
}

// Helper để fill missing dates trong time series data
function fillMissingDates(data, startDate, endDate, valueField = "count") {
  const result = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  const dataMap = new Map();
  data.forEach((item) => {
    dataMap.set(item.date, item[valueField] || item.count || 0);
  });

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      [valueField]: dataMap.get(dateStr) || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

async function calculateTrend(metric, period, filters = {}) {
  // Demo trend calculation - trong thực tế sẽ so sánh với period trước
  const trends = {
    activeUsers: (Math.random() * 15 - 5).toFixed(1),
    newPosts: (Math.random() * 20 - 8).toFixed(1),
    violations: (Math.random() * 25 - 10).toFixed(1),
    searchActivities: (Math.random() * 30 - 12).toFixed(1),
    conversionRate: (Math.random() * 10 - 3).toFixed(1),
    newUsers: (Math.random() * 18 - 6).toFixed(1),
    engagementRate: (Math.random() * 12 - 4).toFixed(1),
  };

  return parseFloat(trends[metric] || 0);
}

// API để lấy real-time data
exports.getRealTimeData = async (req, res) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [recentUsers, recentPosts, recentViolations, activeSessions] =
      await Promise.all([
        User.countDocuments({
          lastSeen: { $gte: fiveMinutesAgo },
        }),
        Post.countDocuments({
          createdAt: { $gte: fiveMinutesAgo },
        }),
        Violation.countDocuments({
          createdAt: { $gte: fiveMinutesAgo },
        }),
        AuditLog.countDocuments({
          timestamp: { $gte: fiveMinutesAgo },
          action: "session_start",
        }),
      ]);

    res.json(
      formatAnalyticsResponse(
        {
          recentUsers,
          recentPosts,
          recentViolations,
          activeSessions,
          lastUpdate: new Date().toISOString(),
        },
        "realtime"
      )
    );
  } catch (error) {
    console.error("Real-time data error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu real-time",
      error: error.message,
    });
  }
};

// Health check endpoint
exports.getHealth = async (req, res) => {
  try {
    const [userCount, postCount, violationCount, dbConnection] =
      await Promise.all([
        User.countDocuments({ active: true }),
        Post.countDocuments({ isDeletedByUser: false }),
        Violation.countDocuments({ status: "pending" }),
        User.db.db.command({ ping: 1 }), // Test database connection
      ]);

    res.json({
      success: true,
      data: {
        status: "healthy",
        userCount,
        postCount,
        pendingViolations: violationCount,
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
};

// Thống kê chi tiết theo loại với filters
exports.getDetailedStats = async (req, res) => {
  try {
    const { type, period = "today" } = req.query;
    const filters = parseFiltersFromQuery(req.query);
    const { startDate, endDate } = getDateRange(period, filters);

    let data = {};

    switch (type) {
      case "users":
        data = await getUserStats(startDate, endDate, filters);
        break;
      case "posts":
        data = await getPostStats(startDate, endDate, filters);
        break;
      case "violations":
        data = await getViolationStats(startDate, endDate, filters);
        break;
      case "search":
        data = await getSearchStats(startDate, endDate, filters);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Loại thống kê không hợp lệ",
        });
    }

    res.json(formatAnalyticsResponse(data, period, filters));
  } catch (error) {
    console.error("Detailed stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê chi tiết",
      error: error.message,
    });
  }
};

// Cập nhật các hàm thống kê chi tiết để nhận filters
async function getUserStats(startDate, endDate, filters = {}) {
  const userFilterQuery = buildFilterQuery(filters);

  const [newUsers, activeUsers, userRoles, userActivity] = await Promise.all([
    User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      active: true,
      ...userFilterQuery,
    }),
    User.countDocuments({
      lastSeen: { $gte: startDate, $lte: endDate },
      active: true,
      ...userFilterQuery,
    }),
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          active: true,
          ...userFilterQuery,
        },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),
    User.aggregate([
      {
        $match: {
          lastSeen: { $gte: startDate, $lte: endDate },
          active: true,
          ...userFilterQuery,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$lastSeen" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    newUsers,
    activeUsers,
    userRoles,
    userActivity,
    totalUsers: await User.countDocuments({ active: true, ...userFilterQuery }),
  };
}

async function getPostStats(startDate, endDate, filters = {}) {
  const postFilterQuery = buildPostFilterQuery(filters);

  const [totalPosts, postsWithMedia, privacyStats, popularPosts] =
    await Promise.all([
      Post.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        ...postFilterQuery,
      }),
      Post.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        "files.0": { $exists: true },
        ...postFilterQuery,
      }),
      Post.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            ...postFilterQuery,
          },
        },
        {
          $group: {
            _id: "$privacy",
            count: { $sum: 1 },
          },
        },
      ]),
      Post.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            ...postFilterQuery,
          },
        },
        {
          $sort: { likeCount: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            content: { $substr: ["$content", 0, 100] },
            likeCount: 1,
            commentCount: 1,
            createdAt: 1,
            privacy: 1,
          },
        },
      ]),
    ]);

  return { totalPosts, postsWithMedia, privacyStats, popularPosts };
}

async function getViolationStats(startDate, endDate, filters = {}) {
  const [totalViolations, statusStats, typeStats, resolutionStats] =
    await Promise.all([
      Violation.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      Violation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
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
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$targetType",
            count: { $sum: 1 },
          },
        },
      ]),
      Violation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            reviewedAt: { $exists: true },
          },
        },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ["$reviewedAt", "$createdAt"] },
                1000 * 60 * 60, // Convert to hours
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: "$resolutionTime" },
            minResolutionTime: { $min: "$resolutionTime" },
            maxResolutionTime: { $max: "$resolutionTime" },
          },
        },
      ]),
    ]);

  return {
    totalViolations,
    statusStats,
    typeStats,
    resolutionStats: resolutionStats[0] || {},
  };
}

async function getSearchStats(startDate, endDate, filters = {}) {
  const [totalSearches, popularSearches, searchTrends] = await Promise.all([
    AuditLog.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate },
      action: "search",
    }),
    AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          action: "search",
        },
      },
      {
        $group: {
          _id: "$meta.searchTerm",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]),
    AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          action: "search",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
  ]);

  return { totalSearches, popularSearches, searchTrends };
}

// Lấy dữ liệu biểu đồ tùy chỉnh
exports.getCustomChartData = async (req, res) => {
  try {
    const { chartType, period = "today", metrics = [] } = req.body;
    const { startDate, endDate } = getDateRange(period);

    let chartData = {};

    switch (chartType) {
      case "user_engagement":
        chartData = await getUserEngagementData(startDate, endDate, metrics);
        break;
      case "content_analysis":
        chartData = await getContentAnalysisData(startDate, endDate, metrics);
        break;
      case "violation_trends":
        chartData = await getViolationTrendsData(startDate, endDate, metrics);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Loại biểu đồ không hợp lệ",
        });
    }

    res.json(formatAnalyticsResponse(chartData, period));
  } catch (error) {
    console.error("Custom chart data error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu biểu đồ tùy chỉnh",
      error: error.message,
    });
  }
};

// Xuất dữ liệu analytics
exports.exportAnalytics = async (req, res) => {
  try {
    const { format = "csv", period = "today", type = "overview" } = req.query;
    const filters = parseFiltersFromQuery(req.query);
    const { startDate, endDate } = getDateRange(period, filters);

    let data;
    let filename;

    switch (type) {
      case "users":
        data = await getUserStats(startDate, endDate, filters);
        filename = `users-analytics-${period}`;
        break;
      case "posts":
        data = await getPostStats(startDate, endDate, filters);
        filename = `posts-analytics-${period}`;
        break;
      case "violations":
        data = await getViolationStats(startDate, endDate, filters);
        filename = `violations-analytics-${period}`;
        break;
      case "overview":
        data = await getOverviewDataForExport(startDate, endDate, filters);
        filename = `overview-analytics-${period}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Loại xuất dữ liệu không hợp lệ",
        });
    }

    if (format === "csv") {
      const csvData = convertToCSV(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename}-${new Date().getTime()}.csv`
      );
      return res.send(csvData);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename}-${new Date().getTime()}.json`
      );
      return res.json(data);
    } else {
      return res.status(400).json({
        success: false,
        message: "Định dạng xuất không được hỗ trợ",
      });
    }
  } catch (error) {
    console.error("Export analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xuất dữ liệu",
      error: error.message,
    });
  }
};

async function getOverviewDataForExport(startDate, endDate, filters = {}) {
  const [userStats, postStats, violationStats, overview] = await Promise.all([
    getUserStats(startDate, endDate, filters),
    getPostStats(startDate, endDate, filters),
    getViolationStats(startDate, endDate, filters),
    getKPIs(startDate, endDate, "custom", filters),
  ]);

  return {
    period: {
      startDate,
      endDate,
    },
    filters,
    userStats,
    postStats,
    violationStats,
    overview,
    exportedAt: new Date().toISOString(),
  };
}

function convertToCSV(data) {
  const flattenObject = (obj, prefix = "") => {
    return Object.keys(obj).reduce((acc, key) => {
      const pre = prefix.length ? prefix + "." : "";
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        Object.assign(acc, flattenObject(obj[key], pre + key));
      } else {
        acc[pre + key] = obj[key];
      }
      return acc;
    }, {});
  };

  if (Array.isArray(data)) {
    if (data.length === 0) return "";
    const headers = Object.keys(flattenObject(data[0])).join(",");
    const rows = data.map((row) => {
      const flatRow = flattenObject(row);
      return Object.values(flatRow)
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",");
    });
    return [headers, ...rows].join("\n");
  } else {
    const flatData = flattenObject(data);
    const headers = Object.keys(flatData).join(",");
    const row = Object.values(flatData)
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
    return [headers, row].join("\n");
  }
}


async function getContentAnalysisData(startDate, endDate, metrics) {
  const [postsByType, engagementRate, popularContent] = await Promise.all([
    Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeletedByUser: false,
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $gt: [{ $size: "$files" }, 0] },
              then: "with_media",
              else: "text_only",
            },
          },
          count: { $sum: 1 },
          avgLikes: { $avg: "$likeCount" },
          avgComments: { $avg: "$commentCount" },
        },
      },
    ]),
    Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeletedByUser: false,
        },
      },
      {
        $project: {
          engagement: {
            $add: ["$likeCount", "$commentCount"],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgEngagement: { $avg: "$engagement" },
          maxEngagement: { $max: "$engagement" },
          minEngagement: { $min: "$engagement" },
        },
      },
    ]),
    Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeletedByUser: false,
          likeCount: { $gt: 10 },
        },
      },
      {
        $sort: { likeCount: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          content: { $substr: ["$content", 0, 100] },
          likeCount: 1,
          commentCount: 1,
          createdAt: 1,
        },
      },
    ]),
  ]);

  return {
    postsByType,
    engagementRate: engagementRate[0] || {},
    popularContent,
  };
}

async function getViolationTrendsData(startDate, endDate, metrics) {
  const [violationsByDay, resolutionTime, topReportedUsers] = await Promise.all(
    [
      Violation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
              },
            },
            resolved: {
              $sum: {
                $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Violation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            reviewedAt: { $exists: true },
          },
        },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ["$reviewedAt", "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: "$resolutionTime" },
            maxResolutionTime: { $max: "$resolutionTime" },
            minResolutionTime: { $min: "$resolutionTime" },
          },
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
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
              },
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
          $project: {
            username: { $arrayElemAt: ["$userInfo.username", 0] },
            reportCount: 1,
            pendingCount: 1,
          },
        },
      ]),
    ]
  );

  return {
    violationsByDay,
    resolutionTime: resolutionTime[0] || {},
    topReportedUsers,
  };
}




module.exports = exports;
