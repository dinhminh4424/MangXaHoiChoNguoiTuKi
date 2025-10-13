// routes/journalRoutes.js
const express = require("express");
const router = express.Router();
const journalController = require("../controllers/journalController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const Journal = require("../models/Journal");

// Tất cả routes đều cần xác thực
router.use(auth);

// Tạo nhật ký mới
router.post("/", upload.array("media"), journalController.createJournal);

// Lấy nhật ký hôm nay
router.get("/today/:userId", journalController.getTodayJournal);

// Cập nhật nhật ký hôm nay
router.put(
  "/today/:userId",
  upload.array("media"),
  journalController.updateTodayJournal
);

// Cập nhật nhật ký theo id
router.put(
  "/:journalId",
  upload.array("mediaFiles"),
  journalController.updateJournal
);

router.delete("/:journalId", journalController.deleteJournal);

// Lấy tất cả nhật ký của user (lịch sử)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    let query = { userId };

    // Nếu không phải chủ nhật ký, chỉ hiển thị public
    if (userId !== req.user.id) {
      query.isPrivate = false;
    }

    const journals = await Journal.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "username email avatar");

    const total = await Journal.countDocuments(query);

    res.json({
      success: true,
      data: journals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching user journals:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhật ký",
    });
  }
});

// // xem nhật ký theo idJournal
router.get("/:journalId", journalController.getJournalById);

// // xóa nhật ký
// router.delete("/:id", journalController.deleteJournal);

module.exports = router;
