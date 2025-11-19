// export default AdminLogs;
import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Button,
  Badge,
  Pagination,
  Alert,
  Accordion,
  Spinner,
  Modal,
  Tab,
  Tabs,
} from "react-bootstrap";
import { getUserById, getSystemLogs } from "../../../services/adminService";

// Helper functions
const getLogLevelColor = (level) => {
  const colors = {
    error: "danger",
    warn: "warning",
    info: "info",
    debug: "secondary",
  };
  return colors[level] || "secondary";
};

const getLogIcon = (log) => {
  const event = log.event || "";

  if (event.includes("login")) return "fas fa-sign-in-alt";
  if (event.includes("logout")) return "fas fa-sign-out-alt";
  if (event.includes("create") || event.includes("add"))
    return "fas fa-plus-circle";
  if (event.includes("update") || event.includes("edit")) return "fas fa-edit";
  if (event.includes("delete") || event.includes("remove"))
    return "fas fa-trash";
  if (event.includes("view") || event.includes("read")) return "fas fa-eye";
  if (event.includes("search")) return "fas fa-search";
  if (event.includes("upload")) return "fas fa-upload";
  if (event.includes("download")) return "fas fa-download";

  return "fas fa-user-clock";
};

const getLogTypeColor = (type) => {
  const colors = {
    user: "primary",
    friend: "success",
    auth: "warning",
    post: "info",
    todo: "secondary",
    feed: "dark",
    comment: "primary",
    chat: "success",
    system: "danger",
    client: "primary",
  };
  return colors[type] || "secondary";
};

const getLogTypeIcon = (type) => {
  const icons = {
    user: "fas fa-user",
    friend: "fas fa-user-friends",
    auth: "fas fa-shield-alt",
    post: "fas fa-file-alt",
    todo: "fas fa-tasks",
    feed: "fas fa-newspaper",
    comment: "fas fa-comment",
    chat: "fas fa-comments",
    system: "fas fa-cog",
    client: "fas fa-desktop",
  };
  return icons[type] || "fas fa-circle";
};

const formatLogMessage = (log) => {
  return log.event || "Client Activity";
};

