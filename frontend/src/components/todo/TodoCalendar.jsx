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
  ArrowBack,
  LocationOn,
} from "@mui/icons-material";
import {
  Chip,
  Popover,
  Typography,
  Box,
  Divider,
  LinearProgress,
} from "@mui/material";
import { todoService } from "../../services/todoService";

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
    anchorEl: null,
    event: null,
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
          dueDate: event.dueDate,
          category: event.category,
          tags: event.tags || [],
          subtasks: event.subtasks || [],
        },
        backgroundColor: event.color,
        borderColor: event.color,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Lỗi fetch events:", error);
      showMessage(error.message || "Lỗi tải sự kiện", "error");
    } finally {
      setLoading(false);
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
      showMessage(error.message || "Lỗi tải dữ liệu", "error");
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

  const showMessage = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
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
    setShowDialog(true);
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
      setShowDialog(true);
    } catch (error) {
      showMessage("Lỗi tải chi tiết công việc", "error");
    }
  };

  const handleEventMouseEnter = (mouseEnterInfo) => {
    setEventPopover({
      show: true,
      anchorEl: mouseEnterInfo.el,
      event: mouseEnterInfo.event,
      _timeout: 1000,
    });
  };

  const handleEventMouseLeave = () => {
    // setEventPopover({ show: false, anchorEl: null, event: null });
  };

  const eventWillUnmount = ({ el }) => {
    if (el._handlePopoverLeave) {
      el.removeEventListener("mouseleave", el._handlePopoverLeave);
    }
    if (el._popoverTimeout) {
      clearTimeout(el._popoverTimeout);
    }
  };

  useEffect(() => {
    return () => {
      // Lấy tất cả event DOM elements hiện tại
      const eventEls = document.querySelectorAll(".fc-event");
      eventEls.forEach((el) => {
        if (el._handlePopoverLeave) {
          el.removeEventListener("mouseleave", el._handlePopoverLeave);
          delete el._handlePopoverLeave;
        }
        if (el._popoverTimeout) {
          clearTimeout(el._popoverTimeout);
          delete el._popoverTimeout;
        }
      });
    };
  }, []);

  const handleCreateTodo = async () => {
    try {
      setLoading(true);
      await todoService.createTodo(formData);
      showMessage("Tạo công việc thành công");
      setShowDialog(false);
      fetchEvents(new Date(), new Date());
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
      await todoService.updateTodo(selectedEvent.id, formData);
      showMessage("Cập nhật công việc thành công");
      setShowDialog(false);
      fetchEvents(new Date(), new Date());
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
      fetchEvents(new Date(), new Date());
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

  const eventContent = (eventInfo) => {
    return (
      <div className="p-1">
        <small className="fw-medium text-truncate d-block">
          {eventInfo.timeText && `${eventInfo.timeText} `}
          {eventInfo.event.title}
        </small>
        {eventInfo.event.extendedProps.priority === "high" && (
          <div className="d-flex align-items-center gap-1 mt-1">
            <Warning style={{ fontSize: 12, color: "#dc3545" }} />
            <small className="text-danger">Quan trọng</small>
          </div>
        )}
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCircleOutline className="text-success" />;
      case "in-progress":
        return <AccessTime className="text-warning" />;
      case "cancelled":
        return <Warning className="text-danger" />;
      default:
        return <Schedule className="text-primary" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <Warning style={{ color: "red", fontSize: 16 }} />;
      case "medium":
        return <AccessTime style={{ color: "orange", fontSize: 16 }} />;
      case "low":
        return <CheckCircleOutline style={{ color: "green", fontSize: 16 }} />;
      default:
        return <Schedule style={{ fontSize: 16 }} />;
    }
  };

  const renderTodoItem = (todo) => (
    <Card
      key={todo._id}
      className={`mb-2 ${todo.status === "done" ? "bg-light" : ""} ${
        todo.isImportant ? "border-warning border-2" : ""
      }`}
      style={{
        opacity: todo.status === "done" ? 0.8 : 1,
        transition: "all 0.2s",
      }}
    >
      <Card.Body className="p-2">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              {getStatusIcon(todo.status)}
              <h6
                className={`mb-0 ${
                  todo.status === "done" ? "text-decoration-line-through" : ""
                } ${todo.isImportant ? "fw-bold" : "fw-medium"}`}
                style={{
                  color: todo.status === "done" ? "#6c757d" : "inherit",
                }}
              >
                {todo.title}
              </h6>
            </div>

            {todo.description && (
              <p className="text-muted small mb-2">
                {todo.description.length > 60
                  ? `${todo.description.substring(0, 60)}...`
                  : todo.description}
              </p>
            )}

            <div className="d-flex flex-wrap gap-1 align-items-center">
              <Badge
                bg={getPriorityColor(todo.priority)}
                className="d-flex align-items-center gap-1"
              >
                {getPriorityIcon(todo.priority)}
                {todo.priority === "high"
                  ? "Cao"
                  : todo.priority === "medium"
                  ? "Trung bình"
                  : "Thấp"}
              </Badge>
              <Badge bg="outline-primary" text="dark">
                {todo.type}
              </Badge>
              {todo.dueDate && (
                <Badge
                  bg="outline-secondary"
                  text={
                    new Date(todo.dueDate) < new Date() &&
                    todo.status !== "done"
                      ? "danger"
                      : "dark"
                  }
                  className="d-flex align-items-center gap-1"
                >
                  <Today style={{ fontSize: 14 }} />
                  {new Date(todo.dueDate).toLocaleDateString("vi-VN")}
                </Badge>
              )}
              {todo.hasCalendarEvent && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Có trong lịch</Tooltip>}
                >
                  <Event className="text-primary" style={{ fontSize: 18 }} />
                </OverlayTrigger>
              )}
            </div>
          </div>

          <div className="d-flex flex-column gap-1 ms-2">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Xem chi tiết</Tooltip>}
            >
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handleViewDetail(todo._id)}
              >
                <Visibility fontSize="small" />
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
              >
                <Edit fontSize="small" />
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
                >
                  <CheckCircle fontSize="small" />
                </Button>
              </OverlayTrigger>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const renderStatsCard = (title, icon, stats, color = "primary") => (
    <Card className={`border-${color} bg-${color}-subtle`}>
      <Card.Body>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className={`bg-${color} text-white rounded-circle d-flex align-items-center justify-content-center`}
            style={{ width: 50, height: 50 }}
          >
            {icon}
          </div>
          <div>
            <h5 className={`text-${color} fw-bold mb-0`}>{title}</h5>
            <p className="text-muted mb-0">{stats.total} công việc</p>
          </div>
        </div>

        {stats.completed !== undefined && (
          <div className="mb-2">
            <div className="d-flex justify-content-between mb-1">
              <span className="small">Hoàn thành</span>
              <span className="small fw-bold text-success">
                {stats.completed}
              </span>
            </div>
            <ProgressBar
              now={(stats.completed / stats.total) * 100}
              variant="success"
              style={{ height: 6 }}
            />
          </div>
        )}

        {stats.overdue !== undefined && stats.overdue > 0 && (
          <div className="d-flex align-items-center gap-2 mt-2">
            <Warning className="text-danger" style={{ fontSize: 16 }} />
            <small className="text-danger">{stats.overdue} quá hạn</small>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Hôm nay
        return (
          <div>
            <Row className="mb-3">
              <Col md={6}>
                {renderStatsCard("Hôm Nay", <Today />, stats.today, "primary")}
              </Col>
              <Col md={6}>
                <Card className="border-warning bg-warning-subtle">
                  <Card.Body>
                    <h6 className="text-warning mb-2">⚡ Tiến độ hôm nay</h6>
                    <p className="text-muted small mb-2">
                      {stats.today.completed} / {stats.today.total} công việc đã
                      hoàn thành
                    </p>
                    <ProgressBar
                      now={
                        stats.today.total > 0
                          ? (stats.today.completed / stats.today.total) * 100
                          : 0
                      }
                      variant="warning"
                      style={{ height: 8 }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {todayTodos.length === 0 ? (
              <div className="text-center py-4">
                <Today className="text-muted mb-3" style={{ fontSize: 48 }} />
                <h6 className="text-muted mb-2">
                  Không có công việc nào cho hôm nay!
                </h6>
                <p className="text-muted">
                  Hãy tạo công việc mới hoặc kiểm tra công việc sắp tới.
                </p>
              </div>
            ) : (
              todayTodos.map(renderTodoItem)
            )}
          </div>
        );

      case 1: // Sắp tới
        return (
          <div>
            <Row className="mb-3">
              <Col md={6}>
                {renderStatsCard(
                  "Sắp tới",
                  <Upcoming />,
                  stats.upcoming,
                  "secondary"
                )}
              </Col>
              <Col md={6}>
                <Card className="border-info bg-info-subtle">
                  <Card.Body>
                    <h6 className="text-info mb-2">📅 Tuần này</h6>
                    <p className="text-muted small mb-1">
                      {stats.upcoming.highPriority} công việc quan trọng
                    </p>
                    <p className="text-muted small">
                      {stats.upcoming.withCalendar} sự kiện trong lịch
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {upcomingTodos.length === 0 ? (
              <div className="text-center py-4">
                <Upcoming
                  className="text-muted mb-3"
                  style={{ fontSize: 48 }}
                />
                <h6 className="text-muted">Không có công việc sắp tới!</h6>
              </div>
            ) : (
              upcomingTodos.map(renderTodoItem)
            )}
          </div>
        );

      case 2: // Quan trọng
        return (
          <div>
            <Row className="mb-3">
              <Col md={6}>
                {renderStatsCard(
                  "Quan trọng",
                  <Star />,
                  stats.important,
                  "warning"
                )}
              </Col>
              <Col md={6}>
                <Card className="border-danger bg-danger-subtle">
                  <Card.Body>
                    <h6 className="text-danger mb-2">🚨 Ưu tiên cao</h6>
                    <p className="text-muted small">
                      {stats.important.total - stats.important.completed} công
                      việc cần hoàn thành
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {importantTodos.length === 0 ? (
              <div className="text-center py-4">
                <Star className="text-muted mb-3" style={{ fontSize: 48 }} />
                <h6 className="text-muted">Không có công việc quan trọng!</h6>
              </div>
            ) : (
              importantTodos.map(renderTodoItem)
            )}
          </div>
        );

      case 3: // Tất cả
        return (
          <div>
            <Card className="bg-light mb-3">
              <Card.Body>
                <h6 className="mb-2">📋 Tất cả công việc</h6>
                <p className="text-muted mb-0">
                  {todos.length} công việc trong hệ thống
                </p>
              </Card.Body>
            </Card>

            {todos.length === 0 ? (
              <div className="text-center py-4">
                <Schedule
                  className="text-muted mb-3"
                  style={{ fontSize: 48 }}
                />
                <h6 className="text-muted mb-3">Chưa có công việc nào!</h6>
                <Button variant="primary" onClick={() => setShowDialog(true)}>
                  <Add /> Tạo công việc đầu tiên
                </Button>
              </div>
            ) : (
              todos.map(renderTodoItem)
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getChipColor = (type, value) => {
    if (type === "status") {
      switch (value) {
        case "done":
          return "success";
        case "in-progress":
          return "warning";
        case "cancelled":
          return "error";
        default:
          return "default";
      }
    }
    if (type === "priority") {
      switch (value) {
        case "high":
          return "error";
        case "medium":
          return "warning";
        case "low":
          return "success";
        default:
          return "default";
      }
    }
    return "default";
  };

  return (
    <Container fluid className="py-3">
      <Row>
        {/* Calendar */}
        <Col lg={8}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📅 Lịch Công Việc</h5>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => navigate("/todo/list")}
                >
                  <Schedule /> Danh Sách
                </Button>
                <Button
                  variant="primary"
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
                    setShowDialog(true);
                  }}
                >
                  <Add /> Thêm Công Việc
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
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
                eventMouseEnter={handleEventMouseEnter}
                eventMouseLeave={handleEventMouseLeave}
                eventWillUnmount={eventWillUnmount}
                eventDrop={handleEventDrop}
                eventContent={eventContent}
                eventDurationEditable={true}
                eventResizableFromStart={true}
                locale={viLocale}
                height="650px"
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Todo List Sidebar */}
        <Col lg={4}>
          <Card>
            <Card.Body className="p-0">
              <div className="border-bottom">
                <div
                  className="nav nav-tabs nav-fill"
                  style={{ minHeight: "60px" }}
                >
                  <div className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 0 ? "active" : ""}`}
                      onClick={() => setActiveTab(0)}
                      style={{ border: "none", background: "none" }}
                    >
                      <Badge
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {todayTodos.length}
                      </Badge>
                      <Today />
                      <div className="small fw-bold">Hôm nay</div>
                    </button>
                  </div>
                  <div className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 1 ? "active" : ""}`}
                      onClick={() => setActiveTab(1)}
                      style={{ border: "none", background: "none" }}
                    >
                      <Badge
                        bg="secondary"
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {upcomingTodos.length}
                      </Badge>
                      <Upcoming />
                      <div className="small fw-bold">Sắp tới</div>
                    </button>
                  </div>
                  <div className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 2 ? "active" : ""}`}
                      onClick={() => setActiveTab(2)}
                      style={{ border: "none", background: "none" }}
                    >
                      <Badge
                        bg="warning"
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {importantTodos.length}
                      </Badge>
                      <Star />
                      <div className="small fw-bold">Quan trọng</div>
                    </button>
                  </div>
                  <div className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 3 ? "active" : ""}`}
                      onClick={() => setActiveTab(3)}
                      style={{ border: "none", background: "none" }}
                    >
                      <Badge
                        bg="primary"
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {todos.length}
                      </Badge>
                      <Schedule />
                      <div className="small fw-bold">Tất cả</div>
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{ maxHeight: "600px", overflow: "auto" }}
                className="p-3"
              >
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="text-muted mt-2">Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  renderTabContent()
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Event Popover */}

      {eventPopover.show && eventPopover.event && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            maxWidth: "380px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
            fontSize: "0.875rem",
          }}
          onMouseEnter={() => {
            // Giữ popover mở khi di chuột vào
          }}
          onMouseLeave={() => {
            setTimeout(() => {
              setEventPopover({ show: false, anchorEl: null, event: null });
            }, 150);
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <strong
              style={{
                fontSize: "1.1rem",
                display: "block",
                wordBreak: "break-word",
              }}
            >
              {eventPopover.event.title}
            </strong>
          </div>

          {eventPopover.event.extendedProps.description && (
            <>
              <div
                style={{
                  marginBottom: "12px",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  color: "#666",
                  fontSize: "0.875rem",
                }}
              >
                {eventPopover.event.extendedProps.description}
              </div>
              <hr
                style={{
                  margin: "12px 0",
                  border: "none",
                  borderTop: "1px solid #e0e0e0",
                }}
              />
            </>
          )}

          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                background:
                  getChipColor(
                    "status",
                    eventPopover.event.extendedProps.status
                  ) === "success"
                    ? "#d4edda"
                    : getChipColor(
                        "status",
                        eventPopover.event.extendedProps.status
                      ) === "warning"
                    ? "#fff3cd"
                    : getChipColor(
                        "status",
                        eventPopover.event.extendedProps.status
                      ) === "error"
                    ? "#f8d7da"
                    : "#e9ecef",
                color:
                  getChipColor(
                    "status",
                    eventPopover.event.extendedProps.status
                  ) === "success"
                    ? "#155724"
                    : getChipColor(
                        "status",
                        eventPopover.event.extendedProps.status
                      ) === "warning"
                    ? "#856404"
                    : getChipColor(
                        "status",
                        eventPopover.event.extendedProps.status
                      ) === "error"
                    ? "#721c24"
                    : "#495057",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                height: "24px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {eventPopover.event.extendedProps.status || "pending"}
            </span>

            <span
              style={{
                background:
                  getChipColor(
                    "priority",
                    eventPopover.event.extendedProps.priority
                  ) === "error"
                    ? "#f8d7da"
                    : getChipColor(
                        "priority",
                        eventPopover.event.extendedProps.priority
                      ) === "warning"
                    ? "#fff3cd"
                    : getChipColor(
                        "priority",
                        eventPopover.event.extendedProps.priority
                      ) === "success"
                    ? "#d4edda"
                    : "#e9ecef",
                color:
                  getChipColor(
                    "priority",
                    eventPopover.event.extendedProps.priority
                  ) === "error"
                    ? "#721c24"
                    : getChipColor(
                        "priority",
                        eventPopover.event.extendedProps.priority
                      ) === "warning"
                    ? "#856404"
                    : getChipColor(
                        "priority",
                        eventPopover.event.extendedProps.priority
                      ) === "success"
                    ? "#155724"
                    : "#495057",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                height: "24px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {eventPopover.event.extendedProps.priority || "medium"}
            </span>

            {eventPopover.event.extendedProps.isImportant && (
              <span
                style={{
                  background: "transparent",
                  color: "#ffc107",
                  border: "1px solid #ffc107",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  height: "24px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Quan trọng
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                background: "transparent",
                color: "#007bff",
                border: "1px solid #007bff",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                height: "24px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {eventPopover.event.extendedProps.type || "Task"}
            </span>

            {eventPopover.event.extendedProps.category && (
              <span
                style={{
                  background: "transparent",
                  color: "#17a2b8",
                  border: "1px solid #17a2b8",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  height: "24px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {eventPopover.event.extendedProps.category}
              </span>
            )}
          </div>

          {eventPopover.event.extendedProps.location && (
            <div
              style={{
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.875rem",
                wordBreak: "break-word",
              }}
            >
              <span style={{ color: "#666" }}>📍</span>
              {eventPopover.event.extendedProps.location}
            </div>
          )}

          {/* Thời gian bắt đầu - kết thúc */}
          <div
            style={{
              marginBottom: "12px",
              fontSize: "0.8rem",
              color: "#666",
              wordBreak: "break-word",
            }}
          >
            <span style={{ marginRight: "4px" }}>🕒</span>
            {eventPopover.event.start &&
              new Date(eventPopover.event.start).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            {eventPopover.event.end &&
              eventPopover.event.start !== eventPopover.event.end && (
                <>
                  {" "}
                  →{" "}
                  {new Date(eventPopover.event.end).toLocaleString("vi-VN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </>
              )}
            {eventPopover.event.allDay && " (Cả ngày)"}
          </div>

          {/* Hạn hoàn thành */}
          {eventPopover.event.extendedProps.dueDate && (
            <div
              style={{
                marginBottom: "8px",
                fontSize: "0.8rem",
                color: "#dc3545",
                wordBreak: "break-word",
              }}
            >
              <span style={{ marginRight: "4px" }}>⏰</span>
              Hạn:{" "}
              {new Date(
                eventPopover.event.extendedProps.dueDate
              ).toLocaleDateString("vi-VN")}
            </div>
          )}

          {/* Subtasks */}
          {eventPopover.event.extendedProps.subtasks &&
            eventPopover.event.extendedProps.subtasks.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                    Công việc con
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    {Math.round(
                      (eventPopover.event.extendedProps.subtasks.filter(
                        (s) => s.completed
                      ).length /
                        eventPopover.event.extendedProps.subtasks.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "3px",
                    marginBottom: "12px",
                    backgroundColor: "#e0e0e0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      backgroundColor: "#28a745",
                      width: `${
                        (eventPopover.event.extendedProps.subtasks.filter(
                          (s) => s.completed
                        ).length /
                          eventPopover.event.extendedProps.subtasks.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </>
            )}

          {/* Tags */}
          {eventPopover.event.extendedProps.tags &&
            eventPopover.event.extendedProps.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  flexWrap: "wrap",
                  marginTop: "8px",
                }}
              >
                {eventPopover.event.extendedProps.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: "transparent",
                      color: "#6c757d",
                      border: "1px solid #6c757d",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontSize: "0.7rem",
                      height: "22px",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Add/Edit Todo Modal */}
      <Modal
        show={showDialog}
        onHide={() => setShowDialog(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {selectedEvent ? "📝 Chỉnh sửa Công Việc" : "✨ Thêm Công Việc Mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Tiêu đề *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Loại công việc</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
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
                <Form.Group>
                  <Form.Label>Mức độ ưu tiên</Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value="low">🟢 Thấp</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="high">🔴 Cao</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Bắt đầu</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.start}
                    onChange={(e) =>
                      setFormData({ ...formData, start: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Kết thúc</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) =>
                      setFormData({ ...formData, end: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Hạn hoàn thành</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Địa điểm</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Nhập địa điểm..."
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Nhập danh mục..."
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
            >
              <Delete /> Xóa
            </Button>
          )}
          <Button
            variant="outline-secondary"
            onClick={() => setShowDialog(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={selectedEvent ? handleUpdateTodo : handleCreateTodo}
            disabled={!formData.title || loading}
          >
            {selectedEvent ? "📝 Cập nhật" : "✨ Tạo công việc"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Snackbar */}
      <Alert
        show={showSnackbar}
        variant={snackbarSeverity}
        onClose={() => setShowSnackbar(false)}
        dismissible
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          minWidth: "300px",
        }}
      >
        {snackbarMessage}
      </Alert>
    </Container>
  );
};

export default TodoCalendar;
