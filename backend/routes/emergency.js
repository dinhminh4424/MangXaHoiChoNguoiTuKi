const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");
const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
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
    // ✅ Ưu tiên lấy userId từ token (nếu có middleware auth), nếu không thì lấy từ body
    const userId = req.user?.userId || req.body.userId;
    const { phoneNumber, latitude, longitude, message, type, isSilent } = req.body;

    console.log("🔍 UserId từ token:", req.user?.userId);
    console.log("🔍 UserId từ body:", req.body.userId);
    console.log("✅ UserId được sử dụng:", userId);

    if (!userId || !latitude || !longitude)
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc!" });

    // ✅ Lấy địa chỉ cụ thể từ OpenStreetMap
    const address = await getAddressFromCoordinates(latitude, longitude);
    console.log("📍 Địa chỉ xác định:", address);

    // 1️⃣ Lấy thông tin người dùng (nếu userId là ObjectId)
    let user = null;
    try {
      user = await User.findById(userId).select("username fullName");
    } catch (error) {
      console.log("Không tìm thấy user với userId:", userId);
    }

    // 2️⃣ Lưu yêu cầu khẩn cấp
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

    // 3️⃣ Gửi thông báo cho tất cả admin
    try {
      const userName = user ? (user.fullName || user.username) : userId;
      const notificationMessage = `Người dùng ${userName} vừa gửi tín hiệu SOS khẩn cấp! ${message ? `Tin nhắn: ${message}` : ""}`;
      
      await NotificationService.emitNotificationToAdmins({
        type: "SOS_EMERGENCY",
        title: "🚨 Tín hiệu SOS khẩn cấp",
        message: notificationMessage,
        priority: "urgent",
        data: {
          emergencyRequestId: newRequest._id.toString(),
          userId: userId,
          userName: userName,
          phoneNumber: phoneNumber,
          latitude: latitude,
          longitude: longitude,
          address: address,
          message: message,
          type: type,
          mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        },
        url: `/admin/emergency/${newRequest._id}`, // URL để admin xem chi tiết
        sender: user ? user._id : null,
      });
      
      console.log("✅ Đã gửi thông báo SOS cho admin");
    } catch (notificationError) {
      console.error("❌ Lỗi khi gửi thông báo cho admin:", notificationError);
      // Không throw error để không ảnh hưởng đến việc gửi SOS
    }

    // 4️⃣ Lấy danh bạ khẩn cấp của người dùng
    const contacts = await EmergencyContact.find({ userId });

    // 5️⃣ Gửi email/SMS đến từng liên hệ
    for (const contact of contacts) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: contact.phoneNumber, // có thể là email
        subject: "🚨 Cảnh báo khẩn cấp SOS",
        text: `
        Xin chào ${contact.name},

        Người dùng ${user ? (user.fullName || user.username) : userId} vừa gửi tín hiệu SOS!

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
