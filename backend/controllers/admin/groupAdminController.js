const User = require("../../models/User");
const Post = require("../../models/Post");
const Journal = require("../../models/Journal");
const Group = require("../../models/Group");
const Comment = require("../../models/Comment");
const Notification = require("../../models/Notification");
const AuditLog = require("../../models/AuditLog");

const Violation = require("../../models/Violation");

const GroupMember = require("../../models/GroupMember");
const FileManager = require("../../utils/fileManager"); // Import FileManager utility

const GroupDeletionService = require("../../services/GroupDeletionService");

// Quản lý nhóm
const getAllGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      visibility = "",
      status = "",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Tạo filter
    const filter = {};

    // Tìm kiếm
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Lọc theo category
    if (category) {
      filter.category = { $in: [category] };
    }

    // Lọc theo visibility
    if (visibility) {
      filter.visibility = visibility;
    }

    // Lọc theo trạng thái
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }

    // Lọc theo ngày
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Sắp xếp
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate("owner", "username email profile.avatar")
        .populate("moderators", "username email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Group.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all groups error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách nhóm",
    });
  }
};

const getGroupStats = async (req, res) => {
  try {
    const [
      totalGroups,
      activeGroups,
      publicGroups,
      privateGroups,
      totalMembers,
      groupsWithReports,
      totalReports,
    ] = await Promise.all([
      Group.countDocuments(),
      Group.countDocuments({ active: true }),
      Group.countDocuments({ visibility: "public" }),
      Group.countDocuments({ visibility: "private" }),
      GroupMember.countDocuments({ status: "active" }),
      Group.countDocuments({ reportCount: { $gt: 0 } }),
      Group.aggregate([
        { $group: { _id: null, total: { $sum: "$reportCount" } } },
      ]),
    ]);

    // Phân bố theo category
    const categoryDistribution = await Group.aggregate([
      { $unwind: "$category" },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Phân bố theo visibility
    const visibilityDistribution = await Group.aggregate([
      { $group: { _id: "$visibility", count: { $sum: 1 } } },
    ]);

    // Top groups by members
    const topGroupsByMembers = await Group.find()
      .sort({ memberCount: -1 })
      .limit(10)
      .select("name memberCount visibility active");

    // Thống kê tháng này
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newGroupsThisMonth = await Group.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Thống kê tháng trước
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const endOfLastMonth = new Date(startOfMonth);
    endOfLastMonth.setDate(0);

    const newGroupsLastMonth = await Group.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const growthRate = newGroupsLastMonth
      ? ((newGroupsThisMonth - newGroupsLastMonth) / newGroupsLastMonth) * 100
      : newGroupsThisMonth > 0
      ? 100
      : 0;

    // Avg members per group
    const avgMembersResult = await Group.aggregate([
      { $group: { _id: null, avg: { $avg: "$memberCount" } } },
    ]);
    const avgMembersPerGroup = avgMembersResult[0]?.avg || 0;

    res.json({
      success: true,
      data: {
        totalGroups,
        activeGroups,
        publicGroups,
        privateGroups,
        totalMembers,
        groupsWithReports,
        totalReports: totalReports[0]?.total || 0,
        categoryDistribution: categoryDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        visibilityDistribution: visibilityDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        topGroupsByMembers,
        newGroupsThisMonth,
        growthRate: Math.round(growthRate * 100) / 100,
        avgMembersPerGroup: Math.round(avgMembersPerGroup * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Get group stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê nhóm",
    });
  }
};

const createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      visibility = "private",
      category = ["all"],
      tags = [],
      emotionTags = [],
    } = req.body;

    // Kiểm tra nhóm đã tồn tại
    const existingGroup = await Group.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Tên nhóm đã tồn tại",
      });
    }

    if (req.files) {
      // Multer lưu file theo tên field → req.files['fieldName'] là mảng
      if (req.files.avatar && req.files.avatar[0]) {
        avatarUrl = `/api/uploads/images/${req.files.avatar[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        coverPhotoUrl = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
      }
    }

    // Xử lý file upload
    let avatar = req.files?.avatar ? req.files.avatar[0].path : "";
    let coverPhoto = req.files?.coverPhoto ? req.files.coverPhoto[0].path : "";

    if (req.files) {
      // Multer lưu file theo tên field → req.files['fieldName'] là mảng
      if (req.files.avatar && req.files.avatar[0]) {
        avatar = `/api/uploads/images/${req.files.avatar[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        coverPhoto = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
      }
    }

    // Xử lý mảng category, tags, emotionTags
    const categoryArray = Array.isArray(category) ? category : [category];
    const tagsArray = Array.isArray(tags)
      ? tags
      : tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
    const emotionTagsArray = Array.isArray(emotionTags)
      ? emotionTags
      : emotionTags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);

    const group = new Group({
      name,
      description,
      visibility,
      category: categoryArray,
      tags: tagsArray,
      emotionTags: emotionTagsArray,
      avatar,
      coverPhoto,
      owner: req.user.userId,
      moderators: [req.user.userId],
    });

    await group.save();

    // Tạo group member cho owner
    const groupMember = new GroupMember({
      groupId: group._id,
      userId: req.user.userId,
      role: "owner",
      status: "active",
    });

    await groupMember.save();

    // Cập nhật memberCount
    group.memberCount = 1;
    await group.save();

    res.status(201).json({
      success: true,
      data: { group },
      message: "Tạo nhóm thành công",
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo nhóm",
    });
  }
};

