// // components/todo/TodoDetail.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Chip,
//   Divider,
//   Grid,
//   Paper,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Snackbar,
//   Alert,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Checkbox,
// } from "@mui/material";
// import {
//   Edit,
//   Delete,
//   ArrowBack,
//   Event,
//   Schedule,
//   Flag,
//   Category,
//   LocationOn,
// } from "@mui/icons-material";
// import { todoService } from "../../services/todoService";

// const TodoDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [todo, setTodo] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   useEffect(() => {
//     fetchTodoDetail();
//   }, [id]);

//   const fetchTodoDetail = async () => {
//     try {
//       setLoading(true);
//       const response = await todoService.getTodoDetail(id);
//       setTodo(response.todo);
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi tải chi tiết công việc", "error");
//       navigate("/todo/list");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showSnackbar = (message, severity = "success") => {
//     setSnackbar({ open: true, message, severity });
//   };

//   const handleMarkComplete = async () => {
//     try {
//       await todoService.markComplete(id);
//       showSnackbar("Đánh dấu hoàn thành thành công");
//       fetchTodoDetail();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi cập nhật trạng thái", "error");
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await todoService.deleteTodo(id);
//       showSnackbar("Xóa công việc thành công");
//       navigate("/todo/list");
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi xóa công việc", "error");
//     }
//   };

//   const handleToggleSubtask = async (subtaskId) => {
//     try {
//       await todoService.toggleSubtask(id, subtaskId);
//       fetchTodoDetail();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi cập nhật công việc con", "error");
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

//   const formatDate = (dateString) => {
//     if (!dateString) return "Chưa đặt";
//     return new Date(dateString).toLocaleString("vi-VN");
//   };

//   if (loading) {
//     return (
//       <Typography textAlign="center" sx={{ p: 4 }}>
//         Đang tải...
//       </Typography>
//     );
//   }

//   if (!todo) {
//     return (
//       <Box sx={{ p: 4, textAlign: "center" }}>
//         <Typography variant="h6" color="error">
//           Không tìm thấy công việc
//         </Typography>
//         <Button onClick={() => navigate("/todo/list")} sx={{ mt: 2 }}>
//           Quay lại danh sách
//         </Button>
//       </Box>
//     );
//   }

//   const progress =
//     todo.subtasks && todo.subtasks.length > 0
//       ? Math.round(
//           (todo.subtasks.filter((st) => st.completed).length /
//             todo.subtasks.length) *
//             100
//         )
//       : todo.status === "done"
//       ? 100
//       : 0;

//   return (
//     <Box sx={{ maxWidth: 800, margin: "0 auto", p: 3 }}>
//       {/* Header */}
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           mb: 3,
//         }}
//       >
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//           <IconButton onClick={() => navigate("/todo/list")}>
//             <ArrowBack />
//           </IconButton>
//           <Typography variant="h4">{todo.title}</Typography>
//         </Box>

//         <Box sx={{ display: "flex", gap: 1 }}>
//           {todo.status !== "done" && (
//             <Button
//               variant="outlined"
//               color="success"
//               onClick={handleMarkComplete}
//             >
//               Hoàn thành
//             </Button>
//           )}
//           <Button
//             variant="outlined"
//             startIcon={<Edit />}
//             onClick={() => navigate(`/todo/edit/${id}`)}
//           >
//             Chỉnh sửa
//           </Button>
//           <Button
//             variant="outlined"
//             color="error"
//             startIcon={<Delete />}
//             onClick={() => setOpenDeleteDialog(true)}
//           >
//             Xóa
//           </Button>
//         </Box>
//       </Box>

//       <Grid container spacing={3}>
//         {/* Main Content */}
//         <Grid item xs={12} md={8}>
//           <Card>
//             <CardContent>
//               {/* Description */}
//               {todo.description && (
//                 <>
//                   <Typography variant="h6" gutterBottom color="primary">
//                     Mô tả
//                   </Typography>
//                   <Typography
//                     variant="body1"
//                     sx={{ mb: 3, whiteSpace: "pre-wrap" }}
//                   >
//                     {todo.description}
//                   </Typography>
//                   <Divider sx={{ mb: 3 }} />
//                 </>
//               )}

