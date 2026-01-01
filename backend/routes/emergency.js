// const express = require("express");
// const router = express.Router();
// const EmergencyRequest = require("../models/EmergencyRequest");
// const User = require("../models/User");
// const NotificationService = require("../services/notificationService");
// const mailService = require("../services/mailService");
// const fetch = (...args) =>
//   import("node-fetch").then(({ default: fetch }) => fetch(...args));

// const auth = require("../middleware/auth");

// router.use(auth);

// // ✅ Hàm lấy địa chỉ cụ thể từ toạ độ (reverse geocoding)
// async function getAddressFromCoordinates(lat, lon) {
//   try {
//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//     );
//     const data = await response.json();
//     return data.display_name || "Không xác định vị trí";
//   } catch (error) {
//     console.error("Lỗi lấy địa chỉ:", error);
//     return "Không xác định vị trí";
//   }
// }

// // Gửi SOS
// router.post("/sos", async (req, res) => {
//   console.log("📩 Nhận tín hiệu SOS:", req.body);
//   try {
//     const {
//       phoneNumber,
//       latitude,
//       longitude,
//       message,
//       type = "panic",
//       isSilent = false,
//       deviceInfo = {},
//     } = req.body;

//     const userId = req.user?._id || req.user?.userId;

//     if (!latitude || !longitude)
//       return res
//         .status(400)
//         .json({ success: false, message: "Thiếu thông tin vị trí!" });

//     // ✅ Lấy địa chỉ cụ thể từ OpenStreetMap
//     const address = await getAddressFromCoordinates(latitude, longitude);
//     console.log("📍 Địa chỉ xác định:", address);

//     // 1️⃣ Lấy thông tin người dùng
//     let user = null;
//     if (userId) {
//       try {
//         user = await User.findById(userId).select(
//           "username fullName email profile.avatar isOnline"
//         );
//       } catch (error) {
//         console.log("Không tìm thấy user với userId:", userId);
//       }
//     }

//     // 2️⃣ Lưu yêu cầu khẩn cấp với cấu trúc mới
//     const newRequest = new EmergencyRequest({
//       userId: userId || null,
//       phoneNumber,
//       latitude,
//       longitude,
//       locationAccuracy: deviceInfo.locationAccuracy || null,
//       address,
//       message,
//       type,
//       isSilent,
//       status: "pending",
//       priority: "critical", // Mặc định là khẩn cấp
//       deviceInfo: {
//         battery: deviceInfo.battery,
//         network: deviceInfo.network,
//         os: deviceInfo.os,
//         appVersion: deviceInfo.appVersion,
//       },
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     await newRequest.save();

//     // 3️⃣ Gửi thông báo cho tất cả admin/supporter
//     try {
//       const userName = user
//         ? user.fullName || user.username
//         : phoneNumber || "Người dùng ẩn danh";
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
//           priority: "critical",
//           adminUrl: `${
//             process.env.FRONTEND_URL || "http://localhost:3000"
//           }/admin/emergencies/${newRequest._id}`,
//         },
//         url: `/admin/emergencies/${newRequest._id}`,
//         sender: user ? user._id : null,
//       });

//       console.log("✅ Đã gửi thông báo SOS cho admin/supporter");
//     } catch (notificationError) {
//       console.error("❌ Lỗi khi gửi thông báo cho admin:", notificationError);
//     }

//     // 4️⃣ Gửi email đến admin/supporter
//     try {
//       const admins = await User.find({
//         role: { $in: ["admin", "supporter", "doctor"] },
//         email: { $exists: true, $ne: "" },
//         active: true,
//       });

//       if (admins.length > 0) {
//         const adminEmails = admins.map((admin) => admin.email);

//         // Helper function để format date
//         function formatDateTime(date) {
//           if (!date) return "";
//           const d = new Date(date);
//           const day = String(d.getDate()).padStart(2, "0");
//           const month = String(d.getMonth() + 1).padStart(2, "0");
//           const year = d.getFullYear();
//           const hours = String(d.getHours()).padStart(2, "0");
//           const minutes = String(d.getMinutes()).padStart(2, "0");
//           const seconds = String(d.getSeconds()).padStart(2, "0");
//           return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
//         }

//         // Helper function để get emergency type label
//         function getEmergencyTypeLabel(type) {
//           const types = {
//             panic: "Khẩn cấp",
//             medical: "Y tế",
//             fire: "Hỏa hoạn",
//             police: "Cảnh sát",
//             other: "Khác",
//           };
//           return types[type] || type;
//         }