const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate("owner", "username email profile.avatar fullName")
      .populate("moderators", "username email profile.avatar");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Lấy thống kê của group
    const [membersCount, postsCount] = await Promise.all([
      GroupMember.countDocuments({ groupId, status: "active" }),
      Post.countDocuments({ groupId }),
    ]);

    res.json({
      success: true,
      data: {
        group,
        stats: {
          membersCount,
          postsCount,
        },
      },
    });
  } catch (error) {
    console.error("Get group by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin nhóm",
    });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      name,
      description,
      visibility,
      category,
      tags,
      emotionTags,
      active,
    } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Kiểm tra trùng tên
    if (name && name !== group.name) {
      const existingGroup = await Group.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: groupId },
      });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm đã tồn tại",
        });
      }
    }

    // Xử lý file upload
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (visibility) updateData.visibility = visibility;
    if (active !== undefined) updateData.active = active;

    // Xử lý mảng
    if (category) {
      updateData.category = Array.isArray(category) ? category : [category];
    }
    if (tags) {
      updateData.tags = Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
    }
    if (emotionTags) {
      updateData.emotionTags = Array.isArray(emotionTags)
        ? emotionTags
        : emotionTags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
    }

    // Xử lý file upload nếu có
    // if (req.files?.avatar) {
    //   updateData.avatar = req.files.avatar[0].path;
    // }
    // if (req.files?.coverPhoto) {
    //   updateData.coverPhoto = req.files.coverPhoto[0].path;
    // }

    if (req.files) {
      // Multer lưu file theo tên field → req.files['fieldName'] là mảng
      if (req.files.avatar && req.files.avatar[0]) {
        updateData.avatar = `/api/uploads/images/${req.files.avatar[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        updateData.coverPhoto = `/api/uploads/images/${req.files.coverPhoto[0].filename}`;
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "username email profile.avatar")
      .populate("moderators", "username email");

    res.json({
      success: true,
      data: { group: updatedGroup },
      message: "Cập nhật nhóm thành công",
    });
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật nhóm",
    });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20, role = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    const filter = { groupId };
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [members, total] = await Promise.all([
      GroupMember.find(filter)
        .populate("userId", "username email profile.avatar fullName")
        .populate("invitedBy", "username")
        .sort({ joinedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      GroupMember.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get group members error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thành viên",
    });
  }
};

const updateGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role, status } = req.body;

    const groupMember = await GroupMember.findOne({
      _id: memberId,
      groupId,
    });

    if (!groupMember) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thành viên",
      });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedMember = await GroupMember.findByIdAndUpdate(
      memberId,
      updateData,
      { new: true }
    ).populate("userId", "username email profile.avatar");

    res.json({
      success: true,
      data: { member: updatedMember },
      message: "Cập nhật thành viên thành công",
    });
  } catch (error) {
    console.error("Update group member error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thành viên",
    });
  }
};

// Lấy các report Group
const getGroupViolation = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      dateFrom = "",
      dateTo = "",
      search = "",
      reportId = "",
      id = "",
    } = req.query;

    const skip = limit * (page - 1);

    const filter = { targetType: "Group" };

    if (status !== "all") {
      filter.status = status;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { reason: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      );
    }

    if (reportId) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: reportId,
            options: "i",
          },
        },
      });
    }

    if (id) {
      searchConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$targetId" },
            regex: id,
            options: "i",
          },
        },
      });
    }

    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }

    const [reportsGroup, total] = await Promise.all([
      Violation.find(filter)
        .populate("reportedBy", "username email profile.avatar")
        .populate("targetId", "name description avatar memberCount visibility")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Violation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reportsGroup,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo nhóm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy báo cáo nhóm",
    });
  }
};

// Cập nhật violation Group
const updateViolationGroupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken = "warning", reviewedAt } = req.body;

    const violation = await Violation.findById(id)
      .populate("reportedBy", "username email profile.avatar")
      .populate("targetId", "name owner memberCount")
      .populate("userId", "username email fullName");

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo cáo",
      });
    }

    const updatedViolation = await Violation.findByIdAndUpdate(
      id,
      {
        status,
        actionTaken,
        reviewedAt,
        reviewedBy: req.user.userId,
      },
      { new: true }
    )
      .populate("reportedBy", "username email profile.avatar")
      .populate("targetId", "name owner memberCount");

    const group = await Group.findById(violation.targetId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm liên quan",
      });
    }

    // Thông báo real-time dựa trên action
    if (actionTaken === "block_group") {
      await Group.findByIdAndUpdate(violation.targetId, {
        active: false,
      });

      // Thông báo cho chủ nhóm
      await NotificationService.createAndEmitNotification({
        recipient: group.owner,
        sender: req.user._id,
        type: "GROUP_BLOCKED",
        title: "Nhóm đã bị chặn",
        message: `Nhóm "${group.name}" của bạn đã bị chặn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`,
        data: {
          violationId: violation._id,
          groupId: violation.targetId,
          reason: violation.reason,
          action: "blocked",
        },
        priority: "high",
        url: `/groups/${violation.targetId}`,
      });

      // Tăng lỗi cho chủ nhóm
      await AddViolationUserByID(
        group.owner,
        violation,
        req.user.userId,
        false
      );
    } else if (actionTaken === "warning") {
      // Tăng warning count cho group
      const updatedGroup = await Group.findByIdAndUpdate(
        violation.targetId,
        { $inc: { warningCount: 1 } },
        { new: true }
      );

      const newWarningCount = updatedGroup.warningCount || 0;

      // Nếu đạt >5 thì block group
      if (newWarningCount > 5) {
        await Group.findByIdAndUpdate(violation.targetId, {
          active: false,
        });
        await AddViolationUserByID(
          group.owner,
          violation,
          req.user.userId,
          false
        );
      }

      await NotificationService.createAndEmitNotification({
        recipient: group.owner,
        sender: req.user._id,
        type: newWarningCount >= 5 ? "GROUP_BLOCKED" : "GROUP_WARNED",
        title: newWarningCount >= 5 ? "Nhóm đã bị chặn" : "Cảnh báo nhóm",
        message:
          newWarningCount >= 5
            ? `Nhóm "${group.name}" của bạn đã bị chặn do vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}`
            : `Nhóm "${group.name}" của bạn nhận được cảnh báo vi phạm nguyên tắc cộng đồng. Lý do: ${violation.reason}. Số cảnh báo hiện tại: ${newWarningCount}`,
        data: {
          violationId: violation._id,
          groupId: violation.targetId,
          reason: violation.reason,
          action: newWarningCount >= 5 ? "blocked" : "warning",
        },
        priority: newWarningCount >= 5 ? "high" : "medium",
        url: `/groups/${violation.targetId}`,
      });
    }

    if (status === "rejected") {
      // Giảm report count nếu báo cáo bị từ chối
      let reportCount = group.reportCount || 1;
      group.reportCount = Math.max(reportCount - 1, 0);
      await group.save();
    }

    // Thông báo cho admin về việc xử lý hoàn tất
    await NotificationService.emitNotificationToAdmins({
      recipient: null,
      sender: req.user._id,
      type: "REPORT_RESOLVED",
      title: "Báo cáo nhóm đã được xử lý",
      message: `Báo cáo nhóm #${violation._id} đã được ${
        req.user.fullName || req.user.username
      } xử lý.`,
      data: {
        violationId: violation._id,
        actionTaken: actionTaken,
        resolvedBy: req.user._id,
      },
      priority: "medium",
      url: `/admin/reports/groups/${violation._id}`,
    });

    return res.status(200).json({
      success: true,
      data: updatedViolation,
      message: "Cập nhật trạng thái báo cáo nhóm thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật báo cáo nhóm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật báo cáo nhóm",
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
    } catch (err) {
      console.error("Lỗi khi cập nhật violation user:", err);
    }
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const deletedBy = req.user.userId;
    const userRole = req.user.role;

    // Sử dụng service để xoá hoàn toàn
    const result = await GroupDeletionService.deleteGroupCompletely(
      groupId,
      deletedBy,
      userRole,
      req
    );

    res.json({
      success: true,
      message: "Xóa group và tất cả dữ liệu liên quan thành công",
      data: result,
    });
  } catch (error) {
    console.error("Delete group error:", error);

    let statusCode = 500;
    let errorMessage = "Lỗi khi xóa group";

    if (error.message === "Không có quyền xóa group này") {
      statusCode = 403;
      errorMessage = error.message;
    } else if (error.message === "Group not found") {
      statusCode = 404;
      errorMessage = "Không tìm thấy group";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * RỜI NHÓM - User tự rời khỏi group
 */
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.user;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Kiểm tra user có trong group không
    const membership = await GroupMember.findOne({
      groupId: groupId,
      userId: userId,
    });
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: "Bạn không phải thành viên của nhóm này",
      });
    }

    // Không cho owner rời nhóm - phải chuyển quyền hoặc xoá group
    if (group.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message:
          "Chủ nhóm không thể rời nhóm. Hãy chuyển quyền chủ nhóm hoặc xóa nhóm.",
      });
    }

    // Xoá membership
    await GroupMember.deleteOne({ groupId: groupId, userId: userId });

    // Cập nhật memberCount
    await Group.findByIdAndUpdate(groupId, { $inc: { memberCount: -1 } });

    // Ghi log
    await AuditLog.create({
      actorId: userId,
      actorRole: req.user.role,
      action: "leave_group",
      target: {
        type: "Group",
        id: group._id,
        name: group.name,
      },
      ip: req.ip,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Đã rời nhóm thành công",
    });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi rời nhóm",
    });
  }
};

/**
 * SOFT DELETE - Ẩn group thay vì xoá hoàn toàn
 */
const softDeleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, role } = req.user;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Kiểm tra quyền
    const canDelete = await checkGroupDeletePermission(group, userId, role);
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền ẩn nhóm này",
      });
    }

    // Đánh dấu group bị ẩn
    await Group.findByIdAndUpdate(groupId, {
      active: false,
      deactivatedAt: new Date(),
      deactivatedBy: userId,
      deactivationReason: req.body.reason || "Vi phạm nguyên tắc cộng đồng",
    });

    // Ẩn tất cả posts trong group
    await Post.updateMany(
      { groupId: groupId },
      {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: `Nhóm "${group.name}" đã bị vô hiệu hóa`,
      }
    );

    // Ghi log
    await logGroupDeletion(group, userId);

    res.json({
      success: true,
      message: "Đã vô hiệu hóa nhóm thành công",
    });
  } catch (error) {
    console.error("Soft delete group error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi vô hiệu hóa nhóm",
    });
  }
};

module.exports = {
  // group
  updateGroupMember,
  getGroupMembers,
  deleteGroup,
  updateGroup,
  getGroupById,
  createGroup,
  getGroupStats,
  getAllGroups,
  getGroupViolation,
  updateViolationGroupStatus,

  leaveGroup,
  softDeleteGroup,
};
