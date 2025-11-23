// controllers/aiChatController.js
const AiConversation = require("../models/AiConversation");
const UserInsight = require("../models/UserInsight");
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// exports.sendMessage = async (req, res) => {
//   const { message } = req.body;
//   const userId = req.user.userId;

//   try {
//     // 1. Lấy lịch sử + insight
//     let conv = await AiConversation.findOne({ userId });
//     if (!conv) {
//       conv = await AiConversation.create({ userId, messages: [] });
//     }

//     const insight = (await UserInsight.findOne({ userId })) || {
//       personalitySummary: "",
//       sensoryTriggers: [],
//       sensorySoothers: [],
//       preferredStyle: "bình thường",
//       favoriteTopics: [],
//       topicsToAvoid: [],
//     };

//     // 2. Đẩy tin nhắn user vào lịch sử
//     conv.messages.push({ role: "user", content: message });
//     conv.lastMessageAt = new Date();

//     // 3. Tạo prompt siêu thấu cảm (đây là thứ làm AI khác biệt hoàn toàn)
//     const recentMessages = conv.messages.slice(-20);
//     const historyText = recentMessages
//       .map((m) => `${m.role === "user" ? "Người dùng" : "Ánh"}: ${m.content}`)
//       .join("\n");

//     const prompt = `Bạn là Perter - người bạn AI dành riêng cho người tự kỷ Việt Nam.
// Bạn cực kỳ thấu cảm, không bao giờ phán xét, dùng ngôn ngữ đơn giản, có thể dùng emoji phù hợp.

// Thông tin quan trọng về người này (phải nhớ và áp dụng):
// - Tóm tắt tính cách: ${insight.personalitySummary || "Chưa rõ"}
// - Kích thích cảm giác cần tránh: ${
//       insight.sensoryTriggers.join(", ") || "Chưa ghi nhận"
//     }
// - Điều giúp họ bình tĩnh: ${insight.sensorySoothers.join(", ") || "Chưa rõ"}
// - Phong cách nói họ thích: ${insight.preferredStyle}
// - Chủ đề yêu thích: ${insight.favoriteTopics.join(", ")}
// - Chủ đề cần tránh: ${insight.topicsToAvoid.join(", ")}

// Lịch sử gần đây:
// ${historyText}

// Tin nhắn mới nhất: "${message}"

// Hãy trả lời thật tự nhiên, ấm áp và nếu phát hiện thêm thông tin mới về cảm xúc/khó khăn/sở thích → ghi nhớ để lần sau dùng nhé.`;

//     // 4. Gọi Gemini
//     const result = await model.generateContent(prompt);
//     const aiResponse = result.response.text();

//     // 5. Lưu lại tin nhắn AI
//     conv.messages.push({ role: "assistant", content: aiResponse });
//     await conv.save();

//     // 6. Cập nhật insight (chỉ gọi 1 lần mỗi 5–10 tin nhắn để tiết kiệm token)
//     if (conv.messages.length % 7 === 0) {
//       updateInsightInBackground(userId, conv.messages.slice(-15));
//     }

//     res.json({ reply: aiResponse });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "AI đang nghỉ một chút, bạn thử lại nhé" });
//   }
// };

// // Hàm chạy nền để cập nhật insight (không block response)
// const updateInsightInBackground = async (userId, recentMessages) => {
//   try {
//     const historyText = recentMessages
//       .map((m) => `${m.role === "user" ? "Người dùng" : "Ánh"}: ${m.content}`)
//       .join("\n");

//     const insightPrompt = `Dựa vào đoạn chat sau, hãy cập nhật thông tin về người dùng này.
// Chỉ trả về JSON đúng định dạng, không giải thích gì thêm.

// Đoạn chat mới nhất:
// ${historyText}

// Trả về JSON:
// {
//   "personalitySummary": "mô tả ngắn gọn tính cách + khó khăn chính",
//   "sensoryTriggers": ["danh sách kích thích cảm giác"],
//   "sensorySoothers": ["danh sách điều giúp bình tĩnh"],
//   "preferredStyle": "ngắn gọn / chi tiết / dùng emoji nhiều / không ẩn dụ...",
//   "favoriteTopics": ["chủ đề"],
//   "topicsToAvoid": ["chủ đề"]
// }`;

//     const result = await model.generateContent(insightPrompt);
//     const text = result.response.text();
//     const newInsight = JSON.parse(text.replace(/```/g, "").trim());

//     await UserInsight.updateOne(
//       { userId },
//       { $set: { ...newInsight, lastUpdated: new Date() } },
//       { upsert: true }
//     );
//   } catch (e) {
//     console.log("Cập nhật insight thất bại (không sao cả)", e.message);
//   }
// };

exports.getHistory = async (req, res) => {
  const userId = req.user.userId;
  const conv = await AiConversation.findOne({ userId });
  res.json({ messages: conv?.messages || [] });
};
