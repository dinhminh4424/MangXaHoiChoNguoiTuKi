const Group = require("../models/Group");
const GroupMember = require("../models/GroupMember");
const Post = require("../models/Post");
const User = require("../models/User");
const FileManager = require("../utils/fileManager");
const Violation = require("../models/Violation");
const mailService = require("../services/mailService");
const NotificationService = require("../services/notificationService");
const { logUserActivity } = require("../logging/userActivityLogger");
const QRService = require("../services/qrService");

class GroupController {
  async createGroup(req, res) {
    try {
      const { name, description, visibility, tags, emotionTags, category } =
        req.body;
      const owner = req.user.userId;

      const checkUser = await User.findById(owner);
      if (!checkUser.profile.idCard.verified) {
        return res.status(400).json({
          success: false,
          message: "Bạn chưa Xác Minh Danh tính",
        });
      }

      // === XỬ LÝ TAGS & EMOTIONTAGS - HỖ TRỢ CẢ CHUỖI VÀ MẢNG ===
      const parseTags = (input) => {
        if (!input) return [];
        if (Array.isArray(input)) {
          return input.map((tag) => tag.trim()).filter((tag) => tag);
        }
        if (typeof input === "string") {
          return input
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        }
        return [];
      };

      const tagsArray = parseTags(tags);
      const emotionTagsArray = parseTags(emotionTags);

      // === XỬ LÝ UPLOAD ẢNH ===
      let avatarUrl = "";
      let coverPhotoUrl = "";

      if (req.files) {
        // Multer lưu file theo tên field → req.files['fieldName'] là mảng
        if (req.files.avatar && req.files.avatar[0]) {
          avatarUrl = `/api/uploads/images/${req.files.avatar[0].filename}`;
        }
        if (req.files.coverPhoto && req.files.coverPhoto[0]) {
          coverPhotoUrl = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
        }
      }

      // === TẠO SLUG ===
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString().slice(-4);

      // === TẠO NHÓM ===
      const group = await Group.create({
        name,
        description,
        visibility,
        tags: tagsArray,
        emotionTags: emotionTagsArray,
        category,
        owner,
        avatar: avatarUrl,
        coverPhoto: coverPhotoUrl,
        slug,
      });

      // === THÊM CHỦ NHÓM ===
      await GroupMember.create({
        groupId: group._id,
        userId: owner,
        role: "owner",
        status: "active",
      });

      // GHI LOG TẠO Group
      logUserActivity({
        action: "group.create",
        req,
        res,
        userId: owner,
        role: req.user.role,
        target: { type: "post", id: group._id.toString() },
        description: "Tạo group mới",
        payload: {
          groupId: group._id.toString(),
          visibility,
          tags,
          emotionTags,
          category,
          avatarUrl,
          coverPhotoUrl,
        },
      });

      res.json({
        success: true,
        message: "Tạo nhóm thành công",
        group,
      });
    } catch (err) {
      console.error("Lỗi tạo nhóm:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi tạo nhóm: " + err.message,
      });
    }
  }

  async infoGroup(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;

      if (group.visibility !== "public" && userId) {
        const mem = await GroupMember.findOne({
          groupId: group._id,
          userId,
          status: "active",
        });

        if (!mem) {
          return res.json({
            success: true,
            message: "Bạn không có quyền xem chi tiết nhóm này",
            group: {
              _id: group._id,
              name: group.name,
              visibility: group.visibility,
              description:
                group.visibility === "public" ? group.description : "",
            },
          });
        }
      }

      res.json({
        success: true,
        message: "Lấy thông tin group thành công",
        group: group,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin group: " + err.message,
        error: err.message,
      });
    }
  }

  async joinGroup(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;
      const existing = await GroupMember.findOne({
        groupId: group._id,
        userId,
      });
      if (existing)
        return res.json({
          success: true,
          message: "Đã thao tác với nhóm",
          member: existing,
        });
      if (group.visibility === "invite") {
        const pending = await GroupMember.create({
          groupId: group._id,
          userId,
          status: "pending",
        });
        return res.json({
          success: true,
          message: "Gửi thông tin xin vào nhóm thành công",
          pending,
        });
      }
      const member = await GroupMember.create({
        groupId: group._id,
        message: "Gửi thông tin xin vào nhóm thành công",
        userId,
        status: "active",
      });
      await Group.findByIdAndUpdate(group._id, { $inc: { memberCount: 1 } });
      res.json({
        success: true,
        message: "Bạn đã vô gr ",
        member,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin group: " + err.message,
        error: err.message,
      });
    }
  }

  async inviteUser(req, res) {
    try {
      const { userIdToInvite } = req.body;
      const group = req.group;
      // check requester role
      const requester = await GroupMember.findOne({
        groupId: group._id,
        userId: req.user.userId,
      });
      if (!requester || !["owner", "moderator"].includes(requester.role))
        return res.status(403).json({
          success: false,
          message: "Bạn không phải là admin hoặc quản trị viên",
          error: "no_permission",
        });
      // create pending invite
      const existing = await GroupMember.findOne({
        groupId: group._id,
        userId: userIdToInvite,
      });
      if (existing)
        return res.json({
          success: true,
          message: "Bạn đã được mời",
          member: existing,
        });
      const invite = await GroupMember.create({
        groupId: group._id,
        userId: userIdToInvite,
        status: "pending",
        invitedBy: req.user.userId,
      });
      // create Notification (reuse Notification model)
      const Notification = require("../models/Notification");
      await Notification.create({
        userId: userIdToInvite,
        message: `Bạn được mời vào nhóm "${group.name}"`,
      });
      res.json({
        success: true,
        message: `Đã mời ${userIdToInvite}  vào nhóm "${group.name}"`,
        invite,
      });
    } catch (err) {
      console.error(err);
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi :" + err.message,
        error: err.message,
      });
    }
  }

  async postGroup(req, res) {
    try {
      const {
        content,
        privacy = "private",
        isAnonymous = false,
        emotions,
        tags,
      } = req.body;

      const group = req.group;

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
        groupId: group._id,
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
  }

  async getFeedGroup(req, res) {
    try {
      let {
        page = 1,
        limit = 10,
        userCreateID,
        emotions,
        tags,
        privacy = "all",
        sortBy,
      } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);
      const skip = (page - 1) * limit;

      let query = { isBlocked: false }; // lấy những cái ko bị vi phạm

      query.groupId = req.group._id;

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

      query.isDeletedByUser = false;
      query.isBlocked = false;

      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userCreateID", "username _id profile fullName");

      const total = await Post.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        success: true,
        page,
        totalPages,
        totalPosts: total,
        posts,
        message: "Lấy danh sách bài viết của group thành công",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  // Cập nhật thông tin nhóm
  async updateGroup(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;

      // Kiểm tra quyền owner/moderator
      const member = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        status: "active",
      });

      if (!member || !["owner", "moderator"].includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa nhóm này",
          error: "no_permission",
        });
      }

      const { name, description, visibility, tags, emotionTags, category } =
        req.body;

      // === XỬ LÝ UPLOAD ẢNH ===
      let avatarUrl = group.avatar;
      let coverPhotoUrl = group.coverPhoto;

      if (req.files) {
        // Xử lý avatar
        if (req.files.avatar && req.files.avatar[0]) {
          avatarUrl = `/api/uploads/images/${req.files.avatar[0].filename}`;
        }

        // Xử lý cover photo
        if (req.files.coverPhoto && req.files.coverPhoto[0]) {
          coverPhotoUrl = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
        }
      }

      // === XỬ LÝ TAGS & EMOTIONTAGS ===
      const parseTags = (input) => {
        if (!input) return [];
        if (Array.isArray(input)) {
          return input.map((tag) => tag.trim()).filter((tag) => tag);
        }
        if (typeof input === "string") {
          return input
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        }
        return [];
      };

      const tagsArray = tags ? parseTags(tags) : group.tags;
      const emotionTagsArray = emotionTags
        ? parseTags(emotionTags)
        : group.emotionTags;

      // === CẬP NHẬT CÁC TRƯỜNG ===
      if (name) group.name = name;
      if (description !== undefined) group.description = description;
      if (visibility) group.visibility = visibility;
      if (tags) group.tags = tagsArray;
      if (emotionTags) group.emotionTags = emotionTagsArray;
      if (category) group.category = [category].filter((cat) => cat);

      // Cập nhật ảnh
      group.avatar = avatarUrl;
      group.coverPhoto = coverPhotoUrl;

      // Tạo slug mới nếu tên thay đổi
      if (name && name !== group.name) {
        group.slug =
          name.toLowerCase().replace(/\s+/g, "-") +
          "-" +
          Date.now().toString().slice(-4);
      }

      await group.save();

      // GHI LOG CẬP NHẬT GROUP
      logUserActivity({
        action: "group.update",
        req,
        res,
        userId: userId,
        role: req.user.role,
        target: { type: "group", id: group._id.toString() },
        description: "Cập nhật thông tin group",
        payload: {
          groupId: group._id.toString(),
          name,
          visibility,
          tags: tagsArray,
          emotionTags: emotionTagsArray,
          category,
        },
      });

      res.json({
        success: true,
        message: "Cập nhật thông tin nhóm thành công",
        group: group,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật nhóm: " + err.message,
        error: err.message,
      });
    }
  }

  // Xóa nhóm (chỉ owner)
  async deleteGroup(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;

      // Chỉ owner mới được xóa
      const member = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        role: "owner",
        status: "active",
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "Chỉ chủ nhóm mới có quyền xóa nhóm",
          error: "owner_only",
        });
      }

      // Xóa tất cả bài viết trong nhóm
      await Post.deleteMany({ groupId: group._id });

      // Xóa tất cả thành viên
      await GroupMember.deleteMany({ groupId: group._id });

      // Xóa nhóm
      await Group.findByIdAndDelete(group._id);

      res.json({
        success: true,
        message: "Đã xóa nhóm thành công",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa nhóm: " + err.message,
        error: err.message,
      });
    }
  }

  // Rời nhóm
  async leaveGroup(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;

      const member = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        status: "active",
      });

      if (!member) {
        return res.status(400).json({
          success: false,
          message: "Bạn không phải là thành viên của nhóm này",
          error: "not_member",
        });
      }

      // Không cho owner rời nhóm (phải chuyển quyền hoặc xóa nhóm)
      if (member.role === "owner") {
        return res.status(400).json({
          success: false,
          message:
            "Chủ nhóm không thể rời nhóm. Hãy chuyển quyền hoặc xóa nhóm.",
          error: "owner_cannot_leave",
        });
      }

      // Xóa thành viên
      await GroupMember.findByIdAndDelete(member._id);

      // Giảm memberCount
      await Group.findByIdAndUpdate(group._id, { $inc: { memberCount: -1 } });

      res.json({
        success: true,
        message: "Đã rời nhóm thành công",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi rời nhóm: " + err.message,
        error: err.message,
      });
    }
  }

  // Chuyển quyền owner
  async transferOwnership(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;
      const { newOwnerId } = req.body;

      // Kiểm tra quyền hiện tại
      const currentOwner = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        role: "owner",
        status: "active",
      });

      if (!currentOwner) {
        return res.status(403).json({
          success: false,
          message: "Chỉ chủ nhóm mới có quyền chuyển quyền",
          error: "owner_only",
        });
      }

      // Tìm thành viên mới
      const newOwner = await GroupMember.findOne({
        groupId: group._id,
        userId: newOwnerId,
        status: "active",
      });

      if (!newOwner) {
        return res.status(404).json({
          success: false,
          message: "Thành viên này không tồn tại trong nhóm",
          error: "member_not_found",
        });
      }

      // Chuyển quyền
      await GroupMember.findByIdAndUpdate(currentOwner._id, { role: "member" });
      await GroupMember.findByIdAndUpdate(newOwner._id, { role: "owner" });

      // Cập nhật owner trong group
      await Group.findByIdAndUpdate(group._id, { owner: newOwnerId });

      res.json({
        success: true,
        message: "Chuyển quyền chủ nhóm thành công",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi chuyển quyền: " + err.message,
        error: err.message,
      });
    }
  }

  // Thêm/quản lý moderator
  async manageModerator(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;
      const { targetUserId, action } = req.body; // action: 'add' or 'remove'

      console.log("ManageModerator called with:", { targetUserId, action });

      // Kiểm tra quyền owner
      const requester = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        role: "owner",
        status: "active",
      });

      if (!requester) {
        return res.status(403).json({
          success: false,
          message: "Chỉ chủ nhóm mới có quyền quản lý quản trị viên",
          error: "owner_only",
        });
      }

      const targetMember = await GroupMember.findOne({
        groupId: group._id,
        userId: targetUserId,
        status: "active",
      });

      if (!targetMember) {
        return res.status(404).json({
          success: false,
          message: "Thành viên này không tồn tại trong nhóm",
          error: "member_not_found",
        });
      }

      if (action === "add") {
        if (targetMember.role === "moderator") {
          return res.status(400).json({
            success: false,
            message: "Thành viên này đã là quản trị viên",
            error: "already_moderator",
          });
        }
        targetMember.role = "moderator";
      } else if (action === "remove") {
        if (targetMember.role !== "moderator") {
          console.log("Target member role:", targetMember.role);
          return res.status(402).json({
            success: false,
            message: "Thành viên này không phải là quản trị viên",
            error: "not_moderator",
          });
        }
        targetMember.role = "member";
      }

      await targetMember.save();

      res.json({
        success: true,
        message:
          action === "add" ? "Đã thêm quản trị viên" : "Đã gỡ quản trị viên",
        member: targetMember,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi quản lý quản trị viên: " + err.message,
        error: err.message,
      });
    }
  }

  // Lấy danh sách thành viên
  async getMembers(req, res) {
    try {
      const group = req.group;
      const { page = 1, limit = 20, role, status = "active" } = req.query;

      // const query = { groupId: group._id, status };
      const query = { groupId: group._id };
      if (role) query.role = role;

      const members = await GroupMember.find(query)
        .populate("userId", "username fullName profile.avatar")
        .populate("invitedBy", "username fullName")
        .sort({ role: -1, joinedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await GroupMember.countDocuments(query);

      res.json({
        success: true,
        members,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalMembers: total,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách thành viên: " + err.message,
        error: err.message,
      });
    }
  }

  // Quản lý thành viên (chấp nhận, từ chối, cấm)
  async manageMember(req, res) {
    try {
      const group = req.group;
      const userId = req.user.userId;
      const { targetUserId, action } = req.body; // action: 'accept', 'reject', 'ban', 'unban'

      // Kiểm tra quyền owner/moderator
      const requester = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        status: "active",
      });

      if (!requester || !["owner", "moderator"].includes(requester.role)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền quản lý thành viên",
          error: "no_permission",
        });
      }

      const targetMember = await GroupMember.findOne({
        groupId: group._id,
        userId: targetUserId,
      });

      if (!targetMember) {
        return res.status(404).json({
          success: false,
          message: "Thành viên không tồn tại",
          error: "member_not_found",
        });
      }

      switch (action) {
        case "accept":
          if (targetMember.status !== "pending") {
            return res.status(400).json({
              success: false,
              message: "Thành viên không ở trạng thái chờ duyệt",
              error: "not_pending",
            });
          }
          targetMember.status = "active";
          await Group.findByIdAndUpdate(group._id, {
            $inc: { memberCount: 1 },
          });
          break;

        case "reject":
          if (targetMember.status !== "pending") {
            return res.status(400).json({
              success: false,
              message: "Thành viên không ở trạng thái chờ duyệt",
              error: "not_pending",
            });
          }
          await GroupMember.findByIdAndDelete(targetMember._id);
          break;

        case "ban":
          if (targetMember.role === "owner") {
            return res.status(400).json({
              success: false,
              message: "Không thể cấm chủ nhóm",
              error: "cannot_ban_owner",
            });
          }
          targetMember.status = "banned";
          await Group.findByIdAndUpdate(group._id, {
            $inc: { memberCount: -1 },
          });

          // await GroupMember.findAndDelete({
          //   groupId: group._id,
          //   userId: targetUserId,
          // });
          break;

        case "unban":
          if (targetMember.status !== "banned") {
            return res.status(400).json({
              success: false,
              message: "Thành viên không bị cấm",
              error: "not_banned",
            });
          }
          targetMember.status = "active";
          await Group.findByIdAndUpdate(group._id, {
            $inc: { memberCount: 1 },
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Hành động không hợp lệ",
            error: "invalid_action",
          });
      }

      if (action !== "reject") {
        await targetMember.save();
      }

      res.json({
        success: true,
        message: `Đã ${action} thành viên thành công`,
        member: action === "reject" ? null : targetMember,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi quản lý thành viên: " + err.message,
        error: err.message,
      });
    }
  }

  // Lấy tất cả groups (cho discovery)
  async getAllGroups(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        visibility,
        category,
        sortBy = "memberCount",
      } = req.query;

      const query = {};

      // Tìm kiếm theo tên hoặc mô tả
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          // { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Lọc theo visibility
      if (visibility) {
        query.visibility = visibility;
      }

      // Lọc theo category
      if (category) {
        query.category = { $in: [category] };
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Sắp xếp
      let sort = {};
      switch (sortBy) {
        case "newest":
          sort = { createdAt: -1 };
          break;
        case "name":
          sort = { name: 1 };
          break;
        case "memberCount":
        default:
          sort = { memberCount: -1 };
          break;
      }

      const groups = await Group.find(query)
        .populate("owner", "username fullName avatar")
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean();

      const total = await Group.countDocuments(query);

      for (let grp of groups) {
        const member = await GroupMember.find({
          groupId: grp._id,
          status: "active",
        })
          .limit(6)
          .populate("userId", "username fullName profile.avatar")
          .lean();

        const memberCount = await GroupMember.countDocuments({
          groupId: grp._id,
          status: "active",
        });

        const postCount = await Post.countDocuments({ groupId: grp._id });

        const totalInteraction = await Post.aggregate([
          {
            $match: {
              groupId: grp._id,
              isBlocked: false,
            },
          },
          {
            $group: {
              _id: null,
              totalLikes: { $sum: "$likeCount" }, // Tổng số lượt thích
              totalComments: { $sum: "$commentCount" }, // Tổng số bình luận
              totalInteractions: {
                $sum: {
                  $add: ["$likeCount", "$commentCount"], // Tổng tương tác
                },
              },
            },
          },
        ]);

        grp.membersPreview = member;
        grp.memberCount = memberCount;
        grp.postCount = postCount;
        grp.reactionCount = totalInteraction;
      }

      res.json({
        success: true,
        groups,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        totalGroups: total,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách nhóm: " + err.message,
        error: err.message,
      });
    }
  }

  // Lấy groups của user
  async getUserGroups(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Lấy tất cả group IDs mà user là thành viên
      const userMemberships = await GroupMember.find({
        userId: userId,
        status: "active",
      }).select("groupId");

      const groupIds = userMemberships.map((member) => member.groupId);

      const groups = await Group.find({ _id: { $in: groupIds } })
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip);

      const total = await Group.countDocuments({ _id: { $in: groupIds } });

      res.json({
        success: true,
        groups,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        totalGroups: total,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy nhóm của user: " + err.message,
        error: err.message,
      });
    }
  }

  // Tìm kiếm groups
  async searchGroups(req, res) {
    try {
      const { q: searchTerm, page = 1, limit = 20 } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập từ khóa tìm kiếm",
        });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const query = {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { tags: { $in: [new RegExp(searchTerm, "i")] } },
          { emotionTags: { $in: [new RegExp(searchTerm, "i")] } },
        ],
      };

      const groups = await Group.find(query)
        .populate("owner", "username fullName avatar")
        .sort({ memberCount: -1 })
        .limit(limitNum)
        .skip(skip);

      const total = await Group.countDocuments(query);

      res.json({
        success: true,
        groups,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        totalGroups: total,
        searchTerm,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tìm kiếm nhóm: " + err.message,
        error: err.message,
      });
    }
  }

  // Lấy groups đề xuất (dựa trên emotion tags)
  async getRecommendedGroups(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 10 } = req.query;

      // Lấy emotion từ mood logs của user (nếu có)
      // Ở đây tôi giả sử bạn có model MoodLog
      const MoodLog = require("../models/MoodLog");

      const userMoods = await MoodLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      const userEmotions = [...new Set(userMoods.map((log) => log.emotion))];

      let query = { visibility: "public" };

      // Nếu có emotions từ user, tìm groups có emotionTags trùng
      if (userEmotions.length > 0) {
        query.emotionTags = { $in: userEmotions };
      }

      const groups = await Group.find(query)
        .populate("owner", "username fullName avatar")
        .sort({ memberCount: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        groups,
        total: groups.length,
        basedOnEmotions: userEmotions,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy nhóm đề xuất: " + err.message,
        error: err.message,
      });
    }
  }

  // Lấy groups phổ biến
  async getPopularGroups(req, res) {
    try {
      const { limit = 10, category } = req.query;

      const query = { visibility: "public" };

      if (category) {
        query.category = { $in: [category] };
      }

      const groups = await Group.find(query)
        .populate("owner", "username fullName avatar")
        .sort({ memberCount: -1, createdAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        groups,
        total: groups.length,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy nhóm phổ biến: " + err.message,
        error: err.message,
      });
    }
  }

  async reportGroup(req, res) {
    try {
      const {
        targetType,
        targetId,
        reason,
        notes,
        status = "pending",
      } = req.body;

      const { groupId } = req.params;

      const group = await Group.findById(groupId);

      const userId = req.user.userId;

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

      const newViolation = new Violation({
        targetType: targetType,
        targetId: targetId,
        reason: reason,
        notes: notes,
        status: status,
        userId: group.owner,
        reportedBy: userId,
        files: files || [],
      });

      await newViolation.save();

      let reportCount = group.reportCount + 1;

      group.reportCount = reportCount;

      // gửi thông báo cho admin

      const reporter = await User.findById(userId);

      await NotificationService.emitNotificationToAdmins({
        recipient: null, // Gửi cho tất cả admin
        sender: userId,
        type: "REPORT_CREATED",
        title: "Báo cáo mới hội nhóm cần xử lý",
        message: `Hội Nhóm đã được báo cáo với lý do: ${reason}`,
        data: {
          violationId: newViolation._id,
          groupId: targetId,
          reporterId: userId,
          reporterName: reporter.fullName || reporter.username,
          reason: reason,
        },
        priority: "high",
        url: `/admin/groups/reports/${newViolation._id}`,
      });

      if (reportCount >= 10) {
        group.active = false;

        await Violation.updateMany(
          { targetId: group._id, targetType: "Group", status: "pending" },
          { $set: { status: "auto", actionTaken: "auto_blocked" } }
        );

        // gửi thông báo cho người dùng
        await NotificationService.createAndEmitNotification({
          recipient: newViolation.userId,
          sender: req.user._id,
          type: "GROUP_BLOCKED",
          title: "Hội Nhóm đã bị ẩn",
          message: `Hội Nhóm của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng. Lý do: ${newViolation.reason}`,
          data: {
            violationId: newViolation._id,
            postId: newViolation.targetId,
            reason: newViolation.reason,
            action: "blocked",
          },
          priority: "high",
          url: `/group/${newViolation.targetId}`,
        });

        await AddViolationUserByID();
      }

      await group.save();

      return res.status(200).json({
        success: true,
        message: "Báo Cáo Hội Nhóm: " + group.name,
        group,
        violation: newViolation,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi báo cáo Hội Nhóm: " + error.message,
        error: error.message,
      });
    }
  }

  // ===================================================================== QR CODE
  // [GET] /api/users/:userId/qr - Lấy QR code của user
  async getUserQR(req, res) {
    try {
      const group = await Group.findById(req.params.groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group không tồn tại",
        });
      }

      const profileUrl = `${process.env.FRONTEND_URL}/group/${group._id}`;

      // KIỂM TRA THEO SCHEMA MỚI
      if (!group.qrCode || !group.qrCode.dataURL) {
        console.log("🆕 Tạo QR code mới cho group:", group.username);
        group.qrCode = await QRService.generatePermanentQR(profileUrl);
        await group.save();
      }

      // RESPONSE PHÙ HỢP
      res.json({
        success: true,
        data: {
          qrDataURL: group.qrCode.dataURL,
          profileUrl: group.qrCode.data,
          group: {
            id: group._id,
            username: group.username,
            fullName: group.fullName,
          },
        },
      });
    } catch (error) {
      console.error("Error getting group QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy QR code",
        error: error.message,
      });
    }
  }

  /**
   * Cập nhật QR code - CHỈ ADMIN HOẶC BẢN THÂN USER
   * TẠO LẠI QR CODE MỚI
   */
  async updateUserQR(req, res) {
    try {
      const group = await Group.findById(req.params.groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group không tồn tại",
        });
      }

      // CHỈ admin hoặc chính user đó
      const isOwner = req.user.userId === group.owner.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin hoặc chủ tài khoản mới có thể cập nhật QR code",
        });
      }

      const { options = {} } = req.body;
      const profileUrl = `${process.env.FRONTEND_URL}/group/${group._id}`;

      // TẠO QR CODE MỚI VĨNH VIỄN
      const newQRData = await QRService.generatePermanentQR(profileUrl, {
        color: {
          dark: "#1a56db",
          light: "#ffffff",
        },
        ...options,
      });

      // CẬP NHẬT VÀO DATABASE
      group.qrCode = newQRData;
      await group.save();

      console.log("🔄 Đã cập nhật QR code cho group:", group.username);

      res.json({
        success: true,
        message: "QR code đã được cập nhật thành công",
        data: {
          qrDataURL: newQRData.dataURL,
          updatedBy: isAdmin ? "admin" : "owner",
          // ❌ BỎ: info: QRService.getQRInfo(newQRData)
        },
      });
    } catch (error) {
      console.error("Error updating group QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật QR code",
        error: error.message,
      });
    }
  }

  async GetViolationGroupByID(req, res) {
    try {
      const { groupId } = req.params;

      const viodations = await Violation.find({
        targetId: groupId,
        status: { $ne: "pending" },
      })
        .populate("reportedBy", "username fullName avatar")
        .populate("userId", "username fullName avatar")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        violations: viodations,
        message: "Lấy violation group thành công",
      });
    } catch (err) {
      console.error("Lỗi khi lấy violation group:", err);
    }
  }

  // ==================== THỐNG KÊ NHÓM ====================

  /**
   * Thống kê tổng quan của nhóm (dashboard)
   */
  async getGroupStatistics(req, res) {
    try {
      const { groupId } = req.params;
      console.log("📊 Lấy thống kê cho nhóm:", groupId);

      const group = await Group.findById(groupId);

      const userId = req.user.userId;

      const userRole = req.user.role;

      // Kiểm tra quyền owner/moderator
      const member = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        status: "active",
      }).populate("userId", "username fullName avatar role");

      if (!member || !["owner", "moderator"].includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: "Chỉ owner và moderator mới có quyền xem thống kê",
          error: "no_permission",
        });
      }

      // 1. Thống kê thành viên
      const memberStats = await GroupMember.aggregate([
        { $match: { groupId: group._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // 2. Thống kê bài viết theo thời gian
      const today = new Date();
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay() + 1)
      );
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      const postStats = await Post.aggregate([
        { $match: { groupId: group._id, isBlocked: false } },
        {
          $facet: {
            totalPosts: [{ $count: "count" }],
            weeklyPosts: [
              { $match: { createdAt: { $gte: startOfWeek } } },
              { $count: "count" },
            ],
            monthlyPosts: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $count: "count" },
            ],
            yearlyPosts: [
              { $match: { createdAt: { $gte: startOfYear } } },
              { $count: "count" },
            ],
            postsByDay: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: -1 } },
              { $limit: 30 },
            ],
          },
        },
      ]);

      // 3. Thống kê tương tác (likes, comments)
      const interactionStats = await Post.aggregate([
        { $match: { groupId: group._id } },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: "$likeCount" },
            totalComments: { $sum: "$commentCount" },
            avgLikes: { $avg: "$likeCount" },
            avgComments: { $avg: "$commentCount" },
            postCount: { $sum: 1 },
          },
        },
      ]);

      // 4. Thống kê tác giả tích cực nhất
      const topAuthors = await Post.aggregate([
        { $match: { groupId: group._id, isBlocked: false } },
        {
          $group: {
            _id: "$userCreateID",
            postCount: { $sum: 1 },
            totalLikes: { $sum: "$likeCount" },
            totalComments: { $sum: "$commentCount" },
          },
        },
        { $sort: { postCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            userId: "$_id",
            username: "$user.username",
            fullName: "$user.fullName",
            avatar: "$user.avatar",
            postCount: 1,
            totalLikes: 1,
            totalComments: 1,
          },
        },
      ]);

      // 5. Thống kê bài viết phổ biến nhất
      const topPosts = await Post.find({ groupId: group._id, isBlocked: false })
        .sort({ likeCount: -1, commentCount: -1 })
        .limit(5)
        .populate("userCreateID", "username fullName avatar")
        .select("content likeCount commentCount createdAt");

      // 6. Thống kê theo cảm xúc (tags)
      const emotionStats = await Post.aggregate([
        { $match: { groupId: group._id, isBlocked: false } },
        { $unwind: "$emotions" },
        {
          $group: {
            _id: "$emotions",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // 7. Thống kê báo cáo vi phạm
      const violationStats = await Violation.aggregate([
        { $match: { targetId: group._id, targetType: "Group" } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // 8. Thống kê tăng trưởng thành viên
      const growthStats = await GroupMember.aggregate([
        { $match: { groupId: group._id, status: "active" } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$joinedAt" },
            },
            newMembers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]);

      // 9. Thời gian hoạt động cao điểm
      const activityByHour = await Post.aggregate([
        { $match: { groupId: group._id } },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        statistics: {
          overview: {
            memberCount: group.memberCount,
            postCount: postStats[0]?.totalPosts[0]?.count || 0,
            weeklyGrowth: postStats[0]?.weeklyPosts[0]?.count || 0,
            monthlyGrowth: postStats[0]?.monthlyPosts[0]?.count || 0,
            creationDate: group.createdAt,
            lastActivity: group.updatedAt,
          },
          members: {
            total: group.memberCount,
            byStatus: memberStats.reduce((acc, stat) => {
              acc[stat._id] = stat.count;
              return acc;
            }, {}),
            growth: growthStats,
          },
          posts: {
            total: postStats[0]?.totalPosts[0]?.count || 0,
            weekly: postStats[0]?.weeklyPosts[0]?.count || 0,
            monthly: postStats[0]?.monthlyPosts[0]?.count || 0,
            yearly: postStats[0]?.yearlyPosts[0]?.count || 0,
            dailyTrend: postStats[0]?.postsByDay || [],
          },
          interactions: interactionStats[0] || {
            totalLikes: 0,
            totalComments: 0,
            avgLikes: 0,
            avgComments: 0,
            postCount: 0,
          },
          topAuthors,
          topPosts,
          emotions: emotionStats,
          violations: violationStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          activityPatterns: {
            byHour: activityByHour,
            peakHour: activityByHour.reduce(
              (max, hour) => (hour.count > max.count ? hour : max),
              { _id: 0, count: 0 }
            ),
          },
        },
      });
    } catch (err) {
      console.error("Lỗi khi lấy thống kê nhóm:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê nhóm: " + err.message,
        error: err.message,
      });
    }
  }

  /**
   * Thống kê chi tiết về thành viên
   */
  async getMemberAnalytics(req, res) {
    try {
      const { groupId } = req.params;

      const group = await Group.findById(groupId);
      const userId = req.user.userId;

      // Kiểm tra quyền
      const member = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        status: "active",
      }).populate("userId", "username fullName avatar role");

      if (!member || !["owner", "moderator"].includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền xem thống kê thành viên",
          error: "no_permission",
        });
      }

      // 1. Thống kê thành viên mới theo thời gian
      const memberTimeline = await GroupMember.aggregate([
        { $match: { groupId: group._id, status: "active" } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$joinedAt" },
            },
            newMembers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]);

      // 2. Phân bố vai trò
      const roleDistribution = await GroupMember.aggregate([
        { $match: { groupId: group._id, status: "active" } },

        // 1. Chỉ group + đếm
        {
          $group: {
            // nhóm theo vai trò
            _id: "$role",
            count: { $sum: 1 },
          },
        },

        // 2. Tính percentage ở $project
        {
          $project: {
            // chọn trường để hiển thị
            role: "$_id",
            count: 1,
            percentage: {
              $round: [
                {
                  $multiply: [{ $divide: ["$count", group.memberCount] }, 100], // tính phần trăm
                },
                2,
              ],
            },
            _id: 0,
          },
        },
      ]);

      // 3. Thành viên tích cực nhất (dựa trên bài viết)
      const activeMembers = await Post.aggregate([
        { $match: { groupId: group._id, isBlocked: false } }, // chỉ bài viết không bị chặn
        {
          $group: {
            // nhóm theo user tạo bài viết
            _id: "$userCreateID", // userId
            postCount: { $sum: 1 }, // tổng số bài viết
            totalLikesReceived: { $sum: "$likeCount" }, // tổng like nhận được
            totalCommentsReceived: { $sum: "$commentCount" }, // tổng comment nhận được
            lastActivity: { $max: "$createdAt" }, // thời gian hoạt động cuối cùng
          },
        },
        { $sort: { postCount: -1 } }, // sắp xếp theo postCount giảm dần
        { $limit: 20 }, // lấy top 20
        {
          $lookup: {
            // lấy thông tin user
            from: "users", // bảng users
            localField: "_id", // userId
            foreignField: "_id", // bảng users _id
            as: "user", // đặt tên kết quả là user
          },
        },
        { $unwind: "$user" }, // tách mảng user
        {
          $lookup: {
            // lấy thông tin vai trò trong nhóm
            from: "groupmembers",
            let: { userId: "$_id", groupId: group._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$groupId", "$$groupId"] },
                    ],
                  },
                },
              },
            ],
            as: "groupMember",
          },
        },
        { $unwind: "$groupMember" }, // tách mảng groupMember
        {
          $project: {
            // chọn trường để hiển thị
            userId: "$_id", // userId
            username: "$user.username",
            fullName: "$user.fullName",
            avatar: "$user.profile.avatar",
            role: "$groupMember.role",
            joinedAt: "$groupMember.joinedAt",
            postCount: 1,
            totalLikesReceived: 1,
            totalCommentsReceived: 1,
            lastActivity: 1,
            activityScore: {
              // tính điểm hoạt động
              $add: [
                { $multiply: ["$postCount", 3] }, // mỗi bài viết 3 điểm
                { $multiply: ["$totalLikesReceived", 1] }, // mỗi like 1 điểm
                { $multiply: ["$totalCommentsReceived", 2] }, // mỗi comment 2 điểm
              ],
            },
          },
        },
        { $sort: { activityScore: -1 } }, // sắp xếp theo activityScore giảm dần
      ]);

      // 4. Thành viên mới nhất
      const recentMembers = await GroupMember.find({
        groupId: group._id,
        status: "active",
      })
        .sort({ joinedAt: -1 })
        .limit(10)
        .populate("userId", "username fullName profile.avatar lastSeen");

      // 5. Tỷ lệ giữ chân thành viên (theo tháng) tính toán bằng (tổng active / tổng joined)
      const retentionStats = await GroupMember.aggregate([
        { $match: { groupId: group._id } },
        {
          $group: {
            // nhóm theo tháng năm khi tham gia
            _id: {
              $dateToString: { format: "%m-%Y", date: "$joinedAt" }, // tháng-năm
            },
            joined: { $sum: 1 }, // tổng thành viên tham gia trong tháng
            active: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0], // tổng thành viên còn active
              },
            },
          },
        },
        { $sort: { _id: -1 } }, // mới nhất trước
        { $limit: 12 }, // 12 tháng gần nhất
        {
          $project: {
            month: "$_id", // tháng-năm
            joined: 1, // tổng thành viên tham gia
            active: 1, // tổng thành viên active
            retentionRate: {
              $multiply: [{ $divide: ["$active", "$joined"] }, 100], // tỷ lệ giữ chân
            },
          },
        },
      ]);

      res.json({
        success: true,
        analytics: {
          timeline: memberTimeline,
          roleDistribution,
          activeMembers,
          recentMembers,
          retentionStats,
          summary: {
            totalMembers: group.memberCount,
            activeMembers: activeMembers.length,
            newMembersThisMonth: memberTimeline
              .filter((m) => {
                const date = new Date(m._id);
                const now = new Date();
                return (
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear()
                );
              })
              .reduce((sum, m) => sum + m.newMembers, 0),
            avgActivityScore:
              activeMembers.length > 0
                ? activeMembers.reduce((sum, m) => sum + m.activityScore, 0) /
                  activeMembers.length
                : 0,
          },
        },
      });
    } catch (err) {
      console.error("Lỗi khi lấy thống kê thành viên:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê thành viên: " + err.message,
        error: err.message,
      });
    }
  }

  /**
   * Thống kê về nội dung và tương tác
   */
  async getContentAnalytics(req, res) {
    try {
      const { groupId } = req.params;

      const group = await Group.findById(groupId);
      const userId = req.user.userId;
      const { period = "month" } = req.query; // day, week, month, year
      const userRole = req.user.role;

      // Kiểm tra quyền
      const member = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        status: "active",
      }).populate("userId", "username fullName avatar role");

      if (!member || !["owner", "moderator"].includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền xem thống kê nội dung",
          error: "no_permission",
        });
      }

      // Tính toán khoảng thời gian
      const now = new Date();
      let startDate;
      switch (period) {
        case "day":
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      // 1. Thống kê bài viết theo loại
      const postTypes = await Post.aggregate([
        {
          $match: {
            groupId: group._id,
            createdAt: { $gte: startDate },
            isBlocked: false,
          },
        },

        // === BƯỚC 1: CHUẨN HÓA DATA ===
        {
          $project: {
            hasFiles: {
              $gt: [
                {
                  $size: {
                    $ifNull: ["$files", []],
                  },
                },
                0,
              ],
            },
            hasContent: {
              $gt: [
                {
                  $strLenCP: {
                    $ifNull: ["$content", ""],
                  },
                },
                0,
              ],
            },
            fileTypes: {
              $map: {
                input: { $ifNull: ["$files", []] },
                as: "file",
                in: "$$file.type",
              },
            },
          },
        },

        // === BƯỚC 2: PHÂN TÍCH ===
        {
          $facet: {
            // Có media hay không
            byMediaType: [
              {
                $group: {
                  _id: "$hasFiles",
                  count: { $sum: 1 },
                },
              },
            ],

            // Loại nội dung
            byContentType: [
              {
                $group: {
                  _id: {
                    $cond: [
                      { $and: ["$hasFiles", "$hasContent"] },
                      "mixed",
                      {
                        $cond: [
                          "$hasFiles",
                          "media_only",
                          {
                            $cond: ["$hasContent", "text_only", "empty"],
                          },
                        ],
                      },
                    ],
                  },
                  count: { $sum: 1 },
                },
              },
            ],

            // Phân loại file
            fileTypeDistribution: [
              { $unwind: "$fileTypes" },
              {
                $group: {
                  _id: "$fileTypes",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]);

      // 2. Phân tích tương tác
      const interactionAnalysis = await Post.aggregate([
        {
          $match: {
            groupId: group._id,
            createdAt: { $gte: startDate },
            isBlocked: false,
          },
        },
        {
          $project: {
            likesPerPost: { $divide: ["$likeCount", 1] },
            commentsPerPost: { $divide: ["$commentCount", 1] },
            engagementRate: {
              $cond: [
                { $gt: ["$likeCount", 0] },
                { $divide: [{ $add: ["$likeCount", "$commentCount"] }, 1] },
                0,
              ],
            },
            hourOfDay: { $hour: "$createdAt" },
            dayOfWeek: { $dayOfWeek: "$createdAt" },
          },
        },
        {
          $group: {
            _id: null,
            avgLikes: { $avg: "$likesPerPost" },
            avgComments: { $avg: "$commentsPerPost" },
            avgEngagement: { $avg: "$engagementRate" },
            topHours: {
              $push: {
                hour: "$hourOfDay",
                engagement: "$engagementRate",
              },
            },
            topDays: {
              $push: {
                day: "$dayOfWeek",
                engagement: "$engagementRate",
              },
            },
          },
        },
      ]);

      // 3. Phân tích cảm xúc
      const emotionAnalysis = await Post.aggregate([
        {
          $match: {
            groupId: group._id,
            createdAt: { $gte: startDate },
            isBlocked: false,
            emotions: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$emotions" },
        {
          $group: {
            _id: "$emotions",
            count: { $sum: 1 },
            avgLikes: { $avg: "$likeCount" },
            avgComments: { $avg: "$commentCount" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // 4. Phân tích tags
      const tagAnalysis = await Post.aggregate([
        {
          $match: {
            groupId: group._id,
            createdAt: { $gte: startDate },
            isBlocked: false,
            tags: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$tags" },
        {
          $group: {
            _id: "$tags",
            count: { $sum: 1 },
            avgLikes: { $avg: "$likeCount" },
            avgComments: { $avg: "$commentCount" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]);

      // 5. Xu hướng theo thời gian
      const timeTrends = await Post.aggregate([
        {
          $match: {
            groupId: group._id,
            createdAt: { $gte: startDate },
            isBlocked: false,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            postCount: { $sum: 1 },
            totalLikes: { $sum: "$likeCount" },
            totalComments: { $sum: "$commentCount" },
            avgEngagement: {
              $avg: { $add: ["$likeCount", "$commentCount"] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        period,
        analytics: {
          postTypes: postTypes[0],
          interactions: interactionAnalysis[0] || {},
          emotions: emotionAnalysis,
          tags: tagAnalysis,
          trends: timeTrends,
          summary: {
            totalPostsAnalyzed: timeTrends.reduce(
              (sum, day) => sum + day.postCount,
              0
            ),
            totalLikes: timeTrends.reduce(
              (sum, day) => sum + day.totalLikes,
              0
            ),
            totalComments: timeTrends.reduce(
              (sum, day) => sum + day.totalComments,
              0
            ),
            avgDailyPosts:
              timeTrends.length > 0
                ? timeTrends.reduce((sum, day) => sum + day.postCount, 0) /
                  timeTrends.length
                : 0,
            mostActiveHour: interactionAnalysis[0]?.topHours?.reduce(
              (max, hour) => (hour.engagement > max.engagement ? hour : max),
              { hour: 0, engagement: 0 }
            ) || { hour: 0, engagement: 0 },
          },
        },
      });
    } catch (err) {
      console.error("Lỗi khi lấy thống kê nội dung:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê nội dung: " + err.message,
        error: err.message,
      });
    }
  }

  /**
   * Xuất báo cáo thống kê (PDF/Excel)
   */
  async exportGroupReport(req, res) {
    try {
      const { groupId } = req.params;

      const group = await Group.findById(groupId);
      const userId = req.user.userId;
      const { format = "pdf", period = "month" } = req.query;
      const userRole = req.user.role;

      // Kiểm tra quyền
      const member = await GroupMember.findOne({
        groupId: group._id,
        userId: userId,
        status: "active",
      }).populate("userId", "username fullName avatar role");

      if (!member || !["owner", "moderator"].includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền xuất báo cáo",
          error: "no_permission",
        });
      }

      // Lấy dữ liệu thống kê
      const stats = await this.getGroupStatistics(req, res, true);
      const memberAnalytics = await this.getMemberAnalytics(req, res, true);
      const contentAnalytics = await this.getContentAnalytics(req, res, true);

      // Tạo báo cáo
      const report = {
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          visibility: group.visibility,
          createdAt: group.createdAt,
          memberCount: group.memberCount,
        },
        generatedAt: new Date(),
        generatedBy: userId,
        period,
        statistics: stats,
        memberAnalytics,
        contentAnalytics,
      };

      // TODO: Thực hiện xuất file PDF/Excel
      // Đây là nơi bạn sẽ tích hợp với thư viện như pdfkit, exceljs, etc.

      if (format === "pdf") {
        // Xuất PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="group-report-${group._id}-${Date.now()}.pdf"`
        );
        // Trả về file PDF (cần implement)
        return res.json({
          success: true,
          message: "PDF export not implemented yet",
          report,
        });
      } else if (format === "excel") {
        // Xuất Excel
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="group-report-${group._id}-${Date.now()}.xlsx"`
        );
        // Trả về file Excel (cần implement)
        return res.json({
          success: true,
          message: "Excel export not implemented yet",
          report,
        });
      } else {
        // Trả về JSON
        res.json({
          success: true,
          message: "Báo cáo thống kê",
          report,
        });
      }
    } catch (err) {
      console.error("Lỗi khi xuất báo cáo:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xuất báo cáo: " + err.message,
        error: err.message,
      });
    }
  }

  /**
   * Thống kê đơn giản cho thành viên bình thường
   */
  async getPublicStatistics(req, res) {
    try {
      const { groupId } = req.params;

      const group = await Group.findById(groupId);

      // Chỉ hiển thị thống kê công khai
      const publicStats = {
        overview: {
          memberCount: group.memberCount,
          createdAt: group.createdAt,
          visibility: group.visibility,
          category: group.category,
        },
        recentActivity: {
          // Lấy 10 bài viết gần nhất
          recentPosts: await Post.find({ groupId: group._id, isBlocked: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("content createdAt likeCount commentCount")
            .populate("userCreateID", "username profile.avatar"),
          // Top contributors
          topContributors: await Post.aggregate([
            { $match: { groupId: group._id, isBlocked: false } },
            {
              $group: {
                _id: "$userCreateID",
                postCount: { $sum: 1 },
              },
            },
            { $sort: { postCount: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                username: "$user.username",
                avatar: "$user.avatar",
                postCount: 1,
              },
            },
          ]),
        },
        engagement: {
          // Tính tổng tương tác
          totalPosts: await Post.countDocuments({
            groupId: group._id,
            isBlocked: false,
          }),
          totalLikes: await Post.aggregate([
            { $match: { groupId: group._id, isBlocked: false } },
            { $group: { _id: null, total: { $sum: "$likeCount" } } },
          ]).then((result) => result[0]?.total || 0),
          totalComments: await Post.aggregate([
            { $match: { groupId: group._id, isBlocked: false } },
            { $group: { _id: null, total: { $sum: "$commentCount" } } },
          ]).then((result) => result[0]?.total || 0),
        },
      };

      res.json({
        success: true,
        statistics: publicStats,
      });
    } catch (err) {
      console.error("Lỗi khi lấy thống kê công khai:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê công khai: " + err.message,
        error: err.message,
      });
    }
  }
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

module.exports = new GroupController();
