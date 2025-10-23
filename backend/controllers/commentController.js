// controllers/commentController.js
const Comment = require("../models/Comment");
const GrpMember = require("../models/GroupMember");
const Post = require("../models/Post");

class CommentController {
  // Tạo bình luận mới
  async createComment(req, res) {
    const session = await Comment.startSession();
    session.startTransaction();

    try {
      const { postID, content } = req.body;
      const userID = req.user.userId;

      const parentCommentID = req.body.parentCommentID || null;

      // Kiểm tra post tồn tại
      const post = await Post.findById(postID);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tồn tại",
        });
      }

      if (
        post.groupId &&
        !GroupMember.findOne({
          userId: userID,
          groupId: post.groupId,
          status: { $ne: "active" },
        })
      ) {
        return res.json({
          success: false,
          message: "Bạn không có quyền đăng bài trong nhóm",
        });
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

        // const fileUrl = `${req.protocol}://${req.get(
        //   "host"
        // )}/api/uploads/${fileFolder}/${req.file.filename}`;

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

      // Populate user info
      await comment.populate("userID", "_id username profile.avatar fullName");

      res.status(201).json({
        success: true,
        message: "Bình luận thành công",
        comment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
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

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

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

      const total = await Comment.countDocuments(query);

      res.status(200).json({
        success: true,
        comments,
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

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const query = {
        parentCommentID: commentId,
        isBlocked: false,
      };

      const comments = await Comment.find(query)
        .populate("userID", "username avatar fullName")
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Comment.countDocuments(query);

      res.status(200).json({
        success: true,
        comments,
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
    const session = await Comment.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin =
        req.user.role === "admin" || req.user.role === "supporter";

      const query = isAdmin ? { _id: id } : { _id: id, userID: userId };

      const comment = await Comment.findOne(query);

      if (!comment) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại hoặc không có quyền xóa",
        });
      }

      // Kiểm tra xem comment có replies không
      const replyCount = await Comment.countDocuments({
        parentCommentID: id,
      });

      let message = "Xóa bình luận thành công";

      if (replyCount > 0) {
        // Nếu có replies, chỉ đánh dấu ẩn thay vì xóa
        comment.isBlocked = true;
        await comment.save({ session });
        message = "Đã ẩn bình luận (có chứa phản hồi)";
      } else {
        // Xóa comment và cập nhật counter
        await Comment.deleteOne({ _id: id }, { session });

        if (!comment.parentCommentID) {
          // Comment gốc - giảm commentCount trong Post
          await Post.findByIdAndUpdate(
            comment.postID,
            { $inc: { commentCount: -1 } },
            { session }
          );
        } else {
          // Reply comment - giảm replyCount trong comment cha
          await Comment.findByIdAndUpdate(
            comment.parentCommentID,
            { $inc: { replyCount: -1 } },
            { session }
          );
        }
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message,
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } finally {
      session.endSession();
    }
  }

  // Like bình luận
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
        (like) => like.user.toString() === userId
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

      res.status(200).json({
        success: true,
        message: "Thích bình luận thành công",
        comment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Unlike bình luận
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
        (like) => like.user.toString() === userId
      );

      if (existingLikeIndex > -1) {
        comment.likes.splice(existingLikeIndex, 1);
        comment.likeCount = Math.max(0, comment.likeCount - 1);
        await comment.save();
      }

      res.status(200).json({
        success: true,
        message: "Bỏ thích bình luận thành công",
        comment,
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
}

module.exports = new CommentController();
