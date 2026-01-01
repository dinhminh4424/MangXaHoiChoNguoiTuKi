import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import friendService from "../../services/friendService";
import { Modal, Button } from "react-bootstrap";
import "./Notifications.css";

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // "all", "posts", "friends", "system"
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sosNotification, setSosNotification] = useState(null);
  const [isSosPopupOpen, setIsSosPopupOpen] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [toasts, setToasts] = useState([]);

  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();

  // Định nghĩa các hàm helper trước khi sử dụng
  const isPostNotification = (type) => {
    const postTypes = [
      "POST_LIKED",
      "POST_COMMENTED",
      "COMMENT_LIKED",
      "COMMENT_REPLIED",
    ];
    return postTypes.includes(type);
  };

  const isSystemNotification = (type) => {
    const systemTypes = [
      "REPORT_CREATED",
      "REPORT_RESOLVED",
      "REPORT_REJECTED",
      "POST_BLOCKED",
      "USER_BANNED",
      "USER_WARNED",
      "GROUP_BLOCKED",
      "GROUP_WARNED",
      "SYSTEM_ANNOUNCEMENT",
      "ADMIN_ALERT",
      "MAINTENANCE_NOTICE",
      "FEATURE_UPDATE",
      "SECURITY_ALERT",
      "LOGIN_ATTEMPT",
      "PASSWORD_CHANGED",
      "EMAIL_VERIFIED",
      "SUPPORT_TICKET_CREATED",
      "SUPPORT_TICKET_UPDATED",
      "SUPPORT_TICKET_RESOLVED",
      "APPEAL_RESOLVED",
      "APPEAL_CREATE",
      "FORCE_LOGOUT",
      "TODO_REMINDER",
      "EMERGENCY_CONTACT_ADDED", // Thêm liên hệ khẩn cấp
      "EMERGENCY_CONTACT_REMOVED", // Xóa liên hệ khẩn cấp
      "EMERGENCY_NOTIFICATION_SENT", // Gửi thông báo khẩn cấp
    ];
    return systemTypes.includes(type);
  };

  const isFriendNotification = (type) => {
    const friendTypes = [
      "FRIEND_REQUEST",
      "FRIEND_REQUEST_ACCEPTED",
      "FRIEND_REQUEST_REJECTED",
      "FRIEND_REQUEST_CANCELLED",
    ];
    return friendTypes.includes(type);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "POST_LIKED":
        return "ri-heart-fill text-danger";
      case "POST_COMMENTED":
      case "COMMENT_REPLIED":
        return "ri-chat-1-fill text-info";
      case "COMMENT_LIKED":
        return "ri-thumb-up-fill text-primary";
      case "NEW_MESSAGE":
        return "ri-message-2-fill text-primary";
      case "USER_BANNED":
        return "ri-forbid-fill text-danger";
      case "POST_BLOCKED":
        return "ri-eye-off-fill text-warning";
      case "REPORT_CREATED":
      case "REPORT_RESOLVED":
      case "REPORT_REJECTED":
        return "ri-alarm-warning-fill text-warning";
      case "SYSTEM_ANNOUNCEMENT":
        return "ri-megaphone-fill text-info";
      case "FEATURE_UPDATE":
        return "ri-update-fill text-success";
      case "FRIEND_REQUEST":
        return "ri-user-add-fill text-primary";
      case "FRIEND_REQUEST_ACCEPTED":
        return "ri-user-check-fill text-success";
      case "FRIEND_REQUEST_REJECTED":
        return "ri-user-unfollow-fill text-danger";
      case "FRIEND_REQUEST_CANCELLED":
        return "ri-user-unfollow-fill text-secondary";
      case "TODO_REMINDER":
        return "ri-alarm-line text-warning"; // hoặc "ri-time-line text-info"

      default:
        return "ri-notification-fill text-secondary";
    }
  };

  const getNotificationColor = (type) => {
    if (isPostNotification(type)) return "info";
    if (isSystemNotification(type)) {
      switch (type) {
        case "USER_BANNED":
        case "POST_BLOCKED":
          return "danger";
        case "REPORT_CREATED":
        case "REPORT_RESOLVED":
          return "warning";
        case "FEATURE_UPDATE":
          return "success";
        case "TODO_REMINDER":
          return "warning"; // Màu vàng cho nhắc nhở
        default:
          return "secondary";
      }
    }
    return "secondary";
  };

  const getNotificationCategory = (type) => {
    if (isPostNotification(type)) return "Bài viết";
    if (isFriendNotification(type)) return "Kết bạn";
    if (isSystemNotification(type)) return "Hệ thống";
    return "Khác";
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

  // Quy tắc ẩn/hiển cho dropdown thông báo chính
  const isVisibleForUser = (notification) => {
    if (!notification) return false;
    const currentUserId = user?.id || user?._id;
    // Ẩn yêu cầu kết bạn mới
    if (notification.type === "FRIEND_REQUEST") return false;
    // Ẩn accepted/rejected đối với người nhận (recipient===current && sender===current)
    if (
      (notification.type === "FRIEND_REQUEST_ACCEPTED" ||
        notification.type === "FRIEND_REQUEST_REJECTED") &&
      (notification.recipient?._id || notification.recipient) ===
        currentUserId &&
      (notification.sender?._id || notification.sender) === currentUserId
    ) {
      return false;
    }
    return true;
  };

  // Lọc notifications theo tab
  const filteredNotifications = notifications
    .filter(isVisibleForUser)
    .filter((notification) => {
      if (activeTab === "all") return true;
      if (activeTab === "posts") {
        return isPostNotification(notification.type);
      }
      if (activeTab === "friends") {
        return isFriendNotification(notification.type);
      }
      if (activeTab === "system") {
        return isSystemNotification(notification.type);
      }
      return true;
    });

  // Đếm số lượng theo từng tab
  const getTabCounts = () => {
    const visible = notifications.filter(isVisibleForUser);
    const allCount = visible.length;
    const postsCount = visible.filter((n) => isPostNotification(n.type)).length;
    const friendsCount = visible.filter((n) =>
      isFriendNotification(n.type)
    ).length;
    const systemCount = visible.filter((n) =>
      isSystemNotification(n.type)
    ).length;
    return { allCount, postsCount, friendsCount, systemCount };
  };

  const { allCount, postsCount, friendsCount, systemCount } = getTabCounts();

  const computedUnreadCount = notifications.filter(
    (n) => !n.read && isVisibleForUser(n)
  ).length;

  useEffect(() => {
    if (!user) return;
    console.log(
      "process.env.REACT_APP_BACKEND_URL(.env backend): ",
      process.env.REACT_APP_BACKEND_URL
    );
    console.log(
      "process.env.REACT_APP_API_URL(.env front): ",
      process.env.REACT_APP_API_URL
    );
    // Kết nối socket
    const socket = io(
      process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL,
      {
        withCredentials: true,
      }
    );
    socketRef.current = socket;

    // Join user notification room
    socket.emit("join_notifications", user.id);

    // Lắng nghe thông báo mới
    socket.on("new_notification", (notification) => {
      const currentUserId = user.id || user._id;
      const recipientId = notification.recipient?._id || notification.recipient;
      const senderId = notification.sender?._id || notification.sender;

      if (notification.type === "FRIEND_REQUEST") {
        return;
      }
      if (
        (notification.type === "FRIEND_REQUEST_ACCEPTED" ||
          notification.type === "FRIEND_REQUEST_REJECTED") &&
        recipientId === currentUserId &&
        senderId === currentUserId
      ) {
        return;
      }

      setNotifications((prev) => [notification, ...prev.slice(0, 19)]); // Tăng limit để có đủ data cho tabs
      setUnreadCount((prev) => prev + 1);

      if (
        notification.type === "SOS_EMERGENCY" ||
        notification.type === "SOS_ALERT" ||
        notification.type === "FORCE_LOGOUT"
      ) {
        setSosNotification(notification);
        setIsSosPopupOpen(true);
      } else {
        showToast(notification);
      }
    });

    socket.on("notification_deleted", (notificationId) => {
      setNotifications((prev) => {
        const deletedNotif = prev.find((n) => n._id === notificationId);
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
    });

    socket.on("notification_updated", (updatedNotification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === updatedNotification._id);
        if (!exists) return [updatedNotification, ...prev];
        return prev.map((n) =>
          n._id === updatedNotification._id ? updatedNotification : n
        );
      });
    });

    fetchAllNotifications();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const container = dropdownRef.current;
      if (!container) return;
      if (!container.contains(event.target)) {
        const toggleEl = document.getElementById("notification-drop");
        const bs = window.bootstrap;
        if (bs && bs.Dropdown && toggleEl) {
          const instance = bs.Dropdown.getOrCreateInstance(toggleEl);
          instance.hide();
        } else {
          toggleEl?.classList.remove("show");
          const menu = container.querySelector(".dropdown-menu");
          menu?.classList.remove("show");
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () =>
      document.removeEventListener("click", handleDocumentClick, true);
  }, []);

  const fetchAllNotifications = async () => {
    try {
      const response = await api.get("/api/notifications", {
        params: { limit: 50 },
      });
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(
          response.data.notifications.filter((n) => !n.read).length
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
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

      if (socketRef.current) {
        socketRef.current.emit("mark_notification_read", {
          notificationId,
          userId: user._id,
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (
      notification.type === "SOS_EMERGENCY" ||
      notification.type === "SOS_ALERT" ||
      notification.type === "FORCE_LOGOUT"
    ) {
      setSosNotification(notification);
      setIsSosPopupOpen(true);
      if (!notification.read) {
        markAsRead(notification._id);
      }
    } else {
      setSelectedNotification(notification);
      setIsModalOpen(true);
      if (!notification.read) {
        markAsRead(notification._id);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const closeSosPopup = () => {
    if (sosNotification && !sosNotification.read) {
      markAsRead(sosNotification._id);
    }

    // Nếu là thông báo FORCE_LOGOUT thì đăng xuất
    if (sosNotification && sosNotification.type === "FORCE_LOGOUT") {
      // Gọi hàm logout từ AuthContext
      logout(sosNotification.message || "Bạn đã bị đăng xuất khỏi hệ thống");
    }

    setIsSosPopupOpen(false);
    setSosNotification(null);
    setShowMapModal(false);
    setSelectedLocation(null);
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

  const handleAcceptFriendRequest = async (notification) => {
    try {
      const requestId = notification.data?.friendRequestId;
      if (!requestId) {
        alert("Không tìm thấy ID yêu cầu kết bạn");
        return;
      }
      await friendService.acceptFriendRequest(requestId);
      await fetchAllNotifications();
    } catch (error) {
      alert(error.message || "Lỗi khi chấp nhận yêu cầu kết bạn");
    }
  };

  const handleRejectFriendRequest = async (notification) => {
    try {
      const requestId = notification.data?.friendRequestId;
      if (!requestId) {
        alert("Không tìm thấy ID yêu cầu kết bạn");
        return;
      }
      await friendService.rejectFriendRequest(requestId);
      await fetchAllNotifications();
    } catch (error) {
      alert(error.message || "Lỗi khi từ chối yêu cầu kết bạn");
    }
  };

  const markTabAsRead = async () => {
    try {
      const notificationIds = filteredNotifications
        .filter((n) => !n.read)
        .map((n) => n._id);

      if (notificationIds.length === 0) return;

      await Promise.all(
        notificationIds.map((id) => api.put(`/api/notifications/${id}/read`))
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notificationIds.includes(notif._id) ? { ...notif, read: true } : notif
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error("Error marking tab as read:", error);
    }
  };

  // const showToast = (notification) => {
  //   let toastContainer = document.getElementById("toast-container");
  //   if (!toastContainer) {
  //     toastContainer = document.createElement("div");
  //     toastContainer.id = "toast-container";
  //     toastContainer.className =
  //       "toast-container position-fixed top-0 end-0 p-3";
  //     document.body.appendChild(toastContainer);
  //   }

  //   const toast = document.createElement("div");
  //   toast.className = `notification-toast alert-${getNotificationColor(
  //     notification.type
  //   )}`;
  //   toast.innerHTML = `
  //     <div class="toast-header">
  //       <i class="${getNotificationIcon(notification.type)} me-2"></i>
  //       <strong class="me-auto">${notification.title}</strong>
  //       <small class="text-muted">${getNotificationCategory(
  //         notification.type
  //       )}</small>
  //       <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
  //     </div>
  //     <div class="toast-body">
  //       ${notification.message}
  //       <small class="text-muted d-block mt-1">${new Date(
  //         notification.createdAt
  //       ).toLocaleTimeString()}</small>
  //     </div>
  //   `;
  //   toastContainer.appendChild(toast);

  //   setTimeout(() => {
  //     if (toast.parentElement) toast.remove();
  //   }, 5000);
  // };

  const showToast = (notification, duration = 5000) => {
    const id = Date.now();

    setToasts((prev) => [
      ...prev,
      {
        id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      },
    ]);

    if (notification.type === "TODO_REMINDER") {
      return;
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // Thêm sau hàm showToast
  const renderMap = () => {
    if (!selectedLocation) {
      return <div className="text-center p-4">Không có thông tin vị trí</div>;
    }

    const mapUrl = `https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=15&output=embed`;

    return (
      <div className="emergency-map-container">
        <iframe
          title="Emergency Location"
          width="100%"
          height="400"
          frameBorder="0"
          style={{ border: 0 }}
          src={mapUrl}
          allowFullScreen
        />
        <div className="map-info mt-3 p-3 bg-light rounded">
          <p>
            <strong>Vĩ độ:</strong> {selectedLocation.lat}
          </p>
          <p>
            <strong>Kinh độ:</strong> {selectedLocation.lng}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {selectedLocation.address}
          </p>
        </div>
      </div>
    );
  };

  // Thêm sau renderMap
  const parseLocation = (notification) => {
    if (!notification || !notification.data) return null;

    try {
      // Lấy từ data của notification
      const { latitude, longitude, address, mapUrl } = notification.data;

      if (!latitude || !longitude) return null;

      return {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        address: address || "Không xác định địa chỉ",
        mapUrl:
          mapUrl || `https://www.google.com/maps?q=${latitude},${longitude}`,
      };
    } catch (error) {
      console.error("Error parsing location from notification:", error);
      return null;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "posts":
        return "Chưa có thông báo về bài viết";
      case "system":
        return "Chưa có thông báo hệ thống";
      default:
        return "No new notifications";
    }
  };

  return (
    <>
      {/* Notifications Dropdown */}
      <li
        className="nav-item dropdown"
        data-bs-auto-close="outside"
        ref={dropdownRef}
      >
        <a
          href="#"
          className="search-toggle dropdown-toggle position-relative"
          id="notification-drop"
          data-bs-toggle="dropdown"
          data-bs-auto-close="outside"
        >
          <i className="ri-notification-4-line"></i>
          {computedUnreadCount > 0 && (
            <span className="badge bg-danger notification-badge">
              {computedUnreadCount > 99 ? "99+" : computedUnreadCount}
            </span>
          )}
        </a>
        <div
          className="sub-drop sub-drop-large dropdown-menu dropdown-menu-end"
          aria-labelledby="notification-drop"
          data-bs-auto-close="outside"
        >
          <div className="card shadow-none m-0" style={{ minWidth: "380px" }}>
            <div className="card-header d-flex justify-content-between bg-primary">
              <div className="header-title bg-primary">
                <h5 className="mb-0 text-white">Thông báo</h5>
              </div>
              <div className="d-flex align-items-center">
                <small className="badge bg-light text-dark me-2">
                  {computedUnreadCount}
                </small>
                {computedUnreadCount > 0 && (
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

            {/* Tab Navigation */}
            <div className="card-header border-bottom p-0">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "all" ? "active" : ""
                    } py-2`}
                    onClick={() => setActiveTab("all")}
                  >
                    <i className="ri-notification-line me-1"></i>
                    Tất cả
                    {allCount > 0 && (
                      <span className="badge bg-primary ms-1">{allCount}</span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "posts" ? "active" : ""
                    } py-2`}
                    onClick={() => setActiveTab("posts")}
                  >
                    <i className="ri-article-line me-1"></i>
                    Bài viết
                    {postsCount > 0 && (
                      <span className="badge bg-info ms-1">{postsCount}</span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "friends" ? "active" : ""
                    } py-2`}
                    onClick={() => setActiveTab("friends")}
                  >
                    <i className="ri-user-add-line me-1"></i>
                    Kết bạn
                    {friendsCount > 0 && (
                      <span className="badge bg-primary ms-1">
                        {friendsCount}
                      </span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "system" ? "active" : ""
                    } py-2`}
                    onClick={() => setActiveTab("system")}
                  >
                    <i className="ri-settings-line me-1"></i>
                    Hệ thống
                    {systemCount > 0 && (
                      <span className="badge bg-warning ms-1">
                        {systemCount}
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </div>

            <div
              className="card-body p-0"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {filteredNotifications.length > 0 ? (
                <div className="p-2">
                  {/* Mark Tab as Read Button */}
                  {filteredNotifications.some((n) => !n.read) && (
                    <div className="text-end mb-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={markTabAsRead}
                        style={{ fontSize: "0.7rem" }}
                      >
                        <i className="ri-check-line me-1"></i>
                        Đánh dấu tab đã đọc
                      </button>
                    </div>
                  )}

                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`alert notification-item-compact p-3 mb-2 ${
                        isPostNotification(notification.type)
                          ? "alert-info"
                          : "alert-light"
                      } ${!notification.read ? "unread-notification" : ""}`}
                      onClick={(e) => {
                        // Chỉ mở modal nếu không click vào button
                        if (!e.target.closest("button")) {
                          handleNotificationClick(notification);
                        }
                        // Ngăn dropdown auto-close
                        e.stopPropagation();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100">
                        <div
                          className="d-flex align-items-center flex-grow-1"
                          style={{ minWidth: 0 }}
                        >
                          <i
                            className={`${getNotificationIcon(
                              notification.type
                            )} me-3 notification-icon-compact`}
                          ></i>
                          <h6 className="notif-title-compact mb-0">
                            {notification.title}
                          </h6>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <span className="badge bg-primary notification-badge-compact">
                              Mới
                            </span>
                          )}
                          <small className="notif-time-compact text-muted">
                            {formatTime(notification.createdAt)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <i
                    className="ri-inbox-line text-muted mb-2"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <p className="mb-2 text-muted">{getEmptyMessage()}</p>
                </div>
              )}
              <div className="text-center p-2 border-top">
                <Link to="/notifications" className="btn text-primary">
                  Xem tất cả thông báo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </li>

      {/* ===== TOAST UI ===== */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-card toast-${getNotificationColor(toast.type)}`}
          >
            <div className="toast-icon">
              <i className={getNotificationIcon(toast.type)} />
            </div>

            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
              <div className="toast-time">
                {new Date(toast.createdAt).toLocaleTimeString()}
              </div>
            </div>

            <button
              className="toast-close border-3 bg-transparent"
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            >
              <i className="ri-close-line" />
            </button>
          </div>
        ))}
      </div>

      {/* ===== END TOAST ===== */}

      {/* Map Modal */}
      <Modal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        size="lg"
        centered
        className="emergency-map-modal"
        scrollable
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="ri-map-pin-line me-2"></i>
            Vị trí Khẩn cấp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderMap()}</Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setShowMapModal(false)}
          >
            Đóng
          </Button>
          {selectedLocation && (
            <Button
              variant="primary"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`,
                  "_blank"
                );
              }}
            >
              <i className="ri-external-link-line me-2"></i>
              Mở Google Maps
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* === SỬA LỖI MODAL: Bỏ các modal lỗi, chỉ giữ lại 1 modal react-bootstrap === */}
      {selectedNotification && (
        <Modal
          show={isModalOpen}
          onHide={closeModal}
          size="lg"
          centered
          scrollable
          className="notification-detail-modal-wrapper" // Thêm class để CSS
        >
          <Modal.Header
            closeButton
            className="notification-detail-modal-header"
          >
            {/* Header với icon và tiêu đề */}
            <div className="d-flex align-items-center">
              <i
                className={`${getNotificationIcon(
                  selectedNotification.type
                )} notification-detail-icon me-3`}
              ></i>
              <div>
                <Modal.Title as="h4" className="notification-detail-title mb-1">
                  {selectedNotification.title}
                </Modal.Title>
                <div className="d-flex align-items-center gap-3">
                  <small className="text-muted">
                    <i className="ri-time-line me-1"></i>
                    {new Date(selectedNotification.createdAt).toLocaleString(
                      "vi-VN"
                    )}
                  </small>
                  <span className="badge bg-secondary">
                    {getNotificationCategory(selectedNotification.type)}
                  </span>
                </div>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="notification-detail-modal-body">
            {/* Nội dung thông báo */}
            <div className="notification-detail-content mb-4">
              <p className="notification-detail-message">
                {selectedNotification.message}
              </p>
            </div>

            {/* Hiển thị thêm data nếu có */}
            {selectedNotification.data &&
              Object.keys(selectedNotification.data).length > 0 && (
                <div
                  className={`notification-detail-extra mb-4 p-3 rounded ${
                    selectedNotification.type === "SOS_ALERT"
                      ? "bg-danger bg-opacity-10 border border-danger border-opacity-25"
                      : selectedNotification.type === "TODO_REMINDER"
                      ? "bg-warning bg-opacity-10 border border-warning border-opacity-25" // Màu vàng cho todo reminder
                      : "bg-light border"
                  }`}
                >
                  {selectedNotification.type === "SOS_ALERT" && (
                    <h6 className="text-danger mb-3">
                      <i className="ri-alarm-warning-line me-2"></i>
                      Thông tin khẩn cấp
                    </h6>
                  )}
                  {/* === THÊM HIỂN THỊ CHO TODO_REMINDER === */}
                  {selectedNotification.type === "TODO_REMINDER" && (
                    <h6 className="text-warning mb-3">
                      <i className="ri-alarm-line me-2"></i>
                      Thông tin nhắc nhở công việc
                    </h6>
                  )}
                  {selectedNotification.data.userName && (
                    <p className="mb-2">
                      <strong>Người dùng:</strong>{" "}
                      {selectedNotification.data.userName}
                    </p>
                  )}
                  {/* Hiển thị thông tin todo */}
                  {selectedNotification.data.todoTitle && (
                    <p className="mb-2">
                      <strong>Công việc:</strong>{" "}
                      {selectedNotification.data.todoTitle}
                    </p>
                  )}
                  {selectedNotification.data.message && (
                    <p className="mb-2">
                      <strong>Tin nhắn:</strong>{" "}
                      {selectedNotification.data.message}
                    </p>
                  )}
                  {selectedNotification.data.location && (
                    <p className="mb-2">
                      <strong>Vị trí:</strong>{" "}
                      {selectedNotification.data.location}
                    </p>
                  )}

                  {/* Lặp qua các data còn lại */}
                  {Object.entries(selectedNotification.data).map(
                    ([key, value]) => {
                      if (
                        [
                          "userName",
                          "message",
                          "location",
                          "friendRequestId",
                        ].includes(key)
                      ) {
                        return null;
                      }
                      if (
                        value &&
                        (typeof value === "string" || typeof value === "number")
                      ) {
                        return (
                          <p key={key} className="mb-2">
                            <strong>
                              {key.charAt(0).toUpperCase() + key.slice(1)}:
                            </strong>{" "}
                            {String(value)}
                          </p>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
              )}

            {/* Nút hành động cho Yêu cầu kết bạn */}
            {selectedNotification.type === "FRIEND_REQUEST" &&
              selectedNotification.data?.friendRequestId && (
                <div className="notification-detail-actions mt-4 pt-4 border-top">
                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      variant="success"
                      onClick={() => {
                        handleAcceptFriendRequest(selectedNotification);
                        closeModal();
                      }}
                    >
                      <i className="ri-check-line me-1"></i>
                      Chấp nhận
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={() => {
                        handleRejectFriendRequest(selectedNotification);
                        closeModal();
                      }}
                    >
                      <i className="ri-close-line me-1"></i>
                      Từ chối
                    </Button>
                  </div>
                </div>
              )}
          </Modal.Body>

          <Modal.Footer className="notification-detail-modal-footer">
            <Button variant="secondary" onClick={closeModal}>
              Đóng
            </Button>
            {/* Chỉ hiển thị nút "Xem" nếu có URL */}
            {selectedNotification.url && (
              <Button
                variant="primary"
                onClick={() => {
                  window.location.href = selectedNotification.url;
                }}
              >
                <i className="ri-external-link-line me-1"></i>
                Xem chi tiết
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      )}
      {/* === KẾT THÚC SỬA LỖI MODAL === */}

      {/* SOS Emergency Popup */}
      {/* {isSosPopupOpen && sosNotification && (
        <div className="sos-emergency-popup-overlay" onClick={closeSosPopup}>
          <div
            className="sos-emergency-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sos-popup-header">
              <div className="sos-popup-icon-container">
                <i className="ri-alarm-warning-fill"></i>
              </div>
              <h3 className="sos-popup-title">🚨 Tín hiệu SOS khẩn cấp</h3>
              <button className="sos-popup-close" onClick={closeSosPopup}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="sos-popup-body">
              <div className="sos-info-section">
                <div className="sos-info-item">
                  <div className="sos-info-label">
                    <i className="ri-user-line"></i>
                    <span>Tên người dùng</span>
                  </div>
                  <div className="sos-info-value">
                    {sosNotification.data?.userName || "Không xác định"}
                  </div>
                </div>

                <div className="sos-info-item">
                  <div className="sos-info-label">
                    <i className="ri-map-pin-line"></i>
                    <span>Địa chỉ</span>
                  </div>
                  <div className="sos-info-value">
                    {sosNotification.data?.address || "Không xác định"}
                  </div>
                  {sosNotification.data?.mapUrl && (
                    <a
                      href={sosNotification.data.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sos-map-link"
                    >
                      <i className="ri-map-2-line me-1"></i>
                      Xem trên bản đồ
                    </a>
                  )}
                </div>

                <div className="sos-info-item">
                  <div className="sos-info-label">
                    <i className="ri-phone-line"></i>
                    <span>Số điện thoại</span>
                  </div>
                  <div className="sos-info-value">
                    {sosNotification.data?.phoneNumber ? (
                      <a
                        href={`tel:${sosNotification.data.phoneNumber}`}
                        className="sos-phone-link"
                      >
                        {sosNotification.data.phoneNumber}
                      </a>
                    ) : (
                      "Không có"
                    )}
                  </div>
                </div>

                {sosNotification.data?.message && (
                  <div className="sos-info-item">
                    <div className="sos-info-label">
                      <i className="ri-message-line"></i>
                      <span>Tin nhắn</span>
                    </div>
                    <div className="sos-info-value">
                      {sosNotification.data.message}
                    </div>
                  </div>
                )}

                <div className="sos-info-item">
                  <div className="sos-info-label">
                    <i className="ri-time-line"></i>
                    <span>Thời gian</span>
                  </div>
                  <div className="sos-info-value">
                    {new Date(sosNotification.createdAt).toLocaleString(
                      "vi-VN"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="sos-popup-footer">
              <button
                className="btn btn-primary sos-popup-action-btn"
                onClick={closeSosPopup}
              >
                <i className="ri-check-line me-2"></i>
                Đã xem
              </button>
              {sosNotification.data?.phoneNumber && (
                <a
                  href={`tel:${sosNotification.data.phoneNumber}`}
                  className="btn btn-success sos-popup-action-btn"
                >
                  <i className="ri-phone-line me-2"></i>
                  Gọi ngay
                </a>
              )}
            </div>
          </div>
        </div>
      )} */}
      {/* SOS Emergency Popup */}
      {/* SOS & Force Logout Popup */}
      {isSosPopupOpen && sosNotification && (
        <div className="sos-emergency-popup-overlay" onClick={closeSosPopup}>
          <div
            className="sos-emergency-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sos-popup-header">
              <div className="sos-popup-icon-container">
                <i
                  className={
                    sosNotification.type === "FORCE_LOGOUT"
                      ? "ri-logout-box-r-line"
                      : "ri-alarm-warning-fill"
                  }
                ></i>
              </div>
              <h3 className="sos-popup-title">
                {sosNotification.type === "FORCE_LOGOUT"
                  ? "🚨 Đăng xuất bắt buộc"
                  : "🚨 Tín hiệu SOS khẩn cấp"}
              </h3>
              <button className="sos-popup-close" onClick={closeSosPopup}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="sos-popup-body">
              <div className="sos-info-section">
                {/* Hiển thị thông tin khác nhau tùy loại thông báo */}
                {sosNotification.type === "FORCE_LOGOUT" ? (
                  <>
                    <div className="sos-info-item">
                      <div className="sos-info-label">
                        <i className="ri-information-line"></i>
                        <span>Thông báo</span>
                      </div>
                      <div className="sos-info-value">
                        {sosNotification.message ||
                          "Bạn đã bị đăng xuất khỏi hệ thống"}
                      </div>
                    </div>

                    {sosNotification.data?.reason && (
                      <div className="sos-info-item">
                        <div className="sos-info-label">
                          <i className="ri-alert-line"></i>
                          <span>Lý do</span>
                        </div>
                        <div className="sos-info-value">
                          {sosNotification.data.reason}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="sos-info-item">
                      <div className="sos-info-label">
                        <i className="ri-user-line"></i>
                        <span>Tên người dùng</span>
                      </div>
                      <div className="sos-info-value">
                        {sosNotification.data?.userName || "Không xác định"}
                      </div>
                    </div>

                    <div className="sos-info-item">
                      <div className="sos-info-label">
                        <i className="ri-map-pin-line"></i>
                        <span>Địa chỉ</span>
                      </div>
                      <div className="sos-info-value">
                        {sosNotification.data?.address || "Không xác định"}
                      </div>
                      {sosNotification.data?.mapUrl && (
                        <a
                          href={sosNotification.data.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sos-map-link"
                        >
                          <i className="ri-map-2-line me-1"></i>
                          Xem trên bản đồ
                        </a>
                      )}
                    </div>

                    <div className="sos-info-item">
                      <div className="sos-info-label">
                        <i className="ri-phone-line"></i>
                        <span>Số điện thoại</span>
                      </div>
                      <div className="sos-info-value">
                        {sosNotification.data?.phoneNumber ? (
                          <a
                            href={`tel:${sosNotification.data.phoneNumber}`}
                            className="sos-phone-link"
                          >
                            {sosNotification.data.phoneNumber}
                          </a>
                        ) : (
                          "Không có"
                        )}
                      </div>
                    </div>

                    {sosNotification.data?.message && (
                      <div className="sos-info-item">
                        <div className="sos-info-label">
                          <i className="ri-message-line"></i>
                          <span>Tin nhắn</span>
                        </div>
                        <div className="sos-info-value">
                          {sosNotification.data.message}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="sos-info-item">
                  <div className="sos-info-label">
                    <i className="ri-time-line"></i>
                    <span>Thời gian</span>
                  </div>
                  <div className="sos-info-value">
                    {new Date(sosNotification.createdAt).toLocaleString(
                      "vi-VN"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="sos-popup-footer">
              <button
                className="btn btn-primary sos-popup-action-btn"
                onClick={closeSosPopup}
              >
                <i className="ri-check-line me-2"></i>
                {sosNotification.type === "FORCE_LOGOUT" ? "Đồng ý" : "Đã xem"}
              </button>

              {/* Trong sos-popup-footer */}
              {sosNotification?.data?.latitude &&
                sosNotification?.data?.longitude && (
                  <button
                    className="btn btn-warning sos-popup-action-btn"
                    onClick={() => {
                      const location = parseLocation(sosNotification); // Truyền cả notification
                      if (location) {
                        setSelectedLocation(location);
                        setShowMapModal(true);
                      } else {
                        // Fallback: mở Google Maps trực tiếp
                        if (sosNotification.data.mapUrl) {
                          window.open(sosNotification.data.mapUrl, "_blank");
                        } else if (
                          sosNotification.data.latitude &&
                          sosNotification.data.longitude
                        ) {
                          window.open(
                            `https://www.google.com/maps?q=${sosNotification.data.latitude},${sosNotification.data.longitude}`,
                            "_blank"
                          );
                        }
                      }
                    }}
                  >
                    <i className="ri-map-pin-line me-2"></i>
                    Xem vị trí
                  </button>
                )}

              {sosNotification.type !== "FORCE_LOGOUT" &&
                sosNotification.data?.phoneNumber && (
                  <a
                    href={`tel:${sosNotification.data.phoneNumber}`}
                    className="btn btn-success sos-popup-action-btn"
                  >
                    <i className="ri-phone-line me-2"></i>
                    Gọi ngay
                  </a>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserNotifications;
