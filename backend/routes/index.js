const express = require("express");
const router = express.Router();

// Import các routes
const authRoutes = require("./auth");
const userRoutes = require("./users");
const chatRoutes = require("./chat");
const uploadRoutes = require("./upload");
const quoteRoutes = require("./qoute");
const journalRoutes = require("./journals");
// const notificationRoutes = require("./notification");
const postsRoutes = require("./posts");
const commentsRoutes = require("./comments");
const groupRoutes = require("./groups");
const moodRoutes = require("./mood");
const adminRoutes = require("./admin");
const notificationsRoutes = require("./notifications");
const friendsRoutes = require("./friends");
const followRoutes = require("./follow");
const clientLogsRouter = require("./clientLogs");
const todosRouter = require("./todos");

// Sử dụng các routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/upload", uploadRoutes);
router.use("/quote", quoteRoutes);
router.use("/journals", journalRoutes);
// router.use("/notifications", notificationRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/posts", postsRoutes);
router.use("/comments", commentsRoutes);
router.use("/groups", groupRoutes);
router.use("/mood", moodRoutes);
router.use("/admin", adminRoutes);
router.use("/friends", friendsRoutes);
router.use("/follow", followRoutes);
router.use("/todos", todosRouter);

router.use("/client-logs", clientLogsRouter);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Debug: list all mounted routes (method + path)
router.get("/routes", (req, res) => {
  try {
    const routes = [];
    const stack = router.stack || [];

    stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods).map((m) =>
          m.toUpperCase()
        );
        routes.push({ path: layer.route.path, methods });
      } else if (
        layer.name === "router" &&
        layer.handle &&
        layer.handle.stack
      ) {
        // nested router
        layer.handle.stack.forEach((l) => {
          if (l.route && l.route.path) {
            const methods = Object.keys(l.route.methods).map((m) =>
              m.toUpperCase()
            );
            routes.push({
              path:
                layer.regexp && layer.regexp.source
                  ? layer.regexp.source
                  : layer.regexp,
              methods,
              nestedPath: l.route.path,
            });
          }
        });
      }
    });

    res.json({ success: true, routes });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Could not list routes",
      error: err.message,
    });
  }
});

module.exports = router;
