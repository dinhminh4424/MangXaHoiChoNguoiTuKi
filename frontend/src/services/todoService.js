// services/todoService.js
import api from "./api";

export const todoService = {
  // Lấy danh sách todos với filter
  getTodos: async (params = {}) => {
    try {
      const response = await api.get("/api/todos", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy sự kiện calendar
  getCalendarEvents: async (start, end) => {
    try {
      const response = await api.get("/api/todos/calendar-events", {
        params: { start: start.toISOString(), end: end.toISOString() },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tạo todo mới
  createTodo: async (todoData) => {
    try {
      const response = await api.post("/api/todos", todoData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Chi tiết todo
  getTodoDetail: async (id) => {
    try {
      const response = await api.get(`/api/todos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật todo
  updateTodo: async (id, todoData) => {
    try {
      const response = await api.put(`/api/todos/${id}`, todoData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa todo
  deleteTodo: async (id) => {
    try {
      const response = await api.delete(`/api/todos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Đánh dấu hoàn thành
  markComplete: async (id) => {
    try {
      const response = await api.put(`/api/todos/${id}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Thêm vào lịch
  addToCalendar: async (id, calendarData) => {
    try {
      const response = await api.put(
        `/api/todos/${id}/add-to-calendar`,
        calendarData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa khỏi lịch
  removeFromCalendar: async (id) => {
    try {
      const response = await api.put(`/api/todos/${id}/remove-from-calendar`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Thêm subtask
  addSubtask: async (id, title) => {
    try {
      const response = await api.post(`/api/todos/${id}/subtasks`, { title });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle subtask
  toggleSubtask: async (id, subtaskId) => {
    try {
      const response = await api.put(
        `/api/todos/${id}/subtasks/${subtaskId}/toggle`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa subtask
  deleteSubtask: async (id, subtaskId) => {
    try {
      const response = await api.delete(
        `/api/todos/${id}/subtasks/${subtaskId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa tất cả subtasks
  deleteAllSubtasks: async (id) => {
    try {
      const response = await api.delete(`/api/todos/${id}/subtasks`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  // Lấy công việc hôm nay
  getTodayTodos: async (params = {}) => {
    try {
      const response = await api.get("/api/todos/today/todos", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy thống kê công việc
  getTodoStats: async (period = "today") => {
    try {
      const response = await api.get("/api/todos/stats/overview", {
        params: { period },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy công việc sắp tới (7 ngày tới)
  getUpcomingTodos: async (days = 7) => {
    try {
      const response = await api.get("/api/todos/upcoming/todos", {
        params: { days },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy công việc quan trọng
  getImportantTodos: async (params = {}) => {
    try {
      const response = await api.get("/api/todos/important/todos", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
