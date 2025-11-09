// components/todo/TodoDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from "@mui/material";
import {
  Edit,
  Delete,
  ArrowBack,
  Event,
  Schedule,
  Flag,
  Category,
  LocationOn,
} from "@mui/icons-material";
import { todoService } from "../../services/todoService";

const TodoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchTodoDetail();
  }, [id]);

  const fetchTodoDetail = async () => {
    try {
      setLoading(true);
      const response = await todoService.getTodoDetail(id);
      setTodo(response.todo);
    } catch (error) {
      showSnackbar(error.message || "Lỗi tải chi tiết công việc", "error");
      navigate("/todo/list");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleMarkComplete = async () => {
    try {
      await todoService.markComplete(id);
      showSnackbar("Đánh dấu hoàn thành thành công");
      fetchTodoDetail();
    } catch (error) {
      showSnackbar(error.message || "Lỗi cập nhật trạng thái", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await todoService.deleteTodo(id);
      showSnackbar("Xóa công việc thành công");
      navigate("/todo/list");
    } catch (error) {
      showSnackbar(error.message || "Lỗi xóa công việc", "error");
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await todoService.toggleSubtask(id, subtaskId);
      fetchTodoDetail();
    } catch (error) {
      showSnackbar(error.message || "Lỗi cập nhật công việc con", "error");
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

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa đặt";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <Typography textAlign="center" sx={{ p: 4 }}>
        Đang tải...
      </Typography>
    );
  }

  if (!todo) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Không tìm thấy công việc
        </Typography>
        <Button onClick={() => navigate("/todo/list")} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const progress =
    todo.subtasks && todo.subtasks.length > 0
      ? Math.round(
          (todo.subtasks.filter((st) => st.completed).length /
            todo.subtasks.length) *
            100
        )
      : todo.status === "done"
      ? 100
      : 0;

  return (
    <Box sx={{ maxWidth: 800, margin: "0 auto", p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => navigate("/todo/list")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">{todo.title}</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {todo.status !== "done" && (
            <Button
              variant="outlined"
              color="success"
              onClick={handleMarkComplete}
            >
              Hoàn thành
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/todo/edit/${id}`)}
          >
            Chỉnh sửa
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setOpenDeleteDialog(true)}
          >
            Xóa
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Description */}
              {todo.description && (
                <>
                  <Typography variant="h6" gutterBottom color="primary">
                    Mô tả
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: 3, whiteSpace: "pre-wrap" }}
                  >
                    {todo.description}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </>
              )}

              {/* Subtasks */}
              {todo.subtasks && todo.subtasks.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom color="primary">
                    Công việc con ({progress}% hoàn thành)
                  </Typography>
                  <List>
                    {todo.subtasks.map((subtask, index) => (
                      <ListItem
                        key={index}
                        divider={index < todo.subtasks.length - 1}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={subtask.completed}
                            onChange={() => handleToggleSubtask(subtask._id)}
                            disabled={todo.status === "done"}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                textDecoration: subtask.completed
                                  ? "line-through"
                                  : "none",
                                color: subtask.completed
                                  ? "text.secondary"
                                  : "text.primary",
                              }}
                            >
                              {subtask.title}
                            </Typography>
                          }
                          secondary={
                            subtask.completedAt &&
                            `Hoàn thành: ${formatDate(subtask.completedAt)}`
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 3 }} />
                </>
              )}

              {/* Tags */}
              {todo.tags && todo.tags.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom color="primary">
                    Tags
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}
                  >
                    {todo.tags.map((tag, index) => (
                      <Chip key={index} label={tag} variant="outlined" />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Thông tin
              </Typography>

              {/* Status and Priority */}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={todo.status}
                  color={getStatusColor(todo.status)}
                  sx={{ mb: 1, mr: 1 }}
                />
                <Chip
                  label={todo.priority}
                  color={getPriorityColor(todo.priority)}
                  sx={{ mb: 1 }}
                />
                {todo.isImportant && (
                  <Chip
                    icon={<Flag />}
                    label="Quan trọng"
                    color="warning"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                )}
              </Box>

              {/* Details */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Type */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Category color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Loại
                      </Typography>
                      <Typography variant="body2">{todo.type}</Typography>
                    </Box>
                  </Box>

                  {/* Category */}
                  {todo.category && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Category color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Danh mục
                        </Typography>
                        <Typography variant="body2">{todo.category}</Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Location */}
                  {todo.location && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Địa điểm
                        </Typography>
                        <Typography variant="body2">{todo.location}</Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Calendar Dates */}
                  {todo.start && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Event color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {todo.isAllDay ? "Ngày" : "Bắt đầu"}
                        </Typography>
                        <Typography variant="body2">
                          {todo.isAllDay
                            ? new Date(todo.start).toLocaleDateString("vi-VN")
                            : formatDate(todo.start)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {todo.end && todo.start !== todo.end && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Schedule color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {todo.isAllDay ? "Đến ngày" : "Kết thúc"}
                        </Typography>
                        <Typography variant="body2">
                          {todo.isAllDay
                            ? new Date(todo.end).toLocaleDateString("vi-VN")
                            : formatDate(todo.end)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Due Date */}
                  {todo.dueDate && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Schedule color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Hạn hoàn thành
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(todo.dueDate)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Created Date */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Schedule color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Tạo lúc
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(todo.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Updated Date */}
                  {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Schedule color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Cập nhật
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(todo.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa công việc "{todo.title}"? Hành động này
            không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
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

export default TodoDetail;
