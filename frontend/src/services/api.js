// src/api.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Tạo một instance của axios với cấu hình sẵn
const api = axios.create({
  baseURL: API_BASE_URL, // Đúng với PORT backend của bạn http://192.168.1.9
  withCredentials: true, // Nếu bạn dùng cookie hoặc xác thực
});

// Tự động gắn token vào header nếu có
const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Xử lý response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, đăng xuất user
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
