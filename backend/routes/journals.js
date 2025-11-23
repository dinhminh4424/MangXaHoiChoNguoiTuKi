// routes/journalRoutes.js
const express = require("express");
const router = express.Router();
const journalController = require("../controllers/journalController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const Journal = require("../models/Journal");
const User = require("../models/User");

// Tất cả routes đều cần xác thực
router.use(auth);

// Hàm tiện ích để lấy ngày bắt đầu của tuần (Thứ 2)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (CN) đến 6 (T7)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

// === CÁC ROUTE XỬ LÝ CHUỖI VIẾT NHẬT KÝ ===

/**
 * @route   GET /api/journals/streaks/status
 * @desc    Kiểm tra trạng thái chuỗi viết nhật ký của người dùng
 * @access  Private
 */
router.get("/streaks/status", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);

    // 1. Reset lượt khôi phục hàng tuần nếu cần
    const lastMissWeekStart = user.last_journal_miss_week_start || new Date(0);
    if (lastMissWeekStart.getTime() < currentWeekStart.getTime()) {
      user.weekly_journal_miss_uses = 0;
      user.last_journal_miss_week_start = currentWeekStart;
      user.has_lost_journal_streak = false; // Reset cờ mất chuỗi khi sang tuần mới
    }

    // 2. Kiểm tra xem chuỗi đã bị mất chưa
    const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));
    const yesterdayMidnight = new Date(
      new Date().setDate(todayMidnight.getDate() - 1)
    );
    yesterdayMidnight.setHours(0, 0, 0, 0);

    let isPaused = false; // Biến để theo dõi trạng thái tạm dừng

    // Chỉ kiểm tra nếu user đã có chuỗi và chưa bị đánh dấu là mất chuỗi trong tuần
    if (
      user.journalStreak > 0 &&
      user.lastJournalDate &&
      !user.has_lost_journal_streak
    ) {
      const lastJournalDay = new Date(user.lastJournalDate);
      lastJournalDay.setHours(0, 0, 0, 0);

      // Nếu ngày viết cuối cùng không phải hôm nay và cũng không phải hôm qua -> Mất chuỗi
      if (lastJournalDay.getTime() < yesterdayMidnight.getTime()) {
        // Đánh dấu là đang tạm dừng để frontend hiển thị thông báo
        isPaused = true;
        // Nếu hết lượt bỏ lỡ -> mới đánh dấu là mất chuỗi
        if (user.weekly_journal_miss_uses >= 2) {
          user.has_lost_journal_streak = true;
        }
        // Lưu ý: Việc tăng weekly_journal_miss_uses sẽ được xử lý trong controller createJournal
        // để chỉ tính khi người dùng thực sự viết bài mới sau khi bỏ lỡ.
      }
    }

    await user.save();

    // 3. Trả về trạng thái
    res.json({
      success: true,
      data: {
        journalStreak: user.journalStreak,
        hasLostJournalStreak: user.has_lost_journal_streak,
        isPaused: isPaused, // <-- Thêm trường này vào response
        weeklyMissesUsed: user.weekly_journal_miss_uses,
        weeklyMissesAllowed: 2,
      },
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái chuỗi nhật ký:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

router.get("/stats/:userId", journalController.getJournalStats);

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
    if (userId !== req.user.userId.toString()) {
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

router.get("/", journalController.getJournal);

// // xóa nhật ký
// router.delete("/:id", journalController.deleteJournal);

module.exports = router;
