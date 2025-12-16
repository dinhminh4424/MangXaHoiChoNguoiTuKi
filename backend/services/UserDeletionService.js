// // services/UserDeletionService.js
// const FileManager = require("../utils/FileManager");
// const User = require("../models/User");
// const Post = require("../models/Post");
// const Journal = require("../models/Journal");
// const Group = require("../models/Group");
// const Comment = require("../models/Comment");
// const Message = require("../models/Message");
// const MoodLog = require("../models/MoodLog");
// const Violation = require("../models/Violation");
// const Follow = require("../models/Follow");
// const Friend = require("../models/Friend");
// const FriendRequest = require("../models/FriendRequest");
// const GroupMember = require("../models/GroupMember");
// const Notification = require("../models/Notification");
// const EmergencyContact = require("../models/EmergencyContact");
// const EmergencyRequest = require("../models/EmergencyRequest");
// const AccessLog = require("../models/AccessLog");
// const AuditLog = require("../models/AuditLog");
// const ClientLog = require("../models/ClientLog");
// const Todo = require("../models/Todo");
// const BackupLog = require("../models/BackupLog");
// const Chat = require("../models/Chat");

// /**
//  * SERVICE XOÁ USER HOÀN CHỈNH - INCLUDING ALL RELATED DATA
//  */
// class UserDeletionService {
//   /**
//    * XOÁ USER HOÀN TOÀN
//    */
//   static async deleteUserCompletely(userId, deletedBy, userRole, req) {
//     try {
//       console.log(`🚀 Bắt đầu xóa user hoàn toàn: ${userId}`);

//       // 1. Tìm và validate user
//       const user = await UserDeletionService._validateUser(userId);

//       // 2. Kiểm tra quyền
//       await UserDeletionService._checkDeletionPermission(
//         user,
//         deletedBy,
//         userRole
//       );

//       // 3. Thu thập tất cả dữ liệu cần xoá
//       const deletionData = await UserDeletionService._collectDeletionData(
//         userId
//       );

//       // 4. Xoá dữ liệu database
//       await UserDeletionService._deleteDatabaseData(userId, deletionData);

//       //5. Xoá hop thoaij char

//       // lay hop thoai co chua user
//       const chats = await Chat.find({ members: userId });

//       // xoa tin nhan trong hop thoai
//       for (const chat of chats) {
//         await Message.deleteMany({ chatId: chat._id });
//       }

//       // xoa hop thoai
//       await Chat.deleteMany({ members: userId });

//       // 5. Xoá file vật lý
//       await UserDeletionService._deletePhysicalFiles(deletionData.files);

//       // 6. Ghi log và thông báo
//       await UserDeletionService._logDeletionActivity(
//         user,
//         deletedBy,
//         userRole,
//         deletionData,
//         req
//       );

//       console.log(`✅ Đã xóa user ${userId} hoàn toàn`);

//       return {
//         success: true,
//         userId: userId,
//         deletionSummary: {
//           userDeleted: 1,
//           postsDeleted: deletionData.posts.length,
//           commentsDeleted: deletionData.comments.length,
//           journalsDeleted: deletionData.journals.length,
//           moodLogsDeleted: deletionData.moodLogs.length,
//           violationsDeleted: deletionData.violations.length,
//           notificationsDeleted: deletionData.notifications.length,
//           friendsDeleted: deletionData.friends.length,
//           followsDeleted: deletionData.follows.length,
//           groupMembershipsDeleted: deletionData.groupMemberships.length,
//           auditLogsDeleted: deletionData.auditLogs.length,
//           accessLogsDeleted: deletionData.accessLogs.length,
//           clientLogsDeleted: deletionData.clientLogs.length,
//           filesDeleted: deletionData.files.length,
//         },
//       };
//     } catch (error) {
//       console.error(`❌ Lỗi xóa user ${userId}:`, error);
//       throw error;
//     }
//   }

//   // ================================
//   // PRIVATE METHODS - VALIDATION & PERMISSION
//   // ================================

//   static async _validateUser(userId) {
//     if (!userId) throw new Error("User ID is required");
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new Error("User not found");
//     }
//     return user;
//   }

//   static async _checkDeletionPermission(user, deletedBy, userRole) {
//     // Không cho phép xoá chính mình
//     if (user._id.toString() === deletedBy.toString()) {
//       throw new Error("Không thể xóa chính mình");
//     }

//     // Admin có quyền xoá mọi user
//     if (userRole === "admin") {
//       return true;
//     }

//     // Moderator chỉ có thể xoá user thường, không thể xoá admin/moderator khác
//     if (userRole === "moderator") {
//       if (user.role === "user" || user.role === "supporter") {
//         return true;
//       }
//       throw new Error("Moderator chỉ có thể xóa user và supporter");
//     }

