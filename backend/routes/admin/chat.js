const express = require("express");
const router = express.Router();
const adminChatController = require("../../controllers/admin/adminChatController");
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");

// Áp dụng middleware xác thực và phân quyền cho tất cả routes
router.use(auth);
router.use(adminAuth);

// Routes quản lý hộp thoại
router.get("/conversations", adminChatController.getConversations);
router.get(
  "/conversations/:conversationId",
  adminChatController.getConversationDetail
);
router.get(
  "/conversations/:conversationId/messages",
  adminChatController.getMessages
);

router.delete(
  "/conversations/:conversationId",
  adminChatController.deleteConversation
);

// Routes thống kê

router.get("/stats/advanced", adminChatController.getAdvancedStats);

router.get("/stats", adminChatController.getChatStats);

module.exports = router;
