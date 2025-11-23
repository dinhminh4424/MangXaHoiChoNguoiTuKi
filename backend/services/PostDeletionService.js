// services/PostDeletionService.js
const FileManager = require("../utils/FileManager");
const User = require("../models/User");
const Post = require("../models/Post");
const Journal = require("../models/Journal");
const Group = require("../models/Group");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Violation = require("../models/Violation");
const AccessLog = require("../models/AccessLog");
const AuditLog = require("../models/AuditLog");
const ClientLog = require("../models/ClientLog");

class PostDeletionService {
  static async deletePostCompletely(postId, deletedBy, userRole, req) {
    try {
      console.log(`🚀 Bắt đầu xóa post hoàn toàn: ${postId}`);

      // 1. Tìm và validate post
      const post = await PostDeletionService._validatePost(postId);

      // 2. Kiểm tra quyền
      await PostDeletionService._checkDeletionPermission(
        post,
        deletedBy,
        userRole
      );

      // 3. Thu thập tất cả dữ liệu cần xoá
      const deletionData = await PostDeletionService._collectDeletionData(
        postId
      );

      // 4. Xoá dữ liệu database
      await PostDeletionService._deleteDatabaseData(postId, deletionData);

      // 5. Xoá file vật lý
      await PostDeletionService._deletePhysicalFiles(deletionData.files);

      // 6. Ghi log và thông báo
      await PostDeletionService._logDeletionActivity(
        post,
        deletedBy,
        userRole,
        deletionData,
        req
      );

      console.log(`✅ Đã xóa post ${postId} hoàn toàn`);

      return {
        success: true,
        postId: postId,
        deletionSummary: {
          postDeleted: 1,
          commentsDeleted: deletionData.comments.length,
          violationsDeleted: deletionData.violations.all.length,
          filesDeleted: deletionData.files.length,
          notificationsDeleted: deletionData.notifications.length,
          auditLogsDeleted: deletionData.auditLogs.length,
          accessLogsDeleted: deletionData.accessLogs.length,
          clientLogsDeleted: deletionData.clientLogs.length,
        },
      };
    } catch (error) {
      console.error(`❌ Lỗi xóa post ${postId}:`, error);
      throw error;
    }
  }

  // ================================
  // PRIVATE METHODS - DATA COLLECTION (FIXED)
  // ================================

  static async _validatePost(postId) {
    if (!postId) throw new Error("Post ID is required");
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    return post;
  }

  static async _checkDeletionPermission(post, deletedBy, userRole) {
    // Admin và moderator có quyền xoá mọi post
    if (userRole === "admin" || userRole === "moderator") {
      return true;
    }

    // User chỉ có thể xoá post của chính mình
    if (post.userCreateID.toString() === deletedBy.toString()) {
      return true;
    }

    // Group owner/moderator có thể xoá post trong group của họ
    if (post.groupId) {
      const canDeleteFromGroup =
        await PostDeletionService._checkGroupPermission(
          post.groupId,
          deletedBy
        );
      if (canDeleteFromGroup) return true;
    }

    throw new Error("Không có quyền xóa bài viết này");
  }

  static async _checkGroupPermission(groupId, userId) {
    // Implement logic kiểm tra quyền trong group
    const group = await Group.findById(groupId);
    if (!group) return false;

    // Group owner có quyền xoá
    if (group.owner.toString() === userId.toString()) {
      return true;
    }

    // Kiểm tra nếu là moderator
    if (group.moderators && group.moderators.includes(userId)) {
      return true;
    }

    return false;
  }

