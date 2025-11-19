// routes/admin/usersAnalytics.js
const express = require("express");
const router = express.Router();
const usersAnalyticsController = require("../../controllers/admin/usersAnalyticsController");
const adminAuth = require("../../middleware/adminAuth");

router.use(adminAuth);

// Thống kê tổng quan người dùng
router.get("/stats", usersAnalyticsController.getUserStats);

// Lịch sử tìm kiếm khả nghi
router.get(
  "/suspicious-searches",
  usersAnalyticsController.getSuspiciousSearches
);

// Chi tiết người dùng cụ thể
router.get("/user/:userId", usersAnalyticsController.getUserDetail);

module.exports = router;