//     throw new Error("Không có quyền xóa user này");
//   }

//   // ================================
//   // PRIVATE METHODS - DATA COLLECTION
//   // ================================

//   static async _collectDeletionData(userId) {
//     console.log(`📁 Đang thu thập dữ liệu cần xoá cho user ${userId}...`);

//     const [
//       user,
//       posts,
//       comments,
//       journals,
//       moodLogs,
//       violations,
//       notifications,
//       friends,
//       follows,
//       friendRequests,
//       groupMemberships,
//       emergencyContacts,
//       emergencyRequests,
//       todos,
//       auditLogs,
//       accessLogs,
//       clientLogs,
//     ] = await Promise.all([
//       // User chính
//       User.findById(userId),

//       // Tất cả posts
//       Post.find({ userCreateID: userId }),

//       // Tất cả comments
//       Comment.find({ userID: userId }),

//       // Tất cả journals
//       Journal.find({ author: userId }),

//       // Tất cả mood logs
//       MoodLog.find({ userId: userId }),

//       // Tất cả violations
//       Violation.find({ userId: userId }),

//       // Tất cả notifications
//       Notification.find({
//         $or: [{ recipient: userId }, { sender: userId }],
//       }),

//       // Tất cả friends
//       Friend.find({
//         $or: [{ userA: userId }, { userB: userId }],
//       }),

//       // Tất cả follows
//       Follow.find({
//         $or: [{ follower: userId }, { following: userId }],
//       }),

//       // Tất cả friend requests
//       FriendRequest.find({
//         $or: [{ requester: userId }, { recipient: userId }],
//       }),

//       // Tất cả group memberships
//       GroupMember.find({ userId: userId }),

//       // Emergency contacts
//       EmergencyContact.find({ userId: userId }),

//       // Emergency requests
//       EmergencyRequest.find({ userId: userId }),

//       // Todos
//       Todo.find({ createdBy: userId }),

//       // TẤT CẢ AUDIT LOGS LIÊN QUAN
//       AuditLog.find({
//         $or: [
//           { actorId: userId },
//           { "target.author": userId },
//           {
//             action: {
//               $in: [
//                 "user_login",
//                 "user_register",
//                 "user_update",
//                 "user_delete",
//                 "create_post",
//                 "edit_post",
//                 "delete_post",
//                 "create_comment",
//                 "edit_comment",
//                 "delete_comment",
//               ],
//             },
//             actorId: userId,
//           },
//         ],
//       }),

//       // TẤT CẢ ACCESS LOGS LIÊN QUAN
//       AccessLog.find({
//         "request.userId": userId,
//       }),

//       // TẤT CẢ CLIENT LOGS LIÊN QUAN
//       ClientLog.find({
//         userId: userId,
//       }),
//     ]);

//     // Lấy post IDs và comment IDs để tìm logs liên quan
//     const postIds = posts.map((post) => post._id.toString());
//     const commentIds = comments.map((comment) => comment._id.toString());

//     // Tìm thêm logs liên quan đến posts và comments của user
//     const [postRelatedLogs, commentRelatedLogs] = await Promise.all([
//       // Logs liên quan đến posts
//       Promise.all([
//         AuditLog.find({
//           "target.id": { $in: postIds },
//           "target.type": "Post",
//         }),
//         AccessLog.find({
//           $or: postIds.map((id) => ({
//             "request.path": { $regex: id, $options: "i" },
//           })),
//         }),
//         ClientLog.find({
//           "payload.postId": { $in: postIds },
//         }),
//       ]),

//       // Logs liên quan đến comments
//       Promise.all([
//         AuditLog.find({
//           "target.id": { $in: commentIds },
//           "target.type": "Comment",
//         }),
//         AccessLog.find({
//           $or: commentIds.map((id) => ({
//             "request.path": { $regex: id, $options: "i" },
//           })),
//         }),
//         ClientLog.find({
//           "payload.commentId": { $in: commentIds },
//         }),
//       ]),
//     ]);

//     // Thu thập tất cả files
//     const files = await UserDeletionService._collectAllFiles(
//       user,
//       posts,
//       comments,
//       moodLogs,
//       violations
//     );

//     return {
//       user,
//       posts: {
//         all: posts,
//         ids: postIds,
//       },
//       comments: {
//         all: comments,
//         ids: commentIds,
//       },
//       journals,
//       moodLogs,
//       violations,
//       notifications,
//       friends,
//       follows,
//       friendRequests,
//       groupMemberships,
//       emergencyContacts,
//       emergencyRequests,
//       todos,
//       auditLogs: [
//         ...auditLogs,
//         ...postRelatedLogs[0],
//         ...commentRelatedLogs[0],
//       ],
//       accessLogs: [
//         ...accessLogs,
//         ...postRelatedLogs[1],
//         ...commentRelatedLogs[1],
//       ],
//       clientLogs: [
//         ...clientLogs,
//         ...postRelatedLogs[2],
//         ...commentRelatedLogs[2],
//       ],
//       files,
//     };
//   }

