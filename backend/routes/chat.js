const express = require("express");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { logUserActivity } = require("../logging/userActivityLogger");
const router = express.Router();

// Tạo cuộc trò chuyện mới
// router.post("/conversation", auth, async (req, res) => {
//   try {
//     const { members, isGroup = false, name, description } = req.body;
//     const currentUserId = req.user.userId;

//     // Đảm bảo có ít nhất 2 thành viên
//     const allMembers = [...new Set([currentUserId, ...members])];

//     if (allMembers.length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: "Cuộc trò chuyện cần ít nhất 2 thành viên",
//       });
//     }

//     // Kiểm tra cuộc trò chuyện 1-1 đã tồn tại chưa
//     if (!isGroup && allMembers.length === 2) {
//       const existingChat = await Chat.findOne({
//         isGroup: false,
//         members: { $all: allMembers, $size: allMembers.length },
//       }).populate("members", "username fullName profile.avatar isOnline");

//       if (existingChat) {
//         return res.json({
//           success: true,
//           data: existingChat,
//           isExisting: true,
//           message: "Cuộc trò chuyện đã tồn tại",
//         });
//       }
//     }

//     const chatData = {
//       members: allMembers,
//       isGroup,
//       createdBy: currentUserId,
//     };

//     if (isGroup) {
//       if (!name) {
//         return res.status(400).json({
//           success: false,
//           message: "Tên nhóm là bắt buộc",
//         });
//       }
//       chatData.name = name;
//       chatData.description = description;
//       chatData.admins = [currentUserId];
//     }

//     const chat = new Chat(chatData);
//     await chat.save();

//     // Populate thông tin members
//     await chat.populate("members", "username fullName profile.avatar isOnline");

//     res.status(201).json({
//       success: true,
//       data: chat,
//       isExisting: false,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi khi tạo cuộc trò chuyện",
//       error: error.message,
//     });
//   }
// });

// router.post("/conversation", auth, async (req, res) => {
//   try {
//     const { members, isGroup = false, name, description } = req.body;
//     const currentUserId = req.user.userId;

//     // 1. Tạo danh sách thành viên + loại trùng + SẮP XẾP THEO ID
//     const sortedMembers = [...new Set([currentUserId, ...members])].sort(
//       (a, b) => a.localeCompare(b)
//     );

//     if (sortedMembers.length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: "Cuộc trò chuyện cần ít nhất 2 thành viên",
//       });
//     }

//     // 2. KIỂM TRA CUỘC TRÒ CHUYỆN 1-1 ĐÃ TỒN TẠI CHƯA
//     if (!isGroup && sortedMembers.length === 2) {
//       const existingChat = await Chat.findOne({
//         isGroup: false,
//         members: sortedMembers, // ← Dùng mảng đã sort → chính xác 100%
//       }).populate("members", "username fullName profile.avatar isOnline");

//       if (existingChat) {
//         return res.json({
//           success: true,
//           data: existingChat,
//           isExisting: true,
//           message: "Cuộc trò chuyện đã tồn tại",
//         });
//       }
//     }

//     // 3. TẠO CUỘC TRÒ CHUYỆN MỚI
//     const chatData = {
//       members: sortedMembers, // ← Lưu luôn mảng đã sort
//       isGroup,
//       createdBy: currentUserId,
//     };

//     if (isGroup) {
//       if (!name?.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "Tên nhóm là bắt buộc",
//         });
//       }
//       chatData.name = name.trim();
//       chatData.description = description?.trim();
//       chatData.admins = [currentUserId];
//     }

//     const chat = new Chat(chatData);
//     await chat.save();

//     // 4. Populate thông tin thành viên
//     await chat.populate("members", "username fullName profile.avatar isOnline");

