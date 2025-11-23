// controllers/admin/contentAnalyticsController.js
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const Violation = require("../../models/Violation");
const User = require("../../models/User");
const AuditLog = require("../../models/AuditLog");

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

// Helper function để cắt chuỗi an toàn (xử lý ở application level)
const safeSubstring = (str, start, length) => {
  if (!str) return "";
  return str.length <= length
    ? str
    : str.substring(start, start + length) + "...";
};

// A. Tổng quan nội dung
exports.getContentOverview = async (req, res) => {
  try {
    const {
      period = "today",
      startDate: customStart,
      endDate: customEnd,
    } = req.query;
    const { startDate, endDate } = getDateRange(period, customStart, customEnd);

    // Tổng quan nội dung
    const [
      totalPosts,
      newPosts,
      totalComments,
      newComments,
      blockedPosts,
      reportedPosts,
      trendingContent,
      contentQuality,
      geographicDistribution,
    ] = await Promise.all([
      // Tổng số bài viết
      Post.countDocuments({ isDeletedByUser: false }),

      // Bài viết mới trong khoảng thời gian
      Post.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        isDeletedByUser: false,
      }),

      // Tổng số bình luận
      Comment.countDocuments({ isBlocked: false }),

      // Bình luận mới trong khoảng thời gian
      Comment.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        isBlocked: false,
      }),

      // Bài bị block
      getBlockedPosts(startDate, endDate),

      // Bài đang được báo cáo nhiều
      getReportedPosts(startDate, endDate),

      // Top xu hướng nội dung
      getTrendingContent(startDate, endDate),

      // Chất lượng nội dung
      getContentQuality(startDate, endDate),

      // Phân bố địa lý
      getGeographicDistribution(startDate, endDate),
    ]);

    const contentStats = {
      overview: {
        totalPosts,
        newPosts,
        totalComments,
        newComments,
        blockedPosts: blockedPosts,
        engagementRate:
          totalPosts > 0 ? ((newComments / totalPosts) * 100).toFixed(1) : 0,
      },
      reportedPosts,
      trending: trendingContent,
      quality: contentQuality,
      geographic: geographicDistribution,
      period: {
        start: startDate,
        end: endDate,
        label: period,
      },
    };

    res.json({
      success: true,
      data: contentStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Content analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê nội dung",
      error: error.message,
    });
  }
};

// Helper functions - SỬA LỖI UTF-8 Ở ĐÂY
async function getBlockedPosts(startDate, endDate) {
  const posts = await Post.aggregate([
    {
      $match: {
        // SỬA LỖI: Dùng $and để bọc 2 điều kiện $or lại
        $and: [
          // Điều kiện 1: Phải bị block bài HOẶC block comment
          {
            $or: [{ isBlocked: true }, { isBlockedComment: true }],
          },
          // Điều kiện 2: Nằm trong khoảng thời gian (Tạo hoặc Cập nhật)
          {
            $or: [
              { createdAt: { $gte: startDate, $lte: endDate } },
              { updatedAt: { $gte: startDate, $lte: endDate } },
            ],
          },
        ],
        isDeletedByUser: false, // Điều kiện bắt buộc
      },
    },
    // TỐI ƯU: Sort và Limit TRƯỚC khi Lookup
    // Tại sao? Để DB chỉ cần lookup user cho 50 bài cần lấy, thay vì lookup cho hàng nghìn bài rồi mới cắt bớt.
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 50,
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
        content: 1,
        isBlocked: 1,
        isBlockedComment: 1,
        reportCount: 1,
        warningCount: 1,
        createdAt: 1,
        author: { $arrayElemAt: ["$author.username", 0] },
        blockReason: {
          $cond: {
            if: { $and: ["$isBlocked", "$isBlockedComment"] },
            then: "Bài viết & Bình luận",
            else: {
              $cond: {
                if: "$isBlocked",
                then: "Bài viết",
                else: "Bình luận",
              },
            },
          },
        },
      },
    },
  ]);

  // Hàm cắt chuỗi an toàn (đề phòng bạn chưa có)
  const safeSubstring = (str, start, len) => {
    if (!str) return "";
    if (str.length <= len) return str;
    return str.substring(start, len) + "...";
  };

  // Xử lý cắt chuỗi ở application level
  return posts.map((post) => ({
    ...post,
    content: safeSubstring(post.content, 0, 100),
  }));
}

