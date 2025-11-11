// // controllers/commentController.js
// const Comment = require("../models/Comment");
// const GrpMember = require("../models/GroupMember");
// const Post = require("../models/Post");
// const User = require("../models/User");
// const Violation = require("../models/Violation");
// const FileManager = require("../utils/fileManager");
// const NotificationService = require("../services/notificationService");
// const mailService = require("../services/mailService");
// const { logUserActivity } = require("../logging/userActivityLogger");

// class CommentController {
//   // Tạo bình luận mới

//   async createComment(req, res) {
//     try {
//       const { postID, content } = req.body;
//       const userID = req.user.userId;

//       // KIỂM TRA postID có hợp lệ không
//       if (!postID) {
//         return res.status(400).json({
//           success: false,
//           message: "ID bài viết không hợp lệ",
//         });
//       }

//       const parentCommentID = req.body.parentCommentID || null;

//       // Kiểm tra post tồn tại
//       const post = await Post.findById(postID);
//       if (!post) {
//         return res.status(404).json({
//           success: false,
//           message: "Bài viết không tồn tại",
//         });
//       }

//       // Kiểm tra quyền trong nhóm - SỬA LỖI GroupMember
//       if (post.groupId) {
//         const groupMember = await GrpMember.findOne({
//           userId: userID,
//           groupId: post.groupId,
//           status: "active",
//         });

//         if (!groupMember) {
//           return res.status(403).json({
//             success: false,
//             message: "Bạn không có quyền bình luận trong nhóm này",
//           });
//         }
//       }

//       // Xử lý file nếu có
//       let file = null;
//       if (req.file) {
//         let fileFolder = "documents";
//         if (req.file.mimetype.startsWith("image/")) {
//           fileFolder = "images";
//         } else if (req.file.mimetype.startsWith("video/")) {
//           fileFolder = "videos";
//         } else if (req.file.mimetype.startsWith("audio/")) {
//           fileFolder = "audio";
//         }

//         const fileUrl = `/api/uploads/${fileFolder}/${req.file.filename}`;

//         let messageType = "file";
//         if (req.file.mimetype.startsWith("image/")) {
//           messageType = "image";
//         } else if (req.file.mimetype.startsWith("video/")) {
//           messageType = "video";
//         } else if (req.file.mimetype.startsWith("audio/")) {
//           messageType = "audio";
//         }

//         file = {
//           type: messageType,
//           fileUrl: fileUrl,
//           fileName: req.file.originalname,
//           fileSize: req.file.size,
//         };
//       }

//       // Tạo comment
//       const comment = new Comment({
//         postID,
//         userID,
//         content,
//         parentCommentID: parentCommentID || null,
//         file: file || null,
//       });

//       await comment.save();

//       // Cập nhật counter
//       if (!parentCommentID) {
//         // Comment gốc - tăng commentCount trong Post
//         await Post.findByIdAndUpdate(postID, { $inc: { commentCount: 1 } });
//       } else {
//         // Reply comment - tăng replyCount trong comment cha
//         await Comment.findByIdAndUpdate(parentCommentID, {
//           $inc: { replyCount: 1 },
//         });
//       }

//       // Populate user info và thêm thông tin like
//       await comment.populate("userID", "_id username profile.avatar fullName");

//       const commentResponse = comment.toObject();
//       // Thêm thông tin like cho user hiện tại
//       const userLike = comment.likes.find(
//         (like) => like.user && like.user.toString() === userID
//       );
//       commentResponse.isLiked = !!userLike;
//       commentResponse.userEmotion = userLike ? userLike.emotion : null;

//       res.status(200);
//       logUserActivity({
//         action: "comment.create",
//         req,
//         res,
//         userId: req.user?.userId,
//         role: req.user?.role,
//         target: { type: "comment", owner: req.user?.userId },
//         description: "Người dùng bình luận",
//         payload: {
//           _id: comment._id.toString(),
//           userID: comment.userID ? comment.userID.toString() : null,
//           content: comment.content,
//           parentCommentID: comment.parentCommentID
//             ? comment.parentCommentID.toString()
//             : null,
//           file: comment.file || null,
//         },
//       });

//       res.json({
//         success: true,
//         message: "Bình luận thành công",
//         comment: commentResponse,
//       });
//     } catch (error) {
//       console.log("error: ", error);
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Lấy bình luận theo bài viết
//   async getPostComments(req, res) {
//     try {
//       const { postId } = req.params;
//       const {
//         page = 1,
//         limit = 20,
//         parentCommentID = null,
//         sortBy = "createdAt",
//         sortOrder = "desc",
//       } = req.query;

//       // KIỂM TRA postId có hợp lệ không
//       if (!postId) {
//         return res.status(400).json({
//           success: false,
//           message: "ID bài viết không hợp lệ",
//         });
//       }

//       const skip = (page - 1) * limit;
//       const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
//       const userId = req.user?.userId;

//       const query = {
//         postID: postId,
//         parentCommentID: parentCommentID,
//         isBlocked: false,
//       };

//       const comments = await Comment.find(query)
//         .populate("userID", "username profile.avatar fullName")
//         .sort(sort)
//         .limit(parseInt(limit))
//         .skip(skip)
//         .lean();

//       // THÊM THÔNG TIN LIKE CHO USER HIỆN TẠI
//       const commentsWithLikeInfo = comments.map((comment) => {
//         const userLike = comment.likes.find(
//           (like) => like.user && like.user.toString() === userId.toString()
//         );

