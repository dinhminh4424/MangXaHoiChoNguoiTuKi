const express = require("express");
const router = express.Router();
const Appeal = require("../../models/Appeal");
const adminAuth = require("../../middleware/adminAuth");

// Admin lấy tất cả kháng nghị
router.get("/all", adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, email, reason } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }

    if (reason && reason !== "all") {
      filter.reason = reason;
    }

    const appeals = await Appeal.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appeal.countDocuments(filter);

    res.json({
      success: true,
      appeals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách kháng nghị",
      error: error.message,
    });
  }
});

// Admin cập nhật trạng thái kháng nghị
router.put("/update/:id", adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const appeal = await Appeal.findById(req.params.id);

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kháng nghị",
      });
    }

    appeal.status = status;

    if (adminNotes) {
      appeal.adminNotes = adminNotes;
    }

    await appeal.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      appeal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật kháng nghị",
      error: error.message,
    });
  }
});

// Lấy thống kê kháng nghị
router.get("/statistics", adminAuth, async (req, res) => {
  try {
    const total = await Appeal.countDocuments();
    const pending = await Appeal.countDocuments({ status: "pending" });
    const reviewing = await Appeal.countDocuments({ status: "reviewing" });
    const resolved = await Appeal.countDocuments({ status: "resolved" });
    const rejected = await Appeal.countDocuments({ status: "rejected" });

    // Thống kê theo lý do
    const reasons = await Appeal.aggregate([
      {
        $group: {
          _id: "$reason",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      statistics: {
        total,
        pending,
        reviewing,
        resolved,
        rejected,
        reasons,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
      error: error.message,
    });
  }
});

// Lấy chi tiết kháng nghị cho admin
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id);

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kháng nghị",
      });
    }

    res.json({
      success: true,
      appeal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin kháng nghị",
      error: error.message,
    });
  }
});

// Xóa kháng nghị
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const appeal = await Appeal.findByIdAndDelete(req.params.id);

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kháng nghị",
      });
    }

    res.json({
      success: true,
      message: "Đã xóa kháng nghị thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa kháng nghị",
      error: error.message,
    });
  }
});

module.exports = router;
