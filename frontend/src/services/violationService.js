// services/violationService.js
import api from "./api";

export const violationService = {
  // Lấy danh sách vi phạm
  getViolations: async (params = {}) => {
    const response = await api.get("/api/violations", { params });
    return response.data;
  },

  // Lấy chi tiết vi phạm
  getViolationDetails: async (id) => {
    const response = await api.get(`/api/violations/${id}`);
    return response.data;
  },

  // Lấy thống kê
  getStats: async () => {
    const response = await api.get("/api/violations/stats");
    return response.data;
  },

  // Tạo kháng cáo
  createAppeal: async (id, data, files = []) => {
    const formData = new FormData();
    formData.append("appealReason", data.appealReason);

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post(`/api/violations/${id}/appeal`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Hủy kháng cáo
  cancelAppeal: async (id) => {
    const response = await api.patch(`/api/violations/${id}/appeal/cancel`);
    return response.data;
  },
};
