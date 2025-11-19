// hooks/useRateLimit.js
import { useState, useEffect } from "react";
import { rateLimitService } from "../services/rateLimitService";

export const useRateLimit = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Clear messages after 3 seconds
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  // Lấy tất cả configs
  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rateLimitService.getAllConfigs();
      setConfigs(response.data);
    } catch (error) {
      setError(error.message || "Lỗi khi tải cấu hình");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật config
  const updateConfig = async (key, configData) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await rateLimitService.updateConfig(key, configData);
      setSuccess("Cập nhật thành công");
      await fetchConfigs(); // Refresh data
      clearMessages();
      return response;
    } catch (error) {
      setError(error.message || "Lỗi khi cập nhật");
      clearMessages();
      throw error;
    }
  };

  // Cập nhật hàng loạt
  const bulkUpdateConfigs = async (updatedConfigs) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await rateLimitService.bulkUpdateConfigs(updatedConfigs);
      setSuccess("Cập nhật hàng loạt thành công");
      await fetchConfigs(); // Refresh data
      clearMessages();
      return response;
    } catch (error) {
      setError(error.message || "Lỗi khi cập nhật");
      clearMessages();
      throw error;
    }
  };

  // Toggle enabled
  const toggleEnabled = async (key, enabled) => {
    const config = configs.find((c) => c.key === key);
    if (!config) return;

    try {
      await updateConfig(key, { ...config, enabled: !enabled });
    } catch (error) {
      // Error handled in updateConfig
    }
  };

  // Reset về mặc định
  const resetToDefault = async (key) => {
    const defaults = {
      postCreation: { windowMs: 300000, max: 10 },
      search: { windowMs: 60000, max: 10 },
      report: { windowMs: 600000, max: 5 },
      login: { windowMs: 900000, max: 5 },
      comment: { windowMs: 300000, max: 20 },
    };

    const config = configs.find((c) => c.key === key);
    if (!config || !defaults[key]) return;

    try {
      await updateConfig(key, {
        ...config,
        ...defaults[key],
        customMessage: "",
      });
    } catch (error) {
      // Error handled in updateConfig
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    loading,
    editingConfig,
    error,
    success,
    setEditingConfig,
    fetchConfigs,
    updateConfig,
    bulkUpdateConfigs,
    toggleEnabled,
    resetToDefault,
  };
};
