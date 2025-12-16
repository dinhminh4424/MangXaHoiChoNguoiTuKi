const express = require("express");
const router = express.Router();
const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
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
// router.post("/sos", async (req, res) => {
//   console.log("📩 Nhận tín hiệu SOS:", req.body);
//   try {
//     const {
//       // userId,
//       phoneNumber,
//       latitude,
//       longitude,
//       message,
//       type,
//       isSilent,
//     } = req.body;

//     const userId = req.user?.userId;

//     if (!userId || !latitude || !longitude)
//       return res
//         .status(400)
//         .json({ success: false, message: "Thiếu dữ liệu bắt buộc!" });

//     // ✅ Lấy địa chỉ cụ thể từ OpenStreetMap
//     const address = await getAddressFromCoordinates(latitude, longitude);
//     console.log("📍 Địa chỉ xác định:", address);

//     // 1️⃣ Lấy thông tin người dùng (nếu userId là ObjectId)
//     let user = null;
//     try {
//       user = await User.findById(userId).select("username fullName");
//     } catch (error) {
//       console.log("Không tìm thấy user với userId:", userId);
//     }

//     // 2️⃣ Lưu yêu cầu khẩn cấp
//     const newRequest = new EmergencyRequest({
//       userId,
//       phoneNumber,
//       latitude,
//       longitude,
//       address,
//       message,
//       type,
//       isSilent,
//       status: "pending",
//     });

//     await newRequest.save();

//     // 3️⃣ Gửi thông báo cho tất cả admin
//     try {
//       const userName = user ? user.fullName || user.username : userId;
//       const notificationMessage = `Người dùng ${userName} vừa gửi tín hiệu SOS khẩn cấp! ${
//         message ? `Tin nhắn: ${message}` : ""
//       }`;

//       await NotificationService.emitNotificationToAdmins({
//         type: "SOS_EMERGENCY",
//         title: "🚨 Tín hiệu SOS khẩn cấp",
//         message: notificationMessage,
//         priority: "urgent",
//         data: {
//           emergencyRequestId: newRequest._id.toString(),
//           userId: userId,
//           userName: userName,
//           phoneNumber: phoneNumber,
//           latitude: latitude,
//           longitude: longitude,
//           address: address,
//           message: message,
//           type: type,
//           mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
//         },
//         url: `/admin/emergency/${newRequest._id}`, // URL để admin xem chi tiết
//         sender: user ? user._id : null,
//       });

//       console.log("✅ Đã gửi thông báo SOS cho admin");
//     } catch (notificationError) {
//       console.error("❌ Lỗi khi gửi thông báo cho admin:", notificationError);
//       // Không throw error để không ảnh hưởng đến việc gửi SOS
//     }

//     // 5️⃣ Gửi email/SMS đến từng Admin

//     const admins = await User.find({
//       role: { $in: ["admin", "supporter"] },
//       email: { $exists: true, $ne: "" },
//     });
//     if (admins.length > 0) {
//       const adminEmails = admins.map((admin) => admin.email);

