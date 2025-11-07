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

    // socketRef.current.on("receive_message", (newMessage) => {
    //   setMessages((prev) => {
    //     // Kiểm tra xem tin nhắn đã tồn tại chưa
    //     const isDuplicate = prev.some(
    //       (msg) =>
    //         msg._id === newMessage._id ||
    //         (msg.tempId && msg.tempId === newMessage.tempId)
    //     );

    //     if (isDuplicate) {
    //       console.log("Tin nhắn trùng lặp đã được bỏ qua:", newMessage._id);
    //       return prev;
    //     }

    //     return [...prev, newMessage];
    //   });

    //   // Cập nhật last message trong conversations
    //   setConversations((prev) =>
    //     prev.map((conv) =>
    //       conv._id === newMessage.chatId
    //         ? { ...conv, lastMessage: newMessage }
    //         : conv
    //     )
    //   );
    // });
    socketRef.current.on("receive_message", (data) => {
      const incomingMessage = data?.message;
      const incomingChat = data?.chat;
      const chatId = incomingChat?._id || incomingMessage?.chatId;

      if (!incomingMessage || !chatId) {
        console.warn("receive_message missing", data);
        return;
      }

      // 1) Messages: dedupe và push
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            String(m?._id) === String(incomingMessage._id) ||
            (m?.tempId &&
              incomingMessage?.tempId &&
              m.tempId === incomingMessage.tempId)
        );
        if (exists) return prev;
        return [...prev, incomingMessage];
      });

      // 2) Conversations: cập nhật đúng, tránh duplicate
      setConversations((prev) => {
        const list = Array.isArray(prev) ? prev.slice() : [];

        // Remove any existing conversation with same id (avoid duplicates)
        const filtered = list.filter((c) => String(c?._id) !== String(chatId));

        // If incomingChat provided by server, use it; otherwise derive minimal object
        const chatToInsert = incomingChat
          ? { ...incomingChat, lastMessage: incomingMessage }
          : { _id: chatId, lastMessage: incomingMessage };

        // Insert at front (move-to-top behavior). If you want keep order, modify accordingly.
        return [chatToInsert, ...filtered];
      });
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
        setMessages((prev) => {
          // Lọc bỏ tin nhắn trùng lặp
          const existingIds = new Set(prev.map((msg) => msg._id));
          const uniqueNewMessages = newMessages.filter(
            (msg) => !existingIds.has(msg._id)
          );

          return [...uniqueNewMessages, ...prev];
        });
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
      // console.log("tinnhan: ", response.data.data.messages);
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
    async (content, chatId = null, repliedTo = null) => {
      console.log("content: ", content);

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
          repliedTo: repliedTo || null,
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

  const sendFileMessage = async (file, content = "", repliedTo = "") => {
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
        repliedTo: repliedTo || null,
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

        if (response.data.success) {
          const newConversation = response.data.data;
          if (!response.data.isExisting) {
            setConversations((prev) => [newConversation, ...prev]);
          }
          return { success: true, conversation: newConversation };
        }
      } catch (error) {
        console.error("Lỗi khi tạo cuộc trò chuyện:", error);
        setError("Không thể tạo cuộc trò chuyện");
        return { success: false, error: error.message };
      }
    },
    []
  );

  // Trong ChatContext.js - sửa hàm startConversation
  const startConversation = useCallback(
    async (otherUserId) => {
      try {
        console.log("🚀 Bắt đầu conversation với:", otherUserId);
        console.log("👤 User hiện tại:", user.id);

        const result = await createConversation([otherUserId], false);

        console.log("📋 Kết quả createConversation:", {
          success: result.success,
          isExisting: result.isExisting,
          conversationId: result.conversation?._id,
        });

        if (result.success) {
          await selectChat(result.conversation);
        }
        return result;
      } catch (error) {
        console.error("❌ Lỗi khi bắt đầu cuộc trò chuyện:", error);
        return { success: false, error: error.message };
      }
    },
    [createConversation, selectChat, user]
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

  // Trong ChatContext, thêm 2 hàm
  const deleteMessage = useCallback(
    async (messageId) => {
      try {
        const response = await api.delete(`/api/chat/messages/${messageId}`);

        if (response.data.success) {
          // Cập nhật state - xoá tin nhắn khỏi danh sách
          setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

          // Cập nhật lastMessage trong conversations
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.lastMessage?._id === messageId) {
                // Tìm tin nhắn mới nhất khác
                const otherMessages = messages.filter(
                  (msg) => msg.chatId === conv._id && msg._id !== messageId
                );
                return {
                  ...conv,
                  lastMessage: otherMessages[otherMessages.length - 1] || null,
                };
              }
              return conv;
            })
          );

          return { success: true };
        }
      } catch (error) {
        console.error("Lỗi khi xoá tin nhắn:", error);
        setError("Không thể xoá tin nhắn");
        return { success: false, error: error.message };
      }
    },
    [messages]
  );

  const recallMessage = useCallback(
    async (messageId) => {
      try {
        const response = await api.post(
          `/api/chat/messages/${messageId}/recall`
        );

        if (response.data.success) {
          // Cập nhật state - đánh dấu tin nhắn đã thu hồi
          setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

          // Cập nhật lastMessage trong conversations
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.lastMessage?._id === messageId) {
                // Tìm tin nhắn mới nhất khác
                const otherMessages = messages.filter(
                  (msg) => msg.chatId === conv._id && msg._id !== messageId
                );
                return {
                  ...conv,
                  lastMessage: otherMessages[otherMessages.length - 1] || null,
                };
              }
              return conv;
            })
          );

          return { success: true };
        }
      } catch (error) {
        console.error("Lỗi khi thu hồi tin nhắn:", error);
        setError("Không thể thu hồi tin nhắn");
        return { success: false, error: error.message };
      }
    },
    [messages]
  );

  // Hàm trả lời tin nhắn (nếu cần logic phức tạp hơn)
  const replyToMessage = useCallback(
    async (messageId, replyContent) => {
      // Logic để gửi tin nhắn trả lời
      // Có thể thêm field parentMessageId vào message schema
      return await sendMessage(replyContent);
    },
    [sendMessage]
  );

  const deleteConversation = async (chatId) => {
    try {
      const res = await api.delete(`/api/chat/conversation/${chatId}`);
      if (res?.data.success) {
        console.log("THÀNH CÔNG");
        setConversations((prev) => prev.filter((conv) => conv._id !== chatId));
        setSelectedChat(null);
      }
      return res.data;
    } catch (err) {
      console.error("Error loading more messages:", err);
      setError("Không thể xoá hộp thoại này: ", err.toString());
    }
  };

  const pinConversation = async (chatId) => {
    try {
      const res = await api.put(`/api/chat/${chatId}/pin`);
      if (res?.data?.success) {
        const updatedChat = res.data.chat;
        setConversations((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          // loại mọi conversation cùng id (nếu có)
          const filtered = list.filter(
            (c) => String(c._id) !== String(updatedChat._id)
          );
          // thêm updatedChat lên đầu (hoặc cuối tuỳ bạn)
          return [updatedChat, ...filtered];
        });
      }
      return res.data;
    } catch (err) {
      console.error("Error loading more messages:", err);
      setError("Không thể Ghim hộp thoại này: ", err.toString());
    }
  };

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
    deleteMessage,
    recallMessage,
    replyToMessage,
    deleteConversation,
    pinConversation,

    // Setters (nếu cần)
    setSelectedChat,
    setMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
