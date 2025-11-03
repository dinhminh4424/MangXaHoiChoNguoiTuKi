const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");
const EmergencyRequest = require("../models/EmergencyRequest");
const nodemailer = require("nodemailer");

// Cấu hình gửi email (có thể thay bằng SMS API)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // email gửi
    pass: process.env.EMAIL_PASS, // app password
  },
});

// Gửi SOS
router.post("/sos", async (req, res) => {
  try {
    const { userId, latitude, longitude, message, type, isSilent } = req.body;

    // 1️⃣ Lưu yêu cầu khẩn cấp
    const emergency = new EmergencyRequest({
      userId,
      latitude,
      longitude,
      message,
      type,
      isSilent,
    });
    await emergency.save();

    // 2️⃣ Lấy danh bạ khẩn cấp của người dùng
    const contacts = await EmergencyContact.find({ userId });

    // 3️⃣ Gửi email/SMS đến từng liên hệ
    for (const contact of contacts) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: contact.phoneNumber, // có thể là email
        subject: "🚨 Cảnh báo khẩn cấp SOS",
        text: `
Xin chào ${contact.name},

Người dùng ${userId} vừa gửi tín hiệu SOS!

📍 Vị trí: https://www.google.com/maps?q=${latitude},${longitude}
📩 Tin nhắn: ${message || "Không có tin nhắn"}

⚠️ Vui lòng phản hồi ngay lập tức.
`,
      };
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ success: true, message: "SOS sent successfully" });
  } catch (error) {
    console.error("Error sending SOS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
