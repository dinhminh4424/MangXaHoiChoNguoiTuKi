const express = require("express");
const router = express.Router();
const quoteController = require("../../controllers/admin/quoteAdminController");

const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");

// Middleware kiểm tra đăng nhập trước, sau đó kiểm tra quyền admin
router.use(auth);
router.use(adminAuth);

// Public routes
router.get("/random", quoteController.getRandomQuote);

// Admin routes (yêu cầu authentication và admin role)
router.get("/", quoteController.getAllQuotes);
router.get("/:quoteId", quoteController.getQuoteById);
router.post("/", quoteController.createQuote);
router.put("/:quoteId", quoteController.updateQuote);
router.put(
  "/:quoteId/toggle",

  quoteController.toggleQuoteStatus
);
router.delete(
  "/:quoteId",

  quoteController.deleteQuote
);

module.exports = router;
