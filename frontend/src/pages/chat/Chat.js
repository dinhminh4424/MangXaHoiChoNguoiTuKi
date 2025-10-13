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
    loadMoreMessages, // Thêm hàm mới để tải thêm tin nhắn
    hasMoreMessages, // Thêm state để kiểm tra còn tin nhắn không
    loadingMore, // Thêm state loading khi tải thêm
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

    // Tính toán vị trí scroll
    const scrollPosition = (scrollTop / (scrollHeight - clientHeight)) * 100;

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
                  className="btn-close btn-close-white "
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
                    <small>{selectedImageName}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row h-100">
        {/* Sidebar */}
        <div className="col-md-3 bg-light border-end">
          <div className="d-flex flex-column h-100">
            {/* Header */}
            <div className="p-3 border-bottom bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Chat</h5>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary btn-sm dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    {user.fullName}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
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
            </div>

            {/* Conversations */}
            {conversations.length > 0 ? (
              <div className="flex-grow-1 overflow-auto">
                <div className="list-group list-group-flush">
                  {conversations.map((conv) => (
                    <button
                      key={conv._id}
                      className={`list-group-item list-group-item-action ${
                        selectedChat?._id === conv._id ? "active" : ""
                      }`}
                      onClick={() => selectChat(conv)}
                    >
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                            style={{ width: "40px", height: "40px" }}
                          >
                            {conv.members?.[0]?.fullName?.charAt(0) || "U"}
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                              {conv.isGroup
                                ? conv.name
                                : conv.members?.find((m) => m._id !== user.id)
                                    ?.fullName || "Unknown User"}
                            </h6>
                          </div>
                          <small className="text-muted text-truncate">
                            {conv.lastMessage?.content || "Chưa có tin nhắn"}
                            {conv.lastMessage?.file && " 📎"}
                          </small>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted p-3">
                Không có cuộc trò chuyện nào!!! bạn có thể chọn ngẫu nhiên.
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-md-9 d-flex flex-column">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-bottom bg-white">
                <div className="d-flex align-items-center">
                  {selectedChat.isGroup === true ? (
                    <>
                      <div
                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white me-3"
                        style={{ width: "45px", height: "45px" }}
                      >
                        {selectedChat.fullName?.charAt(0) || "M"}
                      </div>
                      <div>
                        <h6 className="mb-0">{selectedChat.fullName}</h6>
                        <small className="text-muted">
                          {selectedChat.isOnline
                            ? "Đang hoạt động"
                            : "Hội Nhóm"}{" "}
                        </small>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white me-3"
                        style={{ width: "45px", height: "45px" }}
                      >
                        {otherUser?.fullName?.charAt(0) || "M"}
                      </div>
                      <div>
                        <h6 className="mb-0">{otherUser?.fullName}</h6>
                        <small className="text-muted">
                          {selectedChat.isOnline
                            ? "Đang hoạt động"
                            : "Ngoại tuyến"}{" "}
                        </small>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Messages Container với Infinite Scroll */}
              <div
                ref={messagesContainerRef}
                className="flex-grow-1 p-3 overflow-auto bg-light position-relative"
                style={{
                  minHeight: 0,
                  height: "400px", // THÊM fixed height để đảm bảo scroll
                  border: "1px solid #ddd", // THÊM border để thấy rõ container
                }}
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
                    className={`d-flex mb-3 ${
                      message.sender?._id === user.id
                        ? "justify-content-end"
                        : "justify-content-start"
                    }`}
                  >
                    <div
                      className={`rounded p-3 ${
                        message.sender?._id === user.id
                          ? "bg-primary text-white"
                          : "bg-white"
                      }`}
                      style={{ maxWidth: "70%" }}
                    >
                      {/* Hiển thị file/image/video/audio nếu có */}
                      {message.fileUrl && (
                        <div className="mb-2">
                          {message.messageType === "image" ? (
                            <div className="text-center">
                              <img
                                src={message.fileUrl}
                                alt={message.fileName || "Image"}
                                className="img-fluid rounded cursor-pointer" // THÊM class cursor-pointer cho chỉ báo click
                                style={{ maxHeight: "300px", maxWidth: "100%" }}
                                onClick={
                                  () =>
                                    openImageModal(
                                      message.fileUrl,
                                      message.fileName
                                    ) // SỬA: Mở modal thay vì window.open
                                }
                                role="button"
                              />
                              {message.fileName && (
                                <div className="mt-1 small opacity-75">
                                  {message.fileName}
                                </div>
                              )}
                            </div>
                          ) : message.messageType === "video" ? (
                            <div className="text-center">
                              <video
                                controls
                                className="img-fluid rounded"
                                style={{ maxHeight: "300px", maxWidth: "100%" }}
                              >
                                <source
                                  src={message.fileUrl}
                                  type="video/mp4"
                                />
                                Trình duyệt của bạn không hỗ trợ video.
                              </video>
                              {message.fileName && (
                                <div className="mt-1 small opacity-75">
                                  {message.fileName}
                                </div>
                              )}
                            </div>
                          ) : message.messageType === "audio" ? (
                            <div className="d-flex align-items-center p-2 bg-dark bg-opacity-10 rounded">
                              <span className="fs-4 me-3">
                                {getFileIcon(message.messageType)}
                              </span>
                              <audio controls className="flex-grow-1">
                                <source
                                  src={message.fileUrl}
                                  type="audio/mpeg"
                                />
                                Trình duyệt của bạn không hỗ trợ audio.
                              </audio>
                            </div>
                          ) : (
                            // File documents (PDF, Word, Excel, etc.)
                            <div className="d-flex align-items-center p-2 bg-dark bg-opacity-10 rounded">
                              <span className="fs-4 me-2">
                                {getFileIcon(message.messageType)}
                              </span>
                              <div className="flex-grow-1">
                                <div className="fw-bold small">
                                  {message.fileName || "File"}
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
                                className={`btn btn-sm ${
                                  message.sender?._id === user.id
                                    ? "btn-outline-light"
                                    : "btn-outline-primary"
                                } ms-2`}
                              >
                                Tải xuống
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hiển thị nội dung tin nhắn */}
                      {message.content && (
                        <div className="message-content">{message.content}</div>
                      )}

                      <small
                        className={`opacity-75 ${
                          message.sender?._id === user.id
                            ? "text-white-50"
                            : "text-muted"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </small>
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
                            : selectedFile.type.startsWith("video/")
                            ? "video"
                            : selectedFile.type.startsWith("audio/")
                            ? "audio"
                            : "file"
                        )}
                      </span>
                      <div>
                        <div className="fw-bold">{selectedFile.name}</div>
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

                  {/* Video Preview */}
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

                  <div className="mt-2">
                    <small className="text-muted">
                      File đã sẵn sàng để gửi. Nhấn nút "Gửi" để gửi file.
                    </small>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 border-top bg-white">
                <form onSubmit={handleSendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={
                        selectedFile
                          ? "Nhập tin nhắn kèm file (tuỳ chọn)..."
                          : "Nhập tin nhắn..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isUploading}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                      style={{ display: "none" }}
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      title="Chọn file"
                      disabled={isUploading}
                    >
                      <i className="fa-solid fa-file-image"></i>
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        (!newMessage.trim() && !selectedFile) || isUploading
                      }
                    >
                      {isUploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang gửi...
                        </>
                      ) : (
                        "Gửi"
                      )}
                    </button>
                  </div>
                  <div className="mt-2 small text-muted">
                    💡 Chọn file để gửi (tối đa 10MB)
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center text-muted">
                <h4>Chào mừng đến với Autism Support Network</h4>
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* THÊM: CSS cho cursor pointer (nếu chưa có Bootstrap CSS hỗ trợ) */}
      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .cursor-pointer:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default Chat;
