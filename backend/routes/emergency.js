// --- routes/emergency.js (cập nhật: xử lý placeholder và verify token)
const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");
const EmergencyRequest = require("../models/EmergencyRequest");
const nodemailer = require("nodemailer");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const jwt = require("jsonwebtoken");

// cấu hình nodemailer (giữ nguyên của bạn)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

router.post("/sos", async (req, res) => {
  console.log("📩 Nhận tín hiệu SOS:", req.body);
  try {
    let { userId, phoneNumber, latitude, longitude, message, type, isSilent } = req.body;

    // Nếu client truyền một "placeholder" (ví dụ khi dev test), coi như không có userId
    const placeholders = new Set(["currentUserId", "undefined", "null", "", null]);
    if (placeholders.has(userId)) {
      console.warn("Client gửi userId placeholder -> bỏ qua giá trị đó");
      userId = null;
    }

    // Nếu không có userId từ body, thử verify token trong header Authorization
    if (!userId) {
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId || decoded.id || decoded._id || decoded.uid;
          console.log("Lấy userId từ token:", userId);
        } catch (err) {
          console.warn("Token không hợp lệ hoặc hết hạn:", err.message);
          // không return trực tiếp ở đây để có thể trả lỗi đồng nhất phía dưới
        }
      }
    }

    if (!userId || latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc!" });
    }

    const address = await getAddressFromCoordinates(latitude, longitude);
    console.log("📍 Địa chỉ xác định:", address);

    const newRequest = new EmergencyRequest({
      userId,
      phoneNumber,
      latitude,
      longitude,
      address,
      message,
      type,
      isSilent,
      status: "pending",
    });

    await newRequest.save();

    const contacts = await EmergencyContact.find({ userId });

    for (const contact of contacts) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: contact.phoneNumber,
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
      try {
        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.error("Lỗi gửi mail cho contact:", contact, err);
      }
    }

    res.status(200).json({
      success: true,
      message: "SOS sent successfully",
      address,
    });
  } catch (error) {
    console.error("Error sending SOS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;