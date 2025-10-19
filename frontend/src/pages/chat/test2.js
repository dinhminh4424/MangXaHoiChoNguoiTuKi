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
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);

  // THÊM: State cho modal xem hình ảnh lớn
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState("");

  const otherUser = !selectedChat?.isGroup
    ? selectedChat?.members?.find((i) => i._id !== user.id)
    : null;

  // Hàm xử lý hiển thị tên với "..." khi quá dài
  const truncateName = (name, maxLength = 20) => {
    if (!name) return "";
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
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

    // Khi scroll lên gần đầu (100px từ top)
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    console.log(
      `Scroll: top=${scrollTop}, client=${clientHeight}, scroll=${scrollHeight}`
    );

    // Nếu scroll lên trên 10% từ đầu
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
      console.log("✅ Đã thêm event listener scroll");
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        container.removeEventListener("scroll", handleScroll);
        console.log("🧹 Đã dọn dẹp event listener");
      };
    }
  }, [handleScroll]);

  // Reset scroll state khi chọn chat mới
  useEffect(() => {
    setIsNearTop(false);
  }, [selectedChat?._id]);

  // THÊM: Hàm mở modal hình ảnh
  const openImageModal = (url, name = "") => {
    setSelectedImageUrl(url);
    setSelectedImageName(name);
    setShowImageModal(true);
  };

  // THÊM: Hàm đóng modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageUrl(null);
    setSelectedImageName("");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Nếu có file được chọn, gửi file trước
    if (selectedFile) {
      await handleSendFile(newMessage);
    }
    // Nếu có nội dung tin nhắn, gửi tin nhắn
    else if (newMessage.trim()) {
      const result = await sendMessage(newMessage);
      if (result.success) {
        setNewMessage("");
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước file (tối đa 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File quá lớn. Kích thước tối đa là 10MB.");
      return;
    }

    setSelectedFile(file);

    // Tạo preview cho ảnh
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Reset input file
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
        return <i className="fa-solid fa-image"></i>; // ảnh
      case "video":
        return <i className="fa-solid fa-video"></i>; // video
      case "audio":
        return <i className="fa-solid fa-music"></i>; // âm thanh
      case "file":
        return <i className="fa-solid fa-paperclip"></i>; // file đính kèm
      default:
        return <i className="fa-solid fa-file"></i>; // file mặc định
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

      console.log(randomUser);

      await startConversation(randomUser._id);
    } catch (error) {
      console.error("Lỗi khi bắt đầu chat ngẫu nhiên:", error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid vh-100">
      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show m-2"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={clearError}
          ></button>
        </div>
      )}

      {/* Uploading Overlay */}
      {isUploading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50 z-3">
          <div className="bg-white rounded p-4 text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Đang tải lên...</span>
            </div>
            <p className="mb-0">Đang tải file lên...</p>
          </div>
        </div>
      )}

      {/* THÊM: Modal xem hình ảnh lớn */}
      {showImageModal && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 z-4"
          tabIndex="-1"
          role="dialog"
          style={{ zIndex: 1050 }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-xl"
            role="document"
          >
            <div className="modal-content border-0 bg-transparent">
              <div className="modal-header border-0 justify-content-end p-2">
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeImageModal}
                  aria-label="Đóng"
                ></button>
              </div>
              <div className="modal-body p-0 d-flex align-items-center justify-content-center">
                {selectedImageUrl && (
                  <img
                    src={selectedImageUrl}
                    alt={selectedImageName || "Hình ảnh"}
                    className="img-fluid rounded"
                    style={{
                      maxHeight: "90vh",
                      maxWidth: "90vw",
                      objectFit: "contain",
                    }}
                  />
                )}
                {selectedImageName && (
                  <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 text-white bg-dark bg-opacity-50 px-3 py-1 rounded">
                    <small>{truncateName(selectedImageName, 30)}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="content-page" className="content-page">
        <div className="container">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body chat-page p-0">
                  <div className="chat-data-block">
                    <div className="row">
                      <div className="col-lg-3 chat-data-left scroller">
                        {/* Bản thân */}
                        <div className="chat-search pt-3 ps-3">
                          <div className="d-flex align-items-center">
                            <div className="chat-profile me-3">
                              {user.profile?.avatar ? (
                                <img
                                  src={user.profile.avatar}
                                  alt="chat-user"
                                  className="avatar-60 rounded-circle"
                                />
                              ) : (
                                <img
                                  src="/assets/images/default-avatar.png"
                                  alt="chat-user"
                                  className="avatar-60 rounded-circle"
                                />
                              )}
                            </div>
                            <div className="chat-caption">
                              <h5 className="mb-0">
                                {truncateName(user.fullName)}
                              </h5>
                              <p className="m-0 text-muted">
                                {truncateName(user.email, 25)}
                              </p>
                            </div>
                            <div className="dropdown ms-auto">
                              <button
                                className="btn btn-link text-muted p-0"
                                type="button"
                                data-bs-toggle="dropdown"
                              >
                                <i className="ri-more-2-line"></i>
                              </button>
                              <ul className="dropdown-menu">
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={handleLogout}
                                  >
                                    Đăng xuất
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={handleRandomChat}
                                  >
                                    Nhắn Tin Ngẫu Nhiên
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                          <div
                            id="user-detail-popup"
                            className="scroller "
                            style={{ zIndex: "100000" }}
                          >
                            <div className="user-profile">
                              <button type="submit" className="close-popup p-3">
                                <i className="ri-close-fill"></i>
                              </button>
                              <div className="user text-center mb-4">
                                <a className="avatar m-0">
                                  <img
                                    src="../assets/images/user/1.jpg"
                                    alt="avatar"
                                  />
                                </a>
                                <div className="user-name mt-4">
                                  <h4 className="text-center">Bni Jordan</h4>
                                </div>
                                <div className="user-desc">
                                  <p className="text-center">Web Designer</p>
                                </div>
                              </div>
                              <hr />
                              <div className="user-detail text-left mt-4 ps-4 pe-4">
                                <h5 className="mt-4 mb-4">About</h5>
                                <p>
                                  It is long established fact that a reader will
                                  be distracted bt the reddable.
                                </p>
                                <h5 className="mt-3 mb-3">Status</h5>
                                <ul className="user-status p-0">
                                  <li className="mb-1">
                                    <i className="ri-checkbox-blank-circle-fill text-success pe-1"></i>
                                    <span>Online</span>
                                  </li>
                                  <li className="mb-1">
                                    <i className="ri-checkbox-blank-circle-fill text-warning pe-1"></i>
                                    <span>Away</span>
                                  </li>
                                  <li className="mb-1">
                                    <i className="ri-checkbox-blank-circle-fill text-danger pe-1"></i>
                                    <span>Do Not Disturb</span>
                                  </li>
                                  <li className="mb-1">
                                    <i className="ri-checkbox-blank-circle-fill text-light pe-1"></i>
                                    <span>Offline</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Thanh tìm kiếm */}
                          <div className="chat-searchbar mt-4">
                            <div className="form-group chat-search-data m-0">
                              <input
                                type="text"
                                className="form-control round"
                                id="chat-search"
                                placeholder="Tìm kiếm..."
                              />
                              <i className="ri-search-line"></i>
                            </div>
                          </div>
                        </div>

                        {/* Các hộp thoại */}
                        <div className="chat-sidebar-channel scroller mt-4 ps-3">
                          <h5 className="mb-3">Cuộc trò chuyện</h5>
                          <ul className="iq-chat-ui nav flex-column nav-pills">
                            {conversations.length > 0 ? (
                              conversations.map((item) => (
                                <li key={item._id}>
                                  <button
                                    className={`nav-link w-100 text-start p-0 border-0 bg-transparent ${
                                      selectedChat?._id === item._id
                                        ? "active"
                                        : ""
                                    }`}
                                    onClick={() => selectChat(item)}
                                  >
                                    <div className="d-flex align-items-center p-2">
                                      <div className="avatar me-2">
                                        <div
                                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                          }}
                                        >
                                          {!item.isGroup
                                            ? item.members
                                                ?.find((m) => m._id !== user.id)
                                                ?.fullName?.charAt(0) || "U"
                                            : item.name?.charAt(0) || "G"}
                                        </div>
                                        <span className="avatar-status">
                                          <i className="ri-checkbox-blank-circle-fill text-success"></i>
                                        </span>
                                      </div>
                                      <div className="chat-sidebar-name flex-grow-1">
                                        <h6 className="mb-0 text-truncate">
                                          {item.isGroup
                                            ? truncateName(item.name)
                                            : truncateName(
                                                item.members?.find(
                                                  (m) => m._id !== user.id
                                                )?.fullName
                                              ) || "Unknown User"}
                                        </h6>
                                        <span className="text-muted text-truncate d-block">
                                          {item.lastMessage?.content ||
                                            "Chưa có tin nhắn"}
                                          {item.lastMessage?.file && " 📎"}
                                        </span>
                                      </div>
                                      {item.unreadCount > 0 && (
                                        <div className="chat-meta text-center">
                                          <div className="chat-msg-counter bg-primary text-white rounded-pill px-2">
                                            {item.unreadCount}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                </li>
                              ))
                            ) : (
                              <div className="text-center text-muted p-3">
                                Không có cuộc trò chuyện nào
                              </div>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="col-lg-9 chat-data p-0 chat-data-right">
                        <div className="tab-content">
                          {selectedChat ? (
                            <div
                              className="tab-pane fade active show"
                              id="chat-conversation"
                              role="tabpanel"
                            >
                              {/* Chat header */}
                              <div className="chat-head">
                                <header className="d-flex justify-content-between align-items-center bg-white pt-3 ps-3 pe-3 pb-3">
                                  <div className="d-flex align-items-center">
                                    <div className="sidebar-toggle">
                                      <i className="ri-menu-3-line"></i>
                                    </div>
                                    <div className="avatar chat-user-profile m-0 me-3">
                                      {selectedChat.isGroup ? (
                                        <div
                                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                          }}
                                        >
                                          {selectedChat.name?.charAt(0) || "G"}
                                        </div>
                                      ) : (
                                        <div
                                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                          }}
                                        >
                                          {otherUser?.fullName?.charAt(0) ||
                                            "U"}
                                        </div>
                                      )}
                                      <span className="avatar-status">
                                        <i className="ri-checkbox-blank-circle-fill text-success"></i>
                                      </span>
                                    </div>
                                    <div>
                                      <h5 className="mb-0">
                                        {selectedChat.isGroup
                                          ? truncateName(selectedChat.name)
                                          : truncateName(otherUser?.fullName)}
                                      </h5>
                                      <small className="text-muted">
                                        {selectedChat.isOnline
                                          ? "Đang hoạt động"
                                          : "Ngoại tuyến"}
                                      </small>
                                    </div>
                                  </div>

                                  {/* Bổ sung phần chat-user-detail-popup */}
                                  <div className="chat-user-detail-popup scroller">
                                    <div className="user-profile">
                                      <button
                                        type="submit"
                                        className="close-popup p-3"
                                      >
                                        <i className="ri-close-fill"></i>
                                      </button>
                                      <div className="user mb-4 text-center">
                                        <a className="avatar m-0">
                                          <img
                                            src="../assets/images/user/05.jpg"
                                            alt="avatar"
                                          />
                                        </a>
                                        <div className="user-name mt-4">
                                          <h4>
                                            {truncateName("Bni Jordan 11", 15)}
                                          </h4>
                                        </div>
                                        <div className="user-desc">
                                          <p>
                                            {truncateName(
                                              "Cape Town, RSA 12",
                                              15
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <hr />
                                      <div className="chatuser-detail text-left mt-4">
                                        <div className="row">
                                          <div className="col-6 col-md-6 title">
                                            {truncateName("Bni Name: 13", 15)}
                                          </div>
                                          <div className="col-6 col-md-6 text-right">
                                            Bni
                                          </div>
                                        </div>
                                        <hr />
                                        <div className="row">
                                          <div className="col-6 col-md-6 title">
                                            Tel:
                                          </div>
                                          <div className="col-6 col-md-6 text-right">
                                            072 143 9920 14
                                          </div>
                                        </div>
                                        <hr />
                                        <div className="row">
                                          <div className="col-6 col-md-6 title">
                                            Date Of Birth:
                                          </div>
                                          <div className="col-6 col-md-6 text-right">
                                            July 12, 1989 15
                                          </div>
                                        </div>
                                        <hr />
                                        <div className="row">
                                          <div className="col-6 col-md-6 title">
                                            Gender:
                                          </div>
                                          <div className="col-6 col-md-6 text-right">
                                            Male
                                          </div>
                                        </div>
                                        <hr />
                                        <div className="row">
                                          <div className="col-6 col-md-6 title">
                                            Language:
                                          </div>
                                          <div className="col-6 col-md-6 text-right">
                                            Engliah 16
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="chat-header-icons d-flex">
                                    <a
                                      href="#"
                                      className="chat-icon-phone bg-soft-primary  p-2 mx-1 d-flex justify-content-center align-items-center"
                                    >
                                      <i className="ri-phone-line"></i>
                                    </a>
                                    <a
                                      href="#"
                                      className="chat-icon-video bg-soft-primary p-2 mx-1  d-flex justify-content-center align-items-center"
                                    >
                                      <i className="ri-vidicon-line"></i>
                                    </a>
                                    <a
                                      href="#"
                                      className="chat-icon-delete bg-soft-primary p-2 mx-1 d-flex justify-content-center align-items-center"
                                    >
                                      <i className="ri-delete-bin-line"></i>
                                    </a>
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
                                </header>
                              </div>

                              {/* Nội dung tin nhắn */}
                              <div
                                ref={messagesContainerRef}
                                className="chat-content scroller bg-light"
                                style={{ height: "400px" }}
                              >
                                {/* Loading indicator khi tải thêm tin nhắn cũ */}
                                {loadingMore && (
                                  <div className="text-center py-2">
                                    <div
                                      className="spinner-border spinner-border-sm text-primary"
                                      role="status"
                                    >
                                      <span className="visually-hidden">
                                        Đang tải tin nhắn cũ...
                                      </span>
                                    </div>
                                    <small className="text-muted ms-2">
                                      Đang tải tin nhắn cũ...
                                    </small>
                                  </div>
                                )}

                                {/* Hiển thị thông báo khi còn tin nhắn cũ */}
                                {hasMoreMessages && !loadingMore && (
                                  <div className="text-center py-2">
                                    <small className="text-muted">
                                      Cuộn lên để xem tin nhắn cũ hơn
                                    </small>
                                  </div>
                                )}

                                {/* Danh sách tin nhắn */}
                                {messages.map((message, index) => (
                                  <div
                                    key={message._id || index}
                                    className={`chat ${
                                      message.sender?._id === user.id
                                        ? "d-flex other-user"
                                        : "chat-left"
                                    }`}
                                  >
                                    <div className="chat-user">
                                      <div className="avatar m-0">
                                        {message.sender?._id === user.id ? (
                                          <img
                                            src={
                                              user.profile?.avatar ||
                                              "/assets/images/default-avatar.png"
                                            }
                                            alt="avatar"
                                            className="avatar-35 rounded-circle"
                                          />
                                        ) : (
                                          <div
                                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                            style={{
                                              width: "35px",
                                              height: "35px",
                                            }}
                                          >
                                            {message.sender?.fullName?.charAt(
                                              0
                                            ) || "U"}
                                          </div>
                                        )}
                                      </div>
                                      <span className="chat-time mt-1">
                                        {new Date(
                                          message.createdAt
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <div className="chat-detail">
                                      <div className="chat-message">
                                        {/* Hiển thị file/image/video/audio nếu có */}
                                        {message.fileUrl && (
                                          <div className="mb-2">
                                            {message.messageType === "image" ? (
                                              <div className="text-center">
                                                <img
                                                  src={message.fileUrl}
                                                  alt={
                                                    message.fileName || "Image"
                                                  }
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
                                                  role="button"
                                                />
                                                {message.fileName && (
                                                  <div className="mt-1 small opacity-75">
                                                    {truncateName(
                                                      message.fileName,
                                                      25
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            ) : message.messageType ===
                                              "video" ? (
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
                                                  Trình duyệt của bạn không hỗ
                                                  trợ video.
                                                </video>
                                                {message.fileName && (
                                                  <div className="mt-1 small opacity-75">
                                                    {truncateName(
                                                      message.fileName,
                                                      25
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            ) : message.messageType ===
                                              "audio" ? (
                                              <div className="d-flex align-items-center p-2 bg-dark bg-opacity-10 rounded">
                                                <span className="fs-4 me-3">
                                                  {getFileIcon(
                                                    message.messageType
                                                  )}
                                                </span>
                                                <audio
                                                  controls
                                                  className="flex-grow-1"
                                                >
                                                  <source
                                                    src={message.fileUrl}
                                                    type="audio/mpeg"
                                                  />
                                                  Trình duyệt của bạn không hỗ
                                                  trợ audio.
                                                </audio>
                                              </div>
                                            ) : (
                                              // File documents (PDF, Word, Excel, etc.)
                                              <div className="d-flex align-items-center p-2 bg-dark bg-opacity-10 rounded">
                                                <span className="fs-4 me-2">
                                                  {getFileIcon(
                                                    message.messageType
                                                  )}
                                                </span>
                                                <div className="flex-grow-1">
                                                  <div className="fw-bold small">
                                                    {truncateName(
                                                      message.fileName ||
                                                        "File",
                                                      25
                                                    )}
                                                  </div>
                                                  {message.fileSize && (
                                                    <div className="text-muted smaller">
                                                      {formatFileSize(
                                                        message.fileSize
                                                      )}
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

                                        {/* Hiển thị nội dung tin nhắn */}
                                        {message.content && (
                                          <div className="message-content">
                                            <p className="mb-0">
                                              {message.content}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <div ref={messagesEndRef} />
                              </div>

                              {/* File Preview Area */}
                              {selectedFile && (
                                <div className="p-3 border-bottom bg-warning bg-opacity-10">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                      <span className="fs-4 me-2">
                                        {getFileIcon(
                                          selectedFile.type.startsWith("image/")
                                            ? "image"
                                            : selectedFile.type.startsWith(
                                                "video/"
                                              )
                                            ? "video"
                                            : selectedFile.type.startsWith(
                                                "audio/"
                                              )
                                            ? "audio"
                                            : "file"
                                        )}
                                      </span>
                                      <div>
                                        <div className="fw-bold">
                                          {truncateName(selectedFile.name, 25)}
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

                                  {/* Image Preview */}
                                  {filePreview &&
                                    selectedFile.type.startsWith("image/") && (
                                      <div className="mt-2 text-center">
                                        <img
                                          src={filePreview}
                                          alt="Preview"
                                          className="img-fluid rounded"
                                          style={{ maxHeight: "150px" }}
                                        />
                                      </div>
                                    )}

                                  {/* Video Preview */}
                                  {filePreview &&
                                    selectedFile.type.startsWith("video/") && (
                                      <div className="mt-2 text-center">
                                        <video
                                          controls
                                          className="img-fluid rounded"
                                          style={{ maxHeight: "150px" }}
                                        >
                                          <source
                                            src={filePreview}
                                            type={selectedFile.type}
                                          />
                                          Trình duyệt của bạn không hỗ trợ video
                                          preview.
                                        </video>
                                      </div>
                                    )}

                                  <div className="mt-2">
                                    <small className="text-muted">
                                      File đã sẵn sàng để gửi. Nhấn nút "Gửi" để
                                      gửi file.
                                    </small>
                                  </div>
                                </div>
                              )}

                              {/* Message Input */}
                              <div className="chat-footer p-3 bg-white">
                                <form
                                  className="d-flex align-items-center"
                                  onSubmit={handleSendMessage}
                                >
                                  <div className="chat-attagement d-flex">
                                    <button
                                      type="button"
                                      className="btn btn-link text-muted p-2"
                                      onClick={() =>
                                        fileInputRef.current?.click()
                                      }
                                      disabled={isUploading}
                                    >
                                      <i className="fa fa-paperclip"></i>
                                    </button>
                                  </div>

                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    style={{ display: "none" }}
                                    disabled={isUploading}
                                  />
                                  <input
                                    type="text"
                                    className="form-control me-3"
                                    placeholder={
                                      selectedFile
                                        ? "Nhập tin nhắn kèm file (tuỳ chọn)..."
                                        : "Nhập tin nhắn..."
                                    }
                                    value={newMessage}
                                    onChange={(e) =>
                                      setNewMessage(e.target.value)
                                    }
                                    disabled={isUploading}
                                  />
                                  <button
                                    type="submit"
                                    className="btn btn-primary d-flex align-items-center p-2"
                                    disabled={
                                      (!newMessage.trim() && !selectedFile) ||
                                      isUploading
                                    }
                                  >
                                    {isUploading ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Đang gửi...
                                      </>
                                    ) : (
                                      <>
                                        <i className="far fa-paper-plane me-1"></i>
                                        <span className="d-none d-lg-block">
                                          Gửi
                                        </span>
                                      </>
                                    )}
                                  </button>
                                </form>
                                <div className="mt-2 small text-muted">
                                  💡 Chọn file để gửi (tối đa 10MB)
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="tab-pane fade active show"
                              id="default-block"
                              role="tabpanel"
                            >
                              <div className="chat-start text-center py-5">
                                <span className="iq-start-icon text-primary">
                                  <i
                                    className="ri-message-3-line"
                                    style={{ fontSize: "4rem" }}
                                  ></i>
                                </span>
                                <h4 className="mt-3">
                                  Chào mừng đến với Autism Support Network
                                </h4>
                                <p className="text-muted">
                                  Chọn một cuộc trò chuyện để bắt đầu
                                </p>
                                <button
                                  className="btn btn-primary mt-3"
                                  onClick={handleRandomChat}
                                >
                                  Bắt đầu trò chuyện ngẫu nhiên
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THÊM: CSS cho cursor pointer */}
      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .cursor-pointer:hover {
          opacity: 0.8;
        }
        .chat-sidebar-channel {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
        .chat-content {
          max-height: 600px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default Chat;
