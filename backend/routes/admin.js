const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");
const imageRoutes = require("./imageRoutes");
const securityRoutes = require("./admin/securityRoutes");
const adminAnalyticsRoutes = require("./admin/analytics");
const adminChatRoutes = require("./admin/chat");
const User = require("../models/User");

const UserRouter = require("./admin/user");
const PostRouter = require("./admin/post");
const GroupRouter = require("./admin/group");

// Middleware kiểm tra đăng nhập trước, sau đó kiểm tra quyền admin
router.use(auth);
router.use(adminAuth);

// Dashboard - Thống kê tổng quan
router.get("/dashboard", adminController.getDashboardStats);

// Quản lý người dùng
// router.get("/users", adminController.getAllUsers);
// router.get("/users/:userId", adminController.getUserById);

// router.delete("/users/:userId", adminController.deleteUser);
// router.put("/users/:id/active", adminController.updateActiveUser);
// router.put("/users/:userId/role", adminController.updateUserRole);
// router.put("/users/:id", adminController.updateUser);
// router.post("/users", adminController.createUser);

router.use("/users", UserRouter);

// Quản lý bài viết

// router.put("/posts/:postId/blockPost", adminController.block_un_Post);
// router.put("/posts/:postId/blockComment", adminController.block_un_PostComment);

// router.get("/posts/:postId", adminController.getPostById);
// router.get("/posts", adminController.getAllPosts);

// router.delete("/posts/:postId", adminController.deletePost);

router.use("/posts", PostRouter);

// Quản lý nhật ký
router.get("/journals", adminController.getAllJournals);
router.get("/journals/stats", adminController.getJournalStats);
router.get("/journals/:journalId", adminController.getJournalById);
router.delete("/journals/:journalId", adminController.deleteJournal);

// Quản lý nhóm

// router.get("/groups", adminController.getAllGroups);
// router.get("/groups/stats", adminController.getGroupStats);
// router.post(
//   "/groups",
//   upload.fields([
//     { name: "avatar", maxCount: 1 },
//     { name: "coverPhoto", maxCount: 1 },
//   ]),
//   adminController.createGroup
// );
// router.get("/groups/:groupId", adminController.getGroupById);
// router.put(
//   "/groups/:groupId",
//   upload.fields([
//     { name: "avatar", maxCount: 1 },
//     { name: "coverPhoto", maxCount: 1 },
//   ]),
//   adminController.updateGroup
// );
// router.delete("/groups/:groupId", adminController.deleteGroup);

router.use("/groups", GroupRouter);

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
router.use("/analytics", adminAnalyticsRoutes);

// adminChatRoutes
router.use("/chats", adminChatRoutes);

// security
router.use("/security", securityRoutes);

// logs user
router.get("/logs", adminController.getSystemLogs);
router.get("/logs/:logId", adminController.getLogDetail);
router.get("/logs/user/quick-stats", adminController.getQuickStats);
router.get("/logs/user/:userId", adminController.getUserLogs);
router.get("/logs/stats", adminController.getLogStats);

router.post("/debug/run-streak-check", async (req, res) => {
  console.log("Manually running daily streak check...");
  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  try {
    const result = await User.updateMany(
      {
        checkInStreak: { $gt: 0 },
        lastCheckInDate: { $lt: startOfYesterday },
      },
      { $set: { has_lost_streak: true } }
    );
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} users as having lost their streak.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
