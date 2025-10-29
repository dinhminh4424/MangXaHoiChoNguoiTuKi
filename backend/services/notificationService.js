const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../config/socket");

class NotificationService {
  static async createAndEmitNotification(notificationData) {
    try {
      // Tạo thông báo trong database
      const notification = new Notification(notificationData);
      await notification.save();

      // Populate thông tin cần thiết
      await notification.populate([
        { path: "recipient", select: "username fullName profile.avatar" },
        { path: "sender", select: "username fullName profile.avatar" },
      ]);

      // Emit real-time notification
      const io = getIO();

      // Gửi cho người nhận cụ thể
      io.to(`user_${notification.recipient._id}`).emit(
        "new_notification",
        notification
      );

      return notification;
    } catch (error) {
      console.error("Error creating and emitting notification:", error);
      throw error;
    }
  }

  static async emitNotificationToAdmins(notificationData) {
    try {
      // Lấy tất cả admin users
      const admins = await User.find({
        role: { $in: ["admin", "supporter"] },
        active: true,
      });

      if (admins.length === 0) {
        console.log("No admin users found");
        return;
      }

      const notifications = [];
      const io = getIO();

      // Tạo thông báo cho từng admin
      for (const admin of admins) {
        const notification = new Notification({
          ...notificationData,
          recipient: admin._id, // Gán recipient là admin ID
          sender: notificationData.sender || null,
        });

        await notification.save();
        notifications.push(notification);

        // Populate thông tin
        await notification.populate([
          { path: "recipient", select: "username fullName profile.avatar" },
          { path: "sender", select: "username fullName profile.avatar" },
        ]);

        // Gửi real-time notification cho admin cụ thể
        io.to(`user_${admin._id}`).emit("new_notification", notification);
      }

      // Gửi broadcast đến admin notifications room
      io.to("admin_notifications").emit("admin_notification", {
        ...notificationData,
        recipients: admins.map((admin) => admin._id),
        notificationCount: notifications.length,
      });

      console.log(`✅ Sent notification to ${admins.length} admins`);
      return notifications;
    } catch (error) {
      console.error("Error emitting admin notification:", error);
      throw error;
    }
  }

  // Method mới: Gửi thông báo cho multiple recipients
  static async emitNotificationToMultipleUsers(userIds, notificationData) {
    try {
      const notifications = [];
      const io = getIO();

      for (const userId of userIds) {
        const notification = new Notification({
          ...notificationData,
          recipient: userId,
        });

        await notification.save();

        await notification.populate([
          { path: "recipient", select: "username fullName profile.avatar" },
          { path: "sender", select: "username fullName profile.avatar" },
        ]);

        notifications.push(notification);

        // Gửi real-time notification
        io.to(`user_${userId}`).emit("new_notification", notification);
      }

      return notifications;
    } catch (error) {
      console.error("Error emitting notifications to multiple users:", error);
      throw error;
    }
  }
}

module.exports = NotificationService;
