const socketIo = require("socket.io");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");
const User = require("../models/User");

let io;
const configureSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User join các room chat của họ
    socket.on("join_chats", async (userId) => {
      try {
        const chats = await Chat.find({ members: userId });
        chats.forEach((chat) => {
          socket.join(chat._id.toString());
        });
        console.log(`User ${userId} joined ${chats.length} chats`);
      } catch (error) {
        console.error("Error joining chats:", error);
        socket.emit("error", { message: "Lỗi khi tham gia chats" });
      }
    });

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(chatId);
      console.log(`User left chat: ${chatId}`);
    });

    // gửi tin
    socket.on("send_message", async (data) => {
      try {
        const {
          chatId,
          content,
          sender,
          messageType = "text",
          fileUrl,
          fileName,
          fileSize,
          repliedTo,
        } = data;

        // Kiểm tra chat tồn tại
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("message_error", {
            message: "Cuộc trò chuyện không tồn tại",
          });
          return;
        }

        // Lưu tin nhắn vào database
        const message = new Message({
          chatId: chatId,
          sender: sender.id,
          content,
          messageType,
          fileUrl,
          fileName,
          fileSize,
          isReadBy: [sender.id],
          repliedTo,
        });

        await message.save();

        // Cập nhật lastMessage cho chat
        chat.lastMessage = message._id;
        await chat.save();

        // Populate thông tin sender
        await message.populate([
          { path: "sender", select: "username fullName profile.avatar" },
          {
            path: "repliedTo",
            select: "content sender messageType fileUrl fileName",
            populate: {
              path: "sender",
              select: "fullName profile.avatar",
            },
          },
        ]);

        // Gửi tin nhắn tới tất cả thành viên trong chat
        io.to(chatId).emit("receive_message", message);
        console.log(`Message sent in chat ${chatId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", {
          message: "Lỗi khi gửi tin nhắn",
          error: error.message,
        });
      }
    });

    socket.on("message_read", async (data) => {
      try {
        const { chatId, userId, messageId } = data;

        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { isReadBy: userId },
        });

        // Thông báo cho người gửi rằng tin nhắn đã được đọc
        io.to(chatId).emit("message_read_update", {
          messageId,
          readBy: userId,
        });

        console.log(`Message ${messageId} marked as read by user ${userId}`);
      } catch (error) {
        console.error("Error updating message read status:", error);
      }
    });

    socket.on("typing_start", (data) => {
      const { chatId, userId } = data;
      socket.to(chatId).emit("user_typing", {
        userId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", (data) => {
      const { chatId, userId } = data;
      socket.to(chatId).emit("user_typing", {
        userId,
        isTyping: false,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

    // Trong server socket
    socket.on("delete_message", async (data) => {
      try {
        const { messageId, chatId } = data;

        // Kiểm tra quyền xoá
        const message = await Message.findById(messageId);
        if (!message) return;

        // Chỉ cho phép người gửi xoá
        if (message.sender.toString() !== socket.userId) {
          socket.emit("error", { message: "Không có quyền xoá tin nhắn" });
          return;
        }

        // Soft delete
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedFor: userId },
        });

        // Thông báo cho tất cả thành viên trong chat
        io.to(chatId).emit("message_deleted", {
          messageId,
          deletedBy: userId,
        });

        // xoá hẳn
        // await Message.findByIdAndDelete(messageId);

        // Thông báo cho tất cả thành viên trong chat
        // io.to(chatId).emit("message_deleted", { messageId });
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Lỗi khi xoá tin nhắn" });
      }
    });

    // Trong socket server
    socket.on("recall_message", async (data) => {
      try {
        const { messageId, chatId } = data;
        const userId = socket.userId;

        const message = await Message.findById(messageId);
        if (!message) return;

        // Chỉ người gửi mới được thu hồi
        if (message.sender.toString() !== userId) {
          socket.emit("error", {
            message: "Chỉ người gửi mới có thể thu hồi tin nhắn",
          });
          return;
        }

        // Đánh dấu thu hồi
        await Message.findByIdAndUpdate(messageId, {
          recalled: true,
        });

        // Thông báo cho tất cả thành viên trong chat
        io.to(chatId).emit("message_recalled", {
          messageId,
        });
      } catch (error) {
        console.error("Error recalling message:", error);
        socket.emit("error", { message: "Lỗi khi thu hồi tin nhắn" });
      }
    });

    // thông báo
    socket.on("join_notifications", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined notification room`);
    });

    socket.on("join_admin_notifications", () => {
      socket.join("admin_notifications");
      console.log(`User joined admin notifications room`);
    });

    socket.on("mark_notification_read", async (data) => {
      try {
        const { notificationId, userId } = data;

        await Notification.findByIdAndUpdate(notificationId, {
          read: true,
          readAt: new Date(),
        });

        socket.emit("notification_marked_read", { notificationId });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        socket.emit("error", { message: "Lỗi khi đánh dấu thông báo đã đọc" });
      }
    });
  });

  return io;
};

// thông báo
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// module.exports =  configureSocket ;
module.exports = { configureSocket, getIO };
