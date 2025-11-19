// const socketIo = require("socket.io");
// const Message = require("../models/Message");
// const Chat = require("../models/Chat");
// const Notification = require("../models/Notification");
// const User = require("../models/User");

// let io;
// const configureSocket = (server) => {
//   io = socketIo(server, {
//     cors: {
//       origin: process.env.FRONTEND_URL || "http://localhost:3000",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);

//     // User join các room chat của họ
//     socket.on("join_chats", async (userId) => {
//       try {
//         const chats = await Chat.find({ members: userId });
//         chats.forEach((chat) => {
//           socket.join(chat._id.toString());
//         });
//         console.log(`User ${userId} joined ${chats.length} chats`);
//       } catch (error) {
//         console.error("Error joining chats:", error);
//         socket.emit("error", { message: "Lỗi khi tham gia chats" });
//       }
//     });

//     socket.on("join_chat", (chatId) => {
//       socket.join(chatId);
//       console.log(`User joined chat: ${chatId}`);
//     });

//     socket.on("leave_chat", (chatId) => {
//       socket.leave(chatId);
//       console.log(`User left chat: ${chatId}`);
//     });

//     // gửi tin
//     socket.on("send_message", async (data) => {
//       try {
//         const {
//           chatId,
//           content,
//           sender,
//           messageType = "text",
//           fileUrl,
//           fileName,
//           fileSize,
//           repliedTo,
//         } = data;

//         // Kiểm tra chat tồn tại
//         const chat = await Chat.findById(chatId);
//         if (!chat) {
//           socket.emit("message_error", {
//             message: "Cuộc trò chuyện không tồn tại",
//           });
//           return;
//         }

//         // Lưu tin nhắn vào database
//         const message = new Message({
//           chatId: chatId,
//           sender: sender.id,
//           content,
//           messageType,
//           fileUrl,
//           fileName,
//           fileSize,
//           isReadBy: [sender.id],
//           repliedTo,
//         });

//         await message.save();

//         // Cập nhật lastMessage cho chat
//         chat.lastMessage = message._id;
//         await chat.save();

//         // Populate thông tin sender
//         await message.populate([
//           { path: "sender", select: "username fullName profile.avatar" },
//           {
//             path: "repliedTo",
//             select: "content sender messageType fileUrl fileName",
//             populate: {
//               path: "sender",
//               select: "fullName profile.avatar",
//             },
//           },
//         ]);

//         // Gửi tin nhắn tới tất cả thành viên trong chat
//         io.to(chatId).emit("receive_message", message);
//         console.log(`Message sent in chat ${chatId}`);
//       } catch (error) {
//         console.error("Error sending message:", error);
//         socket.emit("message_error", {
//           message: "Lỗi khi gửi tin nhắn",
//           error: error.message,
//         });
//       }
//     });

//     socket.on("message_read", async (data) => {
//       try {
//         const { chatId, userId, messageId } = data;

//         await Message.findByIdAndUpdate(messageId, {
//           $addToSet: { isReadBy: userId },
//         });

//         // Thông báo cho người gửi rằng tin nhắn đã được đọc
//         io.to(chatId).emit("message_read_update", {
//           messageId,
//           readBy: userId,
//         });

//         console.log(`Message ${messageId} marked as read by user ${userId}`);
//       } catch (error) {
//         console.error("Error updating message read status:", error);
//       }
//     });

//     socket.on("typing_start", (data) => {
//       const { chatId, userId } = data;
//       socket.to(chatId).emit("user_typing", {
//         userId,
//         isTyping: true,
//       });
//     });

//     socket.on("typing_stop", (data) => {
//       const { chatId, userId } = data;
//       socket.to(chatId).emit("user_typing", {
//         userId,
//         isTyping: false,
//       });
//     });

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", socket.id);
//     });

//     // Trong server socket
//     socket.on("delete_message", async (data) => {
//       try {
//         const { messageId, chatId } = data;

//         // Kiểm tra quyền xoá
//         const message = await Message.findById(messageId);
//         if (!message) return;

//         // Chỉ cho phép người gửi xoá
//         if (message.sender.toString() !== socket.userId) {
//           socket.emit("error", { message: "Không có quyền xoá tin nhắn" });
//           return;
//         }

//         // Soft delete
//         await Message.findByIdAndUpdate(messageId, {
//           $addToSet: { deletedFor: userId },
//         });

//         // Thông báo cho tất cả thành viên trong chat
//         io.to(chatId).emit("message_deleted", {
//           messageId,
//           deletedBy: userId,
//         });

//         // xoá hẳn
//         // await Message.findByIdAndDelete(messageId);

//         // Thông báo cho tất cả thành viên trong chat
//         // io.to(chatId).emit("message_deleted", { messageId });
//       } catch (error) {
//         console.error("Error deleting message:", error);
//         socket.emit("error", { message: "Lỗi khi xoá tin nhắn" });
//       }
//     });

//     // Trong socket server
//     socket.on("recall_message", async (data) => {
//       try {
//         const { messageId, chatId } = data;
//         const userId = socket.userId;

//         const message = await Message.findById(messageId);
//         if (!message) return;