//     res.status(201).json({
//       success: true,
//       data: chat,
//       isExisting: false,
//       message: "Tạo cuộc trò chuyện thành công",
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       const sorted = [...new Set([req.user.userId, ...req.body.members])].sort(
//         (a, b) => a.localeCompare(b)
//       );
//       const existing = await Chat.findOne({
//         isGroup: false,
//         members: sorted,
//       }).populate("members", "username fullName profile.avatar isOnline");

//       if (existing) {
//         return res.json({ success: true, data: existing, isExisting: true });
//       }
//     }
//     res.status(500).json({ success: false, message: "Lỗi server" });
//   }
// });

router.post("/conversation", auth, async (req, res) => {
  try {
    const { members, isGroup = false, name, description } = req.body;
    const currentUserId = req.user.userId;

    // 1. Tạo danh sách thành viên + loại trùng + SẮP XẾP THEO ID
    const allMembers = [...new Set([currentUserId, ...members])];

    // SẮP XẾP QUAN TRỌNG: Đảm bảo thứ tự luôn giống nhau
    const sortedMembers = allMembers.sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

    if (sortedMembers.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Cuộc trò chuyện cần ít nhất 2 thành viên",
      });
    }

    // 2. KIỂM TRA CUỘC TRÒ CHUYỆN 1-1 ĐÃ TỒN TẠI CHƯA
    if (!isGroup && sortedMembers.length === 2) {
      console.log("🔍 Tìm conversation 1-1 với members:", sortedMembers);

      const existingChat = await Chat.findOne({
        isGroup: false,
        members: { $all: sortedMembers, $size: sortedMembers.length },
      })
        .populate("members", "username fullName profile.avatar isOnline")
        .populate("lastMessage");

      if (existingChat) {
        console.log("✅ Đã tìm thấy conversation tồn tại:", existingChat._id);
        return res.json({
          success: true,
          data: existingChat,
          isExisting: true,
          message: "Cuộc trò chuyện đã tồn tại",
        });
      }
      console.log("❌ Không tìm thấy conversation tồn tại, tạo mới");
    }

    // 3. TẠO CUỘC TRÒ CHUYỆN MỚI
    const chatData = {
      members: sortedMembers,
      isGroup,
      createdBy: currentUserId,
    };

    if (isGroup) {
      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm là bắt buộc",
        });
      }
      chatData.name = name.trim();
      chatData.description = description?.trim();
      chatData.admins = [currentUserId];
    }

    console.log("🆕 Tạo conversation mới với data:", chatData);

    const chat = new Chat(chatData);
    await chat.save();

    // 4. Populate thông tin thành viên
    await chat.populate("members", "username fullName profile.avatar isOnline");
    await chat.populate("lastMessage");

    res.status(201).json({
      success: true,
      data: chat,
      isExisting: false,
      message: "Tạo cuộc trò chuyện thành công",
    });
  } catch (error) {
    console.error("❌ Lỗi tạo conversation:", error);

    // Xử lý duplicate key error (nếu có unique index)
    if (error.code === 11000) {
      console.log("🔄 Phát hiện duplicate, tìm conversation hiện có...");

      const sorted = [...new Set([req.user.userId, ...req.body.members])].sort(
        (a, b) => a.toString().localeCompare(b.toString())
      );

      const existing = await Chat.findOne({
        isGroup: false,
        members: { $all: sorted, $size: sorted.length },
      }).populate("members", "username fullName profile.avatar isOnline");

      if (existing) {
        return res.json({
          success: true,
          data: existing,
          isExisting: true,
          message: "Đã tìm thấy conversation tồn tại (từ duplicate error)",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo conversation",
      error: error.message,
    });
  }
});

// Lấy danh sách cuộc trò chuyện của user
// router.get("/conversations", auth, async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const conversations = await Chat.find({
//       members: userId,
//       userHidden: { $nin: userId },
//     })
//       .populate("members", "username fullName profile.avatar isOnline lastSeen")
//       .populate("lastMessage")
//       .populate("createdBy", "username fullName")
//       .sort({ updatedAt: -1 });

//     // if (conversations.members.length == 2) {
//     //   return res.json({
//     //     success: false,
//     //     data: conversations,
//     //   });
//     // }

//     return res.json({
//       success: true,
//       data: conversations,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi khi lấy danh sách hội thoại",
//       error: error.message,
//     });
//   }
// });

router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await Chat.find({
      members: userId,
      userHidden: { $nin: [userId] },
    })
      .populate("members", "username fullName profile.avatar isOnline lastSeen")
      .populate("lastMessage")
      .populate("createdBy", "username fullName")
      .sort({ updatedAt: -1 })
      .lean();

    // 🔹 Gắn thêm cờ `isPinned`
    const withPinnedFlag = conversations.map((conv) => ({
      ...conv,
      isPinned: conv.pinnedBy?.some((id) => id.toString() === userId),
    }));

    // 🔹 Sắp xếp pinned lên đầu
    const sorted = withPinnedFlag.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return res.json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
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
    chat.userHidden = [];
    await chat.save();

    // Populate thông tin
    await message.populate("sender", "username fullName profile.avatar");
    await message.populate("repliedTo");

    const responsePayload = {
      success: true,
      data: message,
    };

    res.status(201);
    logUserActivity({
      action: "message.send",
      req,
      res,
      userId: senderId,
      role: req.user?.role,
      target: { type: "chat", id: chatId },
      description: "Người dùng gửi tin nhắn",
      payload: {
        messageId: message._id.toString(),
        chatId,
        messageType,
        hasAttachment: Boolean(fileUrl),
        repliedTo: repliedTo || null,
      },
    });

    return res.json(responsePayload);
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

