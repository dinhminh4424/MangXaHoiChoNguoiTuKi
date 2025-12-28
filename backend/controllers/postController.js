const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Friend = require("../models/Friend"); // Đảm bảo đã import Friend
const GroupMember = require("../models/GroupMember"); // Đảm bảo đã import Friend

const FileManager = require("../utils/fileManager");
const Violation = require("../models/Violation");
const mailService = require("../services/mailService");
const NotificationService = require("../services/notificationService");
const AuthService = require("../services/authService");
const { logUserActivity } = require("../logging/userActivityLogger");

const mongoose = require("mongoose");

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

    if (groupId) {
      const check = await GroupMember.find({
        groupId: groupId,
        userId: userCreateID,
      });
      if (check.length == 0) {
        return res.status(504).json({
          success: false,
          message: "Bạn ko phải là thành viên của Group",
        });
      }
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

    // GHI LOG TẠO BÀI VIẾT
    logUserActivity({
      action: "post.create",
      req,
      res,
      userId: userCreateID,
      role: req.user.role,
      target: { type: "post", id: newPost._id.toString() },
      description: "Tạo bài viết mới",
      payload: {
        postId: newPost._id.toString(),
        groupId,
        privacy,
        isAnonymous,
        hasFiles: files.length > 0,
        fileCount: files.length,
        contentLength: content?.length || 0,
      },
    });

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

// lấy danh sách bài viết với phân trang và lọc (*** ĐÃ SỬA LỖI QUERY FRIEND ***)
// exports.getPosts = async (req, res) => {
//   try {
//     let {
//       page = 1,
//       limit = 10,
//       userCreateID,
//       emotions,
//       tags,
//       privacy,
//       sortBy,
//       search = "",
//     } = req.query;

//     page = parseInt(page);
//     limit = parseInt(limit);
//     const skip = (page - 1) * limit;

//     const currentUserId = req.user.userId;

//     // --- BẮT ĐẦU SỬA ---
//     // Lấy danh sách bạn bè (Logic 2 chiều - Sửa lại cho đúng model Friend.js)
//     const friendDocs = await Friend.find({
//       // status: 'accepted', // <--- LỖI: Model Friend không có status
//       $or: [
//         { userA: currentUserId }, // <-- Sửa thành userA
//         { userB: currentUserId }, // <-- Sửa thành userB
//       ],
//     }).lean();

//     const friendIds = friendDocs.map((doc) => {
//       // Sửa logic trích xuất ID
//       return doc.userA.equals(currentUserId) ? doc.userB : doc.userA;
//     });
//     // --- KẾT THÚC SỬA ---

//     friendIds.push(currentUserId); // Thêm cả ID của mình vào

//     // Query CƠ BẢN để đảm bảo quyền truy cập (Logic này đã đúng)
//     const query = {
//       $or: [
//         { isDeletedByUser: false },
//         { isDeletedByUser: { $exists: false } },
//       ],
//       isBlocked: false,

//       $and: [
//         {
//           $or: [
//             { privacy: "public" },
//             { userCreateID: currentUserId },
//             { privacy: "friends", userCreateID: { $in: friendIds } }, // Mệnh đề $in này giờ sẽ đúng
//           ],
//         },
//       ],
//     };

//     // Áp dụng các filter khác
//     if (userCreateID) {
//       query.userCreateID = userCreateID;
//     }
//     if (emotions) {
//       query.emotions = { $in: emotions.split(",") };
//     }
//     if (tags) {
//       query.tags = { $in: tags.split(",") };
//     }

//     if (privacy && privacy !== "all") {
//       if (privacy === "private" || privacy === "friends") {
//         if (userCreateID && userCreateID === currentUserId) {
//           query.privacy = privacy;
//         }
//       } else {
//         query.privacy = privacy; // 'public'
//       }
//     }

//     const posts = await Post.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("userCreateID", "username _id profile.avatar fullName");

//     const total = await Post.countDocuments(query);
//     const totalPages = Math.ceil(total / limit);

//     const responsePayload = {
//       success: true,
//       page,
//       totalPages,
//       totalPosts: total,
//       posts,
//     };

//     res.status(200);

//     // log
//     logUserActivity({
//       action: "feed.fetch",
//       req,
//       res,
//       userId: req.user?.userId,
//       role: req.user?.role,
//       target: { type: "feed", owner: req.user?.userId },
//       description: "Người dùng lấy danh sách bài viết",
//       payload: {
//         page,
//         limit,
//         filters: {
//           userCreateID: userCreateID || null,
//           emotions: emotions || null,
//           tags: tags || null,
//           privacy: privacy || "all",
//           search,
//         },
//         resultCount: posts.length,
//         total,
//       },
//       meta: {
//         totalPages,
//       },
//     });

//     return res.json(responsePayload);
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

exports.getPosts = async (req, res) => {
  try {
    const mongoose = require("mongoose");

    let {
      page = 1,
      limit = 10,
      userCreateID,
      emotions,
      tags,
      privacy,
      search = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const currentUserId = req.user.userId;
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    // 1. Lấy danh sách bạn bè
    const friendDocs = await Friend.find({
      $or: [{ userA: currentUserObjectId }, { userB: currentUserObjectId }],
    }).lean();

    const friendIds = friendDocs.map((doc) =>
      doc.userA.equals(currentUserObjectId) ? doc.userB : doc.userA
    );

    const friendObjectIds = [
      currentUserObjectId,
      ...friendIds.map((id) => new mongoose.Types.ObjectId(id)),
    ];

    // 2. Lấy danh sách group mà user là member
    const userGroupMemberships = await GroupMember.find({
      userId: currentUserObjectId,
      status: { $in: ["active", "pending"] },
    }).lean();

    const userGroupIds = userGroupMemberships.map((member) => member.groupId);

    // 3. Tạo pipeline
    const pipeline = [];

    // Stage 1: Match cơ bản
    pipeline.push({
      $match: {
        isBlocked: false,
        isDeletedByUser: { $ne: true },
      },
    });

    // Stage 2: Lookup user
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userCreateID",
        foreignField: "_id",
        as: "user",
      },
    });

    pipeline.push({
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: false,
      },
    });

    // Stage 3: Lookup group
    pipeline.push({
      $lookup: {
        from: "groups",
        localField: "groupId",
        foreignField: "_id",
        as: "group",
      },
    });

    pipeline.push({
      $unwind: {
        path: "$group",
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 4: Điều kiện hiển thị
    pipeline.push({
      $match: {
        $or: [
          // Post không có group
          {
            groupId: null,
            $or: [
              { userCreateID: currentUserObjectId },
              { privacy: "public" },
              {
                privacy: "friends",
                userCreateID: { $in: friendObjectIds },
              },
            ],
          },
          // Post có group mà user là member
          {
            groupId: { $in: userGroupIds },
          },
          // Post có group và group public
          {
            $and: [
              { groupId: { $ne: null } },
              { "group.visibility": "public" },
            ],
          },
          // Post của chính user (trong group)
          {
            userCreateID: currentUserObjectId,
          },
        ],
      },
    });

    // Stage 5: Filter thêm từ query params
    const additionalFilters = [];

    if (userCreateID) {
      additionalFilters.push({
        userCreateID: new mongoose.Types.ObjectId(userCreateID),
      });
    }

    if (emotions) {
      const emotionList = emotions.split(",").map((e) => e.trim());
      additionalFilters.push({
        emotions: { $in: emotionList },
      });
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim());
      additionalFilters.push({
        tags: { $in: tagList },
      });
    }

    if (privacy && privacy !== "all") {
      additionalFilters.push({
        privacy: privacy,
      });
    }

    if (additionalFilters.length > 0) {
      pipeline.push({
        $match: {
          $and: additionalFilters,
        },
      });
    }

    // Stage 6: Tìm kiếm (nếu có)
    if (search && search.trim() !== "") {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(searchTerm, "i");

      pipeline.push({
        $match: {
          $or: [
            { content: searchRegex },
            { tags: searchRegex },
            { emotions: searchRegex },
            { "user.username": searchRegex },
            { "user.fullName": searchRegex },
            { "user.email": searchRegex },
          ],
        },
      });
    }

    // Stage 7: Sort
    pipeline.push({
      $sort: { createdAt: -1 },
    });

    // Stage 8: Pagination (cho query chính)
    const paginationPipeline = [...pipeline];
    paginationPipeline.push({ $skip: skip });
    paginationPipeline.push({ $limit: limit });

    // Stage 9: Project format
    paginationPipeline.push({
      $project: {
        _id: 1,

        emotions: 1,
        tags: 1,

        createdAt: 1,
        updatedAt: 1,

        commentCount: 1,
        likes: 1,
        likeCount: 1,
        isEdited: 1,
        reportCount: 1,
        warningCount: 1,
        groupId: 1,
        editedAt: 1,
        content: 1,
        files: 1,
        privacy: 1,
        isAnonymous: 1,
        violationCount: 1,
        isBlocked: 1,
        isBlockedComment: 1,

        isDeletedByUser: 1,
        userCreateID: 1,

        comments: 1,

        userCreateID: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
          email: "$user.email",
          profile: "$user.profile",
          coverPhoto: "$user.profile.coverPhoto",
        },
        group: {
          $cond: {
            if: { $ne: ["$groupId", null] },
            then: {
              _id: "$group._id",
              name: "$group.name",
              avatar: "$group.avatar",
              coverPhoto: "$group.coverPhoto",
              visibility: "$group.visibility",
            },
            else: null,
          },
        },
        userLike: {
          $filter: {
            input: "$likes",
            as: "like",
            cond: { $eq: ["$$like.user", currentUserObjectId] },
          },
        },
      },
    });

    // 4. Thực thi query
    const [posts, countResult] = await Promise.all([
      Post.aggregate(paginationPipeline),
      Post.aggregate([...pipeline, { $count: "total" }]),
    ]);

    const totalPosts = countResult[0]?.total || 0;

    // 5. Xử lý thêm userLike
    const processedPosts = posts.map((post) => ({
      ...post,
      userLike:
        post.userLike && post.userLike.length > 0 ? post.userLike[0] : null,
      userEmotion:
        post.userLike && post.userLike.length > 0
          ? post.userLike[0].emotion
          : null,
    }));

    // 6. Response
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      posts: processedPosts,
      searchTerm: search || null,
    });
  } catch (err) {
    console.error("Lỗi getPosts:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Lỗi server khi lấy danh sách bài viết",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// lấy chi tiết bài viết (*** ĐÃ SỬA LỖI QUERY FRIEND ***)
exports.getPostDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate(
      "userCreateID",
      "username profile.avatar fullName"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại",
      });
    }

    const currentUserId = req.user.userId;
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    const isOwner = post.userCreateID.equals(currentUserId);
    const isAdmin = ["admin", "supporter"].includes(user.role);

    if (isOwner || isAdmin) {
      if (post.isDeletedByUser === true && !isAdmin) {
        return res.status(404).json({
          success: false,
          message: "Bài viết đã bị xoá",
        });
      }
      return res.status(200).json({ success: true, post });
    }

    if (post.isDeletedByUser === true || post.isBlocked === true) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại hoặc đã bị ẩn",
      });
    }

    if (post.privacy === "private") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem bài viết riêng tư này.",
      });
    }

    if (post.privacy === "friends") {
      const postOwnerId = post.userCreateID;

      // --- BẮT ĐẦU SỬA ---
      // Kiểm tra tình bạn hai chiều (Sửa lại cho đúng model Friend.js)
      const isFriend = await Friend.findOne({
        // status: 'accepted', // <--- LỖI: Model Friend không có status
        $or: [
          { userA: currentUserId, userB: postOwnerId }, // <-- Sửa thành userA, userB
          { userA: postOwnerId, userB: currentUserId }, // <-- Sửa thành userA, userB
        ],
      });
      // --- KẾT THÚC SỬA ---

      if (!isFriend) {
        return res.status(403).json({
          success: false,
          message: "Đây là bài viết chỉ dành cho bạn bè.",
        });
      }
    }

    // GHI LOG XEM CHI TIẾT
    logUserActivity({
      action: "post.view",
      req,
      res,
      userId: currentUserId,
      role: req.user.role,
      target: { type: "post", id: id },
      description: "Xem chi tiết bài viết",
      payload: {
        postId: id,
        isOwner: post.userCreateID.toString() === currentUserId,
      },
    });

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
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (req.body.filesToDelete) {
      let filesToDelete = [];
      if (typeof req.body.filesToDelete === "string") {
        try {
          filesToDelete = JSON.parse(req.body.filesToDelete);
        } catch (e) {
          filesToDelete = [req.body.filesToDelete];
        }
      } else if (Array.isArray(req.body.filesToDelete)) {
        filesToDelete = req.body.filesToDelete;
      }

      post.files = post.files.filter((file) => {
        return !filesToDelete.includes(file.fileUrl);
      });
    }

    // Xử lý file mới
    if (req.files && req.files.length > 0) {
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
    }

    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    const oldFiles = post.files.map((f) => f.fileUrl);

    logUserActivity({
      action: "post.update",
      req,
      res,
      userId: req.user.userId,
      role: req.user.role,
      target: { type: "post", id: id },
      description: "Cập nhật bài viết",
      payload: {
        postId: id,
        filesRemoved: oldFiles.filter(
          (f) => !post.files.some((pf) => pf.fileUrl === f)
        ).length,
        filesAdded: req.files?.length || 0,
        fieldsUpdated: Object.keys(req.body).filter(
          (k) => !["filesToDelete", "files"].includes(k)
        ),
      },
    });

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

