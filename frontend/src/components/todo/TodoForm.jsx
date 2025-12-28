// components/todo/TodoForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  ListGroup,
  InputGroup,
  Modal,
  Spinner,
} from "react-bootstrap";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Tag,
  Calendar,
  Clock,
  MapPin,
  Flag,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckSquare,
  Square,
  X,
  Folder,
  Type,
  AlignLeft,
  CalendarDays,
  Target,
  Star,
  Briefcase,
  Users,
  User,
  Plane,
  Eye,
  FileText,
  Bell,
  Mail,
} from "lucide-react";
import { todoService } from "../../services/todoService";
import "./TodoForm.css";

const TodoForm = ({ todoId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const actualTodoId = todoId || id;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!actualTodoId);
  const [showAlert, setShowAlert] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  // Trong phần state của TodoForm.jsx
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
    notes: "",
    // === THÊM CÁC FIELD MỚI ===
    reminderEnabled: true, // Bật/tắt reminder
    reminderMinutes: 5, // Mặc định 5 phút
    reminderType: "push", // Loại reminder
  });

  const [newTag, setNewTag] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState(null);

  useEffect(() => {
    if (actualTodoId) {
      fetchTodoDetail();
    }
  }, [actualTodoId]);

  // Trong hàm fetchTodoDetail của TodoForm.jsx
  const fetchTodoDetail = async () => {
    try {
      setLoading(true);
      const response = await todoService.getTodoDetail(actualTodoId);
      const todo = response.todo;

      setFormData({
        title: todo.title,
        description: todo.description || "",
        start: todo.start ? formatDateTimeForInput(todo.start) : "",
        end: todo.end ? formatDateTimeForInput(todo.end) : "",
        type: todo.type || "Task",
        priority: todo.priority || "medium",
        isAllDay: todo.isAllDay || false,
        location: todo.location || "",
        dueDate: todo.dueDate ? formatDateTimeForInput(todo.dueDate) : "",
        tags: todo.tags || [],
        category: todo.category || "",
        isImportant: todo.isImportant || false,
        status: todo.status || "scheduled",
        notes: todo.notes || "",
        // === THÊM CÁC FIELD MỚI ===
        reminderEnabled: todo.reminderEnabled !== false, // Mặc định true
        reminderMinutes: todo.reminderMinutes || 5,
        reminderType: todo.reminderType || "push",
      });

      setSubtasks(todo.subtasks || []);
    } catch (error) {
      showAlertMessage(error.message || "Lỗi tải chi tiết công việc", "danger");
      navigate("/todo/list");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().slice(0, 16);
  };

  const showAlertMessage = (message, variant = "success") => {
    setShowAlert({ show: true, message, variant });
    setTimeout(() => {
      setShowAlert({ ...showAlert, show: false });
    }, 3000);
  };

  // Trong hàm handleSubmit của TodoForm.jsx
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showAlertMessage("Vui lòng nhập tiêu đề công việc", "danger");
      return;
    }

    // Validation: Nếu có start time và reminder bật
    if (formData.start && formData.reminderEnabled) {
      const startTime = new Date(formData.start);
      const now = new Date();

      if (startTime <= now) {
        showAlertMessage(
          "Thời gian bắt đầu phải ở tương lai để gửi reminder",
          "warning"
        );
        return;
      }

      // Tính thời gian reminder
      const reminderTime = new Date(
        startTime.getTime() - formData.reminderMinutes * 60000
      );

      if (reminderTime <= now) {
        showAlertMessage(
          `Không thể đặt reminder ${formData.reminderMinutes} phút trước vì thời gian đã qua`,
          "warning"
        );
        return;
      }
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        subtasks: subtasks.map((st) => ({
          title: st.title,
          completed: st.completed || false,
        })),
        // Đảm bảo các field reminder được gửi
        reminderEnabled: formData.reminderEnabled,
        reminderMinutes: formData.reminderMinutes,
        reminderType: formData.reminderType,
      };

      if (isEditing) {
        await todoService.updateTodo(actualTodoId, submitData);
        showAlertMessage("Cập nhật công việc thành công");
      } else {
        await todoService.createTodo(submitData);
        showAlertMessage("Tạo công việc thành công");
      }

      setTimeout(() => {
        navigate("/todo/list");
      }, 1000);
    } catch (error) {
      showAlertMessage(
        error.message || `Lỗi ${isEditing ? "cập nhật" : "tạo"} công việc`,
        "danger"
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
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ]);
      setNewSubtask("");
    }
  };

  const handleToggleSubtask = (id) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const confirmDeleteSubtask = (subtask) => {
    setSubtaskToDelete(subtask);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSubtask = () => {
    if (subtaskToDelete) {
      setSubtasks(subtasks.filter((st) => st.id !== subtaskToDelete.id));
      showAlertMessage("Đã xóa công việc con", "info");
      setShowDeleteConfirm(false);
      setSubtaskToDelete(null);
    }
  };

  const handleClearAllSubtasks = () => {
    if (subtasks.length === 0) return;

    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả công việc con?")) {
      setSubtasks([]);
      showAlertMessage("Đã xóa tất cả công việc con", "info");
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
        return <AlertCircle size={16} />;
      case "medium":
        return <Flag size={16} />;
      case "low":
        return <Clock size={16} />;
      default:
        return <Flag size={16} />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Meeting":
        return <Users size={18} />;
      case "Business travel":
        return <Plane size={18} />;
      case "Personal Work":
        return <User size={18} />;
      case "Team Project":
        return <Briefcase size={18} />;
      case "Appointment":
        return <Calendar size={18} />;
      case "Task":
        return <FileText size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCircle size={16} />;
      case "in-progress":
        return <Clock size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <CalendarDays size={16} />;
    }
  };

  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const progressPercentage =
    subtasks.length > 0
      ? Math.round((completedSubtasks / subtasks.length) * 100)
      : 0;

  if (loading && isEditing) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải thông tin công việc...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="todo-form-container py-4">
      {/* Header */}
      <div className="todo-form-header mb-5">
        <div className="d-flex align-items-center mb-4">
          <Button
            variant="outline-primary"
            className="me-3 rounded-circle"
            onClick={() => navigate("/todo/list")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="h2 fw-bold mb-2">
              {isEditing ? "Chỉnh Sửa Công Việc" : "Tạo Công Việc Mới"}
            </h1>
            <p className="text-muted mb-0">
              {isEditing
                ? "Cập nhật thông tin công việc của bạn"
                : "Thêm công việc mới vào hệ thống"}
            </p>
          </div>
        </div>
      </div>

      {showAlert.show && (
        <Alert
          variant={showAlert.variant}
          className="mb-4 alert-fixed-top"
          onClose={() => setShowAlert({ ...showAlert, show: false })}
          dismissible
        >
          {showAlert.message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          {/* Left Column - Main Form */}
          <Col lg={8}>
            {/* Basic Information Card */}
            <Card className="todo-form-card mb-4">
              <Card.Header className="todo-card-header">
                <div className="d-flex align-items-center">
                  <div className="todo-card-icon bg-primary">
                    <Type size={20} />
                  </div>
                  <h5 className="mb-0 ms-3">Thông tin cơ bản</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Tiêu đề công việc <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nhập tiêu đề công việc..."
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <AlignLeft className="me-2" size={16} />
                        Mô tả chi tiết
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Mô tả chi tiết về công việc..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    {/* Type Select with Custom Icons */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <Briefcase className="me-2" size={16} />
                        Loại công việc
                      </Form.Label>
                      <Form.Select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="form-control-lg todo-type-select"
                      >
                        {[
                          {
                            value: "Meeting",
                            label: "Meeting",
                            icon: <Users size={14} />,
                          },
                          {
                            value: "BusinessTravel",
                            label: "Công tác",
                            icon: <Plane size={14} />,
                          },
                          {
                            value: "PersonalWork",
                            label: "Cá nhân",
                            icon: <User size={14} />,
                          },
                          {
                            value: "TeamProject",
                            label: "Dự án nhóm",
                            icon: <Briefcase size={14} />,
                          },
                          {
                            value: "Appointment",
                            label: "Cuộc hẹn",
                            icon: <Calendar size={14} />,
                          },
                          {
                            value: "Task",
                            label: "Công việc",
                            icon: <FileText size={14} />,
                          },
                          {
                            value: "Other",
                            label: "Khác",
                            icon: <Tag size={14} />,
                          },
                        ].map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.icon}
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>

                      {/* Display Icon next to select */}
                      <div className="todo-type-icon-display">
                        {getTypeIcon(formData.type)}
                        <span className="ms-2">{formData.type}</span>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Flag className="me-2" size={16} />
                        Mức độ ưu tiên
                      </Form.Label>
                      <Form.Select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value })
                        }
                        className={`form-control-lg border-${getPriorityColor(
                          formData.priority
                        )}`}
                      >
                        <option value="low" className="text-success">
                          📍 Ưu tiên thấp
                        </option>
                        <option value="medium" className="text-warning">
                          🎯 Ưu tiên trung bình
                        </option>
                        <option value="high" className="text-danger">
                          ⚠️ Ưu tiên cao
                        </option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Calendar Information Card */}
            <Card className="todo-form-card mb-4">
              <Card.Header className="todo-card-header">
                <div className="d-flex align-items-center">
                  <div className="todo-card-icon bg-success">
                    <Calendar size={20} />
                  </div>
                  <h5 className="mb-0 ms-3">Thông tin lịch trình</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <CalendarDays className="me-2" size={16} />
                        Thời gian bắt đầu
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.start}
                        onChange={(e) =>
                          setFormData({ ...formData, start: e.target.value })
                        }
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <CalendarDays className="me-2" size={16} />
                        Thời gian kết thúc
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.end}
                        onChange={(e) =>
                          setFormData({ ...formData, end: e.target.value })
                        }
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Target className="me-2" size={16} />
                        Hạn hoàn thành
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <MapPin className="me-2" size={16} />
                        Địa điểm
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nhập địa điểm..."
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Check
                      type="checkbox"
                      id="isAllDay"
                      label={
                        <span className="fw-medium">
                          <Calendar className="me-2" size={16} />
                          Sự kiện cả ngày
                        </span>
                      }
                      checked={formData.isAllDay}
                      onChange={(e) =>
                        setFormData({ ...formData, isAllDay: e.target.checked })
                      }
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Subtasks Card */}
            <Card className="todo-form-card">
              <Card.Header className="todo-card-header">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="todo-card-icon bg-info">
                      <CheckSquare size={20} />
                    </div>
                    <h5 className="mb-0 ms-3">Công việc con</h5>
                  </div>
                  {subtasks.length > 0 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleClearAllSubtasks}
                    >
                      <Trash2 size={16} className="me-1" />
                      Xóa tất cả
                    </Button>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Nhập tên công việc con..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddSubtask())
                      }
                      className="form-control-lg"
                    />
                    <Button
                      variant="primary"
                      onClick={handleAddSubtask}
                      disabled={!newSubtask.trim()}
                    >
                      <Plus size={20} />
                    </Button>
                  </InputGroup>
                </div>

                {subtasks.length > 0 ? (
                  <>
                    <ListGroup className="mb-4">
                      {subtasks.map((subtask) => (
                        <ListGroup.Item
                          key={subtask.id}
                          className={`todo-subtask-item ${
                            subtask.completed ? "completed" : ""
                          }`}
                        >
                          <div className="d-flex align-items-center">
                            <Button
                              variant="link"
                              className="p-0 me-3"
                              onClick={() => handleToggleSubtask(subtask.id)}
                            >
                              {subtask.completed ? (
                                <CheckSquare
                                  size={20}
                                  className="text-success"
                                />
                              ) : (
                                <Square size={20} className="text-secondary" />
                              )}
                            </Button>
                            <div className="flex-grow-1">
                              <span
                                className={`todo-subtask-title ${
                                  subtask.completed
                                    ? "text-decoration-line-through text-muted"
                                    : ""
                                }`}
                              >
                                {subtask.title}
                              </span>
                            </div>
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() => confirmDeleteSubtask(subtask)}
                            >
                              <X size={18} />
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>

                    {/* Progress Bar */}
                    {subtasks.length > 0 && (
                      <div className="todo-progress-container">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-medium">Tiến độ</span>
                          <span className="fw-bold text-primary">
                            {progressPercentage}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${progressPercentage}%` }}
                            aria-valuenow={progressPercentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <div className="text-center mt-2 text-muted small">
                          {completedSubtasks} / {subtasks.length} công việc con
                          đã hoàn thành
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckSquare size={48} className="text-muted mb-3" />
                    <p className="text-muted mb-0">
                      Chưa có công việc con nào. Hãy thêm công việc con để quản
                      lý chi tiết hơn.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Sidebar */}
          <Col lg={4}>
            {/* Additional Information Card */}
            <Card className="todo-form-card mb-4">
              <Card.Header className="todo-card-header">
                <div className="d-flex align-items-center">
                  <div className="todo-card-icon bg-warning">
                    <Folder size={20} />
                  </div>
                  <h5 className="mb-0 ms-3">Thông tin bổ sung</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Danh mục</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập danh mục..."
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="form-control-lg"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="form-control-lg"
                  >
                    <option value="scheduled">
                      <CalendarDays className="me-2" size={16} />
                      Đã lên lịch
                    </option>
                    <option value="in-progress">
                      <Clock className="me-2" size={16} />
                      Đang thực hiện
                    </option>
                    <option value="done">
                      <CheckCircle className="me-2" size={16} />
                      Hoàn thành
                    </option>
                    <option value="cancelled">
                      <XCircle className="me-2" size={16} />
                      Đã hủy
                    </option>
                  </Form.Select>
                </Form.Group>

                <Form.Check
                  type="checkbox"
                  id="isImportant"
                  className="mb-3"
                  label={
                    <span className="fw-medium">
                      <Star
                        size={16}
                        className={`me-2 ${
                          formData.isImportant ? "text-warning" : "text-muted"
                        }`}
                        fill={formData.isImportant ? "currentColor" : "none"}
                      />
                      Đánh dấu quan trọng
                    </span>
                  }
                  checked={formData.isImportant}
                  onChange={(e) =>
                    setFormData({ ...formData, isImportant: e.target.checked })
                  }
                />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Thêm ghi chú..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="form-control-lg"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="todo-form-card mb-4">
              <Card.Header className="todo-card-header">
                <div className="d-flex align-items-center">
                  <div
                    className="todo-card-icon bg-info"
                    style={{ backgroundColor: "#0dcaf0" }}
                  >
                    <Clock size={20} />
                  </div>
                  <h5 className="mb-0 ms-3">Cài đặt nhắc nhở</h5>
                </div>
              </Card.Header>
              <Card.Body>
                {/* Toggle Reminder */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="reminderEnabled"
                    label={
                      <span className="fw-medium d-flex align-items-center">
                        <div className="me-2">
                          {formData.reminderEnabled ? (
                            <Badge bg="success" className="p-1">
                              <CheckCircle size={14} />
                            </Badge>
                          ) : (
                            <Badge bg="secondary" className="p-1">
                              <XCircle size={14} />
                            </Badge>
                          )}
                        </div>
                        <span>Bật nhắc nhở</span>
                      </span>
                    }
                    checked={formData.reminderEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reminderEnabled: e.target.checked,
                      })
                    }
                  />
                  <Form.Text className="text-muted">
                    Hệ thống sẽ gửi thông báo trước khi công việc bắt đầu
                  </Form.Text>
                </Form.Group>

                {/* Reminder Time Selection */}
                {formData.reminderEnabled && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <Clock className="me-2" size={16} />
                        Nhắc nhở trước
                      </Form.Label>
                      <div className="reminder-time-buttons">
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {[1, 5, 10, 15, 30, 60].map((minutes) => (
                            <Button
                              key={minutes}
                              variant={
                                formData.reminderMinutes === minutes
                                  ? "primary"
                                  : "outline-primary"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  reminderMinutes: minutes,
                                })
                              }
                              className="px-3"
                            >
                              {minutes} phút
                            </Button>
                          ))}
                        </div>
                        <div className="mt-2">
                          <Form.Range
                            min="1"
                            max="120"
                            step="1"
                            value={formData.reminderMinutes}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                reminderMinutes: parseInt(e.target.value),
                              })
                            }
                            className="form-range"
                          />
                          <div className="d-flex justify-content-between mt-1">
                            <small className="text-muted">1 phút</small>
                            <small className="fw-bold">
                              {formData.reminderMinutes} phút
                            </small>
                            <small className="text-muted">2 giờ</small>
                          </div>
                        </div>
                      </div>
                    </Form.Group>

                    {/* Reminder Type */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <Bell className="me-2" size={16} />
                        Loại thông báo
                      </Form.Label>
                      <div>
                        {[
                          {
                            value: "push",
                            label: "Thông báo web",
                            icon: <Bell size={14} />,
                          },
                          {
                            value: "email",
                            label: "Email",
                            icon: <Mail size={14} />,
                          },
                          {
                            value: "both",
                            label: "Cả hai",
                            icon: <Bell size={14} />,
                          },
                        ].map((type) => (
                          <Form.Check
                            key={type.value}
                            type="radio"
                            id={`reminder-${type.value}`}
                            name="reminderType"
                            label={
                              <span className="d-flex align-items-center">
                                <span className="me-2">{type.icon}</span>
                                {type.label}
                              </span>
                            }
                            checked={formData.reminderType === type.value}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                reminderType: type.value,
                              })
                            }
                            className="mb-2"
                          />
                        ))}
                      </div>
                    </Form.Group>

                    {isEditing && (
                      <div className="mt-4 pt-3 border-top">
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={async () => {
                            if (
                              window.confirm("Gửi test reminder ngay bây giờ?")
                            ) {
                              try {
                                setLoading(true);
                                const result = await todoService.testReminder(
                                  actualTodoId
                                );
                                showAlertMessage(
                                  result.message || "Đã gửi test reminder"
                                );
                              } catch (error) {
                                showAlertMessage(error.message, "danger");
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          disabled={loading}
                          className="w-100"
                        >
                          <Bell size={16} className="me-2" />
                          Test gửi reminder ngay
                        </Button>
                        <Form.Text className="text-muted small">
                          Chỉ dành cho testing - sẽ gửi thông báo ngay lập tức
                        </Form.Text>
                      </div>
                    )}

                    {/* Reminder Preview */}
                    {formData.start && (
                      <div className="reminder-preview p-3 bg-light rounded">
                        <h6 className="fw-semibold mb-2">
                          <Eye className="me-2" size={16} />
                          Xem trước
                        </h6>
                        <p className="mb-2 small">
                          Bạn sẽ nhận thông báo vào lúc:
                        </p>
                        <div className="alert alert-primary py-2">
                          <div className="d-flex align-items-center">
                            <Clock size={14} className="me-2" />
                            <strong>
                              {(() => {
                                try {
                                  const startTime = new Date(formData.start);
                                  const reminderTime = new Date(
                                    startTime.getTime() -
                                      formData.reminderMinutes * 60000
                                  );
                                  return reminderTime.toLocaleString("vi-VN");
                                } catch (e) {
                                  return "Chưa có thời gian bắt đầu";
                                }
                              })()}
                            </strong>
                          </div>
                        </div>
                        <p className="small text-muted mb-0">
                          Trước khi "{formData.title || "công việc"}" bắt đầu
                          lúc{" "}
                          {formData.start
                            ? new Date(formData.start).toLocaleTimeString(
                                "vi-VN"
                              )
                            : "..."}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>

            {/* Tags Card */}
            <Card className="todo-form-card">
              <Card.Header className="todo-card-header">
                <div className="d-flex align-items-center">
                  <div className="todo-card-icon bg-danger">
                    <Tag size={20} />
                  </div>
                  <h5 className="mb-0 ms-3">Tags & Nhãn</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Thêm tag mới..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      className="form-control-lg"
                    />
                    <Button
                      variant="outline-primary"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      <Plus size={20} />
                    </Button>
                  </InputGroup>
                </div>

                {formData.tags.length > 0 ? (
                  <div className="todo-tags-container">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        bg="primary"
                        className="todo-tag me-2 mb-2"
                      >
                        {tag}
                        <Button
                          variant="link"
                          className="todo-tag-remove p-0 ms-2"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X size={14} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <Tag size={32} className="text-muted mb-2" />
                    <p className="text-muted mb-0 small">
                      Chưa có tag nào. Thêm tag để dễ dàng tìm kiếm.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Submit Buttons */}
        <div className="todo-form-footer">
          <Card className="border-0 shadow-lg">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/todo/list")}
                  disabled={loading}
                  size="lg"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !formData.title.trim()}
                  size="lg"
                  className="px-5"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Đang xử lý...
                    </>
                  ) : isEditing ? (
                    <>
                      <Save size={20} className="me-2" />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <Plus size={20} className="me-2" />
                      Tạo công việc
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Form>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Bạn có chắc chắn muốn xóa công việc con{" "}
            <strong>"{subtaskToDelete?.title}"</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteSubtask}>
            <Trash2 size={16} className="me-2" />
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TodoForm;
