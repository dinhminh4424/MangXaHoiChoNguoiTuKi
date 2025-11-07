const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
// const { param } = require("../routes/posts");
const FileManager = require("../utils/fileManager");
const Violation = require("../models/Violation");
const mailService = require("../services/mailService");
const NotificationService = require("../services/notificationService");

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
      search = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // let query = { isBlocked: false }; // lấy những cái ko bị vi phạm

    const query = {
      $or: [
        { isDeletedByUser: false },
        { isDeletedByUser: { $exists: false } },
      ],
      isBlocked: false,
    }; // lấy những cái ko bị vi phạm

    // query.isDeletedByUser = false;

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
      .populate("userCreateID", "username _id profile.avatar fullName");

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

    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    if (post.isDeletedByUser === true) {
      if (["admin", "supporter"].includes(user.role)) {
        return res.status(200).json({
          success: true,
          post,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Bài viết đã bị xoá",
        });
      }
    }

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
// Controller (Express)
// này là xoá luôn
// exports.deletePost = async (req, res) => {
//   const { id } = req.params;

//   // đảm bảo req.user có
//   if (!req.user || !req.user.userId) {
//     return res.status(401).json({ success: false, message: "Không xác thực" });
//   }

//   try {
//     const post = await Post.findById(id);
//     if (!post) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Bài viết không tồn tại" });
//     }

//     // kiểm tra quyền sở hữu
//     if (
//       post.userCreateID.toString() !== req.user.userId &&
//       req.user.role !== "admin"
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Bạn không có quyền xóa bài viết này",
//       });
//     }
//     const postFiles = Array.isArray(post.files)
//       ? post.files.map((f) => f.fileUrl)
//       : [];

//     // xóa comment (trong transaction)
//     await Comment.deleteMany({ postID: id });

//     // xóa post (trong transaction)
//     await Post.findByIdAndDelete(id);

//     // --- XÓA FILES NGOÀI DB (sau khi DB đã commit)
//     // Nếu xóa file thất bại, không rollback DB (không có cách hoàn hảo) — ta log và có thể enqueue retry
//     if (postFiles.length > 0) {
//       try {
//         // FileManager.deleteMultipleFiles có thể nhận mảng và trả Promise
//         await FileManager.deleteMultipleFiles(postFiles);
//       } catch (fileErr) {
//         // Log lỗi để xử lý sau (ví dụ: push vào queue retry)
//         console.error("Lỗi khi xóa file sau khi xóa post:", fileErr);
//         // Tuỳ nhu cầu: bạn có thể trả trạng thái thành công nhưng kèm cảnh báo
//         return res.status(200).json({
//           success: true,
//           message:
//             "Xóa bài viết thành công. Tuy nhiên một số tệp không được xóa, sẽ thử lại sau.",
//         });
//       }
//     }

//     return res
//       .status(200)
//       .json({ success: true, message: "Xóa bài viết thành công" });
//   } catch (err) {
//     // nếu transaction đang mở — abort
//     console.error(err);
//     return res
//       .status(500)
//       .json({ success: false, message: err.message || "Lỗi server" });
//   }
// };

