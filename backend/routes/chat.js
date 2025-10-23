const express = require("express");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

// Tạo cuộc trò chuyện mới
router.post("/conversation", auth, async (req, res) => {
  try {
    const { members, isGroup = false, name, description } = req.body;
    const currentUserId = req.user.userId;

    // Đảm bảo có ít nhất 2 thành viên
    const allMembers = [...new Set([currentUserId, ...members])];

    if (allMembers.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Cuộc trò chuyện cần ít nhất 2 thành viên",
      });
    }

    // Kiểm tra cuộc trò chuyện 1-1 đã tồn tại chưa
    if (!isGroup && allMembers.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        members: { $all: allMembers, $size: allMembers.length },
      }).populate("members", "username fullName profile.avatar isOnline");

      if (existingChat) {
        return res.json({
          success: true,
          data: existingChat,
          isExisting: true,
          message: "Cuộc trò chuyện đã tồn tại",
        });
      }
    }

    const chatData = {
      members: allMembers,
      isGroup,
      createdBy: currentUserId,
    };

    if (isGroup) {
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm là bắt buộc",
        });
      }
      chatData.name = name;
      chatData.description = description;
      chatData.admins = [currentUserId];
    }

    const chat = new Chat(chatData);
    await chat.save();

    // Populate thông tin members
    await chat.populate("members", "username fullName profile.avatar isOnline");

    res.status(201).json({
      success: true,
      data: chat,
      isExisting: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo cuộc trò chuyện",
      error: error.message,
    });
  }
});

// Lấy danh sách cuộc trò chuyện của user
router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await Chat.find({
      members: userId,
    })
      .populate("members", "username fullName profile.avatar isOnline lastSeen")
      .populate("lastMessage")
      .populate("createdBy", "username fullName")
      .sort({ updatedAt: -1 });

    // if (conversations.members.length == 2) {
    //   return res.json({
    //     success: false,
    //     data: conversations,
    //   });
    // }

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách hội thoại",
      error: error.message,
    });
  }
});

// Lấy lịch sử tin nhắn của một cuộc trò chuyện VỚI PHÂN TRANG
router.get("/:chatId/messages", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Kiểm tra user có trong cuộc trò chuyện không
    const chat = await Chat.findOne({
      _id: chatId,
      members: userId,
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập cuộc trò chuyện này",
      });
    }

    // Tính toán skip cho phân trang
    const skip = (pageNum - 1) * limitNum;

    // Điều kiện lấy tin nhắn:
    // - Không bị xoá cho user hiện tại (deletedFor)
    // - Không bị thu hồi (recalled: false)
    const totalMessages = await Message.countDocuments({
      chatId,
      deletedFor: { $ne: userId },
      $or: [{ recalled: { $exists: false } }, { recalled: false }],
    });

    // Lấy tin nhắn với populate sâu
    const messages = await Message.find({
      chatId,
      deletedFor: { $ne: userId },
      $or: [{ recalled: { $exists: false } }, { recalled: false }],
    })
      .populate("sender", "_id username fullName profile.avatar")
      .populate({
        path: "repliedTo",
        select:
          "_id content messageType fileUrl fileName fileSize sender createdAt deletedFor recalled",
        populate: {
          path: "sender",
          select: "_id username fullName profile.avatar",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Xử lý tin nhắn đã bị xoá trong repliedTo
    const processedMessages = messages.map((message) => {
      // Nếu repliedTo tồn tại nhưng đã bị xoá cho user hiện tại HOẶC bị thu hồi
      if (message.repliedTo) {
        if (
          message.repliedTo.deletedFor?.includes(userId) ||
          message.repliedTo.recalled
        ) {
          return {
            ...message.toObject(),
            repliedTo: {
              _id: message.repliedTo._id,
              content: null,
              messageType: "text",
              fileUrl: null,
              fileName: null,
              fileSize: null,
              sender: null,
              createdAt: message.repliedTo.createdAt,
              isDeleted: true,
            },
          };
        }
      }
      return message;
    });

    // Đảo ngược thứ tự để hiển thị từ cũ đến mới
    const sortedMessages = processedMessages.reverse();

    // Đánh dấu tin nhắn là đã đọc (chỉ cho trang đầu tiên)
    if (pageNum === 1) {
      await Message.updateMany(
        {
          chatId,
          sender: { $ne: userId },
          isReadBy: { $ne: userId },
        },
        {
          $addToSet: { isReadBy: userId },
        }
      );
    }

    res.json({
      success: true,
      data: {
        messages: sortedMessages,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalMessages / limitNum),
          totalMessages,
          hasNext: pageNum < Math.ceil(totalMessages / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử tin nhắn",
      error: error.message,
    });
  }
});

// Gửi tin nhắn
router.post("/:chatId/messages", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const {
      content,
      messageType = "text",
      fileUrl,
      fileName,
      fileSize,
      repliedTo,
    } = req.body;
    const senderId = req.user.userId;

    // Kiểm tra user có trong cuộc trò chuyện không
    const chat = await Chat.findOne({
      _id: chatId,
      members: senderId,
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này",
      });
    }

    const message = new Message({
      chatId: chatId,
      sender: senderId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      repliedTo,
      isReadBy: [senderId], // Tự động đánh dấu đã đọc cho người gửi
    });

    await message.save();

    // Cập nhật lastMessage cho chat
    chat.lastMessage = message._id;
    await chat.save();

    // Populate thông tin
    await message.populate("sender", "username fullName profile.avatar");
    await message.populate("repliedTo");

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi gửi tin nhắn",
      error: error.message,
    });
  }
});

// Đánh dấu tin nhắn đã đọc
router.put("/:chatId/messages/read", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    await Message.updateMany(
      {
        chatId,
        sender: { $ne: userId },
        isReadBy: { $ne: userId },
      },
      {
        $addToSet: { isReadBy: userId },
      }
    );

    res.json({
      success: true,
      message: "Đã đánh dấu đọc tin nhắn",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi đánh dấu tin nhắn đã đọc",
      error: error.message,
    });
  }
});

// Xóa tin nhắn (xóa cho chính mình)
router.delete("/messages/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Tìm tin nhắn
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Tin nhắn không tồn tại",
      });
    }

    // Ai cũng có thể xoá (chỉ mình không thấy)
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: userId },
    });

    // Gửi socket event để cập nhật real-time (chỉ cho user hiện tại)
    // Có thể gửi qua socket hoặc để client tự xử lý

    res.json({
      success: true,
      message: "Tin nhắn đã được xoá",
    });
  } catch (error) {
    console.error("Lỗi khi xoá tin nhắn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xoá tin nhắn",
      error: error.message,
    });
  }
});

// API thu hồi tin nhắn (cả 2 không thấy)
router.post("/messages/:messageId/recall", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Tìm tin nhắn
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Tin nhắn không tồn tại",
      });
    }

    // Chỉ người gửi mới được thu hồi
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Chỉ người gửi mới có thể thu hồi tin nhắn",
      });
    }

    // Đánh dấu thu hồi
    await Message.findByIdAndUpdate(messageId, {
      recalled: true,
    });

    // Gửi socket event để cập nhật real-time cho tất cả
    // (sẽ thêm socket sau)

    res.json({
      success: true,
      message: "Tin nhắn đã được thu hồi",
    });
  } catch (error) {
    console.error("Lỗi khi thu hồi tin nhắn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thu hồi tin nhắn",
      error: error.message,
    });
  }
});

module.exports = router;
