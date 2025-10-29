// components/UI/Alert.js
import React from "react";
import { X } from "lucide-react";
import "./Alert.css";

const Alert = ({
  variant = "info",
  message,
  onClose,
  children,
  className = "",
  dismissible = false,
}) => {
  const alertClass = `alert alert-${variant} ${
    dismissible ? "alert-dismissible" : ""
  } ${className}`;

  return (
    <div className={alertClass} role="alert">
      {message || children}

      {dismissible && onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// Export default thay vì named export
export default Alert;
