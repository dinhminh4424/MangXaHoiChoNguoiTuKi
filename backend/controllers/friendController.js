const FriendRequest = require("../models/FriendRequest");
const Friend = require("../models/Friend");
const User = require("../models/User");
const Follow = require("../models/Follow");
const NotificationService = require("../services/notificationService");

class FriendController {
  // [POST] /api/friends/request - Gửi yêu cầu kết bạn
  async sendFriendRequest(req, res) {
    try {
      const requesterId = req.user.userId;
      const { recipientId } = req.body;

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp ID người nhận",
        });
      }

      if (requesterId === recipientId) {
        return res.status(400).json({
          success: false,
          message: "Bạn không thể gửi yêu cầu kết bạn cho chính mình",
        });
      }

      // Kiểm tra user có tồn tại không
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Kiểm tra đã là bạn bè chưa
      const existingFriend = await Friend.findOne({
        $or: [
          { userA: requesterId, userB: recipientId },
          { userA: recipientId, userB: requesterId },
        ],
      });

      if (existingFriend) {
        return res.status(400).json({
          success: false,
          message: "Hai người đã là bạn bè",
        });
      }

      // Kiểm tra đã có yêu cầu pending chưa
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { requester: requesterId, recipient: recipientId, status: "pending" },
          { requester: recipientId, recipient: requesterId, status: "pending" },
        ],
      });

      if (existingRequest) {
        if (existingRequest.requester.toString() === requesterId) {
          return res.status(400).json({
            success: false,
            message: "Bạn đã gửi yêu cầu kết bạn cho người này",
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Người này đã gửi yêu cầu kết bạn cho bạn",
          });
        }
      }

      // Tạo yêu cầu mới
      const friendRequest = new FriendRequest({
        requester: requesterId,
        recipient: recipientId,
        status: "pending",
      });

      await friendRequest.save();

      // Lấy thông tin người gửi
      const requester = await User.findById(requesterId).select(
        "username fullName profile.avatar"
      );

      // Tạo thông báo cho người nhận
      await NotificationService.createAndEmitNotification({
        recipient: recipientId,
        sender: requesterId,
        type: "FRIEND_REQUEST",
        title: "Yêu cầu kết bạn mới",
        message: `${requester.fullName || requester.username} muốn kết bạn với bạn`,
        data: {
          friendRequestId: friendRequest._id,
          requesterId: requesterId,
        },
        priority: "medium",
        url: `/profile/${requesterId}`,
      });

      // Populate để trả về thông tin đầy đủ
      await friendRequest.populate([
        { path: "requester", select: "username fullName profile.avatar" },
        { path: "recipient", select: "username fullName profile.avatar" },
      ]);

      res.status(201).json({
        success: true,
        message: "Đã gửi yêu cầu kết bạn",
        data: friendRequest,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi gửi yêu cầu kết bạn",
        error: error.message,
      });
    }
  }

  // [POST] /api/friends/accept/:requestId - Chấp nhận yêu cầu kết bạn
  async acceptFriendRequest(req, res) {
    try {
      const userId = req.user.userId;
      const { requestId } = req.params;

      const friendRequest = await FriendRequest.findById(requestId);
      
      // Debug log để kiểm tra
      console.log("Accept request - userId:", userId, "type:", typeof userId, "requestId:", requestId);
      if (friendRequest) {
        console.log("FriendRequest - requester:", friendRequest.requester.toString(), "recipient:", friendRequest.recipient.toString());
      }

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu kết bạn",
        });
      }

      // Convert tất cả IDs sang string để đảm bảo nhất quán
      const recipientIdStr = String(friendRequest.recipient);
      const userIdStr = String(userId);
      
      if (recipientIdStr !== userIdStr) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chấp nhận yêu cầu này",
        });
      }

      if (friendRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Yêu cầu này không còn ở trạng thái pending",
        });
      }

      // Cập nhật trạng thái yêu cầu
      friendRequest.status = "accepted";
      friendRequest.respondedAt = new Date();
      await friendRequest.save();

      // Tạo mối quan hệ bạn bè
      const friendship = new Friend({
        userA: friendRequest.requester,
        userB: friendRequest.recipient,
      });
      await friendship.save();

      // Tự động follow nhau khi thành bạn bè
      // Requester follow recipient
      const follow1 = await Follow.findOne({
        follower: friendRequest.requester,
        following: friendRequest.recipient,
      });
      let newFollow1 = false;
      if (!follow1) {
        await new Follow({
          follower: friendRequest.requester,
          following: friendRequest.recipient,
        }).save();
        newFollow1 = true;
      }
      // Recipient follow requester
      const follow2 = await Follow.findOne({
        follower: friendRequest.recipient,
        following: friendRequest.requester,
      });
      let newFollow2 = false;
      if (!follow2) {
        await new Follow({
          follower: friendRequest.recipient,
          following: friendRequest.requester,
        }).save();
        newFollow2 = true;
      }

      // Emit socket events để cập nhật real-time cho cả 2 user
      const { getIO } = require("../config/socket");
      const io = getIO();
      
      // Convert requester ID sang string để đảm bảo nhất quán
      const requesterIdStr = String(friendRequest.requester);
      
      // Emit cho requester (người gửi yêu cầu) - họ đã follow recipient
      if (newFollow1) {
        io.to(`user_${requesterIdStr}`).emit("follow_status_changed", {
          followerId: requesterIdStr,
          followingId: recipientIdStr,
          action: "followed",
        });
        // Emit cho recipient để cập nhật số lượng followers
        io.to(`user_${recipientIdStr}`).emit("follower_count_changed", {
          followingId: recipientIdStr,
          action: "followed",
          change: 1,
        });
      }
      
      // Emit cho recipient (người nhận/chấp nhận) - họ đã follow requester
      if (newFollow2) {
        io.to(`user_${recipientIdStr}`).emit("follow_status_changed", {
          followerId: recipientIdStr,
          followingId: requesterIdStr,
          action: "followed",
        });
        // Emit cho requester để cập nhật số lượng followers
        io.to(`user_${requesterIdStr}`).emit("follower_count_changed", {
          followingId: requesterIdStr,
          action: "followed",
          change: 1,
        });
      }

      // Emit friend_status_changed cho cả 2 user để cập nhật nút bạn bè
      io.to(`user_${requesterIdStr}`).emit("friend_status_changed", {
        userId: requesterIdStr,
        otherUserId: recipientIdStr,
        status: "friend",
      });
      io.to(`user_${recipientIdStr}`).emit("friend_status_changed", {
        userId: recipientIdStr,
        otherUserId: requesterIdStr,
        status: "friend",
      });

      // Emit friend_count_changed cho cả 2 user để cập nhật số lượng bạn bè
      // Emit cho requester với cả 2 userId để frontend có thể cập nhật đúng
      io.to(`user_${requesterIdStr}`).emit("friend_count_changed", {
        userId: requesterIdStr,
        otherUserId: recipientIdStr,
        action: "friend",
        change: 1,
      });
      // Emit cho recipient với cả 2 userId để frontend có thể cập nhật đúng
      io.to(`user_${recipientIdStr}`).emit("friend_count_changed", {
        userId: recipientIdStr,
        otherUserId: requesterIdStr,
        action: "friend",
        change: 1,
      });

      // Lấy thông tin người chấp nhận và người đã gửi yêu cầu
      const acceptor = await User.findById(userId).select(
        "username fullName profile.avatar"
      );
      const requesterUser = await User.findById(friendRequest.requester).select(
        "username fullName profile.avatar"
      );

      // Tạo thông báo cho người gửi yêu cầu
      await NotificationService.createAndEmitNotification({
        recipient: friendRequest.requester,
        sender: userId,
        type: "FRIEND_REQUEST_ACCEPTED",
        title: "Yêu cầu kết bạn được chấp nhận",
        message: `${acceptor.fullName || acceptor.username} đã chấp nhận yêu cầu kết bạn của bạn`,
        data: {
          friendRequestId: friendRequest._id,
          friendId: friendship._id,
        },
        priority: "medium",
        url: `/profile/${userId}`,
      });

      // Cập nhật thông báo FRIEND_REQUEST cũ thành FRIEND_REQUEST_ACCEPTED cho người đã chấp nhận
      const Notification = require("../models/Notification");
      const oldNotification = await Notification.findOne({
        recipient: userId,
        sender: friendRequest.requester,
        type: "FRIEND_REQUEST",
      });

      if (oldNotification) {
        oldNotification.type = "FRIEND_REQUEST_ACCEPTED";
        oldNotification.title = "Hai bạn đã trở thành bạn bè";
        oldNotification.sender = userId; // người chấp nhận
        // Với người nhận là chính người chấp nhận (userId), thông điệp cần là: "Bạn và <requester> đã trở thành bạn bè"
        const requesterName = requesterUser?.fullName || requesterUser?.username || "bạn bè";
        oldNotification.message = `Bạn và ${requesterName} đã trở thành bạn bè`;
        oldNotification.data = {
          ...(oldNotification.data || {}),
          friendRequestId: friendRequest._id,
          friendId: friendship._id,
        };
        // Đánh dấu đã đọc ngay để không làm tăng badge ở dropdown "Yêu cầu kết bạn"
        oldNotification.read = true;
        oldNotification.readAt = new Date();
        await oldNotification.save();

        await oldNotification.populate([
          { path: "recipient", select: "username fullName profile.avatar" },
          { path: "sender", select: "username fullName profile.avatar" },
        ]);

        // Emit cập nhật cho client của người đã chấp nhận
        io.to(`user_${userId}`).emit("notification_updated", oldNotification);
      }

      // Populate để trả về thông tin đầy đủ
      await friendRequest.populate([
        { path: "requester", select: "username fullName profile.avatar" },
        { path: "recipient", select: "username fullName profile.avatar" },
      ]);

      res.json({
        success: true,
        message: "Đã chấp nhận yêu cầu kết bạn",
        data: {
          friendRequest,
          friendship,
        },
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi chấp nhận yêu cầu kết bạn",
        error: error.message,
      });
    }
  }

  // [POST] /api/friends/reject/:requestId - Từ chối yêu cầu kết bạn
  async rejectFriendRequest(req, res) {
    try {
      const userId = req.user.userId;
      const { requestId } = req.params;

      const friendRequest = await FriendRequest.findById(requestId);
      
      // Debug log để kiểm tra
      console.log("Reject request - userId:", userId, "type:", typeof userId, "requestId:", requestId);
      if (friendRequest) {
        console.log("FriendRequest - requester:", friendRequest.requester.toString(), "recipient:", friendRequest.recipient.toString());
      }

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu kết bạn",
        });
      }

      const recipientIdStr = friendRequest.recipient.toString();
      const userIdStr = userId.toString();
      
      if (recipientIdStr !== userIdStr) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền từ chối yêu cầu này",
        });
      }

      if (friendRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Yêu cầu này không còn ở trạng thái pending",
        });
      }

      // Cập nhật trạng thái yêu cầu
      friendRequest.status = "rejected";
      friendRequest.respondedAt = new Date();
      await friendRequest.save();

      // Lấy thông tin người từ chối và người gửi yêu cầu
      const rejector = await User.findById(userId).select(
        "username fullName profile.avatar"
      );
      const requesterUser = await User.findById(friendRequest.requester).select(
        "username fullName profile.avatar"
      );

      // Tạo thông báo cho người gửi yêu cầu
      await NotificationService.createAndEmitNotification({
        recipient: friendRequest.requester,
        sender: userId,
        type: "FRIEND_REQUEST_REJECTED",
        title: "Yêu cầu kết bạn bị từ chối",
        message: `${rejector.fullName || rejector.username} đã từ chối yêu cầu kết bạn của bạn`,
        data: {
          friendRequestId: friendRequest._id,
        },
        priority: "low",
        url: `/profile/${userId}`,
      });

      // Cập nhật thông báo FRIEND_REQUEST cũ thành FRIEND_REQUEST_REJECTED cho người đã từ chối
      const Notification = require("../models/Notification");
      const { getIO } = require("../config/socket");
      const io = getIO();
      const oldNotification = await Notification.findOne({
        recipient: userId,
        sender: friendRequest.requester,
        type: "FRIEND_REQUEST",
      });

      if (oldNotification) {
        oldNotification.type = "FRIEND_REQUEST_REJECTED";
        oldNotification.title = "Bạn đã từ chối lời mời kết bạn";
        oldNotification.sender = userId;
        // Với người nhận là chính người từ chối (userId), thông điệp cần dùng tên của người đã gửi lời mời
        const requesterName = requesterUser?.fullName || requesterUser?.username || "người này";
        oldNotification.message = `Bạn đã từ chối lời mời kết bạn từ ${requesterName}`;
        // Đánh dấu đã đọc ngay để không hiển thị là chưa đọc ở dropdown yêu cầu kết bạn
        oldNotification.read = true;
        oldNotification.readAt = new Date();
        await oldNotification.save();

        await oldNotification.populate([
          { path: "recipient", select: "username fullName profile.avatar" },
          { path: "sender", select: "username fullName profile.avatar" },
        ]);

        io.to(`user_${userId}`).emit("notification_updated", oldNotification);
      }

      // Populate để trả về thông tin đầy đủ
      await friendRequest.populate([
        { path: "requester", select: "username fullName profile.avatar" },
        { path: "recipient", select: "username fullName profile.avatar" },
      ]);

      res.json({
        success: true,
        message: "Đã từ chối yêu cầu kết bạn",
        data: friendRequest,
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi từ chối yêu cầu kết bạn",
        error: error.message,
      });
    }
  }

  // [POST] /api/friends/cancel/:requestId - Hủy yêu cầu kết bạn
  async cancelFriendRequest(req, res) {
    try {
      const userId = req.user.userId;
      const { requestId } = req.params;

      const friendRequest = await FriendRequest.findById(requestId);
      
      // Debug log để kiểm tra
      console.log("Cancel request - userId:", userId, "type:", typeof userId, "requestId:", requestId);
      if (friendRequest) {
        console.log("FriendRequest - requester:", friendRequest.requester.toString(), "recipient:", friendRequest.recipient.toString());
      }

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu kết bạn",
        });
      }

      const requesterIdStr = friendRequest.requester.toString();
      const userIdStr = userId.toString();
      
      if (requesterIdStr !== userIdStr) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hủy yêu cầu này",
        });
      }

      if (friendRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Yêu cầu này không còn ở trạng thái pending",
        });
      }

      // Cập nhật trạng thái yêu cầu
      friendRequest.status = "cancelled";
      friendRequest.respondedAt = new Date();
      await friendRequest.save();

      // Xóa thông báo FRIEND_REQUEST ở người nhận
      const oldNotification = await require("../models/Notification").findOne({
        recipient: friendRequest.recipient,
        sender: userId,
        type: "FRIEND_REQUEST",
      });

      if (oldNotification) {
        await require("../models/Notification").deleteOne({
          _id: oldNotification._id,
        });

        // Emit event để xóa thông báo real-time
        const { getIO } = require("../config/socket");
        const io = getIO();
        io.to(`user_${friendRequest.recipient}`).emit(
          "notification_deleted",
          oldNotification._id
        );
      }

      // Populate để trả về thông tin đầy đủ
      await friendRequest.populate([
        { path: "requester", select: "username fullName profile.avatar" },
        { path: "recipient", select: "username fullName profile.avatar" },
      ]);

      res.json({
        success: true,
        message: "Đã hủy yêu cầu kết bạn",
        data: friendRequest,
      });
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi hủy yêu cầu kết bạn",
        error: error.message,
      });
    }
  }

  // [GET] /api/friends/requests - Lấy danh sách yêu cầu kết bạn
  async getFriendRequests(req, res) {
    try {
      const userId = req.user.userId;
      const { type = "received" } = req.query; // "received" hoặc "sent"

      let query = {};
      if (type === "received") {
        query = { recipient: userId, status: "pending" };
      } else if (type === "sent") {
        query = { requester: userId, status: "pending" };
      } else {
        query = {
          $or: [
            { recipient: userId, status: "pending" },
            { requester: userId, status: "pending" },
          ],
        };
      }

      const friendRequests = await FriendRequest.find(query)
        .sort({ createdAt: -1 })
        .populate("requester", "username fullName profile.avatar")
        .populate("recipient", "username fullName profile.avatar");

      res.json({
        success: true,
        data: friendRequests,
        count: friendRequests.length,
      });
    } catch (error) {
      console.error("Error getting friend requests:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách yêu cầu kết bạn",
        error: error.message,
      });
    }
  }

  // [GET] /api/friends - Lấy danh sách bạn bè
  async getFriends(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const friendships = await Friend.find({
        $or: [{ userA: userId }, { userB: userId }],
      })
        .populate("userA", "username fullName profile.avatar isOnline")
        .populate("userB", "username fullName profile.avatar isOnline")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      // Trả về thông tin bạn bè (người không phải user hiện tại)
      const friends = friendships.map((friendship) => {
        const friend =
          friendship.userA._id.toString() === userId
            ? friendship.userB
            : friendship.userA;
        return {
          ...friend.toObject(),
          friendshipId: friendship._id,
          becameFriendsAt: friendship.createdAt,
        };
      });

      const total = await Friend.countDocuments({
        $or: [{ userA: userId }, { userB: userId }],
      });

      res.json({
        success: true,
        data: friends,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          results: friends.length,
          totalFriends: total,
        },
      });
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách bạn bè",
        error: error.message,
      });
    }
  }

  // [GET] /api/friends/:userId - Lấy danh sách bạn bè của một user cụ thể
  async getFriendsByUserId(req, res) {
    try {
      const { userId: targetUserId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const friendships = await Friend.find({
        $or: [{ userA: targetUserId }, { userB: targetUserId }],
      })
        .populate("userA", "username fullName profile.avatar isOnline")
        .populate("userB", "username fullName profile.avatar isOnline")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      // Trả về thông tin bạn bè (người không phải target user)
      const friends = friendships.map((friendship) => {
        const friend =
          friendship.userA._id.toString() === targetUserId
            ? friendship.userB
            : friendship.userA;
        return {
          ...friend.toObject(),
          friendshipId: friendship._id,
          becameFriendsAt: friendship.createdAt,
        };
      });

      const total = await Friend.countDocuments({
        $or: [{ userA: targetUserId }, { userB: targetUserId }],
      });

      res.json({
        success: true,
        data: friends,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          results: friends.length,
          totalFriends: total,
        },
      });
    } catch (error) {
      console.error("Error getting friends by userId:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách bạn bè",
        error: error.message,
      });
    }
  }

  // [GET] /api/friends/status/:userId - Kiểm tra trạng thái với một user
  async getFriendStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { userId: targetUserId } = req.params;

      if (userId === targetUserId) {
        return res.json({
          success: true,
          data: {
            status: "self",
            isFriend: false,
            friendRequest: null,
          },
        });
      }

      // Kiểm tra đã là bạn bè chưa
      const friendship = await Friend.findOne({
        $or: [
          { userA: userId, userB: targetUserId },
          { userA: targetUserId, userB: userId },
        ],
      });

      if (friendship) {
        return res.json({
          success: true,
          data: {
            status: "friend",
            isFriend: true,
            friendRequest: null,
            friendshipId: friendship._id,
          },
        });
      }

      // Kiểm tra yêu cầu kết bạn
      const friendRequest = await FriendRequest.findOne({
        $or: [
          { requester: userId, recipient: targetUserId, status: "pending" },
          { requester: targetUserId, recipient: userId, status: "pending" },
        ],
      });

      if (friendRequest) {
        const requesterIdStr = friendRequest.requester.toString();
        const userIdStr = userId.toString();
        const isRequester = requesterIdStr === userIdStr;
        
        return res.json({
          success: true,
          data: {
            status: isRequester ? "sent" : "received",
            isFriend: false,
            friendRequest: {
              id: friendRequest._id,
              status: friendRequest.status,
              isRequester,
            },
          },
        });
      }

      res.json({
        success: true,
        data: {
          status: "none",
          isFriend: false,
          friendRequest: null,
        },
      });
    } catch (error) {
      console.error("Error getting friend status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra trạng thái bạn bè",
        error: error.message,
      });
    }
  }

  // [DELETE] /api/friends/:friendshipId - Xóa bạn bè
  async removeFriend(req, res) {
    try {
      const userId = req.user.userId;
      const { friendshipId } = req.params;

      const friendship = await Friend.findById(friendshipId);

      if (!friendship) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy mối quan hệ bạn bè",
        });
      }

      if (
        friendship.userA.toString() !== userId &&
        friendship.userB.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa bạn bè này",
        });
      }

      // Xác định user còn lại (người kia)
      const otherUserId = 
        friendship.userA.toString() === userId 
          ? friendship.userB 
          : friendship.userA;

      // Xóa mối quan hệ bạn bè
      await Friend.deleteOne({ _id: friendshipId });

      // Tự động hủy follow nhau khi xóa bạn bè
      const follow1 = await Follow.findOneAndDelete({
        follower: userId,
        following: otherUserId,
      });
      const follow2 = await Follow.findOneAndDelete({
        follower: otherUserId,
        following: userId,
      });

      // Emit socket events để cập nhật real-time
      const { getIO } = require("../config/socket");
      const io = getIO();

      // Emit follow_status_changed cho cả 2 user (để cập nhật nút follow)
      if (follow1) {
        io.to(`user_${userId}`).emit("follow_status_changed", {
          followerId: userId,
          followingId: otherUserId,
          action: "unfollowed",
        });
      }
      if (follow2) {
        io.to(`user_${otherUserId}`).emit("follow_status_changed", {
          followerId: otherUserId,
          followingId: userId,
          action: "unfollowed",
        });
      }

      // Emit follower_count_changed cho cả 2 user (để cập nhật số lượng followers)
      if (follow1) {
        io.to(`user_${otherUserId}`).emit("follower_count_changed", {
          followingId: otherUserId,
          action: "unfollowed",
          change: -1,
        });
      }
      if (follow2) {
        io.to(`user_${userId}`).emit("follower_count_changed", {
          followingId: userId,
          action: "unfollowed",
          change: -1,
        });
      }

      // Emit friend_status_changed cho cả 2 user (để cập nhật nút bạn bè)
      io.to(`user_${userId}`).emit("friend_status_changed", {
        userId,
        otherUserId,
        status: "none",
      });
      io.to(`user_${otherUserId}`).emit("friend_status_changed", {
        userId: otherUserId,
        otherUserId: userId,
        status: "none",
      });

      // Emit friend_count_changed cho cả 2 user để cập nhật số lượng bạn bè
      const userIdStr = String(userId);
      const otherUserIdStr = String(otherUserId);
      
      // Emit cho userId với cả 2 userId để frontend có thể cập nhật đúng
      io.to(`user_${userIdStr}`).emit("friend_count_changed", {
        userId: userIdStr,
        otherUserId: otherUserIdStr,
        action: "unfriend",
        change: -1,
      });
      // Emit cho otherUserId với cả 2 userId để frontend có thể cập nhật đúng
      io.to(`user_${otherUserIdStr}`).emit("friend_count_changed", {
        userId: otherUserIdStr,
        otherUserId: userIdStr,
        action: "unfriend",
        change: -1,
      });

      res.json({
        success: true,
        message: "Đã xóa bạn bè",
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa bạn bè",
        error: error.message,
      });
    }
  }
}

module.exports = new FriendController();

