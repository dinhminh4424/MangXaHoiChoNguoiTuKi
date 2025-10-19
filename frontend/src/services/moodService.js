// services/moodService.js
import api from "./api";

class MoodService {
  // Log mood entry
  async logMood(moodData) {
    try {
      const response = await api.post("/api/mood/log", moodData);
      return response.data;
    } catch (error) {
      console.error("MoodService - logMood error:", error);
      throw error;
    }
  }

  // Get mood history
  async getMoodHistory(params = {}) {
    try {
      const response = await api.get("/api/mood/history", { params });
      return response.data;
    } catch (error) {
      console.error("MoodService - getMoodHistory error:", error);
      throw error;
    }
  }

  // Get mood analytics
  async getMoodAnalytics(days = 30) {
    try {
      const response = await api.get("/api/mood/analytics", {
        params: { days },
      });
      return response.data;
    } catch (error) {
      console.error("MoodService - getMoodAnalytics error:", error);
      throw error;
    }
  }

  // Get support recommendations
  async getRecommendations(emotion, intensity) {
    try {
      const response = await api.get("/api/mood/recommendations", {
        params: { emotion, intensity },
      });
      return response.data;
    } catch (error) {
      console.error("MoodService - getRecommendations error:", error);
      throw error;
    }
  }

  // Get mood statistics
  async getMoodStats(period = "week") {
    return api.get(`/api/mood/stats?period=${period}`);
  }

  // Get mood trends
  async getMoodTrends(days = 7) {
    return api.get(`/api/mood/trends?days=${days}`);
  }
}

export default new MoodService();
