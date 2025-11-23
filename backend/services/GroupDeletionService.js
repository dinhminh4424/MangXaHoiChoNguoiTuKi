// services/GroupDeletionService.js
const FileManager = require("../utils/FileManager");
const Group = require("../models/Group");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const GroupMember = require("../models/GroupMember");
const Notification = require("../models/Notification");
const Violation = require("../models/Violation");
const AccessLog = require("../models/AccessLog");
const AuditLog = require("../models/AuditLog");
const ClientLog = require("../models/ClientLog");

/**
 * SERVICE XOÁ GROUP HOÀN CHỈNH - INCLUDING ALL RELATED DATA
 */
class GroupDeletionService {
  /**
   * XOÁ GROUP HOÀN TOÀN
   */
  static async deleteGroupCompletely(groupId, deletedBy, userRole, req) {
    try {
      console.log(`🚀 Bắt đầu xóa group hoàn toàn: ${groupId}`);

      // 1. Tìm và validate group
      const group = await GroupDeletionService._validateGroup(groupId);

      // 2. Kiểm tra quyền
      await GroupDeletionService._checkDeletionPermission(
        group,
        deletedBy,
        userRole
      );

      // 3. Thu thập tất cả dữ liệu cần xoá
      const deletionData = await GroupDeletionService._collectDeletionData(
        groupId
      );

      // 4. Xoá dữ liệu database
      await GroupDeletionService._deleteDatabaseData(groupId, deletionData);

      // 5. Xoá file vật lý
      await GroupDeletionService._deletePhysicalFiles(deletionData.files);

      // 6. Ghi log và thông báo
      await GroupDeletionService._logDeletionActivity(
        group,
        deletedBy,
        userRole,
        deletionData,
        req
      );

      console.log(`✅ Đã xóa group ${groupId} hoàn toàn`);

      return {
        success: true,
        groupId: groupId,
        deletionSummary: {
          groupDeleted: 1,
          postsDeleted: deletionData.posts.all.length,
          commentsDeleted: deletionData.comments.all.length,
          membersDeleted: deletionData.members.length,
          violationsDeleted: deletionData.violations.all.length,
          notificationsDeleted: deletionData.notifications.length,
          auditLogsDeleted: deletionData.auditLogs.length,
          accessLogsDeleted: deletionData.accessLogs.length,
          clientLogsDeleted: deletionData.clientLogs.length,
          filesDeleted: deletionData.files.length,
        },
      };
    } catch (error) {
      console.error(`❌ Lỗi xóa group ${groupId}:`, error);
      throw error;
    }
  }

  // ================================
  // PRIVATE METHODS - VALIDATION & PERMISSION
  // ================================

  static async _validateGroup(groupId) {
    if (!groupId) throw new Error("Group ID is required");
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    return group;
  }

  static async _checkDeletionPermission(group, deletedBy, userRole) {
    // Admin có quyền xoá mọi group
    if (userRole === "admin") {
      return true;
    }

    // Moderator có thể xoá group (có thể thêm điều kiện cụ thể)
    if (userRole === "moderator") {
      return true;
    }

    // Group owner có quyền xoá group của mình
    if (group.owner.toString() === deletedBy.toString()) {
      return true;
    }

    throw new Error("Không có quyền xóa group này");
  }

  // ================================
  // PRIVATE METHODS - DATA COLLECTION
  // ================================