// xoá mềm
exports.deletePost = async (req, res) => {
  const { id } = req.params;

  // đảm bảo req.user có
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ success: false, message: "Không xác thực" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Bài viết không tồn tại" });
    }

    console.log("post.userCreateID.toString(): ", post.userCreateID.toString());
    console.log("req.user.userId.toString(): ", req.user.userId.toString());
    // kiểm tra quyền sở hữu
    if (post.userCreateID.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bài viết này",
      });
    }

    post.isDeletedByUser = true;

    await post.save();

    return res
      .status(200)
      .json({ success: true, message: "Xóa bài viết thành công" });
  } catch (err) {
    // nếu transaction đang mở — abort
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Lỗi server" });
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

exports.reportPost = async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      reason,
      notes,
      status = "pending",
    } = req.body;

    const userId = req.user.userId;

    // xử lý file nếu có
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

      const post = await Post.findById(targetId);

      // tạo bản ghi mới
      const newViolation = new Violation({
        targetType: targetType,
        targetId: targetId,
        reason: reason,
        notes: notes,
        status: status,
        files: files,
        userId: post.userCreateID, // người bị báo cáo của bài viết
        reportedBy: userId, // ngừời báo cáo
      });

      // lưu
      await newViolation.save();

      // post.violationCount = post.violationCount ? post.violationCount + 1 : 1;
      post.reportCount = post.reportCount ? post.reportCount + 1 : 1;

      if (post.reportCount >= 10) {
        post.isBlocked = true;

        newViolation.status = "auto";
        newViolation.actionTaken = "auto_blocked";
        await newViolation.save();

        // cập nhật các vio trước đó cho bài viết thành xử lý nhanh
        await Violation.updateMany(
          { targetId: post._id, targetType: "Post", status: "pending" },
          { $set: { status: "auto", actionTaken: "auto_blocked" } }
        );

        // gửi thông báo cho người dùng
        await NotificationService.createAndEmitNotification({
          recipient: newViolation.userId,
          sender: req.user._id,
          type: "POST_BLOCKED",
          title: "Bài viết đã bị ẩn",
          message: `Bài viết của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${newViolation.reason}`,
          data: {
            violationId: newViolation._id,
            postId: newViolation.targetId,
            reason: newViolation.reason,
            action: "blocked",
          },
          priority: "high",
          url: `/posts/${newViolation.targetId}`,
        });

        // thêm vi phạm cho user
        await AddViolationUserByID(
          post.userCreateID,
          newViolation,
          req.user.userId,
          false
        );
      }

      await post.save();

      const reporter = await User.findById(userId);

      // 1. Gửi thông báo real-time cho admin
      await NotificationService.emitNotificationToAdmins({
        recipient: null, // Gửi cho tất cả admin
        sender: userId,
        type: "REPORT_CREATED",
        title: "Báo cáo mới cần xử lý",
        message: `Bài viết đã được báo cáo với lý do: ${reason}`,
        data: {
          violationId: newViolation._id,
          postId: targetId,
          reporterId: userId,
          reporterName: reporter.fullName || reporter.username,
          reason: reason,
        },
        priority: "high",
        url: `/admin/reports/${newViolation._id}`,
      });

      // 2. Gửi thông báo cho người đăng bài (nếu cần)
      await NotificationService.createAndEmitNotification({
        recipient: post.userCreateID._id,
        sender: userId,
        type: "USER_WARNED",
        title: "Bài viết của bạn đã được báo cáo",
        message: `Bài viết của bạn đã được báo cáo vì: ${reason}. Chúng tôi sẽ xem xét và thông báo kết quả.`,
        data: {
          violationId: newViolation._id,
          postId: targetId,
          reason: reason,
        },
        priority: "medium",
        url: `/posts/${targetId}`,
      });

      // if (post && reporter) {
      //   // GỬI EMAIL THÔNG BÁO
      //   await sendViolationEmails(newViolation, reporter, post);
      // }

      return res.status(200).json({
        success: true,
        message: "Báo cáo bài viết thành công",
        data: newViolation,
      });
    }
  } catch (error) {
    console.error("Tạo report bị lôi: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm vi phạm cho user theo ID
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

/**
 * Gửi email thông báo khi bài viết bị báo cáo
 */
async function sendViolationEmails(violation, reporter, post) {
  try {
    // Lấy thông tin người đăng bài
    const postOwner = await User.findById(post.userCreateID);
    if (!postOwner) return;

    // 1. Gửi email cho người đăng bài
    await mailService.sendEmail({
      to: postOwner.email,
      subject: "📢 Bài viết của bạn đã được báo cáo - Autism Support",
      templateName: "POST_REPORTED",
      templateData: {
        postOwnerName: postOwner.fullName || postOwner.username,
        reason: violation.reason,
        notes: violation.notes,
        reportTime: new Date(violation.createdAt).toLocaleString("vi-VN"),
        reportId: violation._id.toString(),
        postContent: post.content,
        postFiles: post.files ? post.files.length : 0,
        postTime: new Date(post.createdAt).toLocaleString("vi-VN"),
        postLink: `${process.env.FRONTEND_URL}/posts/${post._id}`,
        contactLink: `${process.env.FRONTEND_URL}/support`,
      },
    });

    // 2. Gửi email cho admin về báo cáo mới
    const admins = await User.find({
      role: { $in: ["admin", "supporter"] },
      email: { $exists: true, $ne: "" },
    });

    if (admins.length > 0) {
      const adminEmails = admins.map((admin) => admin.email);

      await mailService.sendEmail({
        to: adminEmails,
        subject: "🔔 Báo cáo mới cần xử lý - Autism Support",
        templateName: "ADMIN_REPORT_ALERT",
        templateData: {
          reportId: violation._id.toString(),
          contentType: "Bài viết",
          reason: violation.reason,
          priority: "medium", // Có thể tính toán dựa trên loại vi phạm
          reportTime: new Date(violation.createdAt).toLocaleString("vi-VN"),
          reporterName: reporter.fullName || reporter.username,
          postOwnerName: postOwner.fullName || postOwner.username,
          ownerViolationCount: postOwner.violationCount || 0,
          ownerRole: postOwner.role,
          reviewLink: `${process.env.FRONTEND_URL}/admin/reports/${violation._id}`,
          adminDashboardLink: `${process.env.FRONTEND_URL}/admin`,
        },
      });
    }

    console.log("✅ Đã gửi email thông báo vi phạm");
  } catch (error) {
    console.error("❌ Lỗi gửi email thông báo vi phạm:", error);
  }
}

/**
 * Gửi email thông báo khi bài viết bị ẩn
 */
async function sendPostBlockedEmail(post, admin, reason) {
  try {
    const postOwner = await User.findById(post.userCreateID);
    if (!postOwner) return;

    await mailService.sendEmail({
      to: postOwner.email,
      subject: "🚫 Bài viết của bạn đã bị ẩn - Autism Support",
      templateName: "POST_BLOCKED",
      templateData: {
        userName: postOwner.fullName || postOwner.username,
        violationReason: reason,
        severityLevel: "Nghiêm trọng",
        actionTime: new Date().toLocaleString("vi-VN"),
        adminName: admin.fullName || admin.username,
        details: "Bài viết vi phạm nguyên tắc cộng đồng và đã bị ẩn",
        postContent: post.content,
        guidelinesLink: `${process.env.FRONTEND_URL}/guidelines`,
        appealLink: `${process.env.FRONTEND_URL}/appeal`,
        supportEmail: process.env.EMAIL_USER,
      },
    });

    console.log("✅ Đã gửi email thông báo bài viết bị ẩn");
  } catch (error) {
    console.error("❌ Lỗi gửi email thông báo bài viết bị ẩn:", error);
  }
}
