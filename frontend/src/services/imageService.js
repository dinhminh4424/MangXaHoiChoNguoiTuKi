import api from "./api";

/**
 * IMAGE SERVICE
 * Quản lý API calls cho hình ảnh
 */

// Lấy tất cả hình ảnh
export const getAllImages = async (params = {}) => {
  const res = await api.get("/api/admin/images", { params });
  return res.data;
};

// Lấy hình ảnh theo ID
export const getImageById = async (imageId) => {
  const res = await api.get(`/api/admin/images/${imageId}`);
  return res.data;
};

// Tạo hình ảnh mới
export const createImage = async (formData) => {
  const res = await api.post("/api/admin/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Cập nhật hình ảnh
export const updateImage = async (imageId, formData) => {
  const res = await api.put(`/api/admin/images/${imageId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Xóa hình ảnh
export const deleteImage = async (imageId) => {
  const res = await api.delete(`/api/admin/images/${imageId}`);
  return res.data;
};

// Lấy hình ảnh theo category (public)
export const getImagesByCategory = async (category, limit = 20) => {
  const res = await api.get(`/api/images/public/category/${category}`, {
    params: { limit },
  });
  return res.data;
};

// Lấy thống kê hình ảnh
export const getImageStats = async () => {
  const res = await api.get("/api/admin/images/stats");
  return res.data;
};

// Lấy hình ảnh theo category (public)
export const getImagesByCategoryActive = async (category) => {
  const res = await api.get(`/api/images/public/category/${category}/active`);
  return res.data;
};