  static async _collectDeletionData(groupId) {
    console.log(`📁 Đang thu thập dữ liệu cần xoá cho group ${groupId}...`);

    const [
      group,
      posts,
      members,
      violations,
      notifications,
      auditLogs,
      accessLogs,
      clientLogs,
    ] = await Promise.all([
      // Group chính
      Group.findById(groupId),

      // Tất cả posts trong group
      Post.find({ groupId: groupId }),

      // Tất cả members
      GroupMember.find({ groupId: groupId }),

      // Tất cả violations liên quan đến group
      Violation.find({
        $or: [
          { targetType: "Group", targetId: groupId },
          { targetType: "Post", targetId: { $in: [] } }, // Sẽ cập nhật sau
        ],
      }),

      // Tất cả notifications liên quan
      Notification.find({
        $or: [
          { "data.groupId": groupId },
          {
            type: {
              $in: [
                "GROUP_INVITE",
                "GROUP_POST",
                "GROUP_EVENT",
                "GROUP_MEMBER_ADDED",
                "GROUP_MEMBER_REMOVED",
              ],
            },
            "data.groupId": groupId,
          },
        ],
      }),

      // TẤT CẢ AUDIT LOGS LIÊN QUAN ĐẾN GROUP
      AuditLog.find({
        $or: [
          {
            "target.id": groupId,
            "target.type": "Group",
          },
          {
            action: {
              $in: [
                "create_group",
                "update_group",
                "delete_group",
                "join_group",
                "leave_group",
                "create_post",
                "edit_post",
                "delete_post",
              ],
            },
            "target.id": groupId,
          },
        ],
      }),

      // TẤT CẢ ACCESS LOGS LIÊN QUAN ĐẾN GROUP
      AccessLog.find({
        $or: [
          { "request.path": { $regex: groupId, $options: "i" } },
          { "request.body.groupId": groupId },
          { "request.query.groupId": groupId },
          { "response.body.groupId": groupId },
        ],
      }),

      // TẤT CẢ CLIENT LOGS LIÊN QUAN ĐẾN GROUP
      ClientLog.find({
        $or: [
          { "payload.groupId": groupId },
          {
            event: {
              $in: [
                "group_view",
                "group_join",
                "group_leave",
                "group_create",
                "group_update",
                "group_post_create",
              ],
            },
            "payload.groupId": groupId,
          },
        ],
      }),
    ]);

    // Lấy post IDs và member IDs để tìm dữ liệu liên quan
    const postIds = posts.map((post) => post._id.toString());
    const memberIds = members.map((member) => member.userId.toString());

    // Tìm comments của các posts trong group
    const comments = await Comment.find({ postID: { $in: postIds } });
    const commentIds = comments.map((comment) => comment._id.toString());

    // Tìm violations của posts và comments
    const [postViolations, commentViolations] = await Promise.all([
      Violation.find({
        targetType: "Post",
        targetId: { $in: postIds },
      }),
      Violation.find({
        targetType: "Comment",
        targetId: { $in: commentIds },
      }),
    ]);

    // Tìm logs liên quan đến posts, comments và members
    const [postRelatedLogs, commentRelatedLogs, memberRelatedLogs] =
      await Promise.all([
        // Logs liên quan đến posts
        Promise.all([
          AuditLog.find({
            "target.id": { $in: postIds },
            "target.type": "Post",
          }),
          AccessLog.find({
            $or: postIds.map((id) => ({
              "request.path": { $regex: id, $options: "i" },
            })),
          }),
          ClientLog.find({
            "payload.postId": { $in: postIds },
          }),
        ]),

        // Logs liên quan đến comments
        Promise.all([
          AuditLog.find({
            "target.id": { $in: commentIds },
            "target.type": "Comment",
          }),
          AccessLog.find({
            $or: commentIds.map((id) => ({
              "request.path": { $regex: id, $options: "i" },
            })),
          }),
          ClientLog.find({
            "payload.commentId": { $in: commentIds },
          }),
        ]),

        // Logs liên quan đến members
        Promise.all([
          AuditLog.find({
            "target.id": { $in: memberIds },
            "target.type": "User",
            action: { $in: ["join_group", "leave_group"] },
          }),
          ClientLog.find({
            "payload.userId": { $in: memberIds },
            event: { $in: ["group_join", "group_leave"] },
          }),
        ]),
      ]);

    // Thu thập tất cả files
    const files = await GroupDeletionService._collectAllFiles(
      group,
      posts,
      comments
    );

    return {
      group,
      posts: {
        all: posts,
        ids: postIds,
      },
      comments: {
        all: comments,
        ids: commentIds,
      },
      members,
      violations: {
        groupViolations: violations,
        postViolations: postViolations,
        commentViolations: commentViolations,
        all: [...violations, ...postViolations, ...commentViolations],
      },
      notifications,
      auditLogs: [
        ...auditLogs,
        ...postRelatedLogs[0],
        ...commentRelatedLogs[0],
        ...memberRelatedLogs[0],
      ],
      accessLogs: [
        ...accessLogs,
        ...postRelatedLogs[1],
        ...commentRelatedLogs[1],
      ],
      clientLogs: [
        ...clientLogs,
        ...postRelatedLogs[2],
        ...commentRelatedLogs[2],
        ...memberRelatedLogs[1],
      ],
      files,
    };
  }

