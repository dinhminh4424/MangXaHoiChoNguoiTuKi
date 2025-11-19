// routes/admin/securityRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const adminMiddleware = require("../../middleware/adminAuth");
const rateLimitController = require("../../controllers/admin/rateLimitController");

// Tất cả routes cần admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin routes - yêu cầu quyền admin
router.get("/rate-limits", rateLimitController.getRateLimitConfigs);
router.get("/rate-limits/:key", rateLimitController.getRateLimitConfig);
router.put("/rate-limits/:key", rateLimitController.updateRateLimitConfig);
router.put("/rate-limits", rateLimitController.bulkUpdateRateLimitConfigs);

module.exports = router;
