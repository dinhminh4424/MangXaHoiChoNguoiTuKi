// routes/settings.js
const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { logUserActivity } = require("../logging/userActivityLogger");
const router = express.Router();

// Lấy cài đặt
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("settings");

    res.json({
      success: true,
      data: {
        settings: user.settings || {},
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Cập nhật cài đặt
router.put("/", auth, async (req, res) => {
  try {
    const { settings } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { settings } },
      { new: true }
    ).select("settings");

    logUserActivity({
      action: "settings.update",
      req,
      res,
      userId: req.user.userId,
      role: user.role,
      target: { type: "user", id: req.user.userId },
      description: "Người dùng cập nhật cài đặt",
      payload: { settings },
    });

    res.json({
      success: true,
      message: "Cập nhật cài đặt thành công",
      data: {
        settings: user.settings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

module.exports = router;