//         // Chỉ người gửi mới được thu hồi
//         if (message.sender.toString() !== userId) {
//           socket.emit("error", {
//             message: "Chỉ người gửi mới có thể thu hồi tin nhắn",
//           });
//           return;
//         }

//         // Đánh dấu thu hồi
//         await Message.findByIdAndUpdate(messageId, {
//           recalled: true,
//         });

//         // Thông báo cho tất cả thành viên trong chat
//         io.to(chatId).emit("message_recalled", {
//           messageId,
//         });
//       } catch (error) {
//         console.error("Error recalling message:", error);
//         socket.emit("error", { message: "Lỗi khi thu hồi tin nhắn" });
//       }
//     });

//     // thông báo
//     socket.on("join_notifications", (userId) => {
//       socket.join(`user_${userId}`);
//       console.log(`User ${userId} joined notification room`);
//     });

//     socket.on("join_admin_notifications", () => {
//       socket.join("admin_notifications");
//       console.log(`User joined admin notifications room`);
//     });

//     socket.on("mark_notification_read", async (data) => {
//       try {
//         const { notificationId, userId } = data;

//         await Notification.findByIdAndUpdate(notificationId, {
//           read: true,
//           readAt: new Date(),
//         });

//         socket.emit("notification_marked_read", { notificationId });
//       } catch (error) {
//         console.error("Error marking notification as read:", error);
//         socket.emit("error", { message: "Lỗi khi đánh dấu thông báo đã đọc" });
//       }
//     });
//   });

//   return io;
// };

// // thông báo
// const getIO = () => {
//   if (!io) {
//     throw new Error("Socket.io not initialized");
//   }
//   return io;
// };

// // module.exports =  configureSocket ;
// module.exports = { configureSocket, getIO };

/// =========================================
// config/socket.js
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");
const User = require("../models/User");
const AccessLog = require("../models/AccessLog"); // optional: để log socket events

