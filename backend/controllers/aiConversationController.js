// controllers/aiConversationController.js
const AiConversation = require("../models/AiConversation");
const mongoose = require("mongoose");

exports.appendMessage = async (req, res, next) => {
  try {
    const { userId } = req.body;
    // 1. Nhận userMessage và aiReply từ n8n gửi sang
    const { userMessage, aiReply } = req.body;

    // 2. Kiểm tra dữ liệu đầu vào
    if (!userId || !userMessage || !aiReply) {
      return res
        .status(400)
        .json({ message: "userId, userMessage, aiReply required" });
    }

    // 3. Tạo 2 object tin nhắn để lưu
    const newMessages = [
      {
        role: "user",
        content: userMessage,
        createdAt: new Date(),
      },
      {
        role: "assistant", // Hoặc 'model' tùy bạn quy ước
        content: aiReply,
        createdAt: new Date(),
      },
    ];

    // 4. Dùng $each để push cả 2 tin nhắn vào mảng cùng lúc
    const update = {
      $push: {
        messages: {
          $each: newMessages,
        },
      },
      $set: { lastMessageAt: new Date() },
    };

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const conversation = await AiConversation.findOneAndUpdate(
      { userId },
      update,
      options
    ).exec();

    return res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const conv = await AiConversation.findOne({ userId }).lean().exec();
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    return res.json(conv);
  } catch (err) {
    next(err);
  }
};

exports.clearConversation = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const conv = await AiConversation.findOneAndUpdate(
      { userId },
      { $set: { messages: [], lastMessageAt: new Date() } },
      { new: true }
    ).exec();

    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    return res.json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const conv = await AiConversation.findOneAndDelete({ userId }).exec();
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
