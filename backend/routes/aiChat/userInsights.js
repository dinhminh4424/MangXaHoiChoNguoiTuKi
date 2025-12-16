// routes/userInsights.js
const express = require("express");
const router = express.Router();
const userInsightCtrl = require("../../controllers/userInsightController");

// PATCH /api/ai-chat/user-insights/:userId
// router.post("/:userId", userInsightCtrl.updateUserInsights);
router.post("/", userInsightCtrl.updateUserInsights);
router.get("/:userId", userInsightCtrl.getUserInsights);

module.exports = router;
