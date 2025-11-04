import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import friendService from "../../services/friendService";
import "./FriendButton.css";

const FriendButton = ({ userId, onStatusChange }) => {
  const { user } = useAuth();
  const [friendStatus, setFriendStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || !userId || user._id === userId) {
      setLoading(false);
      return;
    }
    loadFriendStatus();
  }, [userId, user]);

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
      await friendService.acceptFriendRequest(friendStatus.friendRequest.id);
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
      await friendService.rejectFriendRequest(friendStatus.friendRequest.id);
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
    return (
      <button className="btn btn-success btn-sm friend-btn" disabled>
        <i className="ri-user-check-line me-1"></i>
        Bạn bè
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

