const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Đọc dữ liệu hướng dẫn
const guidelinePath = path.join(__dirname, "../data/Guideline.json");
let guidelines = [];

try {
  const data = fs.readFileSync(guidelinePath, "utf8");
  guidelines = JSON.parse(data);
} catch (error) {
  console.error("❌ Không thể đọc file Guideline.json:", error);
}

// API: /api/emergency/guideline/:type
router.get("/:type", (req, res) => {
  const { type } = req.params;
  const result = guidelines.find(
    (g) => g.type.toLowerCase() === type.toLowerCase()
  );

  if (!result) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy hướng dẫn cho loại tình huống này",
    });
  }

  res.json({
    success: true,
    data: result,
  });
});

module.exports = router;