let io;
const configureSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Handshake middleware: gắn socket.userId nếu client gửi token
  io.use((socket, next) => {
    try {
      // client nên kết nối: io(URL, { auth: { token: 'Bearer ...' }})
      const raw =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;
      if (!raw) return next(); // cho phép anonymous
      const token = raw.startsWith("Bearer ")
        ? raw.slice(7).trim()
        : raw.trim();
      if (!token) return next();
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || "autism_support_secret"
        );
        socket.userId = payload.userId || payload.sub || payload.id || null;
        socket.username = payload.username || payload.name || null;
      } catch (e) {
        // token invalid -> tiếp tục nhưng không gán userId
        console.warn("socket auth invalid token:", e.message);
      }
      return next();
    } catch (err) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id || null);

    // optional: log connect event to AccessLog
    // AccessLog?.create?.({
    //   timestamp: new Date(),
    //   level: "info",
    //   service: process.env.SERVICE_NAME || "social-api",
    //   env: process.env.NODE_ENV || "development",
    //   request: { path: "socket:connect", userId: socket.userId || null },
    //   meta: { socketId: socket.id },
    // }).catch(() => {});

    // Join all chats of user (if userId available)
    socket.on("join_chats", async (userIdFromClient) => {
      try {
        // prefer authenticated socket.userId, fallback to param
        const uid = socket.userId || userIdFromClient;
        if (!uid)
          return socket.emit("error", {
            message: "User ID required to join chats",
          });

        const chats = await Chat.find({ members: uid });
        chats.forEach((chat) => socket.join(chat._id.toString()));
        console.log(`User ${uid} joined ${chats.length} chats`);

        // AccessLog?.create?.({
        //   timestamp: new Date(),
        //   level: "info",
        //   request: { path: "socket:join_chats", userId: uid },
        //   meta: { count: chats.length },
        // }).catch(() => {});
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

    // ---------- send_message handler (sửa) ----------
    socket.on("send_message", async (data) => {
      try {
        // Validate input
        const {
          chatId,
          content,
          sender, // optional from client
          messageType = "text",
          fileUrl,
          fileName,
          fileSize,
          repliedTo,
        } = data || {};

        // Determine senderId: ưu tiên authenticated socket.userId
        const senderId =
          socket.userId || (sender && (sender.id || sender.userId || sender));

        if (!chatId) {
          socket.emit("message_error", { message: "chatId is required" });
          return;
        }
        if (!senderId) {
          socket.emit("message_error", {
            message: "senderId missing (not authenticated)",
          });
          return;
        }

        // Kiểm tra chat tồn tại
        const chat = await Chat.findById(chatId)
          .populate(
            "members",
            "username fullName profile.avatar isOnline lastSeen"
          )
          .populate("lastMessage")
          .populate("createdBy", "username fullName");
        if (!chat) {
          socket.emit("message_error", {
            message: "Cuộc trò chuyện không tồn tại",
          });
          return;
        }

        // Tạo message instance (đảm bảo schema tương thích)
        const message = new Message({
          chatId: chatId,
          sender: senderId,
          content,
          messageType,
          fileUrl,
          fileName,
          fileSize,
          isReadBy: [senderId],
          repliedTo,
        });

        // Save message -> nếu có lỗi sẽ rơi vào catch
        await message.save();

        // Update chat lastMessage
        chat.lastMessage = message._id;
        chat.userHidden = [];
        await chat.save();

        // Populate sender & repliedTo for emitting
        await message.populate([
          { path: "sender", select: "username fullName profile.avatar" },
          {
            path: "repliedTo",
            select: "content sender messageType fileUrl fileName",
            populate: { path: "sender", select: "fullName profile.avatar" },
          },
        ]);

        // Emit to room
        // io.to(chatId).emit("receive_message", {message});
        io.to(chatId).emit("receive_message", { message, chat });

        // optional: log to AccessLog for tracing
        AccessLog?.create?.({
          timestamp: new Date(),
          level: "info",
          request: {
            path: "socket:message",
            userId: senderId,
            method: "SEND_MESSAGE",
          },
          meta: {
            chatId,
            messageId: message._id,
            preview: (content || "").slice(0, 200),
          },
        }).catch(() => {});

        console.log(`Message sent in chat ${chatId} by ${senderId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        // emit friendly error and detailed error to server log only
        socket.emit("message_error", { message: "Lỗi khi gửi tin nhắn" });
      }
    });

    // ---------- message_read ----------
    socket.on("message_read", async (data) => {
      try {
        const { chatId, messageId } = data || {};
        const userId = socket.userId || data?.userId;
        if (!userId || !messageId || !chatId) return;

        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { isReadBy: userId },
        });
        io.to(chatId).emit("message_read_update", {
          messageId,
          readBy: userId,
        });

        AccessLog?.create?.({
          timestamp: new Date(),
          level: "info",
          request: { path: "socket:message_read", userId, method: "MARK_READ" },
          meta: { chatId, messageId },
        }).catch(() => {});
      } catch (error) {
        console.error("Error updating message read status:", error);
      }
    });

    socket.on("typing_start", (data) => {
      const { chatId, userId: uidFromClient } = data || {};
      const userId = socket.userId || uidFromClient;
      if (!chatId) return;
      socket.to(chatId).emit("user_typing", { userId, isTyping: true });
    });

    socket.on("typing_stop", (data) => {
      const { chatId, userId: uidFromClient } = data || {};
      const userId = socket.userId || uidFromClient;
      if (!chatId) return;
      socket.to(chatId).emit("user_typing", { userId, isTyping: false });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // AccessLog?.create?.({
      //   timestamp: new Date(),
      //   level: "info",
      //   request: { path: "socket:disconnect", userId: socket.userId || null },
      //   meta: { socketId: socket.id },
      // }).catch(() => {});
    });

    // ---------- delete_message (fixed) ----------
    socket.on("delete_message", async (data) => {
      try {
        const { messageId, chatId } = data || {};
        const userId = socket.userId; // use authenticated user

        const message = await Message.findById(messageId);
        if (!message) return;

        if (message.sender.toString() !== userId) {
          socket.emit("error", { message: "Không có quyền xoá tin nhắn" });
          return;
        }

        // Soft delete: add to deletedFor array for that user
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedFor: userId },
        });

        io.to(chatId).emit("message_deleted", { messageId, deletedBy: userId });

        AccessLog?.create?.({
          timestamp: new Date(),
          level: "info",
          request: {
            path: "socket:delete_message",
            userId,
            method: "DELETE_MESSAGE",
          },
          meta: { chatId, messageId },
        }).catch(() => {});
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Lỗi khi xoá tin nhắn" });
      }
    });

    // ---------- recall_message (fixed) ----------
    socket.on("recall_message", async (data) => {
      try {
        const { messageId, chatId } = data || {};
        const userId = socket.userId;

        if (!messageId) return;
        const message = await Message.findById(messageId);
        if (!message) return;

        if (message.sender.toString() !== userId) {
          socket.emit("error", {
            message: "Chỉ người gửi mới có thể thu hồi tin nhắn",
          });
          return;
        }

        await Message.findByIdAndUpdate(messageId, { recalled: true });

        io.to(chatId).emit("message_recalled", { messageId });

        AccessLog?.create?.({
          timestamp: new Date(),
          level: "info",
          request: {
            path: "socket:recall_message",
            userId,
            method: "RECALL_MESSAGE",
          },
          meta: { chatId, messageId },
        }).catch(() => {});
      } catch (error) {
        console.error("Error recalling message:", error);
        socket.emit("error", { message: "Lỗi khi thu hồi tin nhắn" });
      }
    });

    // Notifications join
    socket.on("join_notifications", (userId) => {
      const uid = socket.userId || userId;
      if (!uid) return;
      const uidStr = String(uid);
      socket.join(`user_${uidStr}`);
      console.log(`User ${uidStr} joined notification room`);
    });

    socket.on("join_admin_notifications", () => {
      socket.join("admin_notifications");
      console.log(`User joined admin notifications room`);
    });

    socket.on("mark_notification_read", async (data) => {
      try {
        const { notificationId } = data || {};
        if (!notificationId) return;
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

    // đăng xuất tai khoản do vi system
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { configureSocket, getIO };