// xoá mềm
exports.deletePost = async (req, res) => {
  const { id } = req.params;

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

    if (post.userCreateID.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bài viết này",
      });
    }

    post.isDeletedByUser = true;
    await post.save();

    logUserActivity({
      action: "post.delete.soft",
      req,
      res,
      userId: req.user.userId,
      role: req.user.role,
      target: { type: "post", id: id },
      description: "Người dùng Xóa mềm bài viết",
      payload: { postId: id, fileCount: post.files.length },
    });

    return res
      .status(200)
      .json({ success: true, message: "Xóa bài viết thành công" });
  } catch (err) {
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

    let action = "like"; // Biến để log
    if (existingLikeIndex > -1) {
      // Nếu đã like thì cập nhật emotion
      post.likes[existingLikeIndex].emotion = emotion;
      post.likes[existingLikeIndex].likedAt = new Date();
      action = "update_emotion";
    } else {
      // Nếu chưa like thì thêm mới
      post.likes.push({
        user: userId,
        emotion: emotion,
        likedAt: new Date(),
      });
    }

    post.likeCount = post.likes.length;
    await post.save();

    if (post.userCreateID.toString() !== userId) {
      try {
        const sender = await User.findById(userId);
        await NotificationService.createAndEmitNotification({
          recipient: post.userCreateID,
          sender: userId,
          type: "POST_LIKED",
          title: "Bài viết của bạn được thích ❤️",
          message: `${
            sender.fullName || sender.username
          } đã thích bài viết của bạn`,
          data: {
            postId: post._id,
            emotion: emotion,
            likeCount: post.likeCount,
            postContent: post.content?.substring(0, 100) || "",
          },
          priority: "low",
          url: `/posts/${post._id}`,
        });
      } catch (notifError) {
        console.error("Error sending like notification:", notifError);
      }
    }

    // GHI LOG LIKE
    logUserActivity({
      action: `post.${emotion}`,
      req,
      res,
      userId,
      role: req.user.role,
      target: { type: "post", id: id },
      description: emotion === "like" ? "Thích bài viết" : "Cập nhật cảm xúc",
      payload: { postId: id, emotion, likeCount: post.likeCount },
    });

    const responsePayload = {
      success: true,
      message: "Biểu cảm thành công",
      likes: post.likes,
      likeCount: post.likeCount,
    };

    res.status(200);
    logUserActivity({
      action: `post.${action}`,
      req,
      res,
      userId,
      role: req.user?.role,
      target: { type: "post", id: post._id.toString() },
      description: action === "like" ? "Thích bài viết" : "Cập nhật cảm xúc",
      payload: {
        emotion,
        likeCount: post.likeCount,
      },
    });

    return res.json(responsePayload);
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
      post.likeCount = Math.max(0, post.likes.length);
      await post.save();
      const responsePayload = {
        success: true,
        message: "Hủy biểu cảm thành công",
        likes: post.likes,
        likeCount: post.likeCount,
      };

      res.status(200);
      logUserActivity({
        action: "post.unlike",
        req,
        res,
        userId,
        role: req.user?.role,
        target: { type: "post", id: post._id.toString() },
        description: "Người dùng hủy cảm xúc bài viết",
        payload: {
          likeCount: post.likeCount,
        },
      });

      return res.json(responsePayload);
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
    }

    const post = await Post.findById(targetId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Bài viết không tồn tại" });
    }

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

    let autoBlocked = false;
    post.reportCount = (post.reportCount || 0) + 1;

    if (post.reportCount >= 10) {
      post.isBlocked = true;
      autoBlocked = true;

      newViolation.status = "auto";
      newViolation.actionTaken = "auto_blocked";
      await newViolation.save();

      await Violation.updateMany(
        { targetId: post._id, targetType: "Post", status: "pending" },
        { $set: { status: "auto", actionTaken: "auto_blocked" } }
      );

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

      await AddViolationUserByID(
        post.userCreateID,
        newViolation,
        req.user.userId,
        false
      );

      // lougout user
      await AuthService.notifyForceLogout(post.userCreateID, {
        reason: "Bài viết của bạn bị báo cáo quá nhiều",
      });
    }

    await post.save();

    const reporter = await User.findById(userId);

    await NotificationService.emitNotificationToAdmins({
      recipient: null, // Gửi cho tất cả admin
      sender: userId,
      type: "REPORT_CREATED",
      title: "Báo cáo bài viết mới cần xử lý",
      message: `Bài viết đã được báo cáo với lý do: ${reason}`,
      data: {
        violationId: newViolation._id,
        postId: targetId,
        reporterId: userId,
        reporterName: reporter.fullName || reporter.username,
        reason: reason,
      },
      priority: "high",
      url: `/admin/content/reports/${newViolation._id}`,
    });

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

    logUserActivity({
      action: "post.report",
      req,
      res,
      userId,
      role: req.user.role,
      target: { type: "post", id: targetId },
      description: autoBlocked
        ? "Báo cáo → Tự động ẩn bài viết"
        : "Báo cáo bài viết",
      payload: {
        postId: targetId,
        reason,
        reportCount: post.reportCount,
        autoBlocked,
      },
    });

    // sendViolationEmails(newViolation, reporter, post);

    return res.status(200).json({
      success: true,
      message: "Báo cáo bài viết thành công",
      data: newViolation,
    });
  } catch (error) {
    console.error("Tạo report bị lôi: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy hình ảnh (*** ĐÃ SỬA LỖI QUERY FRIEND ***)
exports.getImagePosts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 100,
      userCreateID,
      sortBy,
      groupId,
      type,
    } = req.query;

    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, parseInt(limit) || 10);
    const skip = (page - 1) * limit;

    console.log("req.query: ", req.query);

    const currentUserId = req.user.userId;

    // --- BẮT ĐẦU SỬA ---
    // Lấy danh sách bạn bè (Logic 2 chiều - Sửa lại cho đúng model Friend.js)
    const friendDocs = await Friend.find({
      // status: 'accepted', // <--- LỖI
      $or: [
        { userA: currentUserId }, // <-- Sửa
        { userB: currentUserId }, // <-- Sửa
      ],
    }).lean();

    const friendIds = friendDocs.map((doc) => {
      return doc.userA.equals(currentUserId) ? doc.userB : doc.userA;
    });
    friendIds.push(currentUserId); // Thêm chính mình
    // --- KẾT THÚC SỬA ---

    // Query CƠ SỞ (ĐÃ SỬA)
    const query = {
      $or: [
        { isDeletedByUser: false },
        { isDeletedByUser: { $exists: false } },
      ],
      isBlocked: false,
      "files.0": { $exists: true },

      $and: [
        {
          $or: [
            { privacy: "public" },
            { userCreateID: currentUserId },
            { privacy: "friends", userCreateID: { $in: friendIds } },
          ],
        },
      ],
    };

    if (userCreateID) {
      query.userCreateID = userCreateID;
    }
    if (groupId) {
      query.groupId = groupId;
    }

    let sortObj = { createdAt: -1 };
    if (sortBy) {
      const parts = String(sortBy).split(":");
      if (parts.length === 2) {
        sortObj = { [parts[0]]: parseInt(parts[1]) || -1 };
      } else {
        sortObj = { [parts[0]]: -1 };
      }
    }

    const posts = await Post.find(query)
      .sort(sortObj)
      .populate("userCreateID", "username _id profile.avatar fullName")
      .lean();

    const totalPosts = await Post.countDocuments(query);

    let images = [];
    for (const post of posts) {
      if (!post.files || !Array.isArray(post.files)) continue;

      for (const file of post.files) {
        if (type === "file") {
          if (file.type === "file") {
            images.push({
              imageUrl: file.fileUrl,
              imageName: file.fileName,
              imageSize: file.fileSize,
              type: file.type,
              post: post,
              postCreatedAt: post.createdAt,
              user: post.userCreateID
                ? {
                    _id: post.userCreateID._id,
                    username: post.userCreateID.username,
                    fullName: post.userCreateID.fullName,
                    avatar: post.userCreateID.profile?.avatar,
                  }
                : undefined,
            });
          }
        } else {
          if (file && file.type !== "text" && file.type !== "file") {
            images.push({
              imageUrl: file.fileUrl,
              imageName: file.fileName,
              type: file.type,
              post: post,
              postCreatedAt: post.createdAt,
              user: post.userCreateID
                ? {
                    _id: post.userCreateID._id,
                    username: post.userCreateID.username,
                    fullName: post.userCreateID.fullName,
                    avatar: post.userCreateID.profile?.avatar,
                  }
                : undefined,
            });
          }
        }
      }
    }

    const totalImages = images.length;
    const totalPages = Math.ceil(totalImages / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    images = images.slice(start, end);

    // GHI Xem Hình ảnh File
    logUserActivity({
      action: groupId ? "groupMedia" : "profileMedia",
      req,
      res,
      userCreateID,
      role: req.user.role,
      target: { type: "get", id: userCreateID },
      description: groupId
        ? "Xem các file/ hình ảnh của group"
        : "Xem hình ảnh của profile",
      payload: {
        success: true,
        page,
        totalPages,
        totalPosts,
        mediaCount: images.length, // số ảnh trong page hiện tại
        media: images,
      },
    });

    return res.status(200).json({
      success: true,
      page,
      totalPages,
      totalImages: totalImages,
      imagesCount: images.length,
      images,
      totalPosts: totalPosts,
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách ảnh:", err);
    return res.status(500).json({ success: false, message: err.message });
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
          priority: "medium",
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
