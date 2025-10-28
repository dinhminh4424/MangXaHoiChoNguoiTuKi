import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * ProtectedAdminRoute Component
 * Chỉ cho phép user có role "admin" truy cập
 */
const ProtectedAdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Nếu chưa đăng nhập, chuyển về trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Nếu đã đăng nhập nhưng không phải admin, chuyển về trang chủ
  if (user?.role !== "admin") {
    return <Navigate to="/home" />;
  }

  // Nếu là admin, hiển thị nội dung
  return children;
};

export default ProtectedAdminRoute;
