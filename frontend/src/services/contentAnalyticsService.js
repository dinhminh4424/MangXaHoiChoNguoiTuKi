// src/services/contentAnalyticsService.js
import api from "./api";

class ContentAnalyticsService {
  async getContentOverview(
    period = "today",
    customStart = null,
    customEnd = null
  ) {
    try {
      let url = `/api/admin/analytics/content/overview?period=${period}`;

      if (customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPostDetail(postId, period = "today") {
    try {
      const response = await api.get(
        `/api/admin/analytics/content/post/${postId}?period=${period}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getContentTrends(period = "week", limit = 20) {
    try {
      const response = await api.get(
        `/api/admin/analytics/content/trends?period=${period}&limit=${limit}`
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

export default new ContentAnalyticsService();
