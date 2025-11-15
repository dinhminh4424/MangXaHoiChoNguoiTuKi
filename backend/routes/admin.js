const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");
const imageRoutes = require("./imageRoutes");

// Middleware kiểm tra đăng nhập trước, sau đó kiểm tra quyền admin
router.use(auth);
router.use(adminAuth);

// Dashboard - Thống kê tổng quan
router.get("/dashboard", adminController.getDashboardStats);

// Quản lý người dùng
router.get("/users", adminController.getAllUsers);
router.get("/users/:userId", adminController.getUserById);

router.delete("/users/:userId", adminController.deleteUser);
router.put("/users/:id/active", adminController.updateActiveUser);
router.put("/users/:userId/role", adminController.updateUserRole);
router.put("/users/:id", adminController.updateUser);
router.post("/users", adminController.createUser);

// Quản lý bài viết

router.put("/posts/:postId/blockPost", adminController.block_un_Post);
router.put("/posts/:postId/blockComment", adminController.block_un_PostComment);

router.get("/posts/:postId", adminController.getPostById);
router.get("/posts", adminController.getAllPosts);

router.delete("/posts/:postId", adminController.deletePost);

// Quản lý nhật ký
router.get("/journals", adminController.getAllJournals);
router.get("/journals/stats", adminController.getJournalStats);
router.get("/journals/:journalId", adminController.getJournalById);
router.delete("/journals/:journalId", adminController.deleteJournal);

// Quản lý nhóm

router.get("/groups", adminController.getAllGroups);
router.get("/groups/stats", adminController.getGroupStats);
router.post(
  "/groups",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  adminController.createGroup
);
router.get("/groups/:groupId", adminController.getGroupById);
router.put(
  "/groups/:groupId",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  adminController.updateGroup
);
router.delete("/groups/:groupId", adminController.deleteGroup);

// Quản lý bình luận
router.get("/comments", adminController.getAllComments);
router.delete("/comments/:commentId", adminController.deleteComment);

// Quản lý thông báo
router.get("/notifications", adminController.getAllNotifications);
router.post("/notifications", adminController.createNotification);
router.delete(
  "/notifications/:notificationId",
  adminController.deleteNotification
);

// Báo cáo và phân tích
router.get("/reports/users", adminController.getUserReports);
router.get("/reports/posts", adminController.getPostReports);
router.get("/reports/activity", adminController.getActivityReports);

// Quản lý báo cáo

router.put("/violation/posts/:id", adminController.updateViolationStatus);
router.put(
  "/violation/comments/:id",
  adminController.updateViolationCommentStatus
);
router.put("/violation/users/:id", adminController.updateViolationUser);
router.put("/violation/groups/:id", adminController.updateViolationGroupStatus);

router.get("/violation/posts", adminController.getPostViolation);
router.get("/violation/comments", adminController.getCommentViolation);
router.get("/violation/users", adminController.getUserViolation);
router.get("/violation/groups", adminController.getGroupViolation);

// Quản lý kháng nghị
router.get("/appeals", adminController.getAllAppeals);
router.get("/appeals/:appealId", adminController.getAppealById);
router.put("/appeals/:appealId/status", adminController.updateAppealStatus);

// hình ảnh
router.use("/images", imageRoutes);

module.exports = router;
