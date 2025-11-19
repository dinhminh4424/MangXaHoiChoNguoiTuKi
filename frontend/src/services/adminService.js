import api from "./api";

/**
 * ADMIN SERVICE
 * Chứa tất cả các API calls cho admin
 */

// Dashboard
export const getDashboardStats = async (params = {}) => {
  const res = await api.get("/api/admin/dashboard", { params });
  return res.data;
};

// Quản lý người dùng
export const getAllUsers = async (params = {}) => {
  return await api.get("/api/admin/users", { params });
};

export const createUser = async (userData) => {
  return await api.post("/api/admin/users", userData);
};

export const getUserById = (userId) => {
  return api.get(`/api/admin/users/${userId}`);
};

export const updateUser = async (userId, data) => {
  const res = await api.put(`/api/admin/users/${userId}`, data);
  return res.data;
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
// Lấy danh sách nhật ký với filter
export const getAllJournals = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const response = await api.get(`/api/admin/journals?${queryString}`);
  return response.data;
};

// Lấy chi tiết nhật ký
export const getJournalById = async (journalId) => {
  const response = await api.get(`/api/admin/journals/${journalId}`);
  return response.data;
};

// Xóa nhật ký
export const deleteJournal = async (journalId) => {
  const response = await api.delete(`/api/admin/journals/${journalId}`);
  return response.data;
};

// Lấy thống kê nhật ký
export const getJournalStats = async () => {
  const response = await api.get("/api/admin/journals/stats");
  return response.data;
};

// Quản lý nhóm
export const getAllGroups = async (filters = {}) => {
  const res = await api.get(`/api/admin/groups`, { params: filters });
  return res.data;
};

export const getGroupStats = async () => {
  const res = await api.get("/api/admin/groups/stats");
  return res.data;
};

export const createGroup = async (groupData) => {
  return await api.post("/api/admin/groups", groupData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateGroup = async (groupId, groupData) => {
  return await api.put(`/api/admin/groups/${groupId}`, groupData);
};

export const deleteGroup = async (groupId) => {
  return await api.delete(`/api/admin/groups/${groupId}`);
};

export const getGroupDetail = async (groupId) => {
  return await api.get(`/api/admin/groups/${groupId}`);
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

// report group
export const getGroupViolation = async (
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
  const res = await api.get("/api/admin/violation/groups", { params });
  return res.data;
};

export const updateGroupViolationStatus = async (violationId, updateData) => {
  const res = await api.put(
    `/api/admin/violation/groups/${violationId}`,
    updateData
  );
  return res.data;
};

// Quản lý kháng nghị
export const getAllAppeals = async (params = {}) => {
  const res = await api.get("/api/admin/appeals", { params });
  return res.data;
};

export const getAppealById = async (appealId) => {
  const res = await api.get(`/api/admin/appeals/${appealId}`);
  return res.data;
};

export const updateAppealStatus = async (appealId, updateData) => {
  const res = await api.put(
    `/api/admin/appeals/${appealId}/status`,
    updateData
  );
  return res.data;
};

// Backup & Restore Services
export const backupService = {
  // Backup Database
  backupDatabase: async () => {
    const res = await api.post("/api/backup/backup/database");
    return res.data;
  },

  // Backup System Files
  backupSystemFiles: async () => {
    const res = await api.post("/api/backup/backup/files");
    return res.data;
  },

  // Full Backup
  backupFull: async () => {
    const res = await api.post("/api/backup/backup/full");
    return res.data;
  },

  // Get Backup List
  getBackupList: async () => {
    const res = await api.get("/api/backup/backups");
    return res.data;
  },

  // Download Backup
  downloadBackup: async (filename) => {
    const res = await api.get(`/api/backup/backups/download/${filename}`, {
      responseType: "blob",
    });
    return res;
  },

  // Delete Backup
  deleteBackup: async (filename) => {
    const res = await api.delete(`/api/backup/backups/${filename}`);
    return res.data;
  },

  // Restore System
  restoreSystem: async (backupFile) => {
    const formData = new FormData();
    formData.append("backupFile", backupFile);

    const res = await api.post("/api/backup/restore", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // Get Restore Progress
  getRestoreProgress: async (logId) => {
    const res = await api.get(`/api/backup/restore/progress/${logId}`);
    return res.data;
  },

  // Get Backup Logs
  getBackupLogs: async (params = {}) => {
    const res = await api.get("/api/backup/backup-logs", { params });
    return res.data;
  },

  // Lấy danh sách databases
  getDatabases: async () => {
    try {
      const response = await api.get("/api/backup/databases");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Khôi phục với options
  restoreSystem: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append("backupFile", file);

      // Thêm options vào formData
      if (options.targetDatabase) {
        formData.append("targetDatabase", options.targetDatabase);
      }
      if (options.sourceDatabase) {
        formData.append("sourceDatabase", options.sourceDatabase);
      }
      if (options.dropExisting !== undefined) {
        formData.append("dropExisting", options.dropExisting.toString());
      }

      const response = await api.post("/api/backup/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Quản lý logs
export const getSystemLogs = async (params = {}) => {
  const res = await api.get("/api/admin/logs", { params });
  return res.data;
};

export const getLogDetail = async (logId, params = {}) => {
  const res = await api.get(`/api/admin/logs/${logId}`, { params });
  return res.data;
};

export const getUserLogs = async (userId, params = {}) => {
  const res = await api.get(`/api/admin/logs/user/${userId}`, { params });
  return res.data;
};

export const getLogStats = async (params = {}) => {
  const res = await api.get("/api/admin/logs/stats", { params });
  return res.data;
};

export const getQuickStats = async (filters = {}) => {
  try {
    const res = await api.get("/api/admin/logs/quick-stats", {
      params: filters,
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    throw error;
  }
};
