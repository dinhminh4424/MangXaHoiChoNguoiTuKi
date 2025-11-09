// // components/todo/TodoCalendar.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import viLocale from "@fullcalendar/core/locales/vi";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Chip,
//   Checkbox,
//   FormControlLabel,
//   Grid,
//   Snackbar,
//   Alert,
//   IconButton,
//   Tooltip,
// } from "@mui/material";
// import {
//   Add,
//   Edit,
//   Delete,
//   CheckCircle,
//   Visibility,
//   Event,
// } from "@mui/icons-material";
// import { todoService } from "../../services/todoService";

// const TodoCalendar = () => {
//   const navigate = useNavigate();
//   const [events, setEvents] = useState([]);
//   const [todos, setTodos] = useState([]);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });
//   const calendarRef = useRef();

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     start: "",
//     end: "",
//     type: "Task",
//     priority: "medium",
//     isAllDay: false,
//     location: "",
//     tags: [],
//     dueDate: "",
//     category: "",
//     isImportant: false,
//   });

//   // Fetch events từ API
//   const fetchEvents = async (start, end) => {
//     try {
//       setLoading(true);
//       const response = await todoService.getCalendarEvents(start, end);
//       const formattedEvents = response.events.map((event) => ({
//         id: event._id,
//         title: event.title,
//         start: event.start,
//         end: event.end,
//         allDay: event.isAllDay,
//         extendedProps: {
//           type: event.type,
//           priority: event.priority,
//           location: event.location,
//           description: event.description,
//           status: event.status,
//           color: event.color,
//           hasCalendarEvent: event.hasCalendarEvent,
//         },
//         backgroundColor: event.color,
//         borderColor: event.color,
//       }));
//       setEvents(formattedEvents);
//     } catch (error) {
//       console.error("Lỗi fetch events:", error);
//       showSnackbar(error.message || "Lỗi tải sự kiện", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch todos
//   const fetchTodos = async () => {
//     try {
//       setLoading(true);
//       const response = await todoService.getTodos({
//         limit: 50,
//         sortBy: "dueDate",
//       });
//       setTodos(response.todos);
//     } catch (error) {
//       console.error("Lỗi fetch todos:", error);
//       showSnackbar(error.message || "Lỗi tải danh sách công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const now = new Date();
//     const start = new Date(now.getFullYear(), now.getMonth(), 1);
//     const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//     fetchEvents(start, end);
//     fetchTodos();
//   }, []);

//   const showSnackbar = (message, severity = "success") => {
//     setSnackbar({ open: true, message, severity });
//   };

//   const handleDateSelect = (selectInfo) => {
//     setFormData({
//       title: "",
//       description: "",
//       start: selectInfo.startStr,
//       end: selectInfo.endStr,
//       type: "Task",
//       priority: "medium",
//       isAllDay: selectInfo.allDay,
//       location: "",
//       tags: [],
//       dueDate: "",
//       category: "",
//       isImportant: false,
//     });
//     setSelectedEvent(null);
//     setOpenDialog(true);
//   };

//   const handleEventClick = async (clickInfo) => {
//     const event = clickInfo.event;
//     try {
//       const response = await todoService.getTodoDetail(event.id);
//       const todo = response.todo;

//       setSelectedEvent(event);
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
//         tags: todo.tags || [],
//         dueDate: todo.dueDate
//           ? new Date(todo.dueDate).toISOString().slice(0, 16)
//           : "",
//         category: todo.category || "",
//         isImportant: todo.isImportant || false,
//       });
//       setOpenDialog(true);
//     } catch (error) {
//       showSnackbar("Lỗi tải chi tiết công việc", "error");
//     }
//   };

//   const handleCreateTodo = async () => {
//     try {
//       setLoading(true);
//       await todoService.createTodo(formData);
//       showSnackbar("Tạo công việc thành công");
//       setOpenDialog(false);
//       fetchEvents(new Date(), new Date());
//       fetchTodos();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi tạo công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateTodo = async () => {
//     if (!selectedEvent) return;

//     try {
//       setLoading(true);
//       await todoService.updateTodo(selectedEvent.id, formData);
//       showSnackbar("Cập nhật công việc thành công");
//       setOpenDialog(false);
//       fetchEvents(new Date(), new Date());
//       fetchTodos();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi cập nhật công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteTodo = async () => {
//     if (!selectedEvent) return;

//     try {
//       setLoading(true);
//       await todoService.deleteTodo(selectedEvent.id);
//       showSnackbar("Xóa công việc thành công");
//       setOpenDialog(false);
//       fetchEvents(new Date(), new Date());
//       fetchTodos();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi xóa công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarkComplete = async (todoId) => {
//     try {
//       setLoading(true);
//       await todoService.markComplete(todoId);
//       showSnackbar("Đánh dấu hoàn thành thành công");
//       fetchTodos();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi cập nhật trạng thái", "error");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleEventDrop = async (dropInfo) => {
//     const { event } = dropInfo;
//     const updatedStart = event.start.toISOString();
//     const updatedEnd = event.end ? event.end.toISOString() : null;

