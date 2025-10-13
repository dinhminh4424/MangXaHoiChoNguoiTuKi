// routes/comments.js
const express = require("express");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const commentController = require("../controllers/commentController");

const router = express.Router();

// Tất cả routes đều cần xác thực
router.use(auth);

// Tạo bình luận mới
router.post("/create", upload.single("file"), commentController.createComment);

// Lấy bình luận theo bài viết
router.get("/post/:postId", commentController.getPostComments);

// Lấy replies của bình luận
router.get("/:commentId/replies", commentController.getCommentReplies);

// Cập nhật bình luận
router.put("/:id", commentController.updateComment);

// Xóa bình luận
router.delete("/:id", commentController.deleteComment);

// Like bình luận
router.post("/:id/like", commentController.likeComment);

// Unlike bình luận
router.post("/:id/unlike", commentController.unlikeComment);

// Lấy danh sách người đã like comment
router.get("/:id/likes", commentController.getCommentLikes);

// Routes cho admin
router.patch("/:id/block", commentController.blockComment);
router.patch("/:id/unblock", commentController.unblockComment);

module.exports = router;