//               {/* Subtasks */}
//               {todo.subtasks && todo.subtasks.length > 0 && (
//                 <>
//                   <Typography variant="h6" gutterBottom color="primary">
//                     Công việc con ({progress}% hoàn thành)
//                   </Typography>
//                   <List>
//                     {todo.subtasks.map((subtask, index) => (
//                       <ListItem
//                         key={index}
//                         divider={index < todo.subtasks.length - 1}
//                       >
//                         <ListItemIcon>
//                           <Checkbox
//                             edge="start"
//                             checked={subtask.completed}
//                             onChange={() => handleToggleSubtask(subtask._id)}
//                             disabled={todo.status === "done"}
//                           />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary={
//                             <Typography
//                               sx={{
//                                 textDecoration: subtask.completed
//                                   ? "line-through"
//                                   : "none",
//                                 color: subtask.completed
//                                   ? "text.secondary"
//                                   : "text.primary",
//                               }}
//                             >
//                               {subtask.title}
//                             </Typography>
//                           }
//                           secondary={
//                             subtask.completedAt &&
//                             `Hoàn thành: ${formatDate(subtask.completedAt)}`
//                           }
//                         />
//                       </ListItem>
//                     ))}
//                   </List>
//                   <Divider sx={{ my: 3 }} />
//                 </>
//               )}

//               {/* Tags */}
//               {todo.tags && todo.tags.length > 0 && (
//                 <>
//                   <Typography variant="h6" gutterBottom color="primary">
//                     Tags
//                   </Typography>
//                   <Box
//                     sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}
//                   >
//                     {todo.tags.map((tag, index) => (
//                       <Chip key={index} label={tag} variant="outlined" />
//                     ))}
//                   </Box>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Sidebar */}
//         <Grid item xs={12} md={4}>
//           <Card>
//             <CardContent>
//               <Typography variant="h6" gutterBottom color="primary">
//                 Thông tin
//               </Typography>

//               {/* Status and Priority */}
//               <Box sx={{ mb: 2 }}>
//                 <Chip
//                   label={todo.status}
//                   color={getStatusColor(todo.status)}
//                   sx={{ mb: 1, mr: 1 }}
//                 />
//                 <Chip
//                   label={todo.priority}
//                   color={getPriorityColor(todo.priority)}
//                   sx={{ mb: 1 }}
//                 />
//                 {todo.isImportant && (
//                   <Chip
//                     icon={<Flag />}
//                     label="Quan trọng"
//                     color="warning"
//                     variant="outlined"
//                     sx={{ mb: 1 }}
//                   />
//                 )}
//               </Box>

//               {/* Details */}
//               <Paper variant="outlined" sx={{ p: 2 }}>
//                 <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
//                   {/* Type */}
//                   <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                     <Category color="action" />
//                     <Box>
//                       <Typography variant="caption" color="text.secondary">
//                         Loại
//                       </Typography>
//                       <Typography variant="body2">{todo.type}</Typography>
//                     </Box>
//                   </Box>

//                   {/* Category */}
//                   {todo.category && (
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <Category color="action" />
//                       <Box>
//                         <Typography variant="caption" color="text.secondary">
//                           Danh mục
//                         </Typography>
//                         <Typography variant="body2">{todo.category}</Typography>
//                       </Box>
//                     </Box>
//                   )}

//                   {/* Location */}
//                   {todo.location && (
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <LocationOn color="action" />
//                       <Box>
//                         <Typography variant="caption" color="text.secondary">
//                           Địa điểm
//                         </Typography>
//                         <Typography variant="body2">{todo.location}</Typography>
//                       </Box>
//                     </Box>
//                   )}

//                   {/* Calendar Dates */}
//                   {todo.start && (
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <Event color="action" />
//                       <Box>
//                         <Typography variant="caption" color="text.secondary">
//                           {todo.isAllDay ? "Ngày" : "Bắt đầu"}
//                         </Typography>
//                         <Typography variant="body2">
//                           {todo.isAllDay
//                             ? new Date(todo.start).toLocaleDateString("vi-VN")
//                             : formatDate(todo.start)}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   )}

//                   {todo.end && todo.start !== todo.end && (
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <Schedule color="action" />
//                       <Box>
//                         <Typography variant="caption" color="text.secondary">
//                           {todo.isAllDay ? "Đến ngày" : "Kết thúc"}
//                         </Typography>
//                         <Typography variant="body2">
//                           {todo.isAllDay
//                             ? new Date(todo.end).toLocaleDateString("vi-VN")
//                             : formatDate(todo.end)}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   )}