  // ================================
  // PRIVATE METHODS - DATABASE DELETION
  // ================================

  static async _deleteDatabaseData(groupId, deletionData) {
    console.log(`🗃️ Đang xóa dữ liệu database cho group ${groupId}...`);

    await Promise.all([
      // Xoá group chính
      Group.findByIdAndDelete(groupId),

      // Xoá tất cả posts trong group
      Post.deleteMany({ groupId: groupId }),

      // Xoá tất cả comments của các posts trong group
      Comment.deleteMany({ postID: { $in: deletionData.posts.ids } }),

      // Xoá tất cả members
      GroupMember.deleteMany({ groupId: groupId }),

      // XOÁ TẤT CẢ BÁO CÁO (VIOLATIONS)
      Violation.deleteMany({
        $or: [
          { targetType: "Group", targetId: groupId },
          { targetType: "Post", targetId: { $in: deletionData.posts.ids } },
          {
            targetType: "Comment",
            targetId: { $in: deletionData.comments.ids },
          },
        ],
      }),

      // Xoá notifications
      Notification.deleteMany({
        $or: [
          { "data.groupId": groupId },
          { "data.postId": { $in: deletionData.posts.ids } },
          { "data.commentId": { $in: deletionData.comments.ids } },
        ],
      }),

      // XOÁ TẤT CẢ AUDIT LOGS
      AuditLog.deleteMany({
        $or: [
          {
            "target.id": groupId,
            "target.type": "Group",
          },
          {
            "target.id": { $in: deletionData.posts.ids },
            "target.type": "Post",
          },
          {
            "target.id": { $in: deletionData.comments.ids },
            "target.type": "Comment",
          },
        ],
      }),

      // XOÁ TẤT CẢ ACCESS LOGS
      AccessLog.deleteMany({
        $or: [
          { "request.path": { $regex: groupId, $options: "i" } },
          { "request.body.groupId": groupId },
          { "request.query.groupId": groupId },
          { "response.body.groupId": groupId },
          {
            $or: deletionData.posts.ids.map((id) => ({
              "request.path": { $regex: id, $options: "i" },
            })),
          },
          {
            $or: deletionData.comments.ids.map((id) => ({
              "request.path": { $regex: id, $options: "i" },
            })),
          },
          { "request.body.postId": { $in: deletionData.posts.ids } },
          { "response.body.postId": { $in: deletionData.posts.ids } },
          { "request.body.commentId": { $in: deletionData.comments.ids } },
          { "response.body.commentId": { $in: deletionData.comments.ids } },
        ],
      }),

      // XOÁ TẤT CẢ CLIENT LOGS
      ClientLog.deleteMany({
        $or: [
          { "payload.groupId": groupId },
          { "payload.postId": { $in: deletionData.posts.ids } },
          { "payload.commentId": { $in: deletionData.comments.ids } },
          {
            event: {
              $in: [
                "group_view",
                "group_join",
                "group_leave",
                "group_create",
                "group_update",
                "group_post_create",
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
              { "payload.groupId": groupId },
              { "payload.postId": { $in: deletionData.posts.ids } },
              { "payload.commentId": { $in: deletionData.comments.ids } },
            ],
          },
        ],
      }),

      // Gửi notifications cho members
      GroupDeletionService._notifyGroupMembers(
        deletionData.members,
        groupId,
        deletionData.group.name
      ),
    ]);

    console.log(`🗃️ Đã xóa dữ liệu database thành công`);
  }

  // ================================
  // PRIVATE METHODS - FILE MANAGEMENT
  // ================================

  static async _collectAllFiles(group, posts, comments) {
    const files = new Set();

    try {
      // Files từ group
      if (group.avatar) files.add(group.avatar);
      if (group.coverPhoto) files.add(group.coverPhoto);
      if (group.files) {
        group.files.forEach((file) => {
          if (file.fileUrl) files.add(file.fileUrl);
        });
      }

      // Files từ posts
      posts.forEach((post) => {
        post.files?.forEach((file) => {
          if (file.fileUrl) files.add(file.fileUrl);
        });
      });

      // Files từ comments
      comments.forEach((comment) => {
        if (comment.file?.fileUrl) files.add(comment.file.fileUrl);
      });

      console.log(`📁 Đã thu thập ${files.size} file cần xoá`);
    } catch (error) {
      console.error("Lỗi khi thu thập file:", error);
    }

    return Array.from(files);
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

  // ================================
  // PRIVATE METHODS - NOTIFICATIONS
  // ================================

  static async _notifyGroupMembers(members, groupId, groupName) {
    try {
      const notifications = members.map((member) => ({
        recipient: member.userId,
        sender: null, // System notification
        type: "GROUP_DELETED",
        title: "Group đã bị xóa",
        message: `Group "${groupName}" mà bạn tham gia đã bị xóa. Tất cả dữ liệu liên quan đã được xóa.`,
        data: {
          groupId: groupId,
          groupName: groupName,
          deletedAt: new Date(),
        },
        priority: "medium",
      }));

      await Notification.insertMany(notifications);
      console.log(`📢 Đã gửi thông báo cho ${members.length} thành viên`);
    } catch (error) {
      console.error("Lỗi khi gửi thông báo:", error);
    }
  }

  // ================================
  // PRIVATE METHODS - LOGGING
  // ================================

  static async _logDeletionActivity(
    group,
    deletedBy,
    userRole,
    deletionData,
    req
  ) {
    try {
      // FINAL AUDIT LOG
      await AuditLog.create({
        timestamp: new Date(),
        actorId: deletedBy,
        actorRole: userRole,
        action: "delete_group_completely",
        target: {
          type: "Group",
          id: group._id,
          name: group.name,
          owner: group.owner,
          memberCount: deletionData.members.length,
          postCount: deletionData.posts.all.length,
        },
        meta: {
          postsDeleted: deletionData.posts.all.length,
          commentsDeleted: deletionData.comments.all.length,
          membersDeleted: deletionData.members.length,
          violationsDeleted: deletionData.violations.all.length,
          filesDeleted: deletionData.files.length,
          totalRecordsDeleted:
            GroupDeletionService._calculateTotalRecords(deletionData),
        },
        requestSnapshot: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
        },
        ip: req.ip,
        correlationId:
          req.correlationId || `group-delete-${group._id}-${Date.now()}`,
      });

      // ACCESS LOG
      await AccessLog.create({
        timestamp: new Date(),
        level: "info",
        service: "group-deletion-service",
        correlationId:
          req.correlationId || `group-delete-${group._id}-${Date.now()}`,
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
            groupId: group._id,
            action: "complete_deletion",
          },
        },
      });

      console.log(`📝 Đã ghi log xóa group ${group._id}`);
    } catch (error) {
      console.error("Lỗi khi ghi log:", error);
    }
  }

  static _calculateTotalRecords(deletionData) {
    return (
      1 + // group chính
      deletionData.posts.all.length +
      deletionData.comments.all.length +
      deletionData.members.length +
      deletionData.violations.all.length +
      deletionData.notifications.length +
      deletionData.auditLogs.length +
      deletionData.accessLogs.length +
      deletionData.clientLogs.length
    );
  }
}

module.exports = GroupDeletionService;
