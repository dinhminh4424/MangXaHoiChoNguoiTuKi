const express = require("express");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const postController = require("../controllers/postController");

const router = express.Router();

// Tất cả routes đều cần xác thực
router.use(auth);

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Post

// Tạo bài viết mới
router.post("/create", upload.array("files"), postController.createPost);

// like
router.post("/:id/like", postController.likePost);

// unlike
router.post("/:id/unlike", postController.unLikePost);

// báo cáo bài viết
router.post("/:id/report", upload.array("files"), postController.reportPost);

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ put - patch

// Cập nhật bài viết
router.put("/:id", upload.array("files"), postController.updatePost);

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Delete

// Xoá bài viết
router.delete("/:id", postController.deletePost);

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Get

// Lấy chi tiết bài viết theo ID
router.get("/:id", postController.getPostDetails);

// Lấy danh sách bài viết với phân trang và lọc
router.get("/", postController.getPosts);

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Admin
//  Routes cho admin
router.patch("/:id/block", postController.blockPost);
router.patch("/:id/unblock", postController.unblockPost);

module.exports = router;