//         return {
//           ...comment,
//           isLiked: !!userLike,
//           userEmotion: userLike ? userLike.emotion : null,
//         };
//       });

//       const total = await Comment.countDocuments(query);

//       res.status(200).json({
//         success: true,
//         comments: commentsWithLikeInfo,
//         total,
//         page: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page < Math.ceil(total / limit),
//       });
//     } catch (error) {
//       console.log("Lỗi: ", error);
//       res.status(404).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Lấy replies của bình luận

//   async getCommentReplies(req, res) {
//     try {
//       const { commentId } = req.params;
//       const {
//         page = 1,
//         limit = 20,
//         sortBy = "createdAt",
//         sortOrder = "desc",
//       } = req.query;

//       // KIỂM TRA commentId có hợp lệ không
//       if (!commentId) {
//         return res.status(400).json({
//           success: false,
//           message: "ID bình luận không hợp lệ",
//         });
//       }

//       const skip = (page - 1) * limit;
//       const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
//       const userId = req.user?.userId;

//       const query = {
//         parentCommentID: commentId,
//         isBlocked: false,
//       };

//       const comments = await Comment.find(query)
//         .populate("userID", "username profile.avatar fullName")
//         .sort(sort)
//         .limit(parseInt(limit))
//         .skip(skip)
//         .lean();

//       // THÊM THÔNG TIN LIKE CHO USER HIỆN TẠI
//       const commentsWithLikeInfo = comments.map((comment) => {
//         const userLike = comment.likes.find(
//           (like) => like.user && like.user.toString() === userId.toString()
//         );

//         return {
//           ...comment,
//           isLiked: !!userLike,
//           userEmotion: userLike ? userLike.emotion : null,
//         };
//       });

//       const total = await Comment.countDocuments(query);

//       res.status(200).json({
//         success: true,
//         comments: commentsWithLikeInfo,
//         total,
//         page: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page < Math.ceil(total / limit),
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Cập nhật bình luận
//   async updateComment(req, res) {
//     try {
//       const { id } = req.params;
//       const { content } = req.body;
//       const userId = req.user.userId;

//       const comment = await Comment.findOne({
//         _id: id,
//         userID: userId,
//       });

//       if (!comment) {
//         return res.status(404).json({
//           success: false,
//           message: "Bình luận không tồn tại hoặc không có quyền chỉnh sửa",
//         });
//       }

//       // Chỉ cho phép cập nhật content
//       if (content !== undefined) {
//         comment.content = content;
//         comment.isEdited = true;
//         comment.editedAt = new Date();
//       }

//       await comment.save();
//       await comment.populate("userID", "username avatar fullName");

//       res.status(200).json({
//         success: true,
//         message: "Cập nhật bình luận thành công",
//         comment,
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Xóa bình luận

//   async deleteComment(req, res) {
//     try {
//       const { id } = req.params;
//       const userId = req.user.userId;
//       const isAdmin = ["admin", "supporter"].includes(req.user.role);

//       // 1. Tìm comment gốc
//       const rootComment = await Comment.findOne(
//         isAdmin ? { _id: id } : { _id: id, userID: userId }
//       );

//       if (!rootComment) {
//         return res.status(404).json({
//           success: false,
//           message: "Bình luận không tồn tại hoặc bạn không có quyền xóa.",
//         });
//       }

//       // 2. Lấy tất cả ID + fileUrl (dùng $graphLookup)
//       const result = await Comment.aggregate([
//         { $match: { _id: rootComment._id } }, // LẤY THEO ID
//         {
//           $graphLookup: {
//             from: "comments",
//             startWith: "$_id",
//             connectFromField: "_id",
//             connectToField: "parentCommentID",
//             as: "descendants",
//           },
//         },
//         {
//           $project: {
//             allIds: { $concatArrays: [["$_id"], "$descendants._id"] },
//             allFileUrls: {
//               $concatArrays: [
//                 {
//                   $cond: [
//                     { $ifNull: ["$file.fileUrl", false] },
//                     ["$file.fileUrl"],
//                     [],
//                   ],
//                 },
//                 {
//                   $reduce: {
//                     input: "$descendants",
//                     initialValue: [],
//                     in: {
//                       $concatArrays: [
//                         "$$value",
//                         {
//                           $cond: [
//                             { $ifNull: ["$$this.file.fileUrl", false] },
//                             ["$$this.file.fileUrl"],
//                             [],
//                           ],
//                         },
//                       ],
//                     },
//                   },
//                 },
//               ],
//             },
//           },
//         },
//       ]);

//       const commentIds = result[0]?.allIds || [id];
//       const fileUrls = (result[0]?.allFileUrls || []).filter(Boolean);

//       // 3. XÓA FILE TRƯỚC
//       if (fileUrls.length > 0) {
//         await FileManager.deleteMultipleFiles(fileUrls);
//       }

//       // 4. XÓA TẤT CẢ COMMENT
//       const deleteResult = await Comment.deleteMany({
//         _id: { $in: commentIds },
//       });

//       return res.status(200).json({
//         success: true,
//         message: `Đã xóa bình luận và ${commentIds.length - 1} phản hồi con.`,
//         data: {
//           deletedCount: deleteResult.deletedCount,
//           filesDeleted: fileUrls.length,
//         },
//       });
//     } catch (error) {
//       console.error("Lỗi xóa comment:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Lỗi server khi xóa bình luận.",
//       });
//     }
//   }

