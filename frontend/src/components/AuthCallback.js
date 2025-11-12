import React, { useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Component này xử lý callback sau khi đăng nhập mạng xã hội thành công.
 * Nó lấy token và milestone từ URL, sau đó gọi hàm trong AuthContext.
 */
const AuthCallback = () => {
  const { handleSocialLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const processAuth = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const milestoneParam = params.get("milestone");

      if (token) {
        let milestone = null;
        if (milestoneParam) {
          try {
            milestone = JSON.parse(decodeURIComponent(milestoneParam));
          } catch (e) {
            console.error("Lỗi parse milestone từ URL:", e);
          }
        }
        await handleSocialLogin(token, milestone);
      }
      // Sau khi xử lý xong, điều hướng về trang chủ
      navigate("/home", { replace: true });
    };

    processAuth();
  }, [location, navigate, handleSocialLogin]);

  return <div>Đang xử lý đăng nhập...</div>;
};

export default AuthCallback;