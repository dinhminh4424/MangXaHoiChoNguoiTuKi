const socketIo = require("socket.io");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

const configureSocket = (server) => {
  const io = socketIo(server, {
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
        });

        await message.save();

        // Cập nhật lastMessage cho chat
        chat.lastMessage = message._id;
        await chat.save();

        // Populate thông tin sender
        await message.populate("sender", "username fullName profile.avatar");

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
  });

  return io;
};

module.exports = configureSocket;
