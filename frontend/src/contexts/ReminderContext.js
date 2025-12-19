// contexts/ReminderContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const ReminderContext = createContext();

export const useReminder = () => useContext(ReminderContext);

export const ReminderProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [reminderStats, setReminderStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lấy todos sắp đến cần reminder
  const fetchUpcomingReminders = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await api.get("/api/todos/reminders/pending");

      if (response.data.success) {
        setUpcomingReminders(response.data.todos);
      }
    } catch (error) {
      console.error("Lỗi khi lấy reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thống kê
  const fetchReminderStats = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get("/api/todos/reminders/stats");

      if (response.data.success) {
        setReminderStats(response.data.stats);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
    }
  };

  // Cập nhật cài đặt reminder
  const updateReminderSettings = async (todoId, settings) => {
    try {
      const response = await api.put(
        `/api/todos/${todoId}/reminder-settings`,
        settings
      );

      if (response.data.success) {
        // Refresh data
        await fetchUpcomingReminders();
        await fetchReminderStats();
      }

      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật reminder:", error);
      throw error;
    }
  };

  // Test gửi reminder (admin only)
  const testReminder = async (todoId) => {
    try {
      const response = await api.post(`/api/todos/${todoId}/test-reminder`);
      return response.data;
    } catch (error) {
      console.error("Lỗi test reminder:", error);
      throw error;
    }
  };

  // Auto refresh khi user đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      fetchUpcomingReminders();
      fetchReminderStats();

      // Refresh mỗi 30 giây
      const interval = setInterval(() => {
        fetchUpcomingReminders();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const value = {
    upcomingReminders,
    reminderStats,
    loading,
    fetchUpcomingReminders,
    fetchReminderStats,
    updateReminderSettings,
    testReminder,
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};
