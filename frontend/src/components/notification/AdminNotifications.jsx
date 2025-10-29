import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../services/api"; // Import axios instance
import "./Notifications.css";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    // Kết nối socket
    const socket = io(process.env.REACT_APP_BACKEND_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    // Join admin notification room
    socket.emit("join_admin_notifications");

    // Lắng nghe thông báo mới
    socket.on("admin_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);
      showToast(notification);
    });

    // Lắng nghe thông báo mới cho user cụ thể (nếu admin cũng có user account)
    socket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);
      showToast(notification);
    });

    // Lấy danh sách thông báo chưa đọc từ API
    fetchUnreadNotifications();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.get("/api/notifications?read=false&limit=5");
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.total);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Nếu lỗi 401, token sẽ tự động được xử lý bởi interceptor
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit("mark_notification_read", {
          notificationId,
          userId: "admin",
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const showToast = (notification) => {
    // Kiểm tra xem toast container đã tồn tại chưa
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `notification-toast ${getPriorityClass(
      notification.priority
    )}`;
    toast.innerHTML = `
      <div class="toast-header">
        <strong>${notification.title}</strong>
        <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
      <div class="toast-body">
        ${notification.message}
        <small class="text-muted">${new Date(
          notification.createdAt
        ).toLocaleTimeString()}</small>
      </div>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 5000);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "urgent":
        return "alert-danger";
      case "high":
        return "alert-warning";
      case "medium":
        return "alert-info";
      default:
        return "alert-secondary";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return "ri-error-warning-fill text-danger";
      case "high":
        return "ri-alarm-warning-fill text-warning";
      case "medium":
        return "ri-information-fill text-info";
      default:
        return "ri-notification-fill text-secondary";
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

  return (
    <>
      {/* Toast Container sẽ được tạo động */}

      {/* Notifications Dropdown */}
      <li className="nav-item dropdown">
        <a
          href="#"
          className="search-toggle dropdown-toggle position-relative"
          id="notification-drop"
          data-bs-toggle="dropdown"
        >
          <i className="ri-notification-4-line"></i>
          {unreadCount > 0 && (
            <span className="badge bg-danger notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </a>
        <div
          className="sub-drop sub-drop-large dropdown-menu dropdown-menu-end"
          aria-labelledby="notification-drop"
        >
          <div className="card shadow-none m-0">
            <div className="card-header d-flex justify-content-between bg-primary">
              <div className="header-title bg-primary">
                <h5 className="mb-0 text-white">Admin Alerts</h5>
              </div>
              <div className="d-flex align-items-center">
                {unreadCount > 0 && (
                  <small className="badge bg-light text-dark me-2">
                    {unreadCount}
                  </small>
                )}
                {unreadCount > 0 && (
                  <button
                    className="btn btn-sm btn-light"
                    onClick={markAllAsRead}
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <i className="ri-check-double-line"></i>
                  </button>
                )}
              </div>
            </div>
            <div
              className="card-body p-0"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {notifications.length > 0 ? (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`alert p-2 mb-2 ${getPriorityClass(
                        notification.priority
                      )} ${!notification.read ? "unread-notification" : ""}`}
                      onClick={() => markAsRead(notification._id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-start">
                        <i
                          className={`${getPriorityIcon(
                            notification.priority
                          )} me-2 mt-1`}
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
                        {!notification.read && (
                          <span className="badge bg-primary ms-2">Mới</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-3">
                  <p className="mb-2">No new notifications</p>
                </div>
              )}
              <div className="text-center p-2 border-top">
                <Link to="/admin/notifications" className="btn text-primary">
                  View All Alerts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </li>
    </>
  );
};

export default AdminNotifications;
