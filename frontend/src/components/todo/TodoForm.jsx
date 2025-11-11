// // components/todo/TodoForm.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
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
//   Grid,
//   FormControlLabel,
//   Checkbox,
//   Divider,
//   Snackbar,
//   Alert,
//   Paper,
//   IconButton,
// } from "@mui/material";
// import { Add, Delete, ArrowBack } from "@mui/icons-material";
// import { todoService } from "../../services/todoService";

// const TodoForm = ({ todoId }) => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const actualTodoId = todoId || id;

//   const [loading, setLoading] = useState(false);
//   const [isEditing, setIsEditing] = useState(!!actualTodoId);
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     start: "",
//     end: "",
//     type: "Task",
//     priority: "medium",
//     isAllDay: false,
//     location: "",
//     dueDate: "",
//     tags: [],
//     category: "",
//     isImportant: false,
//     status: "scheduled",
//   });

//   const [newTag, setNewTag] = useState("");
//   const [subtasks, setSubtasks] = useState([]);
//   const [newSubtask, setNewSubtask] = useState("");

//   useEffect(() => {
//     if (actualTodoId) {
//       fetchTodoDetail();
//     }
//   }, [actualTodoId]);

//   const fetchTodoDetail = async () => {
//     try {
//       setLoading(true);
//       const response = await todoService.getTodoDetail(actualTodoId);
//       const todo = response.todo;

//       setFormData({
//         title: todo.title,
//         description: todo.description || "",
//         start: todo.start
//           ? new Date(todo.start).toISOString().slice(0, 16)
//           : "",
//         end: todo.end ? new Date(todo.end).toISOString().slice(0, 16) : "",
//         type: todo.type || "Task",
//         priority: todo.priority || "medium",
//         isAllDay: todo.isAllDay || false,
//         location: todo.location || "",
//         dueDate: todo.dueDate
//           ? new Date(todo.dueDate).toISOString().slice(0, 16)
//           : "",
//         tags: todo.tags || [],
//         category: todo.category || "",
//         isImportant: todo.isImportant || false,
//         status: todo.status || "scheduled",
//       });

