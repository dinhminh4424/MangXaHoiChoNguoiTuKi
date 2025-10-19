const Post = require("../models/Post");
const { param } = require("../routes/posts");

// thêm bài viết
exports.createPost = async (req, res) => {
  try {
    const {
      content,
      groupId = null,
      privacy = "private",
      isAnonymous = false,
      emotions,
      tags,
    } = req.body;

    const userCreateID = req.user.userId;

    // Xử lý file nếu có
    let files = [];
    if (req.files) {
      files = req.files.map((file) => {
        let fileFolder = "documents";
        if (file.mimetype.startsWith("image/")) {
          fileFolder = "images";
        } else if (file.mimetype.startsWith("video/")) {
          fileFolder = "videos";
        } else if (file.mimetype.startsWith("audio/")) {
          fileFolder = "audio";
        }

        // const fileUrl = `${req.protocol}://${req.get(
        //   "host"
        // )}/api/uploads/${fileFolder}/${file.filename}`;

        const fileUrl = `/api/uploads/${fileFolder}/${file.filename}`;

        let messageType = "file";
        if (file.mimetype.startsWith("image/")) {
          messageType = "image";
        } else if (file.mimetype.startsWith("video/")) {
          messageType = "video";
        } else if (file.mimetype.startsWith("audio/")) {
          messageType = "audio";
        }

        return {
          type: messageType,
          fileUrl: fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
        };
      });
    }

    const newPost = new Post({
      userCreateID: userCreateID,
      groupId: groupId || null,
      content: content,
      files: files,
      privacy: privacy,
      isAnonymous: isAnonymous,
      emotions: emotions || [],
      tags: tags || [],
    });

    await newPost.save();

    return res.status(201).json({
      success: true,
      message: "Tạo bài viết thành công",
      post: newPost,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// lấy danh sách bài viết với phân trang và lọc
exports.getPosts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      userCreateID,
      emotions,
      tags,
      privacy,
      sortBy,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let query = { isBlocked: false }; // lấy những cái ko bị vi phạm

    if (userCreateID) {
      query.userCreateID = userCreateID; // lấy theo user id
    }
    if (emotions) {
      query.emotions = { $in: emotions.split(",") }; // lấy theo emotions
    }
    if (tags) {
      query.tags = { $in: tags.split(",") }; // lấy theo hashtag
    }
    if (privacy) {
      if (privacy == "all") {
        query.privacy;
      } else {
        query.privacy = privacy;
      }
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userCreateID", "username _id avatar fullName");

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      page,
      totalPages,
      totalPosts: total,
      posts,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// lấy chi tiết bài viết
exports.getPostDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate(
      "userCreateID",
      "username avatar fullName"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// cập nhật bài viết
// exports.updatePost = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { content, privacy, isAnonymous, emotions, tags } = req.body;
//     const post = await Post.findById(id);

//     if (!post) {
//       return res.status(404).json({
//         success: false,
//         message: "Bài viết không tồn tại",
//       });
//     }

//     // ✅ SỬA: Kiểm tra quyền sở hữu ĐÚNG
//     if (!post.userCreateID.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: `Bạn không có quyền chỉnh sửa bài viết này do post.userCreateID: ${post.userCreateID} !=== req.user.userId : ${req.user.userId} `,
//       });
//     }

//     // Cập nhật các trường
//     if (content !== undefined) post.content = content;
//     if (privacy !== undefined) post.privacy = privacy;
//     if (isAnonymous !== undefined) post.isAnonymous = isAnonymous;
//     if (emotions !== undefined) post.emotions = emotions;
//     if (tags !== undefined) post.tags = tags;

//     // Xử lý file nếu có
//     if (req.files) {
//       const files = req.files.map((file) => {
//         let fileFolder = "documents";
//         if (file.mimetype.startsWith("image/")) {
//           fileFolder = "images";
//         } else if (file.mimetype.startsWith("video/")) {
//           fileFolder = "videos";
//         } else if (file.mimetype.startsWith("audio/")) {
//           fileFolder = "audio";
//         }

//         const fileUrl = `${req.protocol}://${req.get(
//           "host"
//         )}/api/uploads/${fileFolder}/${file.filename}`;

//         let messageType = "file";
//         if (file.mimetype.startsWith("image/")) {
//           messageType = "image";
//         } else if (file.mimetype.startsWith("video/")) {
//           messageType = "video";
//         } else if (file.mimetype.startsWith("audio/")) {
//           messageType = "audio";
//         }

//         return {
//           type: messageType,
//           fileUrl,
//           fileName: file.originalname,
//           fileSize: file.size,
//         };
//       });
//       post.files = files;
//     }

//     post.isEdited = true;
//     post.editedAt = new Date();

//     await post.save();

//     return res.status(200).json({
//       success: true,
//       message: "Cập nhật bài viết thành công",
//       post,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=== 🚨 DEBUG UPDATE POST ===");
    console.log("FilesToDelete received:", req.body.filesToDelete);
    console.log("Type:", typeof req.body.filesToDelete);

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    if (!post.userCreateID.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa bài viết này",
      });
    }

    // Cập nhật các trường cơ bản
    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.privacy !== undefined) post.privacy = req.body.privacy;
    if (req.body.isAnonymous !== undefined)
      post.isAnonymous = req.body.isAnonymous;

    // Xử lý emotions và tags
    if (req.body.emotions !== undefined) {
      if (typeof req.body.emotions === "string") {
        try {
          post.emotions = JSON.parse(req.body.emotions);
        } catch (e) {
          post.emotions = req.body.emotions
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e);
        }
      } else {
        post.emotions = req.body.emotions;
      }
    }

    if (req.body.tags !== undefined) {
      if (typeof req.body.tags === "string") {
        try {
          post.tags = JSON.parse(req.body.tags);
        } catch (e) {
          post.tags = req.body.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
      } else {
        post.tags = req.body.tags;
      }
    }

    // ✅ XỬ LÝ XÓA FILE THEO fileUrl (ĐƠN GIẢN HƠN)
    if (req.body.filesToDelete) {
      console.log("🔄 PROCESSING FILES TO DELETE BY URL");

      let filesToDelete = [];

      // Parse JSON string nếu cần
      if (typeof req.body.filesToDelete === "string") {
        try {
          filesToDelete = JSON.parse(req.body.filesToDelete);
        } catch (e) {
          filesToDelete = [req.body.filesToDelete];
        }
      } else if (Array.isArray(req.body.filesToDelete)) {
        filesToDelete = req.body.filesToDelete;
      }

      console.log("🎯 Files to delete (URLs):", filesToDelete);
      console.log(
        "📁 Current files:",
        post.files.map((f) => f.fileUrl)
      );

      // Lọc files theo fileUrl - ĐƠN GIẢN và CHÍNH XÁC
      const originalCount = post.files.length;
      post.files = post.files.filter((file) => {
        const shouldKeep = !filesToDelete.includes(file.fileUrl);
        if (!shouldKeep) {
          console.log(
            `🗑️ Removing file by URL: ${file.fileName} (${file.fileUrl})`
          );
        }
        return shouldKeep;
      });

      console.log(`📊 Files: ${originalCount} → ${post.files.length}`);
    }

    // Xử lý file mới
    if (req.files && req.files.length > 0) {
      console.log("Adding new files:", req.files.length);
      const newFiles = req.files.map((file) => {
        let fileFolder = "documents";
        if (file.mimetype.startsWith("image/")) fileFolder = "images";
        else if (file.mimetype.startsWith("video/")) fileFolder = "videos";
        else if (file.mimetype.startsWith("audio/")) fileFolder = "audio";

        const fileUrl = `${req.protocol}://${req.get(
          "host"
        )}/api/uploads/${fileFolder}/${file.filename}`;

        let messageType = "file";
        if (file.mimetype.startsWith("image/")) messageType = "image";
        else if (file.mimetype.startsWith("video/")) messageType = "video";
        else if (file.mimetype.startsWith("audio/")) messageType = "audio";

        return {
          type: messageType,
          fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
        };
      });

      post.files = [...post.files, ...newFiles];
      console.log("Total files after adding:", post.files.length);
    }

    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    console.log("✅ Update successful - Final files:", post.files.length);
    return res.status(200).json({
      success: true,
      message: "Cập nhật bài viết thành công",
      post,
    });
  } catch (err) {
    console.error("❌ Update post error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// xóa bài viết
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    // ✅ SỬA: Kiểm tra quyền sở hữu ĐÚNG
    if (post.userCreateID.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bài viết này",
      });
    }

    await Post.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa bài viết thành công",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ẩn bài viết (do vi phạm) - Cho admin
exports.blockPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    // ✅ THÊM: Kiểm tra role admin
    if (req.user.role !== "admin" && req.user.role !== "supporter") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền ẩn bài viết",
      });
    }

    post.isBlocked = true;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Bài viết đã bị ẩn do vi phạm",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// bỏ ẩn bài viết - Cho admin
