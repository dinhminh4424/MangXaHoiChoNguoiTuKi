import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import friendService from "../../services/friendService";

const FriendRequestsDropdown = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendNotifications, setFriendNotifications] = useState([]); // Thông báo về bạn bè (FRIEND_REQUEST_ACCEPTED, FRIEND_REQUEST_REJECTED)
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Lấy danh sách yêu cầu kết bạn đang pending
  const fetchFriendRequests = async () => {
    try {
      const response = await api.get("/api/friends/requests?type=received");
      if (response.data.success) {
        setFriendRequests(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  // Lấy thông báo liên quan đến bạn bè (FRIEND_REQUEST_ACCEPTED, FRIEND_REQUEST_REJECTED)
  const fetchFriendNotifications = async () => {
    try {
      const response = await api.get("/api/notifications", {
        params: {
          limit: 50,
        },
      });
      if (response.data.success) {
        // Lọc các thông báo FRIEND_REQUEST_ACCEPTED và FRIEND_REQUEST_REJECTED
        // Chỉ lấy thông báo mà người dùng hiện tại là người nhận ban đầu (người đã chấp nhận/từ chối yêu cầu)
        // Backend cập nhật thông báo cũ với recipient = userId (người đã chấp nhận) và sender = userId
        const userId = user.id || user._id;
        const filtered = response.data.notifications.filter((notif) => {
          const isFriendType =
            notif.type === "FRIEND_REQUEST_ACCEPTED" ||
            notif.type === "FRIEND_REQUEST_REJECTED";
          const notificationRecipient = notif.recipient?._id || notif.recipient;
          const notificationSender = notif.sender?._id || notif.sender;
          
          // Chỉ lấy thông báo mà người dùng là recipient (người đã chấp nhận/từ chối)
          // Và sender cũng là chính người dùng (thông báo được cập nhật từ FRIEND_REQUEST cũ)
          return (
            isFriendType &&
            notificationRecipient === userId &&
            notificationSender === userId
          );
        });
        setFriendNotifications(filtered);
      }
    } catch (error) {
      console.error("Error fetching friend notifications:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Kết nối socket
    const socket = io(process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    // Join user notification room
    socket.emit("join_notifications", user.id || user._id);

    // Lắng nghe thông báo mới
    const handleNewNotification = async (notification) => {
      const notificationRecipient = String(notification.recipient?._id || notification.recipient);
      const userId = String(user.id || user._id);
      
      // Chỉ xử lý thông báo gửi đến người dùng hiện tại
      if (notificationRecipient !== userId) return;
      
      if (notification.type === "FRIEND_REQUEST") {
        // Cập nhật ngay khi có yêu cầu kết bạn mới
        // Fetch thông tin request mới và thêm vào state
        const friendRequestId = notification.data?.friendRequestId;
        if (friendRequestId) {
          try {
            // Fetch thông tin request mới
            const response = await api.get(`/api/friends/requests?type=received`);
            if (response.data.success) {
              setFriendRequests(response.data.data || []);
            }
          } catch (error) {
            console.error("Error fetching new friend request:", error);
            // Fallback: fetch lại toàn bộ
            fetchFriendRequests();
          }
        } else {
          // Nếu không có ID, fetch lại toàn bộ
          fetchFriendRequests();
        }
      } else if (
        notification.type === "FRIEND_REQUEST_ACCEPTED" ||
        notification.type === "FRIEND_REQUEST_REJECTED"
      ) {
        // FRIEND_REQUEST_ACCEPTED hoặc FRIEND_REQUEST_REJECTED
        // Chỉ cập nhật nếu người dùng là người nhận và sender (thông báo được cập nhật từ FRIEND_REQUEST cũ)
        const notificationSender = String(notification.sender?._id || notification.sender);
        if (notificationSender === userId) {
          // Thêm thông báo mới vào state
          setFriendNotifications((prev) => {
            const exists = prev.some((n) => n._id === notification._id);
            if (exists) {
              return prev.map((n) => (n._id === notification._id ? notification : n));
            }
            return [notification, ...prev];
          });
        }
      }
    };

    socket.on("new_notification", handleNewNotification);

    // Lắng nghe khi thông báo được cập nhật
    const handleNotificationUpdated = (updatedNotification) => {
      if (
        updatedNotification.type === "FRIEND_REQUEST_ACCEPTED" ||
        updatedNotification.type === "FRIEND_REQUEST_REJECTED"
      ) {
        const notificationRecipient = String(updatedNotification.recipient?._id || updatedNotification.recipient);
        const notificationSender = String(updatedNotification.sender?._id || updatedNotification.sender);
        const userId = String(user.id || user._id);
        if (
          notificationRecipient === userId &&
          notificationSender === userId
        ) {
          // Cập nhật thông báo trong state
          setFriendNotifications((prev) => {
            const exists = prev.some((n) => n._id === updatedNotification._id);
            if (exists) {
              return prev.map((n) => (n._id === updatedNotification._id ? updatedNotification : n));
            }
            return [updatedNotification, ...prev];
          });
        }
      }
    };

    socket.on("notification_updated", handleNotificationUpdated);

    // Lấy dữ liệu ban đầu
    fetchFriendRequests();
    fetchFriendNotifications();
    setLoading(false);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("notification_updated", handleNotificationUpdated);
      socket.disconnect();
    };
  }, [user]);

  // Lắng nghe sự kiện cục bộ để xoá item khỏi dropdown khi thao tác bằng nút trong profile
  useEffect(() => {
    const handler = (e) => {
      const { friendRequestId, otherUserId } = e.detail || {};
      if (friendRequestId) {
        setFriendRequests((prev) => prev.filter((r) => String(r._id) !== String(friendRequestId)));
      } else if (otherUserId) {
        // fallback: so khớp theo requester id
        setFriendRequests((prev) =>
          prev.filter((r) => String(r.requester?._id || r.requester) !== String(otherUserId))
        );
      }
    };
    window.addEventListener("friend:status-changed", handler);
    return () => window.removeEventListener("friend:status-changed", handler);
  }, []);

  // Đảm bảo click bên ngoài sẽ đóng dropdown
  useEffect(() => {
    const handleDocumentClick = (event) => {
      const container = dropdownRef.current;
      if (!container) return;
      if (!container.contains(event.target)) {
        const toggleEl = document.getElementById("friend-requests-drop");
        const bs = window.bootstrap;
        if (bs && bs.Dropdown && toggleEl) {
          const instance = bs.Dropdown.getOrCreateInstance(toggleEl);
          instance.hide();
        } else {
          toggleEl && toggleEl.classList.remove("show");
          const menu = container.querySelector(".dropdown-menu");
          menu && menu.classList.remove("show");
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, []);

  const handleAcceptRequest = async (requestId, requesterUserId) => {
    try {
      // Xóa request khỏi danh sách ngay lập tức để cập nhật badge
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
      
      await friendService.acceptFriendRequest(requestId);
      
      // Fetch lại để đảm bảo đồng bộ
      await fetchFriendRequests();
      await fetchFriendNotifications();

      // Phát sự kiện cục bộ để các FriendButton cập nhật ngay (trang hiện tại)
      if (requesterUserId) {
        window.dispatchEvent(
          new CustomEvent("friend:status-changed", {
            detail: { otherUserId: String(requesterUserId), status: "friend" },
          })
        );
      }
    } catch (error) {
      // Nếu có lỗi, fetch lại để khôi phục state
      await fetchFriendRequests();
      alert(error.message || "Lỗi khi chấp nhận yêu cầu kết bạn");
    }
  };

  const handleRejectRequest = async (requestId, requesterUserId) => {
    try {
      // Xóa request khỏi danh sách ngay lập tức để cập nhật badge
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
      
      await friendService.rejectFriendRequest(requestId);
      
      // Fetch lại để đảm bảo đồng bộ
      await fetchFriendRequests();
      await fetchFriendNotifications();

      // Phát sự kiện cục bộ để các FriendButton cập nhật ngay (trang hiện tại)
      if (requesterUserId) {
        window.dispatchEvent(
          new CustomEvent("friend:status-changed", {
            detail: { otherUserId: String(requesterUserId), status: "none" },
          })
        );
      }
    } catch (error) {
      // Nếu có lỗi, fetch lại để khôi phục state
      await fetchFriendRequests();
      alert(error.message || "Lỗi khi từ chối yêu cầu kết bạn");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const pendingRequestsCount = friendRequests.length;
  const notificationsCount = friendNotifications.filter((n) => !n.read).length;
  const totalCount = pendingRequestsCount + notificationsCount;

  return (
    <li className="nav-item dropdown" data-bs-auto-close="outside" ref={dropdownRef}>
      <a
        href="#"
        className="dropdown-toggle position-relative"
        id="friend-requests-drop"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
      >
        <i className="ri-group-line"></i>
        {totalCount > 0 && (
          <span className="badge bg-danger notification-badge" style={{ fontSize: "0.7rem" }}>
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </a>
      <div
        className="sub-drop sub-drop-large dropdown-menu dropdown-menu-end"
        aria-labelledby="friend-requests-drop"
        data-bs-auto-close="outside"
      >
        <div className="card shadow-none m-0" style={{ minWidth: "380px" }}>
          <div className="card-header d-flex justify-content-between bg-primary">
            <div className="header-title">
              <h5 className="mb-0 text-white">Yêu cầu kết bạn</h5>
            </div>
            <small className="badge bg-light text-dark">{totalCount}</small>
          </div>
          <div
            className="card-body p-0"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {loading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : pendingRequestsCount > 0 || friendNotifications.length > 0 ? (
              <div className="p-2">
                {/* Hiển thị thông báo khi đã chấp nhận/từ chối */}
                {friendNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`alert p-2 mb-2 alert-light ${
                      !notification.read ? "unread-notification" : ""
                    }`}
                    style={{ cursor: "default" }}
                  >
                    <div className="d-flex align-items-start">
                      <i
                        className={`${
                          notification.type === "FRIEND_REQUEST_ACCEPTED"
                            ? "ri-user-check-fill text-success"
                            : "ri-user-unfollow-fill text-danger"
                        } me-2 mt-1`}
                      ></i>
                      <div className="flex-grow-1">
                        <h6 className="mb-1" style={{ fontSize: "0.875rem" }}>
                          {notification.title}
                        </h6>
                        <p className="mb-1" style={{ fontSize: "0.75rem" }}>
                          {notification.message}
                        </p>
                        <small className="text-muted">
                          {formatTime(notification.createdAt)}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Hiển thị yêu cầu kết bạn đang pending */}
                {friendRequests.map((request) => (
                  <div
                    key={request._id}
                    className="alert p-2 mb-2 alert-info"
                    style={{ cursor: "default" }}
                  >
                    <div className="d-flex align-items-start">
                      <img
                        src={
                          request.requester?.profile?.avatar ||
                          "/assets/images/user/1.jpg"
                        }
                        className="rounded-circle me-2"
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                        alt={request.requester?.fullName || request.requester?.username}
                      />
                      <div className="flex-grow-1">
                        <h6 className="mb-1" style={{ fontSize: "0.875rem" }}>
                          {request.requester?.fullName || request.requester?.username}
                        </h6>
                        <p className="mb-1" style={{ fontSize: "0.75rem" }}>
                          muốn kết bạn với bạn
                        </p>
                        <small className="text-muted d-block mb-2">
                          {formatTime(request.createdAt)}
                        </small>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAcceptRequest(request._id, request.requester?._id || request.requester)}
                          >
                            <i className="ri-check-line me-1"></i>
                            Chấp nhận
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRejectRequest(request._id, request.requester?._id || request.requester)}
                          >
                            <i className="ri-close-line me-1"></i>
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-3">
                <p className="mb-2">Chưa có yêu cầu kết bạn</p>
                <Link to="/friends/requests" className="btn text-primary">
                  Xem tất cả
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default FriendRequestsDropdown;

