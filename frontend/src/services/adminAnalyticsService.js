// src/services/enhancedAnalyticsService.js
import api from "./api";

class EnhancedAnalyticsService {
  // Lấy tổng quan với filters nâng cao
  async getOverview(period = "today", filters = {}) {
    try {
      // Chuẩn bị params
      const params = new URLSearchParams();
      params.append("period", period);

      // Thêm filters vào params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "object") {
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (
                subValue !== undefined &&
                subValue !== null &&
                subValue !== ""
              ) {
                params.append(`${key}[${subKey}]`, subValue);
              }
            });
          } else {
            params.append(key, value);
          }
        }
      });

      const response = await api.get(`/api/admin/analytics/overview?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching enhanced analytics overview:", error);
      throw this.handleError(error);
    }
  }

  // Lấy dữ liệu biểu đồ tùy chỉnh
  async getCustomChartData(chartConfig) {
    try {
      const response = await api.post("/api/admin/analytics/charts/custom", {
        chartConfig,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching custom chart data:", error);
      throw this.handleError(error);
    }
  }

  // Xuất dữ liệu với options
  async exportAnalytics(
    format = "csv",
    period = "today",
    type = "overview",
    filters = {}
  ) {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      params.append("period", period);
      params.append("type", type);

      // Thêm filters vào export
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(`filters[${key}]`, value);
        }
      });

      const response = await api.get(`/api/admin/analytics/export?${params}`, {
        responseType: "blob",
      });

      // Tạo và kích hoạt download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename = `analytics-${type}-${period}-${new Date().getTime()}.${format}`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error("Error exporting analytics:", error);
      throw this.handleError(error);
    }
  }

  // Lấy real-time updates
  async getRealTimeUpdates(lastUpdate = null) {
    try {
      const params = lastUpdate ? `?since=${lastUpdate}` : "";
      const response = await api.get(`/api/admin/analytics/realtime${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching real-time updates:", error);
      throw this.handleError(error);
    }
  }

  // Xử lý lỗi thống nhất
  handleError(error) {
    if (error.response) {
      // Server trả về lỗi
      return new Error(error.response.data.message || "Lỗi server");
    } else if (error.request) {
      // Không nhận được phản hồi
      return new Error("Không thể kết nối đến server");
    } else {
      // Lỗi khác
      return new Error("Lỗi không xác định");
    }
  }
}

export default new EnhancedAnalyticsService();
