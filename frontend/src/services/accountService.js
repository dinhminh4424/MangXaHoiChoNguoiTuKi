// src/services/accountService.js
import api from "./api";

export const accountService = {
  // Lấy thông tin profile
  getProfile: () => api.get("/api/account/profile"),

  // Cập nhật profile
  updateProfile: (data) => api.put("/api/account/profile", data),

  // Đổi mật khẩu
  changePassword: (currentPassword, newPassword) =>
    api.post("/api/account/change-password", { currentPassword, newPassword }),

  // Yêu cầu reset password
  requestPasswordReset: (email) =>
    api.post("/api/account/request-password-reset", { email }),

  // Reset password với OTP
  resetPasswordWithOTP: (email, otp, newPassword) =>
    api.post("/api/account/reset-password-with-otp", {
      email,
      otp,
      newPassword,
    }),

  // Lấy lịch sử hoạt động
  getActivityLogs: (params = {}) =>
    api.get("/api/account/activity-logs", { params }),

  // Deactivate tài khoản
  deactivateAccount: (password, reason) =>
    api.delete("/api/account/deactivate", { data: { password, reason } }),

  // Reactivate tài khoản
  reactivateAccount: (email, password) =>
    api.post("/api/account/reactivate", { email, password }),

  // Export data
  exportData: () => api.get("/api/account/export-data"),

  // Cài đặt
  getSettings: () => api.get("/api/settings"),
  updateSettings: (settings) => api.put("/api/settings", { settings }),
};