  static async _collectDeletionData(postId) {
    console.log(`📁 Đang thu thập dữ liệu cần xoá cho post ${postId}...`);

    const [
      post,
      comments,
      violations,
      notifications,
      auditLogs,
      accessLogs,
      clientLogs,
    ] = await Promise.all([
      // Post chính
      Post.findById(postId),

      // Tất cả comments
      Comment.find({ postID: postId }),

      // Tất cả violations liên quan
      Violation.find({
        $or: [
          { targetType: "Post", targetId: postId },
          { targetType: "Comment", targetId: { $in: [] } },
        ],
      }),

      // Tất cả notifications liên quan
      Notification.find({
        $or: [
          { "data.postId": postId },
          {
            type: {
              $in: [
                "POST_LIKED",
                "POST_COMMENTED",
                "COMMENT_LIKED",
                "COMMENT_REPLIED",
              ],
            },
            "data.postId": postId,
          },
        ],
      }),

      // TẤT CẢ AUDIT LOGS LIÊN QUAN ĐẾN POST
      AuditLog.find({
        $or: [
          {
            "target.id": postId,
            "target.type": "Post",
          },
          {
            action: {
              $in: [
                "create_post",
                "edit_post",
                "delete_post",
                "like_post",
                "view_post",
              ],
            },
            "target.id": postId,
          },
        ],
      }),

      // TẤT CẢ ACCESS LOGS LIÊN QUAN ĐẾN POST (FIXED REGEX)
      AccessLog.find({
        $or: [
          { "request.path": { $regex: postId, $options: "i" } },
          { "request.body.postId": postId },
          { "request.query.postId": postId },
          { "response.body.postId": postId },
        ],
      }),

      // TẤT CẢ CLIENT LOGS LIÊN QUAN ĐẾN POST
      ClientLog.find({
        $or: [
          { "payload.postId": postId },
          {
            event: {
              $in: [
                "post_view",
                "post_like",
                "post_comment",
                "post_share",
                "post_create",
              ],
            },
            "payload.postId": postId,
          },
        ],
      }),
    ]);

    // Lấy comment IDs để tìm violations và logs liên quan
    const commentIds = comments.map((comment) => comment._id.toString());

    // Tìm violations của comments
    const commentViolations = await Violation.find({
      targetType: "Comment",
      targetId: { $in: commentIds },
    });

    // Tìm logs liên quan đến comments (FIXED QUERIES)
    const [commentAuditLogs, commentAccessLogs, commentClientLogs] =
      await Promise.all([
        AuditLog.find({
          $or: [
            {
              "target.id": { $in: commentIds },
              "target.type": "Comment",
            },
            {
              action: {
                $in: [
                  "create_comment",
                  "edit_comment",
                  "delete_comment",
                  "like_comment",
                ],
              },
              "target.id": { $in: commentIds },
            },
          ],
        }),
        // FIXED: Sử dụng $in thay vì $regex cho array
        AccessLog.find({
          $or: commentIds.map((id) => ({
            "request.path": { $regex: id, $options: "i" },
          })),
        }),
        ClientLog.find({
          $or: [
            { "payload.commentId": { $in: commentIds } },
            {
              event: {
                $in: [
                  "comment_create",
                  "comment_like",
                  "comment_edit",
                  "comment_delete",
                ],
              },
              "payload.commentId": { $in: commentIds },
            },
          ],
        }),
      ]);

    // Thu thập tất cả files
    const files = await PostDeletionService._collectAllFiles(post, comments);

    return {
      post,
      comments: {
        all: comments,
        ids: commentIds,
      },
      violations: {
        postViolations: violations,
        commentViolations: commentViolations,
        all: [...violations, ...commentViolations],
      },
      notifications,
      auditLogs: [...auditLogs, ...commentAuditLogs],
      accessLogs: [...accessLogs, ...commentAccessLogs],
      clientLogs: [...clientLogs, ...commentClientLogs],
      files,
    };
  }

  // ================================
  // PRIVATE METHODS - DATABASE DELETION (FIXED)
  // ================================

  static async _deleteDatabaseData(postId, deletionData) {
    console.log(`🗃️ Đang xóa dữ liệu database cho post ${postId}...`);

    await Promise.all([
      // Xoá post chính
      Post.findByIdAndDelete(postId),

      // Xoá tất cả comments
      Comment.deleteMany({ postID: postId }),

      // XOÁ TẤT CẢ BÁO CÁO (VIOLATIONS)
      Violation.deleteMany({
        $or: [
          { targetType: "Post", targetId: postId },
          {
            targetType: "Comment",
            targetId: { $in: deletionData.comments.ids },
          },
        ],
      }),

      // Xoá notifications
      Notification.deleteMany({
        $or: [
          { "data.postId": postId },
          { "data.commentId": { $in: deletionData.comments.ids } },
        ],
      }),

      // XOÁ TẤT CẢ AUDIT LOGS
      AuditLog.deleteMany({
        $or: [
          {
            "target.id": postId,
            "target.type": "Post",
          },
          {
            "target.id": { $in: deletionData.comments.ids },
            "target.type": "Comment",
          },
        ],
      }),

      // XOÁ TẤT CẢ ACCESS LOGS (FIXED)
      AccessLog.deleteMany({
        $or: [
          { "request.path": { $regex: postId, $options: "i" } },
          { "request.body.postId": postId },
          { "request.query.postId": postId },
          { "response.body.postId": postId },
          {
            $or: deletionData.comments.ids.map((id) => ({
              "request.path": { $regex: id, $options: "i" },
            })),
          },
          { "request.body.commentId": { $in: deletionData.comments.ids } },
          { "response.body.commentId": { $in: deletionData.comments.ids } },
        ],
      }),

      // XOÁ TẤT CẢ CLIENT LOGS
      ClientLog.deleteMany({
        $or: [
          { "payload.postId": postId },
          { "payload.commentId": { $in: deletionData.comments.ids } },
          {
            event: {
              $in: [
                "post_view",
                "post_like",
                "post_comment",
                "post_share",
                "post_create",
                "comment_create",
                "comment_like",
                "comment_edit",
                "comment_delete",
              ],
            },
            $or: [
              { "payload.postId": postId },
              { "payload.commentId": { $in: deletionData.comments.ids } },
            ],
          },
        ],
      }),

      // Cập nhật user stats
      PostDeletionService._updateUserStats(deletionData.post),

      // Cập nhật group stats (nếu có)
      PostDeletionService._updateGroupStats(deletionData.post),
    ]);

    console.log(`🗃️ Đã xóa dữ liệu database thành công`);
  }

  // ================================
  // PRIVATE METHODS - LOGGING (FIXED)
  // ================================

