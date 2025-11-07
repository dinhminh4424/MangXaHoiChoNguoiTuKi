import api from "./api";

class FriendService {
  // Gửi yêu cầu kết bạn
  async sendFriendRequest(recipientId) {
    try {
      const response = await api.post("/api/friends/request", { recipientId });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi gửi yêu cầu kết bạn"
      );
    }
  }

  // Chấp nhận yêu cầu kết bạn
  async acceptFriendRequest(requestId) {
    try {
      const response = await api.post(`/api/friends/accept/${requestId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi chấp nhận yêu cầu kết bạn"
      );
    }
  }

  // Từ chối yêu cầu kết bạn
  async rejectFriendRequest(requestId) {
    try {
      const response = await api.post(`/api/friends/reject/${requestId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi từ chối yêu cầu kết bạn"
      );
    }
  }

  // Hủy yêu cầu kết bạn
  async cancelFriendRequest(requestId) {
    try {
      const response = await api.post(`/api/friends/cancel/${requestId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi hủy yêu cầu kết bạn"
      );
    }
  }

  // Lấy danh sách yêu cầu kết bạn
  async getFriendRequests(type = "received") {
    try {
      const response = await api.get("/api/friends/requests", {
        params: { type },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách yêu cầu kết bạn"
      );
    }
  }

  // Lấy danh sách bạn bè
  async getFriends(page = 1, limit = 20) {
    try {
      const response = await api.get("/api/friends", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách bạn bè"
      );
    }
  }

  // Kiểm tra trạng thái với một user
  async getFriendStatus(userId) {
    try {
      const response = await api.get(`/api/friends/status/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi kiểm tra trạng thái bạn bè"
      );
    }
  }

  // Xóa bạn bè
  async removeFriend(friendshipId) {
    try {
      const response = await api.delete(`/api/friends/${friendshipId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi xóa bạn bè"
      );
    }
  }

  // Lấy danh sách bạn bè của một user cụ thể
  async getFriendsByUserId(userId, params = {}) {
    try {
      const response = await api.get(`/api/friends/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách bạn bè"
      );
    }
  }
}

export default new FriendService();

