// components/UI/Modal.js
import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = "",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content modal-${size} ${className}`}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {showCloseButton && (
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
