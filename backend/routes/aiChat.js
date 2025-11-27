// routes/aiChat.routes.js

const express = require("express");
const router = express.Router();
const aiChatController = require("../controllers/aiChatController");
const aiChatTodos = require("./aiChat/aiChatTodos");
const userInsights = require("./aiChat/userInsights");
const auth = require("../middleware/auth");
const aiConversationsRouter = require("./aiChat/aiConversations");

// router.post("/send", auth, aiChatController.sendMessage);
router.get("/history", auth, aiChatController.getHistory);

router.use("/todos", aiChatTodos);

router.use("/user-insights", userInsights);

router.use("/conversations", aiConversationsRouter);

module.exports = router;
