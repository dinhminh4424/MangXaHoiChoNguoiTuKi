// components/todo/TodoList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Visibility,
  Event,
  FilterList,
  Search,
} from "@mui/icons-material";
import { todoService } from "../../services/todoService";

const TodoList = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    type: "",
    search: "",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchTodos();
  }, [filters]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;

      const response = await todoService.getTodos(params);
      setTodos(response.todos);
    } catch (error) {
      showSnackbar(error.message || "Lỗi tải danh sách công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleMarkComplete = async (todoId) => {
    try {
      await todoService.markComplete(todoId);
      showSnackbar("Đánh dấu hoàn thành thành công");
      fetchTodos();
    } catch (error) {
      showSnackbar(error.message || "Lỗi cập nhật trạng thái", "error");
    }
  };

  const handleDeleteClick = (todo) => {
    setTodoToDelete(todo);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!todoToDelete) return;

    try {
      await todoService.deleteTodo(todoToDelete._id);
      showSnackbar("Xóa công việc thành công");
      setOpenDeleteDialog(false);
      setTodoToDelete(null);
      fetchTodos();
    } catch (error) {
      showSnackbar(error.message || "Lỗi xóa công việc", "error");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "success";
      case "in-progress":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "primary";
    }
  };

  const getProgress = (todo) => {
    if (todo.status === "done") return 100;
    if (todo.subtasks && todo.subtasks.length > 0) {
      const completed = todo.subtasks.filter((st) => st.completed).length;
      return Math.round((completed / todo.subtasks.length) * 100);
    }
    return 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Danh Sách Công Việc</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/todo/calendar")}
            startIcon={<Event />}
          >
            Lịch
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/todo/create")}
            startIcon={<Add />}
          >
            Thêm Công Việc
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Tìm kiếm"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <Search sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status}
                  label="Trạng thái"
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="scheduled">Đã lên lịch</MenuItem>
                  <MenuItem value="in-progress">Đang thực hiện</MenuItem>
                  <MenuItem value="done">Hoàn thành</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Ưu tiên</InputLabel>
                <Select
                  value={filters.priority}
                  label="Ưu tiên"
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại</InputLabel>
                <Select
                  value={filters.type}
                  label="Loại"
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="Meeting">Meeting</MenuItem>
                  <MenuItem value="Business travel">Công tác</MenuItem>
                  <MenuItem value="Personal Work">Cá nhân</MenuItem>
                  <MenuItem value="Team Project">Dự án nhóm</MenuItem>
                  <MenuItem value="Appointment">Cuộc hẹn</MenuItem>
                  <MenuItem value="Task">Công việc</MenuItem>
                  <MenuItem value="Other">Khác</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() =>
                  setFilters({
                    status: "",
                    priority: "",
                    type: "",
                    search: "",
                  })
                }
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Todo List */}
      {loading ? (
        <Typography textAlign="center" sx={{ py: 4 }}>
          Đang tải...
        </Typography>
      ) : todos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không có công việc nào
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {filters.status ||
            filters.priority ||
            filters.type ||
            filters.search
              ? "Thử thay đổi bộ lọc để xem nhiều kết quả hơn"
              : "Bắt đầu bằng cách tạo công việc đầu tiên của bạn"}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/todo/create")}
            startIcon={<Add />}
          >
            Tạo Công Việc Đầu Tiên
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {todos.map((todo) => (
            <Grid item xs={12} key={todo._id}>
              <Card
                sx={{
                  p: 2,
                  border: todo.isImportant ? "2px solid" : "1px solid",
                  borderColor: todo.isImportant ? "warning.main" : "divider",
                  bgcolor:
                    todo.status === "done"
                      ? "action.hover"
                      : "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  {/* Checkbox */}
                  <Box sx={{ mt: 0.5 }}>
                    <Checkbox
                      checked={todo.status === "done"}
                      onChange={() => handleMarkComplete(todo._id)}
                      color="success"
                    />
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          textDecoration:
                            todo.status === "done" ? "line-through" : "none",
                          fontWeight: todo.isImportant ? "bold" : "normal",
                        }}
                      >
                        {todo.title}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/todo/${todo._id}`)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/todo/edit/${todo._id}`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(todo)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {todo.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {todo.description}
                      </Typography>
                    )}

                    {/* Tags and Info */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={todo.priority}
                        size="small"
                        color={getPriorityColor(todo.priority)}
                      />
                      <Chip label={todo.type} size="small" variant="outlined" />
                      <Chip
                        label={todo.status}
                        size="small"
                        color={getStatusColor(todo.status)}
                      />

                      {todo.hasCalendarEvent && (
                        <Tooltip title="Có trong lịch">
                          <Chip
                            icon={<Event fontSize="small" />}
                            label="Lịch"
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </Box>

                    {/* Dates and Progress */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 2 }}>
                        {todo.dueDate && (
                          <Typography variant="caption" color="text.secondary">
                            Hạn:{" "}
                            {new Date(todo.dueDate).toLocaleDateString("vi-VN")}
                          </Typography>
                        )}

                        {todo.start && (
                          <Typography variant="caption" color="text.secondary">
                            Bắt đầu:{" "}
                            {new Date(todo.start).toLocaleDateString("vi-VN")}
                          </Typography>
                        )}
                      </Box>

                      {todo.subtasks && todo.subtasks.length > 0 && (
                        <Typography variant="caption" color="primary">
                          Tiến độ: {getProgress(todo)}%
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa công việc "{todoToDelete?.title}"? Hành
            động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TodoList;
