import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../services/api"; // Import axios instance
import "./Notifications.css";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

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

  const showToast = useCallback((notification) => {
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
  }, []);

  useEffect(() => {
    // Kết nối socket
    const socket = io(
      process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL,
      {
        withCredentials: true,
      }
    );
    socketRef.current = socket;

    // Join admin notification room
    socket.emit("join_admin_notifications");

    // Lắng nghe thông báo mới từ admin room (simplified notification)
    socket.on("admin_notification", (notification) => {
      // Tạo một notification object với đầy đủ thông tin cần thiết
      const notificationObj = {
        _id: notification._id || `admin_${Date.now()}_${Math.random()}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority || "urgent",
        data: notification.data,
        url: notification.url,
        read: false,
        createdAt: notification.createdAt || new Date(),
      };
      setNotifications((prev) => {
        // Kiểm tra xem notification đã tồn tại chưa (tránh duplicate)
        const exists = prev.some((n) => n._id === notificationObj._id);
        if (exists) return prev;
        return [notificationObj, ...prev.slice(0, 9)];
      });
      setUnreadCount((prev) => prev + 1);
      showToast(notificationObj);
    });

    // Lắng nghe thông báo mới cho user cụ thể (nếu admin cũng có user account)
    socket.on("new_notification", (notification) => {
      setNotifications((prev) => {
        // Kiểm tra xem notification đã tồn tại chưa (tránh duplicate)
        const exists = prev.some((n) => n._id === notification._id);
        if (exists) return prev;
        return [notification, ...prev.slice(0, 9)];
      });
      setUnreadCount((prev) => prev + 1);
      showToast(notification);
    });

    // Lấy danh sách thông báo chưa đọc từ API
    fetchUnreadNotifications();

    return () => {
      socket.disconnect();
    };
  }, [showToast]);

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

  const getPriorityIcon = (priority, type) => {
    // Đặc biệt cho SOS Emergency
    if (type === "SOS_EMERGENCY") {
      return "ri-alarm-line text-danger";
    }

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
        <button
          type="button"
          className="search-toggle dropdown-toggle position-relative border-0 bg-transparent p-0"
          id="notification-drop"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="ri-notification-4-line"></i>
          {unreadCount > 0 && (
            <span className="badge bg-danger notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
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
              style={{ maxHeight: "500px", overflowY: "auto" }}
            >
              {notifications.length > 0 ? (
                <div className="p-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item-admin ${getPriorityClass(
                        notification.priority
                      )} ${!notification.read ? "unread-notification" : ""} ${
                        notification.type === "SOS_EMERGENCY"
                          ? "sos-notification"
                          : ""
                      }`}
                      onClick={() => markAsRead(notification._id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        {/* Icon Container */}
                        <div
                          className={`notification-icon-container ${
                            notification.type === "SOS_EMERGENCY"
                              ? "sos-icon"
                              : `priority-${notification.priority}`
                          }`}
                        >
                          <i
                            className={getPriorityIcon(
                              notification.priority,
                              notification.type
                            )}
                          ></i>
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1 notification-content">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="notification-title mb-0">
                              {notification.title}
                            </h6>
                            {!notification.read && (
                              <span
                                className={`notification-badge ${
                                  notification.type === "SOS_EMERGENCY"
                                    ? "badge-danger"
                                    : "badge-primary"
                                }`}
                              >
                                {notification.type === "SOS_EMERGENCY"
                                  ? "🚨"
                                  : "•"}
                              </span>
                            )}
                          </div>

                          <p className="notification-message mb-2">
                            {notification.message}
                          </p>

                          {/* SOS Emergency Info */}
                          {notification.type === "SOS_EMERGENCY" &&
                            notification.data && (
                              <div className="sos-info mb-2">
                                {notification.data.address && (
                                  <div className="sos-address">
                                    <i className="ri-map-pin-line me-1"></i>
                                    <span>{notification.data.address}</span>
                                  </div>
                                )}
                                {notification.data.mapUrl && (
                                  <a
                                    href={notification.data.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sos-map-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <i className="ri-map-2-line me-1"></i>
                                    Xem trên bản đồ
                                  </a>
                                )}
                              </div>
                            )}

                          <div className="d-flex justify-content-between align-items-center">
                            <small className="notification-time">
                              <i className="ri-time-line me-1"></i>
                              {formatTime(notification.createdAt)}
                            </small>
                            {notification.type === "SOS_EMERGENCY" && (
                              <span className="sos-label">SOS</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-5">
                  <i
                    className="ri-notification-off-line"
                    style={{ fontSize: "3rem", color: "#cbd5e1" }}
                  ></i>
                  <p className="mt-3 mb-2 text-muted">Không có thông báo mới</p>
                  <small className="text-muted">
                    Tất cả thông báo đã được xem
                  </small>
                </div>
              )}
              {notifications.length > 0 && (
                <div className="text-center p-3 border-top bg-light">
                  <Link
                    to="/admin/notifications"
                    className="btn btn-sm btn-primary px-4"
                    style={{ borderRadius: "8px" }}
                  >
                    <i className="ri-eye-line me-1"></i>
                    Xem tất cả thông báo
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </li>
    </>
  );
};

export default AdminNotifications;