//   // ================================
//   // PRIVATE METHODS - DATABASE DELETION
//   // ================================

//   static async _deleteDatabaseData(userId, deletionData) {
//     console.log(`🗃️ Đang xóa dữ liệu database cho user ${userId}...`);

//     await Promise.all([
//       // Xoá user chính
//       User.findByIdAndDelete(userId),

//       // Xoá tất cả posts và comments
//       Post.deleteMany({ userCreateID: userId }),
//       Comment.deleteMany({ userID: userId }),

//       // Xoá các bản ghi khác
//       Journal.deleteMany({ author: userId }),
//       MoodLog.deleteMany({ userId: userId }),
//       Todo.deleteMany({ createdBy: userId }),
//       Violation.deleteMany({ userId: userId }),

//       // Xoá quan hệ xã hội
//       Follow.deleteMany({
//         $or: [{ follower: userId }, { following: userId }],
//       }),
//       Friend.deleteMany({
//         $or: [{ userA: userId }, { userB: userId }],
//       }),
//       FriendRequest.deleteMany({
//         $or: [{ requester: userId }, { recipient: userId }],
//       }),

//       // Xoá group memberships
//       GroupMember.deleteMany({ userId: userId }),

//       // Xoá notifications
//       Notification.deleteMany({
//         $or: [{ recipient: userId }, { sender: userId }],
//       }),

//       // Xoá emergency data
//       EmergencyContact.deleteMany({ userId: userId }),
//       EmergencyRequest.deleteMany({ userId: userId }),

//       // XOÁ TẤT CẢ LOGS
//       AuditLog.deleteMany({
//         $or: [{ actorId: userId }, { "target.author": userId }],
//       }),

//       AccessLog.deleteMany({
//         "request.userId": userId,
//       }),

//       ClientLog.deleteMany({
//         userId: userId,
//       }),

//       // Cập nhật group stats
//       UserDeletionService._updateGroupStats(deletionData.groupMemberships),

//       // Cập nhật chat members
//       UserDeletionService._updateChatMembers(userId),
//     ]);

//     console.log(`🗃️ Đã xóa dữ liệu database thành công`);
//   }

//   // ================================
//   // PRIVATE METHODS - FILE MANAGEMENT
//   // ================================

//   static async _collectAllFiles(user, posts, comments, moodLogs, violations) {
//     const files = new Set();

//     try {
//       // Files từ user profile
//       if (user.profile?.avatar) files.add(user.profile.avatar);
//       if (user.profile?.coverPhoto) files.add(user.profile.coverPhoto);
//       if (user.profile?.idCard?.frontImage)
//         files.add(user.profile.idCard.frontImage);
//       if (user.profile?.idCard?.selfieImage)
//         files.add(user.profile.idCard.selfieImage);

//       // Files từ posts
//       posts.forEach((post) => {
//         post.files?.forEach((file) => {
//           if (file.fileUrl) files.add(file.fileUrl);
//         });
//       });

//       // Files từ comments
//       comments.forEach((comment) => {
//         if (comment.file?.fileUrl) files.add(comment.file.fileUrl);
//       });

//       // Files từ mood logs
//       moodLogs.forEach((log) => {
//         if (log.imageData) files.add(log.imageData);
//       });

//       // Files từ violations
//       violations.forEach((violation) => {
//         violation.files?.forEach((file) => {
//           if (file.fileUrl) files.add(file.fileUrl);
//         });
//         violation.appeal?.files?.forEach((file) => {
//           if (file.fileUrl) files.add(file.fileUrl);
//         });
//       });

//       console.log(`📁 Đã thu thập ${files.size} file cần xoá`);
//     } catch (error) {
//       console.error("Lỗi khi thu thập file:", error);
//     }

//     return Array.from(files);
//   }

//   static async _deletePhysicalFiles(files) {
//     if (files.length === 0) {
//       console.log("📝 Không có file vật lý nào cần xoá");
//       return;
//     }

//     try {
//       const deleteResults = await FileManager.deleteMultipleFiles(files);
//       console.log(`🗑️ Đã xóa ${deleteResults.successful} file vật lý`);

//       if (deleteResults.failed > 0) {
//         console.warn(`⚠️ Không thể xóa ${deleteResults.failed} file`);
//       }
//     } catch (error) {
//       console.error("Lỗi khi xoá file vật lý:", error);
//     }
//   }

