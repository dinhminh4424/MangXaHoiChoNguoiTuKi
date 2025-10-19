const express = require("express");
const router = express.Router();

// Import các routes
const authRoutes = require("./auth");
const userRoutes = require("./users");
const chatRoutes = require("./chat");
const uploadRoutes = require("./upload");
const quoteRoutes = require("./qoute");
const journalRoutes = require("./journals");
const notificationRoutes = require("./notification");
const postsRoutes = require("./posts");
const commentsRoutes = require("./comments");
const groupRoutes = require("./groups");
const moodRoutes = require("./mood");

// Sử dụng các routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/upload", uploadRoutes);
router.use("/quote", quoteRoutes);
router.use("/journals", journalRoutes);
router.use("/notifications", notificationRoutes);
router.use("/posts", postsRoutes);
router.use("/comments", commentsRoutes);
router.use("/groups", groupRoutes);
router.use("/mood", moodRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
