// services/rateLimitService.js
import api from "./api";

export const rateLimitService = {
  // Lấy tất cả configs
  getAllConfigs: async () => {
    try {
      const response = await api.get("/api/admin/security/rate-limits");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi kết nối" };
    }
  },

  // Lấy config theo key
  getConfigByKey: async (key) => {
    try {
      const response = await api.get(`/api/admin/security/rate-limits/${key}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi kết nối" };
    }
  },

  // Cập nhật config
  updateConfig: async (key, configData) => {
    try {
      const response = await api.put(
        `/api/admin/security/rate-limits/${key}`,
        configData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi kết nối" };
    }
  },

  // Cập nhật hàng loạt
  bulkUpdateConfigs: async (configs) => {
    try {
      const response = await api.put("/api/admin/security/rate-limits", {
        configs,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi kết nối" };
    }
  },
};

export default rateLimitService;
