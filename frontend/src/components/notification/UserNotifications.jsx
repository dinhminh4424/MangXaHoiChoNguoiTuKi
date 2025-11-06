// import React, { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import { io } from "socket.io-client";
// import { useAuth } from "../../contexts/AuthContext";
// import api from "../../services/api"; // Import axios instance
// import "./Notifications.css";

// const UserNotifications = () => {
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const socketRef = useRef(null);
//   const { user } = useAuth();

//   useEffect(() => {
//     if (!user) return;

//     // Kết nối socket
//     const socket = io(process.env.REACT_APP_BACKEND_URL, {
//       withCredentials: true,
//     });
//     socketRef.current = socket;

//     // Join user notification room
//     socket.emit("join_notifications", user._id);

//     // Lắng nghe thông báo mới
//     socket.on("new_notification", (notification) => {
//       setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
//       setUnreadCount((prev) => prev + 1);
//       showToast(notification);
//     });

//     // Lấy danh sách thông báo chưa đọc
//     fetchUnreadNotifications();

//     return () => {
//       socket.disconnect();
//     };
//   }, [user]);

//   const fetchUnreadNotifications = async () => {
//     try {
//       const response = await api.get("/api/notifications?read=false&limit=5");
//       if (response.data.success) {
//         setNotifications(response.data.notifications);
//         setUnreadCount(response.data.total);
//       }
//     } catch (error) {
//       console.error("Error fetching notifications:", error);
//     }
//   };

//   const markAsRead = async (notificationId) => {
//     try {
//       await api.put(`/api/notifications/${notificationId}/read`);

//       setNotifications((prev) =>
//         prev.map((notif) =>
//           notif._id === notificationId ? { ...notif, read: true } : notif
//         )
//       );
//       setUnreadCount((prev) => Math.max(0, prev - 1));

//       if (socketRef.current) {
//         socketRef.current.emit("mark_notification_read", {
//           notificationId,
//           userId: user._id,
//         });
//       }
//     } catch (error) {
//       console.error("Error marking notification as read:", error);
//     }
//   };

//   const markAllAsRead = async () => {
//     try {
//       await api.put("/api/notifications/read-all");

//       setNotifications((prev) =>
//         prev.map((notif) => ({ ...notif, read: true }))
//       );
//       setUnreadCount(0);
//     } catch (error) {
//       console.error("Error marking all as read:", error);
//     }
//   };

//   const showToast = (notification) => {
//     let toastContainer = document.getElementById("toast-container");
//     if (!toastContainer) {
//       toastContainer = document.createElement("div");
//       toastContainer.id = "toast-container";
//       toastContainer.className =
//         "toast-container position-fixed top-0 end-0 p-3";
//       document.body.appendChild(toastContainer);
//     }

//     const toast = document.createElement("div");
//     toast.className = `notification-toast alert-${getNotificationColor(
//       notification.type
//     )}`;
//     toast.innerHTML = `
//       <div class="toast-header">
//         <i class="${getNotificationIcon(notification.type)} me-2"></i>
//         <strong class="me-auto">${notification.title}</strong>
//         <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
//       </div>
//       <div class="toast-body">
//         ${notification.message}
//         <small class="text-muted d-block mt-1">${new Date(
//           notification.createdAt
//         ).toLocaleTimeString()}</small>
//       </div>
//     `;
//     toastContainer.appendChild(toast);

//     setTimeout(() => {
//       if (toast.parentElement) toast.remove();
//     }, 5000);
//   };

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case "POST_LIKED":
//         return "ri-heart-fill text-danger";
//       case "POST_COMMENTED":
//         return "ri-chat-1-fill text-info";
//       case "NEW_MESSAGE":
//         return "ri-message-2-fill text-primary";
//       case "USER_BANNED":
//         return "ri-forbid-fill text-danger";
//       case "POST_BLOCKED":
//         return "ri-eye-off-fill text-warning";
//       case "REPORT_CREATED":
//         return "ri-alarm-warning-fill text-warning";
//       case "REPORT_RESOLVED":
//         return "ri-checkbox-circle-fill text-success";
//       default:
//         return "ri-notification-fill text-secondary";
//     }
//   };

//   const getNotificationColor = (type) => {
//     switch (type) {
//       case "POST_LIKED":
//         return "success";
//       case "POST_COMMENTED":
//         return "info";
//       case "NEW_MESSAGE":
//         return "primary";
//       case "USER_BANNED":
//       case "POST_BLOCKED":
//         return "danger";
//       case "REPORT_CREATED":
//         return "warning";
//       case "REPORT_RESOLVED":
//         return "success";
//       default:
//         return "secondary";
//     }
//   };

//   const formatTime = (dateString) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffMs = now - date;
//     const diffMins = Math.floor(diffMs / 60000);
//     const diffHours = Math.floor(diffMs / 3600000);

//     if (diffMins < 1) return "Vừa xong";
//     if (diffMins < 60) return `${diffMins} phút trước`;
//     if (diffHours < 24) return `${diffHours} giờ trước`;
//     return date.toLocaleDateString("vi-VN");
//   };

