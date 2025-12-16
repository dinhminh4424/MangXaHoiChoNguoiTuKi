// ==================================================================================================
// components/todo/TodoCalendar.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import viLocale from "@fullcalendar/core/locales/vi";
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Button,
//   Modal,
//   Form,
//   Alert,
//   Badge,
//   ProgressBar,
//   Tooltip,
//   OverlayTrigger,
// } from "react-bootstrap";
// import {
//   Add,
//   Edit,
//   Delete,
//   CheckCircle,
//   Visibility,
//   Event,
//   Today,
//   Schedule,
//   Warning,
//   CheckCircleOutline,
//   AccessTime,
//   Star,
//   Upcoming,
//   Close,
//   ArrowBack,
//   ArrowForward,
// } from "@mui/icons-material";

// import { todoService } from "../../services/todoService";

// const TodoCalendar = () => {
//   const navigate = useNavigate();
//   const [events, setEvents] = useState([]);
//   const [todos, setTodos] = useState([]);
//   const [todayTodos, setTodayTodos] = useState([]);
//   const [upcomingTodos, setUpcomingTodos] = useState([]);
//   const [importantTodos, setImportantTodos] = useState([]);
//   const [showDialog, setShowDialog] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState(0);
//   const [showSnackbar, setShowSnackbar] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState("");
//   const [snackbarSeverity, setSnackbarSeverity] = useState("success");
//   const [eventPopover, setEventPopover] = useState({
//     show: false,
//     anchorEl: null,
//     event: null,
//     position: { x: 0, y: 0 },
//   });
//   const calendarRef = useRef();
//   const [currentDate, setCurrentDate] = useState(new Date());

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

//   const [stats, setStats] = useState({
//     today: {
//       total: 0,
//       completed: 0,
//       overdue: 0,
//       inProgress: 0,
//     },
//     upcoming: {
//       total: 0,
//       highPriority: 0,
//       withCalendar: 0,
//     },
//     important: {
//       total: 0,
//       completed: 0,
//     },
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
//           dueDate: event.dueDate,
//           category: event.category,
//           tags: event.tags || [],
//           subtasks: event.subtasks || [],
//         },
//         backgroundColor: event.color,
//         borderColor: event.color,
//       }));
//       setEvents(formattedEvents);
//     } catch (error) {
//       console.error("Lỗi fetch events:", error);
//       showMessage(error.message || "Lỗi tải sự kiện", "error");
//     } finally {
//       setLoading(false);
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

//   // Fetch tất cả dữ liệu
//   const fetchAllData = async () => {
//     try {
//       setLoading(true);

//       // Fetch tất cả todos
//       const allTodosResponse = await todoService.getTodos({
//         limit: 100,
//         sortBy: "dueDate",
//       });
//       setTodos(allTodosResponse.todos);

//       // Fetch công việc hôm nay
//       const todayResponse = await todoService.getTodayTodos({
//         limit: 50,
//         sortBy: "dueDate",
//       });
//       setTodayTodos(todayResponse.todos);

//       // Fetch công việc sắp tới
//       const upcomingResponse = await todoService.getUpcomingTodos(7);
//       setUpcomingTodos(upcomingResponse.todos);

//       // Fetch công việc quan trọng
//       const importantResponse = await todoService.getImportantTodos({
//         limit: 50,
//       });
//       setImportantTodos(importantResponse.todos);

//       // Tính toán thống kê
//       const todayStats = {
//         total: todayResponse.todos.length,
//         completed: todayResponse.todos.filter((todo) => todo.status === "done")
//           .length,
//         overdue: todayResponse.todos.filter(
//           (todo) =>
//             todo.dueDate &&
//             new Date(todo.dueDate) < new Date() &&
//             todo.status !== "done"
//         ).length,
//         inProgress: todayResponse.todos.filter(
//           (todo) => todo.status === "in-progress"
//         ).length,
//       };

//       const upcomingStats = {
//         total: upcomingResponse.todos.length,
//         highPriority: upcomingResponse.todos.filter(
//           (todo) => todo.priority === "high"
//         ).length,
//         withCalendar: upcomingResponse.todos.filter(
//           (todo) => todo.hasCalendarEvent
//         ).length,
//       };

//       const importantStats = {
//         total: importantResponse.todos.length,
//         completed: importantResponse.todos.filter(
//           (todo) => todo.status === "done"
//         ).length,
//       };

//       setStats({
//         today: todayStats,
//         upcoming: upcomingStats,
//         important: importantStats,
//       });
//     } catch (error) {
//       console.error("Lỗi fetch data:", error);
//       showMessage(error.message || "Lỗi tải dữ liệu", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Tính toán ngày đầu tháng và cuối tháng của tháng hiện tại
//     const now = new Date();
//     const start = new Date(now.getFullYear(), now.getMonth(), 1);
//     const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//     fetchEvents(start, end);
//     fetchAllData();
//   }, []);

//   // Thêm useEffect để load lại events khi currentDate thay đổi
//   useEffect(() => {
//     const start = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       1
//     );
//     const end = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth() + 1,
//       0
//     );
//     fetchEvents(start, end);
//   }, [currentDate]);

//   const showMessage = (message, severity = "success") => {
//     setSnackbarMessage(message);
//     setSnackbarSeverity(severity);
//     setShowSnackbar(true);
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
//       dueDate: selectInfo.startStr,
//       category: "",
//       isImportant: false,
//     });
//     setSelectedEvent(null);
//     setShowDialog(true);
//   };

//   const handleEventClick = async (clickInfo) => {
//     // Đóng popover nếu đang mở
//     if (eventPopover.show) {
//       setEventPopover({
//         show: false,
//         anchorEl: null,
//         event: null,
//         position: { x: 0, y: 0 },
//       });
//       return;
//     }

//     const event = clickInfo.event;
//     const rect = clickInfo.el.getBoundingClientRect();

//     // Lấy thông tin sự kiện chi tiết
//     try {
//       const response = await todoService.getTodoDetail(event.id);
//       const todo = response.todo;

//       // Hiển thị popover thay vì modal
//       setEventPopover({
//         show: true,
//         anchorEl: clickInfo.el,
//         event: {
//           ...event,
//           extendedProps: {
//             ...event.extendedProps,
//             description: todo.description || event.extendedProps.description,
//             location: todo.location || event.extendedProps.location,
//             category: todo.category || event.extendedProps.category,
//             isImportant: todo.isImportant || event.extendedProps.isImportant,
//             tags: todo.tags || event.extendedProps.tags,
//             subtasks: todo.subtasks || event.extendedProps.subtasks,
//             dueDate: todo.dueDate || event.extendedProps.dueDate,
//           },
//         },
//         position: {
//           x: rect.left + rect.width / 2,
//           y: rect.top + window.scrollY,
//         },
//       });

//       // Lưu thông tin sự kiện cho modal chỉnh sửa
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
//     } catch (error) {
//       // Nếu không lấy được chi tiết, vẫn hiển thị popover với thông tin cơ bản
//       setEventPopover({
//         show: true,
//         anchorEl: clickInfo.el,
//         event: event,
//         position: {
//           x: rect.left + rect.width / 2,
//           y: rect.top + window.scrollY,
//         },
//       });
//       setSelectedEvent(event);
//     }
//   };

//   // Xử lý sự kiện khi calendar thay đổi view
//   const handleDatesSet = (dateInfo) => {
//     setCurrentDate(new Date(dateInfo.start));
//   };

//   // Xử lý điều hướng tháng
//   const handlePrevMonth = () => {
//     if (calendarRef.current) {
//       const calendarApi = calendarRef.current.getApi();
//       calendarApi.prev();
//       setCurrentDate(calendarApi.getDate());
//     }
//   };

//   const handleNextMonth = () => {
//     if (calendarRef.current) {
//       const calendarApi = calendarRef.current.getApi();
//       calendarApi.next();
//       setCurrentDate(calendarApi.getDate());
//     }
//   };

//   const handleToday = () => {
//     if (calendarRef.current) {
//       const calendarApi = calendarRef.current.getApi();
//       calendarApi.today();
//       setCurrentDate(calendarApi.getDate());
//     }
//   };

//   const handleCreateTodo = async () => {
//     try {
//       setLoading(true);
//       await todoService.createTodo(formData);
//       showMessage("Tạo công việc thành công");
//       setShowDialog(false);

//       // Load lại events với tháng hiện tại
//       const start = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       const end = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       );
//       fetchEvents(start, end);
//       fetchAllData();
//     } catch (error) {
//       showMessage(error.message || "Lỗi tạo công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateTodo = async () => {
//     if (!selectedEvent) return;

//     try {
//       setLoading(true);
//       await todoService.updateTodo(selectedEvent.id, formData);
//       showMessage("Cập nhật công việc thành công");
//       setShowDialog(false);
//       setEventPopover({
//         show: false,
//         anchorEl: null,
//         event: null,
//         position: { x: 0, y: 0 },
//       });

//       // Load lại events với tháng hiện tại
//       const start = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       const end = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       );
//       fetchEvents(start, end);
//       fetchAllData();
//     } catch (error) {
//       showMessage(error.message || "Lỗi cập nhật công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteTodo = async () => {
//     if (!selectedEvent) return;

