import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";
import { Modal } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import TextReaderAdvanced from "../../components/voice/TextReaderAdvanced";
import SpeechToText from "../../components/voice/SpeechToText";
import { File, Image, Video, Music, PinIcon } from "lucide-react";

const Chat = () => {
  const { user, logout } = useAuth();
  const { chatUserId } = useParams();
  const navigate = useNavigate();
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
    deleteMessage,
    recallMessage,
    pinConversation,
    deleteConversation,
    unBlockConversation,
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserDetails, setShowUserDetails] = useState(false);

  // State cho popups
  const [showUserDetailPopup, setShowUserDetailPopup] = useState(false);
  const [showChatDetailPopup, setShowChatDetailPopup] = useState(false);

  // State mới cho xoá và trả lời tin nhắn
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDeleteConversationConfirm, setShowDeleteConversationConfirm] =
    useState(null);
  const [showUnblockConversationConfirm, setShowUnblockConversationConfirm] =
    useState(null);
  const [showSuccess, setShowSuccess] = useState(null);
  const [showRecallConfirm, setShowRecallConfirm] = useState(null);

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

  const directConversations = filteredConversations.filter((c) => !c.isGroup);

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

    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Tạo các giá trị cho so sánh ngày
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dateDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Nếu là hôm nay
    if (dateDay.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Nếu là hôm qua
    if (dateDay.getTime() === yesterday.getTime()) {
      return (
        "Hôm qua, " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }

    // Nếu cách hơn 2 ngày thì hiển thị ngày đầy đủ
    const datePart = date.toLocaleDateString(); // VD: "26/11/2025"
    const timePart = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }); // VD: "14:32"
    return `${timePart}, ${datePart} `;
  };

  const hasStartedConversation = useRef(false);

  // useEffect(() => {
  //   let userIdChat = chatUserId;
  //   if (userIdChat) {
  //     startConversation(userIdChat);
  //   }
  // }, [chatUserId]);

  useEffect(() => {
    if (hasStartedConversation.current || !chatUserId) return;

    console.log("🎯 Bắt đầu chat với user:", chatUserId);
    hasStartedConversation.current = true;

    const startChat = async () => {
      try {
        // KIỂM TRA: Conversation đã tồn tại chưa?
        const existingConv = conversations.find(
          (conv) =>
            !conv.isGroup &&
            conv.members.some((member) => member._id === chatUserId)
        );

        if (existingConv) {
          console.log("✅ Dùng conversation có sẵn:", existingConv._id);
          await selectChat(existingConv);
        } else {
          console.log("🆕 Tạo conversation mới");
          await startConversation(chatUserId, false);
        }
      } catch (error) {
        console.error("Lỗi khi bắt đầu chat:", error);
        hasStartedConversation.current = false;
      }
    };

    startChat();
  }, [chatUserId, conversations, startConversation, selectChat]);

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

  const handleDeleteConversation = async (conversationId) => {
    try {
      const result = await deleteConversation(conversationId);
      if (result.success) {
        setShowDeleteConversationConfirm(false);
      }
    } catch (error) {
      console.error("Lỗi khi xoá hộp thoại tin nhắn:", error);
    }
  };

  const handleShowUnBlockConversation = async (conversationId) => {
    try {
      const result = await unBlockConversation(conversationId);
      if (result.success) {
        setShowUnblockConversationConfirm(false);
      }
    } catch (error) {
      console.error("Lỗi khi xoá hộp thoại tin nhắn:", error);
    }
  };

  // Reset scroll state khi chọn chat mới
  useEffect(() => {
    setIsNearTop(false);
    setReplyingTo(null);
    setShowMessageMenu(null);
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

  // Hàm xử lý double click để hiển thị menu tin nhắn
  const handleMessageDoubleClick = (messageId, event) => {
    event.preventDefault();
    setShowMessageMenu(showMessageMenu === messageId ? null : messageId);
  };

  // Hàm trả lời tin nhắn
  const handleReplyMessage = (message) => {
    setReplyingTo(message);
    setShowMessageMenu(null);
    // Focus vào input tin nhắn
    setTimeout(() => {
      document.querySelector("#input_send_message")?.focus();
    }, 100);
  };

  // Hàm huỷ trả lời
  const handleCancelReply = () => {
    setReplyingTo(null);
  };
  const handleSubmitUnBlock = async (conversationId) => {
    try {
      console.log(conversationId);
      const result = await unBlockConversation(conversationId, true);
      if (result.success) {
        setReplyingTo(null);
        alert("Thành Công");
      }
    } catch (error) {
      console.error("Lỗi mở khoá hộp thoại tin nhắn:", error);
    }
  };

  // Hàm xoá tin nhắn
  const handleDeleteMessage = async (messageId) => {
    try {
      const result = await deleteMessage(messageId);
      if (result.success) {
        setShowDeleteConfirm(null);
        setShowMessageMenu(null);
      }
    } catch (error) {
      console.error("Lỗi khi xoá tin nhắn:", error);
    }
  };
  // Hàm thu hồi tin nhắn
  const handleRecallMessage = async (messageId) => {
    try {
      const result = await recallMessage(messageId);
      if (result.success) {
        setShowRecallConfirm(null);
        setShowMessageMenu(null);
      }
    } catch (error) {
      console.error("Lỗi khi thu hồi tin nhắn:", error);
    }
  };

  // Hàm gửi tin nhắn với trả lời
  const handleSendMessage = async (e) => {
    e.preventDefault();

    let messageContent = newMessage;

    if (replyingTo) {
      // Thêm thông tin trả lời vào nội dung tin nhắn
      messageContent = `Trả lời ${replyingTo.sender?.fullName}: ${newMessage}`;
    }

    if (selectedFile) {
      await handleSendFile(messageContent, replyingTo?.messageId || null);
    } else if (newMessage.trim()) {
      console.log("messageContent : ", messageContent);

      const result = await sendMessage(
        messageContent,
        selectedChat._id,
        replyingTo?._id || null
      );
      if (result.success) {
        setNewMessage("");
        setReplyingTo(null);
        setSelectedFile(null);
        setFilePreview(null);
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

  const handleSendFile = async (messageContent = "", repliedTo = "") => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await sendFileMessage(
        selectedFile,
        messageContent,
        repliedTo
      );
      if (result.success) {
        setSelectedFile(null);
        setFilePreview(null);
        setNewMessage("");
        setReplyingTo(null);
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

  const handlePinChat = async (chatId) => {
    try {
      const res = await pinConversation(chatId);
      if (res.success) {
        console.log("Thành công");
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
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

  // Ngăn nhảy layout khi mở modal
  useEffect(() => {
    const applyBodyLock = () => {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      document.body.classList.add("modal-open");
    };

    const clearBodyLock = () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.classList.remove("modal-open");
    };

    if (showImageModal) {
      applyBodyLock();
    } else {
      clearBodyLock();
    }

    return () => {
      clearBodyLock();
    };
  }, [showImageModal]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleUserDetails = () => {
    setShowUserDetails(!showUserDetails);
  };

  const setVoiceNewMessage = (newData) => {
    setNewMessage((prev) => {
      return prev + " " + newData;
    });
  };

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageMenu && !event.target.closest(".message-menu")) {
        setShowMessageMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMessageMenu]);

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
    <div id="content-page" className="content-page">
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <div className="card">
              <div className="card-body chat-page p-0">
                <div className="chat-data-block">
                  <div className="row">
                    <div className="col-lg-3 chat-data-left scroller">
                      {/* Sidebar code remains the same */}
                      <div className="chat-search pt-4 ps-4 pe-4 pb-2">
                        {/* --- Header User Profile & Close Button --- */}
                        <div className="d-flex align-items-center justify-content-between">
                          <div
                            className="d-flex align-items-center cursor-pointer profile-trigger"
                            onClick={() => setShowUserDetailPopup(true)}
                          >
                            <div className="position-relative me-3">
                              {user.profile?.avatar ? (
                                <img
                                  src={user.profile.avatar}
                                  alt="chat-user"
                                  className="avatar-50 rounded-circle object-cover shadow-sm"
                                />
                              ) : (
                                <img
                                  src="/assets/images/default-avatar.png"
                                  alt="chat-user"
                                  className="avatar-50 rounded-circle object-cover shadow-sm"
                                />
                              )}
                              {/* Online status dot (optional) */}
                              <span className="position-absolute bottom-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle"></span>
                            </div>

                            <div className="chat-caption overflow-hidden">
                              <h6
                                className="mb-0 fw-bold text-truncate"
                                style={{ maxWidth: "150px" }}
                              >
                                {user.fullName}
                              </h6>
                              <small
                                className="text-muted text-truncate d-block"
                                style={{ maxWidth: "150px" }}
                              >
                                {user.email}
                              </small>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-icon btn-light rounded-circle shadow-sm close-btn-res"
                          >
                            <i className="ri-close-line fs-5"></i>
                          </button>
                        </div>

                        {/* --- Search Bar (Viên thuốc) --- */}
                        <div className="chat-searchbar mt-4">
                          <div className="form-group position-relative mb-0">
                            <input
                              type="text"
                              className="form-control rounded-pill bg-light border-0 py-2 ps-5"
                              id="chat-search"
                              placeholder="Tìm kiếm bạn bè, tin nhắn..."
                              value={searchTerm}
                              onChange={handleSearchChange}
                            />
                            <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                          </div>
                        </div>

                        {/* --- Modal Thông tin người dùng (Modern Style) --- */}
                        <Modal
                          show={showUserDetailPopup}
                          onHide={() => setShowUserDetailPopup(false)}
                          centered
                          contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
                        >
                          {/* --- HEADER: ẢNH BÌA (COVER PHOTO) --- */}
                          <div
                            className="modal-header-custom position-relative p-4 text-center"
                            style={{
                              height: "150px",
                              // Nếu có coverPhoto thì dùng ảnh, không thì dùng gradient tím/xanh
                              backgroundImage: user.profile?.coverPhoto
                                ? `url(${user.profile?.coverPhoto})`
                                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            {/* Nút đóng modal */}
                            <button
                              className="btn-close btn-close-white position-absolute top-0 end-0 m-3 shadow-sm bg-white opacity-100"
                              onClick={() => setShowUserDetailPopup(false)}
                              style={{ padding: "0.5rem" }}
                            ></button>
                          </div>

                          <Modal.Body className="pt-0 px-4 pb-4">
                            {/* --- AVATAR & MAIN INFO --- */}
                            <div
                              className="text-center"
                              style={{ marginTop: "-65px" }}
                            >
                              <div className="d-inline-block position-relative">
                                <img
                                  src={
                                    user.profile?.avatar ||
                                    "/assets/images/default-avatar.png"
                                  }
                                  alt="avatar"
                                  className="rounded-circle border border-4 border-white shadow-sm bg-white"
                                  style={{
                                    width: "130px",
                                    height: "130px",
                                    objectFit: "cover",
                                  }}
                                />
                                {/* Icon tích xanh ngay cạnh avatar (nếu muốn) */}
                                {user.profile?.idCard?.verified && (
                                  <span
                                    className="position-absolute bottom-0 end-0 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      border: "2px solid white",
                                    }}
                                  >
                                    <i className="ri-verified-badge-fill text-primary fs-5"></i>
                                  </span>
                                )}
                              </div>

                              {/* Tên & Role */}
                              <div className="mt-3">
                                <h4 className="mb-1 fw-bold d-flex align-items-center justify-content-center gap-2">
                                  {user.fullName}
                                </h4>

                                {/* Role Badges */}
                                <div className="mb-2">
                                  {user.role === "admin" && (
                                    <span className="badge bg-danger rounded-pill me-1">
                                      Admin
                                    </span>
                                  )}
                                  {user.role === "doctor" && (
                                    <span className="badge bg-primary rounded-pill me-1">
                                      Bác sĩ
                                    </span>
                                  )}
                                  {user.role === "supporter" && (
                                    <span className="badge bg-warning text-dark rounded-pill me-1">
                                      Hỗ trợ viên
                                    </span>
                                  )}
                                  <span className="text-muted small">
                                    {user.email}
                                  </span>
                                </div>
                              </div>

                              {/* Buttons */}
                              <div className="d-flex justify-content-center gap-2 mb-4 mt-3">
                                <button
                                  className="btn btn-primary rounded-pill px-4 shadow-sm fw-medium"
                                  onClick={() => {
                                    handleRandomChat();
                                    setShowUserDetailPopup(false);
                                  }}
                                >
                                  <i className="ri-chat-smile-2-line me-2"></i>
                                  Nhắn tin ngẫu nhiên
                                </button>
                                <a
                                  href="/profile"
                                  className="btn btn-light rounded-circle shadow-sm text-secondary"
                                >
                                  <i className="ri-user-add-line"></i>
                                </a>
                              </div>
                            </div>

                            {/* --- BIO & LOCATION --- */}
                            <div className="bg-light rounded-3 p-3 mb-3">
                              {/* Location */}
                              {user.profile?.location && (
                                <div className="d-flex align-items-center text-muted mb-2 small">
                                  <i className="ri-map-pin-line me-2 text-primary"></i>
                                  <span>
                                    Sống tại <b>{user.profile.location}</b>
                                  </span>
                                </div>
                              )}

                              {/* Bio */}
                              <h6 className="fw-bold text-uppercase text-secondary fs-7 mb-2 mt-3">
                                Giới thiệu
                              </h6>
                              <p
                                className="mb-0 text-secondary small"
                                style={{ lineHeight: "1.6" }}
                              >
                                {user.profile?.bio ||
                                  "Người dùng này chưa cập nhật tiểu sử."}
                              </p>
                            </div>

                            {/* --- SKILLS & INTERESTS (Thay thế cho Status cũ) --- */}
                            <div className="row g-3">
                              {/* Cột Kỹ năng */}
                              <div className="col-12">
                                <h6 className="fw-bold text-uppercase text-secondary fs-7 mb-2">
                                  Kỹ năng
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {user.profile?.skills &&
                                  user.profile?.skills.length > 0 ? (
                                    user.profile?.skills.map((skill, index) => (
                                      <span
                                        key={index}
                                        className="badge bg-soft-primary text-primary border border-primary-subtle rounded-pill fw-normal px-3 py-2"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-muted small fst-italic">
                                      Chưa cập nhật
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Cột Sở thích */}
                              <div className="col-12">
                                <h6 className="fw-bold text-uppercase text-secondary fs-7 mb-2">
                                  Sở thích
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {user.profile?.interests &&
                                  user.profile?.interests.length > 0 ? (
                                    user.profile?.interests.map(
                                      (interest, index) => (
                                        <span
                                          key={index}
                                          className="badge bg-light text-dark border rounded-pill fw-normal px-3 py-2"
                                        >
                                          # {interest}
                                        </span>
                                      )
                                    )
                                  ) : (
                                    <span className="text-muted small fst-italic">
                                      Chưa cập nhật
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Modal.Body>
                        </Modal>
                      </div>

                      <div className="chat-sidebar-channel scroller mt-4 ps-3">
                        <h5 className="mt-3">Hộp Thoại Tin Nhắn</h5>
                        <ul className="iq-chat-ui nav flex-column nav-pills">
                          {directConversations.length > 0 ? (
                            directConversations.map((item) => {
                              return (
                                <li key={item._id}>
                                  <button
                                    className={`nav-link w-100 text-start p-0 border-0  ${
                                      selectedChat?._id === item._id
                                        ? "active bg-primary"
                                        : "bg-transparent"
                                    }`}
                                    onClick={() => selectChat(item)}
                                  >
                                    <div className="d-flex align-items-center p-2">
                                      <div className="avatar me-2">
                                        <img
                                          src={
                                            !item.userUnBlock?.length
                                              ? item.members?.find(
                                                  (m) => m._id !== user.id
                                                )?.profile?.avatar ||
                                                "/assets/images/default-avatar.png"
                                              : "/assets/images/andanh.jpg"
                                          }
                                          alt="chatuserimage"
                                          className="rounded-circle w-100 "
                                        />
                                      </div>
                                      {item.isPinned && (
                                        <PinIcon className="text-yellow-500" />
                                      )}
                                      <div></div>
                                      <div className="chat-sidebar-name flex-grow-1">
                                        <h6 className="mb-0">
                                          {!item.userUnBlock?.length
                                            ? truncateName(
                                                item.members?.find(
                                                  (m) => m._id !== user.id
                                                )?.fullName || "Unknown User"
                                              )
                                            : truncateName(
                                                item.members?.find(
                                                  (m) => m._id !== user.id
                                                )?._id
                                              )}
                                        </h6>
                                        <span className="text-muted d-block">
                                          {truncateText(
                                            item.lastMessage?.content ||
                                              "Chưa có tin nhắn",
                                            30
                                          )}

                                          <div
                                            className={
                                              "truncate-text flex items-center gap-1" +
                                                selectedChat?._id ===
                                              item._id
                                                ? "active"
                                                : "text-gray-600"
                                            }
                                          >
                                            {item.lastMessage?.messageType ===
                                              "file" && (
                                              <>
                                                <File size={16} />
                                                <span>
                                                  {truncateText(
                                                    item.lastMessage
                                                      ?.fileName ||
                                                      "Đã gửi một file"
                                                  )}
                                                </span>
                                              </>
                                            )}

                                            {item.lastMessage?.messageType ===
                                              "image" && (
                                              <>
                                                <Image size={16} />
                                                {truncateText(
                                                  item.lastMessage?.fileName ||
                                                    "Đã gửi một hình ảnh"
                                                )}
                                              </>
                                            )}

                                            {item.lastMessage?.messageType ===
                                              "video" && (
                                              <>
                                                <Video size={16} />
                                                {truncateText(
                                                  item.lastMessage?.fileName ||
                                                    "Đã gửi một video"
                                                )}
                                              </>
                                            )}

                                            {item.lastMessage?.messageType ===
                                              "audio" && (
                                              <>
                                                <Music size={16} />
                                                {truncateText(
                                                  item.lastMessage?.fileName ||
                                                    "Đã gửi một đoạn âm thanh"
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </span>
                                      </div>
                                      {item.unreadCount > 0 && (
                                        <div className="chat-meta text-center me-1">
                                          <div className="chat-msg-counter bg-primary text-white">
                                            {item.unreadCount}
                                          </div>
                                          <span className="text-nowrap small">
                                            {item.lastMessage?.createdAt
                                              ? formatTime(
                                                  item.lastMessage.createdAt
                                                )
                                              : ""}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                </li>
                              );
                            })
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
                        {!selectedChat ? (
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
                        ) : (
                          <div
                            className="tab-pane fade active show"
                            id="chat-conversation"
                            role="tabpanel"
                          >
                            {/* Chat header */}
                            <div className="chat-head">
                              <header className="d-flex justify-content-between align-items-center bg-white pt-3 pe-3 pb-3">
                                <div className="d-flex align-items-center">
                                  <div className="sidebar-toggle">
                                    <i className="ri-menu-3-line"></i>
                                  </div>
                                  <div
                                    className="avatar chat-user-profile m-0 me-3 cursor-pointer"
                                    onClick={() => setShowChatDetailPopup(true)}
                                  >
                                    {selectedChat.isGroup ? (
                                      <div className="avatar-50 rounded-circle bg-primary d-flex align-items-center justify-content-center text-white">
                                        {selectedChat.name?.charAt(0) || "G"}
                                      </div>
                                    ) : (
                                      <img
                                        src={
                                          !selectedChat.userUnBlock?.length > 0
                                            ? otherUser?.profile?.avatar ||
                                              "/assets/images/default-avatar.png"
                                            : "/assets/images/andanh.jpg"
                                        }
                                        alt="avatar"
                                        className="avatar-50 rounded-circle w-100"
                                      />
                                    )}
                                    <span className="avatar-status">
                                      <i className="ri-checkbox-blank-circle-fill text-success"></i>
                                    </span>
                                  </div>
                                  <h5 className="mb-0">
                                    {selectedChat.isGroup
                                      ? truncateName(selectedChat.name)
                                      : !selectedChat.userUnBlock?.length > 0
                                      ? truncateName(otherUser?.fullName)
                                      : otherUser._id}
                                  </h5>
                                </div>
                                {/* Modal thông tin người đối diện */}

                                <Modal
                                  show={showChatDetailPopup}
                                  onHide={() => setShowUserDetailPopup(false)}
                                  centered
                                  contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
                                >
                                  {/* --- HEADER: ẢNH BÌA (COVER PHOTO) --- */}
                                  <div
                                    className="modal-header-custom position-relative p-4 text-center"
                                    style={{
                                      height: "150px",
                                      // Nếu có coverPhoto thì dùng ảnh, không thì dùng gradient tím/xanh
                                      backgroundImage: otherUser.profile
                                        ?.coverPhoto
                                        ? `url(${otherUser.profile?.coverPhoto})`
                                        : "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }}
                                  >
                                    {/* Nút đóng modal */}
                                    <button
                                      className="btn-close btn-close-white position-absolute top-0 end-0 m-3 shadow-sm bg-white opacity-100"
                                      onClick={() =>
                                        setShowChatDetailPopup(false)
                                      }
                                      style={{ padding: "0.5rem" }}
                                    ></button>
                                  </div>

                                  <Modal.Body className="pt-0 px-4 pb-4">
                                    {/* --- AVATAR & MAIN INFO --- */}
                                    <div
                                      className="text-center"
                                      style={{ marginTop: "-65px" }}
                                    >
                                      <div className="d-inline-block position-relative">
                                        <img
                                          src={
                                            otherUser.profile?.avatar ||
                                            "/assets/images/default-avatar.png"
                                          }
                                          alt="avatar"
                                          className="rounded-circle border border-4 border-white shadow-sm bg-white"
                                          style={{
                                            width: "130px",
                                            height: "130px",
                                            objectFit: "cover",
                                          }}
                                        />
                                        {/* Icon tích xanh ngay cạnh avatar (nếu muốn) */}
                                        {otherUser.profile?.idCard
                                          ?.verified && (
                                          <span
                                            className="position-absolute bottom-0 end-0 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                            style={{
                                              width: "32px",
                                              height: "32px",
                                              border: "2px solid white",
                                            }}
                                          >
                                            <i className="ri-verified-badge-fill text-primary fs-5"></i>
                                          </span>
                                        )}
                                      </div>

                                      {/* Tên & Role */}
                                      <div className="mt-3">
                                        <h4 className="mb-1 fw-bold d-flex align-items-center justify-content-center gap-2">
                                          {otherUser.fullName}
                                        </h4>

                                        {/* Role Badges */}
                                        <div className="mb-2">
                                          {otherUser.role === "admin" && (
                                            <span className="badge bg-danger rounded-pill me-1">
                                              Admin
                                            </span>
                                          )}
                                          {otherUser.role === "doctor" && (
                                            <span className="badge bg-primary rounded-pill me-1">
                                              Bác sĩ
                                            </span>
                                          )}
                                          {otherUser.role === "supporter" && (
                                            <span className="badge bg-warning text-dark rounded-pill me-1">
                                              Hỗ trợ viên
                                            </span>
                                          )}
                                          <span className="text-muted small">
                                            {otherUser.email}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* --- BIO & LOCATION --- */}
                                    <div className="bg-light rounded-3 p-3 mb-3">
                                      {/* Location */}
                                      {otherUser.profile?.location && (
                                        <div className="d-flex align-items-center text-muted mb-2 small">
                                          <i className="ri-map-pin-line me-2 text-primary"></i>
                                          <span>
                                            Sống tại{" "}
                                            <b>{otherUser.profile.location}</b>
                                          </span>
                                        </div>
                                      )}

                                      {/* Bio */}
                                      <h6 className="fw-bold text-uppercase text-secondary fs-7 mb-2 mt-3">
                                        Giới thiệu
                                      </h6>
                                      <p
                                        className="mb-0 text-secondary small"
                                        style={{ lineHeight: "1.6" }}
                                      >
                                        {user.profile?.bio ||
                                          "Người dùng này chưa cập nhật tiểu sử."}
                                      </p>
                                    </div>

                                    {/* --- SKILLS & INTERESTS (Thay thế cho Status cũ) --- */}
                                    <div className="row g-3">
                                      {/* Cột Kỹ năng */}
                                      <div className="col-12">
                                        <h6 className="fw-bold text-uppercase text-secondary fs-7 mb-2">
                                          Kỹ năng
                                        </h6>
                                        <div className="d-flex flex-wrap gap-2">
                                          {otherUser.profile?.skills &&
                                          otherUser.profile?.skills.length >
                                            0 ? (
                                            otherUser.profile?.skills.map(
                                              (skill, index) => (
                                                <span
                                                  key={index}
                                                  className="badge bg-soft-primary text-primary border border-primary-subtle rounded-pill fw-normal px-3 py-2"
                                                >
                                                  {skill}
                                                </span>
                                              )
                                            )
                                          ) : (
                                            <span className="text-muted small fst-italic">
                                              Chưa cập nhật
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Cột Sở thích */}
                                      <div className="col-12">
                                        <h6 className="fw-bold text-uppercase text-secondary fs-7 mb-2">
                                          Sở thích
                                        </h6>
                                        <div className="d-flex flex-wrap gap-2">
                                          {otherUser.profile?.interests &&
                                          otherUser.profile?.interests.length >
                                            0 ? (
                                            otherUser.profile?.interests.map(
                                              (interest, index) => (
                                                <span
                                                  key={index}
                                                  className="badge bg-light text-dark border rounded-pill fw-normal px-3 py-2"
                                                >
                                                  # {interest}
                                                </span>
                                              )
                                            )
                                          ) : (
                                            <span className="text-muted small fst-italic">
                                              Chưa cập nhật
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Modal.Body>
                                  <Modal.Footer className="border-0 justify-content-center pb-4">
                                    <button
                                      type="button"
                                      className="btn btn-light rounded-pill px-4 fw-medium"
                                      onClick={() =>
                                        setShowChatDetailPopup(false)
                                      }
                                    >
                                      Đóng
                                    </button>
                                    <a
                                      className="btn btn-primary rounded-pill px-4 shadow-sm fw-medium"
                                      href={`/profile/${otherUser?._id}`}
                                    >
                                      Xem Trang Cá Nhân{" "}
                                      <i className="ri-arrow-right-line ms-1"></i>
                                    </a>
                                  </Modal.Footer>
                                </Modal>
                                <div className="chat-header-icons d-flex">
                                  <a
                                    onClick={() =>
                                      setShowDeleteConversationConfirm(true)
                                    }
                                    className="chat-icon-delete bg-soft-primary"
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                  </a>
                                  <span className="dropdown bg-soft-primary">
                                    <i
                                      className="ri-more-2-line cursor-pointer dropdown-toggle nav-hide-arrow cursor-pointer pe-0"
                                      id="dropdownMenuButton02"
                                      data-bs-toggle="dropdown"
                                      aria-haspopup="true"
                                      aria-expanded="false"
                                      role="menu"
                                    ></i>
                                    <span
                                      className="dropdown-menu dropdown-menu-end"
                                      aria-labelledby="dropdownMenuButton02"
                                    >
                                      <a
                                        className="dropdown-item"
                                        href="#"
                                        onClick={() =>
                                          handlePinChat(selectedChat._id)
                                        }
                                      >
                                        <i className="ri-pushpin-2-line me-1 h5"></i>
                                        Ghim cuộc trò chuyện
                                      </a>
                                      <a
                                        className="dropdown-item"
                                        href="#"
                                        onClick={() =>
                                          setShowDeleteConversationConfirm(true)
                                        }
                                      >
                                        <i className="ri-delete-bin-6-line me-1 h5"></i>
                                        Xóa cuộc trò chuyện
                                      </a>
                                      {/* {console.log(selectedChat)} */}
                                      {selectedChat.userUnBlock?.length > 0 && (
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={() =>
                                            setShowUnblockConversationConfirm(
                                              true
                                            )
                                          }
                                        >
                                          <i className="ri-earth-line me-1 h5"></i>
                                          Công Khai
                                        </a>
                                      )}
                                    </span>
                                  </span>
                                </div>
                              </header>
                            </div>

                            {/* Hiển thị lời mời mở khóa hộp thoại */}
                            {selectedChat &&
                              selectedChat.userUnBlock?.length > 0 &&
                              selectedChat.userUnBlock.length !==
                                (selectedChat.members ?? []).length && (
                                <div className="reply-preview bg-light p-3 border-bottom rounded shadow-sm">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <p className="text-muted">
                                        {selectedChat.userUnBlock.includes(
                                          user.id
                                        )
                                          ? "Có thành viên muốn mở khóa hộp thoại. Bạn có đồng ý không?"
                                          : "Đang chờ thành viên khác xác nhận mở khóa..."}
                                      </p>

                                      <div
                                        className="text-truncate mt-1"
                                        style={{ maxWidth: "300px" }}
                                      >
                                        <small></small>
                                      </div>
                                    </div>

                                    <div className="d-flex gap-2">
                                      {/* Nút Đồng ý */}
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success d-flex align-items-center"
                                        onClick={() => {
                                          console.log(
                                            "selectedChat: ",
                                            selectedChat
                                          );
                                          handleSubmitUnBlock(selectedChat._id);
                                        }}
                                        title="Đồng ý mở khóa"
                                      >
                                        <i className="ri-check-line"></i>
                                      </button>

                                      {/* Nút Từ chối */}
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger d-flex align-items-center"
                                        onClick={handleCancelReply}
                                        title="Từ chối mở khóa"
                                      >
                                        <i className="ri-close-line"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Danh sách tin nhắn */}
                            <div
                              ref={messagesContainerRef}
                              className="chat-content scroller"
                            >
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
                              {hasMoreMessages && !loadingMore && (
                                <div className="text-center py-2">
                                  <small className="text-muted">
                                    Cuộn lên để xem tin nhắn cũ hơn
                                  </small>
                                </div>
                              )}

                              {messages.map((message, index) => (
                                <div
                                  key={message._id || index}
                                  className={`chat ${
                                    message.sender?._id === user.id
                                      ? "d-flex other-user"
                                      : "chat-left"
                                  }`}
                                  onDoubleClick={(e) =>
                                    handleMessageDoubleClick(message._id, e)
                                  }
                                >
                                  <div className="chat-user">
                                    <a className="avatar m-0">
                                      {message.sender?._id === user.id ? (
                                        <img
                                          src={
                                            user.profile?.avatar ||
                                            "/assets/images/default-avatar.png"
                                          }
                                          alt="avatar"
                                          className="avatar-35 rounded-circle w-100"
                                        />
                                      ) : (
                                        <img
                                          src={
                                            message.sender?.profile?.avatar ||
                                            "/assets/images/default-avatar.png"
                                          }
                                          alt="avatar"
                                          className="avatar-35 rounded-circle w-100"
                                        />
                                      )}
                                    </a>
                                    <span className="chat-time mt-1">
                                      {formatTime(message.createdAt)}
                                    </span>
                                  </div>
                                  <div className="chat-detail">
                                    <div className="chat-message position-relative">
                                      {/* Menu tin nhắn */}

                                      {showMessageMenu === message._id && (
                                        <div
                                          className="message-menu position-absolute bg-white shadow rounded p-2"
                                          style={{
                                            zIndex: 100,
                                            top: "-10px",
                                            right:
                                              message.sender?._id === user.id
                                                ? "0"
                                                : "auto",
                                            left:
                                              message.sender?._id === user.id
                                                ? "auto"
                                                : "0",
                                          }}
                                        >
                                          <button
                                            className="btn btn-sm btn-outline-primary me-1"
                                            onClick={() =>
                                              handleReplyMessage(message)
                                            }
                                          >
                                            <i className="ri-reply-line"></i>
                                          </button>

                                          {/* Ai cũng có thể xoá (chỉ mình không thấy) */}
                                          <button
                                            className="btn btn-sm btn-outline-warning me-1"
                                            onClick={() =>
                                              setShowDeleteConfirm(message._id)
                                            }
                                          >
                                            <i className="ri-delete-bin-line"></i>
                                          </button>
                                          <TextReaderAdvanced
                                            text={message.content || "Khác"}
                                            height={25}
                                          />

                                          {/* Chỉ người gửi mới được thu hồi */}
                                          {message.sender?._id === user.id && (
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              onClick={() =>
                                                setShowRecallConfirm(
                                                  message._id
                                                )
                                              }
                                            >
                                              <i className="ri-time-line"></i>
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {/* Hiển thị tin nhắn được trả lời (repliedTo) */}

                                      {message.repliedTo && (
                                        <div className="reply-preview mb-2 p-2 bg-light rounded border-start border-3 border-primary">
                                          <div className="d-flex align-items-center">
                                            <i className="ri-reply-line text-primary me-2"></i>
                                            <div className="flex-grow-1">
                                              {/* Kiểm tra nếu tin nhắn đã bị xoá */}
                                              {message.repliedTo.isDeleted ? (
                                                <>
                                                  <small className="text-muted fw-bold">
                                                    Tin nhắn đã thu hồi
                                                  </small>
                                                  <div
                                                    className="text-truncate small"
                                                    style={{
                                                      maxWidth: "200px",
                                                    }}
                                                  >
                                                    <span className="text-muted fst-italic">
                                                      Tin nhắn đã bị xoá
                                                    </span>
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  <small className="text-muted fw-bold">
                                                    {message.repliedTo.sender
                                                      ?._id === user.id
                                                      ? "Bạn"
                                                      : truncateName(
                                                          message.repliedTo
                                                            .sender?.fullName ||
                                                            "Người dùng",
                                                          15
                                                        )}
                                                  </small>
                                                  <div
                                                    className="text-truncate small"
                                                    style={{
                                                      maxWidth: "200px",
                                                    }}
                                                  >
                                                    {message.repliedTo
                                                      .content ? (
                                                      <span className="text-dark">
                                                        {truncateName(
                                                          message.repliedTo
                                                            .content,
                                                          30
                                                        )}
                                                      </span>
                                                    ) : message.repliedTo
                                                        .fileUrl ? (
                                                      <span className="text-muted">
                                                        {message.repliedTo
                                                          .messageType ===
                                                        "image"
                                                          ? "📷 Hình ảnh"
                                                          : message.repliedTo
                                                              .messageType ===
                                                            "video"
                                                          ? "🎬 Video"
                                                          : message.repliedTo
                                                              .messageType ===
                                                            "audio"
                                                          ? "🎵 Audio"
                                                          : "📎 File"}
                                                        {message.repliedTo
                                                          .fileName &&
                                                          ` - ${truncateName(
                                                            message.repliedTo
                                                              .fileName,
                                                            15
                                                          )}`}
                                                      </span>
                                                    ) : (
                                                      <span className="text-muted">
                                                        Tin nhắn
                                                      </span>
                                                    )}
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Hiển thị file/image/video/audio */}
                                      {message.fileUrl && (
                                        <div className="mb-2">
                                          {message.messageType === "image" ? (
                                            <div className="text-center">
                                              <img
                                                src={message.fileUrl}
                                                alt={
                                                  message.fileName || "Image"
                                                }
                                                className="img-fluid rounded cursor-pointer w-100"
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
                                                Trình duyệt của bạn không hỗ trợ
                                                video.
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
                                                Trình duyệt của bạn không hỗ trợ
                                                audio.
                                              </audio>
                                            </div>
                                          ) : (
                                            <div className="d-flex align-items-center p-2 bg-dark bg-opacity-10 rounded">
                                              <span className="fs-4 me-2">
                                                {getFileIcon(
                                                  message.messageType
                                                )}
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
                            {/* Hiển thị tin nhắn đang trả lời */}
                            {replyingTo && (
                              <div className="reply-preview bg-light p-2 border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <small className="text-muted">
                                      Đang trả lời{" "}
                                      <strong>
                                        {replyingTo.sender?.fullName}
                                      </strong>
                                    </small>
                                    <div
                                      className="text-truncate"
                                      style={{ maxWidth: "300px" }}
                                    >
                                      <small>
                                        {replyingTo.content ||
                                          (replyingTo.fileUrl
                                            ? replyingTo.messageType === "image"
                                              ? "📷 Hình ảnh"
                                              : replyingTo.messageType ===
                                                "video"
                                              ? "🎬 Video"
                                              : replyingTo.messageType ===
                                                "audio"
                                              ? "🎵 Audio"
                                              : "📎 File"
                                            : "Tin nhắn")}
                                      </small>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={handleCancelReply}
                                  >
                                    <i className="ri-close-line"></i>
                                  </button>
                                </div>
                              </div>
                            )}
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

                                {filePreview &&
                                  selectedFile.type.startsWith("image/") && (
                                    <div className="mt-2 text-center">
                                      <img
                                        src={filePreview}
                                        alt="Preview"
                                        className="img-fluid rounded w-100"
                                        style={{ maxHeight: "150px" }}
                                      />
                                    </div>
                                  )}

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

                            <div className="chat-footer p-3 bg-white">
                              <form
                                className="d-flex align-items-center"
                                onSubmit={handleSendMessage}
                              >
                                <div className="chat-attagement d-flex">
                                  <a href="#" className="pe-3">
                                    <i
                                      className="far fa-smile"
                                      aria-hidden="true"
                                    ></i>
                                  </a>
                                  <button
                                    type="button"
                                    className="btn btn-link text-muted p-0"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                    disabled={isUploading}
                                  >
                                    <i
                                      className="fa fa-paperclip pe-3"
                                      aria-hidden="true"
                                    ></i>
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
                                  id="input_send_message"
                                  value={newMessage}
                                  onChange={(e) =>
                                    setNewMessage(e.target.value)
                                  }
                                  disabled={isUploading}
                                />
                                <SpeechToText
                                  onTextChange={setVoiceNewMessage}
                                />
                                <button
                                  type="submit"
                                  className="btn btn-primary d-flex align-items-center p-2"
                                  disabled={
                                    (!newMessage.trim() && !selectedFile) ||
                                    isUploading
                                  }
                                >
                                  <i
                                    className="far fa-paper-plane"
                                    aria-hidden="true"
                                  ></i>
                                  <span className="d-none d-lg-block ms-1">
                                    Gửi
                                  </span>
                                </button>
                              </form>
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

      {/* Modal xem hình ảnh lớn */}
      {showImageModal && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          tabIndex="-1"
          role="dialog"
          style={{ zIndex: 1050 }}
        >
          <div
            className="modal-dialog  modal-dialog-centered modal-lg"
            role="document"
          >
            <div className="modal-content border-0 bg-transparent">
              <div className="modal-header border-0 justify-content-end p-2">
                <button
                  type="button"
                  className="btn-close btn-close-dark"
                  onClick={closeImageModal}
                  aria-label="Đóng"
                ></button>
              </div>
              <div className="modal-body p-0 d-flex align-items-center justify-content-center">
                {selectedImageUrl && (
                  <img
                    src={selectedImageUrl}
                    alt={selectedImageName || "Hình ảnh"}
                    className="img-fluid rounded w-100"
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

      {/* Modal xác nhận xoá tin nhắn */}
      {showDeleteConfirm && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          tabIndex="-1"
          role="dialog"
          style={{ zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận xoá</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteConfirm(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn xoá tin nhắn này?</p>
                <small className="text-muted">
                  Hành động này không thể hoàn tác.
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteMessage(showDeleteConfirm)}
                >
                  Xoá tin nhắn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal xác nhận xoá tin nhắn */}
      {showDeleteConversationConfirm && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          tabIndex="-1"
          role="dialog"
          style={{ zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận xoá hộp thoại tin nhắn</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteConversationConfirm(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn xoá hộp thoại tin nhắn này?</p>
                <small className="text-muted">
                  Hành động này không thể hoàn tác.
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConversationConfirm(null)}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteConversation(selectedChat._id)}
                >
                  Xoá tin nhắn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* modal xác nhận mở khoá */}
      {showUnblockConversationConfirm && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          tabIndex="-1"
          role="dialog"
          style={{ zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Xác nhận mở khoá hộp thoại tin nhắn
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteConversationConfirm(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn mở khoá hộp thoại tin nhắn này?</p>
                <small className="text-muted">
                  sẽ phải chờ các thành viên đồng ý
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUnblockConversationConfirm(null)}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() =>
                    handleShowUnBlockConversation(selectedChat._id, true)
                  }
                >
                  Mở khoá hộp thoại tin nhắn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal xác nhận thu hồi */}
      {showRecallConfirm && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          tabIndex="-1"
          role="dialog"
          style={{ zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Thu hồi tin nhắn</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRecallConfirm(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn thu hồi tin nhắn này?</p>
                <small className="text-muted">
                  Tin nhắn sẽ bị xoá khỏi cuộc trò chuyện và cả bạn và người kia
                  sẽ không thể xem lại.
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRecallConfirm(null)}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRecallMessage(showRecallConfirm)}
                >
                  Thu hồi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSuccess && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          tabIndex="-1"
          role="dialog"
          style={{ zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Xác nhận xoá hộp thoại Thành công
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => showSuccess(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn xoá hộp thoại tin nhắn này?</p>
                <small className="text-muted">
                  Hành động này không thể hoàn tác.
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => showSuccess(false)}
                >
                  Thành công
                </button>
              </div>
            </div>
          </div>
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

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show m-2 position-fixed top-0 start-50 translate-middle-x"
          role="alert"
          style={{ zIndex: 1060 }}
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={clearError}
          ></button>
        </div>
      )}

      <style>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .message-menu {
          min-width: 80px;
        }
        .reply-preview {
          border-left: 4px solid #007bff;
          background-color: #f8f9fa;
          font-size: 0.875rem;
        }

        .reply-preview .text-truncate {
          max-width: 200px;
        }

        .message-content {
          word-wrap: break-word;
        }

        .chat-message:hover {
          background-color: rgba(0,0,0,0.02);
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default Chat;