//   // ================================
//   // PRIVATE METHODS - UPDATE RELATED DATA
//   // ================================

//   static async _updateGroupStats(groupMemberships) {
//     try {
//       for (const membership of groupMemberships) {
//         await Group.findByIdAndUpdate(membership.groupId, {
//           $inc: { memberCount: -1 },
//         });
//       }
//       console.log(`🔄 Đã cập nhật group stats`);
//     } catch (error) {
//       console.error("Lỗi khi cập nhật group stats:", error);
//     }
//   }

//   static async _updateChatMembers(userId) {
//     try {
//       await Chat.updateMany(
//         { members: userId },
//         { $pull: { members: userId } }
//       );
//       console.log(`🔄 Đã cập nhật chat members`);
//     } catch (error) {
//       console.error("Lỗi khi cập nhật chat members:", error);
//     }
//   }

//   // ================================
//   // PRIVATE METHODS - LOGGING
//   // ================================

//   static async _logDeletionActivity(
//     user,
//     deletedBy,
//     userRole,
//     deletionData,
//     req
//   ) {
//     try {
//       // FINAL AUDIT LOG
//       await AuditLog.create({
//         timestamp: new Date(),
//         actorId: deletedBy,
//         actorRole: userRole,
//         action: "delete_user_completely",
//         target: {
//           type: "User",
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           role: user.role,
//         },
//         meta: {
//           postsDeleted: deletionData.posts.all.length,
//           commentsDeleted: deletionData.comments.all.length,
//           journalsDeleted: deletionData.journals.length,
//           violationsDeleted: deletionData.violations.length,
//           filesDeleted: deletionData.files.length,
//           totalRecordsDeleted:
//             UserDeletionService._calculateTotalRecords(deletionData),
//         },
//         requestSnapshot: {
//           method: req.method,
//           path: req.path,
//           params: req.params,
//           query: req.query,
//         },
//         ip: req.ip,
//         correlationId:
//           req.correlationId || `user-delete-${user._id}-${Date.now()}`,
//       });

//       // ACCESS LOG
//       await AccessLog.create({
//         timestamp: new Date(),
//         level: "info",
//         service: "user-deletion-service",
//         correlationId:
//           req.correlationId || `user-delete-${user._id}-${Date.now()}`,
//         request: {
//           method: req.method,
//           path: req.path,
//           params: req.params,
//           query: req.query,
//           userId: deletedBy,
//           ip: req.ip,
//           userAgent: req.get("User-Agent"),
//         },
//         response: {
//           status: 200,
//           latencyMs: 0,
//           body: {
//             success: true,
//             userId: user._id,
//             action: "complete_deletion",
//           },
//         },
//       });

//       console.log(`📝 Đã ghi log xóa user ${user._id}`);
//     } catch (error) {
//       console.error("Lỗi khi ghi log:", error);
//     }
//   }

//   static _calculateTotalRecords(deletionData) {
//     return (
//       1 + // user chính
//       deletionData.posts.all.length +
//       deletionData.comments.all.length +
//       deletionData.journals.length +
//       deletionData.moodLogs.length +
//       deletionData.violations.length +
//       deletionData.notifications.length +
//       deletionData.friends.length +
//       deletionData.follows.length +
//       deletionData.friendRequests.length +
//       deletionData.groupMemberships.length +
//       deletionData.emergencyContacts.length +
//       deletionData.emergencyRequests.length +
//       deletionData.todos.length +
//       deletionData.auditLogs.length +
//       deletionData.accessLogs.length +
//       deletionData.clientLogs.length
//     );
//   }
// }

// module.exports = UserDeletionService;

// services/UserDeletionService.js
const FileManager = require("../utils/fileManager");
const User = require("../models/User");
const Post = require("../models/Post");
const Journal = require("../models/Journal");
const Group = require("../models/Group");
const Comment = require("../models/Comment");
const Message = require("../models/Message");
const MoodLog = require("../models/MoodLog");
const Violation = require("../models/Violation");
const Follow = require("../models/Follow");
const Friend = require("../models/Friend");
const FriendRequest = require("../models/FriendRequest");
const GroupMember = require("../models/GroupMember");
const Notification = require("../models/Notification");
const EmergencyContact = require("../models/EmergencyContact");
const EmergencyRequest = require("../models/EmergencyRequest");
const AccessLog = require("../models/AccessLog");
const AuditLog = require("../models/AuditLog");
const ClientLog = require("../models/ClientLog");
const Todo = require("../models/Todo");
const BackupLog = require("../models/BackupLog");
const Chat = require("../models/Chat");
const UserInsight = require("../models/UserInsight");
const AiConversation = require("../models/AiConversation");