//     // Cập nhật formData tạm (nếu cần hiển thị ngay)
//     const updatedEvent = {
//       ...event.extendedProps,
//       start: updatedStart,
//       end: updatedEnd,
//       isAllDay: event.allDay,
//     };

//     try {
//       setLoading(true);
//       await todoService.updateTodo(event.id, {
//         start: updatedStart,
//         end: updatedEnd,
//         isAllDay: event.allDay,
//       });

//       showSnackbar("Cập nhật thời gian thành công");

//       // Cập nhật lại danh sách events
//       setEvents((prevEvents) =>
//         prevEvents.map((ev) =>
//           ev.id === event.id
//             ? {
//                 ...ev,
//                 start: updatedStart,
//                 end: updatedEnd,
//                 allDay: event.allDay,
//               }
//             : ev
//         )
//       );

//       // Cập nhật lại danh sách todos nếu cần
//       fetchTodos();
//     } catch (error) {
//       showSnackbar(error.message || "Lỗi cập nhật thời gian", "error");
//       dropInfo.revert(); // Hoàn tác kéo thả nếu lỗi
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetail = (todoId) => {
//     navigate(`/todo/${todoId}`);
//   };

//   const handleEditTodo = (todoId) => {
//     navigate(`/todo/edit/${todoId}`);
//   };

//   const eventContent = (eventInfo) => {
//     return (
//       <Box>
//         <Typography variant="body2" noWrap fontSize="12px">
//           {eventInfo.timeText && `${eventInfo.timeText} - `}
//           {eventInfo.event.title}
//         </Typography>
//         {eventInfo.event.extendedProps.priority === "high" && (
//           <Chip
//             label="!"
//             size="small"
//             color="error"
//             sx={{ height: 16, fontSize: "0.6rem" }}
//           />
//         )}
//       </Box>
//     );
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

//   return (
//     <div className="container">
//       <Box sx={{ p: 3 }}>
//         <Grid container spacing={3}>
//           {/* Calendar */}
//           <Grid item xs={12} lg={8}>
//             <Card>
//               <CardContent>
//                 <Box
//                   sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     mb: 2,
//                   }}
//                 >
//                   <Typography variant="h5">Lịch Công Việc</Typography>
//                   <Box sx={{ display: "flex", gap: 1 }}>
//                     <Button
//                       variant="outlined"
//                       onClick={() => navigate("/todo/list")}
//                     >
//                       Danh Sách
//                     </Button>
//                     <Button
//                       variant="contained"
//                       startIcon={<Add />}
//                       onClick={() => {
//                         setSelectedEvent(null);
//                         setFormData({
//                           title: "",
//                           description: "",
//                           start: "",
//                           end: "",
//                           type: "Task",
//                           priority: "medium",
//                           isAllDay: false,
//                           location: "",
//                           tags: [],
//                           dueDate: "",
//                           category: "",
//                           isImportant: false,
//                         });
//                         setOpenDialog(true);
//                       }}
//                     >
//                       Thêm Công Việc
//                     </Button>
//                   </Box>
//                 </Box>

//                 <FullCalendar
//                   ref={calendarRef}
//                   plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
//                   headerToolbar={{
//                     left: "prev,next today",
//                     center: "title",
//                     right: "dayGridMonth,timeGridWeek,timeGridDay",
//                   }}
//                   initialView="dayGridMonth"
//                   editable={true}
//                   selectable={true}
//                   selectMirror={true}
//                   dayMaxEvents={true}
//                   weekends={true}
//                   events={events}
//                   select={handleDateSelect}
//                   eventClick={handleEventClick}
//                   eventDrop={handleEventDrop} // Thêm dòng này
//                   eventContent={eventContent}
//                   eventDurationEditable={true}
//                   eventResizableFromStart={true}
//                   locale={viLocale}
//                   height="600px"
//                 />
//               </CardContent>
//             </Card>
//           </Grid>

//           {/* Todo List Sidebar */}
//           <Grid item xs={12} lg={4}>
//             <Card>
//               <CardContent>
//                 <Box
//                   sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     mb: 2,
//                   }}
//                 >
//                   <Typography variant="h6">Công Việc Gần Đây</Typography>
//                   <Button size="small" onClick={fetchTodos} disabled={loading}>
//                     Làm mới
//                   </Button>
//                 </Box>

//                 <Box sx={{ maxHeight: 600, overflow: "auto" }}>
//                   {loading ? (
//                     <Typography textAlign="center">Đang tải...</Typography>
//                   ) : todos.length === 0 ? (
//                     <Typography textAlign="center" color="text.secondary">
//                       Chưa có công việc nào
//                     </Typography>
//                   ) : (
//                     todos.map((todo) => (
//                       <Card
//                         key={todo._id}
//                         sx={{
//                           mb: 1,
//                           p: 2,
//                           bgcolor:
//                             todo.status === "done"
//                               ? "action.hover"
//                               : "background.paper",
//                           border: todo.isImportant ? "2px solid" : "1px solid",
//                           borderColor: todo.isImportant
//                             ? "warning.main"
//                             : "divider",
//                         }}
//                       >
//                         <Box
//                           sx={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "flex-start",
//                           }}
//                         >
//                           <Box sx={{ flex: 1 }}>
//                             <Typography
//                               variant="subtitle1"
//                               sx={{
//                                 textDecoration:
//                                   todo.status === "done"
//                                     ? "line-through"
//                                     : "none",
//                                 fontWeight: todo.isImportant
//                                   ? "bold"
//                                   : "normal",
//                               }}
//                             >
//                               {todo.title}
//                             </Typography>

//                             {todo.description && (
//                               <Typography
//                                 variant="body2"
//                                 color="text.secondary"
//                                 sx={{ mt: 0.5 }}
//                               >
//                                 {todo.description.length > 50
//                                   ? `${todo.description.substring(0, 50)}...`
//                                   : todo.description}
//                               </Typography>
//                             )}

//                             <Box
//                               sx={{
//                                 mt: 1,
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 0.5,
//                                 alignItems: "center",
//                               }}
//                             >
//                               <Chip
//                                 label={todo.priority}
//                                 size="small"
//                                 color={getPriorityColor(todo.priority)}
//                               />
//                               <Chip
//                                 label={todo.type}
//                                 size="small"
//                                 variant="outlined"
//                               />
//                               <Chip
//                                 label={todo.status}
//                                 size="small"
//                                 color={getStatusColor(todo.status)}
//                               />

//                               {todo.dueDate && (
//                                 <Typography
//                                   variant="caption"
//                                   color="text.secondary"
//                                 >
//                                   Hạn:{" "}
//                                   {new Date(todo.dueDate).toLocaleDateString(
//                                     "vi-VN"
//                                   )}
//                                 </Typography>
//                               )}

//                               {todo.hasCalendarEvent && (
//                                 <Tooltip title="Có trong lịch">
//                                   <Event
//                                     color="primary"
//                                     sx={{ fontSize: 16 }}
//                                   />
//                                 </Tooltip>
//                               )}
//                             </Box>
//                           </Box>

//                           <Box
//                             sx={{
//                               display: "flex",
//                               flexDirection: "column",
//                               gap: 0.5,
//                               ml: 1,
//                             }}
//                           >
//                             <Tooltip title="Xem chi tiết">
//                               <IconButton
//                                 size="small"
//                                 onClick={() => handleViewDetail(todo._id)}
//                               >
//                                 <Visibility fontSize="small" />
//                               </IconButton>
//                             </Tooltip>

//                             <Tooltip title="Chỉnh sửa">
//                               <IconButton
//                                 size="small"
//                                 onClick={() => handleEditTodo(todo._id)}
//                               >
//                                 <Edit fontSize="small" />
//                               </IconButton>
//                             </Tooltip>

//                             {todo.status !== "done" && (
//                               <Tooltip title="Đánh dấu hoàn thành">
//                                 <IconButton
//                                   size="small"
//                                   onClick={() => handleMarkComplete(todo._id)}
//                                   color="success"
//                                 >
//                                   <CheckCircle fontSize="small" />
//                                 </IconButton>
//                               </Tooltip>
//                             )}
//                           </Box>
//                         </Box>
//                       </Card>
//                     ))
//                   )}
//                 </Box>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//         {/* Add/Edit Todo Dialog */}
//         <Dialog
//           open={openDialog}
//           onClose={() => setOpenDialog(false)}
//           maxWidth="md"
//           fullWidth
//         >
//           <DialogTitle>
//             {selectedEvent ? "Chỉnh sửa Công Việc" : "Thêm Công Việc Mới"}
//           </DialogTitle>
//           <DialogContent>
//             <Grid container spacing={2} sx={{ mt: 1 }}>
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
//                   rows={3}
//                   label="Mô tả"
//                   value={formData.description}
//                   onChange={(e) =>
//                     setFormData({ ...formData, description: e.target.value })
//                   }
//                 />
//               </Grid>

//               <Grid item xs={6}>
//                 <FormControl fullWidth>
//                   <InputLabel>Loại</InputLabel>
//                   <Select
//                     value={formData.type}
//                     label="Loại"
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

//               <Grid item xs={6}>
//                 <FormControl fullWidth>
//                   <InputLabel>Ưu tiên</InputLabel>
//                   <Select
//                     value={formData.priority}
//                     label="Ưu tiên"
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

//               <Grid item xs={6}>
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

//               <Grid item xs={6}>
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

//               <Grid item xs={6}>
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

//               <Grid item xs={6}>
//                 <TextField
//                   fullWidth
//                   label="Địa điểm"
//                   value={formData.location}
//                   onChange={(e) =>
//                     setFormData({ ...formData, location: e.target.value })
//                   }
//                 />
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
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       checked={formData.isAllDay}
//                       onChange={(e) =>
//                         setFormData({ ...formData, isAllDay: e.target.checked })
//                       }
//                     />
//                   }
//                   label="Cả ngày"
//                 />

//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       checked={formData.isImportant}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           isImportant: e.target.checked,
//                         })
//                       }
//                     />
//                   }
//                   label="Quan trọng"
//                 />
//               </Grid>
//             </Grid>
//           </DialogContent>
//           <DialogActions>
//             {selectedEvent && (
//               <Button
//                 onClick={handleDeleteTodo}
//                 color="error"
//                 disabled={loading}
//               >
//                 <Delete /> Xóa
//               </Button>
//             )}
//             <Button onClick={() => setOpenDialog(false)} disabled={loading}>
//               Hủy
//             </Button>
//             <Button
//               onClick={selectedEvent ? handleUpdateTodo : handleCreateTodo}
//               variant="contained"
//               disabled={!formData.title || loading}
//             >
//               {selectedEvent ? "Cập nhật" : "Tạo"}
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* Snackbar */}
//         <Snackbar
//           open={snackbar.open}
//           autoHideDuration={6000}
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//         >
//           <Alert
//             onClose={() => setSnackbar({ ...snackbar, open: false })}
//             severity={snackbar.severity}
//           >
//             {snackbar.message}
//           </Alert>
//         </Snackbar>
//       </Box>
//     </div>
//   );
// };