////////////////////////////////////////////////////////
// src/contexts/ChatContext.jsx
// import React, {
//   createContext,
//   useState,
//   useContext,
//   useRef,
//   useCallback,
//   useEffect,
// } from "react";

// import api from "../services/api";

// import io from "socket.io-client";
// import { useAuth } from "./AuthContext";

// const ChatContext = createContext();

// export const useChat = () => {
//   const context = useContext(ChatContext);
//   if (!context) {
//     throw new Error("useChat must be used within a ChatProvider");
//   }
//   return context;
// };

// export const ChatProvider = ({ children }) => {
//   // Auth
//   const { user } = useAuth(); // useAuth nên lưu user cơ bản; token lấy từ user.token hoặc localStorage

//   // States
//   const [conversations, setConversations] = useState([]);
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Pagination/infinite scroll
//   const [hasMoreMessages, setHasMoreMessages] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);

//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

//   // Utility: get token (from useAuth or localStorage)
//   const getToken = useCallback(() => {
//     // adjust according to your useAuth implementation
//     const maybeToken =
//       (user && (user.token || user.accessToken)) ||
//       localStorage.getItem("token");
//     return maybeToken;
//   }, [user]);

//   // Connect socket with token in handshake
//   const connectSocket = useCallback(() => {
//     const token = getToken();
//     if (!token) {
//       console.warn("No token found — socket will not connect");
//       return;
//     }