// Ghim
// PUT /:chatId/pin  — toggle pin: nếu đã ghim sẽ bỏ, nếu chưa sẽ ghim
router.put("/:chatId/pin", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;

    // 1) Kiểm tra chat tồn tại và user là thành viên
    const chat = await Chat.findOne({ _id: chatId, members: userId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy cuộc trò chuyện hoặc bạn không phải thành viên.",
      });
    }

    // 2) Kiểm tra xem user đã ghim chưa (dùng String(...) để an toàn khi là ObjectId)
    const isPinned =
      Array.isArray(chat.pinnedBy) &&
      chat.pinnedBy.some((id) => String(id) === String(userId));

    // 3) Chuẩn bị update: nếu đang ghim thì pull, chưa ghim thì addToSet
    const update = isPinned
      ? { $pull: { pinnedBy: userId } }
      : { $addToSet: { pinnedBy: userId } };

    await Chat.updateOne({ _id: chatId }, update);

    // 4) Lấy lại chat đã cập nhật (populate nếu cần) để trả về client
    const updatedChat = await Chat.findById(chatId)
      .populate("members", "username fullName profile.avatar isOnline lastSeen")
      .populate("lastMessage")
      .populate("createdBy", "username fullName")
      .lean();

    return res.json({
      success: true,
      message: isPinned
        ? "Đã bỏ ghim cuộc trò chuyện"
        : "Đã ghim cuộc trò chuyện",
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Lỗi khi ghim/bỏ ghim hộp thoại:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật ghim hộp thoại",
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

    const responsePayload = {
      success: true,
      message: "Tin nhắn đã được xoá",
    };

    res.status(200);
    logUserActivity({
      action: "message.delete",
      req,
      res,
      userId,
      role: req.user?.role,
      target: { type: "chat", id: message.chatId.toString() },
      description: "Người dùng xoá tin nhắn cho chính mình",
      payload: {
        messageId,
        chatId: message.chatId.toString(),
        scope: "self",
      },
    });

    return res.json(responsePayload);
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

    const responsePayload = {
      success: true,
      message: "Tin nhắn đã được thu hồi",
    };

    res.status(200);
    logUserActivity({
      action: "message.recall",
      req,
      res,
      userId,
      role: req.user?.role,
      target: { type: "chat", id: message.chatId.toString() },
      description: "Người dùng thu hồi tin nhắn",
      payload: {
        messageId,
        chatId: message.chatId.toString(),
      },
    });

    return res.json(responsePayload);
  } catch (error) {
    console.error("Lỗi khi thu hồi tin nhắn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thu hồi tin nhắn",
      error: error.message,
    });
  }
});

router.delete("/conversation/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log("Không tìm thấy hộp thoại:", chatId);
      res.status(400).json({
        success: false,
        message: "Không tìm thấy hộp thoại: " + chatId,
        error: error.message,
      });
    }

    if (!chat.members.includes(userId)) {
      console.log(
        "Bạn: " + userId + " không có trong cuộc hội thoại này:" + chat.members
      );
      res.status(400).json({
        success: false,
        message:
          "Bạn: " +
          userId +
          " không có trong cuộc hội thoại này:" +
          chat.members.toString(),
        error:
          "Bạn: " +
          userId +
          " không có trong cuộc hội thoại này:" +
          chat.members.toString(),
      });
    }

    await Message.updateMany({ chatId }, { $addToSet: { deletedFor: userId } });

    chat.userHidden.addToSet(userId);

    await chat.save();

    res.status(200).json({
      success: true,
      message: "Xoá Hộp Thoại Thành Công",
    });
  } catch (error) {
    console.error("Lỗi khi xoá hộp thoại:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xoá hộp thoại",
      error: error,
    });
  }
});

module.exports = router;
