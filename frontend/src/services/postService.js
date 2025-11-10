// services/postService.js
import api from "./api";

export const postService = {
  // tạo bài viết
  createPost: async (postData) => {
    try {
      console.log("==============postData==============");
      console.log(postData);
      console.log("====================================");

      const formData = new FormData();
      //
      // // thêm các giá trị từ form
      Object.keys(postData).forEach((key) => {
        if (key === "files") {
          if (postData.files && postData.files.length > 0) {
            postData.files.forEach((file) => {
              formData.append("files", file);
            });
          }
        } else if (postData[key] !== undefined && postData[key] !== null) {
          if (Array.isArray(postData[key])) {
            postData[key].forEach((item) => formData.append(key, item));
          } else {
            formData.append(key, postData[key]);
          }
        }
      });
      //
      console.log("==============formData123==============");
      console.log(formData);
      console.log("====================================");

      /// do post data đã là formData rồi nếu là [obj => {, , , , , }] thông thường thi không cần nưaax
      const response = await api.post("/api/posts/create", formData);

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // lấy danh sách bài viết
  getPosts: async (params = {}) => {
    try {
      const response = await api.get("/api/posts", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Chi tiết baì viết theo ID
  getDetail: async (postID) => {
    try {
      const res = await api.get(`/api/posts/${postID}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật bài viết
  updatePost: async (id, postData) => {
    try {
      const formData = new FormData();

      // Thêm các trường text
      Object.keys(postData).forEach((key) => {
        if (
          key !== "files" &&
          postData[key] !== undefined &&
          postData[key] !== null
        ) {
          let valueToSend = postData[key];

          if (key === "emotions" || key === "tags") {
            if (Array.isArray(postData[key])) {
              valueToSend = JSON.stringify(postData[key]);
              console.log(`${key} (array -> JSON):`, valueToSend);
            }
          }
          // ✅ SỬA: KHÔNG JSON.stringify filesToDelete
          else if (key === "filesToDelete") {
            // Giữ nguyên mảng, không stringify
            valueToSend = postData[key];
            console.log(`${key} (keep as array):`, valueToSend);
          } else if (typeof postData[key] === "object") {
            valueToSend = JSON.stringify(postData[key]);
          }

          if (key === "filesToDelete" && Array.isArray(valueToSend)) {
            valueToSend.forEach((url, index) => {
              formData.append(`filesToDelete[${index}]`, url);
            });
          } else {
            formData.append(key, valueToSend);
          }

          console.log(`Appended ${key}:`, valueToSend);
        }
      });

      // Thêm files mới
      if (postData.files && postData.files.length > 0) {
        postData.files.forEach((file) => {
          formData.append("files", file);
          console.log("Appended file:", file.name);
        });
      }

      const response = await api.put(`/api/posts/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa bài viết
  deletePost: async (id) => {
    try {
      const response = await api.delete(`/api/posts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Like bài viết
  likePost: async (id, emotion = "like") => {
    try {
      const response = await api.post(`/api/posts/${id}/like`, { emotion });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Unlike bài viết
  unlikePost: async (id) => {
    try {
      const response = await api.post(`/api/posts/${id}/unlike`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy danh sách người đã like
  getPostLikes: async (id) => {
    try {
      const response = await api.get(`/api/posts/${id}/likes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Ẩn bài viết (admin)
  blockPost: async (id) => {
    try {
      const response = await api.patch(`/api/posts/${id}/block`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bỏ ẩn bài viết (admin)
  unblockPost: async (id) => {
    try {
      const response = await api.patch(`/api/posts/${id}/unblock`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  reportPost: async (reportData) => {
    try {
      const formData = new FormData();
      //
      // // thêm các giá trị từ form
      Object.entries(reportData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // Nếu là file list
        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => {
            // nếu file có dạng { fileObject: File, fileName, ... }
            if (file instanceof File) {
              formData.append("files", file);
            } else if (file.fileObject instanceof File) {
              formData.append("files", file.fileObject);
            }
          });
        }

        // Nếu là mảng (tags, emotions,...)
        else if (Array.isArray(value)) {
          value.forEach((item) => {
            // Nếu item là object => stringify
            if (typeof item === "object" && !(item instanceof File)) {
              formData.append(key, JSON.stringify(item));
            } else {
              formData.append(key, item);
            }
          });
        }

        // Nếu là object bình thường (vd: { lat: 10, lng: 20 })
        else if (typeof value === "object" && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        }

        // Nếu là kiểu primitive
        else {
          formData.append(key, value);
        }
      });

      const response = await api.post(
        `/api/posts/${reportData.id}/report`,
        formData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  imagesPost: async (params) => {
    try {
      const res = await api.get("/api/posts/images", { params: params });
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
