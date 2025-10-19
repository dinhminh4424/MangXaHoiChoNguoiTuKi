// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const upload = require("../middleware/upload");

const groupController = require("../controllers/groupController");

// Các routes không cần auth
router.get("/", groupController.getAllGroups); // Lấy tất cả groups
router.get("/popular", groupController.getPopularGroups); // Groups phổ biến
router.get("/search", groupController.searchGroups); // Tìm kiếm groups

// Các routes cần auth
router.use(authenticate);

router.get("/recommendations", groupController.getRecommendedGroups); // Groups đề xuất
router.get("/user/my-groups", groupController.getUserGroups); // Groups của user

// Tạo nhóm
router.post(
  "/",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  groupController.createGroup
);

// Các routes với groupId
const {
  ensureGroupExists,
  ensureMemberOrPublic,
  ensureCanPost,
  ensureGroupAdmin,
  ensureGroupOwner,
} = require("../middleware/groupAuth");

// Lấy thông tin nhóm
router.get("/:groupId", ensureGroupExists, groupController.infoGroup);

// Cập nhật thông tin nhóm
router.put(
  "/:groupId",
  ensureGroupExists,
  ensureGroupAdmin,
  groupController.updateGroup
);

// Xóa nhóm
router.delete(
  "/:groupId",
  ensureGroupExists,
  ensureGroupOwner,
  groupController.deleteGroup
);

// Tham gia nhóm
router.post("/:groupId/join", ensureGroupExists, groupController.joinGroup);

// Rời nhóm
router.post("/:groupId/leave", ensureGroupExists, groupController.leaveGroup);

// Mời user
router.post(
  "/:groupId/invite",
  ensureGroupExists,
  ensureGroupAdmin,
  groupController.inviteUser
);

// Đăng bài trong nhóm
router.post(
  "/:groupId/post",
  upload.array("files"),
  ensureGroupExists,
  ensureCanPost,
  groupController.postGroup
);

// Lấy feed nhóm
router.get(
  "/:groupId/feed",
  ensureGroupExists,
  ensureMemberOrPublic,
  groupController.getFeedGroup
);

// Lấy danh sách thành viên
router.get(
  "/:groupId/members",
  ensureGroupExists,
  ensureMemberOrPublic,
  groupController.getMembers
);

// Quản lý thành viên
router.post(
  "/:groupId/members/manage",
  ensureGroupExists,
  ensureGroupAdmin,
  groupController.manageMember
);

// Chuyển quyền owner
router.post(
  "/:groupId/transfer-ownership",
  ensureGroupExists,
  ensureGroupOwner,
  groupController.transferOwnership
);

// Quản lý moderator
router.post(
  "/:groupId/moderators",
  ensureGroupExists,
  ensureGroupOwner,
  groupController.manageModerator
);

module.exports = router;
