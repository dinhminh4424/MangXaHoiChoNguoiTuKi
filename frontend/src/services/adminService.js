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

export const updateActiveUser = async (id) => {
  const res = await api.put(`/api/admin/users/${id}/active`);
  return res.data;
};

export const deleteUser = (userId) => {
  return api.delete(`/api/admin/users/${userId}`);
};

export const updateUserRole = (userId, role) => {
  return api.put(`/api/admin/users/${userId}/role`, { role });
};

// Quản lý bài viết
export const getAllPosts = async (params = {}) => {
  return await api.get("/api/admin/posts", { params });
};

export const getPostById = (postId) => {
  return api.get(`/api/admin/posts/${postId}`);
};

export const updatePostBlock = async (postId) => {
  const res = await api.put(`/api/admin/posts/${postId}/blockPost`);
  return res.data;
};

export const updatePostCommentBlock = async (postId) => {
  const res = await api.put(`/api/admin/posts/${postId}/blockComment`);
  return res.data;
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
  const res = api.get("/api/admin/reports/users", { params: { period } });
  return res.data;
};

export const getPostReports = (period = 30) => {
  const res = api.get("/api/admin/reports/posts", { params: { period } });
  return res.data;
};

export const getActivityReports = (period = 7) => {
  return api.get("/api/admin/reports/activity", { params: { period } });
};

// Quản Lý Reports
// Report Post
export const getPostViolation = async (
  params = {
    page: 1,
    limit: 10,
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
    id: "",
  }
) => {
  const res = await api.get("/api/admin/violation/posts", { params });
  return res.data;
};

export const updateViolationStatus = async (violationId, updateData) => {
  const res = await api.put(
    `/api/admin/violation/posts/${violationId}`,
    updateData
  );
  return res.data;
};

// Report Comment

export const getCommentViolation = async (
  params = {
    page: 1,
    limit: 10,
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
    reportId: "",
  }
) => {
  console.log("params: ", params);
  const res = await api.get("/api/admin/violation/comments", { params });
  return res.data;
};

export const updateCommentViolationStatus = async (violationId, updateData) => {
  const res = await api.put(
    `/api/admin/violation/comments/${violationId}`,
    updateData
  );
  return res.data;
};

// report user
export const getUsersViolation = async (
  params = {
    page: 1,
    limit: 10,
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
    reportId: "",
  }
) => {
  console.log("params: ", params);
  const res = await api.get("/api/admin/violation/users", { params });
  return res.data;
};

export const updateUsersViolationStatus = async (violationId, updateData) => {
  const res = await api.put(
    `/api/admin/violation/users/${violationId}`,
    updateData
  );
  return res.data;
};