//     // If already connected, don't reconnect
//     if (socketRef.current && socketRef.current.connected) return;

//     socketRef.current = io(API_BASE_URL, {
//       auth: { token: `Bearer ${token}` }, // send token for server to decode
//       transports: ["websocket", "polling"],
//       reconnectionAttempts: 5,
//     });

//     // Handlers
//     socketRef.current.on("connect", () => {
//       console.log("✅ Connected to chat server", socketRef.current.id);
//       // Ask server to join user's chats; server will use socket.userId from token
//       socketRef.current.emit("join_chats");
//     });

//     socketRef.current.on("receive_message", (newMessage) => {
//       setMessages((prev) => {
//         // Dedupe by _id or tempId
//         const exists = prev.some(
//           (m) =>
//             (m._id && newMessage._id && m._id === newMessage._id) ||
//             (m.tempId && newMessage.tempId && m.tempId === newMessage.tempId)
//         );
//         if (exists) return prev;

//         return [...prev, newMessage];
//       });

//       // Update conversation's lastMessage
//       setConversations((prev) =>
//         prev.map((conv) =>
//           conv._id === newMessage.chatId
//             ? { ...conv, lastMessage: newMessage }
//             : conv
//         )
//       );
//     });

//     socketRef.current.on("message_read_update", (data) => {
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg._id === data.messageId
//             ? {
//                 ...msg,
//                 isReadBy: Array.from(
//                   new Set([...(msg.isReadBy || []), data.readBy])
//                 ),
//               }
//             : msg
//         )
//       );
//     });

//     socketRef.current.on("message_deleted", (data) => {
//       const { messageId, deletedBy } = data || {};
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg._id === messageId
//             ? {
//                 ...msg,
//                 content:
//                   deletedBy === (user?.id || user?.userId)
//                     ? null
//                     : "Tin nhắn đã được thu hồi",
//                 fileUrl: null,
//                 isDeleted: true,
//               }
//             : msg
//         )
//       );
//     });

//     socketRef.current.on("message_recalled", (data) => {
//       const { messageId } = data || {};
//       setMessages((prev) => prev.filter((m) => m._id !== messageId));
//     });

//     socketRef.current.on("user_typing", (data) => {
//       // Implement typing indicators in UI using this event
//       console.log("User typing event:", data);
//     });

//     socketRef.current.on("error", (err) => {
//       console.error("Socket error:", err);
//       setError(err?.message || err);
//     });

//     socketRef.current.on("disconnect", (reason) => {
//       console.log("Socket disconnected:", reason);
//     });

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//     };
//   }, [API_BASE_URL, getToken, user]);

//   // Auto (re)connect when user changes / login
//   useEffect(() => {
//     if (!user) {
//       // ensure disconnect when no user
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//       return;
//     }
//     const cleanup = connectSocket();
//     // cleanup on unmount or user change
//     return cleanup;
//   }, [user, connectSocket]);