//                   {/* Due Date */}
//                   {todo.dueDate && (
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <Schedule color="action" />
//                       <Box>
//                         <Typography variant="caption" color="text.secondary">
//                           Hạn hoàn thành
//                         </Typography>
//                         <Typography variant="body2">
//                           {formatDate(todo.dueDate)}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   )}

//                   {/* Created Date */}
//                   <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                     <Schedule color="action" />
//                     <Box>
//                       <Typography variant="caption" color="text.secondary">
//                         Tạo lúc
//                       </Typography>
//                       <Typography variant="body2">
//                         {formatDate(todo.createdAt)}
//                       </Typography>
//                     </Box>
//                   </Box>

//                   {/* Updated Date */}
//                   {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <Schedule color="action" />
//                       <Box>
//                         <Typography variant="caption" color="text.secondary">
//                           Cập nhật
//                         </Typography>
//                         <Typography variant="body2">
//                           {formatDate(todo.updatedAt)}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   )}
//                 </Box>
//               </Paper>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Delete Confirmation Dialog */}
//       <Dialog
//         open={openDeleteDialog}
//         onClose={() => setOpenDeleteDialog(false)}
//       >
//         <DialogTitle>Xác nhận xóa</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Bạn có chắc chắn muốn xóa công việc "{todo.title}"? Hành động này
//             không thể hoàn tác.
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
//           <Button onClick={handleDelete} color="error" variant="contained">
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

// export default TodoDetail;

// components/todo/TodoDetail.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
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
  Checkbox,
  LinearProgress,
  Skeleton,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
  CheckCircle,
  Flag,
  Category,
  LocationOn,
  Event,
  Schedule,
} from "@mui/icons-material";
import { todoService } from "../../services/todoService";

const TodoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
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
      showSnackbar(error.message || "Không thể tải công việc", "error");
      navigate("/todo/list");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      await action();
      await fetchTodoDetail();
    } catch (error) {
      showSnackbar(error.message || "Có lỗi xảy ra", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = () =>
    handleAction(() => todoService.markComplete(id));

  const handleDelete = () =>
    handleAction(async () => {
      await todoService.deleteTodo(id);
      showSnackbar("Đã xóa công việc");
      navigate("/todo/list");
    });

  const handleToggleSubtask = (subtaskId) =>
    handleAction(() => todoService.toggleSubtask(id, subtaskId));

  const progress = useMemo(() => {
    if (!todo?.subtasks?.length) return todo?.status === "done" ? 100 : 0;
    const completed = todo.subtasks.filter((s) => s.completed).length;
    return Math.round((completed / todo.subtasks.length) * 100);
  }, [todo?.subtasks, todo?.status]);

  const getChipColor = (type, value) => {
    const map = {
      status: {
        done: "success",
        "in-progress": "warning",
        cancelled: "error",
        default: "primary",
      },
      priority: {
        high: "error",
        medium: "warning",
        low: "success",
        default: "default",
      },
    };
    return map[type]?.[value] || map[type]?.default || "default";
  };

  const formatDate = (date) => {
    if (!date) return "Chưa đặt";
    const d = new Date(date);
    return isNaN(d) ? "Không hợp lệ" : d.toLocaleString("vi-VN");
  };

  // === SKELETON LOADING ===
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton height={60} width="60%" />
        <Skeleton height={40} sx={{ mt: 2 }} />
        <Box
          sx={{
            display: "flex",
            gap: 3,
            mt: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height={300}
            sx={{ flex: 1 }}
          />
          <Skeleton variant="rectangular" width={320} height={300} />
        </Box>
      </Container>
    );
  }

  // === NOT FOUND ===
  if (!todo) {
    return (
      <Box textAlign="center" py={8}>
        <Alert severity="error" sx={{ mb: 2, display: "inline-block" }}>
          Không tìm thấy công việc
        </Alert>
        <Button variant="contained" onClick={() => navigate("/todo/list")}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* === HEADER === */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={() => navigate("/todo/list")}
            aria-label="quay lại"
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h4"
            component="h1"
            sx={{ wordBreak: "break-word" }}
          >
            {todo.title}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {todo.status !== "done" && (
            <Button
              variant="contained"
              color="success"
              startIcon={
                actionLoading ? <CircularProgress size={16} /> : <CheckCircle />
              }
              onClick={handleMarkComplete}
              disabled={actionLoading}
            >
              {actionLoading ? "Đang xử lý..." : "Hoàn thành"}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/todo/edit/${id}`)}
            disabled={actionLoading}
          >
            Sửa
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setOpenDelete(true)}
            disabled={actionLoading}
          >
            Xóa
          </Button>
        </Stack>
      </Box>

      {/* === MAIN CONTENT + SIDEBAR === */}
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent sx={{ pb: 3 }}>
              {/* Description */}
              {todo.description && (
                <>
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    color="primary"
                  >
                    Mô tả
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-wrap", mb: 3 }}
                  >
                    {todo.description}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </>
              )}

              {/* Subtasks */}
              {todo.subtasks?.length > 0 && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" component="h2" color="primary">
                      Công việc con
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {progress}% hoàn thành
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ mb: 2, height: 6, borderRadius: 3 }}
                  />
                  <List>
                    {todo.subtasks.map((subtask) => (
                      <ListItem
                        key={subtask._id || subtask.id}
                        secondaryAction={
                          <Checkbox
                            edge="end"
                            checked={subtask.completed}
                            onChange={() =>
                              handleToggleSubtask(subtask._id || subtask.id)
                            }
                            disabled={actionLoading || todo.status === "done"}
                          />
                        }
                        sx={{
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { border: 0 },
                        }}
                      >
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
                                fontWeight: subtask.completed ? 400 : 500,
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
              {todo.tags?.length > 0 && (
                <>
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    color="primary"
                  >
                    Tags
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}
                  >
                    {todo.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                color="primary"
              >
                Thông tin
              </Typography>

              {/* Status & Priority */}
              <Box sx={{ mb: 3 }}>
                <Chip
                  label={todo.status}
                  color={getChipColor("status", todo.status)}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={todo.priority}
                  color={getChipColor("priority", todo.priority)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                {todo.isImportant && (
                  <Chip
                    icon={<Flag fontSize="small" />}
                    label="Quan trọng"
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <InfoRow icon={Category} label="Loại" value={todo.type} />
                  {todo.category && (
                    <InfoRow
                      icon={Category}
                      label="Danh mục"
                      value={todo.category}
                    />
                  )}
                  {todo.location && (
                    <InfoRow
                      icon={LocationOn}
                      label="Địa điểm"
                      value={todo.location}
                    />
                  )}

                  {todo.start && (
                    <InfoRow
                      icon={Event}
                      label={todo.isAllDay ? "Ngày" : "Bắt đầu"}
                      value={
                        todo.isAllDay
                          ? new Date(todo.start).toLocaleDateString("vi-VN")
                          : formatDate(todo.start)
                      }
                    />
                  )}
                  {todo.end && todo.start !== todo.end && (
                    <InfoRow
                      icon={Schedule}
                      label={todo.isAllDay ? "Đến ngày" : "Kết thúc"}
                      value={
                        todo.isAllDay
                          ? new Date(todo.end).toLocaleDateString("vi-VN")
                          : formatDate(todo.end)
                      }
                    />
                  )}
                  {todo.dueDate && (
                    <InfoRow
                      icon={Schedule}
                      label="Hạn hoàn thành"
                      value={formatDate(todo.dueDate)}
                    />
                  )}
                  <InfoRow
                    icon={Schedule}
                    label="Tạo lúc"
                    value={formatDate(todo.createdAt)}
                  />
                  {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
                    <InfoRow
                      icon={Schedule}
                      label="Cập nhật"
                      value={formatDate(todo.updatedAt)}
                    />
                  )}
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* === DELETE DIALOG === */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa công việc <strong>"{todo.title}"</strong>?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={actionLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading && <CircularProgress size={16} />}
          >
            {actionLoading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* === SNACKBAR === */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// === HELPER: Info Row ===
const InfoRow = ({ icon: Icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Icon color="action" fontSize="small" />
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight="medium">
        {value}
      </Typography>
    </Box>
  </Box>
);

export default TodoDetail;