//   // Like bình luận - TRẢ VỀ THÔNG TIN ĐẦY ĐỦ
//   async likeComment(req, res) {
//     try {
//       const { id } = req.params;
//       const userId = req.user.userId;
//       const { emotion = "like" } = req.body;

//       const comment = await Comment.findById(id);
//       if (!comment) {
//         return res.status(404).json({
//           success: false,
//           message: "Bình luận không tồn tại",
//         });
//       }

//       const existingLikeIndex = comment.likes.findIndex(
//         (like) => like.user.toString() === userId.toString()
//       );

//       if (existingLikeIndex > -1) {
//         // Đã like rồi - có thể update emotion hoặc unlike
//         if (comment.likes[existingLikeIndex].emotion === emotion) {
//           // Unlike nếu cùng emotion
//           comment.likes.splice(existingLikeIndex, 1);
//           comment.likeCount -= 1;
//         } else {
//           // Update emotion
//           comment.likes[existingLikeIndex].emotion = emotion;
//           comment.likes[existingLikeIndex].createdAt = new Date();
//         }
//       } else {
//         // Thêm like mới
//         comment.likes.push({
//           user: userId,
//           emotion,
//           createdAt: new Date(),
//         });
//         comment.likeCount += 1;
//       }

//       await comment.save();

//       // Populate thông tin user
//       await comment.populate("userID", "username profile.avatar fullName");

//       // Chuẩn bị response với thông tin like
//       const commentResponse = comment.toObject();
//       const userLike = comment.likes.find(
//         (like) => like.user.toString() === userId.toString()
//       );

//       commentResponse.isLiked = !!userLike;
//       commentResponse.userEmotion = userLike ? userLike.emotion : null;

//       res.status(200).json({
//         success: true,
//         message: "Thích bình luận thành công",
//         comment: commentResponse,
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Unlike bình luận - TRẢ VỀ THÔNG TIN ĐẦY ĐỦ
//   async unlikeComment(req, res) {
//     try {
//       const { id } = req.params;
//       const userId = req.user.userId;

//       const comment = await Comment.findById(id);
//       if (!comment) {
//         return res.status(404).json({
//           success: false,
//           message: "Bình luận không tồn tại",
//         });
//       }

//       const existingLikeIndex = comment.likes.findIndex(
//         (like) => like.user.toString() === userId.toString()
//       );

//       if (existingLikeIndex > -1) {
//         comment.likes.splice(existingLikeIndex, 1);
//         comment.likeCount = Math.max(0, comment.likeCount - 1);
//         await comment.save();
//       }

//       // Populate thông tin user
//       await comment.populate("userID", "username profile.avatar fullName");

//       const commentResponse = comment.toObject();
//       commentResponse.isLiked = false;
//       commentResponse.userEmotion = null;

//       res.status(200).json({
//         success: true,
//         message: "Bỏ thích bình luận thành công",
//         comment: commentResponse,
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Lấy danh sách người đã like comment
//   async getCommentLikes(req, res) {
//     try {
//       const { id } = req.params;

//       const comment = await Comment.findById(id)
//         .populate("likes.user", "username avatar fullName")
//         .select("likes");

//       if (!comment) {
//         return res.status(404).json({
//           success: false,
//           message: "Bình luận không tồn tại",
//         });
//       }

//       res.status(200).json({
//         success: true,
//         likes: comment.likes,
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Ẩn bình luận (admin)
//   async blockComment(req, res) {
//     try {
//       const { id } = req.params;

//       // Kiểm tra quyền admin
//       if (req.user.role !== "admin" && req.user.role !== "supporter") {
//         return res.status(403).json({
//           success: false,
//           message: "Chỉ admin mới có quyền ẩn bình luận",
//         });
//       }

//       const comment = await Comment.findByIdAndUpdate(
//         id,
//         { isBlocked: true },
//         { new: true }
//       );

//       if (!comment) {
//         return res.status(404).json({
//           success: false,
//           message: "Bình luận không tồn tại",
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Đã ẩn bình luận",
//         comment,
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // Bỏ ẩn bình luận (admin)
//   async unblockComment(req, res) {
//     try {
//       const { id } = req.params;

//       // Kiểm tra quyền admin
//       if (req.user.role !== "admin" && req.user.role !== "supporter") {
//         return res.status(403).json({
//           success: false,
//           message: "Chỉ admin mới có quyền bỏ ẩn bình luận",
//         });
//       }

//       const comment = await Comment.findByIdAndUpdate(
//         id,
//         { isBlocked: false },
//         { new: true }
//       );

