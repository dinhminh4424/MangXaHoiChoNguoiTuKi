const express = require("express");
const router = express.Router();
const questionResultController = require("../controllers/questionResultController");

// Lưu kết quả
router.post("/", questionResultController.saveResult);

// Lấy danh sách kết quả
router.get("/", questionResultController.getResults);

// Lấy chi tiết kết quả
router.get("/:resultId", questionResultController.getResultDetails);

// Lấy thống kê
router.get("/stats/overview", questionResultController.getStatistics);

// Xóa kết quả
router.delete("/:resultId", questionResultController.deleteResult);

module.exports = router;
