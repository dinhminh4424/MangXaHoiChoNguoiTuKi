// src/services/userAnalyticsService.js
import api from "./api";

class UserAnalyticsService {
  async getUserStats(period = "today", customStart = null, customEnd = null) {
    try {
      let url = `/api/admin/analytics/users/stats?period=${period}`;

      // Thêm custom date range parameters nếu có
      if (customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSuspiciousSearches(period = "today", limit = 50) {
    try {
      const response = await api.get(
        `/api/admin/analytics/users/suspicious-searches?period=${period}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserDetail(userId, period = "today") {
    try {
      const response = await api.get(
        `/api/admin/analytics/users/user/${userId}?period=${period}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.message || "Lỗi server");
    } else if (error.request) {
      return new Error("Không thể kết nối đến server");
    } else {
      return new Error("Lỗi không xác định");
    }
  }
}

export default new UserAnalyticsService();
