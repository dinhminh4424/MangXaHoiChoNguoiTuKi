// components/AuthCallback.js
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleSocialLogin } = useAuth();

  useEffect(() => {
    // Đọc token từ URL query
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    const processToken = async (token) => {
      // NEW: Gọi hàm từ context để cập nhật state
      const result = await handleSocialLogin(token);

      if (result.success) {
        // Đã xong, chuyển hướng về trang chủ
        navigate("/"); // Hoặc trang dashboard
      } else {
        // Có lỗi, chuyển về trang login
        navigate("/login?error=auth_failed");
      }
    };

    if (token) {
      // UPDATED: Sửa key lưu trong localStorage
      // Thay vì: localStorage.setItem("authToken", token);
      // Chúng ta gọi hàm processToken để AuthContext tự xử lý
      processToken(token);
    } else {
      // Có lỗi, chuyển về trang login
      navigate("/login?error=no_token");
    }
  }, [location, navigate, handleSocialLogin]);

  // Hiển thị một thông báo loading
  return (
    <div>
      <h2>Đang đăng nhập...</h2>
      <p>Vui lòng chờ trong giây lát.</p>
    </div>
  );
};

export default AuthCallback;