/**
 * SERVICE XOÁ USER HOÀN CHỈNH - INCLUDING ALL RELATED DATA
 */
class UserDeletionService {
  /**
   * XOÁ USER HOÀN TOÀN
   */
  static async deleteUserCompletely(userId, deletedBy, userRole, req) {
    try {
      console.log(`🚀 Bắt đầu xóa user hoàn toàn: ${userId}`);

      // 1. Tìm và validate user
      const user = await UserDeletionService._validateUser(userId);

      // 2. Kiểm tra quyền
      await UserDeletionService._checkDeletionPermission(
        user,
        deletedBy,
        userRole
      );

      // 3. Thu thập tất cả dữ liệu cần xoá
      const deletionData = await UserDeletionService._collectDeletionData(
        userId
      );

      // 4. Xoá dữ liệu database
      await UserDeletionService._deleteDatabaseData(userId, deletionData);

      // 5. Xoá file vật lý
      await UserDeletionService._deletePhysicalFiles(deletionData.files);

      // 6. Ghi log và thông báo
      await UserDeletionService._logDeletionActivity(
        user,
        deletedBy,
        userRole,
        deletionData,
        req
      );

      console.log(`✅ Đã xóa user ${userId} hoàn toàn`);

      return {
        success: true,
        userId: userId,
        deletionSummary: {
          userDeleted: 1,
          postsDeleted: deletionData.posts.all.length,
          commentsDeleted: deletionData.comments.all.length,
          journalsDeleted: deletionData.journals.length,
          moodLogsDeleted: deletionData.moodLogs.length,
          violationsDeleted: deletionData.violations.length,
          notificationsDeleted: deletionData.notifications.length,
          friendsDeleted: deletionData.friends.length,
          followsDeleted: deletionData.follows.length,
          groupMembershipsDeleted: deletionData.groupMemberships.length,
          auditLogsDeleted: deletionData.auditLogs.length,
          accessLogsDeleted: deletionData.accessLogs.length,
          clientLogsDeleted: deletionData.clientLogs.length,
          chatsDeleted: deletionData.chats.length,
          messagesDeleted: deletionData.messages.length,
          todosDeleted: deletionData.todos.length,
          userInsightsDeleted: deletionData.userInsights.length,
          aiConversationsDeleted: deletionData.aiConversations.length,
          filesDeleted: deletionData.files.length,
        },
      };
    } catch (error) {
      console.error(`❌ Lỗi xóa user ${userId}:`, error);
      throw error;
    }
  }

  // ================================
  // PRIVATE METHODS - VALIDATION & PERMISSION
  // ================================

