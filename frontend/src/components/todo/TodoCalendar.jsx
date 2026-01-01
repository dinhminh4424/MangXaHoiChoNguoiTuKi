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
    fetchAllData();
  }, []);

  // Thêm useEffect này sau các useEffect khác trong component
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const viewName =
        viewType === "month"
          ? "dayGridMonth"
          : viewType === "week"
          ? "timeGridWeek"
          : "timeGridDay";

      calendarApi.changeView(viewName);
    }
  }, [viewType]);

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

  const handleDatesSet = async (dateInfo) => {
    const newDate = new Date(dateInfo.start);

    if (
      newDate.getFullYear() !== currentDate.getFullYear() ||
      newDate.getMonth() !== currentDate.getMonth()
    ) {
      setCurrentDate(newDate);
      // Optional: recalculate monthly stats ở đây nếu cần, nhưng hiện tại đã OK vì stats dùng currentDate
    }

    try {
      setLoading(true);
      await fetchEvents(dateInfo.start, dateInfo.end); // range chính xác nhất
    } catch (error) {
      showMessage("Lỗi tải sự kiện", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
    }
  };

  const handleNextMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
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
      <div className="p-1 fc-event-wrapper">
        <small
          className="fw-medium fc-event-title"
          title={eventInfo.event.title}
        >
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
                  <div className="btn-group">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Xem theo tháng</Tooltip>}
                    >
                      <Button
                        variant="outline-light"
                        onClick={() => setViewType("month")}
                        active={viewType === "month"}
                        size="sm"
                      >
                        Tháng
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Xem theo tuần</Tooltip>}
                    >
                      <Button
                        variant="outline-light"
                        onClick={() => setViewType("week")}
                        active={viewType === "week"}
                        size="sm"
                      >
                        Tuần
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Xem theo ngày</Tooltip>}
                    >
                      <Button
                        variant="outline-light"
                        onClick={() => setViewType("day")}
                        active={viewType === "day"}
                        size="sm"
                      >
                        Ngày
                      </Button>
                    </OverlayTrigger>
                  </div>
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
                    variant="outline-light"
                    onClick={() => setShowDialog(true)}
                    className=" d-flex align-items-center border-1 border-white"
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
                  <Form.Select
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
                  </Form.Select>

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
