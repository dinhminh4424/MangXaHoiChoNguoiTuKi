import api from "./api";

export const quizResultService = {
  // Lưu kết quả bài tập
  saveResult: async (data) => {
    const response = await api.post("/api/question-results", data);
    return response.data;
  },

  // Lấy danh sách kết quả
  getResults: async (params = {}) => {
    const response = await api.get("/api/question-results", { params });
    return response.data;
  },

  // Lấy chi tiết kết quả
  getResultDetails: async (resultId) => {
    const response = await api.get(`/api/question-results/${resultId}`);
    return response.data;
  },

  // Lấy thống kê
  getStatistics: async (period = "month") => {
    const response = await api.get("/api/question-results/stats/overview", {
      params: { period },
    });
    return response.data;
  },

  // Xóa kết quả
  deleteResult: async (resultId) => {
    const response = await api.delete(`/api/question-results/${resultId}`);
    return response.data;
  },
};