//     try {
//       setLoading(true);
//       await todoService.deleteTodo(selectedEvent.id);
//       showMessage("Xóa công việc thành công");
//       setShowDialog(false);
//       setEventPopover({
//         show: false,
//         anchorEl: null,
//         event: null,
//         position: { x: 0, y: 0 },
//       });

//       // Load lại events với tháng hiện tại
//       const start = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       const end = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       );
//       fetchEvents(start, end);
//       fetchAllData();
//     } catch (error) {
//       showMessage(error.message || "Lỗi xóa công việc", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarkComplete = async (todoId) => {
//     try {
//       setLoading(true);
//       await todoService.markComplete(todoId);
//       showMessage("Đánh dấu hoàn thành thành công");

//       // Load lại events với tháng hiện tại
//       const start = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       const end = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       );
//       fetchEvents(start, end);
//       fetchAllData();
//     } catch (error) {
//       showMessage(error.message || "Lỗi cập nhật trạng thái", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEventDrop = async (dropInfo) => {
//     const { event } = dropInfo;
//     const updatedStart = event.start.toISOString();
//     const updatedEnd = event.end ? event.end.toISOString() : null;

//     try {
//       setLoading(true);
//       await todoService.updateTodo(event.id, {
//         start: updatedStart,
//         end: updatedEnd,
//         isAllDay: event.allDay,
//       });

//       showMessage("Cập nhật thời gian thành công");

//       // Load lại events với tháng hiện tại
//       const start = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       const end = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       );
//       fetchEvents(start, end);
//       fetchAllData();
//     } catch (error) {
//       showMessage(error.message || "Lỗi cập nhật thời gian", "error");
//       dropInfo.revert();
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

//   const handleEditEvent = () => {
//     if (eventPopover.event) {
//       setShowDialog(true);
//       setEventPopover({
//         show: false,
//         anchorEl: null,
//         event: null,
//         position: { x: 0, y: 0 },
//       });
//     }
//   };

//   const eventContent = (eventInfo) => {
//     return (
//       <div className="p-1">
//         <small className="fw-medium text-truncate d-block">
//           {eventInfo.timeText && `${eventInfo.timeText} `}
//           {eventInfo.event.title}
//         </small>
//         {eventInfo.event.extendedProps.priority === "high" && (
//           <div className="d-flex align-items-center gap-1 mt-1">
//             <Warning style={{ fontSize: 12, color: "#dc3545" }} />
//             <small className="text-danger">Quan trọng</small>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "done":
//         return <CheckCircleOutline className="text-success" />;
//       case "in-progress":
//         return <AccessTime className="text-warning" />;
//       case "cancelled":
//         return <Warning className="text-danger" />;
//       default:
//         return <Schedule className="text-primary" />;
//     }
//   };

//   const getPriorityIcon = (priority) => {
//     switch (priority) {
//       case "high":
//         return <Warning style={{ color: "red", fontSize: 16 }} />;
//       case "medium":
//         return <AccessTime style={{ color: "orange", fontSize: 16 }} />;
//       case "low":
//         return <CheckCircleOutline style={{ color: "green", fontSize: 16 }} />;
//       default:
//         return <Schedule style={{ fontSize: 16 }} />;
//     }
//   };

//   const renderTodoItem = (todo) => (
//     <Card
//       key={todo._id}
//       className={`mb-2 ${todo.status === "done" ? "bg-light" : ""} ${
//         todo.isImportant ? "border-warning border-2" : ""
//       }`}
//       style={{
//         opacity: todo.status === "done" ? 0.8 : 1,
//         transition: "all 0.2s",
//       }}
//     >
//       <Card.Body className="p-2">
//         <div className="d-flex justify-content-between align-items-start">
//           <div className="flex-grow-1">
//             <div className="d-flex align-items-center gap-2 mb-1">
//               {getStatusIcon(todo.status)}
//               <h6
//                 className={`mb-0 ${
//                   todo.status === "done" ? "text-decoration-line-through" : ""
//                 } ${todo.isImportant ? "fw-bold" : "fw-medium"}`}
//                 style={{
//                   color: todo.status === "done" ? "#6c757d" : "inherit",
//                 }}
//               >
//                 {todo.title}
//               </h6>
//             </div>

//             {todo.description && (
//               <p className="text-muted small mb-2">
//                 {todo.description.length > 60
//                   ? `${todo.description.substring(0, 60)}...`
//                   : todo.description}
//               </p>
//             )}

//             <div className="d-flex flex-wrap gap-1 align-items-center">
//               <Badge
//                 bg={getPriorityColor(todo.priority)}
//                 className="d-flex align-items-center gap-1"
//               >
//                 {getPriorityIcon(todo.priority)}
//                 {todo.priority === "high"
//                   ? "Cao"
//                   : todo.priority === "medium"
//                   ? "Trung bình"
//                   : "Thấp"}
//               </Badge>
//               <Badge bg="outline-primary" text="dark">
//                 {todo.type}
//               </Badge>
//               {todo.dueDate && (
//                 <Badge
//                   bg="outline-secondary"
//                   text={
//                     new Date(todo.dueDate) < new Date() &&
//                     todo.status !== "done"
//                       ? "danger"
//                       : "dark"
//                   }
//                   className="d-flex align-items-center gap-1"
//                 >
//                   <Today style={{ fontSize: 14 }} />
//                   {new Date(todo.dueDate).toLocaleDateString("vi-VN")}
//                 </Badge>
//               )}
//               {todo.hasCalendarEvent && (
//                 <OverlayTrigger
//                   placement="top"
//                   overlay={<Tooltip>Có trong lịch</Tooltip>}
//                 >
//                   <Event className="text-primary" style={{ fontSize: 18 }} />
//                 </OverlayTrigger>
//               )}
//             </div>
//           </div>

//           <div className="d-flex flex-column gap-1 ms-2">
//             <OverlayTrigger
//               placement="top"
//               overlay={<Tooltip>Xem chi tiết</Tooltip>}
//             >
//               <Button
//                 variant="outline-info"
//                 size="sm"
//                 onClick={() => handleViewDetail(todo._id)}
//               >
//                 <Visibility fontSize="small" />
//               </Button>
//             </OverlayTrigger>

//             <OverlayTrigger
//               placement="top"
//               overlay={<Tooltip>Chỉnh sửa</Tooltip>}
//             >
//               <Button
//                 variant="outline-primary"
//                 size="sm"
//                 onClick={() => handleEditTodo(todo._id)}
//               >
//                 <Edit fontSize="small" />
//               </Button>
//             </OverlayTrigger>

//             {todo.status !== "done" && (
//               <OverlayTrigger
//                 placement="top"
//                 overlay={<Tooltip>Đánh dấu hoàn thành</Tooltip>}
//               >
//                 <Button
//                   variant="outline-success"
//                   size="sm"
//                   onClick={() => handleMarkComplete(todo._id)}
//                 >
//                   <CheckCircle fontSize="small" />
//                 </Button>
//               </OverlayTrigger>
//             )}
//           </div>
//         </div>
//       </Card.Body>
//     </Card>
//   );

//   const renderStatsCard = (title, icon, stats, color = "primary") => (
//     <Card className={`border-${color} bg-${color}-subtle`}>
//       <Card.Body>
//         <div className="d-flex align-items-center gap-3 mb-3">
//           <div
//             className={`bg-${color} text-white rounded-circle d-flex align-items-center justify-content-center`}
//             style={{ width: 50, height: 50 }}
//           >
//             {icon}
//           </div>
//           <div>
//             <h5 className={`text-${color} fw-bold mb-0`}>{title}</h5>
//             <p className="text-muted mb-0">{stats.total} công việc</p>
//           </div>
//         </div>

//         {stats.completed !== undefined && (
//           <div className="mb-2">
//             <div className="d-flex justify-content-between mb-1">
//               <span className="small">Hoàn thành</span>
//               <span className="small fw-bold text-success">
//                 {stats.completed}
//               </span>
//             </div>
//             <ProgressBar
//               now={(stats.completed / stats.total) * 100}
//               variant="success"
//               style={{ height: 6 }}
//             />
//           </div>
//         )}

//         {stats.overdue !== undefined && stats.overdue > 0 && (
//           <div className="d-flex align-items-center gap-2 mt-2">
//             <Warning className="text-danger" style={{ fontSize: 16 }} />
//             <small className="text-danger">{stats.overdue} quá hạn</small>
//           </div>
//         )}
//       </Card.Body>
//     </Card>
//   );

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 0: // Hôm nay
//         return (
//           <div>
//             <Row className="mb-3">
//               <Col md={6}>
//                 {renderStatsCard("Hôm Nay", <Today />, stats.today, "primary")}
//               </Col>
//               <Col md={6}>
//                 <Card className="border-warning bg-warning-subtle">
//                   <Card.Body>
//                     <h6 className="text-warning mb-2">⚡ Tiến độ hôm nay</h6>
//                     <p className="text-muted small mb-2">
//                       {stats.today.completed} / {stats.today.total} công việc đã
//                       hoàn thành
//                     </p>
//                     <ProgressBar
//                       now={
//                         stats.today.total > 0
//                           ? (stats.today.completed / stats.today.total) * 100
//                           : 0
//                       }
//                       variant="warning"
//                       style={{ height: 8 }}
//                     />
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>

