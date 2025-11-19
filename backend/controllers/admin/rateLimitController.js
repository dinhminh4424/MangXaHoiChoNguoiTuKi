// controllers/rateLimitController.js
const RateLimitConfig = require("../../models/RateLimitConfig");

exports.getRateLimitConfigs = async (req, res) => {
  try {
    const configs = await RateLimitConfig.find().sort({ key: 1 });
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getRateLimitConfig = async (req, res) => {
  try {
    const config = await RateLimitConfig.findOne({ key: req.params.key });
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Config không tồn tại" });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.updateRateLimitConfig = async (req, res) => {
  try {
    const {
      name,
      description,
      windowMs,
      max,
      enabled,
      skipRoles,
      customMessage,
    } = req.body;

    const config = await RateLimitConfig.findOneAndUpdate(
      { key: req.params.key },
      {
        name,
        description,
        windowMs,
        max,
        enabled,
        skipRoles,
        customMessage,
        updatedBy: req.user.userId,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    // KHÔNG CẦN REFRESH CACHE NỮA - Middleware tự động lấy config mới

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: config,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Key đã tồn tại" });
    }
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.bulkUpdateRateLimitConfigs = async (req, res) => {
  try {
    const { configs } = req.body;

    const operations = configs.map((config) => ({
      updateOne: {
        filter: { key: config.key },
        update: {
          $set: {
            ...config,
            updatedBy: req.user.userId,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await RateLimitConfig.bulkWrite(operations);

    // KHÔNG CẦN REFRESH CACHE NỮA

    res.json({ success: true, message: "Cập nhật hàng loạt thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
