import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";

import api from "../services/api";

import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  // những thành phần sẽ thay đổi và các hàm xử lý logic
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]); // Danh sách cuộc trò chuyện
  const [selectedChat, setSelectedChat] = useState(null); // Cuộc trò chuyện hiện tại
  const [messages, setMessages] = useState([]); // Tin nhắn trong cuộc trò chuyện hiện tại
  const [users, setUsers] = useState([]); // Danh sách người dùng (để bắt đầu cuộc trò chuyện mới)
  const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu
  const [error, setError] = useState(null); // Lỗi chung

  // State cho infinite scroll
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const socketRef = useRef();
  const messagesEndRef = useRef();

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Kết nối socket
  const connectSocket = useCallback(() => {
    if (!user) return;

    socketRef.current = io(API_BASE_URL, {
      auth: {
        userId: user.id,
      },
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to chat server");
      // Join tất cả conversations của user
      socketRef.current.emit("join_chats", user.id);
    });

    socketRef.current.on("receive_message", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      // Cập nhật last message trong conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === newMessage.chatId
            ? { ...conv, lastMessage: newMessage }
            : conv
        )
      );
    });

    socketRef.current.on("message_read_update", (data) => {
      // Xử lý khi tin nhắn được đọc
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, isReadBy: [...msg.isReadBy, data.readBy] }
            : msg
        )
      );
    });

    socketRef.current.on("user_typing", (data) => {
      // Xử lý typing indicator
      console.log("User typing:", data);
    });

    socketRef.current.on("error", (error) => {
      setError(error.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Hàm tải thêm tin nhắn cũ
  const loadMoreMessages = async (chatId) => {
    if (loadingMore || !hasMoreMessages || !chatId) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await api.get(`/api/chat/${chatId}/messages`, {
        params: { page: nextPage, limit: 10 },
      });

      const { messages: newMessages, pagination } = response.data.data;

      if (newMessages.length > 0) {
        // Thêm tin nhắn cũ vào đầu danh sách
        setMessages((prev) => [...newMessages, ...prev]);
        setCurrentPage(nextPage);
        setHasMoreMessages(pagination.hasNext);

        console.log(
          `✅ Đã tải thêm ${newMessages.length} tin nhắn, trang ${nextPage}`
        );
      } else {
        setHasMoreMessages(false);
        console.log("ℹ️ Đã tải hết tin nhắn cũ");
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải thêm tin nhắn:", error);
      console.error("Chi tiết lỗi:", error.response?.data);
      setError("Không thể tải thêm tin nhắn");
    } finally {
      setLoadingMore(false);
    }
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/chat/conversations");
      setConversations(response.data.data);
      setError(null);
    } catch (error) {
      console.error("Lỗi khi tải hội thoại:", error);
      setError("Không thể tải danh sách hội thoại");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users
  const loadUsers = useCallback(async (search = "") => {
    try {
      const response = await api.get(`/api/users?search=${search}`);
      setUsers(response.data.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách user:", error);
      setError("Không thể tải danh sách người dùng");
    }
  }, []);

  // Select chat - ĐÃ SỬA để hỗ trợ phân trang
  const selectChat = useCallback(async (chat) => {
    if (!chat || !chat._id) return;

    // Reset state khi chọn chat mới
    setSelectedChat(chat);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(true);
    setLoadingMore(false);

    try {
      console.log(`Đang tải tin nhắn đầu tiên cho chat ${chat._id}`);

      // Gọi API với phân trang
      const response = await api.get(`/api/chat/${chat._id}/messages`, {
        params: { page: 1, limit: 10 },
      });

      const { messages: newMessages, pagination } = response.data.data;
      setMessages(newMessages);
      setHasMoreMessages(pagination.hasNext);

      // Join room chat với socket
      if (socketRef.current) {
        socketRef.current.emit("join_chat", chat._id);
      }

      // Đánh dấu tin nhắn đã đọc
      await api.put(`/api/chat/${chat._id}/messages/read`);

      console.log(`Đã tải ${newMessages.length} tin nhắn đầu tiên`);
    } catch (error) {
      console.error("❌ Lỗi khi tải lịch sử chat:", error);
      console.error("Chi tiết lỗi:", error.response?.data);
      setError("Không thể tải tin nhắn");
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content, chatId = null) => {
      if (!content.trim()) return;

      const targetChatId = chatId || selectedChat?._id;
      if (!targetChatId) {
        setError("Không có cuộc trò chuyện được chọn");
        return;
      }

      try {
        const messageData = {
          chatId: targetChatId,
          content: content.trim(),
          sender: user,
        };

        // Gửi qua Socket.io — server sẽ lưu và phản hồi lại
        if (socketRef.current) {
          socketRef.current.emit("send_message", messageData);
        }

        return { success: true };
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        setError("Không thể gửi tin nhắn");
        return { success: false, error: error.message };
      }
    },
    [selectedChat, user]
  );

  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || "Upload thất bại");
      }
    } catch (error) {
      console.error("Upload file error:", error);
      return null;
    }
  };

  // Gửi file tin nhắn
  // const sendFileMessage = async (file, content = "") => {
  //   if (!selectedChat) {
  //     setError("Vui lòng chọn cuộc trò chuyện");
  //     return { success: false, error: "No chat selected" };
  //   }

  //   try {
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     formData.append("chatId", selectedChat._id);
  //     formData.append("content", content || "");

  //     const response = await api.post("/api/upload", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     console.log("Upload response:", response.data);

  //     if (response.data.success) {
  //       const savedMessage = response.data.savedMessage;

  //       // Tạo message object theo schema mới
  //       const fileMessage = {
  //         _id: savedMessage._id,
  //         content: savedMessage.content,
  //         sender: {
  //           _id: savedMessage.sender._id,
  //           fullName: savedMessage.sender.fullName,
  //         },
  //         messageType: savedMessage.messageType,
  //         fileUrl: savedMessage.fileUrl,
  //         fileName: savedMessage.fileName,
  //         fileSize: savedMessage.fileSize,
  //         createdAt: savedMessage.createdAt,
  //         chatId: savedMessage.chatId,
  //       };

  //       // Cập nhật state
  //       setMessages((prev) => [...prev, fileMessage]);

  //       // Cập nhật conversations
  //       setConversations((prev) =>
  //         prev.map((conv) =>
  //           conv._id === selectedChat._id
  //             ? { ...conv, lastMessage: fileMessage }
  //             : conv
  //         )
  //       );

  //       // Gửi qua socket để real-time
  //       if (socketRef.current) {
  //         socketRef.current.emit("send_message", fileMessage);
  //       }

  //       return { success: true, message: fileMessage };
  //     } else {
  //       throw new Error(response.data.error || "Gửi file thất bại");
  //     }
  //   } catch (error) {
  //     console.error("Error sending file:", error);
  //     const errorMessage = error.response?.data?.error || error.message;
  //     setError(errorMessage);
  //     return { success: false, error: errorMessage };
  //   }
  // };

  const sendFileMessage = async (file, content = "") => {
    if (!selectedChat) {
      setError("Vui lòng chọn cuộc trò chuyện");
      return { success: false, error: "No chat selected" };
    }

    try {
      // Bước 1: Upload file riêng để lấy URL
      const uploadResult = await uploadFile(file);
      if (!uploadResult.success) {
        setError("Không có cuộc trò chuyện được chọn");
        return;
      }

      // Bước 2: Tự tính messageType từ file.type
      let messageType = "file"; // Default
      if (file.type.startsWith("image/")) {
        messageType = "image";
      } else if (file.type.startsWith("video/")) {
        messageType = "video";
      } else if (file.type.startsWith("audio/")) {
        messageType = "audio";
      }

      // Bước 3: Tạo message object
      const fileMessage = {
        chatId: selectedChat._id,
        content: content.trim(),
        sender: user,
        messageType, // Tự tính ở đây
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
      };

      // Bước 4: Gửi qua socket
      if (socketRef.current) {
        socketRef.current.emit("send_message", fileMessage);
      }

      // Cập nhật state local
      setMessages((prev) => [...prev, fileMessage]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === selectedChat._id
            ? { ...conv, lastMessage: fileMessage }
            : conv
        )
      );

      return { success: true, message: fileMessage };
    } catch (error) {
      console.error("Error sending file:", error);
      const errorMessage = error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Create new conversation
  const createConversation = useCallback(
    async (memberIds, isGroup = false, groupName = null) => {
      try {
        const response = await api.post("/api/chat/conversation", {
          members: memberIds,
          isGroup,
          name: groupName,
        });

        const newConversation = response.data.data;
        setConversations((prev) => [newConversation, ...prev]);

        return { success: true, conversation: newConversation };
      } catch (error) {
        console.error("Lỗi khi tạo cuộc trò chuyện:", error);
        setError("Không thể tạo cuộc trò chuyện");
        return { success: false, error: error.message };
      }
    },
    []
  );

  // Start conversation với user mới
  const startConversation = useCallback(
    async (otherUserId) => {
      try {
        const result = await createConversation([otherUserId], false);
        if (result.success) {
          await selectChat(result.conversation);
        }
        return result;
      } catch (error) {
        console.error("Lỗi khi bắt đầu cuộc trò chuyện:", error);
        return { success: false, error: error.message };
      }
    },
    [createConversation, selectChat]
  );

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (chatId) => {
    try {
      await api.put(`/api/chat/${chatId}/messages/read`);
    } catch (error) {
      console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
    }
  }, []);

  // Typing indicators
  const startTyping = useCallback(
    (chatId) => {
      if (socketRef.current) {
        socketRef.current.emit("typing_start", { chatId, userId: user.id });
      }
    },
    [user]
  );

  const stopTyping = useCallback(
    (chatId) => {
      if (socketRef.current) {
        socketRef.current.emit("typing_stop", { chatId, userId: user.id });
      }
    },
    [user]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Context value
  const value = {
    // State
    conversations,
    selectedChat,
    messages,
    users,
    loading,
    error,
    hasMoreMessages,
    loadingMore,

    // Refs
    messagesEndRef,

    // Actions
    connectSocket,
    loadConversations,
    loadUsers,
    selectChat,
    sendMessage,
    sendFileMessage,
    createConversation,
    startConversation,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    clearError,
    scrollToBottom,
    loadMoreMessages,

    // Setters (nếu cần)
    setSelectedChat,
    setMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
