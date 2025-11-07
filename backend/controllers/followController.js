// controllers/followController.js
const Follow = require("../models/Follow");
const User = require("../models/User");
const Friend = require("../models/Friend");

class FollowController {
  // [POST] /api/follow/:userId - Theo dõi một user
  async followUser(req, res) {
    try {
      const followerId = req.user.userId;
      const { userId } = req.params;

      if (followerId === userId) {
        return res.status(400).json({
          success: false,
          message: "Không thể theo dõi chính mình",
        });
      }

      // Kiểm tra user có tồn tại không
      const userToFollow = await User.findById(userId);
      if (!userToFollow) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Kiểm tra đã follow chưa
      const existingFollow = await Follow.findOne({
        follower: followerId,
        following: userId,
      });

      if (existingFollow) {
        return res.status(400).json({
          success: false,
          message: "Bạn đã theo dõi người này rồi",
        });
      }

      // Tạo follow relationship
      const follow = new Follow({
        follower: followerId,
        following: userId,
      });
      await follow.save();

      // Emit socket event để cập nhật real-time
      const { getIO } = require("../config/socket");
      const io = getIO();
      // Emit cho người follow (để cập nhật nút follow của họ)
      io.to(`user_${followerId}`).emit("follow_status_changed", {
        followerId,
        followingId: userId,
        action: "followed",
      });
      // Emit cho người được follow (để cập nhật số lượng followers)
      io.to(`user_${userId}`).emit("follower_count_changed", {
        followingId: userId,
        action: "followed",
        change: 1,
      });

      res.json({
        success: true,
        message: "Đã theo dõi thành công",
        data: follow,
      });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi theo dõi",
        error: error.message,
      });
    }
  }

  // [DELETE] /api/follow/:userId - Bỏ theo dõi một user
  async unfollowUser(req, res) {
    try {
      const followerId = req.user.userId;
      const { userId } = req.params;

      const follow = await Follow.findOneAndDelete({
        follower: followerId,
        following: userId,
      });

      if (!follow) {
        return res.status(404).json({
          success: false,
          message: "Bạn chưa theo dõi người này",
        });
      }

      // Emit socket event để cập nhật real-time
      const { getIO } = require("../config/socket");
      const io = getIO();
      // Emit cho người unfollow (để cập nhật nút follow của họ)
      io.to(`user_${followerId}`).emit("follow_status_changed", {
        followerId,
        followingId: userId,
        action: "unfollowed",
      });
      // Emit cho người được unfollow (để cập nhật số lượng followers)
      io.to(`user_${userId}`).emit("follower_count_changed", {
        followingId: userId,
        action: "unfollowed",
        change: -1,
      });

      res.json({
        success: true,
        message: "Đã bỏ theo dõi thành công",
      });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi bỏ theo dõi",
        error: error.message,
      });
    }
  }

  // [GET] /api/follow/status/:userId - Kiểm tra trạng thái follow
  async getFollowStatus(req, res) {
    try {
      const followerId = req.user.userId;
      const { userId } = req.params;

      const follow = await Follow.findOne({
        follower: followerId,
        following: userId,
      });

      res.json({
        success: true,
        data: {
          isFollowing: !!follow,
        },
      });
    } catch (error) {
      console.error("Error getting follow status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra trạng thái follow",
        error: error.message,
      });
    }
  }

  // [GET] /api/follow/followers/:userId - Lấy danh sách người theo dõi (followers)
  async getFollowers(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const followers = await Follow.find({ following: userId })
        .populate("follower", "username fullName profile.avatar isOnline")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Follow.countDocuments({ following: userId });

      res.json({
        success: true,
        data: followers.map((f) => f.follower),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          results: followers.length,
          totalFollowers: total,
        },
      });
    } catch (error) {
      console.error("Error getting followers:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách người theo dõi",
        error: error.message,
      });
    }
  }

  // [GET] /api/follow/following/:userId - Lấy danh sách đang theo dõi (following)
  async getFollowing(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const following = await Follow.find({ follower: userId })
        .populate("following", "username fullName profile.avatar isOnline")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Follow.countDocuments({ follower: userId });

      res.json({
        success: true,
        data: following.map((f) => f.following),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          results: following.length,
          totalFollowing: total,
        },
      });
    } catch (error) {
      console.error("Error getting following:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách đang theo dõi",
        error: error.message,
      });
    }
  }
}

module.exports = new FollowController();

