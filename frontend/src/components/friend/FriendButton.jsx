import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import friendService from "../../services/friendService";
import "./FriendButton.css";
import { io } from "socket.io-client";

const FriendButton = ({ userId, onStatusChange }) => {
  const { user } = useAuth();
  const [friendStatus, setFriendStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !userId || user._id === userId) {
      setLoading(false);
      return;
    }
    loadFriendStatus();
  }, [userId, user]);

  // Lắng nghe sự kiện cục bộ từ các nơi khác trong app (ví dụ dropdown yêu cầu kết bạn)
  useEffect(() => {
    const handler = (e) => {
      const { otherUserId } = e.detail || {};
      if (!otherUserId) return;
      if (String(otherUserId) === String(userId)) {
        loadFriendStatus();
        if (onStatusChange) onStatusChange();
      }
    };
    window.addEventListener("friend:status-changed", handler);
    return () => window.removeEventListener("friend:status-changed", handler);
  }, [userId]);

  // Realtime: lắng nghe sự kiện liên quan đến quan hệ bạn bè để cập nhật nút ngay lập tức
  useEffect(() => {
    if (!user) return;

    const socket = io(
      process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL,
      { withCredentials: true }
    );
    socketRef.current = socket;

    // Tham gia room thông báo của current user
    socket.emit("join_notifications", user.id || user._id);

    const shouldAffectThisButton = (payload) => {
      const otherId = String(userId);
      const senderId = String(payload.sender?._id || payload.sender || "");
      const recipientId = String(payload.recipient?._id || payload.recipient || "");
      return senderId === otherId || recipientId === otherId;
    };

    const handleNew = (notification) => {
      if (!notification || !notification.type) return;
      if (
        [
          "FRIEND_REQUEST",
          "FRIEND_REQUEST_ACCEPTED",
          "FRIEND_REQUEST_REJECTED",
          "FRIEND_REQUEST_CANCELLED",
        ].includes(notification.type) && shouldAffectThisButton(notification)
      ) {
        // Reload status khi có bất kỳ sự kiện liên quan tới userId đối diện
        loadFriendStatus();
        if (onStatusChange) onStatusChange();
      }
    };

    const handleUpdated = (notification) => handleNew(notification);

    // Lắng nghe friend_status_changed để cập nhật nút bạn bè real-time
    const handleFriendStatusChanged = (data) => {
      const { userId: eventUserId, otherUserId, status } = data;
      const otherId = String(userId);
      const eventUserIdStr = String(eventUserId);
      const otherUserIdStr = String(otherUserId);

      // Nếu sự kiện liên quan đến user này
      if (eventUserIdStr === otherId || otherUserIdStr === otherId) {
        if (status === "none") {
          // Xóa bạn bè - reload status
          loadFriendStatus();
          if (onStatusChange) onStatusChange();
        }
      }
    };

    socket.on("new_notification", handleNew);
    socket.on("notification_updated", handleUpdated);
    socket.on("friend_status_changed", handleFriendStatusChanged);

    return () => {
      socket.off("new_notification", handleNew);
      socket.off("notification_updated", handleUpdated);
      socket.off("friend_status_changed", handleFriendStatusChanged);
      socket.disconnect();
    };
  }, [user, userId]);

  const loadFriendStatus = async () => {
    try {
      setLoading(true);
      const response = await friendService.getFriendStatus(userId);
      setFriendStatus(response.data);
    } catch (error) {
      console.error("Error loading friend status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setActionLoading(true);
      const response = await friendService.sendFriendRequest(userId);
      // Reload status ngay sau khi gửi
      await loadFriendStatus();
      if (onStatusChange) onStatusChange();
    } catch (error) {
      alert(error.message || "Lỗi khi gửi yêu cầu kết bạn");
      // Reload lại status nếu có lỗi
      await loadFriendStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setActionLoading(true);
      await friendService.cancelFriendRequest(friendStatus.friendRequest.id);
      await loadFriendStatus();
      if (onStatusChange) onStatusChange();
    } catch (error) {
      alert(error.message || "Lỗi khi hủy yêu cầu kết bạn");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      setActionLoading(true);
      const reqId = friendStatus.friendRequest.id;
      await friendService.acceptFriendRequest(reqId);
      // Thông báo cục bộ cho các dropdown/komponent khác xoá request
      window.dispatchEvent(
        new CustomEvent("friend:status-changed", {
          detail: { otherUserId: String(userId), status: "friend", friendRequestId: String(reqId) },
        })
      );
      await loadFriendStatus();
      if (onStatusChange) onStatusChange();
    } catch (error) {
      alert(error.message || "Lỗi khi chấp nhận yêu cầu kết bạn");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    try {
      setActionLoading(true);
      const reqId = friendStatus.friendRequest.id;
      await friendService.rejectFriendRequest(reqId);
      // Thông báo cục bộ để xoá item trong dropdown yêu cầu kết bạn
      window.dispatchEvent(
        new CustomEvent("friend:status-changed", {
          detail: { otherUserId: String(userId), status: "none", friendRequestId: String(reqId) },
        })
      );
      await loadFriendStatus();
      if (onStatusChange) onStatusChange();
    } catch (error) {
      alert(error.message || "Lỗi khi từ chối yêu cầu kết bạn");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !user || user._id === userId) {
    return null;
  }

  if (!friendStatus) {
    return (
      <button
        className="btn btn-primary btn-sm friend-btn"
        onClick={handleSendRequest}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Đang xử lý...
          </>
        ) : (
          <>
            <i className="ri-user-add-line me-1"></i>
            Kết bạn
          </>
        )}
      </button>
    );
  }

  const { status, isFriend, friendRequest } = friendStatus;

  if (isFriend) {
    const handleRemoveFriend = async () => {
      try {
        if (!friendStatus.friendshipId) return;
        const confirmRemove = window.confirm("Bạn có chắc muốn xóa bạn bè?");
        if (!confirmRemove) return;
        setActionLoading(true);
        await friendService.removeFriend(friendStatus.friendshipId);
        // Thông báo cục bộ để đồng bộ các nút khác
        window.dispatchEvent(
          new CustomEvent("friend:status-changed", {
            detail: { otherUserId: String(userId), status: "none" },
          })
        );
        await loadFriendStatus();
        if (onStatusChange) onStatusChange();
      } catch (error) {
        alert(error.message || "Lỗi khi xóa bạn bè");
      } finally {
        setActionLoading(false);
      }
    };
    return (
      <button
        className="btn btn-success btn-sm friend-btn"
        onClick={handleRemoveFriend}
        disabled={actionLoading}
        title="Bấm để xóa bạn bè"
      >
        {actionLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Đang xử lý...
          </>
        ) : (
          <>
            <i className="bi bi-person-check-fill me-1"></i>
            Bạn bè
          </>
        )}
      </button>
    );
  }

  // Kiểm tra status === "sent" và có friendRequest
  if (status === "sent" && friendRequest && friendRequest.id) {
    return (
      <button
        className="btn btn-secondary btn-sm friend-btn"
        onClick={handleCancelRequest}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Đang xử lý...
          </>
        ) : (
          <>
            <i className="ri-close-line me-1"></i>
            Hủy yêu cầu
          </>
        )}
      </button>
    );
  }

  // Kiểm tra status === "received" và có friendRequest
  if (status === "received" && friendRequest && friendRequest.id) {
    return (
      <div className="friend-request-buttons">
        <button
          className="btn btn-success btn-sm me-2"
          onClick={handleAcceptRequest}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Đang xử lý...
            </>
          ) : (
            <>
              <i className="ri-check-line me-1"></i>
              Chấp nhận
            </>
          )}
        </button>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={handleRejectRequest}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
            </>
          ) : (
            <>
              <i className="ri-close-line me-1"></i>
              Từ chối
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn btn-primary btn-sm friend-btn"
      onClick={handleSendRequest}
      disabled={actionLoading}
    >
      {actionLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" />
          Đang xử lý...
        </>
      ) : (
        <>
          <i className="ri-user-add-line me-1"></i>
          Kết bạn
        </>
      )}
    </button>
  );
};

export default FriendButton;

