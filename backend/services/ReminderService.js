// services/ReminderService.js
const cron = require("node-cron");
const Todo = require("../models/Todo");
const NotificationService = require("./NotificationService");
const mailService = require("../services/mailService");
const User = require("../models/User");

class ReminderService {
  constructor() {
    this.isRunning = false;
    this.job = null;
    this.reminderCache = new Map(); // Cache để tránh gửi trùng
  }

  // Hàm khởi động service
  start() {
    if (this.isRunning) {
      console.log("⚠️ ReminderService đã chạy rồi");
      return;
    }

    console.log("🚀 Đang khởi động ReminderService...");

    // Kiểm tra ngay lần đầu
    this.checkReminders();

    // Lập lịch chạy mỗi phút
    this.job = cron.schedule("* * * * *", () => {
      //   console.log("⏰ Đang kiểm tra reminders...");
      this.checkReminders();
    });

    this.isRunning = true;
    console.log("✅ ReminderService đã khởi động thành công");
  }

  // Hàm dừng service
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
    }

    this.isRunning = false;
    console.log("🛑 ReminderService đã dừng");
  }

  // Hàm chính kiểm tra reminders
  async checkReminders() {
    try {
      const now = new Date();

      // Tính thời điểm 5 phút sau
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      // console.log(
      //   `🔍 Tìm todos bắt đầu từ ${this.formatTime(now)} đến ${this.formatTime(
      //     fiveMinutesFromNow
      //   )}`
      // );

      // Tìm todos cần gửi reminder
      const todos = await Todo.find({
        start: {
          $gte: now, // Bắt đầu từ bây giờ
          $lte: fiveMinutesFromNow, // Đến 5 phút sau
        },
        reminderSent: false, // Chưa gửi reminder
        reminderEnabled: true,
        status: {
          $nin: ["cancelled", "done"], // Không phải đã hủy hoặc xong
        },
        hasCalendarEvent: true, // Chỉ sự kiện calendar
      })
        .populate("createdBy", "username email _id profile")
        .populate("attendees", "username email _id profile");

      //   console.log(`📋 Tìm thấy ${todos.length} todos cần gửi reminder`);

      // Gửi reminder cho từng todo
      for (const todo of todos) {
        await this.sendReminderForTodo(todo);
      }
    } catch (error) {
      console.error("❌ Lỗi khi kiểm tra reminders:", error);
      console.error("Chi tiết lỗi:", error.message);
    }
  }

  // Hàm gửi reminder cho một todo
  async sendReminderForTodo(todo) {
    try {
      console.log(`📤 Đang gửi reminder cho: "${todo.title}"`);

      // Tạo cache key để tránh gửi trùng
      const cacheKey = `todo_${todo._id}_${this.formatDateKey(todo.start)}`;

      if (this.reminderCache.has(cacheKey)) {
        console.log(`⏩ Đã gửi reminder cho todo này rồi: ${todo._id}`);
        return;
      }

      // Gửi cho người tạo

      await this.sendToUser(todo, todo.createdBy, "creator");

      if (todo.reminderType == "email" || todo.reminderType == "both") {
        let user = await User.findById(todo.createdBy._id);
        await sendTodoEmails(todo, todo.createdBy);
      }

      // Gửi cho những người tham dự
      if (todo.attendees && todo.attendees.length > 0) {
        console.log(`👥 Có ${todo.attendees.length} người tham dự`);

        for (const attendee of todo.attendees) {
          // Không gửi cho chính người tạo
          if (attendee._id.toString() !== todo.createdBy._id.toString()) {
            await this.sendToUser(todo, attendee, "attendee");
          }
        }
      }

      // Cập nhật database - ĐÁNH DẤU ĐÃ GỬI
      await Todo.updateOne(
        { _id: todo._id },
        {
          $set: {
            reminderSent: true,
            reminderSentAt: new Date(),
            lastReminderCheck: new Date(),
          },
        }
      );

      // Lưu vào cache
      this.reminderCache.set(cacheKey, true);

      console.log(`✅ Đã gửi reminder cho todo: "${todo.title}"`);
    } catch (error) {
      console.error(`❌ Lỗi khi gửi reminder cho todo ${todo._id}:`, error);

      // Lưu lỗi vào database
      await Todo.updateOne(
        { _id: todo._id },
        {
          $set: {
            reminderError: error.message,
          },
        }
      );
    }
  }

  // Hàm gửi thông báo cho một người dùng
  async sendToUser(todo, user, userType) {
    try {
      // Tính thời gian còn lại
      const startTime = new Date(todo.start);
      const now = new Date();
      const minutesLeft = Math.floor((startTime - now) / (1000 * 60));

      // Format thời gian đẹp
      const timeStr = this.formatTime(startTime);
      const dateStr = this.formatDate(startTime);

      let message = "";

      if (minutesLeft <= 0) {
        message = `"${todo.title}" đang diễn ra ngay bây giờ!`;
      } else if (minutesLeft === 1) {
        message = `"${todo.title}" bắt đầu sau 1 phút nữa!`;
      } else {
        message = `"${todo.title}" bắt đầu sau ${minutesLeft} phút nữa (lúc ${timeStr})`;
      }

      if (todo.location) {
        message += ` tại ${todo.location}`;
      }

      // Tạo notification data
      const notificationData = {
        recipient: user._id,
        type: "TODO_REMINDER",
        title: `⏰ Nhắc nhở: ${todo.title}`,
        message: message,
        priority: todo.priority === "high" ? "high" : "medium",
        data: {
          todoId: todo._id.toString(),
          todoTitle: todo.title,
          startTime: todo.start,
          endTime: todo.end,
          location: todo.location || "",
          type: todo.type,
          color: todo.color,
          userType: userType,
          minutesLeft: minutesLeft,
          date: dateStr,
          time: timeStr,
          url: `/calendar/event/${todo._id}`,
        },
        url: `/calendar/event/${todo._id}`,
      };

      // Gửi notification
      await NotificationService.createAndEmitNotification(notificationData);

      console.log(
        `   👤 Đã gửi cho ${userType}: ${user.username || user.email}`
      );
    } catch (error) {
      console.error(`   ❌ Lỗi khi gửi cho user ${user._id}:`, error.message);
      throw error;
    }
  }

  // ========== HÀM HELPER THAY THẾ MOMENT ==========

  // Format time: HH:mm
  formatTime(date) {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Format date: DD/MM/YYYY
  formatDate(date) {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Format date key for cache: YYYY-MM-DD HH:mm
  formatDateKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // Format relative time (tương tự moment.fromNow())
  formatRelativeTime(date) {
    const now = new Date();
    const diffMs = new Date(date) - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "ngay bây giờ";
    if (diffMins < 60) return `${diffMins} phút nữa`;
    if (diffHours < 24) return `${diffHours} giờ nữa`;
    if (diffDays === 1) return "ngày mai";
    if (diffDays < 7) return `${diffDays} ngày nữa`;

    // Nếu quá 7 ngày, hiển thị ngày tháng
    return this.formatDate(date);
  }

  // Hàm kiểm tra trạng thái
  getStatus() {
    return {
      isRunning: this.isRunning,
      cacheSize: this.reminderCache.size,
      lastCheck: new Date().toISOString(),
    };
  }
}

async function sendTodoEmails(todo, user) {
  try {
    // 1. Gửi email cho người đăng bài
    await mailService.sendEmail({
      to: user.email,
      subject: "⏰ Nhắc việc Todo phải làm",
      templateName: "TODO_REMINDER",
      templateData: {
        userName: user.fullName,
        title: todo.title || "công việc",
        description: todo.description || "",
        type: todo.type || "",
        priority: todo.priority || "",
        status: todo.status || "",
        dueDate: todo.dueDate?.toLocaleString() || "",
        start: todo.start?.toLocaleString() || "",
        end: todo.end?.toLocaleString() || "",
        location: todo.location || "",
        subtasks: todo.subtasks || [],
        isOverdue: false,
        todoLink: `${process.env.CLIENT_URL}/todos/${todo._id}`,
        supportEmail: "support@autismsupport.vn",
      },
    });
  } catch (error) {
    console.error("❌ Lỗi gửi email thông báo vi phạm:", error);
  }
}

// Export instance duy nhất
module.exports = new ReminderService();
