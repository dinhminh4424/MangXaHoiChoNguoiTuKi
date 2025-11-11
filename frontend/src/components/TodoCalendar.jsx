// components/TodoCalendar.jsx
import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  FormControlLabel,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Edit, Delete, CheckCircle } from "@mui/icons-material";

const TodoCalendar = () => {
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const calendarRef = useRef();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    type: "Task",
    priority: "medium",
    isAllDay: false,
    location: "",
    tags: [],
  });

  // Fetch events từ API
  const fetchEvents = async (start, end) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/todos/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const formattedEvents = data.events.map((event) => ({
          id: event._id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.isAllDay,
          extendedProps: {
            type: event.type,
            priority: event.priority,
            location: event.location,
            description: event.description,
            status: event.status,
            color: event.color,
          },
          backgroundColor: event.color,
          borderColor: event.color,
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Lỗi fetch events:", error);
      showSnackbar("Lỗi tải sự kiện", "error");
    }
  };

  // Fetch todos
  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/todos", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos);
      }
    } catch (error) {
      console.error("Lỗi fetch todos:", error);
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    fetchEvents(start, end);
    fetchTodos();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDateSelect = (selectInfo) => {
    setFormData({
      title: "",
      description: "",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      type: "Task",
      priority: "medium",
      isAllDay: selectInfo.allDay,
      location: "",
      tags: [],
    });
    setSelectedEvent(null);
    setOpenDialog(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.extendedProps.description || "",
      start: event.startStr,
      end: event.endStr,
      type: event.extendedProps.type || "Task",
      priority: event.extendedProps.priority || "medium",
      isAllDay: event.allDay,
      location: event.extendedProps.location || "",
      tags: [],
    });
    setOpenDialog(true);
  };

  const handleCreateTodo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSnackbar("Tạo todo thành công");
        setOpenDialog(false);
        fetchEvents(new Date(), new Date()); // Refresh events
        fetchTodos(); // Refresh todos list
      } else {
        const error = await response.json();
        showSnackbar(error.message || "Lỗi tạo todo", "error");
      }
    } catch (error) {
      console.error("Lỗi tạo todo:", error);
      showSnackbar("Lỗi tạo todo", "error");
    }
  };

  const handleUpdateTodo = async () => {
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/todos/${selectedEvent.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSnackbar("Cập nhật todo thành công");
        setOpenDialog(false);
        fetchEvents(new Date(), new Date());
        fetchTodos();
      } else {
        const error = await response.json();
        showSnackbar(error.message || "Lỗi cập nhật todo", "error");
      }
    } catch (error) {
      console.error("Lỗi cập nhật todo:", error);
      showSnackbar("Lỗi cập nhật todo", "error");
    }
  };

  const handleDeleteTodo = async () => {
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/todos/${selectedEvent.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        showSnackbar("Xóa todo thành công");
        setOpenDialog(false);
        fetchEvents(new Date(), new Date());
        fetchTodos();
      } else {
        const error = await response.json();
        showSnackbar(error.message || "Lỗi xóa todo", "error");
      }
    } catch (error) {
      console.error("Lỗi xóa todo:", error);
      showSnackbar("Lỗi xóa todo", "error");
    }
  };

  const handleMarkComplete = async (todoId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/todos/${todoId}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        showSnackbar("Đánh dấu hoàn thành thành công");
        fetchTodos();
      } else {
        const error = await response.json();
        showSnackbar(error.message || "Lỗi cập nhật", "error");
      }
    } catch (error) {
      console.error("Lỗi đánh dấu hoàn thành:", error);
      showSnackbar("Lỗi cập nhật", "error");
    }
  };

  const eventContent = (eventInfo) => {
    return (
      <Box>
        <Typography variant="body2" noWrap>
          {eventInfo.timeText && `${eventInfo.timeText} - `}
          {eventInfo.event.title}
        </Typography>
        {eventInfo.event.extendedProps.priority === "high" && (
          <Chip
            label="!"
            size="small"
            color="error"
            sx={{ height: 16, fontSize: "0.6rem" }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5">Lịch Công Việc</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedEvent(null);
                    setFormData({
                      title: "",
                      description: "",
                      start: "",
                      end: "",
                      type: "Task",
                      priority: "medium",
                      isAllDay: false,
                      location: "",
                      tags: [],
                    });
                    setOpenDialog(true);
                  }}
                >
                  Thêm Todo
                </Button>
              </Box>

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                initialView="dayGridMonth"
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventContent={eventContent}
                locale={viLocale}
                height="600px"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Todo List */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Danh sách Todo
              </Typography>
              <Box sx={{ maxHeight: 600, overflow: "auto" }}>
                {todos.map((todo) => (
                  <Card
                    key={todo._id}
                    sx={{
                      mb: 1,
                      p: 2,
                      bgcolor:
                        todo.status === "done"
                          ? "action.hover"
                          : "background.paper",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            textDecoration:
                              todo.status === "done" ? "line-through" : "none",
                          }}
                        >
                          {todo.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {todo.description}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={todo.priority}
                            size="small"
                            color={
                              todo.priority === "high"
                                ? "error"
                                : todo.priority === "medium"
                                ? "warning"
                                : "default"
                            }
                          />
                          <Chip
                            label={todo.type}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                          {todo.dueDate && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              Hạn:{" "}
                              {new Date(todo.dueDate).toLocaleDateString(
                                "vi-VN"
                              )}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {todo.status !== "done" && (
                          <Button
                            size="small"
                            onClick={() => handleMarkComplete(todo._id)}
                            startIcon={<CheckCircle />}
                          >
                            Hoàn thành
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Todo Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEvent ? "Chỉnh sửa Todo" : "Thêm Todo mới"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mô tả"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Bắt đầu"
                type="datetime-local"
                value={formData.start}
                onChange={(e) =>
                  setFormData({ ...formData, start: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Kết thúc"
                type="datetime-local"
                value={formData.end}
                onChange={(e) =>
                  setFormData({ ...formData, end: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Loại</InputLabel>
                <Select
                  value={formData.type}
                  label="Loại"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <MenuItem value="Meeting">Meeting</MenuItem>
                  <MenuItem value="Business travel">Business travel</MenuItem>
                  <MenuItem value="Personal Work">Personal Work</MenuItem>
                  <MenuItem value="Team Project">Team Project</MenuItem>
                  <MenuItem value="Appointment">Appointment</MenuItem>
                  <MenuItem value="Task">Task</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Ưu tiên</InputLabel>
                <Select
                  value={formData.priority}
                  label="Ưu tiên"
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa điểm"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isAllDay}
                    onChange={(e) =>
                      setFormData({ ...formData, isAllDay: e.target.checked })
                    }
                  />
                }
                label="Cả ngày"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {selectedEvent && (
            <Button onClick={handleDeleteTodo} color="error">
              <Delete /> Xóa
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button
            onClick={selectedEvent ? handleUpdateTodo : handleCreateTodo}
            variant="contained"
            disabled={!formData.title}
          >
            {selectedEvent ? "Cập nhật" : "Tạo"}
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

export default TodoCalendar;
