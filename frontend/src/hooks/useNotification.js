// hooks/useNotification.js
import { useCallback } from "react";
import notificationService from "../services/notificationService";

export const useNotification = () => {
  const success = useCallback(({ title, text, html, ...config } = {}) => {
    return notificationService.success({ title, text, html, ...config });
  }, []);

  const error = useCallback(({ title, text, html, ...config } = {}) => {
    return notificationService.error({ title, text, html, ...config });
  }, []);

  const warning = useCallback(({ title, text, html, ...config } = {}) => {
    return notificationService.warning({ title, text, html, ...config });
  }, []);

  const info = useCallback(({ title, text, html, ...config } = {}) => {
    return notificationService.info({ title, text, html, ...config });
  }, []);

  const confirm = useCallback(
    ({ title, text, confirmText, cancelText, ...config } = {}) => {
      return notificationService.confirm({
        title,
        text,
        confirmText,
        cancelText,
        ...config,
      });
    },
    []
  );

  const toast = useCallback(({ title, icon, position, ...config } = {}) => {
    return notificationService.toast({ title, icon, position, ...config });
  }, []);

  return {
    success,
    error,
    warning,
    info,
    confirm,
    toast,
    close: notificationService.close,
  };
};
