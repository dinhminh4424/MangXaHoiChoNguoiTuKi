// controllers/commentController.js
const Comment = require("../models/Comment");
const GrpMember = require("../models/GroupMember");
const Post = require("../models/Post");
const User = require("../models/User");
const Violation = require("../models/Violation");
const FileManager = require("../utils/fileManager");
const NotificationService = require("../services/notificationService");
const mailService = require("../services/mailService");

class CommentController {
  // Tạo bình luận mới

  async createComment(req, res) {
    try {
      const { postID, content } = req.body;
      const userID = req.user.userId;

      // KIỂM TRA postID có hợp lệ không
      if (!postID) {
        return res.status(400).json({
          success: false,
          message: "ID bài viết không hợp lệ",
        });
      }

      const parentCommentID = req.body.parentCommentID || null;

      // Kiểm tra post tồn tại
      const post = await Post.findById(postID);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tồn tại",
        });
      }

      // Kiểm tra quyền trong nhóm - SỬA LỖI GroupMember
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

      // Xử lý file nếu có
      let file = null;
      if (req.file) {
        let fileFolder = "documents";
        if (req.file.mimetype.startsWith("image/")) {
          fileFolder = "images";
        } else if (req.file.mimetype.startsWith("video/")) {
          fileFolder = "videos";
        } else if (req.file.mimetype.startsWith("audio/")) {
          fileFolder = "audio";
        }

        const fileUrl = `/api/uploads/${fileFolder}/${req.file.filename}`;

        let messageType = "file";
        if (req.file.mimetype.startsWith("image/")) {
          messageType = "image";
        } else if (req.file.mimetype.startsWith("video/")) {
          messageType = "video";
        } else if (req.file.mimetype.startsWith("audio/")) {
          messageType = "audio";
        }

        file = {
          type: messageType,
          fileUrl: fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
        };
      }

      // Tạo comment
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
        // Comment gốc - tăng commentCount trong Post
        await Post.findByIdAndUpdate(postID, { $inc: { commentCount: 1 } });
      } else {
        // Reply comment - tăng replyCount trong comment cha
        await Comment.findByIdAndUpdate(parentCommentID, {
          $inc: { replyCount: 1 },
        });
      }

      // Populate user info và thêm thông tin like
      await comment.populate("userID", "_id username profile.avatar fullName");

      const commentResponse = comment.toObject();
      // Thêm thông tin like cho user hiện tại
      const userLike = comment.likes.find(
        (like) => like.user && like.user.toString() === userID
      );
      commentResponse.isLiked = !!userLike;
      commentResponse.userEmotion = userLike ? userLike.emotion : null;

      res.status(201).json({
        success: true,
        message: "Bình luận thành công",
        comment: commentResponse,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } finally {
    }
  }

  // Lấy bình luận theo bài viết
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

      // KIỂM TRA postId có hợp lệ không
      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "ID bài viết không hợp lệ",
        });
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
      const userId = req.user?.userId;

      const query = {
        postID: postId,
        parentCommentID: parentCommentID,
        isBlocked: false,
      };

      const comments = await Comment.find(query)
        .populate("userID", "username profile.avatar fullName")
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      // THÊM THÔNG TIN LIKE CHO USER HIỆN TẠI
      const commentsWithLikeInfo = comments.map((comment) => {
        const userLike = comment.likes.find(
          (like) => like.user && like.user.toString() === userId.toString()
        );

        return {
          ...comment,
          isLiked: !!userLike,
          userEmotion: userLike ? userLike.emotion : null,
        };
      });

      const total = await Comment.countDocuments(query);

      res.status(200).json({
        success: true,
        comments: commentsWithLikeInfo,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      });
    } catch (error) {
      console.log("Lỗi: ", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy replies của bình luận

  async getCommentReplies(req, res) {
    try {
      const { commentId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // KIỂM TRA commentId có hợp lệ không
      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "ID bình luận không hợp lệ",
        });
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
      const userId = req.user?.userId;

      const query = {
        parentCommentID: commentId,
        isBlocked: false,
      };

      const comments = await Comment.find(query)
        .populate("userID", "username profile.avatar fullName")
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      // THÊM THÔNG TIN LIKE CHO USER HIỆN TẠI
      const commentsWithLikeInfo = comments.map((comment) => {
        const userLike = comment.likes.find(
          (like) => like.user && like.user.toString() === userId.toString()
        );

        return {
          ...comment,
          isLiked: !!userLike,
          userEmotion: userLike ? userLike.emotion : null,
        };
      });

      const total = await Comment.countDocuments(query);

      res.status(200).json({
        success: true,
        comments: commentsWithLikeInfo,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật bình luận
  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      const comment = await Comment.findOne({
        _id: id,
        userID: userId,
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại hoặc không có quyền chỉnh sửa",
        });
      }

      // Chỉ cho phép cập nhật content
      if (content !== undefined) {
        comment.content = content;
        comment.isEdited = true;
        comment.editedAt = new Date();
      }

      await comment.save();
      await comment.populate("userID", "username avatar fullName");

      res.status(200).json({
        success: true,
        message: "Cập nhật bình luận thành công",
        comment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Xóa bình luận

  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = ["admin", "supporter"].includes(req.user.role);

      // 1. Tìm comment gốc
      const rootComment = await Comment.findOne(
        isAdmin ? { _id: id } : { _id: id, userID: userId }
      );

      if (!rootComment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại hoặc bạn không có quyền xóa.",
        });
      }

      // 2. Lấy tất cả ID + fileUrl (dùng $graphLookup)
      const result = await Comment.aggregate([
        { $match: { _id: rootComment._id } }, // LẤY THEO ID
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

      // 3. XÓA FILE TRƯỚC
      if (fileUrls.length > 0) {
        await FileManager.deleteMultipleFiles(fileUrls);
      }

      // 4. XÓA TẤT CẢ COMMENT
      const deleteResult = await Comment.deleteMany({
        _id: { $in: commentIds },
      });

      return res.status(200).json({
        success: true,
        message: `Đã xóa bình luận và ${commentIds.length - 1} phản hồi con.`,
        data: {
          deletedCount: deleteResult.deletedCount,
          filesDeleted: fileUrls.length,
        },
      });
    } catch (error) {
      console.error("Lỗi xóa comment:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa bình luận.",
      });
    }
  }

  // Like bình luận - TRẢ VỀ THÔNG TIN ĐẦY ĐỦ
  async likeComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { emotion = "like" } = req.body;

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại",
        });
      }

      const existingLikeIndex = comment.likes.findIndex(
        (like) => like.user.toString() === userId.toString()
      );

      if (existingLikeIndex > -1) {
        // Đã like rồi - có thể update emotion hoặc unlike
        if (comment.likes[existingLikeIndex].emotion === emotion) {
          // Unlike nếu cùng emotion
          comment.likes.splice(existingLikeIndex, 1);
          comment.likeCount -= 1;
        } else {
          // Update emotion
          comment.likes[existingLikeIndex].emotion = emotion;
          comment.likes[existingLikeIndex].createdAt = new Date();
        }
      } else {
        // Thêm like mới
        comment.likes.push({
          user: userId,
          emotion,
          createdAt: new Date(),
        });
        comment.likeCount += 1;
      }

      await comment.save();

      // Populate thông tin user
      await comment.populate("userID", "username profile.avatar fullName");

      // Chuẩn bị response với thông tin like
      const commentResponse = comment.toObject();
      const userLike = comment.likes.find(
        (like) => like.user.toString() === userId.toString()
      );

      commentResponse.isLiked = !!userLike;
      commentResponse.userEmotion = userLike ? userLike.emotion : null;

      res.status(200).json({
        success: true,
        message: "Thích bình luận thành công",
        comment: commentResponse,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Unlike bình luận - TRẢ VỀ THÔNG TIN ĐẦY ĐỦ
  async unlikeComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại",
        });
      }

      const existingLikeIndex = comment.likes.findIndex(
        (like) => like.user.toString() === userId.toString()
      );

      if (existingLikeIndex > -1) {
        comment.likes.splice(existingLikeIndex, 1);
        comment.likeCount = Math.max(0, comment.likeCount - 1);
        await comment.save();
      }

      // Populate thông tin user
      await comment.populate("userID", "username profile.avatar fullName");

      const commentResponse = comment.toObject();
      commentResponse.isLiked = false;
      commentResponse.userEmotion = null;

      res.status(200).json({
        success: true,
        message: "Bỏ thích bình luận thành công",
        comment: commentResponse,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy danh sách người đã like comment
  async getCommentLikes(req, res) {
    try {
      const { id } = req.params;

      const comment = await Comment.findById(id)
        .populate("likes.user", "username avatar fullName")
        .select("likes");

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại",
        });
      }

      res.status(200).json({
        success: true,
        likes: comment.likes,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Ẩn bình luận (admin)
  async blockComment(req, res) {
    try {
      const { id } = req.params;

      // Kiểm tra quyền admin
      if (req.user.role !== "admin" && req.user.role !== "supporter") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền ẩn bình luận",
        });
      }

      const comment = await Comment.findByIdAndUpdate(
        id,
        { isBlocked: true },
        { new: true }
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại",
        });
      }

      res.status(200).json({
        success: true,
        message: "Đã ẩn bình luận",
        comment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Bỏ ẩn bình luận (admin)
  async unblockComment(req, res) {
    try {
      const { id } = req.params;

      // Kiểm tra quyền admin
      if (req.user.role !== "admin" && req.user.role !== "supporter") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền bỏ ẩn bình luận",
        });
      }

      const comment = await Comment.findByIdAndUpdate(
        id,
        { isBlocked: false },
        { new: true }
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại",
        });
      }

      res.status(200).json({
        success: true,
        message: "Đã bỏ ẩn bình luận",
        comment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async reportComment(req, res) {
    try {
      const { commentId } = req.params;
      const { reason, note } = req.body;

      const idUserCurrent = req.user.userId;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Không có comment với id: " + commentId + " này",
        });
      }

      // tạo bản ghi lỗi mới
      const violation = new Violation({
        targetType: "Comment",
        targetId: commentId,
        userId: comment.userID,
        reportedBy: idUserCurrent,
        reason: reason,
        note: note,
      });

      await violation.save();

      comment.reportCount = comment.reportCount ? comment.reportCount + 1 : 1;
      if (comment.reportCount >= 10) {
        // Khoá Bình Luạn
        comment.isBlocked = true;

        violation.status = "auto";
        violation.actionTaken = "auto_blocked";
        await violation.save();

        // Cập nhật các vio trước đó cho bình luận thành xử lý nhanh
        await Violation.updateMany(
          {
            targetType: "Comment",
            targetId: commentId,
            status: "pending",
          },
          { $set: { status: "auto", actionTaken: "auto_blocked" } }
        );

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

        // cập nhật các báo cáo vi phạm trước đó cho bình luận thành xử lý nhanh
        await Violation.updateMany(
          {
            targetType: "Comment",
            targetId: commentId,
            status: "pending",
          },
          { status: "approved", actionTaken: "block_comment" }
        );

        // Thêm vi phạm cho user
        await AddViolationUserByID(
          comment.userID,
          violation,
          idUserCurrent,
          false
        );
      }

      await comment.save();

      const reporter = await User.findById(idUserCurrent);

      // // 1. Gửi thông báo real-time cho các admin
      await NotificationService.emitNotificationToAdmins({
        recipient: null, // Gửi cho tất cả admin
        sender: idUserCurrent,
        type: "REPORT_CREATED",
        title: "Báo cáo mới cần xử lý",
        message: `Bình Luận bài viết đã được báo cáo với lý do: ${reason}`,
        data: {
          violationId: violation._id,
          commentId: commentId,
          reporterId: idUserCurrent,
          reporterName: reporter.fullName || reporter.username,
          reason: reason,
        },
        priority: "low",
        url: `/admin/reports/comments/${violation._id}`,
      });

      return res.status(200).json({
        success: true,
        message: "Báo cáo Bình Luận: " + commentId + " thành công: " + reason,
        violation,
        violation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Báo cáo không thành công: " + error.message,
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

        // Gửi email khi bị ban/tạm khoá
        const admin = await User.findById(userAdminId);
        if (!admin) {
          console.warn("AddViolationUserByID: admin not found", userAdminId);
          return;
        }
        await mailService.sendEmail({
          to: user.email,
          subject: "🚫 Tài Khoản Của Bạn Đã Bị Khoá - Autism Support",
          templateName: "USER_BANNED",
          templateData: {
            userName: user.fullName || user.username,
            violationReason: violation.reason,
            severityLevel: "Nghiêm trọng",
            actionTime: new Date().toLocaleString("vi-VN"),
            adminName: admin.fullName || admin.username,
            details: "Tài khoản vi phạm nguyên tắc cộng đồng và đã bị khoá",
          },
        });
      } catch (err) {
        console.error("Lỗi khi cập nhật violation user:", err);
      }
    }
  }

  // Thêm vi phạm cho user theo ID
}

module.exports = new CommentController();