async function getReportedPosts(startDate, endDate) {
  // Bài có > 5 report
  const highReportPosts = await Post.aggregate([
    {
      $match: {
        reportCount: { $gt: 5 },
        isDeletedByUser: false,
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { updatedAt: { $gte: startDate, $lte: endDate } },
        ],
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
      $lookup: {
        from: "violations",
        localField: "_id",
        foreignField: "targetId",
        as: "violations",
      },
    },
    {
      $project: {
        content: 1, // KHÔNG cắt chuỗi ở database
        reportCount: 1,
        warningCount: 1,
        likeCount: 1,
        commentCount: 1,
        createdAt: 1,
        isBlocked: 1,
        author: { $arrayElemAt: ["$author.username", 0] },
        violationCount: { $size: "$violations" },
        topReasons: {
          $slice: [
            {
              $map: {
                input: "$violations",
                as: "violation",
                in: "$$violation.reason",
              },
            },
            3,
          ],
        },
      },
    },
    {
      $sort: { reportCount: -1 },
    },
    {
      $limit: 20,
    },
  ]);

  // Bài mới bị report gần đây
  const recentReportedPosts = await Violation.aggregate([
    {
      $match: {
        targetType: "Post",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$targetId",
        reportCount: { $sum: 1 },
        lastReport: { $max: "$createdAt" },
        reporters: { $addToSet: "$reportedBy" },
      },
    },
    {
      $match: {
        reportCount: { $gte: 2 }, // Ít nhất 2 report
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "_id",
        as: "post",
      },
    },
    {
      $unwind: "$post",
    },
    {
      $match: {
        "post.isDeletedByUser": false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "post.userCreateID",
        foreignField: "_id",
        as: "author",
      },
    },
    {
      $project: {
        content: "$post.content", // KHÔNG cắt chuỗi
        reportCount: 1,
        lastReport: 1,
        uniqueReporters: { $size: "$reporters" },
        createdAt: "$post.createdAt",
        likeCount: "$post.likeCount",
        commentCount: "$post.commentCount",
        author: { $arrayElemAt: ["$author.username", 0] },
        severity: {
          $switch: {
            branches: [
              { case: { $gte: ["$reportCount", 10] }, then: "high" },
              { case: { $gte: ["$reportCount", 5] }, then: "medium" },
            ],
            default: "low",
          },
        },
      },
    },
    {
      $sort: { reportCount: -1, lastReport: -1 },
    },
    {
      $limit: 15,
    },
  ]);

  // Xử lý cắt chuỗi ở application level
  return {
    highReportPosts: highReportPosts.map((post) => ({
      ...post,
      content: safeSubstring(post.content, 0, 150),
    })),
    recentReportedPosts: recentReportedPosts.map((post) => ({
      ...post,
      content: safeSubstring(post.content, 0, 150),
    })),
  };
}

async function getTrendingContent(startDate, endDate) {
  const [trendingHashtags, popularTopics, topEngagedPosts, geographicTrends] =
    await Promise.all([
      // Hashtags hot
      Post.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeletedByUser: false,
            tags: { $exists: true, $ne: [] },
          },
        },
        {
          $unwind: "$tags",
        },
        {
          $group: {
            _id: "$tags",
            count: { $sum: 1 },
            totalLikes: { $sum: "$likeCount" },
            totalComments: { $sum: "$commentCount" },
            avgEngagement: { $avg: { $add: ["$likeCount", "$commentCount"] } },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            hashtag: "$_id",
            count: 1,
            totalLikes: 1,
            totalComments: 1,
            avgEngagement: { $round: ["$avgEngagement", 1] },
            _id: 0,
          },
        },
      ]),

      // Chủ đề được quan tâm (phân tích từ content)
      Post.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeletedByUser: false,
            content: { $exists: true, $ne: "" },
          },
        },
        {
          $project: {
            content: { $toLower: "$content" },
            likeCount: 1,
            commentCount: 1,
            engagement: { $add: ["$likeCount", "$commentCount"] },
          },
        },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            avgEngagement: { $avg: "$engagement" },
          },
        },
      ]),

      // Bài viết có engagement cao nhất
      Post.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeletedByUser: false,
          },
        },
        {
          $addFields: {
            engagement: { $add: ["$likeCount", "$commentCount"] },
          },
        },
        {
          $sort: { engagement: -1 },
        },
        {
          $limit: 10,
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
            content: 1, // KHÔNG cắt chuỗi
            likeCount: 1,
            commentCount: 1,
            engagement: 1,
            createdAt: 1,
            author: { $arrayElemAt: ["$author.username", 0] },
            tags: 1,
          },
        },
      ]),

      // Phân bố theo khu vực (nếu có data location)
      User.aggregate([
        {
          $match: {
            "profile.location": { $exists: true, $ne: "" },
            lastSeen: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$profile.location",
            userCount: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$lastSeen",
                      new Date(Date.now() - 24 * 60 * 60 * 1000),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: { userCount: -1 },
        },
        {
          $limit: 15,
        },
        {
          $project: {
            location: "$_id",
            userCount: 1,
            activeUsers: 1,
            _id: 0,
          },
        },
      ]),
    ]);

  // Xử lý cắt chuỗi cho topEngagedPosts
  const processedTopPosts = topEngagedPosts.map((post) => ({
    ...post,
    content: safeSubstring(post.content, 0, 100),
  }));

  return {
    trendingHashtags,
    popularTopics: popularTopics[0] || {},
    topEngagedPosts: processedTopPosts,
    geographicTrends,
  };
}

