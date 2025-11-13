// routes/violations.js
const express = require("express");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const violationController = require("../controllers/violationController");

const router = express.Router();

// Tất cả routes đều cần xác thực
router.use(auth);

// Lấy danh sách vi phạm với phân trang và lọc
router.get("/", violationController.getUserViolations);

// Lấy thống kê vi phạm
router.get("/stats", violationController.getViolationStats);

// Lấy chi tiết vi phạm
router.get("/:id", violationController.getViolationDetails);

// Tạo kháng cáo
router.post(
  "/:id/appeal",
  upload.array("files"),
  violationController.createAppeal
);

// Hủy kháng cáo
router.patch("/:id/appeal/cancel", violationController.cancelAppeal);

module.exports = router;
