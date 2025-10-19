// components/UI/Button.js
import React from "react";
import "./Button.css";

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  type = "button",
  onClick,
  className = "",
  ...props
}) => {
  const getButtonClass = () => {
    return `btn btn-${variant} btn-${size} ${
      loading ? "btn-loading" : ""
    } ${className}`.trim();
  };

  return (
    <button
      type={type}
      className={getButtonClass()}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="btn-spinner">
          <div className="spinner"></div>
        </div>
      )}
      <span className="btn-content">{children}</span>
    </button>
  );
};

export default Button;
