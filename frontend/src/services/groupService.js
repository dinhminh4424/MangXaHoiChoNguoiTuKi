// services/api/groupService.js
import api from "./api";

const groupService = {
  // Tạo nhóm
  createGroup: async (groupData) => {
    const res = await api.post("/api/groups", groupData);
    return res.data;
  },

  // Lấy thông tin nhóm
  getGroup: async (groupId) => {
    const res = await api.get(`/api/groups/${groupId}`);
    return res.data;
  },

  // Cập nhật nhóm
  updateGroup: async (groupId, groupData) => {
    const res = await api.put(`/api/groups/${groupId}`, groupData);
    return res.data;
  },

  // Lấy tất cả groups (cho discovery)
  getAllGroups: async (params = {}) => {
    const res = await api.get("/api/groups", { params });
    return res.data;
  },

  // Xóa nhóm
  deleteGroup: async (groupId) => {
    const res = await api.delete(`/api/groups/${groupId}`);
    return res.data;
  },

  // Tham gia nhóm
  joinGroup: async (groupId) => {
    const res = await api.post(`/api/groups/${groupId}/join`);
    return res.data;
  },

  // Rời nhóm
  leaveGroup: async (groupId) => {
    const res = await api.post(`/api/groups/${groupId}/leave`);
    return res.data;
  },

  // Mời user
  inviteUser: async (groupId, userIdToInvite) => {
    const res = await api.post(`/api/groups/${groupId}/invite`, {
      userIdToInvite,
    });
    return res.data;
  },

  // Lấy feed nhóm
  getGroupFeed: async (groupId, params = {}) => {
    const res = await api.get(`/api/groups/${groupId}/feed`, { params });
    return res.data;
  },

  // Lấy danh sách thành viên
  getGroupMembers: async (groupId, params = {}) => {
    const res = await api.get(`/api/groups/${groupId}/members`, { params });
    return res.data;
  },

  // Quản lý thành viên
  manageMember: async (groupId, targetUserId, action) => {
    const res = await api.post(`/api/groups/${groupId}/members/manage`, {
      targetUserId,
      action,
    });
    return res.data;
  },

  // Chuyển quyền owner
  transferOwnership: async (groupId, newOwnerId) => {
    const res = await api.post(`/api/groups/${groupId}/transfer-ownership`, {
      newOwnerId,
    });
    return res.data;
  },

  // Quản lý moderator
  manageModerator: async (groupId, targetUserId, action) => {
    const res = await api.post(`/api/groups/${groupId}/moderators`, {
      targetUserId,
      action,
    });
    return res.data;
  },

  // Lấy nhóm theo emotion (cho recommendation)
  getGroupsByEmotion: async (emotion) => {
    const res = await api.get("/api/groups", { params: { category: emotion } });
    return res.data;
  },

  // Lấy tất cả nhóm của user
  getUserGroups: async (params = {}) => {
    const res = await api.get("/api/groups/user/my-groups", { params });
    return res.data;
  },

  // Tìm kiếm nhóm
  searchGroups: async (query, params = {}) => {
    const res = await api.get("/api/groups/search", {
      params: { ...params, q: query },
    });
    return res.data;
  },

  // Lấy groups đề xuất
  getRecommendedGroups: async (params = {}) => {
    const res = await api.get("/api/groups/recommendations", { params });
    return res.data;
  },

  // Lấy groups phổ biến
  getPopularGroups: async (params = {}) => {
    const res = await api.get("/api/groups/popular", { params });
    return res.data;
  },

  // báo cáo group
  reportGroup: async (groupId, reportData) => {
    const formData = new FormData();
    //
    // // thêm các giá trị từ form
    Object.entries(reportData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Nếu là file list
      if (key === "files" && Array.isArray(value)) {
        value.forEach((file) => {
          // nếu file có dạng { fileObject: File, fileName, ... }
          if (file instanceof File) {
            formData.append("files", file);
          } else if (file.fileObject instanceof File) {
            formData.append("files", file.fileObject);
          }
        });
      }

      // Nếu là mảng (tags, emotions,...)
      else if (Array.isArray(value)) {
        value.forEach((item) => {
          // Nếu item là object => stringify
          if (typeof item === "object" && !(item instanceof File)) {
            formData.append(key, JSON.stringify(item));
          } else {
            formData.append(key, item);
          }
        });
      }

      // Nếu là object bình thường (vd: { lat: 10, lng: 20 })
      else if (typeof value === "object" && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      }

      // Nếu là kiểu primitive
      else {
        formData.append(key, value);
      }
    });
    const res = await api.post(`/api/groups/${groupId}/report`, formData);
    return res.data;
  },

  getGroupReports: async (groupId, params = {}) => {
    try {
      const res = await api.get(`/api/groups/${groupId}/violation`, { params });

      return res.data;
    } catch (err) {
      console.error("Error fetching group reports:", err);
      throw err;
    }
  },
};

export default groupService;
