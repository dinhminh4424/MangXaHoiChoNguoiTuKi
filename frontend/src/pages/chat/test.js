import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";

const Chat = () => {
  const { user, logout } = useAuth();
  const {
    conversations,
    selectedChat,
    messages,
    users,
    loading,
    error,
    messagesEndRef,
    connectSocket,
    loadConversations,
    loadUsers,
    selectChat,
    sendMessage,
    sendFileMessage,
    startConversation,
    scrollToBottom,
    clearError,
    loadMoreMessages,
    hasMoreMessages,
    loadingMore,
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");

  // State cho popups
  const [showUserDetailPopup, setShowUserDetailPopup] = useState(false);
  const [showChatDetailPopup, setShowChatDetailPopup] = useState(false);

  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);

  // State cho modal xem hình ảnh lớn
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState("");

  const otherUser = !selectedChat?.isGroup
    ? selectedChat?.members?.find((i) => i._id !== user.id)
    : null;

  // Lọc conversations theo search term
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    if (conversation.isGroup) {
      return conversation.name?.toLowerCase().includes(searchLower);
    } else {
      const otherUser = conversation.members?.find(
        (member) => member._id !== user.id
      );
      return (
        otherUser?.fullName?.toLowerCase().includes(searchLower) ||
        otherUser?.email?.toLowerCase().includes(searchLower)
      );
    }
  });

  // Hàm xử lý hiển thị tên với "..." khi quá dài
  const truncateName = (name, maxLength = 20) => {
    if (!name) return "";
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
  };

  // Format thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString();
    }
  };

  useEffect(() => {
    if (user) {
      connectSocket();
      loadConversations();
      loadUsers();
    }
  }, [user, connectSocket, loadConversations, loadUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Xử lý scroll để tải thêm tin nhắn
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loadingMore || !hasMoreMessages || !selectedChat) return;

    const scrollTop = container.scrollTop;
    if (scrollTop < 50 && !loadingMore && hasMoreMessages) {
      setIsNearTop(true);
      loadMoreMessages(selectedChat._id);
    } else {
      setIsNearTop(false);
    }
  }, [loadingMore, hasMoreMessages, selectedChat, loadMoreMessages]);

  // Thêm event listener cho scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // Reset scroll state khi chọn chat mới
  useEffect(() => {
    setIsNearTop(false);
  }, [selectedChat?._id]);

  // Hàm mở modal hình ảnh
  const openImageModal = (url, name = "") => {
    setSelectedImageUrl(url);
    setSelectedImageName(name);
    setShowImageModal(true);
  };

  // Hàm đóng modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageUrl(null);
    setSelectedImageName("");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (selectedFile) {
      await handleSendFile(newMessage);
    } else if (newMessage.trim()) {
      const result = await sendMessage(newMessage);
      if (result.success) {
        setNewMessage("");
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File quá lớn. Kích thước tối đa là 10MB.");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendFile = async (messageContent = "") => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await sendFileMessage(selectedFile, messageContent);
      if (result.success) {
        setSelectedFile(null);
        setFilePreview(null);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Lỗi khi gửi file:", error);
      alert("Có lỗi xảy ra khi gửi file. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const getFileIcon = (messageType) => {
    switch (messageType) {
      case "image":
        return <i className="fa-solid fa-image"></i>;
      case "video":
        return <i className="fa-solid fa-video"></i>;
      case "audio":
        return <i className="fa-solid fa-music"></i>;
      case "file":
        return <i className="fa-solid fa-paperclip"></i>;
      default:
        return <i className="fa-solid fa-file"></i>;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleLogout = () => {
    logout();
  };

  const handleRandomChat = async () => {
    try {
      const availableUsers = users.filter((u) => u._id !== user.id);
      if (availableUsers.length === 0) {
        alert("Không có người dùng nào khả dụng");
        return;
      }

      const randomUser =
        availableUsers[Math.floor(Math.random() * availableUsers.length)];
      await startConversation(randomUser._id);
    } catch (error) {
      console.error("Lỗi khi bắt đầu chat ngẫu nhiên:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleUserDetails = () => {
    setShowUserDetails(!showUserDetails);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container vh-100 bg-light">
      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show m-0 rounded-0"
          role="alert"
        >
          <div className="container">
            <i className="fa-solid fa-triangle-exclamation me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={clearError}
            ></button>
          </div>
        </div>
      )}

      {/* Uploading Overlay */}
      {isUploading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50 z-3">
          <div className="bg-white rounded p-4 text-center shadow-lg">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Đang tải lên...</span>
            </div>
            <p className="mb-0 fw-semibold">Đang tải file lên...</p>
          </div>
        </div>
      )}

      {/* Modal xem hình ảnh lớn */}
      {showImageModal && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-90 z-4"
          tabIndex="-1"
        >
          <div
            className="modal-dialog modal-dialog-centered modal-xl"
            role="document"
          >
            <div className="modal-content border-0 bg-transparent">
              <div className="modal-header border-0 justify-content-end p-3">
                <button
                  type="button"
                  className="btn-close btn-close-white bg-dark bg-opacity-50 rounded-circle p-2"
                  onClick={closeImageModal}
                ></button>
              </div>
              <div className="modal-body p-0 d-flex align-items-center justify-content-center">
                {selectedImageUrl && (
                  <img
                    src={selectedImageUrl}
                    alt={selectedImageName || "Hình ảnh"}
                    className="img-fluid rounded shadow-lg"
                    style={{
                      maxHeight: "85vh",
                      maxWidth: "85vw",
                      objectFit: "contain",
                    }}
                  />
                )}
                {selectedImageName && (
                  <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4 text-white bg-dark bg-opacity-75 px-4 py-2 rounded-pill">
                    <small>{truncateName(selectedImageName, 40)}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-100">
        <div className="row h-100">
          {/* Sidebar */}
          <div
            className={`col-lg-4 col-xl-3 border-end bg-white ${
              showUserDetails ? "d-none d-lg-block" : ""
            }`}
          >
            <div className="d-flex flex-column h-100">
              {/* User Profile Header */}
              <div className="p-3 border-bottom position-relative">
                <div className="d-flex align-items-center">
                  <div className="position-relative">
                    {user.profile?.avatar ? (
                      <img
                        src={user.profile.avatar}
                        alt="avatar"
                        className="avatar-50 rounded-circle cursor-pointer"
                        onClick={() => setShowUserDetailPopup(true)}
                      />
                    ) : (
                      <div
                        className="avatar-50 rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold fs-5 cursor-pointer"
                        onClick={() => setShowUserDetailPopup(true)}
                      >
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                    )}
                    <span
                      className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                      style={{ width: "12px", height: "12px" }}
                    ></span>
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h6 className="mb-0 fw-bold">
                      {truncateName(user.fullName)}
                    </h6>
                    <small className="text-muted">Đang hoạt động</small>
                  </div>
                  <div className="dropdown">
                    <button
                      className="btn btn-link text-muted p-0"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="fa-solid fa-ellipsis-vertical fs-5"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => setShowUserDetailPopup(true)}
                        >
                          <i className="fa-solid fa-user me-2"></i>Thông tin cá
                          nhân
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={handleRandomChat}
                        >
                          <i className="fa-solid fa-shuffle me-2"></i>Chat ngẫu
                          nhiên
                        </button>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={handleLogout}
                        >
                          <i className="fa-solid fa-right-from-bracket me-2"></i>
                          Đăng xuất
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* User Detail Popup trong sidebar */}
                <div
                  className={`chat-user-detail-popup ${
                    showUserDetailPopup ? "show" : ""
                  }`}
                >
                  <div className="user-profile">
                    <button
                      type="button"
                      className="close-popup"
                      onClick={() => setShowUserDetailPopup(false)}
                    >
                      <i className="ri-close-fill"></i>
                    </button>
                    <div className="user text-center mb-4">
                      <div className="avatar m-0 mx-auto">
                        {user.profile?.avatar ? (
                          <img
                            src={user.profile.avatar}
                            alt="avatar"
                            className="avatar-80 rounded-circle"
                          />
                        ) : (
                          <div className="avatar-80 rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold fs-2 mx-auto">
                            {user.fullName?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="user-name mt-4">
                        <h4>{user.fullName}</h4>
                      </div>
                      <div className="user-desc">
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <hr />
                    <div className="user-detail text-left mt-4">
                      <h5 className="mb-3">Thống kê</h5>
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="border rounded-3 p-2">
                            <h6 className="text-primary mb-1">
                              {conversations.length}
                            </h6>
                            <small className="text-muted">
                              Cuộc trò chuyện
                            </small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="border rounded-3 p-2">
                            <h6 className="text-success mb-1">
                              {users.length}
                            </h6>
                            <small className="text-muted">Người dùng</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="border rounded-3 p-2">
                            <h6 className="text-info mb-1">
                              {conversations.filter((c) => c.isGroup).length}
                            </h6>
                            <small className="text-muted">Nhóm</small>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="mb-3">Trạng thái</h5>
                        <ul className="user-status p-0">
                          <li className="mb-2">
                            <i className="ri-checkbox-blank-circle-fill text-success pe-2"></i>
                            <span>Đang hoạt động</span>
                          </li>
                          <li className="mb-2">
                            <i className="ri-checkbox-blank-circle-fill text-warning pe-2"></i>
                            <span>Đang bận</span>
                          </li>
                          <li className="mb-2">
                            <i className="ri-checkbox-blank-circle-fill text-danger pe-2"></i>
                            <span>Không làm phiền</span>
                          </li>
                          <li className="mb-2">
                            <i className="ri-checkbox-blank-circle-fill text-secondary pe-2"></i>
                            <span>Ngoại tuyến</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-bottom">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="fa-solid fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 bg-light"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-grow-1 overflow-auto">
                <div className="p-3">
                  <h6 className="text-uppercase text-muted small fw-bold mb-3">
                    Cuộc trò chuyện
                  </h6>
                  {filteredConversations.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {filteredConversations.map((conversation) => (
                        <button
                          key={conversation._id}
                          className={`list-group-item list-group-item-action border-0 rounded-3 p-3 mb-2 ${
                            selectedChat?._id === conversation._id
                              ? "bg-primary text-white"
                              : "bg-light"
                          }`}
                          onClick={() => selectChat(conversation)}
                        >
                          <div className="d-flex align-items-center">
                            <div className="position-relative me-3">
                              {conversation.isGroup ? (
                                <div className="avatar-45 rounded-circle bg-info d-flex align-items-center justify-content-center text-white fw-bold">
                                  {conversation.name?.charAt(0) || "G"}
                                </div>
                              ) : (
                                <div className="avatar-45 rounded-circle bg-success d-flex align-items-center justify-content-center text-white fw-bold">
                                  {conversation.members
                                    ?.find((m) => m._id !== user.id)
                                    ?.fullName?.charAt(0) || "U"}
                                </div>
                              )}
                              <span
                                className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                                style={{ width: "10px", height: "10px" }}
                              ></span>
                            </div>
                            <div className="flex-grow-1 text-start">
                              <div className="d-flex justify-content-between align-items-center">
                                <h6
                                  className={`mb-1 ${
                                    selectedChat?._id === conversation._id
                                      ? "text-white"
                                      : ""
                                  }`}
                                >
                                  {conversation.isGroup
                                    ? truncateName(conversation.name)
                                    : truncateName(
                                        conversation.members?.find(
                                          (m) => m._id !== user.id
                                        )?.fullName
                                      ) || "Unknown User"}
                                </h6>
                                {conversation.lastMessage && (
                                  <small
                                    className={
                                      selectedChat?._id === conversation._id
                                        ? "text-white-50"
                                        : "text-muted"
                                    }
                                  >
                                    {formatTime(
                                      conversation.lastMessage.createdAt
                                    )}
                                  </small>
                                )}
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <p
                                  className={`mb-0 small text-truncate ${
                                    selectedChat?._id === conversation._id
                                      ? "text-white-50"
                                      : "text-muted"
                                  }`}
                                >
                                  {conversation.lastMessage?.content ||
                                    "Chưa có tin nhắn"}
                                  {conversation.lastMessage?.file && " 📎"}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span
                                    className={`badge ${
                                      selectedChat?._id === conversation._id
                                        ? "bg-white text-primary"
                                        : "bg-primary"
                                    } rounded-pill ms-2`}
                                  >
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fa-solid fa-comments text-muted fs-1 mb-3"></i>
                      <p className="text-muted">
                        Không tìm thấy cuộc trò chuyện nào
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Details Sidebar */}
          {showUserDetails && (
            <div className="col-lg-4 col-xl-3 border-end bg-white">
              <div className="d-flex flex-column h-100">
                <div className="p-3 border-bottom d-flex align-items-center">
                  <button
                    className="btn btn-link p-0 me-3"
                    onClick={toggleUserDetails}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <h5 className="mb-0">Thông tin cá nhân</h5>
                </div>
                <div className="flex-grow-1 overflow-auto">
                  <div className="text-center p-4">
                    <div className="avatar-100 rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold fs-1 mb-3 mx-auto">
                      {user.fullName?.charAt(0) || "U"}
                    </div>
                    <h4 className="mb-2">{user.fullName}</h4>
                    <p className="text-muted mb-4">{user.email}</p>
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="border rounded-3 p-3">
                          <h5 className="text-primary mb-1">
                            {conversations.length}
                          </h5>
                          <small className="text-muted">Cuộc trò chuyện</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="border rounded-3 p-3">
                          <h5 className="text-success mb-1">{users.length}</h5>
                          <small className="text-muted">Bạn bè</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="border rounded-3 p-3">
                          <h5 className="text-info mb-1">
                            {conversations.filter((c) => c.isGroup).length}
                          </h5>
                          <small className="text-muted">Nhóm</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div
            className={`${
              showUserDetails ? "col-lg-8 col-xl-6" : "col-lg-8 col-xl-9"
            } d-flex flex-column h-100 position-relative`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-bottom p-3 position-relative">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <button
                        className="btn btn-link text-muted d-lg-none p-0 me-2"
                        onClick={toggleUserDetails}
                      >
                        <i className="fa-solid fa-bars"></i>
                      </button>
                      <div className="position-relative me-3">
                        {selectedChat.isGroup ? (
                          <div className="avatar-50 rounded-circle bg-info d-flex align-items-center justify-content-center text-white fw-bold">
                            {selectedChat.name?.charAt(0) || "G"}
                          </div>
                        ) : (
                          <div className="avatar-50 rounded-circle bg-success d-flex align-items-center justify-content-center text-white fw-bold">
                            {otherUser?.fullName?.charAt(0) || "U"}
                          </div>
                        )}
                        <span
                          className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                          style={{ width: "12px", height: "12px" }}
                        ></span>
                      </div>
                      <div>
                        <h5 className="mb-1">
                          {selectedChat.isGroup
                            ? truncateName(selectedChat.name)
                            : truncateName(otherUser?.fullName)}
                        </h5>
                        <small className="text-muted">
                          {isTyping
                            ? `${typingUser} đang soạn tin...`
                            : selectedChat.isOnline
                            ? "Đang hoạt động"
                            : "Ngoại tuyến"}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex">
                      <button
                        className="btn btn-light rounded-circle me-2"
                        title="Gọi điện"
                      >
                        <i className="fa-solid fa-phone"></i>
                      </button>
                      <button
                        className="btn btn-light rounded-circle me-2"
                        title="Gọi video"
                      >
                        <i className="fa-solid fa-video"></i>
                      </button>
                      <button
                        className="btn btn-light rounded-circle"
                        title="Thông tin"
                        onClick={() => setShowChatDetailPopup(true)}
                      >
                        <i className="fa-solid fa-info"></i>
                      </button>
                      <span className="dropdown bg-soft-primary  p-2 mx-1  d-flex justify-content-center align-items-center">
                        <i
                          className="ri-more-2-line cursor-pointer"
                          data-bs-toggle="dropdown"
                        ></i>
                        <ul className="dropdown-menu">
                          <li>
                            <a className="dropdown-item" href="#">
                              Ghim cuộc trò chuyện
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="#">
                              Xóa cuộc trò chuyện
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="#">
                              Chặn
                            </a>
                          </li>
                        </ul>
                      </span>
                    </div>
                  </div>

                  {/* Chat Detail Popup */}
                  <div
                    className={`chat-user-detail-popup ${
                      showChatDetailPopup ? "show" : ""
                    }`}
                  >
                    <div className="user-profile">
                      <button
                        type="button"
                        className="close-popup"
                        onClick={() => setShowChatDetailPopup(false)}
                      >
                        <i className="ri-close-fill"></i>
                      </button>
                      <div className="user mb-4 text-center">
                        <div className="avatar m-0 mx-auto">
                          {selectedChat.isGroup ? (
                            <div className="avatar-80 rounded-circle bg-info d-flex align-items-center justify-content-center text-white fw-bold fs-2">
                              {selectedChat.name?.charAt(0) || "G"}
                            </div>
                          ) : (
                            <div className="avatar-80 rounded-circle bg-success d-flex align-items-center justify-content-center text-white fw-bold fs-2">
                              {otherUser?.fullName?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div className="user-name mt-4">
                          <h4>
                            {selectedChat.isGroup
                              ? selectedChat.name
                              : otherUser?.fullName || "Unknown User"}
                          </h4>
                        </div>
                        <div className="user-desc">
                          <p>
                            {selectedChat.isGroup
                              ? `${
                                  selectedChat.members?.length || 0
                                } thành viên`
                              : otherUser?.email || ""}
                          </p>
                        </div>
                      </div>
                      <hr />
                      <div className="chatuser-detail text-left mt-4">
                        <div className="row">
                          <div className="col-6 col-md-6 title">Loại:</div>
                          <div className="col-6 col-md-6 text-right">
                            {selectedChat.isGroup
                              ? "Nhóm chat"
                              : "Chat cá nhân"}
                          </div>
                        </div>
                        <hr />
                        <div className="row">
                          <div className="col-6 col-md-6 title">
                            Thành viên:
                          </div>
                          <div className="col-6 col-md-6 text-right">
                            {selectedChat.members?.length || 0}
                          </div>
                        </div>
                        <hr />
                        <div className="row">
                          <div className="col-6 col-md-6 title">Tin nhắn:</div>
                          <div className="col-6 col-md-6 text-right">
                            {messages.length}
                          </div>
                        </div>
                        {!selectedChat.isGroup && otherUser && (
                          <>
                            <hr />
                            <div className="row">
                              <div className="col-6 col-md-6 title">Email:</div>
                              <div className="col-6 col-md-6 text-right">
                                {otherUser.email}
                              </div>
                            </div>
                            <hr />
                            <div className="row">
                              <div className="col-6 col-md-6 title">
                                Trạng thái:
                              </div>
                              <div className="col-6 col-md-6 text-right">
                                <span
                                  className={`badge ${
                                    otherUser.isOnline
                                      ? "bg-success"
                                      : "bg-secondary"
                                  }`}
                                >
                                  {otherUser.isOnline
                                    ? "Đang hoạt động"
                                    : "Ngoại tuyến"}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-top">
                        <div className="row g-2">
                          <div className="col-6">
                            <button className="btn btn-outline-primary w-100">
                              <i className="fa-solid fa-phone me-2"></i>
                              Gọi
                            </button>
                          </div>
                          <div className="col-6">
                            <button className="btn btn-outline-success w-100">
                              <i className="fa-solid fa-video me-2"></i>
                              Video
                            </button>
                          </div>
                          {selectedChat.isGroup && (
                            <div className="col-12 mt-2">
                              <button className="btn btn-outline-info w-100">
                                <i className="fa-solid fa-users me-2"></i>
                                Quản lý thành viên
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  ref={messagesContainerRef}
                  className="flex-grow-1 overflow-auto bg-chat position-relative"
                >
                  <div className="p-3">
                    {/* Loading indicator */}
                    {loadingMore && (
                      <div className="text-center py-3">
                        <div
                          className="spinner-border spinner-border-sm text-primary me-2"
                          role="status"
                        ></div>
                        <small className="text-muted">
                          Đang tải tin nhắn cũ...
                        </small>
                      </div>
                    )}

                    {/* Load more messages hint */}
                    {hasMoreMessages && !loadingMore && (
                      <div className="text-center py-2">
                        <small className="text-muted">
                          Cuộn lên để xem tin nhắn cũ hơn
                        </small>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((message, index) => (
                      <div
                        key={message._id || index}
                        className={`d-flex mb-4 ${
                          message.sender?._id === user.id
                            ? "justify-content-end"
                            : "justify-content-start"
                        }`}
                      >
                        {message.sender?._id !== user.id && (
                          <div className="avatar-35 rounded-circle bg-success d-flex align-items-center justify-content-center text-white fw-bold me-2">
                            {message.sender?.fullName?.charAt(0) || "U"}
                          </div>
                        )}
                        <div
                          className={`${
                            message.sender?._id === user.id
                              ? "bg-primary text-white"
                              : "bg-white"
                          } rounded-3 p-3 shadow-sm`}
                          style={{ maxWidth: "70%" }}
                        >
                          {message.sender?._id !== user.id && (
                            <div className="small fw-bold mb-1">
                              {message.sender?.fullName}
                            </div>
                          )}

                          {/* File message */}
                          {message.fileUrl && (
                            <div className="mb-2">
                              {message.messageType === "image" ? (
                                <div className="text-center">
                                  <img
                                    src={message.fileUrl}
                                    alt={message.fileName || "Image"}
                                    className="img-fluid rounded cursor-pointer"
                                    style={{
                                      maxHeight: "300px",
                                      maxWidth: "100%",
                                    }}
                                    onClick={() =>
                                      openImageModal(
                                        message.fileUrl,
                                        message.fileName
                                      )
                                    }
                                  />
                                  {message.fileName && (
                                    <div className="mt-1 small opacity-75">
                                      {truncateName(message.fileName, 25)}
                                    </div>
                                  )}
                                </div>
                              ) : message.messageType === "video" ? (
                                <div className="text-center">
                                  <video
                                    controls
                                    className="img-fluid rounded"
                                    style={{
                                      maxHeight: "300px",
                                      maxWidth: "100%",
                                    }}
                                  >
                                    <source
                                      src={message.fileUrl}
                                      type="video/mp4"
                                    />
                                    Trình duyệt của bạn không hỗ trợ video.
                                  </video>
                                </div>
                              ) : (
                                <div className="d-flex align-items-center p-2 bg-dark bg-opacity-10 rounded">
                                  <span className="fs-5 me-3 text-primary">
                                    {getFileIcon(message.messageType)}
                                  </span>
                                  <div className="flex-grow-1">
                                    <div className="fw-bold small">
                                      {truncateName(
                                        message.fileName || "File",
                                        25
                                      )}
                                    </div>
                                    {message.fileSize && (
                                      <div className="text-muted smaller">
                                        {formatFileSize(message.fileSize)}
                                      </div>
                                    )}
                                  </div>
                                  <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary ms-2"
                                  >
                                    Tải xuống
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Text message */}
                          {message.content && (
                            <div className="message-content">
                              <p className="mb-0">{message.content}</p>
                            </div>
                          )}

                          <div
                            className={`small mt-2 ${
                              message.sender?._id === user.id
                                ? "text-white-50"
                                : "text-muted"
                            } text-end`}
                          >
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="bg-warning bg-opacity-10 border-top p-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <span className="fs-4 me-3 text-warning">
                          {getFileIcon(
                            selectedFile.type.startsWith("image/")
                              ? "image"
                              : selectedFile.type.startsWith("video/")
                              ? "video"
                              : selectedFile.type.startsWith("audio/")
                              ? "audio"
                              : "file"
                          )}
                        </span>
                        <div>
                          <div className="fw-bold">
                            {truncateName(selectedFile.name, 30)}
                          </div>
                          <small className="text-muted">
                            {formatFileSize(selectedFile.size)}
                          </small>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRemoveFile}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    {filePreview && selectedFile.type.startsWith("image/") && (
                      <div className="mt-2 text-center">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="img-fluid rounded"
                          style={{ maxHeight: "150px" }}
                        />
                      </div>
                    )}

                    {filePreview && selectedFile.type.startsWith("video/") && (
                      <div className="mt-2 text-center">
                        <video
                          controls
                          className="img-fluid rounded"
                          style={{ maxHeight: "150px" }}
                        >
                          <source src={filePreview} type={selectedFile.type} />
                          Trình duyệt của bạn không hỗ trợ video preview.
                        </video>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Input */}
                <div className="bg-white border-top p-3">
                  <form
                    className="d-flex align-items-center"
                    onSubmit={handleSendMessage}
                  >
                    <button
                      type="button"
                      className="btn btn-light rounded-circle me-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <i className="fa-solid fa-paperclip"></i>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="d-none"
                    />

                    <div className="flex-grow-1 me-3">
                      <input
                        type="text"
                        className="form-control rounded-pill"
                        placeholder={
                          selectedFile
                            ? "Nhập tin nhắn kèm file..."
                            : "Nhập tin nhắn..."
                        }
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isUploading}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "45px", height: "45px" }}
                      disabled={
                        (!newMessage.trim() && !selectedFile) || isUploading
                      }
                    >
                      {isUploading ? (
                        <div className="spinner-border spinner-border-sm text-white"></div>
                      ) : (
                        <i className="fa-solid fa-paper-plane"></i>
                      )}
                    </button>
                  </form>
                  <div className="mt-2 small text-muted text-center">
                    💡 Hỗ trợ file ảnh, video, audio và tài liệu (tối đa 10MB)
                  </div>
                </div>
              </>
            ) : (
              /* Welcome Screen */
              <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center bg-white">
                <div className="mb-4">
                  <i
                    className="fa-solid fa-comments text-primary"
                    style={{ fontSize: "5rem" }}
                  ></i>
                </div>
                <h3 className="mb-3">
                  Chào mừng đến với Autism Support Network
                </h3>
                <p className="text-muted mb-4">
                  Chọn một cuộc trò chuyện để bắt đầu trò chuyện hoặc tạo cuộc
                  trò chuyện mới
                </p>
                <div className="d-flex gap-3">
                  <button
                    className="btn btn-primary px-4"
                    onClick={handleRandomChat}
                  >
                    <i className="fa-solid fa-shuffle me-2"></i>
                    Chat ngẫu nhiên
                  </button>
                  <button
                    className="btn btn-outline-primary px-4"
                    onClick={toggleUserDetails}
                  >
                    <i className="fa-solid fa-user me-2"></i>
                    Thông tin cá nhân
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-chat {
          background-color: #f8f9fa;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e9ecef' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E");
        }
        .avatar-35 {
          width: 35px;
          height: 35px;
        }
        .avatar-45 {
          width: 45px;
          height: 45px;
        }
        .avatar-50 {
          width: 50px;
          height: 50px;
        }
        .avatar-80 {
          width: 80px;
          height: 80px;
        }
        .avatar-100 {
          width: 100px;
          height: 100px;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .cursor-pointer:hover {
          opacity: 0.8;
        }
        .smaller {
          font-size: 0.75rem;
        }
        /* CSS cho popups */
        .chat-user-detail-popup {
          position: absolute;
          top: 0;
          right: 0;
          width: 350px;
          height: 100%;
          background: white;
          box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
          overflow-y: auto;
        }
        .chat-user-detail-popup.show {
          transform: translateX(0);
        }
        .close-popup {
          background: none;
          border: none;
          font-size: 1.5rem;
          position: absolute;
          right: 15px;
          top: 15px;
          z-index: 1001;
          cursor: pointer;
          color: #6c757d;
        }
        .close-popup:hover {
          color: #495057;
        }
        .user-profile {
          padding: 20px;
        }
        .user-status {
          list-style: none;
          padding: 0;
        }
        .user-status li {
          padding: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default Chat;
