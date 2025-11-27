// routes/aiConversations.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/aiConversationController");

// POST /api/ai/conversations
// Body example: { userId: "...", role: "user", content: "Xin chào Ánh" }
router.post("/", ctrl.appendMessage);

// GET /api/ai/conversations/:userId
router.get("/:userId", ctrl.getConversation);

// DELETE /api/ai/conversations/:userId
router.delete("/:userId", ctrl.deleteConversation);

// POST /api/ai/conversations/:userId/clear
router.post("/:userId/clear", ctrl.clearConversation);

module.exports = router;