//             {todayTodos.length === 0 ? (
//               <div className="text-center py-4">
//                 <Today className="text-muted mb-3" style={{ fontSize: 48 }} />
//                 <h6 className="text-muted mb-2">
//                   Không có công việc nào cho hôm nay!
//                 </h6>
//                 <p className="text-muted">
//                   Hãy tạo công việc mới hoặc kiểm tra công việc sắp tới.
//                 </p>
//               </div>
//             ) : (
//               todayTodos.map(renderTodoItem)
//             )}
//           </div>
//         );

//       case 1: // Sắp tới
//         return (
//           <div>
//             <Row className="mb-3">
//               <Col md={6}>
//                 {renderStatsCard(
//                   "Sắp tới",
//                   <Upcoming />,
//                   stats.upcoming,
//                   "secondary"
//                 )}
//               </Col>
//               <Col md={6}>
//                 <Card className="border-info bg-info-subtle">
//                   <Card.Body>
//                     <h6 className="text-info mb-2">📅 Tuần này</h6>
//                     <p className="text-muted small mb-1">
//                       {stats.upcoming.highPriority} công việc quan trọng
//                     </p>
//                     <p className="text-muted small">
//                       {stats.upcoming.withCalendar} sự kiện trong lịch
//                     </p>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>

//             {upcomingTodos.length === 0 ? (
//               <div className="text-center py-4">
//                 <Upcoming
//                   className="text-muted mb-3"
//                   style={{ fontSize: 48 }}
//                 />
//                 <h6 className="text-muted">Không có công việc sắp tới!</h6>
//               </div>
//             ) : (
//               upcomingTodos.map(renderTodoItem)
//             )}
//           </div>
//         );

//       case 2: // Quan trọng
//         return (
//           <div>
//             <Row className="mb-3">
//               <Col md={6}>
//                 {renderStatsCard(
//                   "Quan trọng",
//                   <Star />,
//                   stats.important,
//                   "warning"
//                 )}
//               </Col>
//               <Col md={6}>
//                 <Card className="border-danger bg-danger-subtle">
//                   <Card.Body>
//                     <h6 className="text-danger mb-2">🚨 Ưu tiên cao</h6>
//                     <p className="text-muted small">
//                       {stats.important.total - stats.important.completed} công
//                       việc cần hoàn thành
//                     </p>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>

//             {importantTodos.length === 0 ? (
//               <div className="text-center py-4">
//                 <Star className="text-muted mb-3" style={{ fontSize: 48 }} />
//                 <h6 className="text-muted">Không có công việc quan trọng!</h6>
//               </div>
//             ) : (
//               importantTodos.map(renderTodoItem)
//             )}
//           </div>
//         );

//       case 3: // Tất cả
//         return (
//           <div>
//             <Card className="bg-light mb-3">
//               <Card.Body>
//                 <h6 className="mb-2">📋 Tất cả công việc</h6>
//                 <p className="text-muted mb-0">
//                   {todos.length} công việc trong hệ thống
//                 </p>
//               </Card.Body>
//             </Card>

//             {todos.length === 0 ? (
//               <div className="text-center py-4">
//                 <Schedule
//                   className="text-muted mb-3"
//                   style={{ fontSize: 48 }}
//                 />
//                 <h6 className="text-muted mb-3">Chưa có công việc nào!</h6>
//                 <Button variant="primary" onClick={() => setShowDialog(true)}>
//                   <Add /> Tạo công việc đầu tiên
//                 </Button>
//               </div>
//             ) : (
//               todos.map(renderTodoItem)
//             )}
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   const getChipColor = (type, value) => {
//     if (type === "status") {
//       switch (value) {
//         case "done":
//           return "success";
//         case "in-progress":
//           return "warning";
//         case "cancelled":
//           return "error";
//         default:
//           return "default";
//       }
//     }
//     if (type === "priority") {
//       switch (value) {
//         case "high":
//           return "error";
//         case "medium":
//           return "warning";
//         case "low":
//           return "success";
//         default:
//           return "default";
//       }
//     }
//     return "default";
//   };

//   // Format tháng năm để hiển thị
//   const formatMonthYear = (date) => {
//     return date.toLocaleDateString("vi-VN", {
//       month: "long",
//       year: "numeric",
//     });
//   };

//   return (
//     <Container fluid className="py-3">
//       <Row>
//         {/* Calendar */}
//         <Col lg={8}>
//           <Card className="h-100">
//             <Card.Header className="d-flex justify-content-between align-items-center">
//               <div className="d-flex align-items-center gap-3">
//                 <h5 className="mb-0">📅 Lịch Công Việc</h5>
//                 <div className="d-flex align-items-center gap-2">
//                   <Button
//                     variant="outline-secondary"
//                     size="sm"
//                     onClick={handlePrevMonth}
//                   >
//                     <ArrowBack />
//                   </Button>
//                   <Button
//                     variant="outline-primary"
//                     size="sm"
//                     onClick={handleToday}
//                   >
//                     <Today /> Hôm nay
//                   </Button>
//                   <Button
//                     variant="outline-secondary"
//                     size="sm"
//                     onClick={handleNextMonth}
//                   >
//                     <ArrowForward />
//                   </Button>
//                   <span className="ms-2 fw-bold">
//                     {formatMonthYear(currentDate)}
//                   </span>
//                 </div>
//               </div>
//               <div className="d-flex gap-2">
//                 <Button
//                   variant="outline-primary"
//                   onClick={() => navigate("/todo/list")}
//                 >
//                   <Schedule /> Danh Sách
//                 </Button>
//                 <Button
//                   variant="primary"
//                   onClick={() => {
//                     setSelectedEvent(null);
//                     setFormData({
//                       title: "",
//                       description: "",
//                       start: "",
//                       end: "",
//                       type: "Task",
//                       priority: "medium",
//                       isAllDay: false,
//                       location: "",
//                       tags: [],
//                       dueDate: "",
//                       category: "",
//                       isImportant: false,
//                     });
//                     setShowDialog(true);
//                   }}
//                 >
//                   <Add /> Thêm Công Việc
//                 </Button>
//               </div>
//             </Card.Header>
//             <Card.Body>
//               <FullCalendar
//                 ref={calendarRef}
//                 plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
//                 headerToolbar={{
//                   left: "prev,next today",
//                   center: "title",
//                   right: "dayGridMonth,timeGridWeek,timeGridDay",
//                 }}
//                 initialView="dayGridMonth"
//                 editable={true}
//                 selectable={true}
//                 selectMirror={true}
//                 dayMaxEvents={true}
//                 weekends={true}
//                 events={events}
//                 select={handleDateSelect}
//                 eventClick={handleEventClick}
//                 eventDrop={handleEventDrop}
//                 eventContent={eventContent}
//                 eventDurationEditable={true}
//                 eventResizableFromStart={true}
//                 locale={viLocale}
//                 height="650px"
//                 datesSet={handleDatesSet}
//                 initialDate={currentDate}
//               />
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Todo List Sidebar */}
//         <Col lg={4}>
//           <Card>
//             <Card.Body className="p-0">
//               <div className="border-bottom">
//                 <div
//                   className="nav nav-tabs nav-fill"
//                   style={{ minHeight: "60px" }}
//                 >
//                   <div className="nav-item">
//                     <button
//                       className={`nav-link ${activeTab === 0 ? "active" : ""}`}
//                       onClick={() => setActiveTab(0)}
//                       style={{ border: "none", background: "none" }}
//                     >
//                       <Badge
//                         bg="danger"
//                         className="position-absolute top-0 start-100 translate-middle"
//                       >
//                         {todayTodos.length}
//                       </Badge>
//                       <Today />
//                       <div className="small fw-bold">Hôm nay</div>
//                     </button>
//                   </div>
//                   <div className="nav-item">
//                     <button
//                       className={`nav-link ${activeTab === 1 ? "active" : ""}`}
//                       onClick={() => setActiveTab(1)}
//                       style={{ border: "none", background: "none" }}
//                     >
//                       <Badge
//                         bg="secondary"
//                         className="position-absolute top-0 start-100 translate-middle"
//                       >
//                         {upcomingTodos.length}
//                       </Badge>
//                       <Upcoming />
//                       <div className="small fw-bold">Sắp tới</div>
//                     </button>
//                   </div>
//                   <div className="nav-item">
//                     <button
//                       className={`nav-link ${activeTab === 2 ? "active" : ""}`}
//                       onClick={() => setActiveTab(2)}
//                       style={{ border: "none", background: "none" }}
//                     >
//                       <Badge
//                         bg="warning"
//                         className="position-absolute top-0 start-100 translate-middle"
//                       >
//                         {importantTodos.length}
//                       </Badge>
//                       <Star />
//                       <div className="small fw-bold">Quan trọng</div>
//                     </button>
//                   </div>
//                   <div className="nav-item">
//                     <button
//                       className={`nav-link ${activeTab === 3 ? "active" : ""}`}
//                       onClick={() => setActiveTab(3)}
//                       style={{ border: "none", background: "none" }}
//                     >
//                       <Badge
//                         bg="primary"
//                         className="position-absolute top-0 start-100 translate-middle"
//                       >
//                         {todos.length}
//                       </Badge>
//                       <Schedule />
//                       <div className="small fw-bold">Tất cả</div>
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div
//                 style={{ maxHeight: "600px", overflow: "auto" }}
//                 className="p-3"
//               >
//                 {loading ? (
//                   <div className="text-center py-4">
//                     <div className="spinner-border text-primary" role="status">
//                       <span className="visually-hidden">Đang tải...</span>
//                     </div>
//                     <p className="text-muted mt-2">Đang tải dữ liệu...</p>
//                   </div>
//                 ) : (
//                   renderTabContent()
//                 )}
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Event Popover */}
//       {eventPopover.show && eventPopover.event && (
//         <div
//           style={{
//             position: "absolute",
//             top: `${eventPopover.position.y + 30}px`,
//             left: `${eventPopover.position.x - 190}px`,
//             zIndex: 9999,
//             background: "white",
//             border: "1px solid #e0e0e0",
//             borderRadius: "8px",
//             padding: "16px",
//             boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
//             width: "380px",
//             maxHeight: "80vh",
//             overflow: "auto",
//             fontSize: "0.875rem",
//           }}
//         >
//           {/* Header với nút đóng và chỉnh sửa */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "12px",
//             }}
//           >
//             <div style={{ flex: 1 }}>
//               <strong
//                 style={{
//                   fontSize: "1.1rem",
//                   display: "block",
//                   wordBreak: "break-word",
//                 }}
//               >
//                 {eventPopover.event.title}
//               </strong>
//             </div>
//             <div style={{ display: "flex", gap: "4px" }}>
//               <Button
//                 variant="outline-primary"
//                 size="sm"
//                 onClick={handleEditEvent}
//                 style={{ minWidth: "auto", padding: "4px 8px" }}
//               >
//                 <Edit fontSize="small" />
//               </Button>
//               <Button
//                 variant="outline-danger"
//                 size="sm"
//                 onClick={() =>
//                   setEventPopover({
//                     show: false,
//                     anchorEl: null,
//                     event: null,
//                     position: { x: 0, y: 0 },
//                   })
//                 }
//                 style={{ minWidth: "auto", padding: "4px 8px" }}
//               >
//                 <Close fontSize="small" />
//               </Button>
//             </div>
//           </div>

