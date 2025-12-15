// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const upload = require("../middleware/upload");

const groupController = require("../controllers/groupController");

// Các routes không cần auth

router.get("/popular", groupController.getPopularGroups); // Groups phổ biến
router.get("/search", groupController.searchGroups); // Tìm kiếm groups

// Các routes cần auth
router.use(authenticate);

router.get("/recommendations", groupController.getRecommendedGroups); // Groups đề xuất
router.get("/user/my-groups", groupController.getUserGroups); // Groups của user

router.get(
  "/:groupId/statistics",

  groupController.getGroupStatistics
);
router.get(
  "/:groupId/analytics/members",

  groupController.getMemberAnalytics
);
router.get(
  "/:groupId/analytics/content",

  groupController.getContentAnalytics
);
router.get(
  "/:groupId/report/export",

  groupController.exportGroupReport
);
router.get(
  "/:groupId/statistics/public",

  groupController.getPublicStatistics
);

router.get("/:groupId/violation", groupController.GetViolationGroupByID);

router.get("/:groupId/qr", groupController.getUserQR);

router.put("/:groupId/qr", groupController.updateUserQR);

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
  ensureGroupExists, // Middleware kiểm tra nhóm tồn tại
  ensureMemberOrPublic, // Middleware kiểm tra user là thành viên hoặc nhóm công khai
  ensureCanPost, // Middleware kiểm tra user có quyền đăng bài
  ensureGroupAdmin, // Middleware kiểm tra user là admin nhóm
  ensureGroupOwner, // Middleware kiểm tra user là chủ sở hữu nhóm
} = require("../middleware/groupAuth");

// Lấy thông tin nhóm
router.get("/:groupId", ensureGroupExists, groupController.infoGroup);

// Cập nhật thông tin nhóm
router.put(
  "/:groupId",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
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

router.post(
  "/:groupId/report",
  ensureGroupExists,
  upload.array("files"),
  groupController.reportGroup
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

router.get("/", groupController.getAllGroups); // Lấy tất cả groups

module.exports = router;