//         await mailService.sendEmail({
//           to: adminEmails,
//           subject: "🚨 Yêu Cầu Khẩn Cấp Mới - Autism Support",
//           templateName: "EMERGENCY_NEW_REQUEST",
//           templateData: {
//             requestId: newRequest._id,
//             userName: user ? user.fullName || user.username : "Người dùng",
//             userEmail: user ? user.email : "Không có email",
//             phoneNumber: newRequest.phoneNumber,
//             type: newRequest.type,
//             latitude: newRequest.latitude,
//             longitude: newRequest.longitude,
//             address: newRequest.address,
//             message: newRequest.message,
//             isSilent: newRequest.isSilent,
//             status: newRequest.status,
//             priority: newRequest.priority,
//             createdAt: formatDateTime(newRequest.createdAt), // Thay moment bằng formatDateTime
//             adminLink: `${
//               process.env.FRONTEND_URL || "http://localhost:3000"
//             }/admin/emergencies/${newRequest._id}`,
//             mapLink: `https://maps.google.com/?q=${newRequest.latitude},${newRequest.longitude}`,
//             adminName: "Quản trị viên",
//             emergencyType: getEmergencyTypeLabel(newRequest.type),
//           },
//         });

//         console.log(`✅ Đã gửi email đến ${admins.length} admin/supporter`);
//       }
//     } catch (emailError) {
//       console.error("❌ Lỗi khi gửi email:", emailError);
//     }

//     res.status(200).json({
//       success: true,
//       message: "Đã gửi tín hiệu SOS thành công",
//       data: {
//         requestId: newRequest._id,
//         address,
//         status: "pending",
//         priority: "critical",
//         createdAt: formatDateTimeForResponse(newRequest.createdAt), // Format cho response
//       },
//     });
//   } catch (error) {
//     console.error("Error sending SOS:", error);
//     res.status(500).json({
//       success: false,
//       message: "Lỗi hệ thống khi gửi SOS",
//       error: error.message,
//     });
//   }
// });

// // Helper functions riêng cho route này (có thể đặt ở trên cùng file)
// function formatDateTimeForResponse(date) {
//   if (!date) return null;
//   const d = new Date(date);
//   return d.toLocaleDateString("vi-VN", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false,
//   });
// }

// module.exports = router;

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

// Helper function format datetime cho response
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