//           {eventPopover.event.extendedProps.description && (
//             <>
//               <div
//                 style={{
//                   marginBottom: "12px",
//                   whiteSpace: "pre-wrap",
//                   lineHeight: 1.4,
//                   wordBreak: "break-word",
//                   color: "#666",
//                   fontSize: "0.875rem",
//                 }}
//               >
//                 {eventPopover.event.extendedProps.description}
//               </div>
//               <hr
//                 style={{
//                   margin: "12px 0",
//                   border: "none",
//                   borderTop: "1px solid #e0e0e0",
//                 }}
//               />
//             </>
//           )}

//           <div
//             style={{
//               display: "flex",
//               gap: "4px",
//               flexWrap: "wrap",
//               marginBottom: "12px",
//             }}
//           >
//             <span
//               style={{
//                 background:
//                   getChipColor(
//                     "status",
//                     eventPopover.event.extendedProps.status
//                   ) === "success"
//                     ? "#d4edda"
//                     : getChipColor(
//                         "status",
//                         eventPopover.event.extendedProps.status
//                       ) === "warning"
//                     ? "#fff3cd"
//                     : getChipColor(
//                         "status",
//                         eventPopover.event.extendedProps.status
//                       ) === "error"
//                     ? "#f8d7da"
//                     : "#e9ecef",
//                 color:
//                   getChipColor(
//                     "status",
//                     eventPopover.event.extendedProps.status
//                   ) === "success"
//                     ? "#155724"
//                     : getChipColor(
//                         "status",
//                         eventPopover.event.extendedProps.status
//                       ) === "warning"
//                     ? "#856404"
//                     : getChipColor(
//                         "status",
//                         eventPopover.event.extendedProps.status
//                       ) === "error"
//                     ? "#721c24"
//                     : "#495057",
//                 padding: "2px 8px",
//                 borderRadius: "12px",
//                 fontSize: "0.75rem",
//                 height: "24px",
//                 display: "inline-flex",
//                 alignItems: "center",
//               }}
//             >
//               {eventPopover.event.extendedProps.status || "pending"}
//             </span>

//             <span
//               style={{
//                 background:
//                   getChipColor(
//                     "priority",
//                     eventPopover.event.extendedProps.priority
//                   ) === "error"
//                     ? "#f8d7da"
//                     : getChipColor(
//                         "priority",
//                         eventPopover.event.extendedProps.priority
//                       ) === "warning"
//                     ? "#fff3cd"
//                     : getChipColor(
//                         "priority",
//                         eventPopover.event.extendedProps.priority
//                       ) === "success"
//                     ? "#d4edda"
//                     : "#e9ecef",
//                 color:
//                   getChipColor(
//                     "priority",
//                     eventPopover.event.extendedProps.priority
//                   ) === "error"
//                     ? "#721c24"
//                     : getChipColor(
//                         "priority",
//                         eventPopover.event.extendedProps.priority
//                       ) === "warning"
//                     ? "#856404"
//                     : getChipColor(
//                         "priority",
//                         eventPopover.event.extendedProps.priority
//                       ) === "success"
//                     ? "#155724"
//                     : "#495057",
//                 padding: "2px 8px",
//                 borderRadius: "12px",
//                 fontSize: "0.75rem",
//                 height: "24px",
//                 display: "inline-flex",
//                 alignItems: "center",
//               }}
//             >
//               {eventPopover.event.extendedProps.priority || "medium"}
//             </span>

//             {eventPopover.event.extendedProps.isImportant && (
//               <span
//                 style={{
//                   background: "transparent",
//                   color: "#ffc107",
//                   border: "1px solid #ffc107",
//                   padding: "2px 8px",
//                   borderRadius: "12px",
//                   fontSize: "0.75rem",
//                   height: "24px",
//                   display: "inline-flex",
//                   alignItems: "center",
//                 }}
//               >
//                 Quan trọng
//               </span>
//             )}
//           </div>

//           <div
//             style={{
//               display: "flex",
//               gap: "4px",
//               flexWrap: "wrap",
//               marginBottom: "12px",
//             }}
//           >
//             <span
//               style={{
//                 background: "transparent",
//                 color: "#007bff",
//                 border: "1px solid #007bff",
//                 padding: "2px 8px",
//                 borderRadius: "12px",
//                 fontSize: "0.75rem",
//                 height: "24px",
//                 display: "inline-flex",
//                 alignItems: "center",
//               }}
//             >
//               {eventPopover.event.extendedProps.type || "Task"}
//             </span>

//             {eventPopover.event.extendedProps.category && (
//               <span
//                 style={{
//                   background: "transparent",
//                   color: "#17a2b8",
//                   border: "1px solid #17a2b8",
//                   padding: "2px 8px",
//                   borderRadius: "12px",
//                   fontSize: "0.75rem",
//                   height: "24px",
//                   display: "inline-flex",
//                   alignItems: "center",
//                 }}
//               >
//                 {eventPopover.event.extendedProps.category}
//               </span>
//             )}
//           </div>

//           {eventPopover.event.extendedProps.location && (
//             <div
//               style={{
//                 marginBottom: "8px",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "4px",
//                 fontSize: "0.875rem",
//                 wordBreak: "break-word",
//               }}
//             >
//               <span style={{ color: "#666" }}>📍</span>
//               {eventPopover.event.extendedProps.location}
//             </div>
//           )}

//           {/* Thời gian bắt đầu - kết thúc */}
//           <div
//             style={{
//               marginBottom: "12px",
//               fontSize: "0.8rem",
//               color: "#666",
//               wordBreak: "break-word",
//             }}
//           >
//             <span style={{ marginRight: "4px" }}>🕒</span>
//             {eventPopover.event.start &&
//               new Date(eventPopover.event.start).toLocaleString("vi-VN", {
//                 dateStyle: "short",
//                 timeStyle: "short",
//               })}
//             {eventPopover.event.end &&
//               eventPopover.event.start !== eventPopover.event.end && (
//                 <>
//                   {" "}
//                   →{" "}
//                   {new Date(eventPopover.event.end).toLocaleString("vi-VN", {
//                     dateStyle: "short",
//                     timeStyle: "short",
//                   })}
//                 </>
//               )}
//             {eventPopover.event.allDay && " (Cả ngày)"}
//           </div>

//           {/* Hạn hoàn thành */}
//           {eventPopover.event.extendedProps.dueDate && (
//             <div
//               style={{
//                 marginBottom: "8px",
//                 fontSize: "0.8rem",
//                 color: "#dc3545",
//                 wordBreak: "break-word",
//               }}
//             >
//               <span style={{ marginRight: "4px" }}>⏰</span>
//               Hạn:{" "}
//               {new Date(
//                 eventPopover.event.extendedProps.dueDate
//               ).toLocaleDateString("vi-VN")}
//             </div>
//           )}

//           {/* Subtasks */}
//           {eventPopover.event.extendedProps.subtasks &&
//             eventPopover.event.extendedProps.subtasks.length > 0 && (
//               <>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: "4px",
//                   }}
//                 >
//                   <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
//                     Công việc con
//                   </span>
//                   <span style={{ fontSize: "0.75rem", color: "#666" }}>
//                     {Math.round(
//                       (eventPopover.event.extendedProps.subtasks.filter(
//                         (s) => s.completed
//                       ).length /
//                         eventPopover.event.extendedProps.subtasks.length) *
//                         100
//                     )}
//                     %
//                   </span>
//                 </div>
//                 <div
//                   style={{
//                     height: "6px",
//                     borderRadius: "3px",
//                     marginBottom: "12px",
//                     backgroundColor: "#e0e0e0",
//                     overflow: "hidden",
//                   }}
//                 >
//                   <div
//                     style={{
//                       height: "100%",
//                       backgroundColor: "#28a745",
//                       width: `${
//                         (eventPopover.event.extendedProps.subtasks.filter(
//                           (s) => s.completed
//                         ).length /
//                           eventPopover.event.extendedProps.subtasks.length) *
//                         100
//                       }%`,
//                     }}
//                   />
//                 </div>
//               </>
//             )}

