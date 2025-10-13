// services/journalService.js
import api from "./api";

export const journalService = {
  // Tạo nhật ký mới
  createJournal: async (journalData) => {
    const formData = new FormData();

    // Thêm các field text
    Object.keys(journalData).forEach((key) => {
      if (key !== "mediaFiles" && journalData[key] !== undefined) {
        if (Array.isArray(journalData[key])) {
          journalData[key].forEach((item) => formData.append(key, item));
        } else {
          formData.append(key, journalData[key]);
        }
      }
    });

    // Thêm files
    if (journalData.mediaFiles) {
      journalData.mediaFiles.forEach((file) => {
        formData.append("media", file);
      });
    }

    const response = await api.post("/api/journals", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Lấy nhật ký hôm nay
  getTodayJournal: async (userId) => {
    if (!userId) {
      console.warn("⚠️ journalService.getTodayJournal: userId bị thiếu!");
      return null;
    }

    try {
      console.log("📘 Fetch today journal:", `/api/journals/today/${userId}`);
      const response = await api.get(`/api/journals/today/${userId}`);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Lỗi khi lấy nhật ký hôm nay:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Cập nhật nhật ký hôm nay
  updateTodayJournal: async (targetJournalId, updateData) => {
    const formData = new FormData();

    Object.keys(updateData).forEach((key) => {
      if (key !== "mediaFiles" && updateData[key] !== undefined) {
        if (Array.isArray(updateData[key])) {
          updateData[key].forEach((item) => formData.append(key, item));
        } else {
          formData.append(key, updateData[key]);
        }
      }
    });

    if (updateData.mediaFiles) {
      updateData.mediaFiles.forEach((file) => {
        formData.append("media", file);
      });
    }

    const response = await api.put(
      `/api/journals/${targetJournalId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  // Cập nhật nhật ký theo id

  // services/journalService.js
  updateJournal: async (updateData, idJournal) => {
    const formData = new FormData();

    console.log("📤 [Service] Original updateData:", updateData);

    // Thêm các field vào formData
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        const value = updateData[key];

        if (key === "mediaFiles") {
          // mediaFiles sẽ được xử lý riêng bên dưới
          return;
        }

        // Stringify các array và object
        if (Array.isArray(value) || typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Thêm files mới (nếu có)
    if (updateData.mediaFiles && Array.isArray(updateData.mediaFiles)) {
      updateData.mediaFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("mediaFiles", file);
          console.log("📎 Added file to formData:", file.name);
        }
      });
    }

    // Debug: Log tất cả các field trong formData
    console.log("📦 [Service] FormData contents:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: [File] ${value.name} (${value.type})`);
      } else {
        console.log(`${key}:`, value);
      }
    }

    try {
      const response = await api.put(`/api/journals/${idJournal}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ [Service] Update successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [Service] Update failed:", error);
      throw error;
    }
  },

  // lấy nhật ký theo id
  getJournalById: async (journalId) => {
    if (!journalId) {
      console.warn("⚠️ journalService.getJournalById: journalId bị thiếu!");
      return null;
    }
    try {
      const res = await api.get(`/api/journals/${journalId}`);
      return res;
    } catch (error) {
      return null;
    }
  },

  // Lấy lịch sử nhật ký
  getJournalHistory: async (userId, page = 1, limit = 10) => {
    const response = await api.get(
      `/api/journals/user/${userId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  deleteJournal: async (journalId) => {
    const response = await api.delete(`/api/journals/${journalId}`);
    return response.data;
  },
};
