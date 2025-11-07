const express = require("express");
const router = express.Router();
const followController = require("../controllers/followController");
const auth = require("../middleware/auth");

// Tất cả các routes đều yêu cầu authentication
router.use(auth);

// Theo dõi một user
router.post("/:userId", followController.followUser);

// Bỏ theo dõi một user
router.delete("/:userId", followController.unfollowUser);

// Kiểm tra trạng thái follow
router.get("/status/:userId", followController.getFollowStatus);

// Lấy danh sách người theo dõi (followers)
router.get("/followers/:userId", followController.getFollowers);

// Lấy danh sách đang theo dõi (following)
router.get("/following/:userId", followController.getFollowing);

module.exports = router;

