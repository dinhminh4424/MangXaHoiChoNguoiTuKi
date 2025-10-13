// services/imageUploadService.js
import api from "./api";

export const imageUploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("media", file);

    try {
      const response = await api.post("/api/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.url;
    } catch (error) {
      throw new Error(
        "Upload image failed: " +
          (error.response?.data?.message || error.message)
      );
    }
  },
};
