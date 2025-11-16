// NotificationsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Dropdown,
  Nav,
  Form,
  InputGroup,
  Modal,
  Alert,
} from "react-bootstrap";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import friendService from "../../services/friendService";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // "all", "unread", "read"
  const [activeCategory, setActiveCategory] = useState("all"); // "all", "posts", "friends", "system", "emergency"
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef(null);
  const { user } = useAuth();

  // Các hàm helper
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

  const isMessageNotification = (type) => {
    const messageTypes = ["NEW_MESSAGE", "GROUP_INVITE", "CHAT_REQUEST"];
    return messageTypes.includes(type);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "POST_LIKED":
        return "ri-heart-3-fill text-danger";
      case "POST_COMMENTED":
      case "COMMENT_REPLIED":
        return "ri-chat-3-fill text-info";
      case "COMMENT_LIKED":
        return "ri-thumb-up-fill text-primary";
      case "NEW_MESSAGE":
        return "ri-message-3-fill text-primary";
      case "GROUP_INVITE":
        return "ri-group-2-fill text-success";
      case "CHAT_REQUEST":
        return "ri-chat-4-fill text-warning";
      case "USER_BANNED":
        return "ri-forbid-2-fill text-danger";
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
      case "SOS_EMERGENCY":
        return "ri-alarm-warning-fill text-danger";
      default:
        return "ri-notification-3-fill text-secondary";
    }
  };

  const getNotificationCategory = (type) => {
    if (isPostNotification(type)) return "Bài viết";
    if (isFriendNotification(type)) return "Kết bạn";
    if (isSystemNotification(type)) return "Hệ thống";
    if (isMessageNotification(type)) return "Tin nhắn";
    if (type === "SOS_EMERGENCY") return "Khẩn cấp";
    return "Khác";
  };

  const getNotificationColor = (type) => {
    if (isPostNotification(type)) return "info";
    if (isFriendNotification(type)) return "primary";
    if (isMessageNotification(type)) return "success";
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
    if (type === "SOS_EMERGENCY") return "danger";
    return "secondary";
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / (3600000 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const isVisibleForUser = (notification) => {
    if (!notification) return false;
    const currentUserId = user?.id || user?._id;

    if (notification.type === "FRIEND_REQUEST") return false;

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

  // Lọc thông báo
  useEffect(() => {
    let filtered = notifications.filter(isVisibleForUser);

    // Lọc theo category
    if (activeCategory !== "all") {
      filtered = filtered.filter((notification) => {
        if (activeCategory === "posts")
          return isPostNotification(notification.type);
        if (activeCategory === "friends")
          return isFriendNotification(notification.type);
        if (activeCategory === "system")
          return isSystemNotification(notification.type);
        if (activeCategory === "messages")
          return isMessageNotification(notification.type);
        if (activeCategory === "emergency")
          return notification.type === "SOS_EMERGENCY";
        return true;
      });
    }

    // Lọc theo trạng thái đọc
    if (activeTab === "unread") {
      filtered = filtered.filter((notification) => !notification.read);
    } else if (activeTab === "read") {
      filtered = filtered.filter((notification) => notification.read);
    }

    // Lọc theo search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(term) ||
          notification.message.toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, activeTab, activeCategory, searchTerm]);

  // Tính toán số lượng
  // Tính toán số lượng - CHỈ ĐẾM THÔNG BÁO CHƯA ĐỌC
  const getCounts = () => {
    const visible = notifications.filter(isVisibleForUser);
    const allCount = visible.filter((n) => !n.read).length; // CHỈ đếm chưa đọc
    const unreadCount = visible.filter((n) => !n.read).length;
    const readCount = visible.filter((n) => n.read).length;

    // CHỈ đếm chưa đọc cho từng category
    const postsCount = visible.filter(
      (n) => isPostNotification(n.type) && !n.read
    ).length;
    const friendsCount = visible.filter(
      (n) => isFriendNotification(n.type) && !n.read
    ).length;
    const systemCount = visible.filter(
      (n) => isSystemNotification(n.type) && !n.read
    ).length;
    const messagesCount = visible.filter(
      (n) => isMessageNotification(n.type) && !n.read
    ).length;
    const emergencyCount = visible.filter(
      (n) => n.type === "SOS_EMERGENCY" && !n.read
    ).length;

    return {
      allCount,
      unreadCount,
      readCount,
      postsCount,
      friendsCount,
      systemCount,
      messagesCount,
      emergencyCount,
    };
  };

  const {
    allCount,
    unreadCount: computedUnreadCount,
    readCount,
    postsCount,
    friendsCount,
    systemCount,
    messagesCount,
    emergencyCount,
  } = getCounts();

  // Socket và data fetching
  useEffect(() => {
    if (!user) return;

    const socket = io(
      process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL,
      { withCredentials: true }
    );
    socketRef.current = socket;

    socket.emit("join_notifications", user.id);

    socket.on("new_notification", (notification) => {
      const currentUserId = user.id || user._id;
      const recipientId = notification.recipient?._id || notification.recipient;
      const senderId = notification.sender?._id || notification.sender;

      if (notification.type === "FRIEND_REQUEST") return;
      if (
        (notification.type === "FRIEND_REQUEST_ACCEPTED" ||
          notification.type === "FRIEND_REQUEST_REJECTED") &&
        recipientId === currentUserId &&
        senderId === currentUserId
      ) {
        return;
      }

      setNotifications((prev) => [notification, ...prev]);
    });

    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await api.get("/api/notifications", {
        params: {
          page: pageNum,
          limit: 20,
        },
      });

      if (response.data.success) {
        if (append) {
          setNotifications((prev) => [...prev, ...response.data.notifications]);
        } else {
          setNotifications(response.data.notifications);
        }

        setHasMore(response.data.notifications.length === 20);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );

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
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
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
      await markAsRead(notification._id);
      handleDetailModalClose();
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
      await markAsRead(notification._id);
      handleDetailModalClose();
    } catch (error) {
      alert(error.message || "Lỗi khi từ chối yêu cầu kết bạn");
    }
  };

  const handleNotificationClick = (notification) => {
    // Đánh dấu đã đọc khi click vào thông báo
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Mở modal chi tiết
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const handleVisitUrl = () => {
    if (selectedNotification?.url) {
      window.open(selectedNotification.url, "_blank");
    }
  };

  const clearFilters = () => {
    setActiveTab("all");
    setActiveCategory("all");
    setSearchTerm("");
  };

  // Render các tab phân loại
  const renderCategoryTabs = () => {
    const categories = [
      {
        key: "all",
        label: "Tất cả",
        icon: "ri-list-check",
        count: allCount,
        color: "primary",
      },
      {
        key: "posts",
        label: "Bài viết",
        icon: "ri-article-line",
        count: postsCount,
        color: "info",
      },
      {
        key: "friends",
        label: "Kết bạn",
        icon: "ri-user-add-line",
        count: friendsCount,
        color: "primary",
      },
      {
        key: "messages",
        label: "Tin nhắn",
        icon: "ri-message-3-line",
        count: messagesCount,
        color: "success",
      },
      {
        key: "system",
        label: "Hệ thống",
        icon: "ri-settings-line",
        count: systemCount,
        color: "secondary",
      },
      {
        key: "emergency",
        label: "Khẩn cấp",
        icon: "ri-alarm-warning-line",
        count: emergencyCount,
        color: "danger",
      },
    ];

    return (
      <Nav variant="pills" className="category-tabs flex-nowrap">
        {categories.map((category) => (
          <Nav.Item key={category.key}>
            <Nav.Link
              active={activeCategory === category.key}
              onClick={() => setActiveCategory(category.key)}
              className="text-nowrap"
            >
              <i className={`${category.icon} me-2`}></i>
              {category.label}
              {category.count > 0 && (
                <Badge bg={category.color} className="ms-2">
                  {category.count}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <Container className="notifications-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải thông báo...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="notifications-page">
      <Row className="justify-content-center">
        <Col xl={10}>
          {/* Header */}
          <div className="page-header mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="page-title mb-2">
                  <i className="ri-notification-3-line me-2 text-primary"></i>
                  Quản lý thông báo
                </h1>
                <p className="text-muted mb-0">
                  Theo dõi và quản lý tất cả thông báo của bạn
                </p>
              </div>
              <div className="d-flex gap-2">
                {computedUnreadCount > 0 && (
                  <Button variant="primary" onClick={markAllAsRead}>
                    <i className="ri-check-double-line me-2"></i>
                    Đánh dấu tất cả đã đọc
                  </Button>
                )}
                <Link to="/" className="btn btn-outline-secondary">
                  <i className="ri-arrow-left-line me-2"></i>
                  Quay lại
                </Link>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3 align-items-center">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="ri-search-line"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => setSearchTerm("")}
                      >
                        <i className="ri-close-line"></i>
                      </Button>
                    )}
                  </InputGroup>
                </Col>
                <Col md={6}>
                  <div className="d-flex gap-2 justify-content-end align-items-center">
                    <div className="btn-group">
                      <Button
                        variant={
                          activeTab === "all" ? "primary" : "outline-primary"
                        }
                        onClick={() => setActiveTab("all")}
                      >
                        Tất cả
                      </Button>
                      <Button
                        variant={
                          activeTab === "unread" ? "warning" : "outline-warning"
                        }
                        onClick={() => setActiveTab("unread")}
                      >
                        Chưa đọc
                        {computedUnreadCount > 0 && `(${computedUnreadCount})`}
                      </Button>
                      <Button
                        variant={
                          activeTab === "read" ? "success" : "outline-success"
                        }
                        onClick={() => setActiveTab("read")}
                      >
                        Đã đọc
                        {/* Đã đọc {readCount > 0 && `(${readCount})`} */}
                      </Button>
                    </div>

                    {(activeTab !== "all" ||
                      activeCategory !== "all" ||
                      searchTerm) && (
                      <Button
                        variant="outline-secondary"
                        onClick={clearFilters}
                      >
                        <i className="ri-refresh-line me-2"></i>
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Category Tabs */}
          <Card className="mb-4">
            <Card.Body className="p-3">
              <div className="category-tabs-container">
                {renderCategoryTabs()}
              </div>
            </Card.Body>
          </Card>

          {/* Notifications List */}
          <Card>
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  {activeCategory === "all"
                    ? "Tất cả thông báo"
                    : activeCategory === "posts"
                    ? "Thông báo bài viết"
                    : activeCategory === "friends"
                    ? "Thông báo kết bạn"
                    : activeCategory === "messages"
                    ? "Thông báo tin nhắn"
                    : activeCategory === "system"
                    ? "Thông báo hệ thống"
                    : "Thông báo khẩn cấp"}
                  <Badge bg="secondary" className="ms-2">
                    {allCount}
                  </Badge>
                </h6>
                <small className="text-muted">
                  Nhấn vào thông báo để xem chi tiết và đánh dấu đã đọc
                </small>
              </div>
            </Card.Header>

            <Card.Body className="p-0">
              {filteredNotifications.length > 0 ? (
                <div className="notifications-list">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item p-4 border-bottom ${
                        !notification.read ? "unread" : ""
                      } ${
                        notification.type === "SOS_EMERGENCY"
                          ? "sos-emergency"
                          : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="d-flex align-items-start">
                        <div className="notification-icon me-3">
                          <i
                            className={getNotificationIcon(notification.type)}
                          ></i>
                        </div>

                        <div className="notification-content flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="notification-title mb-1">
                                {notification.title}
                                {!notification.read && (
                                  <Badge bg="primary" className="ms-2 fs-xxs">
                                    Mới
                                  </Badge>
                                )}
                              </h6>
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <Badge
                                  bg={getNotificationColor(notification.type)}
                                  className="text-capitalize"
                                >
                                  {getNotificationCategory(notification.type)}
                                </Badge>
                                <small className="text-muted">
                                  {formatTime(notification.createdAt)}
                                </small>
                              </div>
                            </div>
                          </div>

                          <p className="notification-message text-muted mb-0">
                            {notification.message}
                          </p>

                          {/* Hiển thị URL nếu có */}
                          {notification.url && (
                            <div className="mt-2">
                              <small className="text-primary">
                                <i className="ri-links-line me-1"></i>
                                Có đường dẫn liên kết
                              </small>
                            </div>
                          )}
                        </div>

                        <div className="dropdown">
                          <button
                            className="btn btn-light btn-sm notification-actions dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            onClick={(e) => e.stopPropagation()} // để không click vào item cha
                          >
                            <i className="ri-more-2-fill"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow">
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => markAsRead(notification._id)}
                              >
                                <i className="ri-check-line me-2"></i> Đánh dấu
                                đã đọc
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() =>
                                  deleteNotification(notification._id)
                                }
                              >
                                <i className="ri-delete-bin-line me-2"></i> Xóa
                                thông báo 123
                              </button>
                            </li>
                          </ul>
                        </div>

                        {/* <div
                          className="notification-menu-wrapper"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-light btn-sm notification-actions dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="ri-more-2-fill"></i>
                          </button>

                          <ul className="dropdown-menu dropdown-menu-start ">
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => markAsRead(notification._id)}
                              >
                                <i className="ri-check-line me-2" /> Đánh dấu đã
                                đọc
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() =>
                                  deleteNotification(notification._id)
                                }
                              >
                                <i className="ri-delete-bin-line me-2" /> Xóa
                              </button>
                            </li>
                          </ul>
                        </div> */}
                      </div>
                    </div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center p-4">
                      <Button
                        variant="outline-primary"
                        onClick={loadMore}
                        disabled={loading}
                        className="px-4"
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <i className="ri-add-line me-2"></i>
                            Tải thêm thông báo
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i
                    className="ri-inbox-line text-muted mb-3"
                    style={{ fontSize: "4rem" }}
                  ></i>
                  <h5 className="text-muted mb-2">Không có thông báo</h5>
                  <p className="text-muted mb-4">
                    {activeTab !== "all" ||
                    activeCategory !== "all" ||
                    searchTerm
                      ? "Thử thay đổi bộ lọc để xem nhiều thông báo hơn"
                      : "Bạn chưa có thông báo nào"}
                  </p>
                  {(activeTab !== "all" ||
                    activeCategory !== "all" ||
                    searchTerm) && (
                    <Button variant="primary" onClick={clearFilters}>
                      <i className="ri-refresh-line me-2"></i>
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={handleDetailModalClose}
        size="lg"
        centered
      >
        {selectedNotification && (
          <>
            <Modal.Header closeButton className="bg-light">
              <Modal.Title>
                <div className="d-flex align-items-center">
                  <i
                    className={
                      getNotificationIcon(selectedNotification.type) +
                      " me-3 fs-2"
                    }
                  ></i>
                  <div>
                    <h5 className="mb-1">{selectedNotification.title}</h5>
                    <div className="d-flex align-items-center gap-2">
                      <Badge
                        bg={getNotificationColor(selectedNotification.type)}
                      >
                        {getNotificationCategory(selectedNotification.type)}
                      </Badge>
                      <small className="text-muted">
                        {formatTime(selectedNotification.createdAt)}
                      </small>
                      {!selectedNotification.read && (
                        <Badge bg="primary">Chưa đọc</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div className="mb-4">
                <h6 className="text-muted mb-3 border-bottom pb-2">
                  <i className="ri-file-text-line me-2"></i>
                  Nội dung thông báo
                </h6>
                <p className="mb-0 fs-6">{selectedNotification.message}</p>
              </div>

              {selectedNotification.data &&
                Object.keys(selectedNotification.data).length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-muted mb-3 border-bottom pb-2">
                      <i className="ri-information-line me-2"></i>
                      Thông tin chi tiết
                    </h6>
                    <div className="bg-light p-3 rounded">
                      {Object.entries(selectedNotification.data).map(
                        ([key, value]) =>
                          value && (
                            <div key={key} className="mb-2 d-flex">
                              <strong
                                className="text-capitalize me-2"
                                style={{ minWidth: "120px" }}
                              >
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </strong>
                              <span>{String(value)}</span>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}

              {selectedNotification.type === "FRIEND_REQUEST" && (
                <div className="border-top pt-4">
                  <h6 className="text-muted mb-3">
                    <i className="ri-user-shared-line me-2"></i>
                    Hành động
                  </h6>
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      onClick={() =>
                        handleAcceptFriendRequest(selectedNotification)
                      }
                      className="flex-fill"
                    >
                      <i className="ri-check-line me-2"></i>
                      Chấp nhận kết bạn
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={() =>
                        handleRejectFriendRequest(selectedNotification)
                      }
                      className="flex-fill"
                    >
                      <i className="ri-close-line me-2"></i>
                      Từ chối
                    </Button>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer className="bg-light">
              <div className="d-flex justify-content-between w-100">
                <Button variant="secondary" onClick={handleDetailModalClose}>
                  <i className="ri-close-line me-2"></i>
                  Đóng
                </Button>

                <div className="d-flex gap-2">
                  {!selectedNotification.read && (
                    <Button
                      variant="outline-primary"
                      onClick={() => markAsRead(selectedNotification._id)}
                    >
                      <i className="ri-check-line me-2"></i>
                      Đánh dấu đã đọc
                    </Button>
                  )}

                  {selectedNotification.url && (
                    <Button variant="primary" onClick={handleVisitUrl}>
                      <i className="ri-external-link-line me-2"></i>
                      Truy cập
                    </Button>
                  )}
                </div>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default NotificationsPage;
