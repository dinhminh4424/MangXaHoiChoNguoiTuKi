import React, { createContext, useState, useContext, useEffect } from "react";
// import axios from "axios";
import api from "../services/api"; // đường dẫn tùy theo vị trí file api.js

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // State để lưu thông tin xác thực
  const [user, setUser] = useState(null); // Lưu thông tin user
  const [token, setToken] = useState(localStorage.getItem("token")); // Lưu token trong state
  const [loading, setLoading] = useState(true); // Trạng thái tải

  // Thiết lập header mặc định cho api
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Kiểm tra token khi load app
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      console.log(
        "🔄 checkAuth started, token:",
        storedToken ? "✅ Present" : "❌ Missing"
      );

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        // Set token trước
        setToken(storedToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

        const response = await api.get("/api/users/me");

        if (response.data && response.data.data && response.data.data.user) {
          setUser(response.data.data.user);
        } else {
          console.warn("⚠️ Unexpected response structure:", response.data);
          throw new Error("Invalid response structure");
        }
      } catch (error) {
        console.error("❌ checkAuth failed:", error);
        console.error("Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common["Authorization"];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // ✅ GIỮ NGUYÊN empty dependencies

  // Hàm đăng nhập
  // const login = async (email, password) => {
  //   try {
  //     // Gọi API đăng nhập
  //     const response = await api.post("/api/auth/login", {
  //       email,
  //       password,
  //     });

  //     // Lưu thông tin user và token
  //     const { user, token } = response.data.data;
  //     localStorage.setItem("token", token);
  //     api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  //     setUser(user);
  //     setToken(token);

  //     return { success: true, data: token };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.response?.data?.message || "Đăng nhập thất bại",
  //     };
  //   }
  // };

  // Hàm đăng nhập trong AuthContext
  const login = async (email, password) => {
    try {
      // Gọi API đăng nhập
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      // Lưu thông tin user và token
      const { user, token } = response.data.data;
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      setToken(token);

      return { success: true, token };
    } catch (error) {
      console.error("Login error:", error);

      // Xử lý các loại lỗi khác nhau
      let errorMessage = "Đăng nhập thất bại";

      if (error.response) {
        // Lỗi từ server
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Không nhận được response
        errorMessage = "Không thể kết nối đến server";
      } else {
        // Lỗi khác
        errorMessage = error.message || errorMessage;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // --- NEW FUNCTION ---
  // Hàm xử lý đăng nhập từ Social (Google, Facebook)
  const handleSocialLogin = async (newToken) => {
    console.log("🔄 handleSocialLogin started...");
    try {
      // 1. Lưu token mới
      localStorage.setItem("token", newToken);
      setToken(newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      // 2. Lấy thông tin user ngay lập tức (giống checkAuth)
      const response = await api.get("/api/users/me");

      if (response.data && response.data.data && response.data.data.user) {
        setUser(response.data.data.user);
        console.log("✅ Social login successful, user set");
        return { success: true };
      } else {
        throw new Error("Invalid user data structure");
      }
    } catch (error) {
      console.error("❌ handleSocialLogin failed:", error);
      // Nếu thất bại, đăng xuất
      logout();
      return { success: false };
    }
  };

  // Hàm đăng ký
  const register = async (userData) => {
    try {
      // Gọi API đăng ký
      const response = await api.post("/api/auth/register", userData);

      // Lưu thông tin user và token
      const { user, token } = response.data.data;
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      setToken(token);

      return { success: true };
    } catch (error) {
      console.error("Đăng ký lỗi:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Đăng ký thất bại" + error,
      };
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    }
  };

  // Hàm tải các cuộc trò chuyện của người dùng
  const loadUserChats = async () => {
    try {
      const response = await api.get("/api/chat/conversations");
      return response.data.data;
    } catch (error) {
      console.error("Error loading chats:", error);
      return [];
    }
  };

  const resetPassword = async (formData) => {
    try {
      const response = await api.post("/api/auth/reset-password", {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Đăng ký lỗi:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Đăng ký thất bại" + error,
      };
    }
  };

  const forgotPassword = async (objData) => {
    try {
      const response = await api.post("/api/auth/forgot-password", objData);
      return response.data;
    } catch (error) {
      console.error("Forgot lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "forgotPassword thất bại" + error,
      };
    }
  };

  // Giá trị cung cấp cho các component con sử dụng context
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    handleSocialLogin,
    logout,
    loadUserChats,
    resetPassword,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