// 🚨 Hàm gửi thông báo đến liên hệ khẩn cấp
async function notifyEmergencyContacts(userId, emergencyData) {
  try {
    // Lấy thông tin người dùng và liên hệ khẩn cấp
    const user = await User.findById(userId).select(
      "username fullName email emergencyContacts profile.phone profile.avatar"
    );

    if (
      !user ||
      !user.emergencyContacts ||
      user.emergencyContacts.length === 0
    ) {
      console.log("⚠️ Người dùng không có liên hệ khẩn cấp");
      return { notified: 0, contacts: [], success: false };
    }

    const contacts = user.emergencyContacts;
    const notificationResults = [];
    const now = new Date();
    let successCount = 0;

    console.log(
      `📱 Bắt đầu gửi thông báo đến ${contacts.length} liên hệ khẩn cấp`
    );

    // Tạo nội dung thông báo chung
    const userName = user.fullName || user.username || "Người dùng";
    const userPhone = user.profile?.phone || "Không có";
    const emergencyType = getEmergencyTypeLabel(emergencyData.type);
    const googleMapsLink = `https://www.google.com/maps?q=${emergencyData.latitude},${emergencyData.longitude}`;
    const what3wordsLink = `https://what3words.com/${emergencyData.latitude},${emergencyData.longitude}`;

    for (const contact of contacts) {
      try {
        // Cập nhật thời gian thông báo cuối cùng
        contact.lastNotified = now;

        // Gửi email nếu có email và liên hệ có priority cao/medium
        if (contact.email && contact.priority !== "low") {
          try {
            const emailData = {
              contactName: contact.name,
              userName: userName,
              userPhone: userPhone,
              emergencyType: emergencyType,
              address: emergencyData.address,
              mapLink: `https://maps.google.com/?q=${emergencyData.latitude},${emergencyData.longitude}`,
              message: emergencyData.message || "Cần hỗ trợ khẩn cấp",
              timestamp: formatDateTime(now),
              googleMapsLink: googleMapsLink,
              what3wordsLink: what3wordsLink,
              actionRequired:
                "Vui lòng liên hệ ngay với người này hoặc gọi 113 nếu cần thiết",
              relationship: contact.relationship,
              priority: contact.priority || "medium",
            };

            // Gửi email khẩn cấp
            const emailResult = await mailService.sendEmail({
              to: contact.email,
              subject: `🚨 KHẨN CẤP: ${userName} cần trợ giúp!`,
              templateName: "EMERGENCY_CONTACT_NOTIFICATION",
              templateData: emailData,
            });

            if (emailResult.success) {
              console.log(
                `📧 Đã gửi email đến ${contact.name} (${contact.email})`
              );
              successCount++;

              notificationResults.push({
                contactId: contact._id,
                name: contact.name,
                email: contact.email,
                method: "email",
                status: "sent",
                priority: contact.priority || "medium",
                timestamp: now,
              });
            } else {
              console.log(
                `❌ Gửi email thất bại đến ${contact.email}:`,
                emailResult.error
              );
              notificationResults.push({
                contactId: contact._id,
                name: contact.name,
                email: contact.email,
                method: "email",
                status: "failed",
                error: emailResult.error,
              });
            }
          } catch (emailError) {
            console.error(`❌ Lỗi gửi email đến ${contact.email}:`, emailError);
            notificationResults.push({
              contactId: contact._id,
              name: contact.name,
              email: contact.email,
              method: "email",
              status: "failed",
              error: emailError.message,
            });
          }
        }

        // Gửi thông báo trong ứng dụng (push notification)
        try {
          // Nếu liên hệ cũng là người dùng trong hệ thống
          const contactUser = await User.findOne({ email: contact.email });
          if (contactUser && contactUser._id) {
            await NotificationService.createAndEmitNotification({
              recipient: contactUser._id,
              sender: user._id,
              type: "EMERGENCY_ALERT_CONTACT",
              title: `🚨 ${userName} cần trợ giúp khẩn cấp!`,
              message: `${userName} đã kích hoạt báo động SOS. Vị trí: ${emergencyData.address}`,
              data: {
                emergencyRequestId: emergencyData.requestId,
                userId: user._id,
                userName: userName,
                latitude: emergencyData.latitude,
                longitude: emergencyData.longitude,
                address: emergencyData.address,
                message: emergencyData.message,
                type: emergencyData.type,
                mapUrl: googleMapsLink,
                priority: "critical",
              },
              priority: "urgent",
              url: `/emergency/${emergencyData.requestId}`,
            });

            console.log(`📱 Đã gửi thông báo trong app đến ${contact.name}`);
          }
        } catch (notificationError) {
          console.error(
            `❌ Lỗi gửi thông báo app đến ${contact.name}:`,
            notificationError
          );
        }
      } catch (contactError) {
        console.error(`❌ Lỗi xử lý liên hệ ${contact.name}:`, contactError);
        notificationResults.push({
          contactId: contact._id,
          name: contact.name,
          status: "failed",
          error: contactError.message,
        });
      }
    }

    // Lưu cập nhật thời gian thông báo
    await user.save();

    console.log(
      `✅ Đã xử lý ${contacts.length} liên hệ, ${successCount} thành công`
    );

    return {
      notified: successCount,
      totalContacts: contacts.length,
      contacts: notificationResults,
      success: successCount > 0,
    };
  } catch (error) {
    console.error("❌ Lỗi trong notifyEmergencyContacts:", error);
    return {
      notified: 0,
      contacts: [],
      success: false,
      error: error.message,
    };
  }
}

