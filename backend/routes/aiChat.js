// routes/aiChat.routes.js

const express = require("express");
const router = express.Router();
const aiChatController = require("../controllers/aiChatController");

const auth = require("../middleware/auth");

// router.post("/send", auth, aiChatController.sendMessage);
router.get("/history", auth, aiChatController.getHistory);

module.exports = router;
