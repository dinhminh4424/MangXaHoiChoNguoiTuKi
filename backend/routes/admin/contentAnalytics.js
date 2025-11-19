// routes/admin/contentAnalytics.js
const express = require("express");
const router = express.Router();
const contentAnalyticsController = require("../../controllers/admin/contentAnalyticsController");
const adminAuth = require("../../middleware/adminAuth");

router.use(adminAuth);

// Tổng quan nội dung
router.get("/overview", contentAnalyticsController.getContentOverview);

// Chi tiết bài viết
router.get("/post/:postId", contentAnalyticsController.getPostDetail);

// Xu hướng nội dung
router.get("/trends", contentAnalyticsController.getContentTrends);

module.exports = router;
