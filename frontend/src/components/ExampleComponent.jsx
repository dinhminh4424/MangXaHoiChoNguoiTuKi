// components/ExampleComponent.jsx
import React from "react";
import notificationService from "../services/notificationService";
// Hoặc sử dụng hook: import { useNotification } from '../hooks/useNotification';

function ExampleComponent() {
  // Nếu dùng hook: const { success, error, warning, confirm, toast } = useNotification();

  const handleSuccess = () => {
    notificationService.success({
      title: "Thao tác thành công!",
      text: "Dữ liệu đã được lưu thành công.",
      confirmButtonText: "Đóng",
    });
  };

  const handleError = () => {
    notificationService
      .error({
        title: "Lỗi hệ thống",
        text: "Không thể kết nối đến máy chủ.",
        confirmButtonText: "Thử lại",
        showCancelButton: true,
        cancelButtonText: "Hủy",
      })
      .then((result) => {
        if (result.isConfirmed) {
          // Thử lại
          console.log("Thử lại...");
        }
      });
  };

  const handleConfirm = async () => {
    const result = await notificationService.confirm({
      title: "Xóa dữ liệu",
      text: "Bạn có chắc chắn muốn xóa mục này?",
      confirmText: "Xóa",
      cancelText: "Giữ lại",
    });

    if (result.isConfirmed) {
      notificationService.success({
        text: "Đã xóa thành công!",
      });
    }
  };

  const handleToast = () => {
    notificationService.toast({
      title: "Đã lưu thay đổi",
      icon: "success",
    });
  };

  const handleCustomHTML = () => {
    notificationService.custom({
      title: "Thông báo đặc biệt",
      html: `
        <div style="text-align: left;">
          <p><strong>Chi tiết:</strong></p>
          <ul>
            <li>Mục 1: Hoàn thành</li>
            <li>Mục 2: Đang xử lý</li>
            <li>Mục 3: Chờ duyệt</li>
          </ul>
        </div>
      `,
      confirmButtonText: "Hiểu rồi",
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Demo Notification Service</h2>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button className="btn btn-success" onClick={handleSuccess}>
          Thành công
        </button>

        <button className="btn btn-danger" onClick={handleError}>
          Lỗi
        </button>

        <button
          className="btn btn-warning"
          onClick={() =>
            notificationService.warning({ text: "Đây là cảnh báo!" })
          }
        >
          Cảnh báo
        </button>

        <button
          className="btn btn-info"
          onClick={() =>
            notificationService.info({ text: "Thông tin hệ thống" })
          }
        >
          Thông tin
        </button>

        <button className="btn btn-secondary" onClick={handleConfirm}>
          Xác nhận
        </button>

        <button className="btn btn-primary" onClick={handleToast}>
          Toast
        </button>

        <button className="btn btn-dark" onClick={handleCustomHTML}>
          Custom HTML
        </button>
      </div>
    </div>
  );
}

export default ExampleComponent;
