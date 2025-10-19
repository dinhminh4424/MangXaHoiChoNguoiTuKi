// components/UI/ConfirmModal.js
import React from "react";
import { X, AlertTriangle } from "lucide-react";
import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "default",
  loading = false,
}) => {
  if (!isOpen) return null;

  const getVariantClass = () => {
    switch (variant) {
      case "danger":
        return "confirm-danger";
      case "warning":
        return "confirm-warning";
      default:
        return "confirm-default";
    }
  };

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle size={24} className="text-danger" />;
      case "warning":
        return <AlertTriangle size={24} className="text-warning" />;
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-modal">
        <div className="modal-header">
          <div className="modal-title-wrapper">
            {getIcon()}
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`btn ${
              variant === "danger" ? "btn-danger" : "btn-primary"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