exports.unblockPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    // ✅ THÊM: Kiểm tra role admin
    if (req.user.role !== "admin" && req.user.role !== "supporter") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền bỏ ẩn bài viết",
      });
    }

    post.isBlocked = false;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Bài viết đã được hiển thị lại",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { emotion = "like" } = req.body;
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    // Kiểm tra xem user đã like chưa
    const existingLikeIndex = post.likes.findIndex(
      (like) => like.user.toString() === userId
    );

    if (existingLikeIndex > -1) {
      // Nếu đã like thì cập nhật emotion
      post.likes[existingLikeIndex].emotion = emotion;
      post.likes[existingLikeIndex].likedAt = new Date();
    } else {
      // Nếu chưa like thì thêm mới
      post.likes.push({
        user: userId,
        emotion: emotion,
        likedAt: new Date(),
      });
    }

    // ✅ CẬP NHẬT likeCount TỪ ĐỘ DÀI MẢNG likes
    post.likeCount = post.likes.length;

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Biểu cảm thành công",
      likes: post.likes,
      likeCount: post.likeCount, // Trả về likeCount
    });
  } catch (error) {
    console.error("Like post error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.unLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Không có bài viết này: " + id });
    }

    const initialLength = post.likes.length;

    post.likes = post.likes.filter(
      (like) => like.user.toString() !== userId.toString()
    );

    console.log("unLikePost - post.likes: ", post.likes);
    console.log("unLikePost - params id:", req.params.id);
    console.log("unLikePost - req.user:", req.user);
    if (post.likes.length < initialLength) {
      post.likeCount = Math.max(0, post.likes.length); // đảm bảo >= 0
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Hủy biểu cảm thành công",
        likes: post.likes,
        likeCount: post.likeCount,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Bạn chưa like bài viết này" });
    }
  } catch (error) {
    console.error("Unlike post error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
