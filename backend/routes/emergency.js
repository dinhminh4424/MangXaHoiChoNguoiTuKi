const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");
const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
const nodemailer = require("nodemailer");
const mailService = require("../services/mailService");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const auth = require("../middleware/auth");

router.use(auth);

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
    const {
      // userId,
      phoneNumber,
      latitude,
      longitude,
      message,
      type,
      isSilent,
    } = req.body;

    const userId = req.user?.userId;

    if (!userId || !latitude || !longitude)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu bắt buộc!" });

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
      const userName = user ? user.fullName || user.username : userId;
      const notificationMessage = `Người dùng ${userName} vừa gửi tín hiệu SOS khẩn cấp! ${
        message ? `Tin nhắn: ${message}` : ""
      }`;

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
    // for (const contact of contacts) {
    //   const mailOptions = {
    //     from: process.env.EMAIL_USER,
    //     to: contact.phoneNumber, // có thể là email
    //     subject: "🚨 Cảnh báo khẩn cấp SOS",
    //     text: `
    //     Xin chào ${contact.name},

    //     Người dùng ${
    //       user ? user.fullName || user.username : userId
    //     } vừa gửi tín hiệu SOS!

    //     📍 Địa chỉ: ${address}
    //     🌐 Xem bản đồ: https://www.google.com/maps?q=${latitude},${longitude}
    //     📩 Tin nhắn: ${message || "Không có tin nhắn"}

    //     ⚠️ Vui lòng phản hồi ngay lập tức.
    //     `,
    //   };
    //   await transporter.sendMail(mailOptions);
    // }

    // 5️⃣ Gửi email/SMS đến từng Admin

    const admins = await User.find({
      role: { $in: ["admin", "supporter"] },
      email: { $exists: true, $ne: "" },
    });
    if (admins.length > 0) {
      const adminEmails = admins.map((admin) => admin.email);

      // Gửi mail
      await mailService.sendEmail({
        to: adminEmails,
        subject: "🚨 Yêu Cầu Khẩn Cấp Mới - Autism Support",
        templateName: "EMERGENCY_NEW_REQUEST",
        templateData: {
          requestId: newRequest._id,
          userId: newRequest.userId,
          phoneNumber: newRequest.phoneNumber,
          type: newRequest.type,
          latitude: newRequest.latitude,
          longitude: newRequest.longitude,
          address: newRequest.address,
          message: newRequest.message,
          isSilent: newRequest.isSilent,
          status: newRequest.status,
          createdAt: newRequest.createdAt.toLocaleString("vi-VN"),
          adminLink: `${process.env.FRONTEND_URL}/emergency/${newRequest._id}`,
          mapLink: `https://maps.google.com/?q=${newRequest.latitude},${newRequest.longitude}`,
          adminName: "Quản trị viên - Admin",
        },
      });
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
