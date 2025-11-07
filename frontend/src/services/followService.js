// services/followService.js
import api from "./api";

class FollowService {
  // Theo dõi một user
  async followUser(userId) {
    try {
      const response = await api.post(`/api/follow/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Bỏ theo dõi một user
  async unfollowUser(userId) {
    try {
      const response = await api.delete(`/api/follow/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Kiểm tra trạng thái follow
  async getFollowStatus(userId) {
    try {
      const response = await api.get(`/api/follow/status/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Lấy danh sách người theo dõi (followers)
  async getFollowers(userId, params = {}) {
    try {
      const response = await api.get(`/api/follow/followers/${userId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Lấy danh sách đang theo dõi (following)
  async getFollowing(userId, params = {}) {
    try {
      const response = await api.get(`/api/follow/following/${userId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new FollowService();

