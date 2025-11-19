// pages/AdminSecurity.js
import React from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { useRateLimit } from "../../../hooks/useRateLimit";
import ConfigCard from "../../../components/admin/rateLimit/ConfigCard";
import EditModal from "../../../components/admin/rateLimit/EditModal";

const AdminSecurity = () => {
  const {
    configs,
    loading,
    editingConfig,
    setEditingConfig,
    fetchConfigs,
    updateConfig,
    toggleEnabled,
    resetToDefault,
  } = useRateLimit();

  const handleSaveConfig = async (key, configData) => {
    try {
      await updateConfig(key, configData);
      setEditingConfig(null);
    } catch (error) {
      // Error handled in service
    }
  };

  const enabledCount = configs.filter((c) => c.enabled).length;
  const totalCount = configs.length;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <i className="bi bi-shield-lock fs-1 text-primary me-3"></i>
          <div>
            <h1 className="h2 fw-bold mb-0">Quản lý Rate Limit</h1>
            <p className="text-muted mb-0">
              Cấu hình giới hạn request cho các tính năng hệ thống
            </p>
          </div>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={fetchConfigs}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-primary fw-bold">{totalCount}</h3>
              <p className="text-muted mb-0">Tổng số cấu hình</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-success fw-bold">{enabledCount}</h3>
              <p className="text-muted mb-0">Đang kích hoạt</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-secondary fw-bold">
                {totalCount - enabledCount}
              </h3>
              <p className="text-muted mb-0">Đã tắt</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-info fw-bold">
                {Math.round((enabledCount / totalCount) * 100)}%
              </h3>
              <p className="text-muted mb-0">Tỷ lệ kích hoạt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Config Grid */}
      {!loading && configs.length > 0 && (
        <div className="row g-3">
          {configs.map((config) => (
            <div key={config.key} className="col-xl-4 col-lg-6 col-md-6">
              <ConfigCard
                config={config}
                onEdit={setEditingConfig}
                onToggle={toggleEnabled}
                onReset={resetToDefault}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && configs.length === 0 && (
        <div className="alert alert-info text-center">
          <i className="bi bi-info-circle me-2"></i>
          Chưa có cấu hình rate limit nào. Hãy tạo cấu hình mới.
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        open={!!editingConfig}
        config={editingConfig}
        onClose={() => setEditingConfig(null)}
        onSave={handleSaveConfig}
        loading={loading}
      />
    </div>
  );
};

export default AdminSecurity;
