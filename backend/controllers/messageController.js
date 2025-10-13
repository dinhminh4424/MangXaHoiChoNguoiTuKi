// commentController.js
const Comment = require("../models/Comment");
const Post = require("../models/Post");

exports.createComment = async (req, res) => {
  try {
    const { postID, content, parentCommentID } = req.body;
    const userID = req.user.id; // từ auth middleware

    let file = null;
    if (req.file) {
      // Xác định thư mục theo mimetype của file
      let fileFolder = "documents";
      if (req.file.mimetype.startsWith("image/")) {
        fileFolder = "images";
      } else if (req.file.mimetype.startsWith("video/")) {
        fileFolder = "videos";
      } else if (req.file.mimetype.startsWith("audio/")) {
        fileFolder = "audio";
      }

      // Tạo URL truy cập
      const fileUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/uploads/${fileFolder}/${req.file.filename}`;
      // Xác định loại file
      let messageType = "file"; // Default
      if (req.file.type.startsWith("image/")) {
        messageType = "image";
      } else if (req.file.type.startsWith("video/")) {
        messageType = "video";
      } else if (req.file.type.startsWith("audio/")) {
        messageType = "audio";
      }

      file = {
        type: messageType,
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      };
    }

    const comment = new Comment({
      postID,
      userID,
      content,
      parentCommentID: parentCommentID || null,
      file: file,
    });

    await comment.save();

    // ✅ Cập nhật counter
    if (!parentCommentID) {
      // Comment gốc - tăng commentCount trong Post
      await Post.findByIdAndUpdate(postID, { $inc: { commentCount: 1 } });
    } else {
      // Reply comment - tăng replyCount trong comment cha
      await Comment.findByIdAndUpdate(parentCommentID, {
        $inc: { replyCount: 1 },
      });
    }

    await comment.populate("userID", "username profile fullName");

    res.status(201).json({
      success: true,
      message: "Bình luận thành công",
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// lấy danh sách bình luận của một bài viết với phân trang và lọc
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, parentCommentID = null } = req.query;

    const query = {
      postID: postId,
      parentCommentID: parentCommentID,
      isBlocked: false,
    };

    const comments = await Comment.find(query)
      .populate("userID", "username profile fullName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments(query);

    res.json({
      success: true,
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalComments: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
