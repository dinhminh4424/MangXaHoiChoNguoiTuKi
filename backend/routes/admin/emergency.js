const express = require("express");
const router = express.Router();
const adminEmergencyController = require("../../controllers/admin/adminEmergencyController");
const auth = require("../../middleware/auth");

// Tất cả routes yêu cầu admin authentication
router.use(auth);

// Cập nhật trạng thái
router.post("/:emergencyId/status", adminEmergencyController.updateStatus);

// Phản hồi yêu cầu
router.post(
  "/:emergencyId/respond",
  adminEmergencyController.respondToEmergency
);

// Xoá yêu cầu
router.delete("/:emergencyId", adminEmergencyController.deleteEmergency);

// Lấy thống kê
router.get("/stats", adminEmergencyController.getEmergencyStats);

// Lấy thống kê nâng cao
router.get("/stats/advanced", adminEmergencyController.getAdvancedStats);

// Lấy danh sách người phản hồi
router.get("/responders", adminEmergencyController.getResponders);

// Xuất dữ liệu
router.get("/export", adminEmergencyController.exportData);

// Lấy chi tiết yêu cầu
router.get("/:emergencyId", adminEmergencyController.getEmergencyDetail);

// Lấy danh sách yêu cầu khẩn cấp
router.get("/", adminEmergencyController.getEmergencies);

module.exports = router;
