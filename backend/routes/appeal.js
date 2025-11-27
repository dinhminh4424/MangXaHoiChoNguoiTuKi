const express = require("express");
const router = express.Router();
const Appeal = require("../models/Appeal");
const upload = require("../middleware/upload");

// User đã đăng nhập gửi kháng nghị

// Người dùng gửi kháng nghị (không cần đăng nhập)
router.post("/submit", upload.array("files"), async (req, res) => {
  try {
    const { email, reason, message, phone, name } = req.body;

    // Validate required fields
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: "Email và nội dung là bắt buộc",
      });
    }

    // Xử lý file nếu có
    let files = [];
    if (req.files && req.files.length > 0) {
      files = req.files.map((file) => {
        let fileFolder = "documents";
        if (file.mimetype.startsWith("image/")) {
          fileFolder = "images";
        } else if (file.mimetype.startsWith("video/")) {
          fileFolder = "videos";
        } else if (file.mimetype.startsWith("audio/")) {
          fileFolder = "audio";
        }

        const fileUrl = `/api/uploads/${fileFolder}/${file.filename}`;

        let fileType = "file";
        if (file.mimetype.startsWith("image/")) {
          fileType = "image";
        } else if (file.mimetype.startsWith("video/")) {
          fileType = "video";
        } else if (file.mimetype.startsWith("audio/")) {
          fileType = "audio";
        }

        return {
          type: fileType,
          fileUrl: fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
        };
      });
    }

    const appeal = new Appeal({
      email,
      reason: reason || "Bị khoá tài khoản",
      message,
      files: files,
      phone,
      name,
    });

    await appeal.save();

    res.status(201).json({
      success: true,
      message:
        "Kháng nghị đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn qua email.",
      appeal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi gửi kháng nghị",
      error: error.message,
    });
  }
});

// Người dùng xem trạng thái kháng nghị bằng email
router.get("/status", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc",
      });
    }

    const appeals = await Appeal.find({ email })
      .sort({ createdAt: -1 })
      .select("reason status adminNotes createdAt updatedAt files");

    res.json({
      success: true,
      appeals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy trạng thái kháng nghị",
      error: error.message,
    });
  }
});

// Người dùng xem chi tiết kháng nghị cụ thể
router.get("/:id", async (req, res) => {
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

module.exports = router;