//   // Load more messages (pagination)
//   const loadMoreMessages = async (chatId) => {
//     if (loadingMore || !hasMoreMessages || !chatId) return;
//     setLoadingMore(true);
//     try {
//       const nextPage = currentPage + 1;
//       const response = await api.get(`/api/chat/${chatId}/messages`, {
//         params: { page: nextPage, limit: 10 },
//       });
//       const { messages: newMessages, pagination } = response.data.data || {
//         messages: [],
//         pagination: { hasNext: false },
//       };

//       if (newMessages && newMessages.length > 0) {
//         setMessages((prev) => {
//           const existingIds = new Set(prev.map((m) => m._id));
//           const unique = newMessages.filter((m) => !existingIds.has(m._id));
//           return [...unique, ...prev];
//         });
//         setCurrentPage(nextPage);
//         setHasMoreMessages(pagination.hasNext);
//       } else {
//         setHasMoreMessages(false);
//       }
//     } catch (err) {
//       console.error("Error loading more messages:", err);
//       setError("Không thể tải thêm tin nhắn");
//     } finally {
//       setLoadingMore(false);
//     }
//   };

//   // Load conversations
//   const loadConversations = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/api/chat/conversations");
//       setConversations(res.data.data || []);
//       setError(null);
//     } catch (err) {
//       console.error("Error loading conversations:", err);
//       setError("Không thể tải danh sách hội thoại");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Load users (for starting conv)
//   const loadUsers = useCallback(async (search = "") => {
//     try {
//       const res = await api.get(
//         `/api/users?search=${encodeURIComponent(search)}`
//       );
//       setUsers(res.data.data || []);
//     } catch (err) {
//       console.error("Error loading users:", err);
//       setError("Không thể tải danh sách người dùng");
//     }
//   }, []);

//   // Select chat and load first page messages
//   const selectChat = useCallback(async (chat) => {
//     if (!chat || !chat._id) return;
//     setSelectedChat(chat);
//     setMessages([]);
//     setCurrentPage(1);
//     setHasMoreMessages(true);
//     setLoadingMore(false);

//     try {
//       const res = await api.get(`/api/chat/${chat._id}/messages`, {
//         params: { page: 1, limit: 10 },
//       });
//       const { messages: newMessages, pagination } = res.data.data || {
//         messages: [],
//         pagination: { hasNext: false },
//       };
//       setMessages(newMessages || []);
//       setHasMoreMessages(pagination.hasNext);

//       // join socket room for this chat
//       if (socketRef.current && socketRef.current.connected) {
//         socketRef.current.emit("join_chat", chat._id);
//       }

//       // mark read
//       await api.put(`/api/chat/${chat._id}/messages/read`);
//     } catch (err) {
//       console.error("Error selecting chat:", err);
//       setError("Không thể tải tin nhắn");
//     }
//   }, []);

//   // Send message (no sender field sent; server will take socket.userId)
//   const sendMessage = useCallback(
//     async (content, chatId = null, repliedTo = null) => {
//       if (!content || !content.toString().trim())
//         return { success: false, error: "Empty message" };

//       const targetChatId = chatId || selectedChat?._id;
//       if (!targetChatId) {
//         setError("Không có cuộc trò chuyện được chọn");
//         return { success: false, error: "No chat selected" };
//       }

//       // ✅ Khai báo tempId ở đây để scope toàn hàm
//       let tempId = null;

//       try {
//         // tạo tin nhắn tạm (optimistic UI)
//         tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

//         const optimisticMessage = {
//           tempId,
//           chatId: targetChatId,
//           content: content.trim(),
//           messageType: "text",
//           sender: { _id: user?.id || user?.userId, username: user?.username },
//           createdAt: new Date().toISOString(),
//           isPending: true,
//           repliedTo: repliedTo || null,
//         };

//         setMessages((prev) => [...prev, optimisticMessage]);

