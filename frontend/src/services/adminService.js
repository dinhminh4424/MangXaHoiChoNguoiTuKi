import api from "./api";

/**
 * ADMIN SERVICE
 * Chứa tất cả các API calls cho admin
 */

// Dashboard
export const getDashboardStats = async () => {
  const res = await api.get("/api/admin/dashboard");
  return res.data;
};

// Quản lý người dùng
export const getAllUsers = (params = {}) => {
  return api.get("/api/admin/users", { params });
};

export const getUserById = (userId) => {
  return api.get(`/api/admin/users/${userId}`);
};

export const updateUser = (userId, data) => {
  return api.put(`/api/admin/users/${userId}`, data);
};

export const deleteUser = (userId) => {
  return api.delete(`/api/admin/users/${userId}`);
};

export const updateUserRole = (userId, role) => {
  return api.put(`/api/admin/users/${userId}/role`, { role });
};

// Quản lý bài viết
export const getAllPosts = (params = {}) => {
  return api.get("/api/admin/posts", { params });
};

export const getPostById = (postId) => {
  return api.get(`/api/admin/posts/${postId}`);
};

export const deletePost = (postId) => {
  return api.delete(`/api/admin/posts/${postId}`);
};

// Quản lý nhật ký
export const getAllJournals = (params = {}) => {
  return api.get("/api/admin/journals", { params });
};

export const getJournalById = (journalId) => {
  return api.get(`/api/admin/journals/${journalId}`);
};

export const deleteJournal = (journalId) => {
  return api.delete(`/api/admin/journals/${journalId}`);
};

// Quản lý nhóm
export const getAllGroups = (params = {}) => {
  return api.get("/api/admin/groups", { params });
};

export const getGroupById = (groupId) => {
  return api.get(`/api/admin/groups/${groupId}`);
};

export const deleteGroup = (groupId) => {
  return api.delete(`/api/admin/groups/${groupId}`);
};

// Quản lý bình luận
export const getAllComments = (params = {}) => {
  return api.get("/api/admin/comments", { params });
};

export const deleteComment = (commentId) => {
  return api.delete(`/api/admin/comments/${commentId}`);
};

// Quản lý thông báo
export const getAllNotifications = (params = {}) => {
  return api.get("/api/admin/notifications", { params });
};

export const createNotification = (data) => {
  return api.post("/api/admin/notifications", data);
};

export const deleteNotification = (notificationId) => {
  return api.delete(`/api/admin/notifications/${notificationId}`);
};

// Báo cáo và phân tích
export const getUserReports = (period = 30) => {
  return api.get("/api/admin/reports/users", { params: { period } });
};

export const getPostReports = (period = 30) => {
  return api.get("/api/admin/reports/posts", { params: { period } });
};

export const getActivityReports = (period = 7) => {
  return api.get("/api/admin/reports/activity", { params: { period } });
};
