// components/UI/EmptyState.js
import React from "react";
import "./EmptyState.css";

const EmptyState = ({ icon = "📝", title, message, action, children }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>

      {title && <h3 className="empty-title">{title}</h3>}

      {message && <p className="empty-message">{message}</p>}

      {action && <div className="empty-action">{action}</div>}

      {children}
    </div>
  );
};

export default EmptyState;