async function getContentQuality(startDate, endDate) {
  const [deletionStats, blockingStats, toxicComments] = await Promise.all([
    // % bài bị xoá do vi phạm
    Post.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          totalPosts: [{ $count: "count" }],
          deletedPosts: [
            {
              $match: {
                isDeletedByUser: true,
                $or: [{ isBlocked: true }, { violationCount: { $gt: 0 } }],
              },
            },
            { $count: "count" },
          ],
          violatedPosts: [
            {
              $match: {
                violationCount: { $gt: 0 },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]),

    // % bài bị ẩn
    Post.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          totalPosts: [{ $count: "count" }],
          blockedPosts: [
            {
              $match: {
                $or: [{ isBlocked: true }, { isBlockedComment: true }],
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]),

    // Bình luận có toxic score cao (mô phỏng)
    Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isBlocked: false,
        },
      },
      {
        $addFields: {
          // Mô phỏng toxic score dựa trên reportCount và warningCount
          toxicScore: {
            $add: [
              { $multiply: ["$reportCount", 20] },
              { $multiply: ["$warningCount", 30] },
              {
                $cond: {
                  if: { $gt: ["$reportCount", 2] },
                  then: 50,
                  else: 0,
                },
              },
            ],
          },
        },
      },
      {
        $match: {
          toxicScore: { $gte: 50 }, // Ngưỡng toxic
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userID",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "postID",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $project: {
          content: 1, // KHÔNG cắt chuỗi
          toxicScore: 1,
          reportCount: 1,
          warningCount: 1,
          createdAt: 1,
          author: { $arrayElemAt: ["$author.username", 0] },
          postContent: { $arrayElemAt: ["$post.content", 0] },
          riskLevel: {
            $switch: {
              branches: [
                { case: { $gte: ["$toxicScore", 80] }, then: "high" },
                { case: { $gte: ["$toxicScore", 50] }, then: "medium" },
              ],
              default: "low",
            },
          },
        },
      },
      {
        $sort: { toxicScore: -1 },
      },
      {
        $limit: 20,
      },
    ]),
  ]);

  const totalPosts = deletionStats[0]?.totalPosts[0]?.count || 0;
  const deletedPosts = deletionStats[0]?.deletedPosts[0]?.count || 0;
  const violatedPosts = deletionStats[0]?.violatedPosts[0]?.count || 0;
  const blockedPosts = blockingStats[0]?.blockedPosts[0]?.count || 0;

  // Xử lý cắt chuỗi cho toxic comments
  const processedToxicComments = toxicComments.map((comment) => ({
    ...comment,
    content: safeSubstring(comment.content, 0, 100),
    postContent: safeSubstring(comment.postContent, 0, 50),
  }));

  return {
    deletionRate:
      totalPosts > 0 ? ((deletedPosts / totalPosts) * 100).toFixed(1) : 0,
    blockingRate:
      totalPosts > 0 ? ((blockedPosts / totalPosts) * 100).toFixed(1) : 0,
    violationRate:
      totalPosts > 0 ? ((violatedPosts / totalPosts) * 100).toFixed(1) : 0,
    toxicComments: processedToxicComments,
    metrics: {
      totalPosts,
      deletedPosts,
      violatedPosts,
      blockedPosts,
    },
  };
}

async function getGeographicDistribution(startDate, endDate) {
  // Phân bố bài viết theo thời gian trong ngày
  const hourlyDistribution = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeletedByUser: false,
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        postCount: { $sum: 1 },
        avgLikes: { $avg: "$likeCount" },
        avgComments: { $avg: "$commentCount" },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        hour: "$_id",
        postCount: 1,
        avgLikes: { $round: ["$avgLikes", 1] },
        avgComments: { $round: ["$avgComments", 1] },
        _id: 0,
      },
    },
  ]);

  // Phân bố theo loại nội dung
  const contentTypeDistribution = await Post.aggregate([
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
            then: "media",
            else: "text",
          },
        },
        count: { $sum: 1 },
        avgEngagement: { $avg: { $add: ["$likeCount", "$commentCount"] } },
      },
    },
    {
      $project: {
        type: "$_id",
        count: 1,
        avgEngagement: { $round: ["$avgEngagement", 1] },
        _id: 0,
      },
    },
  ]);

  // Phân bố theo privacy setting
  const privacyDistribution = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeletedByUser: false,
      },
    },
    {
      $group: {
        _id: "$privacy",
        count: { $sum: 1 },
        avgLikes: { $avg: "$likeCount" },
      },
    },
    {
      $project: {
        privacy: "$_id",
        count: 1,
        avgLikes: { $round: ["$avgLikes", 1] },
        _id: 0,
      },
    },
  ]);

  return {
    hourlyDistribution,
    contentTypeDistribution,
    privacyDistribution,
  };
}