// Component hiển thị từng log item
const LogItem = ({ log, onViewUser }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Validate log data
  if (!log) {
    return (
      <Card className="mb-3 border-start border-4 border-warning">
        <Card.Body className="p-3">
          <div className="text-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Invalid log data
          </div>
        </Card.Body>
      </Card>
    );
  }

  const renderUserInfo = (log, onViewUser) => {
    if (!log.userInfo && !log.userId) return null;

    const user = log.userInfo || { _id: log.userId };

    return (
      <div className="d-flex align-items-center mt-2 p-2 bg-light rounded">
        <div className="flex-grow-1">
          <small className="d-block">
            <strong>User: </strong>
            {user.username ? (
              <Button
                variant="link"
                className="p-0 text-primary"
                onClick={() => onViewUser(user._id)}
              >
                {user.username} ({user.email})
              </Button>
            ) : (
              <span className="text-muted">ID: {user._id}</span>
            )}
          </small>
          {user.role && (
            <small className="d-block">
              <strong>Role: </strong>
              <Badge bg="secondary" className="ms-1">
                {user.role}
              </Badge>
            </small>
          )}
        </div>
        {user.username && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onViewUser(user._id)}
          >
            <i className="fas fa-external-link-alt me-1"></i>
            Chi tiết
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="mb-3 border-start border-4 border-secondary shadow-sm">
      <Card.Body className="p-3">
        <div className="d-flex align-items-start">
          <div
            className={`icon-circle bg-${getLogLevelColor(
              log.level || "info"
            )} text-white d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
            style={{ width: "44px", height: "44px", borderRadius: "12px" }}
          >
            <i className={`${getLogIcon(log)} fa-fw`}></i>
          </div>

          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 className="mb-1 fw-semibold text-dark">
                  {formatLogMessage(log)}
                </h6>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <Badge
                    bg={getLogLevelColor(log.level || "info")}
                    className="small"
                  >
                    {(log.level || "info").toUpperCase()}
                  </Badge>
                  <Badge
                    bg={getLogTypeColor(log.type || "client")}
                    className="small"
                  >
                    <i
                      className={`${getLogTypeIcon(log.type || "client")} me-1`}
                    ></i>
                    {(log.type || "client").toUpperCase()}
                  </Badge>
                  <span className="text-muted small">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString("vi-VN")
                      : "N/A"}
                  </span>
                  {log.ip && (
                    <Badge bg="outline-dark" className="small">
                      IP: {log.ip}
                    </Badge>
                  )}
                </div>
                {log.description && (
                  <p className="mb-0 mt-1 small text-muted">
                    {log.description}
                  </p>
                )}
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <i className={`fas fa-${showDetails ? "minus" : "plus"}`}></i>
              </Button>
            </div>

            {/* Thông tin user */}
            {renderUserInfo(log, onViewUser)}

            {/* Chi tiết log */}
            {showDetails && (
              <div className="mt-3 p-3 bg-light rounded">
                <Accordion>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <small>Chi tiết log</small>
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="small">
                        <strong>Event:</strong> {log.event}
                        <br />
                        <strong>Level:</strong> {log.level}
                        <br />
                        <strong>Type:</strong> {log.type || "client"}
                        <br />
                        <strong>Timestamp:</strong> {log.timestamp}
                        <br />
                        {log.userId && (
                          <>
                            <strong>User ID:</strong> {log.userId}
                            <br />
                          </>
                        )}
                        {log.ip && (
                          <>
                            <strong>IP:</strong> {log.ip}
                            <br />
                          </>
                        )}
                        {log.url && (
                          <>
                            <strong>URL:</strong> {log.url}
                            <br />
                          </>
                        )}
                        {log.userAgent && (
                          <>
                            <strong>User Agent:</strong> {log.userAgent}
                            <br />
                          </>
                        )}
                        {log.correlationId && (
                          <>
                            <strong>Correlation ID:</strong> {log.correlationId}
                            <br />
                          </>
                        )}
                        {log.payload && (
                          <>
                            <strong>Payload:</strong>
                            <pre
                              className="mt-1 mb-0"
                              style={{ fontSize: "11px" }}
                            >
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </>
                        )}
                        {log.meta && (
                          <>
                            <strong>Metadata:</strong>
                            <pre
                              className="mt-1 mb-0"
                              style={{ fontSize: "11px" }}
                            >
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          </>
                        )}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// Modal hiển thị thông tin user
const UserInfoModal = ({ show, onHide, user }) => {
  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-user me-2"></i>
          Thông Tin Người Dùng
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={3} className="text-center">
            {user.profile?.avatar ? (
              <img
                src={user.profile.avatar}
                alt="Avatar"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mb-3 mx-auto"
                style={{ width: "100px", height: "100px" }}
              >
                <i className="fas fa-user text-white fa-2x"></i>
              </div>
            )}
            <h5>{user.fullName || user.username}</h5>
            <Badge bg={user.role === "admin" ? "danger" : "primary"}>
              {user.role}
            </Badge>
          </Col>
          <Col md={9}>
            <div className="row">
              <div className="col-6 mb-2">
                <strong>Username:</strong> {user.username}
              </div>
              <div className="col-6 mb-2">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="col-6 mb-2">
                <strong>Ngày tạo:</strong>{" "}
                {new Date(user.createdAt).toLocaleDateString("vi-VN")}
              </div>
              <div className="col-6 mb-2">
                <strong>Violations:</strong> {user.violationCount || 0}
              </div>
              {user.lastLogin && (
                <div className="col-12 mb-2">
                  <strong>Đăng nhập cuối:</strong>{" "}
                  {new Date(user.lastLogin).toLocaleString("vi-VN")}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            window.open(`/admin/users/${user._id}`, "_blank");
            onHide();
          }}
        >
          <i className="fas fa-external-link-alt me-2"></i>
          Mở trang quản lý
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Component chính
const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({}); // Thêm state cho thống kê

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    level: "",
    type: "",
    userId: "",
    event: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    results: 0,
    totalLogs: 0,
  });

  // Danh sách các loại log
  const logTypes = [
    { value: "", label: "Tất cả loại" },
    { value: "user", label: "User", icon: "fas fa-user" },
    { value: "friend", label: "Friend", icon: "fas fa-user-friends" },
    { value: "auth", label: "Auth", icon: "fas fa-shield-alt" },
    { value: "post", label: "Post", icon: "fas fa-file-alt" },
    { value: "todo", label: "Todo", icon: "fas fa-tasks" },
    { value: "feed", label: "Feed", icon: "fas fa-newspaper" },
    { value: "comment", label: "Comment", icon: "fas fa-comment" },
    { value: "chat", label: "Chat", icon: "fas fa-comments" },
    { value: "system", label: "System", icon: "fas fa-cog" },
    { value: "client", label: "Client", icon: "fas fa-desktop" },
    { value: "settings", label: "Settings", icon: "fas fa-cogs" },
  ];

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      console.log("Fetching logs with filters:", filters); // Debug filters

      const params = {
        ...filters,
      };

      const response = await getSystemLogs(params);
      console.log("API Response:", response.data); // Debug response

      setLogs(response.data.logs);
      setPagination(response.data.pagination);

      // Tính toán thống kê từ dữ liệu logs
      calculateStats(response.data.logs);
    } catch (error) {
      console.error("Lỗi khi lấy client logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tính thống kê
  const calculateStats = (logs) => {
    const typeCounts = {};
    const levelCounts = {};

    logs.forEach((log) => {
      // Thống kê theo type
      const type = log.type || "client";
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      // Thống kê theo level
      const level = log.level || "info";
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    setStats({
      typeCounts,
      levelCounts,
      total: logs.length,
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      level: "",
      type: "",
      userId: "",
      event: "",
      startDate: "",
      endDate: "",
      search: "",
    });
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await getUserById(userId);
      setSelectedUser(response.data.data.user);
      setShowUserModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
    }
  };

  // Hàm lấy số lượng log theo type
  const getTypeCount = (type) => {
    return stats.typeCounts?.[type] || 0;
  };

  if (loading) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Đang tải client logs...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="admin-logs">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0 fw-bold text-dark">
              <i className="fas fa-user-clock text-primary me-2"></i>
              Quản Lý Client Logs
            </h4>
            <div className="d-flex gap-2">
              <Badge bg="primary" className="fs-6 px-3 py-2">
                {pagination.totalLogs.toLocaleString()} logs
              </Badge>
              {filters.type && (
                <Badge bg="info" className="fs-6 px-3 py-2">
                  Đang lọc: {filters.type}
                </Badge>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Bộ lọc */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light border-0">
              <h6 className="mb-0 fw-semibold">
                <i className="fas fa-filter text-primary me-2"></i>
                Bộ lọc tìm kiếm Client Logs
              </h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={2}>
                  <Form.Label className="small fw-medium">Level</Form.Label>
                  <Form.Select
                    value={filters.level}
                    onChange={(e) =>
                      handleFilterChange("level", e.target.value)
                    }
                    size="sm"
                  >
                    <option value="">Tất cả level</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-medium">Loại</Form.Label>
                  <Form.Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    size="sm"
                  >
                    {logTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon && <i className={`${type.icon} me-2`}></i>}
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-medium">Event</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Event..."
                    value={filters.event}
                    onChange={(e) =>
                      handleFilterChange("event", e.target.value)
                    }
                    size="sm"
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-medium">User ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="User ID..."
                    value={filters.userId}
                    onChange={(e) =>
                      handleFilterChange("userId", e.target.value)
                    }
                    size="sm"
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-medium">Từ ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    size="sm"
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-medium">Đến ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    size="sm"
                  />
                </Col>
              </Row>
              <Row className="g-3 mt-2">
                <Col md={6}>
                  <Form.Label className="small fw-medium">Tìm kiếm</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tìm theo event, description, IP, type..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    size="sm"
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-medium">
                    Số bản ghi
                  </Form.Label>
                  <Form.Select
                    value={filters.limit}
                    onChange={(e) =>
                      handleFilterChange("limit", parseInt(e.target.value))
                    }
                    size="sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Form.Select>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={clearFilters}
                    className="w-100"
                  >
                    <i className="fas fa-times me-2"></i>
                    Xóa lọc
                  </Button>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={fetchLogs}
                    className="w-100"
                  >
                    <i className="fas fa-search me-2"></i>
                    Tìm kiếm
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Thống kê nhanh */}
          <div className="mb-4">
            <Row className="g-3">
              {logTypes
                .filter((type) => type.value)
                .map((type) => (
                  <Col key={type.value} md={2} sm={4} xs={6}>
                    <Card
                      className={`text-center border-0 shadow-sm h-100 cursor-pointer ${
                        filters.type === type.value ? "border-primary" : ""
                      }`}
                      onClick={() => handleFilterChange("type", type.value)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card.Body className="p-3">
                        <div
                          className={`text-${getLogTypeColor(type.value)} mb-2`}
                        >
                          <i className={`${type.icon} fa-2x`}></i>
                        </div>
                        <h6 className="mb-1">{type.label}</h6>
                        <Badge
                          bg={getLogTypeColor(type.value)}
                          className="fs-6"
                        >
                          {getTypeCount(type.value)}
                        </Badge>
                        {filters.type === type.value && (
                          <div className="mt-2">
                            <Badge bg="primary" className="small">
                              Đang chọn
                            </Badge>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
            </Row>
          </div>

          {/* Danh sách logs */}
          <div className="logs-list">
            {logs.length === 0 ? (
              <Alert variant="light" className="text-center border-dashed py-5">
                <i className="fas fa-search fa-2x text-muted mb-3"></i>
                <p className="mb-0 text-muted">
                  Không tìm thấy client logs nào phù hợp với bộ lọc.
                </p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Xóa bộ lọc
                </Button>
              </Alert>
            ) : (
              logs.map((log, index) => (
                <LogItem
                  key={log._id || index}
                  log={log}
                  onViewUser={viewUserDetails}
                />
              ))
            )}
          </div>

          {/* Phân trang */}
          {pagination.total > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted small">
                Hiển thị {logs.length} của{" "}
                {pagination.totalLogs.toLocaleString()} logs
                {filters.type && ` (Loại: ${filters.type})`}
              </div>
              <Pagination>
                <Pagination.Prev
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                />
                {[...Array(Math.min(5, pagination.total))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === filters.page}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  disabled={filters.page === pagination.total}
                  onClick={() => handlePageChange(filters.page + 1)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal xem thông tin user */}
      <UserInfoModal
        show={showUserModal}
        onHide={() => setShowUserModal(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminLogs;
