// routes/admin/analytics.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../../controllers/admin/analyticsController");
const userAnalyticsRoutes = require("./usersAnalytics");
const contentAnalytics = require("./contentAnalytics");

// Middleware xác thực admin
const adminAuth = require("../../middleware/adminAuth");

// Tất cả routes đều yêu cầu xác thực admin
router.use(adminAuth);

router.get("/overview", analyticsController.getOverview);

// @route   GET /api/admin/analytics/detailed
// @desc    Lấy thống kê chi tiết theo loại
// @access  Private/Admin
router.get("/detailed", analyticsController.getDetailedStats);

// @route   POST /api/admin/analytics/charts/custom
// @desc    Lấy dữ liệu biểu đồ tùy chỉnh
// @access  Private/Admin
router.post("/charts/custom", analyticsController.getCustomChartData);

// @route   GET /api/admin/analytics/export
// @desc    Xuất dữ liệu analytics
// @access  Private/Admin
router.get("/export", analyticsController.exportAnalytics);

router.get("/realtime", analyticsController.getRealTimeData);
router.get("/health", analyticsController.getHealth);
router.post("/charts/custom", analyticsController.getCustomChartData);

// phần thống kê us
router.use("/users", userAnalyticsRoutes);
router.use("/content", contentAnalytics);

module.exports = router;
