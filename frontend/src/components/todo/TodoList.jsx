// components/todo/TodoList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  ProgressBar,
  Modal,
  Alert,
  Spinner,
  InputGroup,
  Dropdown,
} from "react-bootstrap";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Calendar,
  Filter,
  Search,
  Flag,
  Clock,
  CalendarDays,
  AlertTriangle,
  Trophy,
  Circle,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  Users,
  Plane,
  User,
  Briefcase,
  FileText,
  Tag,
  CheckSquare,
  Square,
  Star,
  Zap,
  Timer,
  CheckCheck,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { todoService } from "../../services/todoService";
import ReminderBadge from "./ReminderBadge";
import "./TodoList.css";

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
  const [sortConfig, setSortConfig] = useState({
    key: "dueDate",
    direction: "asc",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  useEffect(() => {
    fetchTodos();
  }, [filters, sortConfig]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        sort: sortConfig.key,
        order: sortConfig.direction,
      };
      const response = await todoService.getTodos(params);
      setTodos(response.todos);
    } catch (error) {
      showSnackbar(error.message || "Lỗi tải danh sách công việc", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, variant = "success") => {
    setSnackbar({ show: true, message, variant });
    setTimeout(() => {
      setSnackbar({ ...snackbar, show: false });
    }, 3000);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleMarkComplete = async (todoId) => {
    try {
      await todoService.markComplete(todoId);
      showSnackbar("Đánh dấu hoàn thành thành công");
      fetchTodos();
    } catch (error) {
      showSnackbar(error.message || "Lỗi cập nhật trạng thái", "danger");
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
      showSnackbar(error.message || "Lỗi xóa công việc", "danger");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "secondary";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <Zap size={14} />;
      case "medium":
        return <AlertTriangle size={14} />;
      case "low":
        return <Clock size={14} />;
      default:
        return <Flag size={14} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "success";
      case "in-progress":
        return "primary";
      case "cancelled":
        return "danger";
      default:
        return "info";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCheck size={14} />;
      case "in-progress":
        return <Clock size={14} />;
      case "cancelled":
        return <XCircle size={14} />;
      default:
        return <CalendarClock size={14} />;
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
    return endDate && endDate < now && todo.status !== "done";
  };

  const getTypeIcon = (type) => {
    const icons = {
      Meeting: <Users size={16} />,
      "Business travel": <Plane size={16} />,
      "Personal Work": <User size={16} />,
      "Team Project": <Briefcase size={16} />,
      Appointment: <Calendar size={16} />,
      Task: <FileText size={16} />,
      Other: <Tag size={16} />,
    };
    return icons[type] || <Tag size={16} />;
  };

  const stats = [
    {
      title: "Tổng công việc",
      value: todos.length,
      color: "primary",
      icon: <FileText size={24} />,
    },
    {
      title: "Đã hoàn thành",
      value: todos.filter((t) => t.status === "done").length,
      color: "success",
      icon: <CheckCheck size={24} />,
    },
    {
      title: "Ưu tiên cao",
      value: todos.filter((t) => t.priority === "high").length,
      color: "danger",
      icon: <Zap size={24} />,
    },
    {
      title: "Quá hạn",
      value: todos.filter((t) => isOverdue(t)).length,
      color: "warning",
      icon: <Timer size={24} />,
    },
  ];

  const sortOptions = [
    { key: "dueDate", label: "Thời hạn", icon: <CalendarDays size={14} /> },
    { key: "priority", label: "Ưu tiên", icon: <Flag size={14} /> },
    { key: "createdAt", label: "Ngày tạo", icon: <Calendar size={14} /> },
    { key: "title", label: "Tiêu đề", icon: <FileText size={14} /> },
  ];

  return (
    <Container fluid className="todo-container py-4">
      {/* Header */}
      <div className="header-section mb-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h1 className="h2 fw-bold mb-2 text-gradient">
              <FileText className="me-2" size={28} />
              Danh Sách Công Việc
            </h1>
            <p className="text-muted mb-0">
              Quản lý và theo dõi tất cả công việc của bạn
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              className="d-flex align-items-center"
              onClick={() => navigate("/todo/calendar")}
            >
              <Calendar className="me-2" size={18} />
              Xem Lịch
            </Button>
            <Button
              variant="primary"
              className="gradient-btn d-flex align-items-center"
              onClick={() => navigate("/todo/create")}
            >
              <Plus className="me-2" size={18} />
              Tạo Công Việc
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <Row className="g-3 mb-4">
          {stats.map((stat, index) => (
            <Col key={index} xs={6} md={3}>
              <Card className="stat-card h-100 border-0 shadow-sm">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div
                      className={`stat-icon-wrapper bg-${stat.color}-subtle text-${stat.color} me-3`}
                    >
                      {stat.icon}
                    </div>
                    <div>
                      <h3 className="fw-bold mb-0">{stat.value}</h3>
                      <p className="text-muted mb-0 small">{stat.title}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Filters and Search */}
      <Card className="mb-4 border-0 shadow-sm filter-card">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h5 className="fw-bold mb-0 d-flex align-items-center">
              <Filter className="me-2" size={20} />
              Bộ Lọc & Tìm Kiếm
            </h5>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Sắp xếp:</span>
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  className={`sort-btn btn btn-sm ${
                    sortConfig.key === option.key
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => handleSort(option.key)}
                >
                  <span className="d-flex align-items-center">
                    {option.icon}
                    <span className="ms-1">{option.label}</span>
                    {sortConfig.key === option.key &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp size={14} className="ms-1" />
                      ) : (
                        <ChevronDown size={14} className="ms-1" />
                      ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Row className="g-3">
            {/* Search */}
            <Col md={5}>
              <Form.Group>
                <Form.Label className="fw-semibold small">
                  <Search size={16} className="me-1" />
                  Tìm kiếm công việc
                </Form.Label>
                <InputGroup className="search-input-group">
                  <InputGroup.Text className="bg-white border-end-0">
                    <Search size={18} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Nhập tiêu đề, mô tả hoặc từ khóa..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="border-start-0"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* Status Filter */}
            <Col xs={6} md={2}>
              <Form.Group>
                <Form.Label className="fw-semibold small">
                  Trạng thái
                </Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="custom-select"
                >
                  <option value="">Tất cả</option>
                  <option value="scheduled">Đã lên lịch</option>
                  <option value="in-progress">Đang thực hiện</option>
                  <option value="done">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Priority Filter */}
            <Col xs={6} md={2}>
              <Form.Group>
                <Form.Label className="fw-semibold small">
                  Mức ưu tiên
                </Form.Label>
                <Form.Select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                  className="custom-select"
                >
                  <option value="">Tất cả</option>
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Type Filter */}
            <Col xs={6} md={2}>
              <Form.Group>
                <Form.Label className="fw-semibold small">
                  Loại công việc
                </Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                  className="custom-select"
                >
                  <option value="">Tất cả</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Business travel">Công tác</option>
                  <option value="Personal Work">Cá nhân</option>
                  <option value="Team Project">Dự án nhóm</option>
                  <option value="Appointment">Cuộc hẹn</option>
                  <option value="Task">Công việc</option>
                  <option value="Other">Khác</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Reset Button */}
            <Col xs={6} md={1}>
              <Button
                variant="outline-secondary"
                className="w-100 h-100 d-flex flex-column align-items-center justify-content-center reset-btn"
                onClick={() =>
                  setFilters({ status: "", priority: "", type: "", search: "" })
                }
              >
                <Filter size={18} />
                <span className="mt-1 small">Đặt lại</span>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Todo List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải danh sách công việc...</p>
        </div>
      ) : todos.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm empty-state-card">
          <Card.Body>
            <div className="empty-state-icon mb-4">
              <Trophy size={64} />
            </div>
            <h5 className="mb-3">
              {filters.status ||
              filters.priority ||
              filters.type ||
              filters.search
                ? "Không tìm thấy công việc phù hợp"
                : "Chưa có công việc nào"}
            </h5>
            <p className="text-muted mb-4">
              {filters.status ||
              filters.priority ||
              filters.type ||
              filters.search
                ? "Thử điều chỉnh bộ lọc để xem nhiều kết quả hơn"
                : "Bắt đầu tổ chức công việc bằng cách tạo công việc đầu tiên"}
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/todo/create")}
              className="px-4"
            >
              <Plus className="me-2" size={18} />
              Tạo Công Việc Đầu Tiên
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="todo-list-container">
          {todos.map((todo) => (
            <Card
              key={todo._id}
              className={`todo-card mb-3 ${
                todo.isImportant ? "important-todo" : ""
              } ${todo.status === "done" ? "completed-todo" : ""}`}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-start">
                  {/* Checkbox */}
                  <div className="todo-checkbox-wrapper me-3">
                    <button
                      className={`todo-checkbox-btn ${
                        todo.status === "done" ? "checked" : ""
                      } ${isOverdue(todo) ? "overdue" : ""}`}
                      onClick={() => handleMarkComplete(todo._id)}
                    >
                      {todo.status === "done" ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                    {isOverdue(todo) && (
                      <div className="overdue-indicator" title="Quá hạn">
                        <Timer size={12} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center mb-2">
                          <span className="todo-type-icon me-2">
                            {getTypeIcon(todo.type)}
                          </span>
                          <h5
                            className={`todo-title mb-0 ${
                              todo.status === "done" ? "completed" : ""
                            }`}
                          >
                            {todo.title}
                            {todo.isImportant && (
                              <Star
                                size={16}
                                className="ms-2 text-warning"
                                fill="currentColor"
                              />
                            )}
                          </h5>
                        </div>
                        {todo.description && (
                          <p className="todo-description text-muted mb-0">
                            {todo.description}
                          </p>
                        )}
                      </div>

                      <td>
                        {/* Thay badge cũ bằng */}
                        <ReminderBadge todo={todo} size="sm" />
                      </td>

                      {/* Actions Dropdown */}
                      {/* Actions Dropdown */}
                      <div
                        className="dropdown todo-actions"
                        style={{ position: "relative", zIndex: 1000 }}
                      >
                        <button
                          className="btn btn-sm btn-light border-0 rounded-circle"
                          type="button"
                          id={`todo-actions-${todo._id}`}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <MoreVertical size={18} />
                        </button>
                        <ul
                          className="dropdown-menu dropdown-menu-end shadow-lg"
                          aria-labelledby={`todo-actions-${todo._id}`}
                          style={{ zIndex: 9999 }}
                        >
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/todo/${todo._id}`)}
                            >
                              <Eye size={16} className="me-2" />
                              Xem chi tiết
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/todo/edit/${todo._id}`)}
                            >
                              <Edit size={16} className="me-2" />
                              Chỉnh sửa
                            </button>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => handleDeleteClick(todo)}
                            >
                              <Trash2 size={16} className="me-2" />
                              Xóa
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {todo.subtasks && todo.subtasks.length > 0 && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Tiến độ</small>
                          <small className="fw-bold text-primary">
                            {getProgress(todo)}%
                          </small>
                        </div>
                        <ProgressBar
                          now={getProgress(todo)}
                          variant={
                            getProgress(todo) === 100 ? "success" : "primary"
                          }
                          className="rounded-pill"
                          style={{ height: "6px" }}
                        />
                      </div>
                    )}

                    {/* Tags */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <Badge
                        bg={getPriorityColor(todo.priority)}
                        className="d-flex align-items-center gap-1 px-3 py-2"
                      >
                        {getPriorityIcon(todo.priority)}
                        <span>
                          {todo.priority === "high"
                            ? "Cao"
                            : todo.priority === "medium"
                            ? "Trung bình"
                            : "Thấp"}
                        </span>
                      </Badge>
                      <Badge bg="light" text="dark" className="px-3 py-2">
                        {getTypeIcon(todo.type)}
                        <span className="ms-1">{todo.type}</span>
                      </Badge>
                      <Badge
                        bg={getStatusColor(todo.status)}
                        className="d-flex align-items-center gap-1 px-3 py-2"
                      >
                        {getStatusIcon(todo.status)}
                        <span>
                          {todo.status === "done"
                            ? "Hoàn thành"
                            : todo.status === "in-progress"
                            ? "Đang thực hiện"
                            : todo.status === "cancelled"
                            ? "Đã hủy"
                            : "Đã lên lịch"}
                        </span>
                      </Badge>
                      {todo.hasCalendarEvent && (
                        <Badge
                          bg="info"
                          className="d-flex align-items-center gap-1 px-3 py-2"
                        >
                          <Calendar size={14} />
                          <span>Lịch</span>
                        </Badge>
                      )}
                    </div>

                    {/* Dates and Assignees */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex flex-wrap gap-3">
                        {todo.dueDate && (
                          <div
                            className={`d-flex align-items-center gap-1 ${
                              isOverdue(todo) ? "text-danger" : "text-muted"
                            }`}
                          >
                            <CalendarDays size={16} />
                            <small>
                              Hạn:{" "}
                              {new Date(todo.dueDate).toLocaleDateString(
                                "vi-VN"
                              )}
                              {isOverdue(todo) && " (Quá hạn)"}
                            </small>
                          </div>
                        )}
                        {todo.start && (
                          <div className="d-flex align-items-center gap-1 text-muted">
                            <Clock size={16} />
                            <small>
                              Bắt đầu:{" "}
                              {new Date(todo.start).toLocaleDateString("vi-VN")}
                            </small>
                          </div>
                        )}
                      </div>

                      {/* Assignees */}
                      {todo.assignees && todo.assignees.length > 0 && (
                        <div className="d-flex align-items-center">
                          <div className="avatar-group">
                            {todo.assignees
                              .slice(0, 3)
                              .map((assignee, index) => (
                                <div
                                  key={index}
                                  className="avatar"
                                  title={assignee.name}
                                >
                                  {assignee.avatar ? (
                                    <img
                                      src={assignee.avatar}
                                      alt={assignee.name}
                                      className="rounded-circle"
                                    />
                                  ) : (
                                    <div className="avatar-placeholder">
                                      {assignee.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            {todo.assignees.length > 3 && (
                              <div className="avatar-more">
                                +{todo.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={openDeleteDialog}
        onHide={() => setOpenDeleteDialog(false)}
        centered
        className="delete-modal"
      >
        <Modal.Header className="bg-danger text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <Trash2 className="me-2" size={24} />
            Xác nhận xóa
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="text-center mb-4">
            <div className="delete-icon mb-3">
              <Trash2 size={48} className="text-danger" />
            </div>
            <h5 className="mb-3">
              Xóa công việc <strong>"{todoToDelete?.title}"</strong>?
            </h5>
            <p className="text-muted">
              Hành động này không thể hoàn tác và mọi dữ liệu liên quan sẽ bị
              mất.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setOpenDeleteDialog(false)}
            className="px-4"
          >
            Giữ lại
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            className="px-4"
          >
            <Trash2 className="me-2" size={18} />
            Xóa vĩnh viễn
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Snackbar/Alert */}
      {snackbar.show && (
        <Alert
          variant={snackbar.variant}
          className="position-fixed bottom-0 end-0 m-3 shadow-lg alert-notification"
          style={{ zIndex: 1050, minWidth: "300px" }}
          onClose={() => setSnackbar({ ...snackbar, show: false })}
          dismissible
        >
          <div className="d-flex align-items-center">
            {snackbar.variant === "success" ? (
              <CheckCircle className="me-2" size={20} />
            ) : (
              <AlertTriangle className="me-2" size={20} />
            )}
            {snackbar.message}
          </div>
        </Alert>
      )}
    </Container>
  );
};

export default TodoList;