//       setSubtasks(todo.subtasks || []);
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

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.title.trim()) {
//       showSnackbar("Vui lòng nhập tiêu đề công việc", "error");
//       return;
//     }

//     try {
//       setLoading(true);

//       const submitData = {
//         ...formData,
//         subtasks: subtasks.map((st) => ({
//           title: st.title,
//           completed: st.completed || false,
//         })),
//       };

//       if (isEditing) {
//         await todoService.updateTodo(actualTodoId, submitData);
//         showSnackbar("Cập nhật công việc thành công");
//       } else {
//         await todoService.createTodo(submitData);
//         showSnackbar("Tạo công việc thành công");
//       }

//       setTimeout(() => {
//         navigate("/todo/list");
//       }, 1000);
//     } catch (error) {
//       showSnackbar(
//         error.message || `Lỗi ${isEditing ? "cập nhật" : "tạo"} công việc`,
//         "error"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddTag = () => {
//     if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
//       setFormData({
//         ...formData,
//         tags: [...formData.tags, newTag.trim()],
//       });
//       setNewTag("");
//     }
//   };

//   const handleRemoveTag = (tagToRemove) => {
//     setFormData({
//       ...formData,
//       tags: formData.tags.filter((tag) => tag !== tagToRemove),
//     });
//   };

//   const handleAddSubtask = () => {
//     if (newSubtask.trim()) {
//       setSubtasks([
//         ...subtasks,
//         { title: newSubtask.trim(), completed: false },
//       ]);
//       setNewSubtask("");
//     }
//   };

//   const handleRemoveSubtask = (index) => {
//     setSubtasks(subtasks.filter((_, i) => i !== index));
//   };

//   const handleToggleSubtask = (index) => {
//     const updatedSubtasks = [...subtasks];
//     updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
//     setSubtasks(updatedSubtasks);
//   };

//   if (loading && isEditing) {
//     return (
//       <Typography textAlign="center" sx={{ p: 4 }}>
//         Đang tải...
//       </Typography>
//     );
//   }

//   return (
//     <Box sx={{ maxWidth: 800, margin: "0 auto", p: 3 }}>
//       {/* Header */}
//       <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
//         <IconButton onClick={() => navigate("/todo/list")} sx={{ mr: 2 }}>
//           <ArrowBack />
//         </IconButton>
//         <Typography variant="h4">
//           {isEditing ? "Chỉnh Sửa Công Việc" : "Tạo Công Việc Mới"}
//         </Typography>
//       </Box>

//       <Card>
//         <CardContent>
//           <form onSubmit={handleSubmit}>
//             <Grid container spacing={3}>
//               {/* Basic Information */}
//               <Grid item xs={12}>
//                 <Typography variant="h6" gutterBottom color="primary">
//                   Thông tin cơ bản
//                 </Typography>
//               </Grid>

//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Tiêu đề *"
//                   value={formData.title}
//                   onChange={(e) =>
//                     setFormData({ ...formData, title: e.target.value })
//                   }
//                   required
//                 />
//               </Grid>

//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   multiline
//                   rows={4}
//                   label="Mô tả"
//                   value={formData.description}
//                   onChange={(e) =>
//                     setFormData({ ...formData, description: e.target.value })
//                   }
//                 />
//               </Grid>

//               {/* Type and Priority */}
//               <Grid item xs={12} sm={6}>
//                 <FormControl fullWidth>
//                   <InputLabel>Loại công việc</InputLabel>
//                   <Select
//                     value={formData.type}
//                     label="Loại công việc"
//                     onChange={(e) =>
//                       setFormData({ ...formData, type: e.target.value })
//                     }
//                   >
//                     <MenuItem value="Meeting">Meeting</MenuItem>
//                     <MenuItem value="Business travel">Công tác</MenuItem>
//                     <MenuItem value="Personal Work">Cá nhân</MenuItem>
//                     <MenuItem value="Team Project">Dự án nhóm</MenuItem>
//                     <MenuItem value="Appointment">Cuộc hẹn</MenuItem>
//                     <MenuItem value="Task">Công việc</MenuItem>
//                     <MenuItem value="Other">Khác</MenuItem>
//                   </Select>
//                 </FormControl>
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <FormControl fullWidth>
//                   <InputLabel>Mức độ ưu tiên</InputLabel>
//                   <Select
//                     value={formData.priority}
//                     label="Mức độ ưu tiên"
//                     onChange={(e) =>
//                       setFormData({ ...formData, priority: e.target.value })
//                     }
//                   >
//                     <MenuItem value="low">Thấp</MenuItem>
//                     <MenuItem value="medium">Trung bình</MenuItem>
//                     <MenuItem value="high">Cao</MenuItem>
//                   </Select>
//                 </FormControl>
//               </Grid>

//               {/* Calendar Information */}
//               <Grid item xs={12}>
//                 <Divider sx={{ my: 2 }} />
//                 <Typography variant="h6" gutterBottom color="primary">
//                   Thông tin lịch
//                 </Typography>
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Bắt đầu"
//                   type="datetime-local"
//                   value={formData.start}
//                   onChange={(e) =>
//                     setFormData({ ...formData, start: e.target.value })
//                   }
//                   InputLabelProps={{ shrink: true }}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Kết thúc"
//                   type="datetime-local"
//                   value={formData.end}
//                   onChange={(e) =>
//                     setFormData({ ...formData, end: e.target.value })
//                   }
//                   InputLabelProps={{ shrink: true }}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Hạn hoàn thành"
//                   type="datetime-local"
//                   value={formData.dueDate}
//                   onChange={(e) =>
//                     setFormData({ ...formData, dueDate: e.target.value })
//                   }
//                   InputLabelProps={{ shrink: true }}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Địa điểm"
//                   value={formData.location}
//                   onChange={(e) =>
//                     setFormData({ ...formData, location: e.target.value })
//                   }
//                 />
//               </Grid>

//               {/* Additional Information */}
//               <Grid item xs={12}>
//                 <Divider sx={{ my: 2 }} />
//                 <Typography variant="h6" gutterBottom color="primary">
//                   Thông tin bổ sung
//                 </Typography>
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Danh mục"
//                   value={formData.category}
//                   onChange={(e) =>
//                     setFormData({ ...formData, category: e.target.value })
//                   }
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <FormControl fullWidth>
//                   <InputLabel>Trạng thái</InputLabel>
//                   <Select
//                     value={formData.status}
//                     label="Trạng thái"
//                     onChange={(e) =>
//                       setFormData({ ...formData, status: e.target.value })
//                     }
//                   >
//                     <MenuItem value="scheduled">Đã lên lịch</MenuItem>
//                     <MenuItem value="in-progress">Đang thực hiện</MenuItem>
//                     <MenuItem value="done">Hoàn thành</MenuItem>
//                     <MenuItem value="cancelled">Đã hủy</MenuItem>
//                   </Select>
//                 </FormControl>
//               </Grid>

//               {/* Tags */}
//               <Grid item xs={12}>
//                 <Typography variant="subtitle1" gutterBottom>
//                   Tags
//                 </Typography>
//                 <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
//                   <TextField
//                     size="small"
//                     placeholder="Thêm tag..."
//                     value={newTag}
//                     onChange={(e) => setNewTag(e.target.value)}
//                     onKeyPress={(e) =>
//                       e.key === "Enter" && (e.preventDefault(), handleAddTag())
//                     }
//                   />
//                   <Button onClick={handleAddTag} startIcon={<Add />}>
//                     Thêm
//                   </Button>
//                 </Box>
//                 <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
//                   {formData.tags.map((tag, index) => (
//                     <Chip
//                       key={index}
//                       label={tag}
//                       onDelete={() => handleRemoveTag(tag)}
//                       color="primary"
//                       variant="outlined"
//                     />
//                   ))}
//                 </Box>
//               </Grid>

//               {/* Subtasks */}
//               <Grid item xs={12}>
//                 <Typography variant="subtitle1" gutterBottom>
//                   Công việc con
//                 </Typography>
//                 <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     placeholder="Thêm công việc con..."
//                     value={newSubtask}
//                     onChange={(e) => setNewSubtask(e.target.value)}
//                     onKeyPress={(e) =>
//                       e.key === "Enter" &&
//                       (e.preventDefault(), handleAddSubtask())
//                     }
//                   />
//                   <Button onClick={handleAddSubtask} startIcon={<Add />}>
//                     Thêm
//                   </Button>
//                 </Box>

//                 {subtasks.map((subtask, index) => (
//                   <Paper
//                     key={index}
//                     sx={{
//                       p: 1,
//                       mb: 1,
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 1,
//                     }}
//                   >
//                     <Checkbox
//                       checked={subtask.completed}
//                       onChange={() => handleToggleSubtask(index)}
//                     />
//                     <Typography
//                       sx={{
//                         flex: 1,
//                         textDecoration: subtask.completed
//                           ? "line-through"
//                           : "none",
//                       }}
//                     >
//                       {subtask.title}
//                     </Typography>
//                     <IconButton
//                       size="small"
//                       onClick={() => handleRemoveSubtask(index)}
//                       color="error"
//                     >
//                       <Delete fontSize="small" />
//                     </IconButton>
//                   </Paper>
//                 ))}
//               </Grid>

//               {/* Options */}
//               <Grid item xs={12}>
//                 <Box sx={{ display: "flex", gap: 3 }}>
//                   <FormControlLabel
//                     control={
//                       <Checkbox
//                         checked={formData.isAllDay}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             isAllDay: e.target.checked,
//                           })
//                         }
//                       />
//                     }
//                     label="Sự kiện cả ngày"
//                   />

//                   <FormControlLabel
//                     control={
//                       <Checkbox
//                         checked={formData.isImportant}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             isImportant: e.target.checked,
//                           })
//                         }
//                       />
//                     }
//                     label="Quan trọng"
//                   />
//                 </Box>
//               </Grid>

//               {/* Submit Buttons */}
//               <Grid item xs={12}>
//                 <Box
//                   sx={{
//                     display: "flex",
//                     gap: 2,
//                     justifyContent: "flex-end",
//                     pt: 2,
//                   }}
//                 >
//                   <Button
//                     variant="outlined"
//                     onClick={() => navigate("/todo/list")}
//                     disabled={loading}
//                   >
//                     Hủy
//                   </Button>
//                   <Button
//                     type="submit"
//                     variant="contained"
//                     disabled={loading || !formData.title.trim()}
//                   >
//                     {loading
//                       ? "Đang xử lý..."
//                       : isEditing
//                       ? "Cập nhật"
//                       : "Tạo công việc"}
//                   </Button>
//                 </Box>
//               </Grid>
//             </Grid>
//           </form>
//         </CardContent>
//       </Card>

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

// export default TodoForm;

// components/todo/TodoForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Stack,
  CardHeader,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Add,
  Delete,
  ArrowBack,
  Work,
  Schedule,
  Flag,
  Category,
  LocalOffer,
  Checklist,
  Event,
  Place,
} from "@mui/icons-material";
import { todoService } from "../../services/todoService";

