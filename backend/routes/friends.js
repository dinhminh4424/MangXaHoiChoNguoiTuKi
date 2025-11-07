const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friendController");
const auth = require("../middleware/auth");

// Tất cả các routes đều yêu cầu authentication
router.use(auth);

// Gửi yêu cầu kết bạn
router.post("/request", friendController.sendFriendRequest);

// Chấp nhận yêu cầu kết bạn
router.post("/accept/:requestId", friendController.acceptFriendRequest);

// Từ chối yêu cầu kết bạn
router.post("/reject/:requestId", friendController.rejectFriendRequest);

// Hủy yêu cầu kết bạn
router.post("/cancel/:requestId", friendController.cancelFriendRequest);

// Lấy danh sách yêu cầu kết bạn (received hoặc sent)
router.get("/requests", friendController.getFriendRequests);

// Kiểm tra trạng thái với một user cụ thể (phải đặt trước /:userId)
router.get("/status/:userId", friendController.getFriendStatus);

// Lấy danh sách bạn bè của user hiện tại
router.get("/", friendController.getFriends);

// Lấy danh sách bạn bè của một user cụ thể
router.get("/:userId", friendController.getFriendsByUserId);

// Xóa bạn bè
router.delete("/:friendshipId", friendController.removeFriend);

module.exports = router;
