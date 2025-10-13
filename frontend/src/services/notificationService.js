// services/notificationService.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

class NotificationService {
  // Cấu hình mặc định
  defaultConfig = {
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "OK",
    showCloseButton: true,
    backdrop: true,
    allowOutsideClick: false,
  };

  // Thành công
  success({ title = "Thành công!", text = "", html = "", ...config } = {}) {
    return MySwal.fire({
      ...this.defaultConfig,
      icon: "success",
      title,
      text,
      html,
      confirmButtonColor: "#28a745",
      timer: 3000,
      timerProgressBar: true,
      ...config,
    });
  }

  // Lỗi
  error({ title = "Lỗi!", text = "", html = "", ...config } = {}) {
    return MySwal.fire({
      ...this.defaultConfig,
      icon: "error",
      title,
      text,
      html,
      confirmButtonColor: "#dc3545",
      ...config,
    });
  }

  // Cảnh báo
  warning({ title = "Cảnh báo!", text = "", html = "", ...config } = {}) {
    return MySwal.fire({
      ...this.defaultConfig,
      icon: "warning",
      title,
      text,
      html,
      confirmButtonColor: "#ffc107",
      ...config,
    });
  }

  // Thông tin
  info({ title = "Thông tin!", text = "", html = "", ...config } = {}) {
    return MySwal.fire({
      ...this.defaultConfig,
      icon: "info",
      title,
      text,
      html,
      confirmButtonColor: "#17a2b8",
      ...config,
    });
  }

  // Câu hỏi/Xác nhận
  confirm({
    title = "Bạn có chắc chắn?",
    text = "",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    ...config
  } = {}) {
    return MySwal.fire({
      ...this.defaultConfig,
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      ...config,
    });
  }

  // Toast thông báo
  toast({
    title = "",
    icon = "success",
    position = "top-end",
    ...config
  } = {}) {
    return MySwal.fire({
      title,
      icon,
      position,
      toast: true,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
      ...config,
    });
  }

  // Custom với HTML
  custom({ html, ...config } = {}) {
    return MySwal.fire({
      ...this.defaultConfig,
      html,
      ...config,
    });
  }

  // Đóng tất cả thông báo
  close() {
    MySwal.close();
  }
}

export default new NotificationService();
