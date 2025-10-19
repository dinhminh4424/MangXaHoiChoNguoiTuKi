// components/UI/Loader.js
import React from "react";

const Loader = ({
  message = "Đang tải...",
  size = "medium",
  centered = true,
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case "small":
        return "spinner-border-sm";
      case "large":
        return "";
      default:
        return "";
    }
  };

  const containerClass = centered
    ? "d-flex flex-column align-items-center justify-content-center"
    : "";

  return (
    <div className={`${containerClass} p-4`}>
      <div
        className={`spinner-border ${getSpinnerSize()} text-primary`}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="mt-2 mb-0 text-muted small">{message}</p>}
    </div>
  );
};

// Export default thay vì named export
export default Loader;