//       if (!comment) {
//         return res.status(404).json({
//           success: false,
//           message: "Bình luận không tồn tại",
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Đã bỏ ẩn bình luận",
//         comment,
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   async reportComment(req, res) {
//     try {
//       const { commentId } = req.params;
//       const { reason, note } = req.body;

//       const idUserCurrent = req.user.userId;

//       const comment = await Comment.findById(commentId);
//       if (!comment) {
//         return res.status(404).json({
//           success: false,
//           message: "Không có comment với id: " + commentId + " này",
//         });
//       }

//       // tạo bản ghi lỗi mới
//       const violation = new Violation({
//         targetType: "Comment",
//         targetId: commentId,
//         userId: comment.userID,
//         reportedBy: idUserCurrent,
//         reason: reason,
//         note: note,
//       });

//       await violation.save();

//       comment.reportCount = comment.reportCount ? comment.reportCount + 1 : 1;
//       if (comment.reportCount >= 10) {
//         // Khoá Bình Luạn
//         comment.isBlocked = true;

//         violation.status = "auto";
//         violation.actionTaken = "auto_blocked";
//         await violation.save();

//         // Cập nhật các vio trước đó cho bình luận thành xử lý nhanh
//         await Violation.updateMany(
//           {
//             targetType: "Comment",
//             targetId: commentId,
//             status: "pending",
//           },
//           { $set: { status: "auto", actionTaken: "auto_blocked" } }
//         );

//         // Thông báo cho người viết comment
//         await NotificationService.createAndEmitNotification({
//           recipient: comment.userID,
//           sender: req.user._id,
//           type: "POST_COMMENT_BLOCKED",
//           title: "Bình luận đã bị ẩn",
//           message: `Comment của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`,
//           data: {
//             violationId: violation._id,
//             postId: comment.postID,
//             reason: violation.reason,
//             action: "blocked",
//           },
//           priority: "high",
//           url: `/posts/${comment.postID}`,
//         });

//         // cập nhật các báo cáo vi phạm trước đó cho bình luận thành xử lý nhanh
//         await Violation.updateMany(
//           {
//             targetType: "Comment",
//             targetId: commentId,
//             status: "pending",
//           },
//           { status: "approved", actionTaken: "block_comment" }
//         );

//         // Thêm vi phạm cho user
//         await AddViolationUserByID(
//           comment.userID,
//           violation,
//           idUserCurrent,
//           false
//         );
//       }

//       await comment.save();

//       const reporter = await User.findById(idUserCurrent);

//       // // 1. Gửi thông báo real-time cho các admin
//       await NotificationService.emitNotificationToAdmins({
//         recipient: null, // Gửi cho tất cả admin
//         sender: idUserCurrent,
//         type: "REPORT_CREATED",
//         title: "Báo cáo mới cần xử lý",
//         message: `Bình Luận bài viết đã được báo cáo với lý do: ${reason}`,
//         data: {
//           violationId: violation._id,
//           commentId: commentId,
//           reporterId: idUserCurrent,
//           reporterName: reporter.fullName || reporter.username,
//           reason: reason,
//         },
//         priority: "low",
//         url: `/admin/reports/comments/${violation._id}`,
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Báo cáo Bình Luận: " + commentId + " thành công: " + reason,
//         violation,
//         violation,
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: "Báo cáo không thành công: " + error.message,
//       });
//     }

//     async function AddViolationUserByID(
//       userId,
//       violation,
//       userAdminId,
//       banUser = false
//     ) {
//       try {
//         if (!userId) return;
//         const user = await User.findById(userId);
//         if (!user) {
//           console.warn("AddViolationUserByID: user not found", userId);
//           return;
//         }
//         const newCount = (user.violationCount || 0) + 1;
//         let isActive = newCount <= 5;
//         if (banUser) {
//           isActive = false;
//         }

//         await User.findByIdAndUpdate(userId, {
//           active: isActive,
//           violationCount: newCount,
//           lastViolationAt: new Date(),
//         });

//         // Thông báo khi bị ban/tạm khoá
//         if (!isActive) {
//           await NotificationService.createAndEmitNotification({
//             recipient: userId,
//             sender: userAdminId,
//             type: "USER_BANNED",
//             title: "Tài khoản bị tạm ngưng",
//             message: `Tài khoản của bạn đã bị tạm ngưng do vi phạm nguyên tắc cộng đồng.`,
//             data: {
//               violationId: violation._id,
//               reason: violation.reason,
//               action: "banned",
//             },
//             priority: "urgent",
//             url: `/support`,
//           });
//         }

//         // Gửi email khi bị ban/tạm khoá
//         const admin = await User.findById(userAdminId);
//         if (!admin) {
//           console.warn("AddViolationUserByID: admin not found", userAdminId);
//           return;
//         }
//         await mailService.sendEmail({
//           to: user.email,
//           subject: "🚫 Tài Khoản Của Bạn Đã Bị Khoá - Autism Support",
//           templateName: "USER_BANNED",
//           templateData: {
//             userName: user.fullName || user.username,
//             violationReason: violation.reason,
//             severityLevel: "Nghiêm trọng",
//             actionTime: new Date().toLocaleString("vi-VN"),
//             adminName: admin.fullName || admin.username,
//             details: "Tài khoản vi phạm nguyên tắc cộng đồng và đã bị khoá",
//           },
//         });
//       } catch (err) {
//         console.error("Lỗi khi cập nhật violation user:", err);
//       }
//     }
//   }

//   // Thêm vi phạm cho user theo ID
// }

// module.exports = new CommentController();

// controllers/commentController.js
const Comment = require("../models/Comment");
const GrpMember = require("../models/GroupMember");
const Post = require("../models/Post");
const User = require("../models/User");
const Violation = require("../models/Violation");
const FileManager = require("../utils/fileManager");
const NotificationService = require("../services/notificationService");
const mailService = require("../services/mailService");
const { logUserActivity } = require("../logging/userActivityLogger");

class CommentController {
  // === TẠO BÌNH LUẬN ===
  async createComment(req, res) {
    try {
      const { postID, content, parentCommentID } = req.body;
      const userID = req.user.userId;

      if (!postID) {
        return res
          .status(400)
          .json({ success: false, message: "ID bài viết không hợp lệ" });
      }

      const post = await Post.findById(postID);
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Bài viết không tồn tại" });
      }

      if (post.groupId) {
        const groupMember = await GrpMember.findOne({
          userId: userID,
          groupId: post.groupId,
          status: "active",
        });
        if (!groupMember) {
          return res.status(403).json({
            success: false,
            message: "Bạn không có quyền bình luận trong nhóm này",
          });
        }
      }

      let file = null;
      if (req.file) {
        const fileFolder = req.file.mimetype.startsWith("image/")
          ? "images"
          : req.file.mimetype.startsWith("video/")
          ? "videos"
          : req.file.mimetype.startsWith("audio/")
          ? "audio"
          : "documents";

        const fileUrl = `/api/uploads/${fileFolder}/${req.file.filename}`;
        const messageType = req.file.mimetype.startsWith("image/")
          ? "image"
          : req.file.mimetype.startsWith("video/")
          ? "video"
          : req.file.mimetype.startsWith("audio/")
          ? "audio"
          : "file";

        file = {
          type: messageType,
          fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
        };
      }

      const comment = new Comment({
        postID,
        userID,
        content,
        parentCommentID: parentCommentID || null,
        file: file || null,
      });

      await comment.save();

      // Cập nhật counter
      if (!parentCommentID) {
        await Post.findByIdAndUpdate(postID, { $inc: { commentCount: 1 } });
      } else {
        await Comment.findByIdAndUpdate(parentCommentID, {
          $inc: { replyCount: 1 },
        });
      }

      try {
        console.log("🔍 Bắt đầu gửi thông báo comment...");
        
        // Lấy thông tin chủ bài viết - SỬA THÀNH userCreateID
        const post = await Post.findById(postID);
        
        if (post && post.userCreateID && post.userCreateID.toString() !== userID) {
          console.log("✅ Điều kiện gửi thông báo: ĐÚNG");
          
          // Gửi thông báo cho chủ bài viết
          await NotificationService.createAndEmitNotification({
            recipient: post.userCreateID, // SỬA: dùng userCreateID
            sender: userID,
            type: "POST_COMMENTED",
            title: "📝 Có bình luận mới",
            message: `${req.user.username} đã bình luận bài viết của bạn`,
            data: {
              postId: postID,
              commentId: comment._id.toString(),
              content: content ? content.substring(0, 100) : "Đã đính kèm file",
              commentType: parentCommentID ? "reply" : "comment"
            },
            priority: "medium",
            url: `/posts/${postID}?comment=${comment._id}`
          });
          
          console.log(`✅ Đã gửi thông báo cho chủ bài viết`);
        } else {
          console.log("❌ Điều kiện gửi thông báo: SAI");
        }

        // Thông báo cho chủ comment cha (nếu là reply)
        if (parentCommentID) {
          const parentComment = await Comment.findById(parentCommentID);
          
          if (parentComment && parentComment.userID && 
              parentComment.userID.toString() !== userID &&
              (!post.userCreateID || parentComment.userID.toString() !== post.userCreateID.toString())) {
            
            await NotificationService.createAndEmitNotification({
              recipient: parentComment.userID,
              sender: userID,
              type: "COMMENT_REPLIED",
              title: "💬 Có phản hồi mới",
              message: `${req.user.username} đã phản hồi bình luận của bạn`,
              data: {
                postId: postID,
                commentId: comment._id.toString(),
                parentCommentId: parentCommentID,
                content: content ? content.substring(0, 100) : "Đã đính kèm file"
              },
              priority: "medium",
              url: `/posts/${postID}?comment=${parentCommentID}`
            });
            
            console.log(`✅ Đã gửi thông báo reply`);
          }
        }
      } catch (notifyError) {
        console.error("❌ Lỗi gửi thông báo comment:", notifyError);
      }

      await comment.populate("userID", "_id username profile.avatar fullName");
      const commentResponse = comment.toObject();
      const userLike = comment.likes.find(
        (like) => like.user?.toString() === userID
      );
      commentResponse.isLiked = !!userLike;
      commentResponse.userEmotion = userLike?.emotion || null;

      // GHI LOG
      logUserActivity({
        action: !parentCommentID ? "comment.create" : "comment.create.reply",
        req,
        res,
        userId: userID,
        role: req.user.role,
        target: { type: "comment", id: comment._id.toString() },
        description: "Tạo bình luận mới",
        payload: {
          commentId: comment._id.toString(),
          postId: postID,
          content: content?.substring(0, 100),
          hasFile: !!file,
          parentCommentID,
        },
      });

      res.status(200).json({
        success: true,
        message: "Bình luận thành công",
        comment: commentResponse,
      });
    } catch (error) {
      console.error("Lỗi tạo bình luận:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // === LẤY BÌNH LUẬN THEO BÀI VIẾT ===
  async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const {
        page = 1,
        limit = 20,
        parentCommentID = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const userId = req.user?.userId;

      if (!postId) {
        return res
          .status(400)
          .json({ success: false, message: "ID bài viết không hợp lệ" });
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const query = { postID: postId, parentCommentID, isBlocked: false };

      const comments = await Comment.find(query)
        .populate("userID", "username profile.avatar fullName")
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const commentsWithLikeInfo = comments.map((c) => {
        const userLike = c.likes.find((l) => l.user?.toString() === userId);
        return {
          ...c,
          isLiked: !!userLike,
          userEmotion: userLike?.emotion || null,
        };
      });

      const total = await Comment.countDocuments(query);

      // GHI LOG XEM
      logUserActivity({
        action: "comment.list",
        req,
        res,
        userId,
        role: req.user?.role,
        target: { type: "post", id: postId },
        description: "Xem danh sách bình luận",
        payload: { postId, page, limit, parentCommentID },
      });

      res.status(200).json({
        success: true,
        comments: commentsWithLikeInfo,
        total,
        page: +page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: +page < Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Lỗi lấy bình luận:", error);
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // === LẤY REPLIES ===
  async getCommentReplies(req, res) {
    try {
      const { commentId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const userId = req.user?.userId;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const query = { parentCommentID: commentId, isBlocked: false };

      const comments = await Comment.find(query)
        .populate("userID", "username profile.avatar fullName")
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const commentsWithLikeInfo = comments.map((c) => {
        const userLike = c.likes.find((l) => l.user?.toString() === userId);
        return {
          ...c,
          isLiked: !!userLike,
          userEmotion: userLike?.emotion || null,
        };
      });

      const total = await Comment.countDocuments(query);

      logUserActivity({
        action: "comment.replies",
        req,
        res,
        userId,
        role: req.user?.role,
        target: { type: "comment", id: commentId },
        description: "Xem phản hồi bình luận",
        payload: { commentId, page, limit },
      });

      res.status(200).json({
        success: true,
        comments: commentsWithLikeInfo,
        total,
        page: +page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: +page < Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // === CẬP NHẬT BÌNH LUẬN ===
  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      const comment = await Comment.findOne({ _id: id, userID: userId });
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại hoặc không có quyền",
        });
      }

      const oldContent = comment.content;
      if (content !== undefined) {
        comment.content = content;
        comment.isEdited = true;
        comment.editedAt = new Date();
      }

      await comment.save();
      await comment.populate("userID", "username profile.avatar fullName");

      logUserActivity({
        action: "comment.update",
        req,
        res,
        userId,
        role: req.user.role,
        target: { type: "comment", id: id },
        description: "Chỉnh sửa bình luận",
        payload: {
          commentId: id,
          oldContent: oldContent?.substring(0, 100),
          newContent: content?.substring(0, 100),
        },
      });

      res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", comment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // === XÓA BÌNH LUẬN ===
  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = ["admin", "supporter"].includes(req.user.role);

      const rootComment = await Comment.findOne(
        isAdmin ? { _id: id } : { _id: id, userID: userId }
      );
      if (!rootComment) {
        return res
          .status(404)
          .json({ success: false, message: "Không có quyền xóa" });
      }

      const result = await Comment.aggregate([
        { $match: { _id: rootComment._id } },
        {
          $graphLookup: {
            from: "comments",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "parentCommentID",
            as: "descendants",
          },
        },
        {
          $project: {
            allIds: { $concatArrays: [["$_id"], "$descendants._id"] },
            allFileUrls: {
              $concatArrays: [
                {
                  $cond: [
                    { $ifNull: ["$file.fileUrl", false] },
                    ["$file.fileUrl"],
                    [],
                  ],
                },
                {
                  $reduce: {
                    input: "$descendants",
                    initialValue: [],
                    in: {
                      $concatArrays: [
                        "$$value",
                        {
                          $cond: [
                            { $ifNull: ["$$this.file.fileUrl", false] },
                            ["$$this.file.fileUrl"],
                            [],
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ]);

      const commentIds = result[0]?.allIds || [id];
      const fileUrls = (result[0]?.allFileUrls || []).filter(Boolean);

      if (fileUrls.length > 0) await FileManager.deleteMultipleFiles(fileUrls);
      const deleteResult = await Comment.deleteMany({
        _id: { $in: commentIds },
      });

      try {
        // Chỉ thông báo khi admin xóa comment của người khác
        if (isAdmin && rootComment && rootComment.userID.toString() !== userId) {
          await NotificationService.createAndEmitNotification({
            recipient: rootComment.userID,
            sender: userId,
            type: "COMMENT_DELETED",
            title: "Bình luận bị xóa",
            message: `Bình luận của bạn đã bị xóa bởi quản trị viên`,
            data: {
              postId: rootComment.postID,
              commentId: rootComment._id,
              deletedBy: req.user.username
            },
            priority: "high",
            url: `/support`
          });
        }
      } catch (notifyError) {
        console.error("Lỗi gửi thông báo delete:", notifyError);
      }

      logUserActivity({
        action: "comment.delete",
        req,
        res,
        userId,
        role: req.user.role,
        target: { type: "comment", id: id },
        description: isAdmin
          ? "Admin xóa bình luận"
          : "Người dùng xóa bình luận",
        payload: {
          commentId: id,
          deletedCount: deleteResult.deletedCount,
          filesDeleted: fileUrls.length,
        },
      });

      res.status(200).json({
        success: true,
        message: `Đã xóa bình luận và ${commentIds.length - 1} phản hồi con.`,
        data: {
          deletedCount: deleteResult.deletedCount,
          filesDeleted: fileUrls.length,
        },
      });
    } catch (error) {
      console.error("Lỗi xóa comment:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  // === LIKE BÌNH LUẬN ===
  async likeComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { emotion = "like" } = req.body;

      const comment = await Comment.findById(id);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Bình luận không tồn tại" });

      const existingLikeIndex = comment.likes.findIndex(
        (l) => l.user.toString() === userId
      );
      let action = "";

      if (existingLikeIndex > -1) {
        if (comment.likes[existingLikeIndex].emotion === emotion) {
          comment.likes.splice(existingLikeIndex, 1);
          comment.likeCount = Math.max(0, comment.likeCount - 1);
          action = "unlike";
        } else {
          comment.likes[existingLikeIndex].emotion = emotion;
          comment.likes[existingLikeIndex].createdAt = new Date();
          action = "update_emotion";
        }
      } else {
        comment.likes.push({ user: userId, emotion, createdAt: new Date() });
        comment.likeCount += 1;
        action = "like";
      }

      await comment.save();

      try {
        // Chỉ thông báo khi like (không phải unlike) và không phải tự like
        if ((action === "like" || action === "update_emotion") && 
            comment.userID._id.toString() !== userId) {
          
          await NotificationService.createAndEmitNotification({
            recipient: comment.userID._id,
            sender: userId,
            type: "COMMENT_LIKED",
            title: "Có người thích bình luận của bạn",
            message: `${req.user.username} đã thích bình luận của bạn`,
            data: {
              postId: comment.postID,
              commentId: comment._id,
              emotion: emotion
            },
            priority: "low",
            url: `/posts/${comment.postID}`
          });
        }
      } catch (notifyError) {
        console.error("Lỗi gửi thông báo like:", notifyError);
      }

      await comment.populate("userID", "username profile.avatar fullName");

      const commentResponse = comment.toObject();
      const userLike = comment.likes.find((l) => l.user.toString() === userId);
      commentResponse.isLiked = !!userLike;
      commentResponse.userEmotion = userLike?.emotion || null;

      logUserActivity({
        action: `comment.${action}`,
        req,
        res,
        userId,
        role: req.user.role,
        target: { type: "comment", id },
        description:
          action === "like"
            ? "Thích bình luận"
            : action === "unlike"
            ? "Bỏ thích"
            : "Thay đổi cảm xúc",
        payload: { commentId: id, emotion, action },
      });

      res.status(200).json({
        success: true,
        message: "Thao tác thành công",
        comment: commentResponse,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // === UNLIKE BÌNH LUẬN ===
  async unlikeComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const comment = await Comment.findById(id);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Bình luận không tồn tại" });

      const existingLikeIndex = comment.likes.findIndex(
        (l) => l.user.toString() === userId
      );
      if (existingLikeIndex > -1) {
        comment.likes.splice(existingLikeIndex, 1);
        comment.likeCount = Math.max(0, comment.likeCount - 1);
        await comment.save();
      }

      await comment.populate("userID", "username profile.avatar fullName");
      const commentResponse = comment.toObject();
      commentResponse.isLiked = false;
      commentResponse.userEmotion = null;

      logUserActivity({
        action: "comment.unlike",
        req,
        res,
        userId,
        role: req.user.role,
        target: { type: "comment", id },
        description: "Bỏ thích bình luận",
        payload: { commentId: id },
      });

      res.status(200).json({
        success: true,
        message: "Bỏ thích thành công",
        comment: commentResponse,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // === LẤY DANH SÁCH LIKE ===
  async getCommentLikes(req, res) {
    try {
      const { id } = req.params;
      const comment = await Comment.findById(id)
        .populate("likes.user", "username profile.avatar fullName")
        .select("likes");
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Bình luận không tồn tại" });

      logUserActivity({
        action: "comment.likes.list",
        req,
        res,
        userId: req.user.userId,
        role: req.user.role,
        target: { type: "comment", id },
        description: "Xem danh sách người thích bình luận",
        payload: { commentId: id, likeCount: comment.likes.length },
      });

      res.status(200).json({ success: true, likes: comment.likes });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // === ẨN BÌNH LUẬN (ADMIN) ===
  async blockComment(req, res) {
    try {
      const { id } = req.params;
      if (!["admin", "supporter"].includes(req.user.role)) {
        return res
          .status(403)
          .json({ success: false, message: "Chỉ admin mới có quyền" });
      }

      const comment = await Comment.findByIdAndUpdate(
        id,
        { isBlocked: true },
        { new: true }
      );
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Bình luận không tồn tại" });

      try {
        if (comment && comment.userID.toString() !== req.user.userId) {
          await NotificationService.createAndEmitNotification({
            recipient: comment.userID,
            sender: req.user.userId,
            type: "COMMENT_BLOCKED",
            title: "Bình luận bị ẩn",
            message: `Bình luận của bạn đã bị ẩn bởi quản trị viên`,
            data: {
              postId: comment.postID,
              commentId: comment._id,
              blockedBy: req.user.username
            },
            priority: "high",
            url: `/support`
          });
        }
      } catch (notifyError) {
        console.error("Lỗi gửi thông báo block:", notifyError);
      }

      logUserActivity({
        action: "comment.block",
        req,
        res,
        userId: req.user.userId,
        role: req.user.role,
        target: { type: "comment", id },
        description: "Admin ẩn bình luận",
        payload: { commentId: id, adminId: req.user.userId },
      });

      res
        .status(200)
        .json({ success: true, message: "Đã ẩn bình luận", comment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // === BỎ ẨN BÌNH LUẬN (ADMIN) ===
  async unblockComment(req, res) {
    try {
      const { id } = req.params;
      if (!["admin", "supporter"].includes(req.user.role)) {
        return res
          .status(403)
          .json({ success: false, message: "Chỉ admin mới có quyền" });
      }

      const comment = await Comment.findByIdAndUpdate(
        id,
        { isBlocked: false },
        { new: true }
      );
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Bình luận không tồn tại" });
        
      try {
        if (comment) {
          await NotificationService.createAndEmitNotification({
            recipient: comment.userID,
            sender: req.user.userId,
            type: "COMMENT_UNBLOCKED",
            title: "Bình luận đã được khôi phục",
            message: `Bình luận của bạn đã được hiển thị lại`,
            data: {
              postId: comment.postID,
              commentId: comment._id
            },
            priority: "medium",
            url: `/posts/${comment.postID}`
          });
        }
      } catch (notifyError) {
        console.error("Lỗi gửi thông báo unblock:", notifyError);
      }

      logUserActivity({
        action: "comment.unblock",
        req,
        res,
        userId: req.user.userId,
        role: req.user.role,
        target: { type: "comment", id },
        description: "Admin bỏ ẩn bình luận",
        payload: { commentId: id, adminId: req.user.userId },
      });

      res
        .status(200)
        .json({ success: true, message: "Đã bỏ ẩn bình luận", comment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // === BÁO CÁO BÌNH LUẬN ===
  async reportComment(req, res) {
    try {
      const { commentId } = req.params;
      const { reason, note } = req.body;
      const idUserCurrent = req.user.userId;

      const comment = await Comment.findById(commentId);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy bình luận" });

      const violation = new Violation({
        targetType: "Comment",
        targetId: commentId,
        userId: comment.userID,
        reportedBy: idUserCurrent,
        reason,
        note,
      });
      await violation.save();

      comment.reportCount = (comment.reportCount || 0) + 1;
      let autoBlocked = false;

      if (comment.reportCount >= 10) {
        comment.isBlocked = true;
        violation.status = "auto";
        violation.actionTaken = "auto_blocked";
        await violation.save();

        await Violation.updateMany(
          { targetType: "Comment", targetId: commentId, status: "pending" },
          { status: "approved", actionTaken: "block_comment" }
        );

        await NotificationService.createAndEmitNotification({
          recipient: comment.userID,
          sender: req.user._id,
          type: "POST_COMMENT_BLOCKED",
          title: "Bình luận bị ẩn",
          message: `Bình luận của bạn đã bị ẩn do vi phạm. Lý do: ${reason}`,
          data: { violationId: violation._id, postId: comment.postID, reason },
          priority: "high",
          url: `/posts/${comment.postID}`,
        });

        await AddViolationUserByID(
          comment.userID,
          violation,
          idUserCurrent,
          false
        );
        autoBlocked = true;
      }

      await comment.save();

      const reporter = await User.findById(idUserCurrent);
      await NotificationService.emitNotificationToAdmins({
        recipient: null,
        sender: idUserCurrent,
        type: "REPORT_CREATED",
        title: "Báo cáo bình luận mới",
        message: `Bình luận bị báo cáo: ${reason}`,
        data: {
          violationId: violation._id,
          commentId,
          reporterName: reporter.fullName || reporter.username,
          reason,
        },
        priority: "low",
        url: `/admin/reports/comments/${violation._id}`,
      });

      // GHI LOG BÁO CÁO
      logUserActivity({
        action: "comment.report",
        req,
        res,
        userId: idUserCurrent,
        role: req.user.role,
        target: { type: "comment", id: commentId },
        description: autoBlocked
          ? "Báo cáo → Tự động khóa bình luận"
          : "Báo cáo bình luận",
        payload: {
          commentId,
          reason,
          note,
          reportCount: comment.reportCount,
          autoBlocked,
        },
      });

      res
        .status(200)
        .json({ success: true, message: "Báo cáo thành công", violation });
    } catch (error) {
      console.error("Lỗi báo cáo:", error);
      res.status(400).json({ success: false, message: error.message });
    }

    // Hàm phụ trợ
    async function AddViolationUserByID(
      userId,
      violation,
      userAdminId,
      banUser = false
    ) {
      try {
        if (!userId) return;
        const user = await User.findById(userId);
        if (!user) return;

        const newCount = (user.violationCount || 0) + 1;
        let isActive = newCount <= 5 && !banUser;

        await User.findByIdAndUpdate(userId, {
          active: isActive,
          violationCount: newCount,
          lastViolationAt: new Date(),
        });

        if (!isActive) {
          await NotificationService.createAndEmitNotification({
            recipient: userId,
            sender: userAdminId,
            type: "USER_BANNED",
            title: "Tài khoản bị khóa",
            message: "Tài khoản của bạn đã bị tạm ngưng do vi phạm.",
            data: { violationId: violation._id, reason: violation.reason },
            priority: "urgent",
            url: "/support",
          });

          const admin = await User.findById(userAdminId);
          await mailService.sendEmail({
            to: user.email,
            subject: "Tài Khoản Bị Khóa - Autism Support",
            templateName: "USER_BANNED",
            templateData: {
              userName: user.fullName || user.username,
              violationReason: violation.reason,
              actionTime: new Date().toLocaleString("vi-VN"),
              adminName: admin?.fullName || admin?.username || "Hệ thống",
            },
          });
        }

        // GHI LOG VI PHẠM NGƯỜI DÙNG
        logUserActivity({
          action: "user.violation",
          req,
          res,
          userId: userAdminId || "system",
          role: "system",
          target: { type: "user", id: userId },
          description: "Cộng vi phạm người dùng",
          payload: {
            violationCount: newCount,
            banned: !isActive,
            reason: violation.reason,
          },
        });
      } catch (err) {
        console.error("Lỗi cập nhật vi phạm user:", err);
      }
    }
  }
}

module.exports = new CommentController();
