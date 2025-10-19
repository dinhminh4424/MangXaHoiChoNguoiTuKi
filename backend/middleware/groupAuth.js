// middleware/groupAuth.js
const Group = require("../models/Group");
const GroupMember = require("../models/GroupMember");

exports.ensureGroupExists = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId || req.query.groupId;
    if (!groupId)
      return res.status(400).json({
        success: false,
        message: "Không nhận được ID nhóm",
        error: "missing_groupId",
      });

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại",
        error: "group_not_found",
      });

    req.group = group;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
      error: "server_error",
    });
  }
};

exports.ensureMemberOrPublic = async (req, res, next) => {
  try {
    const group = req.group;
    if (group.visibility === "public") return next();

    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Yêu cầu đăng nhập",
        error: "auth_required",
      });

    const mem = await GroupMember.findOne({
      groupId: group._id,
      userId,
      status: "active",
    });

    if (!mem) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải là thành viên của nhóm này",
        error: "not_a_member",
      });
    }

    req.groupMember = mem;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
      error: "server_error",
    });
  }
};

exports.ensureCanPost = async (req, res, next) => {
  try {
    const group = req.group;
    if (group.visibility === "public") return next();

    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Yêu cầu đăng nhập",
        error: "auth_required",
      });

    const mem = await GroupMember.findOne({
      groupId: group._id,
      userId,
      status: "active",
    });

    if (!mem)
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền đăng bài trong nhóm này",
        error: "not_a_member",
      });

    req.groupMember = mem;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "server_error",
    });
  }
};

exports.ensureGroupAdmin = async (req, res, next) => {
  try {
    const group = req.group;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Yêu cầu đăng nhập",
        error: "auth_required",
      });

    const mem = await GroupMember.findOne({
      groupId: group._id,
      userId,
      status: "active",
    });

    if (!mem || !["owner", "moderator"].includes(mem.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền quản trị nhóm",
        error: "not_admin",
      });
    }

    req.groupMember = mem;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
      error: "server_error",
    });
  }
};

exports.ensureGroupOwner = async (req, res, next) => {
  try {
    const group = req.group;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Yêu cầu đăng nhập",
        error: "auth_required",
      });

    const mem = await GroupMember.findOne({
      groupId: group._id,
      userId,
      role: "owner",
      status: "active",
    });

    if (!mem) {
      return res.status(403).json({
        success: false,
        message: "Chỉ chủ nhóm mới có quyền này",
        error: "not_owner",
      });
    }

    req.groupMember = mem;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
      error: "server_error",
    });
  }
};
