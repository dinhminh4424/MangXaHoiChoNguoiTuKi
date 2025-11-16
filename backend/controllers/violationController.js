// controllers/violationController.js
const Violation = require("../models/Violation");
const User = require("../models/User");
const Post = require("../models/Post");
const Group = require("../models/Group");
const Comment = require("../models/Comment");
const NotificationService = require("../services/notificationService");
const { logUserActivity } = require("../logging/userActivityLogger");

// Lấy danh sách vi phạm với phân trang và lọc
exports.getUserViolations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      targetType,
      actionTaken,
      appealStatus,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Tính toán phân trang
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // CHỈ LẤY VI PHẠM ĐÃ ĐƯỢC PHÊ DUYỆT HOẶC TỰ ĐỘNG
    const filter = {
      userId: userId,
      status: { $in: ["approved", "auto", "reviewed"] }, // CHỈ LẤY 3 TRẠNG THÁI NÀY
    };

    if (targetType && targetType !== "all") {
      filter.targetType = targetType;
    }

    if (actionTaken && actionTaken !== "all") {
      filter.actionTaken = actionTaken;
    }

    if (appealStatus && appealStatus !== "all") {
      filter["appeal.appealStatus"] = appealStatus;
    }

    if (search) {
      filter.reason = { $regex: search, $options: "i" };
    }

    // Tạo object sort
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Lấy tổng số
    const total = await Violation.countDocuments(filter);

    // Lấy danh sách vi phạm
    const violations = await Violation.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("reportedBy", "username fullName avatar")
      .populate("reviewedBy", "username fullName avatar")
      .populate("appeal.appealReviewedBy", "username fullName avatar")
      .lean(); // dùng lean để dễ thêm targetData

    // Populate targetId động
    for (let violation of violations) {
      if (!violation.targetId) continue;

      try {
        let model;
        switch (violation.targetType) {
          case "Post":
            model = Post;
            break;
          case "Comment":
            model = Comment;
            break;
          case "User":
            model = User;
            break;
          case "Group":
            model = Group;
            break;
          case "Message":
            model = Message;
            break;
          default:
            continue;
        }

        if (model) {
          const targetDoc = await model
            .findById(violation.targetId)
            .select("content title text username fullName avatar createdAt")
            .lean();

          if (targetDoc) {
            violation.targetData = targetDoc;

            // Thêm link cho từng loại target
            switch (violation.targetType) {
              case "Post":
                violation.targetLink = `/posts/${violation.targetId}`;
                break;
              case "Comment":
                violation.targetLink = `/comments/${violation.targetId}`;
                break;
              case "User":
                violation.targetLink = `/profile/${violation.targetId}`;
                break;
              case "Group":
                violation.targetLink = `/groups/${violation.targetId}`;
                break;
              default:
                violation.targetLink = null;
            }
          }
        }
      } catch (err) {
        console.error("Error populating target:", err);
      }
    }

    res.json({
      success: true,
      data: {
        docs: violations,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get user violations error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách vi phạm",
    });
  }
};

// Lấy chi tiết vi phạm
exports.getViolationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const violation = await Violation.findOne({ _id: id, userId })
      .populate("reportedBy", "username fullName avatar")
      .populate("reviewedBy", "username fullName avatar")
      .populate("appeal.appealReviewedBy", "username fullName avatar");

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vi phạm",
      });
    }

    // Populate target data
    let targetData = null;
    try {
      let model;
      switch (violation.targetType) {
        case "Post":
          model = Post;
          break;
        case "Comment":
          model = Comment;
          break;
        case "User":
          model = User;
        case "Group":
          model = Group;
          break;
        default:
          break;
      }

      if (model) {
        targetData = await model
          .findById(violation.targetId)
          .select("content title text username fullName avatar createdAt")
          .lean();
      }
    } catch (error) {
      console.error("Error populating target:", error);
    }

    res.json({
      success: true,
      data: {
        violation,
        targetData,
      },
    });
  } catch (error) {
    console.error("Get violation details error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết vi phạm",
    });
  }
};

// Tạo kháng cáo
exports.createAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { appealReason } = req.body;
    const userId = req.user.userId;

    if (!appealReason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập lý do kháng cáo",
      });
    }

    const violation = await Violation.findOne({ _id: id, userId });

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vi phạm",
      });
    }

    if (violation.appeal.isAppealed) {
      return res.status(400).json({
        success: false,
        message: "Vi phạm này đã được kháng cáo",
      });
    }

    // Xử lý file đính kèm nếu có
    const appealFiles = req.files
      ? req.files.map((file) => ({
          type: file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype.startsWith("video/")
            ? "video"
            : file.mimetype.startsWith("audio/")
            ? "audio"
            : "file",
          fileUrl: `/uploads/${file.filename}`,
          fileName: file.originalname,
          fileSize: file.size,
        }))
      : [];

    // Cập nhật thông tin kháng cáo
    violation.appeal = {
      isAppealed: true,
      appealReason,
      appealAt: new Date(),
      appealStatus: "pending",
      files: appealFiles,
    };

    await violation.save();

    await NotificationService.emitNotificationToAdmins({
      recipient: null, // Gửi cho tất cả admin
      sender: userId,
      type: "APPEAL_CREATE",
      title: "Kháng Nghị mới cần xử lý",
      message: `Kháng nghị  đã được gửi với lý do: ${appealReason}`,
      data: {
        violationId: violation._id,
        targetId: violation.targetId,
        reporterId: violation.reportedBy,
        userId: violation.userId,
        appealReason: violation.appealReason,
      },
      priority: "high",
      url: `/admin/appeals/${violation._id}`,
    });

    res.json({
      success: true,
      message: "Gửi kháng cáo thành công",
      data: violation,
    });
  } catch (error) {
    console.error("Create appeal error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi gửi kháng cáo",
    });
  }
};

// Hủy kháng cáo
exports.cancelAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const violation = await Violation.findOne({ _id: id, userId });

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vi phạm",
      });
    }

    if (!violation.appeal.isAppealed) {
      return res.status(400).json({
        success: false,
        message: "Vi phạm này chưa được kháng cáo",
      });
    }

    if (violation.appeal.appealStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy kháng cáo đã được xử lý",
      });
    }

    violation.appeal.appealStatus = "cancelled";
    await violation.save();

    res.json({
      success: true,
      message: "Hủy kháng cáo thành công",
      data: violation,
    });
  } catch (error) {
    console.error("Cancel appeal error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy kháng cáo",
    });
  }
};

// Lấy thống kê vi phạm
// controllers/violationController.js - Sửa phần getStats
exports.getViolationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Violation.aggregate([
      {
        $match: {
          userId: userId,
          status: { $in: ["approved", "auto"] }, // CHỈ TÍNH APPROVED VÀ AUTO
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          auto: {
            $sum: { $cond: [{ $eq: ["$status", "auto"] }, 1, 0] },
          },
        },
      },
    ]);

    const appealStats = await Violation.aggregate([
      {
        $match: {
          userId: userId,
          "appeal.isAppealed": true,
          status: { $in: ["approved", "auto"] }, // CHỈ TÍNH APPROVED VÀ AUTO
        },
      },
      {
        $group: {
          _id: "$appeal.appealStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        approved: stats[0]?.approved || 0,
        auto: stats[0]?.auto || 0,
        appeals: appealStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Get violation stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê vi phạm",
    });
  }
};
