// // components/todo/TodoList.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   TextField,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Chip,
//   IconButton,
//   Tooltip,
//   Grid,
//   Paper,
//   Checkbox,
//   FormControlLabel,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import {
//   Add,
//   Edit,
//   Delete,
//   CheckCircle,
//   Visibility,
//   Event,
//   FilterList,
//   Search,
// } from "@mui/icons-material";
// import { todoService } from "../../services/todoService";

// const TodoList = () => {
//   const navigate = useNavigate();
//   const [todos, setTodos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState({
//     status: "",
//     priority: "",
//     type: "",
//     search: "",
//   });
//   const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//   const [todoToDelete, setTodoToDelete] = useState(null);
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   useEffect(() => {
//     fetchTodos();
//   }, [filters]);

//   const fetchTodos = async () => {
//     try {
//       setLoading(true);
//       const params = {};
//       if (filters.status) params.status = filters.status;
//       if (filters.priority) params.priority = filters.priority;
//       if (filters.type) params.type = filters.type;
//       if (filters.search) params.search = filters.search;

//       const response = await todoService.getTodos(params);
//       setTodos(response.todos);
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi tải danh sách công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showSnackbar = (message, severity = "success") => {
//     setSnackbar({ open: true, message, severity });
//   };

//   const handleMarkComplete = async (todoId) => {
//     try {
//       await todoService.markComplete(todoId);
//       showSnackbar("Đánh dấu hoàn thành thành công");
//       fetchTodos();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi cập nhật trạng thái", "error");
//     }
//   };

//   const handleDeleteClick = (todo) => {
//     setTodoToDelete(todo);
//     setOpenDeleteDialog(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!todoToDelete) return;

//     try {
//       await todoService.deleteTodo(todoToDelete._id);
//       showSnackbar("Xóa công việc thành công");
//       setOpenDeleteDialog(false);
//       setTodoToDelete(null);
//       fetchTodos();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi xóa công việc", "error");
//     }
//   };

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case "high":
//         return "error";
//       case "medium":
//         return "warning";
//       case "low":
//         return "success";
//       default:
//         return "default";
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "done":
//         return "success";
//       case "in-progress":
//         return "warning";
//       case "cancelled":
//         return "error";
//       default:
//         return "primary";
//     }
//   };

//   const getProgress = (todo) => {
//     if (todo.status === "done") return 100;
//     if (todo.subtasks && todo.subtasks.length > 0) {
//       const completed = todo.subtasks.filter((st) => st.completed).length;
//       return Math.round((completed / todo.subtasks.length) * 100);
//     }
//     return 0;
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//       {/* Header */}
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           mb: 3,
//         }}
//       >
//         <Typography variant="h4">Danh Sách Công Việc</Typography>
//         <Box sx={{ display: "flex", gap: 1 }}>
//           <Button
//             variant="outlined"
//             onClick={() => navigate("/todo/calendar")}
//             startIcon={<Event />}
//           >
//             Lịch
//           </Button>
//           <Button
//             variant="contained"
//             onClick={() => navigate("/todo/create")}
//             startIcon={<Add />}
//           >
//             Thêm Công Việc
//           </Button>
//         </Box>
//       </Box>

//       {/* Filters */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent>
//           <Grid container spacing={2} alignItems="center">
//             <Grid item xs={12} sm={6} md={3}>
//               <TextField
//                 fullWidth
//                 size="small"
//                 label="Tìm kiếm"
//                 value={filters.search}
//                 onChange={(e) =>
//                   setFilters({ ...filters, search: e.target.value })
//                 }
//                 InputProps={{
//                   startAdornment: (
//                     <Search sx={{ color: "text.secondary", mr: 1 }} />
//                   ),
//                 }}
//               />
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Trạng thái</InputLabel>
//                 <Select
//                   value={filters.status}
//                   label="Trạng thái"
//                   onChange={(e) =>
//                     setFilters({ ...filters, status: e.target.value })
//                   }
//                 >
//                   <MenuItem value="">Tất cả</MenuItem>
//                   <MenuItem value="scheduled">Đã lên lịch</MenuItem>
//                   <MenuItem value="in-progress">Đang thực hiện</MenuItem>
//                   <MenuItem value="done">Hoàn thành</MenuItem>
//                   <MenuItem value="cancelled">Đã hủy</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Ưu tiên</InputLabel>
//                 <Select
//                   value={filters.priority}
//                   label="Ưu tiên"
//                   onChange={(e) =>
//                     setFilters({ ...filters, priority: e.target.value })
//                   }
//                 >
//                   <MenuItem value="">Tất cả</MenuItem>
//                   <MenuItem value="low">Thấp</MenuItem>
//                   <MenuItem value="medium">Trung bình</MenuItem>
//                   <MenuItem value="high">Cao</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Loại</InputLabel>
//                 <Select
//                   value={filters.type}
//                   label="Loại"
//                   onChange={(e) =>
//                     setFilters({ ...filters, type: e.target.value })
//                   }
//                 >
//                   <MenuItem value="">Tất cả</MenuItem>
//                   <MenuItem value="Meeting">Meeting</MenuItem>
//                   <MenuItem value="Business travel">Công tác</MenuItem>
//                   <MenuItem value="Personal Work">Cá nhân</MenuItem>
//                   <MenuItem value="Team Project">Dự án nhóm</MenuItem>
//                   <MenuItem value="Appointment">Cuộc hẹn</MenuItem>
//                   <MenuItem value="Task">Công việc</MenuItem>
//                   <MenuItem value="Other">Khác</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//               <Button
//                 fullWidth
//                 variant="outlined"
//                 startIcon={<FilterList />}
//                 onClick={() =>
//                   setFilters({
//                     status: "",
//                     priority: "",
//                     type: "",
//                     search: "",
//                   })
//                 }
//               >
//                 Xóa bộ lọc
//               </Button>
//             </Grid>
//           </Grid>
//         </CardContent>
//       </Card>

//       {/* Todo List */}
//       {loading ? (
//         <Typography textAlign="center" sx={{ py: 4 }}>
//           Đang tải...
//         </Typography>
//       ) : todos.length === 0 ? (
//         <Paper sx={{ p: 4, textAlign: "center" }}>
//           <Typography variant="h6" color="text.secondary" gutterBottom>
//             Không có công việc nào
//           </Typography>
//           <Typography color="text.secondary" sx={{ mb: 2 }}>
//             {filters.status ||
//             filters.priority ||
//             filters.type ||
//             filters.search
//               ? "Thử thay đổi bộ lọc để xem nhiều kết quả hơn"
//               : "Bắt đầu bằng cách tạo công việc đầu tiên của bạn"}
//           </Typography>
//           <Button
//             variant="contained"
//             onClick={() => navigate("/todo/create")}
//             startIcon={<Add />}
//           >
//             Tạo Công Việc Đầu Tiên
//           </Button>
//         </Paper>
//       ) : (
//         <Grid container spacing={2}>
//           {todos.map((todo) => (
//             <Grid item xs={12} key={todo._id}>
//               <Card
//                 sx={{
//                   p: 2,
//                   border: todo.isImportant ? "2px solid" : "1px solid",
//                   borderColor: todo.isImportant ? "warning.main" : "divider",
//                   bgcolor:
//                     todo.status === "done"
//                       ? "action.hover"
//                       : "background.paper",
//                 }}
//               >
//                 <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
//                   {/* Checkbox */}
//                   <Box sx={{ mt: 0.5 }}>
//                     <Checkbox
//                       checked={todo.status === "done"}
//                       onChange={() => handleMarkComplete(todo._id)}
//                       color="success"
//                     />
//                   </Box>

//                   {/* Content */}
//                   <Box sx={{ flex: 1 }}>
//                     <Box
//                       sx={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "flex-start",
//                         mb: 1,
//                       }}
//                     >
//                       <Typography
//                         variant="h6"
//                         sx={{
//                           textDecoration:
//                             todo.status === "done" ? "line-through" : "none",
//                           fontWeight: todo.isImportant ? "bold" : "normal",
//                         }}
//                       >
//                         {todo.title}
//                       </Typography>

//                       <Box sx={{ display: "flex", gap: 0.5 }}>
//                         <Tooltip title="Xem chi tiết">
//                           <IconButton
//                             size="small"
//                             onClick={() => navigate(`/todo/${todo._id}`)}
//                           >
//                             <Visibility fontSize="small" />
//                           </IconButton>
//                         </Tooltip>

//                         <Tooltip title="Chỉnh sửa">
//                           <IconButton
//                             size="small"
//                             onClick={() => navigate(`/todo/edit/${todo._id}`)}
//                           >
//                             <Edit fontSize="small" />
//                           </IconButton>
//                         </Tooltip>

//                         <Tooltip title="Xóa">
//                           <IconButton
//                             size="small"
//                             onClick={() => handleDeleteClick(todo)}
//                             color="error"
//                           >
//                             <Delete fontSize="small" />
//                           </IconButton>
//                         </Tooltip>
//                       </Box>
//                     </Box>

//                     {todo.description && (
//                       <Typography
//                         variant="body2"
//                         color="text.secondary"
//                         sx={{ mb: 2 }}
//                       >
//                         {todo.description}
//                       </Typography>
//                     )}

//                     {/* Tags and Info */}
//                     <Box
//                       sx={{
//                         display: "flex",
//                         flexWrap: "wrap",
//                         gap: 1,
//                         alignItems: "center",
//                         mb: 1,
//                       }}
//                     >
//                       <Chip
//                         label={todo.priority}
//                         size="small"
//                         color={getPriorityColor(todo.priority)}
//                       />
//                       <Chip label={todo.type} size="small" variant="outlined" />
//                       <Chip
//                         label={todo.status}
//                         size="small"
//                         color={getStatusColor(todo.status)}
//                       />

//                       {todo.hasCalendarEvent && (
//                         <Tooltip title="Có trong lịch">
//                           <Chip
//                             icon={<Event fontSize="small" />}
//                             label="Lịch"
//                             size="small"
//                             variant="outlined"
//                           />
//                         </Tooltip>
//                       )}
//                     </Box>

//                     {/* Dates and Progress */}
//                     <Box
//                       sx={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                       }}
//                     >
//                       <Box sx={{ display: "flex", gap: 2 }}>
//                         {todo.dueDate && (
//                           <Typography variant="caption" color="text.secondary">
//                             Hạn:{" "}
//                             {new Date(todo.dueDate).toLocaleDateString("vi-VN")}
//                           </Typography>
//                         )}

//                         {todo.start && (
//                           <Typography variant="caption" color="text.secondary">
//                             Bắt đầu:{" "}
//                             {new Date(todo.start).toLocaleDateString("vi-VN")}
//                           </Typography>
//                         )}
//                       </Box>

//                       {todo.subtasks && todo.subtasks.length > 0 && (
//                         <Typography variant="caption" color="primary">
//                           Tiến độ: {getProgress(todo)}%
//                         </Typography>
//                       )}
//                     </Box>
//                   </Box>
//                 </Box>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>
//       )}

//       {/* Delete Confirmation Dialog */}
//       <Dialog
//         open={openDeleteDialog}
//         onClose={() => setOpenDeleteDialog(false)}
//       >
//         <DialogTitle>Xác nhận xóa</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Bạn có chắc chắn muốn xóa công việc "{todoToDelete?.title}"? Hành
//             động này không thể hoàn tác.
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
//           <Button
//             onClick={handleDeleteConfirm}
//             color="error"
//             variant="contained"
//           >
//             Xóa
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Snackbar */}
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={6000}
//         onClose={() => setSnackbar({ ...snackbar, open: false })}
//       >
//         <Alert
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//           severity={snackbar.severity}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default TodoList;

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
  LinearProgress,
  Avatar,
  AvatarGroup,
  Badge,
  CardActionArea,
  alpha,
  useTheme,
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
  Flag,
  Schedule,
  Today,
  PriorityHigh,
  WorkspacePremium,
  Circle,
  MoreVert,
} from "@mui/icons-material";
import { todoService } from "../../services/todoService";

const TodoList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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

  const isOverdue = (todo) => {
    if (!todo) return false;

    const now = new Date();
    const endDate = todo.end
      ? new Date(todo.end)
      : todo.dueDate
      ? new Date(todo.dueDate)
      : null;

    // Nếu không có endDate hoặc dueDate thì không thể xác định quá hạn
    if (!endDate) return false;

    const overdue = endDate < now && todo.status !== "done";

    if (overdue) {
      console.log("🔴 Quá hạn:", todo.title);
    }

    return overdue;
  };

  const getTypeIcon = (type) => {
    const icons = {
      Meeting: "👥",
      "Business travel": "✈️",
      "Personal Work": "👤",
      "Team Project": "👨‍👩‍👧‍👦",
      Appointment: "📅",
      Task: "📝",
      Other: "📌",
    };
    return icons[type] || "📌";
  };

  const PriorityFlag = ({ priority }) => (
    <Flag
      sx={{
        color:
          priority === "high"
            ? "#ff4444"
            : priority === "medium"
            ? "#ffaa00"
            : "#00c853",
        fontSize: 16,
      }}
    />
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📋 Danh Sách Công Việc
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý và theo dõi tất cả công việc của bạn
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/todo/calendar")}
            startIcon={<Event />}
            sx={{ borderRadius: 2 }}
          >
            Xem Lịch
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/todo/create")}
            startIcon={<Add />}
            sx={{
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            Tạo Công Việc
          </Button>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              textAlign: "center",
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )}, ${alpha(theme.palette.primary.light, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="primary">
              {todos.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng công việc
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              textAlign: "center",
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.1
              )}, ${alpha(theme.palette.success.light, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {todos.filter((t) => t.status === "done").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đã hoàn thành
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              textAlign: "center",
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.warning.main,
                0.1
              )}, ${alpha(theme.palette.warning.light, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {todos.filter((t) => t.priority === "high").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ưu tiên cao
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              textAlign: "center",
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.error.main,
                0.1
              )}, ${alpha(theme.palette.error.light, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {todos.filter((t) => isOverdue(t)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quá hạn
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      {/* Filters */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          background: "linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "primary.main",
            }}
          >
            <FilterList />
            BỘ LỌC & TÌM KIẾM
          </Typography>

          <Grid container spacing={3} alignItems="flex-end">
            {/* Tìm kiếm - Làm lớn hơn */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  sx={{ mb: 1, color: "text.primary" }}
                >
                  🔍 TÌM KIẾM CÔNG VIỆC
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  placeholder="Nhập tiêu đề, mô tả hoặc từ khóa..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <Search
                        sx={{
                          color: "primary.main",
                          mr: 2,
                          fontSize: 24,
                        }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      fontSize: "16px",
                      height: "56px",
                      backgroundColor: "white",
                      "&:hover": {
                        backgroundColor: "grey.50",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "16px",
                    },
                  }}
                />
              </FormControl>
            </Grid>

            {/* Bộ lọc trạng thái */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{ mb: 1, color: "text.primary" }}
                >
                  📊 TRẠNG THÁI
                </Typography>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  sx={{
                    borderRadius: 2,
                    height: "56px",
                    backgroundColor: "white",
                    "& .MuiSelect-select": {
                      fontSize: "14px",
                      fontWeight: "500",
                    },
                  }}
                >
                  <MenuItem value="">TẤT CẢ</MenuItem>
                  <MenuItem value="scheduled">📅 Đã lên lịch</MenuItem>
                  <MenuItem value="in-progress">🔄 Đang thực hiện</MenuItem>
                  <MenuItem value="done">✅ Hoàn thành</MenuItem>
                  <MenuItem value="cancelled">❌ Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Bộ lọc ưu tiên */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{ mb: 1, color: "text.primary" }}
                >
                  🚀 MỨC ƯU TIÊN
                </Typography>
                <Select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                  sx={{
                    borderRadius: 2,
                    height: "56px",
                    backgroundColor: "white",
                    "& .MuiSelect-select": {
                      fontSize: "14px",
                      fontWeight: "500",
                    },
                  }}
                >
                  <MenuItem value="">TẤT CẢ</MenuItem>
                  <MenuItem value="low">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "success.main",
                        }}
                      />
                      <span>Thấp</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "warning.main",
                        }}
                      />
                      <span>Trung bình</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="high">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "error.main",
                        }}
                      />
                      <span>Cao</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Bộ lọc loại công việc */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{ mb: 1, color: "text.primary" }}
                >
                  📝 LOẠI CÔNG VIỆC
                </Typography>
                <Select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                  sx={{
                    borderRadius: 2,
                    height: "56px",
                    backgroundColor: "white",
                    "& .MuiSelect-select": {
                      fontSize: "14px",
                      fontWeight: "500",
                    },
                  }}
                >
                  <MenuItem value="">TẤT CẢ</MenuItem>
                  <MenuItem value="Meeting">👥 Meeting</MenuItem>
                  <MenuItem value="Business travel">✈️ Công tác</MenuItem>
                  <MenuItem value="Personal Work">👤 Cá nhân</MenuItem>
                  <MenuItem value="Team Project">👨‍👩‍👧‍👦 Dự án nhóm</MenuItem>
                  <MenuItem value="Appointment">📅 Cuộc hẹn</MenuItem>
                  <MenuItem value="Task">📝 Công việc</MenuItem>
                  <MenuItem value="Other">📌 Khác</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Nút đặt lại */}
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList sx={{ fontSize: 20 }} />}
                onClick={() =>
                  setFilters({
                    status: "",
                    priority: "",
                    type: "",
                    search: "",
                  })
                }
                sx={{
                  borderRadius: 2,
                  height: "56px",
                  fontSize: "15px",
                  fontWeight: "600",
                  borderWidth: "2px",
                  "&:hover": {
                    borderWidth: "2px",
                    backgroundColor: "primary.light",
                    color: "white",
                  },
                }}
              >
                ĐẶT LẠI
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Todo List */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          {/* <CircularProgress size={60} thickness={4} /> */}
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Đang tải danh sách công việc...
          </Typography>
        </Box>
      ) : todos.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            textAlign: "center",
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.default,
              0.8
            )}, ${alpha(theme.palette.background.paper, 0.9)})`,
          }}
        >
          <WorkspacePremium
            sx={{ fontSize: 80, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {filters.status ||
            filters.priority ||
            filters.type ||
            filters.search
              ? "Không tìm thấy công việc phù hợp"
              : "Chưa có công việc nào"}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
          >
            {filters.status ||
            filters.priority ||
            filters.type ||
            filters.search
              ? "Thử điều chỉnh bộ lọc để xem nhiều kết quả hơn"
              : "Bắt đầu tổ chức công việc bằng cách tạo công việc đầu tiên"}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/todo/create")}
            startIcon={<Add />}
            size="large"
            sx={{ borderRadius: 2 }}
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
                  borderRadius: 3,
                  overflow: "visible",
                  position: "relative",
                  border: todo.isImportant
                    ? `2px solid ${theme.palette.warning.main}`
                    : "1px solid",
                  borderColor: "divider",
                  bgcolor:
                    todo.status === "done"
                      ? alpha(theme.palette.success.main, 0.03)
                      : "background.paper",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                  },
                }}
              >
                {todo.isImportant && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -8,
                      left: 16,
                      bgcolor: "warning.main",
                      color: "white",
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <PriorityHigh fontSize="small" />
                    QUAN TRỌNG
                  </Box>
                )}

                <CardActionArea onClick={() => navigate(`/todo/${todo._id}`)}>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}
                    >
                      {/* Checkbox */}
                      <Box sx={{ mt: 0.5 }}>
                        <Badge
                          color="primary"
                          invisible={!isOverdue(todo)}
                          badgeContent={<Schedule sx={{ fontSize: 12 }} />}
                        >
                          <Checkbox
                            checked={todo.status === "done"}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(todo._id);
                            }}
                            color="success"
                            sx={{
                              "&.Mui-checked": {
                                color: "success.main",
                              },
                            }}
                          />
                        </Badge>
                      </Box>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                textDecoration:
                                  todo.status === "done"
                                    ? "line-through"
                                    : "none",
                                fontWeight: todo.isImportant ? "bold" : 600,
                                color:
                                  todo.status === "done"
                                    ? "text.secondary"
                                    : "text.primary",
                                mb: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {getTypeIcon(todo.type)} {todo.title}
                            </Typography>

                            {todo.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 2,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {todo.description}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/todo/${todo._id}`);
                                }}
                                sx={{
                                  bgcolor: "primary.light",
                                  color: "primary.contrastText",
                                  "&:hover": {
                                    bgcolor: "primary.main",
                                  },
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/todo/edit/${todo._id}`);
                                }}
                                sx={{
                                  bgcolor: "action.hover",
                                  "&:hover": {
                                    bgcolor: "action.selected",
                                  },
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(todo);
                                }}
                                color="error"
                                sx={{
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.error.main,
                                      0.2
                                    ),
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Progress Bar */}
                        {todo.subtasks && todo.subtasks.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Tiến độ
                              </Typography>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                color="primary"
                              >
                                {getProgress(todo)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getProgress(todo)}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        )}

                        {/* Tags and Info */}
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Chip
                            icon={<PriorityFlag priority={todo.priority} />}
                            label={
                              todo.priority === "high"
                                ? "Cao"
                                : todo.priority === "medium"
                                ? "Trung bình"
                                : "Thấp"
                            }
                            size="small"
                            color={getPriorityColor(todo.priority)}
                            variant={
                              todo.priority === "high" ? "filled" : "outlined"
                            }
                          />
                          <Chip
                            label={todo.type}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 1 }}
                          />
                          <Chip
                            label={
                              todo.status === "done"
                                ? "Hoàn thành"
                                : todo.status === "in-progress"
                                ? "Đang thực hiện"
                                : todo.status === "cancelled"
                                ? "Đã hủy"
                                : "Đã lên lịch"
                            }
                            size="small"
                            color={getStatusColor(todo.status)}
                            sx={{ borderRadius: 1 }}
                          />

                          {todo.hasCalendarEvent && (
                            <Tooltip title="Đã thêm vào lịch">
                              <Chip
                                icon={<Event fontSize="small" />}
                                label="Lịch"
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ borderRadius: 1 }}
                              />
                            </Tooltip>
                          )}
                        </Box>

                        {/* Dates and Additional Info */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
                          >
                            {todo.dueDate && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Today
                                  sx={{
                                    fontSize: 16,
                                    color: isOverdue(todo)
                                      ? "error.main"
                                      : "text.secondary",
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color={
                                    isOverdue(todo)
                                      ? "error.main"
                                      : "text.secondary"
                                  }
                                  fontWeight={
                                    isOverdue(todo) ? "bold" : "normal"
                                  }
                                >
                                  Hạn:
                                  {new Date(todo.end).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                  {isOverdue(todo) && " (Quá hạn)"}
                                </Typography>
                              </Box>
                            )}

                            {todo.start && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Schedule
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Bắt đầu:{" "}
                                  {new Date(todo.start).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Assignees or additional info can go here */}
                          {todo.assignees && todo.assignees.length > 0 && (
                            <AvatarGroup
                              max={3}
                              sx={{
                                "& .MuiAvatar-root": {
                                  width: 24,
                                  height: 24,
                                  fontSize: 12,
                                },
                              }}
                            >
                              {todo.assignees.map((assignee, index) => (
                                <Avatar
                                  key={index}
                                  alt={assignee.name}
                                  src={assignee.avatar}
                                />
                              ))}
                            </AvatarGroup>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "error.main",
            color: "white",
            fontWeight: "bold",
          }}
        >
          🗑️ Xác nhận xóa
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>
            Bạn có chắc chắn muốn xóa công việc{" "}
            <strong>"{todoToDelete?.title}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hành động này không thể hoàn tác và mọi dữ liệu liên quan sẽ bị mất.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Giữ lại
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            startIcon={<Delete />}
            sx={{ borderRadius: 2 }}
          >
            Xóa vĩnh viễn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            borderRadius: 2,
            alignItems: "center",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TodoList;