// export default TodoCalendar;

// components/todo/TodoCalendar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  CardHeader,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Visibility,
  Event,
  Today,
  Schedule,
  Warning,
  CheckCircleOutline,
  AccessTime,
  Star,
  Upcoming,
  CalendarMonth,
  Notifications,
} from "@mui/icons-material";
import { todoService } from "../../services/todoService";

const TodoCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [todayTodos, setTodayTodos] = useState([]);
  const [upcomingTodos, setUpcomingTodos] = useState([]);
  const [importantTodos, setImportantTodos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Hôm nay, 1: Sắp tới, 2: Quan trọng, 3: Tất cả
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
    dueDate: "",
    category: "",
    isImportant: false,
  });

  const [stats, setStats] = useState({
    today: {
      total: 0,
      completed: 0,
      overdue: 0,
      inProgress: 0,
    },
    upcoming: {
      total: 0,
      highPriority: 0,
      withCalendar: 0,
    },
    important: {
      total: 0,
      completed: 0,
    },
  });

  // Fetch events từ API
  const fetchEvents = async (start, end) => {
    try {
      setLoading(true);
      const response = await todoService.getCalendarEvents(start, end);
      const formattedEvents = response.events.map((event) => ({
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
          hasCalendarEvent: event.hasCalendarEvent,
        },
        backgroundColor: event.color,
        borderColor: event.color,
      }));
      console.log("response.events: ", response.events);
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Lỗi fetch events:", error);
      showSnackbar(error.message || "Lỗi tải sự kiện", "error");
    } finally {
      setLoading(false);
    }
  };

  // const fetchEvents = async (start, end) => {
  //   try {
  //     setLoading(true);
  //     const response = await todoService.getCalendarEvents(start, end);

  //     const formattedEvents = response.events.map((event) => {
  //       // Ưu tiên dùng color từ backend
  //       let bgColor = event.color;

  //       // Nếu backend không có color (cũ), fallback theo priority
  //       if (!bgColor) {
  //         switch (event.priority) {
  //           case "high":
  //             bgColor = "#d32f2f";
  //             break;
  //           case "medium":
  //             bgColor = "#ff9800";
  //             break;
  //           case "low":
  //             bgColor = "#2196f3";
  //             break;
  //           default:
  //             bgColor = "#757575";
  //         }
  //       }

  //       // Nếu status là done → xanh lá
  //       if (event.status === "done") {
  //         bgColor = "#4caf50";
  //       }

  //       return {
  //         id: event._id,
  //         title: event.title,
  //         start: event.start,
  //         end: event.end,
  //         allDay: event.isAllDay,
  //         extendedProps: {
  //           type: event.type,
  //           priority: event.priority,
  //           location: event.location,
  //           description: event.description,
  //           status: event.status,
  //           color: bgColor,
  //           hasCalendarEvent: event.hasCalendarEvent,
  //         },
  //         backgroundColor: bgColor,
  //         borderColor: bgColor,
  //         textColor: "#ffffff", // Chữ trắng cho dễ đọc
  //       };
  //     });

  //     setEvents(formattedEvents);
  //   } catch (error) {
  //     console.error("Lỗi fetch events:", error);
  //     showSnackbar(error.message || "Lỗi tải sự kiện", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Fetch tất cả dữ liệu
  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch tất cả todos
      const allTodosResponse = await todoService.getTodos({
        limit: 100,
        sortBy: "dueDate",
      });
      setTodos(allTodosResponse.todos);

      // Fetch công việc hôm nay
      const todayResponse = await todoService.getTodayTodos({
        limit: 50,
        sortBy: "dueDate",
      });
      setTodayTodos(todayResponse.todos);

      // Fetch công việc sắp tới
      const upcomingResponse = await todoService.getUpcomingTodos(7);
      setUpcomingTodos(upcomingResponse.todos);

      // Fetch công việc quan trọng
      const importantResponse = await todoService.getImportantTodos({
        limit: 50,
      });
      setImportantTodos(importantResponse.todos);

      // Fetch thống kê
      const statsResponse = await todoService.getTodoStats("today");
      setStats((prevStats) => ({
        ...prevStats,
        today: statsResponse.stats,
      }));

      // Tính toán thống kê
      const todayStats = {
        total: todayResponse.todos.length,
        completed: todayResponse.todos.filter((todo) => todo.status === "done")
          .length,
        overdue: todayResponse.todos.filter(
          (todo) =>
            todo.dueDate &&
            new Date(todo.dueDate) < new Date() &&
            todo.status !== "done"
        ).length,
        inProgress: todayResponse.todos.filter(
          (todo) => todo.status === "in-progress"
        ).length,
      };

      const upcomingStats = {
        total: upcomingResponse.todos.length,
        highPriority: upcomingResponse.todos.filter(
          (todo) => todo.priority === "high"
        ).length,
        withCalendar: upcomingResponse.todos.filter(
          (todo) => todo.hasCalendarEvent
        ).length,
      };

      const importantStats = {
        total: importantResponse.todos.length,
        completed: importantResponse.todos.filter(
          (todo) => todo.status === "done"
        ).length,
      };

      setStats({
        today: todayStats,
        upcoming: upcomingStats,
        important: importantStats,
      });
    } catch (error) {
      console.error("Lỗi fetch data:", error);
      showSnackbar(error.message || "Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    fetchEvents(start, end);
    fetchAllData();
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
      dueDate: selectInfo.startStr,
      category: "",
      isImportant: false,
    });
    setSelectedEvent(null);
    setOpenDialog(true);
  };

  const handleEventClick = async (clickInfo) => {
    const event = clickInfo.event;
    try {
      const response = await todoService.getTodoDetail(event.id);
      const todo = response.todo;

      setSelectedEvent(event);
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
        tags: todo.tags || [],
        dueDate: todo.dueDate
          ? new Date(todo.dueDate).toISOString().slice(0, 16)
          : "",
        category: todo.category || "",
        isImportant: todo.isImportant || false,
      });
      setOpenDialog(true);
    } catch (error) {
      showSnackbar("Lỗi tải chi tiết công việc", "error");
    }
  };

  const handleCreateTodo = async () => {
    try {
      setLoading(true);
      await todoService.createTodo(formData);
      showSnackbar("Tạo công việc thành công");
      setOpenDialog(false);
      fetchEvents(new Date(), new Date());
      fetchAllData();
    } catch (error) {
      showSnackbar(error.message || "Lỗi tạo công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodo = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      await todoService.updateTodo(selectedEvent.id, formData);
      console.log("formData:", formData);
      showSnackbar("Cập nhật công việc thành công");
      setOpenDialog(false);
      fetchEvents(new Date(), new Date());
      fetchAllData();
    } catch (error) {
      showSnackbar(error.message || "Lỗi cập nhật công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      await todoService.deleteTodo(selectedEvent.id);
      showSnackbar("Xóa công việc thành công");
      setOpenDialog(false);
      fetchEvents(new Date(), new Date());
      fetchAllData();
    } catch (error) {
      showSnackbar(error.message || "Lỗi xóa công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (todoId) => {
    try {
      setLoading(true);
      await todoService.markComplete(todoId);
      showSnackbar("Đánh dấu hoàn thành thành công");
      fetchAllData();
    } catch (error) {
      showSnackbar(error.message || "Lỗi cập nhật trạng thái", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    const updatedStart = event.start.toISOString();
    const updatedEnd = event.end ? event.end.toISOString() : null;

    try {
      setLoading(true);
      await todoService.updateTodo(event.id, {
        start: updatedStart,
        end: updatedEnd,
        isAllDay: event.allDay,
      });

      showSnackbar("Cập nhật thời gian thành công");
      fetchAllData();
    } catch (error) {
      showSnackbar(error.message || "Lỗi cập nhật thời gian", "error");
      dropInfo.revert();
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (todoId) => {
    navigate(`/todo/${todoId}`);
  };

  const handleEditTodo = (todoId) => {
    navigate(`/todo/edit/${todoId}`);
  };

  const eventContent = (eventInfo) => {
    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="body2" noWrap fontSize="11px" fontWeight="medium">
          {eventInfo.timeText && `${eventInfo.timeText} `}
          {eventInfo.event.title}
        </Typography>
        {eventInfo.event.extendedProps.priority === "high" && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
          >
            <Warning sx={{ fontSize: 12, color: "error.main" }} />
            <Typography variant="caption" color="error.main">
              Quan trọng
            </Typography>
          </Box>
        )}
      </Box>
    );
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
        return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCircleOutline color="success" />;
      case "in-progress":
        return <AccessTime color="warning" />;
      case "cancelled":
        return <Warning color="error" />;
      default:
        return <Schedule color="primary" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <Warning sx={{ color: "red", fontSize: 16 }} />;
      case "medium":
        return <AccessTime sx={{ color: "orange", fontSize: 16 }} />;
      case "low":
        return <CheckCircleOutline sx={{ color: "green", fontSize: 16 }} />;
      default:
        return <Schedule sx={{ fontSize: 16 }} />;
    }
  };

  const getTabColor = (tabIndex) => {
    switch (tabIndex) {
      case 0:
        return "primary";
      case 1:
        return "secondary";
      case 2:
        return "warning";
      case 3:
        return "info";
      default:
        return "primary";
    }
  };

  const renderTodoItem = (todo) => (
    <Card
      key={todo._id}
      sx={{
        mb: 1,
        p: 2,
        bgcolor: todo.status === "done" ? "success.50" : "background.paper",
        border: todo.isImportant ? "2px solid" : "1px solid",
        borderColor: todo.isImportant ? "warning.main" : "divider",
        opacity: todo.status === "done" ? 0.8 : 1,
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 2,
          transform: "translateY(-1px)",
        },
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            {getStatusIcon(todo.status)}
            <Typography
              variant="subtitle1"
              sx={{
                textDecoration:
                  todo.status === "done" ? "line-through" : "none",
                fontWeight: todo.isImportant ? "bold" : "medium",
                flex: 1,
                color:
                  todo.status === "done" ? "text.secondary" : "text.primary",
              }}
            >
              {todo.title}
            </Typography>
          </Box>

          {todo.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {todo.description.length > 60
                ? `${todo.description.substring(0, 60)}...`
                : todo.description}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Chip
              icon={getPriorityIcon(todo.priority)}
              label={
                todo.priority === "high"
                  ? "Cao"
                  : todo.priority === "medium"
                  ? "Trung bình"
                  : "Thấp"
              }
              size="small"
              color={getPriorityColor(todo.priority)}
              variant={todo.priority === "low" ? "outlined" : "filled"}
            />
            <Chip
              label={todo.type}
              size="small"
              variant="outlined"
              color="primary"
            />
            {todo.dueDate && (
              <Chip
                icon={<Today />}
                label={new Date(todo.dueDate).toLocaleDateString("vi-VN")}
                size="small"
                variant="outlined"
                color={
                  new Date(todo.dueDate) < new Date() && todo.status !== "done"
                    ? "error"
                    : "default"
                }
              />
            )}
            {todo.hasCalendarEvent && (
              <Tooltip title="Có trong lịch">
                <Event color="primary" sx={{ fontSize: 18 }} />
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, ml: 1 }}>
          <Tooltip title="Xem chi tiết">
            <IconButton
              size="small"
              onClick={() => handleViewDetail(todo._id)}
              color="info"
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
              onClick={() => handleEditTodo(todo._id)}
              color="primary"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          {todo.status !== "done" && (
            <Tooltip title="Đánh dấu hoàn thành">
              <IconButton
                size="small"
                onClick={() => handleMarkComplete(todo._id)}
                color="success"
              >
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Card>
  );

  const renderStatsCard = (title, icon, stats, color = "primary") => (
    <Paper
      sx={{
        p: 2,
        bgcolor: `${color}.50`,
        border: `1px solid`,
        borderColor: `${color}.100`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.main`, width: 40, height: 40 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" color={`${color}.dark`}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats.total} công việc
          </Typography>
        </Box>
      </Box>

      {stats.completed !== undefined && (
        <Box sx={{ mb: 1 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="body2">Hoàn thành</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {stats.completed}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(stats.completed / stats.total) * 100}
            color="success"
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}

      {stats.overdue !== undefined && stats.overdue > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
          <Warning color="error" sx={{ fontSize: 16 }} />
          <Typography variant="body2" color="error.main">
            {stats.overdue} quá hạn
          </Typography>
        </Box>
      )}
    </Paper>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Hôm nay
        return (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                {renderStatsCard("Hôm Nay", <Today />, stats.today, "primary")}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "warning.50",
                    border: "1px solid",
                    borderColor: "warning.100",
                  }}
                >
                  <Typography variant="h6" gutterBottom color="warning.dark">
                    ⚡ Tiến độ hôm nay
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {stats.today.completed} / {stats.today.total} công việc đã
                    hoàn thành
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      stats.today.total > 0
                        ? (stats.today.completed / stats.today.total) * 100
                        : 0
                    }
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {todayTodos.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Today sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Không có công việc nào cho hôm nay!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hãy tạo công việc mới hoặc kiểm tra công việc sắp tới.
                </Typography>
              </Box>
            ) : (
              todayTodos.map(renderTodoItem)
            )}
          </Box>
        );

      case 1: // Sắp tới
        return (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                {renderStatsCard(
                  "Sắp tới",
                  <Upcoming />,
                  stats.upcoming,
                  "secondary"
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "info.50",
                    border: "1px solid",
                    borderColor: "info.100",
                  }}
                >
                  <Typography variant="h6" gutterBottom color="info.dark">
                    📅 Tuần này
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.upcoming.highPriority} công việc quan trọng
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.upcoming.withCalendar} sự kiện trong lịch
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {upcomingTodos.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Upcoming
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Không có công việc sắp tới!
                </Typography>
              </Box>
            ) : (
              upcomingTodos.map(renderTodoItem)
            )}
          </Box>
        );

      case 2: // Quan trọng
        return (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                {renderStatsCard(
                  "Quan trọng",
                  <Star />,
                  stats.important,
                  "warning"
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "error.50",
                    border: "1px solid",
                    borderColor: "error.100",
                  }}
                >
                  <Typography variant="h6" gutterBottom color="error.dark">
                    🚨 Ưu tiên cao
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.important.total - stats.important.completed} công
                    việc cần hoàn thành
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {importantTodos.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Star sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Không có công việc quan trọng!
                </Typography>
              </Box>
            ) : (
              importantTodos.map(renderTodoItem)
            )}
          </Box>
        );

      case 3: // Tất cả
        return (
          <Box>
            <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
              <Typography variant="h6" gutterBottom>
                📋 Tất cả công việc
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {todos.length} công việc trong hệ thống
              </Typography>
            </Paper>

            {todos.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Schedule
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Chưa có công việc nào!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenDialog(true)}
                >
                  Tạo công việc đầu tiên
                </Button>
              </Box>
            ) : (
              todos.map(renderTodoItem)
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: "fit-content" }}>
            <CardHeader
              title="📅 Lịch Công Việc"
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/todo/list")}
                    startIcon={<Schedule />}
                  >
                    Danh Sách
                  </Button>
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
                        dueDate: "",
                        category: "",
                        isImportant: false,
                      });
                      setOpenDialog(true);
                    }}
                  >
                    Thêm Công Việc
                  </Button>
                </Box>
              }
            />
            <CardContent>
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
                eventDrop={handleEventDrop}
                eventContent={eventContent}
                eventDurationEditable={true}
                eventResizableFromStart={true}
                locale={viLocale}
                height="650px"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Todo List Sidebar */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  "& .MuiTab-root": { minHeight: 60 },
                }}
              >
                <Tab
                  icon={<Today />}
                  label={
                    <Badge
                      badgeContent={todayTodos.length}
                      color="error"
                      sx={{ "& .MuiBadge-badge": { right: -15 } }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          Hôm nay
                        </Typography>
                      </Box>
                    </Badge>
                  }
                />
                <Tab
                  icon={<Upcoming />}
                  label={
                    <Badge
                      badgeContent={upcomingTodos.length}
                      color="secondary"
                      sx={{ "& .MuiBadge-badge": { right: -15 } }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          Sắp tới
                        </Typography>
                      </Box>
                    </Badge>
                  }
                />
                <Tab
                  icon={<Star />}
                  label={
                    <Badge
                      badgeContent={importantTodos.length}
                      color="warning"
                      sx={{ "& .MuiBadge-badge": { right: -15 } }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          Quan trọng
                        </Typography>
                      </Box>
                    </Badge>
                  }
                />
                <Tab
                  icon={<Schedule />}
                  label={
                    <Badge
                      badgeContent={todos.length}
                      color="primary"
                      sx={{ "& .MuiBadge-badge": { right: -15 } }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          Tất cả
                        </Typography>
                      </Box>
                    </Badge>
                  }
                />
              </Tabs>

              <Box sx={{ maxHeight: 600, overflow: "auto", p: 2 }}>
                {loading ? (
                  <Box textAlign="center" py={4}>
                    {/* <CircularProgress /> */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      Đang tải dữ liệu...
                    </Typography>
                  </Box>
                ) : (
                  renderTabContent()
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Todo Dialog */}
      {/* <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
          {selectedEvent ? "Chỉnh sửa Công Việc" : "Thêm Công Việc Mới"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tiêu đề *"
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

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loại</InputLabel>
                <Select
                  value={formData.type}
                  label="Loại"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <MenuItem value="Meeting">👥 Meeting</MenuItem>
                  <MenuItem value="BusinessTravel">✈️ Công tác</MenuItem>
                  <MenuItem value="PersonalWork">👤 Cá nhân</MenuItem>
                  <MenuItem value="TeamProject">👨‍👩‍👧‍👦 Dự án nhóm</MenuItem>
                  <MenuItem value="Appointment">📅 Cuộc hẹn</MenuItem>
                  <MenuItem value="Task">📝 Công việc</MenuItem>
                  <MenuItem value="Other">📌 Khác</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ưu tiên</InputLabel>
                <Select
                  value={formData.priority}
                  label="Ưu tien"
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <MenuItem value="low">🟢 Thấp</MenuItem>
                  <MenuItem value="medium">🟡 Trung bình</MenuItem>
                  <MenuItem value="high">🔴 Cao</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
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
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Danh mục"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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
                  />
                }
                label="Quan trọng"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {selectedEvent && (
            <Button
              onClick={handleDeleteTodo}
              color="error"
              disabled={loading}
              startIcon={<Delete />}
            >
              Xóa
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={selectedEvent ? handleUpdateTodo : handleCreateTodo}
            variant="contained"
            disabled={!formData.title || loading}
          >
            {selectedEvent ? "📝 Cập nhật" : "✨ Tạo"}
          </Button>
        </DialogActions>
      </Dialog> */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            py: 2,
            fontSize: "1.25rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {selectedEvent ? "📝 Chỉnh sửa Công Việc" : "✨ Thêm Công Việc Mới"}
        </DialogTitle>

        <DialogContent sx={{ py: 4, my: 3 }}>
          <Grid container spacing={3}>
            {/* Tiêu đề */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tiêu đề *"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>

            {/* Mô tả */}
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
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>

            {/* Loại và Ưu tiên */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại công việc</InputLabel>
                <Select
                  value={formData.type}
                  label="Loại công việc"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="Meeting">👥 Meeting</MenuItem>
                  <MenuItem value="BusinessTravel">✈️ Công tác</MenuItem>
                  <MenuItem value="PersonalWork">👤 Cá nhân</MenuItem>
                  <MenuItem value="TeamProject">👨‍👩‍👧‍👦 Dự án nhóm</MenuItem>
                  <MenuItem value="Appointment">📅 Cuộc hẹn</MenuItem>
                  <MenuItem value="Task">📝 Công việc</MenuItem>
                  <MenuItem value="Other">📌 Khác</MenuItem>
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
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="low">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
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
                          width: 8,
                          height: 8,
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
                          width: 8,
                          height: 8,
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

            {/* Thời gian */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bắt đầu"
                type="datetime-local"
                value={formData.start}
                onChange={(e) =>
                  setFormData({ ...formData, start: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Kết thúc"
                type="datetime-local"
                value={formData.end}
                onChange={(e) =>
                  setFormData({ ...formData, end: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>

            {/* Địa điểm và Danh mục */}
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>

            {/* Checkboxes */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isAllDay}
                      onChange={(e) =>
                        setFormData({ ...formData, isAllDay: e.target.checked })
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ fontSize: "1.2rem" }}>🌞</Box>
                      <span>Cả ngày</span>
                    </Box>
                  }
                />
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
                      color="error"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ fontSize: "1.2rem" }}>⭐</Box>
                      <span>Quan trọng</span>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          {selectedEvent && (
            <Button
              onClick={handleDeleteTodo}
              color="error"
              disabled={loading}
              startIcon={<Delete />}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Xóa
            </Button>
          )}
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={loading}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Hủy
          </Button>
          <Button
            onClick={selectedEvent ? handleUpdateTodo : handleCreateTodo}
            variant="contained"
            disabled={!formData.title || loading}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
            }}
          >
            {selectedEvent ? "📝 Cập nhật" : "✨ Tạo công việc"}
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