  static async _logDeletionActivity(
    post,
    deletedBy,
    userRole,
    deletionData,
    req
  ) {
    try {
      // FINAL AUDIT LOG - Ghi lại hành động xoá
      await AuditLog.create({
        timestamp: new Date(),
        actorId: deletedBy,
        actorRole: userRole,
        action: "delete_post_completely",
        target: {
          type: "Post",
          id: post._id,
          author: post.userCreateID,
          contentPreview: post.content?.substring(0, 100),
          hasFiles: post.files?.length > 0,
        },
        meta: {
          commentsDeleted: deletionData.comments.all.length,
          violationsDeleted: deletionData.violations.all.length,
          filesDeleted: deletionData.files.length,
          notificationsDeleted: deletionData.notifications.length,
          auditLogsDeleted: deletionData.auditLogs.length,
          accessLogsDeleted: deletionData.accessLogs.length,
          clientLogsDeleted: deletionData.clientLogs.length,
          totalRecordsDeleted:
            PostDeletionService._calculateTotalRecords(deletionData),
        },
        requestSnapshot: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
        },
        ip: req.ip,
        correlationId:
          req.correlationId || `post-delete-${post._id}-${Date.now()}`,
      });

      // ACCESS LOG - Ghi lại API call
      await AccessLog.create({
        timestamp: new Date(),
        level: "info",
        service: "post-deletion-service",
        correlationId:
          req.correlationId || `post-delete-${post._id}-${Date.now()}`,
        request: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          userId: deletedBy,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        },
        response: {
          status: 200,
          latencyMs: 0,
          body: {
            success: true,
            postId: post._id,
            action: "complete_deletion",
          },
        },
      });

      // CLIENT LOG - Ghi lại phía client (nếu cần)
      await ClientLog.create({
        timestamp: new Date(),
        event: "post_deleted_completely",
        payload: {
          postId: post._id,
          deletedBy: deletedBy,
          userRole: userRole,
          deletionSummary: {
            comments: deletionData.comments.all.length,
            violations: deletionData.violations.all.length,
            files: deletionData.files.length,
            logs:
              deletionData.auditLogs.length +
              deletionData.accessLogs.length +
              deletionData.clientLogs.length,
          },
        },
        userId: deletedBy,
        correlationId:
          req.correlationId || `post-delete-${post._id}-${Date.now()}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Notification cho tác giả post (nếu không phải chính họ xoá)
      if (post.userCreateID.toString() !== deletedBy.toString()) {
        await Notification.create({
          recipient: post.userCreateID,
          sender: deletedBy,
          type: "POST_BLOCKED",
          title: "Bài viết đã bị xóa hoàn toàn",
          message: `Bài viết của bạn đã bị xóa hoàn toàn bởi ${userRole}. Tất cả dữ liệu liên quan đã được xóa.`,
          data: {
            postId: post._id,
            deletedBy: deletedBy,
            deletedAt: new Date(),
            deletionType: "complete",
            recordsDeleted:
              PostDeletionService._calculateTotalRecords(deletionData),
          },
          priority: "high",
          url: "",
        });
      }

      console.log(`📝 Đã ghi log xóa post ${post._id}`);
    } catch (error) {
      console.error("Lỗi khi ghi log:", error);
    }
  }

  static _calculateTotalRecords(deletionData) {
    return (
      1 +
      deletionData.comments.all.length +
      deletionData.violations.all.length +
      deletionData.notifications.length +
      deletionData.auditLogs.length +
      deletionData.accessLogs.length +
      deletionData.clientLogs.length
    );
  }

  static async _collectAllFiles(post, comments) {
    const files = new Set();

    try {
      // Files từ post
      if (post.files) {
        post.files.forEach((file) => {
          if (file.fileUrl) files.add(file.fileUrl);
        });
      }

      // Files từ comments
      comments.forEach((comment) => {
        if (comment.file?.fileUrl) {
          files.add(comment.file.fileUrl);
        }
      });

      console.log(`📁 Đã thu thập ${files.size} file cần xoá`);
    } catch (error) {
      console.error("Lỗi khi thu thập file:", error);
    }

    return Array.from(files);
  }

  static async _updateUserStats(post) {
    try {
      await User.findByIdAndUpdate(post.userCreateID, {
        $inc: { postCount: -1 },
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật user stats:", error);
    }
  }

  static async _updateGroupStats(post) {
    try {
      if (post.groupId) {
        await Group.findByIdAndUpdate(post.groupId, {
          $inc: { postCount: -1 },
        });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật group stats:", error);
    }
  }

  static async _deletePhysicalFiles(files) {
    if (files.length === 0) {
      console.log("📝 Không có file vật lý nào cần xoá");
      return;
    }

    try {
      const deleteResults = await FileManager.deleteMultipleFiles(files);
      console.log(`🗑️ Đã xóa ${deleteResults.successful} file vật lý`);

      if (deleteResults.failed > 0) {
        console.warn(`⚠️ Không thể xóa ${deleteResults.failed} file`);
      }
    } catch (error) {
      console.error("Lỗi khi xoá file vật lý:", error);
    }
  }
}

module.exports = PostDeletionService;
