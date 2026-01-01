// controllers/emergencyContactController.js
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
const { logUserActivity } = require("../logging/userActivityLogger");

class EmergencyContactController {
  // [GET] /api/users/:userId/emergency-contacts - Lấy danh sách liên hệ khẩn cấp
  async getContacts(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;

      // Kiểm tra quyền truy cập: chỉ chủ tài khoản hoặc admin
      const isOwner = currentUserId === userId;
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập danh sách liên hệ khẩn cấp",
        });
      }

      const user = await User.findById(userId).select(
        "emergencyContacts fullName username"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Log hoạt động
      logUserActivity({
        action: "emergency_contacts.view",
        req,
        res,
        userId: currentUserId,
        role: req.user.role,
        target: { type: "user", id: userId },
        description: "Xem danh sách liên hệ khẩn cấp",
        payload: {
          contactCount: user.emergencyContacts.length,
          isSelf: isOwner,
        },
        meta: { source: "api" },
      });

      res.json({
        success: true,
        data: user.emergencyContacts,
      });
    } catch (error) {
      console.error("Error getting emergency contacts:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách liên hệ khẩn cấp",
        error: error.message,
      });
    }
  }

  // [POST] /api/users/:userId/emergency-contacts - Thêm liên hệ khẩn cấp mới
  async addContact(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;

      // Chỉ cho phép chủ tài khoản thêm liên hệ
      if (currentUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có thể thêm liên hệ khẩn cấp cho tài khoản của mình",
        });
      }

      const {
        name,
        email,
        phone,
        relationship,
        priority = "medium",
      } = req.body;

      // Validate dữ liệu
      if (!name || !phone || !relationship) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng cung cấp đầy đủ thông tin: tên, số điện thoại và mối quan hệ",
        });
      }

      // Validate số điện thoại (cơ bản)
      const phoneRegex = /^(0|\+84)[1-9][0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam",
        });
      }

      // Validate email nếu có
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Email không hợp lệ",
          });
        }
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Kiểm tra giới hạn số lượng liên hệ (tối đa 5)
      if (user.emergencyContacts.length >= 5) {
        return res.status(400).json({
          success: false,
          message:
            "Đã đạt giới hạn 5 liên hệ khẩn cấp. Vui lòng xóa bớt để thêm mới",
        });
      }

      // Kiểm tra trùng số điện thoại
      const existingPhone = user.emergencyContacts.find(
        (contact) => contact.phone === phone
      );
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message:
            "Số điện thoại này đã tồn tại trong danh sách liên hệ khẩn cấp",
        });
      }

      // Tạo đối tượng liên hệ mới
      const newContact = {
        name: name.trim(),
        email: email ? email.trim() : "",
        phone: phone.trim(),
        relationship,
        priority,
        addedAt: new Date(),
      };

      // Thêm vào danh sách
      user.emergencyContacts.push(newContact);
      await user.save();

      // Log hoạt động
      logUserActivity({
        action: "emergency_contacts.add",
        req,
        res,
        userId: currentUserId,
        role: req.user.role,
        target: { type: "emergency_contact", id: "new" },
        description: "Thêm liên hệ khẩn cấp mới",
        payload: {
          contactName: name,
          relationship,
          phone,
          hasEmail: !!email,
        },
        meta: { source: "api", sensitive: true },
      });

      // Gửi thông báo (tùy chọn)
      await NotificationService.createAndEmitNotification({
        recipient: currentUserId,
        sender: currentUserId,
        type: "EMERGENCY_CONTACT_ADDED",
        title: "Đã thêm liên hệ khẩn cấp",
        message: `Đã thêm ${name} vào danh sách liên hệ khẩn cấp của bạn`,
        data: {
          contactName: name,
          relationship,
          phone,
        },
        priority: "medium",
        url: `/profile/emergency`,
      });

      res.json({
        success: true,
        message: "Thêm liên hệ khẩn cấp thành công",
        data: newContact,
      });
    } catch (error) {
      console.error("Error adding emergency contact:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm liên hệ khẩn cấp",
        error: error.message,
      });
    }
  }

  // [PUT] /api/users/:userId/emergency-contacts/:contactId - Cập nhật liên hệ khẩn cấp
  async updateContact(req, res) {
    try {
      const { userId, contactId } = req.params;
      const currentUserId = req.user.userId;

      // Chỉ cho phép chủ tài khoản cập nhật
      if (currentUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có thể cập nhật liên hệ khẩn cấp của tài khoản mình",
        });
      }

      const { name, email, phone, relationship, priority } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Tìm contact cần cập nhật
      const contactIndex = user.emergencyContacts.findIndex(
        (contact) => contact._id.toString() === contactId
      );

      if (contactIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Liên hệ khẩn cấp không tồn tại",
        });
      }

      // Validate số điện thoại nếu có thay đổi
      if (phone) {
        const phoneRegex = /^(0|\+84)[1-9][0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            success: false,
            message: "Số điện thoại không hợp lệ",
          });
        }

        // Kiểm tra trùng số điện thoại với các contact khác
        const existingPhone = user.emergencyContacts.find(
          (contact, index) => index !== contactIndex && contact.phone === phone
        );
        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message:
              "Số điện thoại này đã tồn tại trong danh sách liên hệ khẩn cấp",
          });
        }
      }

      // Cập nhật thông tin
      const updatedContact = user.emergencyContacts[contactIndex];

      if (name) updatedContact.name = name.trim();
      if (email !== undefined) updatedContact.email = email.trim();
      if (phone) updatedContact.phone = phone.trim();
      if (relationship) updatedContact.relationship = relationship;
      if (priority) updatedContact.priority = priority;
      updatedContact.updatedAt = new Date();

      await user.save();

      // Log hoạt động
      logUserActivity({
        action: "emergency_contacts.update",
        req,
        res,
        userId: currentUserId,
        role: req.user.role,
        target: { type: "emergency_contact", id: contactId },
        description: "Cập nhật liên hệ khẩn cấp",
        payload: {
          updatedFields: Object.keys(req.body),
          contactName: updatedContact.name,
        },
        meta: { source: "api", sensitive: true },
      });

      res.json({
        success: true,
        message: "Cập nhật liên hệ khẩn cấp thành công",
        data: updatedContact,
      });
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật liên hệ khẩn cấp",
        error: error.message,
      });
    }
  }

  // [DELETE] /api/users/:userId/emergency-contacts/:contactId - Xóa liên hệ khẩn cấp
  async deleteContact(req, res) {
    try {
      const { userId, contactId } = req.params;
      const currentUserId = req.user.userId;

      // Chỉ cho phép chủ tài khoản xóa
      if (currentUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có thể xóa liên hệ khẩn cấp của tài khoản mình",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Tìm contact cần xóa
      const contactIndex = user.emergencyContacts.findIndex(
        (contact) => contact._id.toString() === contactId
      );

      if (contactIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Liên hệ khẩn cấp không tồn tại",
        });
      }

      const deletedContact = user.emergencyContacts[contactIndex];

      // Xóa contact
      user.emergencyContacts.splice(contactIndex, 1);
      await user.save();

      // Log hoạt động
      logUserActivity({
        action: "emergency_contacts.delete",
        req,
        res,
        userId: currentUserId,
        role: req.user.role,
        target: { type: "emergency_contact", id: contactId },
        description: "Xóa liên hệ khẩn cấp",
        payload: {
          contactName: deletedContact.name,
          relationship: deletedContact.relationship,
        },
        meta: { source: "api", sensitive: true },
      });

      // Gửi thông báo
      await NotificationService.createAndEmitNotification({
        recipient: currentUserId,
        sender: currentUserId,
        type: "EMERGENCY_CONTACT_REMOVED",
        title: "Đã xóa liên hệ khẩn cấp",
        message: `Đã xóa ${deletedContact.name} khỏi danh sách liên hệ khẩn cấp`,
        data: {
          contactName: deletedContact.name,
        },
        priority: "medium",
        url: `/profile/emergency`,
      });

      res.json({
        success: true,
        message: "Xóa liên hệ khẩn cấp thành công",
        data: deletedContact,
      });
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa liên hệ khẩn cấp",
        error: error.message,
      });
    }
  }

  // [POST] /api/users/:userId/emergency-contacts/notify - Gửi thông báo khẩn cấp
  async notifyContacts(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;
      const { message, emergencyType = "general", location } = req.body;

      // Chỉ cho phép chủ tài khoản gửi thông báo
      if (currentUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có thể gửi thông báo khẩn cấp từ tài khoản của mình",
        });
      }

      const user = await User.findById(userId).select(
        "emergencyContacts fullName username profile"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      if (user.emergencyContacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Bạn chưa có liên hệ khẩn cấp nào để gửi thông báo",
        });
      }

      // Lưu thời gian thông báo cuối cùng
      user.emergencyContacts.forEach((contact) => {
        contact.lastNotified = new Date();
      });
      await user.save();

      // Gửi thông báo đến các liên hệ (giả lập - trong thực tế sẽ gửi SMS/Email)
      const notificationResults = user.emergencyContacts.map((contact) => {
        return {
          contactName: contact.name,
          phone: contact.phone,
          email: contact.email,
          status: "notified", // Giả lập
          notificationType: contact.email ? "email" : "sms",
        };
      });

      // Log hoạt động khẩn cấp
      logUserActivity({
        action: "emergency_contacts.notify",
        req,
        res,
        userId: currentUserId,
        role: req.user.role,
        target: { type: "emergency_contacts", id: "all" },
        description: "Gửi thông báo khẩn cấp đến các liên hệ",
        payload: {
          emergencyType,
          messageLength: message?.length || 0,
          contactsNotified: notificationResults.length,
          hasLocation: !!location,
        },
        meta: { source: "api", sensitive: true, critical: true },
      });

      // Tạo thông báo trong hệ thống
      await NotificationService.createAndEmitNotification({
        recipient: currentUserId,
        sender: currentUserId,
        type: "EMERGENCY_NOTIFICATION_SENT",
        title: "Đã gửi thông báo khẩn cấp",
        message: `Đã gửi thông báo khẩn cấp đến ${notificationResults.length} liên hệ`,
        data: {
          emergencyType,
          contactsNotified: notificationResults.length,
          timestamp: new Date(),
        },
        priority: "urgent",
        url: `/profile/emergency`,
      });

      res.json({
        success: true,
        message: "Đã gửi thông báo khẩn cấp đến các liên hệ",
        data: {
          contactsNotified: notificationResults.length,
          results: notificationResults,
          emergencyDetails: {
            type: emergencyType,
            message: message || "Cần hỗ trợ khẩn cấp",
            location: location || "Không xác định",
            timestamp: new Date(),
            userName: user.fullName || user.username,
            userPhone: user.profile?.phone || "Không có",
          },
        },
      });
    } catch (error) {
      console.error("Error notifying emergency contacts:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi gửi thông báo khẩn cấp",
        error: error.message,
      });
    }
  }

  // [GET] /api/users/:userId/emergency-contacts/stats - Thống kê liên hệ khẩn cấp
  async getStats(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;

      // Kiểm tra quyền truy cập
      const isOwner = currentUserId === userId;
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập thống kê liên hệ khẩn cấp",
        });
      }

      const user = await User.findById(userId).select("emergencyContacts");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      const contacts = user.emergencyContacts;

      // Thống kê
      const stats = {
        totalContacts: contacts.length,
        contactsWithEmail: contacts.filter((c) => c.email).length,
        contactsWithPhone: contacts.filter((c) => c.phone).length,
        relationshipDistribution: {},
        priorityDistribution: {
          high: 0,
          medium: 0,
          low: 0,
        },
        recentlyNotified: contacts.filter((c) => {
          if (!c.lastNotified) return false;
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return c.lastNotified > oneWeekAgo;
        }).length,
        oldestContact:
          contacts.length > 0
            ? contacts.reduce((oldest, current) =>
                oldest.addedAt < current.addedAt ? oldest : current
              )
            : null,
      };

      // Phân phối mối quan hệ
      contacts.forEach((contact) => {
        stats.relationshipDistribution[contact.relationship] =
          (stats.relationshipDistribution[contact.relationship] || 0) + 1;

        if (contact.priority) {
          stats.priorityDistribution[contact.priority] =
            (stats.priorityDistribution[contact.priority] || 0) + 1;
        }
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting emergency contacts stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê liên hệ khẩn cấp",
        error: error.message,
      });
    }
  }
}

module.exports = new EmergencyContactController();
