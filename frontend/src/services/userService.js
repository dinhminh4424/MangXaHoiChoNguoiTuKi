import api from "./api";

class UserService {
  // Lấy thông tin user hiện tại
  async getCurrentUser() {
    try {
      const response = await api.get("/api/users/me");
      return response.data.data.user;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy thông tin user"
      );
    }
  }

  // Lấy thông tin user bằng ID (cho xem profile người khác)
  async getUserById(userId) {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy thông tin user"
      );
    }
  }

  // Lấy thông tin user bằng username (cho xem profile người khác)
  async getUserByUserName(userName) {
    try {
      const response = await api.get(`/api/users/username/${userName}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy thông tin user"
      );
    }
  }

  // Cập nhật profile với avatar
  async updateProfileWithAvatar(updateData) {
    try {
      const response = await api.put("/api/users/profile", updateData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Cập nhật thất bại");
    }
  }

  // Cập nhật profile user hiện tại
  async updateProfile(profileData) {
    try {
      const response = await api.put("/api/users/profile", profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Cập nhật thất bại");
    }
  }

  // Tìm kiếm users
  async searchUsers(searchParams) {
    try {
      const { search, role, page = 1, limit = 20 } = searchParams;
      const response = await api.get("/api/users", {
        params: { search, role, page, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi tìm kiếm users"
      );
    }
  }

  // Lấy danh sách supporters
  async getSupporters() {
    try {
      const response = await api.get("/api/users/supporters/list");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách supporters"
      );
    }
  }

  // Cập nhật trạng thái online
  async updateOnlineStatus(isOnline) {
    try {
      const response = await api.put("/api/users/online-status", { isOnline });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi cập nhật trạng thái"
      );
    }
  }

  //Cập nhật ảnh bìa
  async updateImageCover(formData) {
    try {
      const response = await api.put("/api/users/imageCover", formData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi cập nhật trạng thái"
      );
    }
  }
}

export default new UserService();
