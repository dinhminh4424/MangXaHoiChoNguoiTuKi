// components/UserForm.jsx
import React, { useEffect } from "react";
import notificationService from "../services/notificationService";

function UserForm({ error, success, loading }) {
  useEffect(() => {
    if (error) {
      notificationService.error({
        title: "Lỗi đăng ký",
        text: error,
        confirmButtonText: "Thử lại",
      });
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      notificationService.success({
        title: "Đăng ký thành công!",
        text: "Tài khoản của bạn đã được tạo.",
        timer: 5000,
      });
    }
  }, [success]);

  return <></>;
}
