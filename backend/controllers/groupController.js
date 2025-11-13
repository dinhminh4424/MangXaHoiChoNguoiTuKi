const Group = require("../models/Group");
const GroupMember = require("../models/GroupMember");
const Post = require("../models/Post");
const User = require("../models/User");
const FileManager = require("../utils/fileManager");
const Violation = require("../models/Violation");
const mailService = require("../services/mailService");
const NotificationService = require("../services/notificationService");

class GroupController {
  async createGroup(req, res) {
    try {
      const { name, description, visibility, tags, emotionTags, category } =
        req.body;
      const owner = req.user.userId;

      const checkUser = await User.findById(owner);
      if (!checkUser.profile.idCard.verified) {
        res.status(400).json({
          success: false,
          message: "Bạn chưa Xác Minh Danh tính" + err.message,
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

      const {
        name,
        description,
        visibility,
        tags,
        emotionTags,
        avatar,
        category,
      } = req.body;

      // Cập nhật các trường
      if (name) group.name = name;
      if (description !== undefined) group.description = description;
      if (visibility) group.visibility = visibility;
      if (tags) group.tags = tags;
      if (emotionTags) group.emotionTags = emotionTags;
      if (avatar) group.avatar = avatar;
      if (category) group.category = category;

      // Tạo slug mới nếu tên thay đổi
      if (name && name !== group.name) {
        group.slug =
          name.toLowerCase().replace(/\s+/g, "-") +
          "-" +
          Date.now().toString().slice(-4);
      }

      await group.save();

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
          return res.status(400).json({
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

      const query = { groupId: group._id, status };
      if (role) query.role = role;

      const members = await GroupMember.find(query)
        .populate("userId", "username fullName avatar")
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
          { description: { $regex: search, $options: "i" } },
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
        .skip(skip);

      const total = await Group.countDocuments(query);

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