//   return (
//     <>
//       {/* Notifications Dropdown */}
//       <li className="nav-item dropdown">
//         <a
//           href="#"
//           className="search-toggle dropdown-toggle position-relative"
//           id="notification-drop"
//           data-bs-toggle="dropdown"
//         >
//           <i className="ri-notification-4-line"></i>
//           {unreadCount > 0 && (
//             <span className="badge bg-danger notification-badge">
//               {unreadCount > 99 ? "99+" : unreadCount}
//             </span>
//           )}
//         </a>
//         <div
//           className="sub-drop dropdown-menu dropdown-menu-end"
//           aria-labelledby="notification-drop"
//         >
//           <div className="card shadow-none m-0">
//             <div className="card-header d-flex justify-content-between bg-primary">
//               <div className="header-title bg-primary">
//                 <h5 className="mb-0 text-white">All Notifications</h5>
//               </div>
//               <div className="d-flex align-items-center">
//                 <small className="badge bg-light text-dark me-2">
//                   {unreadCount}
//                 </small>
//                 {unreadCount > 0 && (
//                   <button
//                     className="btn btn-sm btn-light"
//                     onClick={markAllAsRead}
//                     title="Đánh dấu tất cả đã đọc"
//                   >
//                     <i className="ri-check-double-line"></i>
//                   </button>
//                 )}
//               </div>
//             </div>
//             <div
//               className="card-body p-0"
//               style={{ maxHeight: "400px", overflowY: "auto" }}
//             >
//               {notifications.length > 0 ? (
//                 <div className="p-2">
//                   {notifications.map((notification) => (
//                     <div
//                       key={notification._id}
//                       className={`alert p-2 mb-2 alert-light ${
//                         !notification.read ? "unread-notification" : ""
//                       }`}
//                       onClick={() => markAsRead(notification._id)}
//                       style={{ cursor: "pointer" }}
//                     >
//                       <div className="d-flex align-items-start">
//                         <i
//                           className={`${getNotificationIcon(
//                             notification.type
//                           )} me-2 mt-1`}
//                         ></i>
//                         <div className="flex-grow-1">
//                           <h6 className="mb-1" style={{ fontSize: "0.875rem" }}>
//                             {notification.title}
//                           </h6>
//                           <p className="mb-1" style={{ fontSize: "0.75rem" }}>
//                             {notification.message}
//                           </p>
//                           <small className="text-muted">
//                             {formatTime(notification.createdAt)}
//                           </small>
//                         </div>
//                         {!notification.read && (
//                           <span className="badge bg-primary ms-2">Mới</span>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center p-3">
//                   <p className="mb-2">No new notifications</p>
//                 </div>
//               )}
//               <div className="text-center p-2 border-top">
//                 <Link to="/notifications" className="btn text-primary">
//                   View All Notifications
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </li>
//     </>
//   );
// };

