import api from "./api";

const adminChatService = {
  // Lấy danh sách hộp thoại
  getConversations: (params) =>
    api.get("/api/admin/chats/conversations", { params }),

  // Lấy chi tiết hộp thoại
  getConversationDetail: (conversationId) =>
    api.get(`/api/admin/chats/conversations/${conversationId}`),

  // Lấy tin nhắn của hộp thoại
  getMessages: (conversationId, params) =>
    api.get(`/api/admin/chats/conversations/${conversationId}/messages`, {
      params,
    }),

  // Xoá hộp thoại
  deleteConversation: (conversationId) =>
    api.delete(`/api/admin/chats/conversations/${conversationId}`),

  // Lấy thống kê
  getStats: () => api.get("/api/admin/chats/stats"),
};

export default adminChatService;
