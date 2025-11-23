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

const PostDeletionService = require("../../services/PostDeletionService");

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

    const active = post.isBlocked;
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
    const active = post.isBlockedComment;
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
  const startTime = Date.now();

  try {
    const { postId } = req.params;
    const { userId, role } = req.user;

    const result = await PostDeletionService.deletePostCompletely(
      postId,
      userId,
      role,
      req // Truyền req object để lấy thông tin request
    );

    // Tính latency
    const latencyMs = Date.now() - startTime;

    // Update access log với latency thực tế
    await AccessLog.findOneAndUpdate(
      {
        correlationId: { $regex: `post-delete-${postId}` },
        "response.latencyMs": 0,
      },
      {
        $set: {
          "response.latencyMs": latencyMs,
          timestamp: new Date(startTime),
        },
      }
    );

    res.json({
      success: true,
      message: "Xóa bài viết thành công",
      ...result,
    });
  } catch (error) {
    console.error("Delete post error:", error);

    // Ghi log lỗi
    await AuditLog.create({
      timestamp: new Date(),
      actorId: req.user?.userId,
      actorRole: req.user?.role,
      action: "delete_post_failed",
      target: {
        type: "Post",
        id: req.params.postId,
      },
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      ip: req.ip,
      correlationId: req.correlationId,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const softDeletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, role } = req.user;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Kiểm tra quyền
    const canDelete = await checkDeletePermission(post, userId, role);
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền ẩn bài viết này",
      });
    }

    // Đánh dấu post bị ẩn
    await Post.findByIdAndUpdate(postId, {
      isBlocked: true,
      blockedAt: new Date(),
      blockedBy: userId,
      blockedReason: req.body.reason || "Vi phạm nguyên tắc cộng đồng",
    });

    // Ghi log
    await logPostDeletion(post, userId);

    res.json({
      success: true,
      message: "Đã ẩn bài viết thành công",
    });
  } catch (error) {
    console.error("Soft delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi ẩn bài viết",
    });
  }
};

module.exports = {
  block_un_Post,
  block_un_PostComment,

  getPostById,
  getAllPosts,

  deletePost,

  softDeletePost,
};