//       // Gửi mail
//       await mailService.sendEmail({
//         to: adminEmails,
//         subject: "🚨 Yêu Cầu Khẩn Cấp Mới - Autism Support",
//         templateName: "EMERGENCY_NEW_REQUEST",
//         templateData: {
//           requestId: newRequest._id,
//           userId: newRequest.userId,
//           phoneNumber: newRequest.phoneNumber,
//           type: newRequest.type,
//           latitude: newRequest.latitude,
//           longitude: newRequest.longitude,
//           address: newRequest.address,
//           message: newRequest.message,
//           isSilent: newRequest.isSilent,
//           status: newRequest.status,
//           createdAt: newRequest.createdAt.toLocaleString("vi-VN"),
//           adminLink: `${process.env.FRONTEND_URL}/emergency/${newRequest._id}`,
//           mapLink: `https://maps.google.com/?q=${newRequest.latitude},${newRequest.longitude}`,
//           adminName: "Quản trị viên - Admin",
//         },
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "SOS sent successfully",
//       address, // 👈 gửi địa chỉ cụ thể về frontend
//     });
//   } catch (error) {
//     console.error("Error sending SOS:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// Gửi SOS (cho người dùng thông thường)
router.post("/sos", async (req, res) => {
  console.log("📩 Nhận tín hiệu SOS:", req.body);
  try {
    const {
      phoneNumber,
      latitude,
      longitude,
      message,
      type = "panic",
      isSilent = false,
      deviceInfo = {},
    } = req.body;

    const userId = req.user?._id || req.user?.userId;

    if (!latitude || !longitude)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin vị trí!" });

    // ✅ Lấy địa chỉ cụ thể từ OpenStreetMap
    const address = await getAddressFromCoordinates(latitude, longitude);
    console.log("📍 Địa chỉ xác định:", address);

    // 1️⃣ Lấy thông tin người dùng
    let user = null;
    if (userId) {
      try {
        user = await User.findById(userId).select(
          "username fullName email profile.avatar isOnline"
        );
      } catch (error) {
        console.log("Không tìm thấy user với userId:", userId);
      }
    }

    // 2️⃣ Lưu yêu cầu khẩn cấp với cấu trúc mới
    const newRequest = new EmergencyRequest({
      userId: userId || null,
      phoneNumber,
      latitude,
      longitude,
      locationAccuracy: deviceInfo.locationAccuracy || null,
      address,
      message,
      type,
      isSilent,
      status: "pending",
      priority: "critical", // Mặc định là khẩn cấp
      deviceInfo: {
        battery: deviceInfo.battery,
        network: deviceInfo.network,
        os: deviceInfo.os,
        appVersion: deviceInfo.appVersion,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newRequest.save();

    // 3️⃣ Gửi thông báo cho tất cả admin/supporter
    try {
      const userName = user
        ? user.fullName || user.username
        : phoneNumber || "Người dùng ẩn danh";
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
          priority: "critical",
          adminUrl: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/admin/emergencies/${newRequest._id}`,
        },
        url: `/admin/emergencies/${newRequest._id}`,
        sender: user ? user._id : null,
      });

      console.log("✅ Đã gửi thông báo SOS cho admin/supporter");
    } catch (notificationError) {
      console.error("❌ Lỗi khi gửi thông báo cho admin:", notificationError);
    }

    // 4️⃣ Gửi email đến admin/supporter
    try {
      const admins = await User.find({
        role: { $in: ["admin", "supporter", "doctor"] },
        email: { $exists: true, $ne: "" },
        active: true,
      });

      if (admins.length > 0) {
        const adminEmails = admins.map((admin) => admin.email);

        // Helper function để format date
        function formatDateTime(date) {
          if (!date) return "";
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          const seconds = String(d.getSeconds()).padStart(2, "0");
          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        }

        // Helper function để get emergency type label
        function getEmergencyTypeLabel(type) {
          const types = {
            panic: "Khẩn cấp",
            medical: "Y tế",
            fire: "Hỏa hoạn",
            police: "Cảnh sát",
            other: "Khác",
          };
          return types[type] || type;
        }

        await mailService.sendEmail({
          to: adminEmails,
          subject: "🚨 Yêu Cầu Khẩn Cấp Mới - Autism Support",
          templateName: "EMERGENCY_NEW_REQUEST",
          templateData: {
            requestId: newRequest._id,
            userName: user ? user.fullName || user.username : "Người dùng",
            userEmail: user ? user.email : "Không có email",
            phoneNumber: newRequest.phoneNumber,
            type: newRequest.type,
            latitude: newRequest.latitude,
            longitude: newRequest.longitude,
            address: newRequest.address,
            message: newRequest.message,
            isSilent: newRequest.isSilent,
            status: newRequest.status,
            priority: newRequest.priority,
            createdAt: formatDateTime(newRequest.createdAt), // Thay moment bằng formatDateTime
            adminLink: `${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/admin/emergencies/${newRequest._id}`,
            mapLink: `https://maps.google.com/?q=${newRequest.latitude},${newRequest.longitude}`,
            adminName: "Quản trị viên",
            emergencyType: getEmergencyTypeLabel(newRequest.type),
          },
        });

        console.log(`✅ Đã gửi email đến ${admins.length} admin/supporter`);
      }
    } catch (emailError) {
      console.error("❌ Lỗi khi gửi email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Đã gửi tín hiệu SOS thành công",
      data: {
        requestId: newRequest._id,
        address,
        status: "pending",
        priority: "critical",
        createdAt: formatDateTimeForResponse(newRequest.createdAt), // Format cho response
      },
    });
  } catch (error) {
    console.error("Error sending SOS:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi gửi SOS",
      error: error.message,
    });
  }
});

// Helper functions riêng cho route này (có thể đặt ở trên cùng file)
function formatDateTimeForResponse(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

module.exports = router;
