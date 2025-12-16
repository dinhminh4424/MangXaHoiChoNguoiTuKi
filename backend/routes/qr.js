// routes/qr.js
const express = require("express");
const auth = require("../middleware/auth");
const qrController = require("../controllers/qrController");

const router = express.Router();

// Tất cả routes đều cần auth
router.use(auth);

// QR Code Routes
router.post("/generate", qrController.generateQR); // Tạo QR cho URL
router.post("/generate-temp", qrController.generateTempQR); // Tạo QR tạm thời
router.post("/generate-preset", qrController.generateQRFromPreset); // Tạo từ preset
router.post("/scan", qrController.scanQR); // Quét QR
router.post("/download", qrController.downloadQR); // Download PNG
router.post("/info", qrController.getQRInfo); // Phân tích QR
router.get("/presets", qrController.getQRPresets); // Lấy danh sách preset

module.exports = router;
