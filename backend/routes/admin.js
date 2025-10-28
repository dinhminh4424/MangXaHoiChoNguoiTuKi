const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// Middleware kiểm tra đăng nhập trước, sau đó kiểm tra quyền admin
router.use(auth);
router.use(adminAuth);

// Dashboard - Thống kê tổng quan
router.get("/dashboard", adminController.getDashboardStats);

// Quản lý người dùng
router.get("/users", adminController.getAllUsers);
router.get("/users/:userId", adminController.getUserById);
router.put("/users/:userId", adminController.updateUser);
router.delete("/users/:userId", adminController.deleteUser);
router.put("/users/:userId/role", adminController.updateUserRole);
// router.put("/users/:userId/status", adminController.updateUserStatus);

// Quản lý bài viết
router.get("/posts", adminController.getAllPosts);
router.get("/posts/:postId", adminController.getPostById);
router.delete("/posts/:postId", adminController.deletePost);
// router.put("/posts/:postId/status", adminController.updatePostStatus);

// Quản lý nhật ký
router.get("/journals", adminController.getAllJournals);
router.get("/journals/:journalId", adminController.getJournalById);
router.delete("/journals/:journalId", adminController.deleteJournal);

// Quản lý nhóm
router.get("/groups", adminController.getAllGroups);
router.get("/groups/:groupId", adminController.getGroupById);
router.delete("/groups/:groupId", adminController.deleteGroup);
// router.put("/groups/:groupId/status", adminController.updateGroupStatus);

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

module.exports = router;