// Lấy chi tiết bài viết
exports.getPostDetail = async (req, res) => {
  try {
    const { postId } = req.params;
    const { period = "today" } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const [post, comments, violations, engagementStats] = await Promise.all([
      Post.findById(postId)
        .populate("userCreateID", "username email fullName")
        .populate("likes.user", "username"),

      Comment.find({
        postID: postId,
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .populate("userID", "username")
        .sort({ createdAt: -1 })
        .limit(50),

      Violation.find({
        targetId: postId,
        targetType: "Post",
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .populate("reportedBy", "username")
        .populate("reviewedBy", "username"),

      // Thống kê engagement theo thời gian
      Comment.aggregate([
        {
          $match: {
            postID: postId,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            commentCount: { $sum: 1 },
            likeCount: { $sum: "$likeCount" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
    ]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    // Xử lý cắt chuỗi an toàn
    const processedComments = comments.map((comment) => ({
      ...comment.toObject(),
      content: safeSubstring(comment.content, 0, 150),
    }));

    const postDetail = {
      post: {
        ...post.toObject(),
        content: safeSubstring(post.content, 0, 200),
      },
      comments: {
        list: processedComments,
        total: comments.length,
        stats: engagementStats,
      },
      violations: {
        list: violations,
        total: violations.length,
        byReason: violations.reduce((acc, violation) => {
          acc[violation.reason] = (acc[violation.reason] || 0) + 1;
          return acc;
        }, {}),
      },
      period: {
        start: startDate,
        end: endDate,
      },
    };

    res.json({
      success: true,
      data: postDetail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Post detail error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết bài viết",
      error: error.message,
    });
  }
};

// Phân tích từ khóa và xu hướng
exports.getContentTrends = async (req, res) => {
  try {
    const { period = "week", limit = 20 } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const [hashtagTrends, emotionTrends, contentLengthStats] =
      await Promise.all([
        // Xu hướng hashtag theo thời gian
        Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              isDeletedByUser: false,
              tags: { $exists: true, $ne: [] },
            },
          },
          {
            $unwind: "$tags",
          },
          {
            $group: {
              _id: {
                hashtag: "$tags",
                week: { $week: "$createdAt" },
              },
              count: { $sum: 1 },
              engagement: { $avg: { $add: ["$likeCount", "$commentCount"] } },
            },
          },
          {
            $sort: { "_id.week": 1, count: -1 },
          },
          {
            $group: {
              _id: "$_id.hashtag",
              weeklyTrend: {
                $push: {
                  week: "$_id.week",
                  count: "$count",
                  engagement: { $round: ["$engagement", 1] },
                },
              },
              totalCount: { $sum: "$count" },
            },
          },
          {
            $sort: { totalCount: -1 },
          },
          {
            $limit: parseInt(limit),
          },
        ]),

        // Xu hướng cảm xúc (emotions)
        Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              isDeletedByUser: false,
              emotions: { $exists: true, $ne: [] },
            },
          },
          {
            $unwind: "$emotions",
          },
          {
            $group: {
              _id: {
                emotion: "$emotions",
                date: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { "_id.date": 1 },
          },
          {
            $group: {
              _id: "$_id.emotion",
              dailyTrend: {
                $push: {
                  date: "$_id.date",
                  count: "$count",
                },
              },
              totalCount: { $sum: "$count" },
            },
          },
          {
            $sort: { totalCount: -1 },
          },
        ]),

        // Thống kê độ dài nội dung
        Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              isDeletedByUser: false,
              content: { $exists: true, $ne: "" },
            },
          },
          {
            $project: {
              contentLength: { $strLenCP: "$content" },
              likeCount: 1,
              commentCount: 1,
              engagement: { $add: ["$likeCount", "$commentCount"] },
            },
          },
          {
            $bucket: {
              groupBy: "$contentLength",
              boundaries: [0, 100, 500, 1000, 2000, 5000],
              default: "long",
              output: {
                count: { $sum: 1 },
                avgEngagement: { $avg: "$engagement" },
                maxEngagement: { $max: "$engagement" },
                minEngagement: { $min: "$engagement" },
              },
            },
          },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        hashtagTrends,
        emotionTrends,
        contentLengthStats,
        period: {
          start: startDate,
          end: endDate,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Content trends error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy xu hướng nội dung",
      error: error.message,
    });
  }
};
