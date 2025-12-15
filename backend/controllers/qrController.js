// controllers/qrController.js
const QRService = require("../services/qrService");
const User = require("../models/User");
const { logUserActivity } = require("../logging/userActivityLogger");

class QRController {
  /**
   * Tạo QR code cho URL bất kỳ
   */
  async generateQR(req, res) {
    try {
      const { url, options = {} } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "URL là bắt buộc",
        });
      }

      console.log("🎨 Generating QR for:", url);

      // Tạo QR code
      const qrData = await QRService.generateQRData(url, options);

      // Log activity
      logUserActivity({
        action: "qr.generate",
        req,
        res,
        userId: req.user.userId,
        target: { type: "qr", data: url },
        description: "Tạo QR code",
        payload: {
          url: url,
          options: options,
        },
      });

      res.json({
        success: true,
        message: "Tạo QR code thành công",
        data: {
          qrDataURL: qrData.dataURL,
          url: qrData.data,
          info: QRService.getQRInfo(qrData),
        },
      });
    } catch (error) {
      console.error("❌ Error generating QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo QR code",
        error: error.message,
      });
    }
  }

  /**
   * Tạo QR code tạm thời (nhanh chóng)
   */
  async generateTempQR(req, res) {
    try {
      const { text, type = "text", hours = 24 } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Nội dung là bắt buộc",
        });
      }

      console.log("⚡ Generating temp QR:", { text, type, hours });

      let data = text;

      // Format data theo type
      switch (type) {
        case "url":
          if (!text.startsWith("http")) {
            data = `https://${text}`;
          }
          break;
        case "email":
          data = `mailto:${text}`;
          break;
        case "phone":
          data = `tel:${text}`;
          break;
        case "sms":
          data = `SMSTO:${text}`;
          break;
        case "wifi":
          data = `WIFI:S:${text};T:WPA;P:;;`;
          break;
      }

      // Tạo QR code tạm thời
      const qrData = await QRService.generateTemporaryQR(data, hours);

      res.json({
        success: true,
        message: "Tạo QR code tạm thời thành công",
        data: {
          qrDataURL: qrData.dataURL,
          originalText: text,
          encodedData: qrData.data,
          expiresIn: QRService.getTimeUntilExpiry(qrData),
          type: type,
        },
      });
    } catch (error) {
      console.error("❌ Error generating temp QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo QR code tạm thời",
        error: error.message,
      });
    }
  }

  /**
   * Quét QR code - trả về URL để redirect
   */
  async scanQR(req, res) {
    try {
      const { qrData } = req.body;

      if (!qrData) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu QR code là bắt buộc",
        });
      }

      console.log("🔍 Scanning QR:", qrData);

      let url = qrData;

      // Đảm bảo URL có protocol nếu là web URL
      if (
        url.startsWith("www.") ||
        (!url.startsWith("http") && url.includes("."))
      ) {
        url = `https://${url}`;
      }

      // Log activity
      logUserActivity({
        action: "qr.scan",
        req,
        res,
        userId: req.user.userId,
        target: { type: "qr", data: qrData },
        description: "Quét QR code",
        payload: {
          originalData: qrData,
          processedUrl: url,
        },
      });

      res.json({
        success: true,
        data: {
          url: url,
          originalData: qrData,
          action: "redirect",
          message: "QR code đã được quét thành công",
        },
      });
    } catch (error) {
      console.error("❌ Error scanning QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi quét QR code",
        error: error.message,
      });
    }
  }

  /**
   * Download QR code dạng PNG
   */
  async downloadQR(req, res) {
    try {
      const { url, options = {} } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "URL là bắt buộc",
        });
      }

      // Tạo QR buffer
      const qrBuffer = await QRService.generateQRBuffer(url, options);

      // Tên file
      const filename = `qr-${Date.now()}.png`;

      // Set headers
      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": qrBuffer.length,
        "Cache-Control": "no-cache",
      });

      res.send(qrBuffer);
    } catch (error) {
      console.error("❌ Error downloading QR:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải QR code",
        error: error.message,
      });
    }
  }

  /**
   * Lấy thông tin QR code từ data
   */
  async getQRInfo(req, res) {
    try {
      const { qrData } = req.body;

      if (!qrData) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu QR code là bắt buộc",
        });
      }

      // Tạo QR data tạm để phân tích
      const tempQRData = await QRService.generateQRData(qrData);
      const info = QRService.getQRInfo(tempQRData);

      res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      console.error("❌ Error getting QR info:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi phân tích QR code",
        error: error.message,
      });
    }
  }

  /**
   * Lấy danh sách các preset QR
   */
  async getQRPresets(req, res) {
    try {
      const presets = QRService.getExpiryPresets();

      res.json({
        success: true,
        data: {
          presets: presets,
          defaultExpiry: QRService.defaultExpiryDays,
        },
      });
    } catch (error) {
      console.error("❌ Error getting QR presets:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách preset",
        error: error.message,
      });
    }
  }

  /**
   * Tạo QR code từ preset
   */
  async generateQRFromPreset(req, res) {
    try {
      const { url, presetKey, options = {} } = req.body;

      if (!url || !presetKey) {
        return res.status(400).json({
          success: false,
          message: "URL và preset key là bắt buộc",
        });
      }

      const qrData = await QRService.generateQRFromPreset(
        url,
        presetKey,
        options
      );

      res.json({
        success: true,
        message: `Tạo QR code từ preset ${presetKey} thành công`,
        data: {
          qrDataURL: qrData.dataURL,
          url: qrData.data,
          preset: presetKey,
          info: QRService.getQRInfo(qrData),
        },
      });
    } catch (error) {
      console.error("❌ Error generating QR from preset:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo QR code từ preset",
        error: error.message,
      });
    }
  }
}

module.exports = new QRController();