// 🚨 API gửi SOS
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
          "username fullName email profile.avatar isOnline emergencyContacts"
        );
      } catch (error) {
        console.log("Không tìm thấy user với userId:", userId);
      }
    }

    // 2️⃣ Lưu yêu cầu khẩn cấp
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
      priority: "critical",
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

    // Tạo object emergency data để gửi đi
    const emergencyData = {
      requestId: newRequest._id.toString(),
      userId: userId,
      latitude,
      longitude,
      address,
      message,
      type,
      phoneNumber,
      timestamp: new Date(),
    };

    // 3️⃣ Gửi thông báo đến liên hệ khẩn cấp (nếu có user)
    let emergencyContactsResult = null;
    if (userId && user) {
      emergencyContactsResult = await notifyEmergencyContacts(
        userId,
        emergencyData
      );
      console.log(
        "📞 Kết quả gửi đến liên hệ khẩn cấp:",
        emergencyContactsResult
      );
    }

    // 4️⃣ Gửi thông báo cho tất cả admin/supporter
    try {
      const userName = user
        ? user.fullName || user.username
        : phoneNumber || "Người dùng ẩn danh";
      const notificationMessage = `Người dùng ${userName} vừa gửi tín hiệu SOS khẩn cấp! ${
        message ? `Tin nhắn: ${message}` : ""
      }`;

      // Tạo data thông báo cho admin
      const adminNotificationData = {
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
        emergencyContactsNotified: emergencyContactsResult
          ? emergencyContactsResult.notified
          : 0,
        totalEmergencyContacts: emergencyContactsResult
          ? emergencyContactsResult.totalContacts
          : 0,
      };

      await NotificationService.emitNotificationToAdmins({
        type: "SOS_EMERGENCY",
        title: "🚨 Tín hiệu SOS khẩn cấp",
        message: notificationMessage,
        priority: "urgent",
        data: adminNotificationData,
        url: `/admin/emergencies/${newRequest._id}`,
        sender: user ? user._id : null,
      });

      console.log("✅ Đã gửi thông báo SOS cho admin/supporter");
    } catch (notificationError) {
      console.error("❌ Lỗi khi gửi thông báo cho admin:", notificationError);
    }

    // 5️⃣ Gửi email đến admin/supporter
    try {
      const admins = await User.find({
        role: { $in: ["admin", "supporter", "doctor"] },
        email: { $exists: true, $ne: "" },
        active: true,
      });

      if (admins.length > 0) {
        const adminEmails = admins.map((admin) => admin.email);

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
            createdAt: formatDateTime(newRequest.createdAt),
            adminLink: `${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/admin/emergencies/${newRequest._id}`,
            mapLink: `https://maps.google.com/?q=${newRequest.latitude},${newRequest.longitude}`,
            adminName: "Quản trị viên",
            emergencyType: getEmergencyTypeLabel(newRequest.type),
            emergencyContactsNotified: emergencyContactsResult
              ? emergencyContactsResult.notified
              : 0,
            totalEmergencyContacts: emergencyContactsResult
              ? emergencyContactsResult.totalContacts
              : 0,
            emergencyContactsInfo: emergencyContactsResult
              ? `Đã gửi thông báo đến ${emergencyContactsResult.notified}/${emergencyContactsResult.totalContacts} liên hệ khẩn cấp`
              : "Người dùng không có liên hệ khẩn cấp",
          },
        });

        console.log(`✅ Đã gửi email đến ${admins.length} admin/supporter`);
      }
    } catch (emailError) {
      console.error("❌ Lỗi khi gửi email:", emailError);
    }

    // 6️⃣ Gửi thông báo cho chính người dùng (xác nhận)
    if (userId) {
      try {
        await NotificationService.createAndEmitNotification({
          recipient: userId,
          sender: userId,
          type: "SOS_CONFIRMATION",
          title: "✅ Đã gửi tín hiệu SOS thành công",
          message: `Yêu cầu khẩn cấp của bạn đã được gửi. ${
            emergencyContactsResult
              ? `Đã thông báo đến ${emergencyContactsResult.notified} liên hệ khẩn cấp.`
              : "Đang chờ hỗ trợ từ đội ngũ."
          }`,
          data: {
            emergencyRequestId: newRequest._id.toString(),
            address: address,
            status: "pending",
            contactsNotified: emergencyContactsResult
              ? emergencyContactsResult.notified
              : 0,
            adminNotified: true,
          },
          priority: "high",
          url: `/emergency/status/${newRequest._id}`,
        });
      } catch (userNotificationError) {
        console.error(
          "❌ Lỗi gửi thông báo xác nhận cho user:",
          userNotificationError
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Đã gửi tín hiệu SOS thành công",
      data: {
        requestId: newRequest._id,
        address,
        status: "pending",
        priority: "critical",
        createdAt: formatDateTimeForResponse(newRequest.createdAt),
        emergencyContacts: emergencyContactsResult
          ? {
              notified: emergencyContactsResult.notified,
              total: emergencyContactsResult.totalContacts,
              success: emergencyContactsResult.success,
            }
          : null,
        adminNotified: true,
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

// 📋 API lấy lịch sử SOS của người dùng
router.get("/history", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    const query = { userId: userId };
    const total = await EmergencyRequest.countDocuments(query);

    const history = await EmergencyRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("_id type status address message createdAt priority");

    res.json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting SOS history:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử SOS",
      error: error.message,
    });
  }
});

// 📍 API lấy chi tiết một yêu cầu SOS
router.get("/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id || req.user?.userId;

    const request = await EmergencyRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu khẩn cấp",
      });
    }

    // Kiểm tra quyền truy cập: chỉ chủ yêu cầu hoặc admin/supporter
    const isOwner = request.userId && request.userId.toString() === userId;
    const isAdmin =
      req.user?.role === "admin" ||
      req.user?.role === "supporter" ||
      req.user?.role === "doctor";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập yêu cầu này",
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Error getting SOS details:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết SOS",
      error: error.message,
    });
  }
});

module.exports = router;
