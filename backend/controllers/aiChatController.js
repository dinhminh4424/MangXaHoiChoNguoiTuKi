// controllers/aiChatController.js
const AiConversation = require("../models/AiConversation");
const UserInsight = require("../models/UserInsight");

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(403).json({
        success: false,
        message: "Ko tìm thấy người dùng",
      });
    }
    const conv = await AiConversation.findOne({ userId });

    res.status(200).json({
      success: true,
      message: "Lấy thành công danh scahs tin nhắn",
      messages: conv?.messages || [],
    });
  } catch (error) {
    console.log("Lỗi lấy tin nhắn với ai: ", error);
    res.status(500).json({ success: false, message: error.toString() });
  }
};