const TodoForm = ({ todoId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const actualTodoId = todoId || id;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!actualTodoId);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    type: "Task",
    priority: "medium",
    isAllDay: false,
    location: "",
    dueDate: "",
    tags: [],
    category: "",
    isImportant: false,
    status: "scheduled",
  });

  const [newTag, setNewTag] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (actualTodoId) {
      fetchTodoDetail();
    }
  }, [actualTodoId]);

  const fetchTodoDetail = async () => {
    try {
      setLoading(true);
      const response = await todoService.getTodoDetail(actualTodoId);
      const todo = response.todo;

      setFormData({
        title: todo.title,
        description: todo.description || "",
        start: todo.start
          ? new Date(todo.start).toISOString().slice(0, 16)
          : "",
        end: todo.end ? new Date(todo.end).toISOString().slice(0, 16) : "",
        type: todo.type || "Task",
        priority: todo.priority || "medium",
        isAllDay: todo.isAllDay || false,
        location: todo.location || "",
        dueDate: todo.dueDate
          ? new Date(todo.dueDate).toISOString().slice(0, 16)
          : "",
        tags: todo.tags || [],
        category: todo.category || "",
        isImportant: todo.isImportant || false,
        status: todo.status || "scheduled",
      });

      setSubtasks(todo.subtasks || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showSnackbar("Vui lòng nhập tiêu đề công việc", "error");
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        subtasks: subtasks.map((st) => ({
          title: st.title,
          completed: st.completed || false,
        })),
      };

      if (isEditing) {
        await todoService.updateTodo(actualTodoId, submitData);
        showSnackbar("Cập nhật công việc thành công");
      } else {
        await todoService.createTodo(submitData);
        showSnackbar("Tạo công việc thành công");
      }

      setTimeout(() => {
        navigate("/todo/list");
      }, 1000);
    } catch (error) {
      showSnackbar(
        error.message || `Lỗi ${isEditing ? "cập nhật" : "tạo"} công việc`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        {
          title: newSubtask.trim(),
          completed: false,
          _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ]);
      setNewSubtask("");
    }
  };

  const handleRemoveSubtask = (index) => {
    const updatedSubtasks = subtasks.filter((_, i) => i !== index);
    setSubtasks(updatedSubtasks);
    showSnackbar("Đã xóa công việc con", "info");
  };

  const handleToggleSubtask = (index) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    setSubtasks(updatedSubtasks);
  };

  const handleClearAllSubtasks = () => {
    if (subtasks.length === 0) return;

    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả công việc con?")) {
      setSubtasks([]);
      showSnackbar("Đã xóa tất cả công việc con", "info");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ff4444";
      case "medium":
        return "#ffaa00";
      case "low":
        return "#00aa00";
      default:
        return "#666666";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Meeting":
        return "👥";
      case "Business travel":
        return "✈️";
      case "Personal Work":
        return "👤";
      case "Team Project":
        return "👨‍👩‍👧‍👦";
      case "Appointment":
        return "📅";
      case "Task":
        return "📝";
      case "Other":
        return "📌";
      default:
        return "📝";
    }
  };

  if (loading && isEditing) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ p: 4 }}
      >
        <Typography variant="h6">Đang tải thông tin công việc...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: "0 auto", p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton
          onClick={() => navigate("/todo/list")}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {isEditing ? "Chỉnh Sửa Công Việc" : "Tạo Công Việc Mới"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isEditing
              ? "Cập nhật thông tin công việc của bạn"
              : "Thêm công việc mới vào hệ thống"}
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Left Column - Main Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <Work />
                </Avatar>
              }
              title="Thông tin cơ bản"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tiêu đề công việc *"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    variant="outlined"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Mô tả chi tiết"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    variant="outlined"
                    size="small"
                    placeholder="Mô tả chi tiết về công việc..."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Loại công việc</InputLabel>
                    <Select
                      value={formData.type}
                      label="Loại công việc"
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <MenuItem value="Meeting">
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>👥</span> Meeting
                        </Box>
                      </MenuItem>
                      <MenuItem value="Business travel">
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>✈️</span> Công tác
                        </Box>
                      </MenuItem>
                      <MenuItem value="Personal Work">
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>👤</span> Cá nhân
                        </Box>
                      </MenuItem>
                      <MenuItem value="Team Project">
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>👨‍👩‍👧‍👦</span> Dự án nhóm
                        </Box>
                      </MenuItem>
                      <MenuItem value="Appointment">
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>📅</span> Cuộc hẹn
                        </Box>
                      </MenuItem>
                      <MenuItem value="Task">
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>📝</span> Công việc
                        </Box>
                      </MenuItem>
                      <MenuItem value="Other">
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>📌</span> Khác
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Mức độ ưu tiên</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Mức độ ưu tiên"
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      sx={{
                        "& .MuiSelect-select": {
                          color: getPriorityColor(formData.priority),
                          fontWeight: "bold",
                        },
                      }}
                    >
                      <MenuItem
                        value="low"
                        sx={{ color: "#00aa00", fontWeight: "bold" }}
                      >
                        📍 Ưu tiên thấp
                      </MenuItem>
                      <MenuItem
                        value="medium"
                        sx={{ color: "#ffaa00", fontWeight: "bold" }}
                      >
                        🎯 Ưu tiên trung bình
                      </MenuItem>
                      <MenuItem
                        value="high"
                        sx={{ color: "#ff4444", fontWeight: "bold" }}
                      >
                        ⚠️ Ưu tiên cao
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Calendar Information */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  <Event />
                </Avatar>
              }
              title="Thông tin lịch trình"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Thời gian bắt đầu"
                    type="datetime-local"
                    value={formData.start}
                    onChange={(e) =>
                      setFormData({ ...formData, start: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Thời gian kết thúc"
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) =>
                      setFormData({ ...formData, end: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hạn hoàn thành"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Địa điểm"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    variant="outlined"
                    size="small"
                    placeholder="Nhập địa điểm..."
                    InputProps={{
                      startAdornment: (
                        <Place sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isAllDay}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isAllDay: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Sự kiện cả ngày"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Subtasks Section */}
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <Checklist />
                </Avatar>
              }
              title="Công việc con"
              action={
                subtasks.length > 0 && (
                  <Button
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleClearAllSubtasks}
                    size="small"
                  >
                    Xóa tất cả
                  </Button>
                )
              }
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            />
            <CardContent>
              <Stack spacing={2}>
                {/* Add Subtask Input */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nhập tên công việc con..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddSubtask())
                    }
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddSubtask}
                    startIcon={<Add />}
                    disabled={!newSubtask.trim()}
                  >
                    Thêm
                  </Button>
                </Box>

                {/* Subtasks List */}
                {subtasks.length > 0 ? (
                  <List
                    dense
                    sx={{ bgcolor: "background.default", borderRadius: 1 }}
                  >
                    {subtasks.map((subtask, index) => (
                      <ListItem
                        key={subtask._id || index}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: subtask.completed
                            ? "action.selected"
                            : "background.paper",
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={subtask.completed}
                            onChange={() => handleToggleSubtask(index)}
                            color="success"
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
                                fontWeight: subtask.completed
                                  ? "normal"
                                  : "medium",
                              }}
                            >
                              {subtask.title}
                            </Typography>
                          }
                          secondary={
                            subtask.completed && subtask.completedAt
                              ? `Hoàn thành: ${new Date(
                                  subtask.completedAt
                                ).toLocaleString()}`
                              : "Chưa hoàn thành"
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveSubtask(index)}
                            color="error"
                            size="small"
                            sx={{
                              "&:hover": {
                                bgcolor: "error.light",
                                color: "white",
                              },
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={3}>
                    <Typography color="text.secondary" variant="body2">
                      Chưa có công việc con nào. Hãy thêm công việc con để quản
                      lý chi tiết hơn.
                    </Typography>
                  </Box>
                )}

                {/* Progress Stats */}
                {subtasks.length > 0 && (
                  <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1 }}>
                    <Typography
                      variant="body2"
                      color="info.dark"
                      fontWeight="medium"
                    >
                      Tiến độ: {subtasks.filter((st) => st.completed).length} /{" "}
                      {subtasks.length} công việc con đã hoàn thành (
                      {Math.round(
                        (subtasks.filter((st) => st.completed).length /
                          subtasks.length) *
                          100
                      )}
                      %)
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Additional Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: "info.main" }}>
                  <Category />
                </Avatar>
              }
              title="Thông tin bổ sung"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Danh mục"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  variant="outlined"
                  size="small"
                  placeholder="Nhập danh mục..."
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={formData.status}
                    label="Trạng thái"
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <MenuItem value="scheduled">📅 Đã lên lịch</MenuItem>
                    <MenuItem value="in-progress">🔄 Đang thực hiện</MenuItem>
                    <MenuItem value="done">✅ Hoàn thành</MenuItem>
                    <MenuItem value="cancelled">❌ Đã hủy</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isImportant}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isImportant: e.target.checked,
                        })
                      }
                      color="warning"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Flag
                        color={formData.isImportant ? "warning" : "disabled"}
                      />
                      <Typography
                        color={
                          formData.isImportant ? "warning.main" : "text.primary"
                        }
                      >
                        Đánh dấu quan trọng
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Tags Section */}
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <LocalOffer />
                </Avatar>
              }
              title="Tags & Nhãn"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Thêm tag mới..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
                    }
                    variant="outlined"
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outlined"
                    disabled={!newTag.trim()}
                  >
                    <Add />
                  </Button>
                </Box>

                {formData.tags.length > 0 ? (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        color="primary"
                        variant="outlined"
                        size="small"
                        deleteIcon={<Delete />}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    Chưa có tag nào. Thêm tag để dễ dàng tìm kiếm.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submit Buttons */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          bgcolor: "background.paper",
          p: 2,
          mt: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => navigate("/todo/list")}
            disabled={loading}
            size="large"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.title.trim()}
            onClick={handleSubmit}
            size="large"
            sx={{ minWidth: 120 }}
          >
            {loading
              ? "Đang xử lý..."
              : isEditing
              ? "📝 Cập nhật"
              : "✨ Tạo công việc"}
          </Button>
        </Stack>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TodoForm;
