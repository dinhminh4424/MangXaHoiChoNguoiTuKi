// components/rateLimit/ConfigCard.js
import React from "react";

const ConfigCard = ({ config, onEdit, onToggle, onReset }) => {
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes} phút${seconds > 0 ? ` ${seconds} giây` : ""}`;
    }
    return `${seconds} giây`;
  };

  return (
    <div className="card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="card-title mb-0">{config.name}</h5>
          <span
            className={`badge bg-${config.enabled ? "success" : "secondary"}`}
          >
            {config.enabled ? "Đang bật" : "Đã tắt"}
          </span>
        </div>

        <p className="card-text text-muted small">{config.description}</p>

        <div className="mt-auto">
          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">Thời gian:</small>
            <small className="fw-bold">{formatTime(config.windowMs)}</small>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">Số lần tối đa:</small>
            <small className="fw-bold">{config.max}</small>
          </div>

          {config.skipRoles && config.skipRoles.length > 0 && (
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">Bỏ qua role:</small>
              <div>
                {config.skipRoles.map((role) => (
                  <span
                    key={role}
                    className="badge bg-light text-dark border me-1"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {config.customMessage && (
            <div className="mb-2">
              <small className="text-muted d-block">Tin nhắn tùy chỉnh:</small>
              <small className="fst-italic">"{config.customMessage}"</small>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer d-flex justify-content-between align-items-center">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            checked={config.enabled}
            onChange={() => onToggle(config.key, config.enabled)}
            style={{ cursor: "pointer" }}
          />
          <label className="form-check-label small">
            {config.enabled ? "Đang bật" : "Đã tắt"}
          </label>
        </div>

        <div>
          <button
            className="btn btn-sm btn-outline-warning me-1"
            onClick={() => onReset(config.key)}
            title="Đặt lại mặc định"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onEdit(config)}
            title="Chỉnh sửa"
          >
            <i className="bi bi-pencil"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigCard;