// export default UserNotifications;

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import friendService from "../../services/friendService";
import "./Notifications.css";

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // "all", "posts", "friends", "system"
  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

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
      ((notification.recipient?._id || notification.recipient) === currentUserId) &&
      ((notification.sender?._id || notification.sender) === currentUserId)
    ) {
      return false;
    }
    return true;
  };

  // Lọc notifications theo tab
  // Ẩn FRIEND_REQUEST (yêu cầu mới) khỏi dropdown thông báo chính
  // Ẩn FRIEND_REQUEST_ACCEPTED/REJECTED nếu người dùng là người nhận và sender (trường hợp người nhận vừa chấp nhận/từ chối)
  // VẪN hiển thị FRIEND_REQUEST_ACCEPTED/REJECTED cho người gửi yêu cầu
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
    // Chỉ tính trên các notification được phép hiển thị
    const visible = notifications.filter(isVisibleForUser);
    const allCount = visible.length;
    const postsCount = visible.filter((n) => isPostNotification(n.type)).length;
    const friendsCount = visible.filter((n) => isFriendNotification(n.type)).length;
    const systemCount = visible.filter((n) => isSystemNotification(n.type)).length;
    return { allCount, postsCount, friendsCount, systemCount };
  };

  const { allCount, postsCount, friendsCount, systemCount } = getTabCounts();

  // Tính lại số lượng chưa đọc từ danh sách hiện có
  // Loại bỏ FRIEND_REQUEST và FRIEND_REQUEST_ACCEPTED/REJECTED mà người dùng là người nhận và sender (đã chấp nhận/từ chối)
  const computedUnreadCount = notifications.filter((n) => !n.read && isVisibleForUser(n)).length;

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

      // Bỏ qua các thông báo friend request không cần hiển thị ở dropdown này
      // 1) FRIEND_REQUEST (yêu cầu mới)
      if (notification.type === "FRIEND_REQUEST") {
        return;
      }
      // 2) FRIEND_REQUEST_ACCEPTED/REJECTED dành cho người nhận (recipient===current && sender===current)
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
      showToast(notification);
    });

    // Lắng nghe khi thông báo bị xóa
    socket.on("notification_deleted", (notificationId) => {
      setNotifications((prev) => {
        const deletedNotif = prev.find((n) => n._id === notificationId);
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
    });

    // Lắng nghe khi thông báo được cập nhật (ví dụ FRIEND_REQUEST -> FRIEND_REQUEST_ACCEPTED)
    socket.on("notification_updated", (updatedNotification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === updatedNotification._id);
        if (!exists) return [updatedNotification, ...prev];
        return prev.map((n) =>
          n._id === updatedNotification._id ? updatedNotification : n
        );
      });
    });

    // Lấy danh sách thông báo (bao gồm cả đã đọc)
    fetchAllNotifications();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Đảm bảo click bên ngoài sẽ đóng dropdown (fallback nếu Bootstrap không xử lý)
  useEffect(() => {
    const handleDocumentClick = (event) => {
      const container = dropdownRef.current;
      if (!container) return;
      if (!container.contains(event.target)) {
        const toggleEl = document.getElementById("notification-drop");
        // Ưu tiên API của Bootstrap nếu có
        const bs = window.bootstrap;
        if (bs && bs.Dropdown && toggleEl) {
          const instance = bs.Dropdown.getOrCreateInstance(toggleEl);
          instance.hide();
        } else {
          // Fallback thủ công: gỡ class 'show'
          toggleEl && toggleEl.classList.remove("show");
          const menu = container.querySelector(".dropdown-menu");
          menu && menu.classList.remove("show");
        }
      }
    };

    // Dùng capture để ưu tiên bắt sự kiện sớm
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
        // Đếm chưa đọc ở client để không làm mất thông báo đã đọc
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
      // Refresh notifications
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
      // Refresh notifications
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

      // Gửi request mark read cho từng notification
      await Promise.all(
        notificationIds.map((id) => api.put(`/api/notifications/${id}/read`))
      );

      // Update local state
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

  const showToast = (notification) => {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `notification-toast alert-${getNotificationColor(
      notification.type
    )}`;
    toast.innerHTML = `
      <div class="toast-header">
        <i class="${getNotificationIcon(notification.type)} me-2"></i>
        <strong class="me-auto">${notification.title}</strong>
        <small class="text-muted">${getNotificationCategory(
          notification.type
        )}</small>
        <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
      <div class="toast-body">
        ${notification.message}
        <small class="text-muted d-block mt-1">${new Date(
          notification.createdAt
        ).toLocaleTimeString()}</small>
      </div>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 5000);
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
              <ul className="nav nav-tabs nav-justified" role="tablist">
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
                      <span
                        className="badge bg-primary ms-1"
                        style={{ fontSize: "0.6rem" }}
                      >
                        {allCount}
                      </span>
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
                      <span
                        className="badge bg-info ms-1"
                        style={{ fontSize: "0.6rem" }}
                      >
                        {postsCount}
                      </span>
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
                      <span
                        className="badge bg-primary ms-1"
                        style={{ fontSize: "0.6rem" }}
                      >
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
                      <span
                        className="badge bg-warning ms-1"
                        style={{ fontSize: "0.6rem" }}
                      >
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
                      className={`alert p-2 mb-2 ${
                        isPostNotification(notification.type)
                          ? "alert-info"
                          : "alert-light"
                      } ${!notification.read ? "unread-notification" : ""}`}
                      onClick={(e) => {
                        // Chỉ mark as read nếu không click vào button
                        if (!e.target.closest("button")) {
                          markAsRead(notification._id);
                        }
                        // Ngăn dropdown auto-close
                        e.stopPropagation();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="notif-item">
                        <div className="notif-header d-flex justify-content-between">
                          <div className="d-flex align-items-start">
                            <i
                              className={`${getNotificationIcon(
                                notification.type
                              )} me-2 mt-1`}
                            ></i>
                            <h6 className="notif-title mb-0">
                              {notification.title}
                            </h6>
                          </div>
                          <small className="notif-time text-muted">
                            {formatTime(notification.createdAt)}
                          </small>
                        </div>
                        <p className="notif-message mb-1">
                          {notification.message}
                        </p>
                        <small className="notif-meta text-muted d-inline-flex align-items-center">
                          <i
                            className={`${getNotificationIcon(
                              notification.type
                            )} me-1`}
                          ></i>
                          {getNotificationCategory(notification.type)}
                        </small>
                        {/* Action buttons cho friend request */}
                        {notification.type === "FRIEND_REQUEST" &&
                          notification.data?.friendRequestId && (
                            <div
                              className="mt-2 d-flex gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                  handleAcceptFriendRequest(notification)
                                }
                              >
                                <i className="ri-check-line me-1"></i>
                                Chấp nhận
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  handleRejectFriendRequest(notification)
                                }
                              >
                                <i className="ri-close-line me-1"></i>
                                Từ chối
                              </button>
                            </div>
                          )}
                      </div>
                      {!notification.read && (
                        <span className="badge bg-primary ms-2">Mới</span>
                      )}
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
    </>
  );
};

export default UserNotifications;