//         const payload = {
//           chatId: targetChatId,
//           content: content.trim(),
//           repliedTo,
//         };

//         if (socketRef.current && socketRef.current.connected) {
//           socketRef.current.emit("send_message", payload);
//         } else {
//           const token = getToken();
//           await api.post(`/api/chat/${targetChatId}/messages`, payload, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//         }

//         return { success: true };
//       } catch (err) {
//         console.error("Error sending message:", err);
//         setError("Không thể gửi tin nhắn");

//         // ✅ tempId vẫn còn, không lỗi nữa
//         if (tempId) {
//           setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
//         }

//         return { success: false, error: err.message };
//       }
//     },
//     [selectedChat, user, getToken]
//   );

//   // Upload file helper
//   const uploadFile = async (file) => {
//     try {
//       const formData = new FormData();
//       formData.append("file", file);
//       const res = await api.post("/api/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       if (res.data.success) return res.data;
//       throw new Error(res.data.error || "Upload failed");
//     } catch (err) {
//       console.error("Upload error:", err);
//       setError("Không thể upload file");
//       return null;
//     }
//   };

//   // Send file message (similar pattern)
//   const sendFileMessage = async (file, content = "", repliedTo = null) => {
//     if (!selectedChat) {
//       setError("Vui lòng chọn cuộc trò chuyện");
//       return { success: false, error: "No chat selected" };
//     }
//     try {
//       const uploadResult = await uploadFile(file);
//       if (!uploadResult || !uploadResult.success) {
//         return { success: false, error: "Upload thất bại" };
//       }

//       const payload = {
//         chatId: selectedChat._id,
//         content: content.trim(),
//         messageType: uploadResult.messageType || "file",
//         fileUrl: uploadResult.fileUrl,
//         fileName: uploadResult.fileName,
//         fileSize: uploadResult.fileSize,
//         repliedTo: repliedTo || null,
//       };

//       // optimistic local message
//       const tempId = `temp-${Date.now()}-${Math.random()
//         .toString(36)
//         .slice(2, 9)}`;
//       const optimisticMessage = {
//         tempId,
//         chatId: selectedChat._id,
//         content: content.trim(),
//         messageType: payload.messageType,
//         fileUrl: payload.fileUrl,
//         fileName: payload.fileName,
//         fileSize: payload.fileSize,
//         sender: {
//           _id: user?.id || user?.userId || null,
//           username: user?.username || user?.name || null,
//         },
//         createdAt: new Date().toISOString(),
//         isPending: true,
//         repliedTo: repliedTo || null,
//       };

//       setMessages((prev) => [...prev, optimisticMessage]);
//       setConversations((prev) =>
//         prev.map((c) =>
//           c._id === selectedChat._id
//             ? { ...c, lastMessage: optimisticMessage }
//             : c
//         )
//       );

//       if (socketRef.current && socketRef.current.connected) {
//         socketRef.current.emit("send_message", payload);
//       } else {
//         const token = getToken();
//         await api.post(`/api/chat/${selectedChat._id}/messages`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       return { success: true, message: optimisticMessage };
//     } catch (err) {
//       console.error("Error sending file message:", err);
//       setError("Không thể gửi file");
//       return { success: false, error: err.message };
//     }
//   };

//   // Create conversation
//   const createConversation = useCallback(
//     async (memberIds, isGroup = false, groupName = null) => {
//       try {
//         const res = await api.post("/api/chat/conversation", {
//           members: memberIds,
//           isGroup,
//           name: groupName,
//         });
//         if (res.data.success) {
//           const newConversation = res.data.data;
//           if (!res.data.isExisting)
//             setConversations((prev) => [newConversation, ...prev]);
//           return { success: true, conversation: newConversation };
//         }
//         return { success: false, error: res.data.message || "Error" };
//       } catch (err) {
//         console.error("Error creating conversation:", err);
//         setError("Không thể tạo cuộc trò chuyện");
//         return { success: false, error: err.message };
//       }
//     },
//     []
//   );

