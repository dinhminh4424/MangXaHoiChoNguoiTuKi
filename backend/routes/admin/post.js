const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/postAdminController");
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");

// Middleware kiểm tra đăng nhập trước, sau đó kiểm tra quyền admin
router.use(auth);
router.use(adminAuth);

// Quản lý bài viết

router.put("/:postId/blockPost", adminController.block_un_Post);
router.put("/:postId/blockComment", adminController.block_un_PostComment);

router.get("/:postId", adminController.getPostById);
router.get("/", adminController.getAllPosts);

router.delete("/:postId", adminController.deletePost);

module.exports = router;
