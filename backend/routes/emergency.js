const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");
const EmergencyRequest = require("../models/EmergencyRequest");
const nodemailer = require("nodemailer");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));


// Cấu hình gửi email (có thể thay bằng SMS API)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // email gửi
    pass: process.env.EMAIL_PASS, // app password
  },
});

// ✅ Hàm lấy địa chỉ cụ thể từ toạ độ (reverse geocoding)
async function getAddressFromCoordinates(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await response.json();
    return data.display_name || "Không xác định vị trí";
  } catch (error) {
    console.error("Lỗi lấy địa chỉ:", error);
    return "Không xác định vị trí";
  }
}

// Gửi SOS
router.post("/sos", async (req, res) => {
  console.log("📩 Nhận tín hiệu SOS:", req.body);
  try {
    const { userId, latitude, longitude, message, type, isSilent } = req.body;

    if (!userId || !latitude || !longitude)
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc!" });

    // ✅ Lấy địa chỉ cụ thể từ OpenStreetMap
    const address = await getAddressFromCoordinates(latitude, longitude);
    console.log("📍 Địa chỉ xác định:", address);

    // 1️⃣ Lưu yêu cầu khẩn cấp
    const newRequest = new EmergencyRequest({
        userId,
        latitude,     
        longitude,   
        address,     
        message,
        type,
        isSilent,
        status: "pending",
        });
    
    await newRequest.save();

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

        📍 Địa chỉ: ${address}
        🌐 Xem bản đồ: https://www.google.com/maps?q=${latitude},${longitude}
        📩 Tin nhắn: ${message || "Không có tin nhắn"}

        ⚠️ Vui lòng phản hồi ngay lập tức.
        `,

      };
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({
        success: true,
        message: "SOS sent successfully",
        address, // 👈 gửi địa chỉ cụ thể về frontend
    });

  } catch (error) {
    console.error("Error sending SOS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