//   const startConversation = useCallback(
//     async (otherUserId) => {
//       const result = await createConversation([otherUserId], false);
//       if (result.success) await selectChat(result.conversation);
//       return result;
//     },
//     [createConversation, selectChat]
//   );

//   const markMessagesAsRead = useCallback(async (chatId) => {
//     try {
//       await api.put(`/api/chat/${chatId}/messages/read`);
//     } catch (err) {
//       console.error("Error marking messages read:", err);
//     }
//   }, []);

//   // Typing indicators
//   const startTyping = useCallback((chatId) => {
//     if (socketRef.current && socketRef.current.connected) {
//       socketRef.current.emit("typing_start", { chatId });
//     }
//   }, []);

//   const stopTyping = useCallback((chatId) => {
//     if (socketRef.current && socketRef.current.connected) {
//       socketRef.current.emit("typing_stop", { chatId });
//     }
//   }, []);

//   const clearError = useCallback(() => setError(null), []);

//   const scrollToBottom = useCallback(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, []);

//   // Delete / recall message via REST API (you already had these)
//   const deleteMessage = useCallback(
//     async (messageId) => {
//       try {
//         const res = await api.delete(`/api/chat/messages/${messageId}`);
//         if (res.data.success) {
//           setMessages((prev) => prev.filter((m) => m._id !== messageId));
//           setConversations((prev) =>
//             prev.map((conv) => {
//               if (conv.lastMessage?._id === messageId) {
//                 const otherMessages = messages.filter(
//                   (msg) => msg.chatId === conv._1 && msg._id !== messageId
//                 );
//                 return {
//                   ...conv,
//                   lastMessage: otherMessages[otherMessages.length - 1] || null,
//                 };
//               }
//               return conv;
//             })
//           );
//           return { success: true };
//         }
//         return { success: false, error: res.data.message || "Error" };
//       } catch (err) {
//         console.error("Error deleting message:", err);
//         setError("Không thể xoá tin nhắn");
//         return { success: false, error: err.message };
//       }
//     },
//     [messages]
//   );

//   const recallMessage = useCallback(
//     async (messageId) => {
//       try {
//         const res = await api.post(`/api/chat/messages/${messageId}/recall`);
//         if (res.data.success) {
//           setMessages((prev) => prev.filter((m) => m._id !== messageId));
//           setConversations((prev) =>
//             prev.map((conv) => {
//               if (conv.lastMessage?._id === messageId) {
//                 const otherMessages = messages.filter(
//                   (msg) => msg.chatId === conv._id && msg._id !== messageId
//                 );
//                 return {
//                   ...conv,
//                   lastMessage: otherMessages[otherMessages.length - 1] || null,
//                 };
//               }
//               return conv;
//             })
//           );
//           return { success: true };
//         }
//         return { success: false, error: res.data.message || "Error" };
//       } catch (err) {
//         console.error("Error recalling message:", err);
//         setError("Không thể thu hồi tin nhắn");
//         return { success: false, error: err.message };
//       }
//     },
//     [messages]
//   );

//   const replyToMessage = useCallback(
//     async (messageId, replyContent) => {
//       return await sendMessage(replyContent, null, messageId);
//     },
//     [sendMessage]
//   );

//   // Context value
//   const value = {
//     conversations,
//     selectedChat,
//     messages,
//     users,
//     loading,
//     error,
//     hasMoreMessages,
//     loadingMore,
//     messagesEndRef,

//     connectSocket,
//     loadConversations,
//     loadUsers,
//     selectChat,
//     sendMessage,
//     sendFileMessage,
//     createConversation,
//     startConversation,
//     markMessagesAsRead,
//     startTyping,
//     stopTyping,
//     clearError,
//     scrollToBottom,
//     loadMoreMessages,
//     deleteMessage,
//     recallMessage,
//     replyToMessage,

//     setSelectedChat,
//     setMessages,
//   };

//   return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
// };