  static async _validateUser(userId) {
    if (!userId) throw new Error("User ID is required");
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static async _checkDeletionPermission(user, deletedBy, userRole) {
    // Không cho phép xoá chính mình
    if (user._id.toString() === deletedBy.toString()) {
      throw new Error("Không thể xóa chính mình");
    }

    // Admin có quyền xoá mọi user
    if (userRole === "admin") {
      return true;
    }

    // Moderator chỉ có thể xoá user thường, không thể xoá admin/moderator khác
    if (userRole === "moderator") {
      if (user.role === "user" || user.role === "supporter") {
        return true;
      }
      throw new Error("Moderator chỉ có thể xóa user và supporter");
    }

    throw new Error("Không có quyền xóa user này");
  }

  // ================================
  // PRIVATE METHODS - DATA COLLECTION
  // ================================

  static async _collectDeletionData(userId) {
    console.log(`📁 Đang thu thập dữ liệu cần xoá cho user ${userId}...`);

    const [
      user,
      posts,
      comments,
      journals,
      moodLogs,
      violations,
      notifications,
      friends,
      follows,
      friendRequests,
      groupMemberships,
      emergencyContacts,
      emergencyRequests,
      todos,
      chats,
      messages,
      userInsights,
      aiConversations,
      backupLogs,
      auditLogs,
      accessLogs,
      clientLogs,
    ] = await Promise.all([
      // User chính
      User.findById(userId),

      // Tất cả posts
      Post.find({ userCreateID: userId }),

      // Tất cả comments
      Comment.find({ userID: userId }),

      // Tất cả journals
      Journal.find({ userId: userId }), // Note: model Journal có trường userId, không phải author

      // Tất cả mood logs
      MoodLog.find({ userId: userId }),

      // Tất cả violations
      Violation.find({
        $or: [
          { userId: userId },
          { reportedBy: userId },
          { reviewedBy: userId },
        ],
      }),

      // Tất cả notifications
      Notification.find({
        $or: [{ recipient: userId }, { sender: userId }],
      }),

      // Tất cả friends
      Friend.find({
        $or: [{ userA: userId }, { userB: userId }],
      }),

      // Tất cả follows
      Follow.find({
        $or: [{ follower: userId }, { following: userId }],
      }),

      // Tất cả friend requests
      FriendRequest.find({
        $or: [{ requester: userId }, { recipient: userId }],
      }),

      // Tất cả group memberships
      GroupMember.find({ userId: userId }),

      // Emergency contacts
      EmergencyContact.find({ userId: userId }),

      // Emergency requests
      EmergencyRequest.find({ userId: userId }),

      // Todos
      Todo.find({ createdBy: userId }),

      // Tất cả chats có chứa user
      Chat.find({
        $or: [{ members: userId }, { createdBy: userId }, { admins: userId }],
      }),

      // Tất cả messages của user
      Message.find({
        $or: [{ sender: userId }, { isReadBy: userId }, { deletedFor: userId }],
      }),

      // User insights
      UserInsight.find({ userId: userId }),

      // AI conversations
      AiConversation.find({ userId: userId }),

      // Backup logs
      BackupLog.find({ performedBy: userId }),

      // TẤT CẢ AUDIT LOGS LIÊN QUAN
      AuditLog.find({
        $or: [
          { actorId: userId },
          { "target.author": userId },
          {
            action: {
              $in: [
                "user_login",
                "user_register",
                "user_update",
                "user_delete",
                "create_post",
                "edit_post",
                "delete_post",
                "create_comment",
                "edit_comment",
                "delete_comment",
                "send_message",
                "create_chat",
                "delete_chat",
                "create_violation",
                "review_violation",
                "create_todo",
                "complete_todo",
              ],
            },
            actorId: userId,
          },
        ],
      }),

      // TẤT CẢ ACCESS LOGS LIÊN QUAN
      AccessLog.find({
        "request.userId": userId,
      }),

      // TẤT CẢ CLIENT LOGS LIÊN QUAN
      ClientLog.find({
        userId: userId,
      }),
    ]);

    // Lấy các IDs để tìm logs liên quan
    const postIds = posts.map((post) => post._id.toString());
    const commentIds = comments.map((comment) => comment._id.toString());
    const chatIds = chats.map((chat) => chat._id.toString());
    const messageIds = messages.map((message) => message._id.toString());
    const groupIds = groupMemberships.map((gm) => gm.groupId.toString());

    // Tìm thêm logs liên quan
    const [
      postRelatedLogs,
      commentRelatedLogs,
      chatRelatedLogs,
      messageRelatedLogs,
      groupRelatedLogs,
    ] = await Promise.all([
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

      // Logs liên quan đến chats
      Promise.all([
        AuditLog.find({
          "target.id": { $in: chatIds },
          "target.type": "Chat",
        }),
        AccessLog.find({
          $or: chatIds.map((id) => ({
            "request.path": { $regex: id, $options: "i" },
          })),
        }),
        ClientLog.find({
          "payload.chatId": { $in: chatIds },
        }),
      ]),

      // Logs liên quan đến messages
      Promise.all([
        AuditLog.find({
          "target.id": { $in: messageIds },
          "target.type": "Message",
        }),
        AccessLog.find({
          $or: messageIds.map((id) => ({
            "request.path": { $regex: id, $options: "i" },
          })),
        }),
        ClientLog.find({
          "payload.messageId": { $in: messageIds },
        }),
      ]),

      // Logs liên quan đến groups
      Promise.all([
        AuditLog.find({
          "target.id": { $in: groupIds },
          "target.type": "Group",
        }),
        AccessLog.find({
          $or: groupIds.map((id) => ({
            "request.path": { $regex: id, $options: "i" },
          })),
        }),
        ClientLog.find({
          "payload.groupId": { $in: groupIds },
        }),
      ]),
    ]);

    // Thu thập tất cả files
    const files = await UserDeletionService._collectAllFiles(
      user,
      posts,
      comments,
      moodLogs,
      violations,
      messages,
      chats
    );

    return {
      user,
      posts: {
        all: posts,
        ids: postIds,
      },
      comments: {
        all: comments,
        ids: commentIds,
      },
      journals,
      moodLogs,
      violations,
      notifications,
      friends,
      follows,
      friendRequests,
      groupMemberships,
      emergencyContacts,
      emergencyRequests,
      todos,
      chats,
      messages,
      userInsights,
      aiConversations,
      backupLogs,
      auditLogs: [
        ...auditLogs,
        ...postRelatedLogs[0],
        ...commentRelatedLogs[0],
        ...chatRelatedLogs[0],
        ...messageRelatedLogs[0],
        ...groupRelatedLogs[0],
      ],
      accessLogs: [
        ...accessLogs,
        ...postRelatedLogs[1],
        ...commentRelatedLogs[1],
        ...chatRelatedLogs[1],
        ...messageRelatedLogs[1],
        ...groupRelatedLogs[1],
      ],
      clientLogs: [
        ...clientLogs,
        ...postRelatedLogs[2],
        ...commentRelatedLogs[2],
        ...chatRelatedLogs[2],
        ...messageRelatedLogs[2],
        ...groupRelatedLogs[2],
      ],
      files,
    };
  }

  // ================================
  // PRIVATE METHODS - DATABASE DELETION
  // ================================

  static async _deleteDatabaseData(userId, deletionData) {
    console.log(`🗃️ Đang xóa dữ liệu database cho user ${userId}...`);

    // Lấy tất cả chat IDs để xoá messages liên quan
    const chatIds = deletionData.chats.map((chat) => chat._id);
    const groupIds = deletionData.groupMemberships.map((gm) => gm.groupId);

    await Promise.all([
      // Xoá user chính
      User.findByIdAndDelete(userId),

      // Xoá tất cả posts và comments
      Post.deleteMany({ userCreateID: userId }),
      Comment.deleteMany({ userID: userId }),

      // Xoá các bản ghi khác
      Journal.deleteMany({ userId: userId }),
      MoodLog.deleteMany({ userId: userId }),
      Todo.deleteMany({ createdBy: userId }),
      Violation.deleteMany({
        $or: [
          { userId: userId },
          { reportedBy: userId },
          { reviewedBy: userId },
        ],
      }),

      // Xoá quan hệ xã hội
      Follow.deleteMany({
        $or: [{ follower: userId }, { following: userId }],
      }),
      Friend.deleteMany({
        $or: [{ userA: userId }, { userB: userId }],
      }),
      FriendRequest.deleteMany({
        $or: [{ requester: userId }, { recipient: userId }],
      }),

      // Xoá group memberships
      GroupMember.deleteMany({ userId: userId }),

      // Xoá notifications
      Notification.deleteMany({
        $or: [{ recipient: userId }, { sender: userId }],
      }),

      // Xoá emergency data
      EmergencyContact.deleteMany({ userId: userId }),
      EmergencyRequest.deleteMany({ userId: userId }),

      // XOÁ TẤT CẢ CHATS VÀ MESSAGES
      // Xoá tất cả messages của user
      Message.deleteMany({
        $or: [{ sender: userId }, { isReadBy: userId }, { deletedFor: userId }],
      }),

      // Xoá tất cả chats có chứa user này
      Chat.deleteMany({
        $or: [{ members: userId }, { createdBy: userId }, { admins: userId }],
      }),

      // Xoá AI data
      UserInsight.deleteMany({ userId: userId }),
      AiConversation.deleteMany({ userId: userId }),

      // Xoá backup logs
      BackupLog.deleteMany({ performedBy: userId }),

      // XOÁ TẤT CẢ LOGS
      AuditLog.deleteMany({
        $or: [{ actorId: userId }, { "target.author": userId }],
      }),

      AccessLog.deleteMany({
        "request.userId": userId,
      }),

      ClientLog.deleteMany({
        userId: userId,
      }),

      // Cập nhật group stats và owner
      UserDeletionService._updateGroupData(
        userId,
        deletionData.groupMemberships,
        groupIds
      ),

      // Xử lý các groups mà user là owner
      UserDeletionService._handleGroupOwnership(userId, groupIds),
    ]);

    console.log(`🗃️ Đã xóa dữ liệu database thành công`);
  }

  // ================================
  // PRIVATE METHODS - FILE MANAGEMENT
  // ================================

  static async _collectAllFiles(
    user,
    posts,
    comments,
    moodLogs,
    violations,
    messages,
    chats
  ) {
    const files = new Set();

    try {
      // Files từ user profile
      if (user.profile?.avatar) files.add(user.profile.avatar);
      if (user.profile?.coverPhoto) files.add(user.profile.coverPhoto);
      if (user.profile?.idCard?.frontImage)
        files.add(user.profile.idCard.frontImage);
      if (user.profile?.idCard?.selfieImage)
        files.add(user.profile.idCard.selfieImage);

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

      // Files từ mood logs
      moodLogs.forEach((log) => {
        if (log.imageData) files.add(log.imageData);
      });

      // Files từ violations
      violations.forEach((violation) => {
        violation.files?.forEach((file) => {
          if (file.fileUrl) files.add(file.fileUrl);
        });
        violation.appeal?.files?.forEach((file) => {
          if (file.fileUrl) files.add(file.fileUrl);
        });
      });

      // Files từ messages
      messages.forEach((message) => {
        if (message.fileUrl) files.add(message.fileUrl);
      });

      // Files từ chats (avatar)
      chats.forEach((chat) => {
        if (chat.avatar) files.add(chat.avatar);
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
  // PRIVATE METHODS - UPDATE RELATED DATA
  // ================================

  static async _updateGroupData(userId, groupMemberships, groupIds) {
    try {
      // Cập nhật member count cho tất cả groups mà user là thành viên
      for (const groupId of groupIds) {
        await Group.findByIdAndUpdate(groupId, {
          $inc: { memberCount: -1 },
        });
      }

      // Xoá user khỏi danh sách moderators
      await Group.updateMany(
        { _id: { $in: groupIds } },
        { $pull: { moderators: userId } }
      );

      console.log(`🔄 Đã cập nhật group stats và moderators`);
    } catch (error) {
      console.error("Lỗi khi cập nhật group data:", error);
    }
  }

  static async _handleGroupOwnership(userId, groupIds) {
    try {
      // Tìm tất cả groups mà user là owner
      const ownedGroups = await Group.find({ owner: userId });

      if (ownedGroups.length > 0) {
        console.log(`⚠️ User là owner của ${ownedGroups.length} groups`);

        for (const group of ownedGroups) {
          // Tìm moderator đầu tiên để chuyển quyền owner
          const newOwner =
            group.moderators.length > 0 ? group.moderators[0] : null;

          if (newOwner) {
            // Chuyển quyền owner cho moderator
            await Group.findByIdAndUpdate(group._id, {
              owner: newOwner,
              $pull: { moderators: newOwner },
            });
            console.log(
              `🔄 Đã chuyển quyền owner group ${group._id} sang user ${newOwner}`
            );
          } else {
            // Nếu không có moderator, xoá group
            await Group.findByIdAndDelete(group._id);
            console.log(
              `🗑️ Đã xóa group ${group._id} (không có người kế thừa)`
            );

            // Xoá tất cả group memberships của group này
            await GroupMember.deleteMany({ groupId: group._id });

            // Xoá tất cả posts trong group này
            await Post.deleteMany({ groupId: group._id });
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi xử lý group ownership:", error);
    }
  }

  // ================================
  // PRIVATE METHODS - LOGGING
  // ================================

  static async _logDeletionActivity(
    user,
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
        action: "delete_user_completely",
        target: {
          type: "User",
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        meta: {
          postsDeleted: deletionData.posts.all.length,
          commentsDeleted: deletionData.comments.all.length,
          journalsDeleted: deletionData.journals.length,
          moodLogsDeleted: deletionData.moodLogs.length,
          violationsDeleted: deletionData.violations.length,
          chatsDeleted: deletionData.chats.length,
          messagesDeleted: deletionData.messages.length,
          todosDeleted: deletionData.todos.length,
          groupsOwned: await UserDeletionService._countOwnedGroups(user._id),
          filesDeleted: deletionData.files.length,
          totalRecordsDeleted:
            UserDeletionService._calculateTotalRecords(deletionData),
        },
        requestSnapshot: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
        },
        ip: req.ip,
        correlationId:
          req.correlationId || `user-delete-${user._id}-${Date.now()}`,
      });

      // ACCESS LOG
      await AccessLog.create({
        timestamp: new Date(),
        level: "info",
        service: "user-deletion-service",
        correlationId:
          req.correlationId || `user-delete-${user._id}-${Date.now()}`,
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
            userId: user._id,
            action: "complete_deletion",
          },
        },
      });

      console.log(`📝 Đã ghi log xóa user ${user._id}`);
    } catch (error) {
      console.error("Lỗi khi ghi log:", error);
    }
  }

  static async _countOwnedGroups(userId) {
    const count = await Group.countDocuments({ owner: userId });
    return count;
  }

  static _calculateTotalRecords(deletionData) {
    return (
      1 + // user chính
      deletionData.posts.all.length +
      deletionData.comments.all.length +
      deletionData.journals.length +
      deletionData.moodLogs.length +
      deletionData.violations.length +
      deletionData.notifications.length +
      deletionData.friends.length +
      deletionData.follows.length +
      deletionData.friendRequests.length +
      deletionData.groupMemberships.length +
      deletionData.emergencyContacts.length +
      deletionData.emergencyRequests.length +
      deletionData.todos.length +
      deletionData.chats.length +
      deletionData.messages.length +
      deletionData.userInsights.length +
      deletionData.aiConversations.length +
      deletionData.backupLogs.length +
      deletionData.auditLogs.length +
      deletionData.accessLogs.length +
      deletionData.clientLogs.length
    );
  }
}

module.exports = UserDeletionService;