//           {/* Tags */}
//           {eventPopover.event.extendedProps.tags &&
//             eventPopover.event.extendedProps.tags.length > 0 && (
//               <div
//                 style={{
//                   display: "flex",
//                   gap: "4px",
//                   flexWrap: "wrap",
//                   marginTop: "8px",
//                 }}
//               >
//                 {eventPopover.event.extendedProps.tags.map((tag) => (
//                   <span
//                     key={tag}
//                     style={{
//                       background: "transparent",
//                       color: "#6c757d",
//                       border: "1px solid #6c757d",
//                       padding: "1px 6px",
//                       borderRadius: "10px",
//                       fontSize: "0.7rem",
//                       height: "22px",
//                       display: "inline-flex",
//                       alignItems: "center",
//                     }}
//                   >
//                     {tag}
//                   </span>
//                 ))}
//               </div>
//             )}
//         </div>
//       )}

//       {/* Add/Edit Todo Modal */}
//       <Modal
//         show={showDialog}
//         onHide={() => setShowDialog(false)}
//         size="lg"
//         centered
//       >
//         <Modal.Header closeButton className="bg-primary text-white">
//           <Modal.Title>
//             {selectedEvent ? "📝 Chỉnh sửa Công Việc" : "✨ Thêm Công Việc Mới"}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Row className="g-3">
//               <Col md={12}>
//                 <Form.Group>
//                   <Form.Label>Tiêu đề *</Form.Label>
//                   <Form.Control
//                     type="text"
//                     value={formData.title}
//                     onChange={(e) =>
//                       setFormData({ ...formData, title: e.target.value })
//                     }
//                     required
//                   />
//                 </Form.Group>
//               </Col>

//               <Col md={12}>
//                 <Form.Group>
//                   <Form.Label>Mô tả</Form.Label>
//                   <Form.Control
//                     as="textarea"
//                     rows={3}
//                     value={formData.description}
//                     onChange={(e) =>
//                       setFormData({ ...formData, description: e.target.value })
//                     }
//                   />
//                 </Form.Group>
//               </Col>

//               <Col md={6}>
//                 <Form.Group>
//                   <Form.Label>Loại công việc</Form.Label>
//                   <Form.Select
//                     value={formData.type}
//                     onChange={(e) =>
//                       setFormData({ ...formData, type: e.target.value })
//                     }
//                   >
//                     <option value="Meeting">👥 Meeting</option>
//                     <option value="BusinessTravel">✈️ Công tác</option>
//                     <option value="PersonalWork">👤 Cá nhân</option>
//                     <option value="TeamProject">👨‍👩‍👧‍👦 Dự án nhóm</option>
//                     <option value="Appointment">📅 Cuộc hẹn</option>
//                     <option value="Task">📝 Công việc</option>
//                     <option value="Other">📌 Khác</option>
//                   </Form.Select>
//                 </Form.Group>
//               </Col>

//               <Col md={6}>
//                 <Form.Group>
//                   <Form.Label>Mức độ ưu tiên</Form.Label>
//                   <Form.Select
//                     value={formData.priority}
//                     onChange={(e) =>
//                       setFormData({ ...formData, priority: e.target.value })
//                     }
//                   >
//                     <option value="low">🟢 Thấp</option>
//                     <option value="medium">🟡 Trung bình</option>
//                     <option value="high">🔴 Cao</option>
//                   </Form.Select>
//                 </Form.Group>
//               </Col>

//               <Col md={4}>
//                 <Form.Group>
//                   <Form.Label>Bắt đầu</Form.Label>
//                   <Form.Control
//                     type="datetime-local"
//                     value={formData.start}
//                     onChange={(e) =>
//                       setFormData({ ...formData, start: e.target.value })
//                     }
//                   />
//                 </Form.Group>
//               </Col>

//               <Col md={4}>
//                 <Form.Group>
//                   <Form.Label>Kết thúc</Form.Label>
//                   <Form.Control
//                     type="datetime-local"
//                     value={formData.end}
//                     onChange={(e) =>
//                       setFormData({ ...formData, end: e.target.value })
//                     }
//                   />
//                 </Form.Group>
//               </Col>

//               <Col md={4}>
//                 <Form.Group>
//                   <Form.Label>Hạn hoàn thành</Form.Label>
//                   <Form.Control
//                     type="datetime-local"
//                     value={formData.dueDate}
//                     onChange={(e) =>
//                       setFormData({ ...formData, dueDate: e.target.value })
//                     }
//                   />
//                 </Form.Group>
//               </Col>

//               <Col md={6}>
//                 <Form.Group>
//                   <Form.Label>Địa điểm</Form.Label>
//                   <Form.Control
//                     type="text"
//                     value={formData.location}
//                     onChange={(e) =>
//                       setFormData({ ...formData, location: e.target.value })
//                     }
//                     placeholder="Nhập địa điểm..."
//                   />
//                 </Form.Group>
//               </Col>

//               <Col md={6}>
//                 <Form.Group>
//                   <Form.Label>Danh mục</Form.Label>
//                   <Form.Control
//                     type="text"
//                     value={formData.category}
//                     onChange={(e) =>
//                       setFormData({ ...formData, category: e.target.value })
//                     }
//                     placeholder="Nhập danh mục..."
//                   />
//                 </Form.Group>
//               </Col>

//               <Col md={12}>
//                 <div className="bg-light p-3 rounded">
//                   <Form.Check
//                     type="checkbox"
//                     label="🌞 Cả ngày"
//                     checked={formData.isAllDay}
//                     onChange={(e) =>
//                       setFormData({ ...formData, isAllDay: e.target.checked })
//                     }
//                     className="mb-2"
//                   />
//                   <Form.Check
//                     type="checkbox"
//                     label="⭐ Quan trọng"
//                     checked={formData.isImportant}
//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         isImportant: e.target.checked,
//                       })
//                     }
//                   />
//                 </div>
//               </Col>
//             </Row>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           {selectedEvent && (
//             <Button
//               variant="outline-danger"
//               onClick={handleDeleteTodo}
//               disabled={loading}
//             >
//               <Delete /> Xóa
//             </Button>
//           )}
//           <Button
//             variant="outline-secondary"
//             onClick={() => setShowDialog(false)}
//             disabled={loading}
//           >
//             Hủy
//           </Button>
//           <Button
//             variant="primary"
//             onClick={selectedEvent ? handleUpdateTodo : handleCreateTodo}
//             disabled={!formData.title || loading}
//           >
//             {selectedEvent ? "📝 Cập nhật" : "✨ Tạo công việc"}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Snackbar */}
//       <Alert
//         show={showSnackbar}
//         variant={snackbarSeverity}
//         onClose={() => setShowSnackbar(false)}
//         dismissible
//         style={{
//           position: "fixed",
//           bottom: 20,
//           right: 20,
//           zIndex: 9999,
//           minWidth: "300px",
//         }}
//       >
//         {snackbarMessage}
//       </Alert>
//     </Container>
//   );
// };

// export default TodoCalendar;

// ==================================================================================================
// ==================================================================================================
// components/todo/TodoCalendar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
  ProgressBar,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Check,
  Target,
  TrendingUp,
  Calendar as CalendarIcon,
  ListTodo,
  Search,
  RotateCcw,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Activity,
  BarChart3,
  Zap,
  MapPin,
  Tag,
} from "lucide-react";

import { todoService } from "../../services/todoService";
import EventPopover from "./EventPopover";
import "./TodoCalendar.css";
import "./EventPopover.css";

const TodoCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [todayTodos, setTodayTodos] = useState([]);
  const [upcomingTodos, setUpcomingTodos] = useState([]);
  const [importantTodos, setImportantTodos] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [eventPopover, setEventPopover] = useState({
    show: false,
    event: null,
  });
  const calendarRef = useRef();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewType, setViewType] = useState("month");

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
    reminder: "",
    attendees: [],
    estimatedTime: { value: 0, unit: "minutes" },
  });

  const [stats, setStats] = useState({
    today: {
      total: 0,
      completed: 0,
      overdue: 0,
      inProgress: 0,
      progress: 0,
    },
    upcoming: {
      total: 0,
      highPriority: 0,
      withCalendar: 0,
      progress: 0,
    },
    important: {
      total: 0,
      completed: 0,
      progress: 0,
    },
    monthly: {
      total: 0,
      completed: 0,
      upcoming: 0,
      completionRate: 0,
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
          dueDate: event.dueDate,
          category: event.category,
          tags: event.tags || [],
          subtasks: event.subtasks || [],
          isImportant: event.isImportant,
          estimatedTime: event.estimatedTime,
          reminder: event.reminder,
          attendees: event.attendees || [],
        },
        backgroundColor: event.color,
        borderColor: event.color,
        classNames: [
          `event-${event.priority}-priority`,
          event.isImportant ? "event-important" : "",
        ],
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Lỗi fetch events:", error);
      showMessage(error.message || "Lỗi tải sự kiện", "error");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColorClass = (priority) => {
    switch (priority) {
      case "high":
        return "high";
      case "medium":
        return "medium";
      case "low":
        return "low";
      default:
        return "";
    }
  };

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
        progress:
          todayResponse.todos.length > 0
            ? Math.round(
                (todayResponse.todos.filter((todo) => todo.status === "done")
                  .length /
                  todayResponse.todos.length) *
                  100
              )
            : 0,
      };

      const upcomingStats = {
        total: upcomingResponse.todos.length,
        highPriority: upcomingResponse.todos.filter(
          (todo) => todo.priority === "high"
        ).length,
        withCalendar: upcomingResponse.todos.filter(
          (todo) => todo.hasCalendarEvent
        ).length,
        progress:
          upcomingResponse.todos.length > 0
            ? Math.round(
                (upcomingResponse.todos.filter((todo) => todo.status === "done")
                  .length /
                  upcomingResponse.todos.length) *
                  100
              )
            : 0,
      };

      const importantStats = {
        total: importantResponse.todos.length,
        completed: importantResponse.todos.filter(
          (todo) => todo.status === "done"
        ).length,
        progress:
          importantResponse.todos.length > 0
            ? Math.round(
                (importantResponse.todos.filter(
                  (todo) => todo.status === "done"
                ).length /
                  importantResponse.todos.length) *
                  100
              )
            : 0,
      };

      const allTodos = allTodosResponse.todos;
      const monthlyTodos = allTodos.filter(
        (todo) =>
          todo.dueDate &&
          new Date(todo.dueDate).getMonth() === currentDate.getMonth() &&
          new Date(todo.dueDate).getFullYear() === currentDate.getFullYear()
      );

      const monthlyStats = {
        total: monthlyTodos.length,
        completed: monthlyTodos.filter((todo) => todo.status === "done").length,
        upcoming: monthlyTodos.filter(
          (todo) =>
            todo.status !== "done" &&
            new Date(todo.dueDate) > new Date() &&
            new Date(todo.dueDate) <=
              new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        ).length,
        completionRate:
          monthlyTodos.length > 0
            ? Math.round(
                (monthlyTodos.filter((todo) => todo.status === "done").length /
                  monthlyTodos.length) *
                  100
              )
            : 0,
      };

      setStats({
        today: todayStats,
        upcoming: upcomingStats,
        important: importantStats,
        monthly: monthlyStats,
      });
    } catch (error) {
      console.error("Lỗi fetch data:", error);
      showMessage(error.message || "Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const end = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    fetchEvents(start, end);
    fetchAllData();
  }, [currentDate]);

  const showMessage = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
      reminder: "",
      attendees: [],
      estimatedTime: { value: 0, unit: "minutes" },
    });
    setSelectedEvent(null);
    setShowDialog(true);
  };

  const handleEventClick = async (clickInfo) => {
    const event = clickInfo.event;

    try {
      const response = await todoService.getTodoDetail(event.id);
      // const response = await todoService.getTodoDetail(event.publicId);
      console.log("Fetched todo detail:", response);
      const todo = response.todo;

      const updatedEvent = {
        id: event.id,
        title: todo.title || event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        ...event,
        extendedProps: {
          ...event.extendedProps,
          description: todo.description || event.extendedProps.description,
          location: todo.location || event.extendedProps.location,
          category: todo.category || event.extendedProps.category,
          isImportant: todo.isImportant || event.extendedProps.isImportant,
          tags: todo.tags || event.extendedProps.tags,
          subtasks: todo.subtasks || event.extendedProps.subtasks,
          dueDate: todo.dueDate || event.extendedProps.dueDate,
          estimatedTime:
            todo.estimatedTime || event.extendedProps.estimatedTime,
          reminder: todo.reminder || event.extendedProps.reminder,
          attendees: todo.attendees || event.extendedProps.attendees,
          status: todo.status || event.extendedProps.status,
          start: todo.start || event.start,
          end: todo.end || event.end,
        },
      };

      setEventPopover({
        show: true,
        event: updatedEvent,
      });

      console.log("Updated event:", updatedEvent);

      setSelectedEvent(updatedEvent);
      setFormData({
        title: todo.title,
        description: todo.description || "",
        // start: todo.start
        //   ? new Date(todo.start).toISOString().slice(0, 16)
        //   : "",
        // end: todo.end ? new Date(todo.end).toISOString().slice(0, 16) : "",
        start: todo.start ? formatDateTimeLocal(todo.start) : "",
        end: todo.end ? formatDateTimeLocal(todo.end) : "",
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
        reminder: todo.reminder || "",
        attendees: todo.attendees || [],
        estimatedTime: todo.estimatedTime || { value: 0, unit: "minutes" },
      });
    } catch (error) {
      // Nếu không lấy được chi tiết, vẫn hiển thị popover với thông tin cơ bản
      setEventPopover({
        show: true,
        event: event,
      });
      setSelectedEvent(event);
    }
  };

  const handleDatesSet = (dateInfo) => {
    setCurrentDate(new Date(dateInfo.start));
  };

  const handlePrevMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleNextMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleCreateTodo = async () => {
    try {
      setLoading(true);
      await todoService.createTodo(formData);
      showMessage("Tạo công việc thành công");
      setShowDialog(false);

      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      fetchEvents(start, end);
      fetchAllData();
    } catch (error) {
      showMessage(error.message || "Lỗi tạo công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodo = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      console.log("selectedEvent: ", selectedEvent);
      await todoService.updateTodo(selectedEvent.id, formData);
      showMessage("Cập nhật công việc thành công");
      setShowDialog(false);
      setEventPopover({ show: false, event: null });

      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      fetchEvents(start, end);
      fetchAllData();
    } catch (error) {
      showMessage(error.message || "Lỗi cập nhật công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      await todoService.deleteTodo(selectedEvent.id);
      showMessage("Xóa công việc thành công");
      setShowDialog(false);
      setEventPopover({ show: false, event: null });

      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      fetchEvents(start, end);
      fetchAllData();
    } catch (error) {
      showMessage(error.message || "Lỗi xóa công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (todoId) => {
    try {
      setLoading(true);
      await todoService.markComplete(todoId);
      showMessage("Đánh dấu hoàn thành thành công");

      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      fetchEvents(start, end);
      fetchAllData();
    } catch (error) {
      showMessage(error.message || "Lỗi cập nhật trạng thái", "error");
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

      showMessage("Cập nhật thời gian thành công");

      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      fetchEvents(start, end);
      fetchAllData();
    } catch (error) {
      showMessage(error.message || "Lỗi cập nhật thời gian", "error");
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

  // Popover handlers
  const handlePopoverClose = () => {
    setEventPopover({ show: false, event: null });
  };

  const handlePopoverMarkComplete = async (eventId) => {
    try {
      setLoading(true);
      await todoService.markComplete(eventId);
      showMessage("Đánh dấu hoàn thành thành công");
      handlePopoverClose();

      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      fetchEvents(start, end);
      fetchAllData();
    } catch (error) {
      showMessage(error.message || "Lỗi cập nhật trạng thái", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePopoverEdit = () => {
    setShowDialog(true);
  };

  const handlePopoverDelete = async (eventId) => {
    try {
      setLoading(true);
      await todoService.deleteTodo(eventId);
      showMessage("Xóa công việc thành công");
      handlePopoverClose();

      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      fetchEvents(start, end);
      fetchAllData();
    } catch (error) {
      showMessage(error.message || "Lỗi xóa công việc", "error");
    } finally {
      setLoading(false);
    }
  };

  const eventContent = (eventInfo) => {
    const isOverdue =
      eventInfo.event.extendedProps.dueDate &&
      new Date(eventInfo.event.extendedProps.dueDate) < new Date() &&
      eventInfo.event.extendedProps.status !== "done";

    return (
      <div className="p-1">
        <small className="fw-medium text-truncate d-block">
          {eventInfo.timeText && `${eventInfo.timeText} `}
          {eventInfo.event.title}
        </small>
        {isOverdue && (
          <div className="d-flex align-items-center gap-1 mt-1">
            <AlertCircle size={12} color="#dc3545" />
            <small className="text-danger">Quá hạn</small>
          </div>
        )}
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCircle className="text-success" />;
      case "in-progress":
        return <Clock className="text-warning" />;
      case "cancelled":
        return <X className="text-danger" />;
      default:
        return <Calendar className="text-primary" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <AlertCircle size={16} color="red" />;
      case "medium":
        return <Clock size={16} color="orange" />;
      case "low":
        return <Check size={16} color="green" />;
      default:
        return <Target size={16} />;
    }
  };

  const renderTodoItem = (todo) => {
    const isOverdue =
      todo.dueDate &&
      new Date(todo.dueDate) < new Date() &&
      todo.status !== "done";
    const cardClass = `todo-card ${todo.status === "done" ? "completed" : ""} ${
      todo.isImportant ? "important" : ""
    } ${isOverdue ? "overdue" : ""}`;

    console.log(
      "Rendering todo:",
      todo,
      "isOverdue:",
      isOverdue,
      "cardClass:",
      cardClass
    );

    return (
      <div key={todo._id} className={cardClass}>
        <div className="todo-header">
          <div className="d-flex align-items-start gap-2 w-100">
            {getStatusIcon(todo.status)}
            <div className="flex-grow-1">
              <h6
                className={`todo-title ${
                  todo.status === "done" ? "completed" : ""
                }`}
              >
                {todo.title}
              </h6>
              <div className="d-flex align-items-center gap-2 mt-1">
                {todo.priority && (
                  <span
                    className={`meta-badge ${getPriorityColorClass(
                      todo.priority
                    )}`}
                  >
                    {getPriorityIcon(todo.priority)}
                    {todo.priority === "high"
                      ? "Cao"
                      : todo.priority === "medium"
                      ? "Trung bình"
                      : "Thấp"}
                  </span>
                )}
                {todo.type && (
                  <span className="meta-badge">
                    <Tag size={12} />
                    {todo.type}
                  </span>
                )}
                {isOverdue && (
                  <span className="meta-badge high">
                    <AlertCircle size={12} />
                    Quá hạn
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="todo-actions">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Xem chi tiết</Tooltip>}
            >
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handleViewDetail(todo._id)}
                className="d-flex align-items-center"
              >
                <Eye size={16} />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Chỉnh sửa</Tooltip>}
            >
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleEditTodo(todo._id)}
                className="d-flex align-items-center"
              >
                <Edit size={16} />
              </Button>
            </OverlayTrigger>

            {todo.status !== "done" && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Đánh dấu hoàn thành</Tooltip>}
              >
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleMarkComplete(todo._id)}
                  className="d-flex align-items-center"
                >
                  <Check size={16} />
                </Button>
              </OverlayTrigger>
            )}
          </div>
        </div>

        {todo.description && (
          <div className="todo-body">
            <p className="todo-description">
              {todo.description.length > 100
                ? `${todo.description.substring(0, 100)}...`
                : todo.description}
            </p>

            <div className="todo-meta">
              {todo.dueDate && (
                <span className="meta-badge">
                  <Calendar size={12} />
                  {new Date(todo.dueDate).toLocaleDateString("vi-VN")}
                </span>
              )}

              {todo.location && (
                <span className="meta-badge">
                  <MapPin size={12} />
                  {todo.location}
                </span>
              )}

              {todo.category && (
                <span className="meta-badge">
                  {/* <Folder size={12} /> */}
                  {todo.category}
                </span>
              )}

              {todo.hasCalendarEvent && (
                <span className="meta-badge">
                  <CalendarIcon size={12} />
                  Trong lịch
                </span>
              )}
            </div>

            {todo.tags && todo.tags.length > 0 && (
              <div className="tags-container mt-2">
                {todo.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
                {todo.tags.length > 3 && (
                  <span className="tag">+{todo.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStatsCard = (title, icon, stats, color = "primary") => {
    const progress = stats.progress || 0;

    return (
      <div className="stats-card">
        <div className="stats-header">
          <div className={`stats-icon ${color}`}>{icon}</div>
          <div className="stats-content">
            <h4>{stats.total}</h4>
            <p>{title}</p>
          </div>
        </div>

        <div className="stats-progress">
          <div className="progress-label">
            <span>Tiến độ</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-custom">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {stats.completed !== undefined && (
          <div className="d-flex justify-content-between mt-3">
            <small className="text-success">
              <Check size={14} /> {stats.completed} hoàn thành
            </small>
            {stats.overdue > 0 && (
              <small className="text-danger">
                <AlertCircle size={14} /> {stats.overdue} quá hạn
              </small>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    let filteredTodos = [];

    switch (activeTab) {
      case 0:
        filteredTodos = todayTodos;
        break;
      case 1:
        filteredTodos = upcomingTodos;
        break;
      case 2:
        filteredTodos = importantTodos;
        break;
      case 3:
        filteredTodos = todos;
        break;
      default:
        filteredTodos = [];
    }

    // Apply filters
    if (filterPriority !== "all") {
      filteredTodos = filteredTodos.filter(
        (todo) => todo.priority === filterPriority
      );
    }

    if (filterStatus !== "all") {
      filteredTodos = filteredTodos.filter(
        (todo) => todo.status === filterStatus
      );
    }

    if (searchQuery) {
      filteredTodos = filteredTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (todo.description &&
            todo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    switch (activeTab) {
      case 0:
        return (
          <div>
            <div className="stats-grid">
              {renderStatsCard(
                "Hôm Nay",
                <Calendar size={24} />,
                stats.today,
                "today"
              )}

              <div className="stats-card">
                <div className="stats-header">
                  <div className="stats-icon today">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stats-content">
                    <h4>{stats.today.inProgress}</h4>
                    <p>Đang thực hiện</p>
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    {stats.today.overdue > 0 ? (
                      <span className="text-danger">
                        ⚠️ {stats.today.overdue} công việc cần xử lý ngay
                      </span>
                    ) : (
                      <span className="text-success">
                        ✅ Mọi thứ đang diễn ra tốt đẹp
                      </span>
                    )}
                  </small>
                </div>
              </div>
            </div>

            {filteredTodos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Calendar size={32} />
                </div>
                <h6 className="text-muted mb-2">
                  {searchQuery ||
                  filterPriority !== "all" ||
                  filterStatus !== "all"
                    ? "Không tìm thấy công việc phù hợp"
                    : "Không có công việc nào cho hôm nay!"}
                </h6>
                <p className="text-muted small mb-3">
                  {searchQuery ||
                  filterPriority !== "all" ||
                  filterStatus !== "all"
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                    : "Hãy tạo công việc mới hoặc kiểm tra công việc sắp tới."}
                </p>
                {!searchQuery &&
                  filterPriority === "all" &&
                  filterStatus === "all" && (
                    <Button
                      variant="primary"
                      onClick={() => setShowDialog(true)}
                      className="btn-primary"
                    >
                      <Plus /> Tạo công việc mới
                    </Button>
                  )}
              </div>
            ) : (
              filteredTodos.map(renderTodoItem)
            )}
          </div>
        );

      case 1:
        return (
          <div>
            <div className="stats-grid">
              {renderStatsCard(
                "Sắp tới",
                <CalendarIcon size={24} />,
                stats.upcoming,
                "upcoming"
              )}

              <div className="stats-card">
                <div className="stats-header">
                  <div className="stats-icon upcoming">
                    <AlertCircle size={24} />
                  </div>
                  <div className="stats-content">
                    <h4>{stats.upcoming.highPriority}</h4>
                    <p>Ưu tiên cao</p>
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    {stats.upcoming.withCalendar} sự kiện trong lịch
                  </small>
                </div>
              </div>
            </div>

            {filteredTodos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CalendarIcon size={32} />
                </div>
                <h6 className="text-muted">
                  {searchQuery ||
                  filterPriority !== "all" ||
                  filterStatus !== "all"
                    ? "Không tìm thấy công việc sắp tới"
                    : "Không có công việc sắp tới!"}
                </h6>
              </div>
            ) : (
              filteredTodos.map(renderTodoItem)
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <div className="stats-grid">
              {renderStatsCard(
                "Quan trọng",
                <Star size={24} />,
                stats.important,
                "important"
              )}

              <div className="stats-card">
                <div className="stats-header">
                  <div className="stats-icon important">
                    <Zap size={24} />
                  </div>
                  <div className="stats-content">
                    <h4>{stats.important.total - stats.important.completed}</h4>
                    <p>Cần hoàn thành</p>
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    {stats.important.completed}/{stats.important.total} đã hoàn
                    thành
                  </small>
                </div>
              </div>
            </div>

            {filteredTodos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Star size={32} />
                </div>
                <h6 className="text-muted">
                  {searchQuery ||
                  filterPriority !== "all" ||
                  filterStatus !== "all"
                    ? "Không tìm thấy công việc quan trọng"
                    : "Không có công việc quan trọng!"}
                </h6>
              </div>
            ) : (
              filteredTodos.map(renderTodoItem)
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-header">
                  <div className="stats-icon">
                    <BarChart3 size={24} />
                  </div>
                  <div className="stats-content">
                    <h4>{todos.length}</h4>
                    <p>Tất cả công việc</p>
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    {todos.filter((t) => t.status === "done").length} hoàn thành
                  </small>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-header">
                  <div className="stats-icon">
                    <Activity size={24} />
                  </div>
                  <div className="stats-content">
                    <h4>{stats.monthly.completionRate}%</h4>
                    <p>Tỷ lệ hoàn thành</p>
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    {stats.monthly.completed}/{stats.monthly.total} trong tháng
                    này
                  </small>
                </div>
              </div>
            </div>

            {filteredTodos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <ListTodo size={32} />
                </div>
                <h6 className="text-muted mb-3">
                  {searchQuery ||
                  filterPriority !== "all" ||
                  filterStatus !== "all"
                    ? "Không tìm thấy công việc"
                    : "Chưa có công việc nào!"}
                </h6>
                {!searchQuery &&
                  filterPriority === "all" &&
                  filterStatus === "all" && (
                    <Button
                      variant="primary"
                      onClick={() => setShowDialog(true)}
                      className="btn-primary-custom"
                    >
                      <Plus /> Tạo công việc đầu tiên
                    </Button>
                  )}
              </div>
            ) : (
              filteredTodos.map(renderTodoItem)
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  return (
    <div className={`todo-calendar-container  ${darkMode ? "dark-mode" : ""}`}>
      <Container fluid className={fullscreen ? "p-0 " : "py-3 "}>
        <Row className={fullscreen ? "m-0" : ""}>
          {/* Calendar */}
          <Col lg={8} className={fullscreen ? "p-0" : ""}>
            <div className="calendar-wrapper">
              <div className="calendar-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <h5 className="calendar-title mb-0">
                    <Calendar className="me-2" />
                    Lịch Công Việc
                  </h5>
                  <div className="calendar-controls">
                    <Button
                      variant="light"
                      size="sm"
                      onClick={handlePrevMonth}
                      className="d-flex align-items-center"
                    >
                      <ChevronLeft size={20} />
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={handleToday}
                      className="d-flex align-items-center"
                    >
                      <Calendar size={16} className="me-2" />
                      Hôm nay
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={handleNextMonth}
                      className="d-flex align-items-center"
                    >
                      <ChevronRight size={20} />
                    </Button>
                    <span className="ms-2 fw-bold">
                      {formatMonthYear(currentDate)}
                    </span>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <div
                    className="input-group input-group-sm"
                    style={{ width: "200px" }}
                  >
                    <span className="input-group-text">
                      <Search size={16} />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-control-custom"
                    />
                  </div>

                  <div className="btn-group">
                    <Button
                      variant="outline-light"
                      onClick={() => setViewType("month")}
                      active={viewType === "month"}
                      size="sm"
                    >
                      Tháng
                    </Button>
                    <Button
                      variant="outline-light"
                      onClick={() => setViewType("week")}
                      active={viewType === "week"}
                      size="sm"
                    >
                      Tuần
                    </Button>
                    <Button
                      variant="outline-light"
                      onClick={() => setViewType("day")}
                      active={viewType === "day"}
                      size="sm"
                    >
                      Ngày
                    </Button>
                  </div>

                  <Button
                    variant="outline-light"
                    onClick={toggleDarkMode}
                    size="sm"
                    className="d-flex align-items-center"
                  >
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  </Button>

                  <Button
                    variant="outline-light"
                    onClick={toggleFullscreen}
                    size="sm"
                    className="d-flex align-items-center"
                  >
                    {fullscreen ? (
                      <Minimize2 size={16} />
                    ) : (
                      <Maximize2 size={16} />
                    )}
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => setShowDialog(true)}
                    className="btn-primary-custom d-flex align-items-center border-1 border-white"
                  >
                    <Plus size={16} className="me-2" />
                    Thêm Công Việc
                  </Button>
                </div>
              </div>

              <div className="p-3">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  headerToolbar={false}
                  initialView={
                    viewType === "month"
                      ? "dayGridMonth"
                      : viewType === "week"
                      ? "timeGridWeek"
                      : "timeGridDay"
                  }
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
                  height={fullscreen ? "calc(100vh - 100px)" : "650px"}
                  datesSet={handleDatesSet}
                  initialDate={currentDate}
                />
              </div>
            </div>
          </Col>

          {/* Todo List Sidebar */}
          <Col lg={4} className={fullscreen ? "p-0" : ""}>
            <div className="sidebar-container">
              <div className="sidebar-tabs">
                <div className="nav nav-tabs nav-fill">
                  <div className="nav-item">
                    <button
                      className={`nav-tab-item ${
                        activeTab === 0 ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(0)}
                    >
                      <div className="position-relative">
                        <Calendar size={20} />
                        <div className="small fw-bold mt-1">Hôm nay</div>
                        {stats.today.total > 0 && (
                          <span className="tab-badge">{stats.today.total}</span>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="nav-item">
                    <button
                      className={`nav-tab-item ${
                        activeTab === 1 ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(1)}
                    >
                      <div className="position-relative">
                        <CalendarIcon size={20} />
                        <div className="small fw-bold mt-1">Sắp tới</div>
                        {stats.upcoming.total > 0 && (
                          <span className="tab-badge">
                            {stats.upcoming.total}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="nav-item">
                    <button
                      className={`nav-tab-item ${
                        activeTab === 2 ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(2)}
                    >
                      <div className="position-relative">
                        <Star size={20} />
                        <div className="small fw-bold mt-1">Quan trọng</div>
                        {stats.important.total > 0 && (
                          <span className="tab-badge">
                            {stats.important.total}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="nav-item">
                    <button
                      className={`nav-tab-item ${
                        activeTab === 3 ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(3)}
                    >
                      <div className="position-relative">
                        <ListTodo size={20} />
                        <div className="small fw-bold mt-1">Tất cả</div>
                        {todos.length > 0 && (
                          <span className="tab-badge">{todos.length}</span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="tab-content">
                {/* Filter Controls */}
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {/* <Form.Select
                    size="sm"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="form-control-custom"
                    style={{ minWidth: "120px" }}
                  >
                    <option value="all">Tất cả ưu tiên</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Ưu tiên trung</option>
                    <option value="low">Ưu tiên thấp</option>
                  </Form.Select> */}

                  <Form.Select
                    size="sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-control-custom"
                    style={{ minWidth: "120px" }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="in-progress">Đang thực hiện</option>
                    <option value="done">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </Form.Select>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setFilterPriority("all");
                      setFilterStatus("all");
                      setSearchQuery("");
                    }}
                    className="d-flex align-items-center"
                  >
                    <RotateCcw size={16} />
                  </Button>

                  <div className="ms-auto">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate("/todo/list")}
                      className="d-flex align-items-center"
                    >
                      <ListTodo size={16} className="me-2" />
                      Danh sách
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="text-muted mt-3">Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  renderTabContent()
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* Event Popover */}
        {eventPopover.show && (
          <EventPopover
            event={eventPopover.event}
            onClose={handlePopoverClose}
            onMarkComplete={handlePopoverMarkComplete}
            onEdit={handlePopoverEdit}
            onDelete={handlePopoverDelete}
            loading={loading}
          />
        )}

        {/* Add/Edit Todo Modal */}
        <Modal
          show={showDialog}
          onHide={() => setShowDialog(false)}
          size="lg"
          centered
          className="modal-custom"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedEvent
                ? "📝 Chỉnh sửa Công Việc"
                : "✨ Thêm Công Việc Mới"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Tiêu đề *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="form-control-custom"
                      placeholder="Nhập tiêu đề công việc"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="form-control-custom"
                      placeholder="Nhập mô tả chi tiết"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Loại công việc</Form.Label>
                    <Form.Select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="form-control-custom"
                    >
                      <option value="Meeting">👥 Meeting</option>
                      <option value="BusinessTravel">✈️ Công tác</option>
                      <option value="PersonalWork">👤 Cá nhân</option>
                      <option value="TeamProject">👨‍👩‍👧‍👦 Dự án nhóm</option>
                      <option value="Appointment">📅 Cuộc hẹn</option>
                      <option value="Task">📝 Công việc</option>
                      <option value="Other">📌 Khác</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Mức độ ưu tiên</Form.Label>
                    <Form.Select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="form-control-custom"
                    >
                      <option value="low">🟢 Thấp</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="high">🔴 Cao</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Bắt đầu</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={formData.start}
                      onChange={(e) =>
                        setFormData({ ...formData, start: e.target.value })
                      }
                      className="form-control-custom"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Kết thúc</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={formData.end}
                      onChange={(e) =>
                        setFormData({ ...formData, end: e.target.value })
                      }
                      className="form-control-custom"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Hạn hoàn thành</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      className="form-control-custom"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Địa điểm</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Nhập địa điểm..."
                      className="form-control-custom"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="form-group-custom">
                    <Form.Label>Danh mục</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="Nhập danh mục..."
                      className="form-control-custom"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <div className="bg-light p-3 rounded">
                    <Form.Check
                      type="checkbox"
                      label="🌞 Cả ngày"
                      checked={formData.isAllDay}
                      onChange={(e) =>
                        setFormData({ ...formData, isAllDay: e.target.checked })
                      }
                      className="mb-2"
                    />
                    <Form.Check
                      type="checkbox"
                      label="⭐ Quan trọng"
                      checked={formData.isImportant}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isImportant: e.target.checked,
                        })
                      }
                    />
                  </div>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            {selectedEvent && (
              <Button
                variant="outline-danger"
                onClick={handleDeleteTodo}
                disabled={loading}
                className="btn-secondary-custom"
              >
                <Trash2 className="me-2" /> Xóa
              </Button>
            )}
            <Button
              variant="outline-secondary"
              onClick={() => setShowDialog(false)}
              disabled={loading}
              className="btn-secondary-custom"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={selectedEvent ? handleUpdateTodo : handleCreateTodo}
              disabled={!formData.title || loading}
              className="btn-primary-custom"
            >
              {selectedEvent ? (
                <>
                  <Edit className="me-2" /> Cập nhật
                </>
              ) : (
                <>
                  <Plus className="me-2" /> Tạo công việc
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Snackbar */}
        {showSnackbar && (
          <div className={`snackbar-custom ${snackbarSeverity}`}>
            <div className="d-flex align-items-center gap-2">
              {snackbarSeverity === "success" && <Check size={20} />}
              {snackbarSeverity === "error" && <AlertCircle size={20} />}
              {snackbarSeverity === "warning" && <AlertCircle size={20} />}
              <span>{snackbarMessage}</span>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default TodoCalendar;
