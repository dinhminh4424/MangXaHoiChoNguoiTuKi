// services/commentService.js (Frontend)
import api from "./api";

class CommentService {
  // Tạo bình luận
  async createComment(commentData) {
    try {
      const formData = new FormData();

      formData.append("postID", commentData.postID);
      formData.append("content", commentData.content);
      if (commentData.parentCommentID) {
        formData.append("parentCommentID", commentData.parentCommentID);
      }

      // Thêm file nếu có
      if (commentData.file) {
        formData.append("file", commentData.file);
      }

      const response = await api.post("/api/comments/create", formData);

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Lấy bình luận theo bài viết
  async getCommentsByPost(postId, params = {}) {
    try {
      const response = await api.get(`/api/comments/post/${postId}`, {
        query: params,
      });

      console.log("MMMMMMMMMMMMMMMMMMMMM");
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Lấy replies của bình luận
  async getCommentReplies(commentId, params = {}) {
    try {
      const response = await api.get(`/api/comments/${commentId}/replies`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Cập nhật bình luận
  async updateComment(id, content) {
    try {
      const response = await api.put(`/api/comments/${id}`, { content });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Xóa bình luận
  async deleteComment(id) {
    try {
      const response = await api.delete(`/api/comments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Like bình luận
  async likeComment(id, emotion = "like") {
    try {
      const response = await api.post(`/api/comments/${id}/like`, { emotion });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Unlike bình luận
  async unlikeComment(id) {
    try {
      const response = await api.post(`/api/comments/${id}/unlike`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Lấy danh sách người đã like
  async getCommentLikes(id) {
    try {
      const response = await api.get(`/api/comments/${id}/likes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new CommentService();
