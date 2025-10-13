// backend/routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

// Route upload file
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    // Kiểm tra file có được tải lên không
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Không có file được tải lên",
      });
    }

    // Xác định thư mục theo mimetype của file
    let fileFolder = "documents";
    if (req.file.mimetype.startsWith("image/")) {
      fileFolder = "images";
    } else if (req.file.mimetype.startsWith("video/")) {
      fileFolder = "videos";
    } else if (req.file.mimetype.startsWith("audio/")) {
      fileFolder = "audio";
    }

    // Tạo URL truy cập
    const fileUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/uploads/${fileFolder}/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Lỗi server khi tải file lên",
    });
  }
});

module.exports = router;
