import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  Form,
  Card,
  Table,
  Pagination,
  Badge,
  Row,
  Col,
  Image,
  Spinner,
  Alert,
  InputGroup,
  ProgressBar,
  Dropdown,
  ListGroup,
  Collapse,
} from "react-bootstrap";
import {
  Search,
  Filter,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Navigation,
  FileText,
  Download,
  BarChart3,
  Users,
  Shield,
  Activity,
  RefreshCw,
  ExternalLink,
  BellOff,
  Wifi,
  WifiOff,
  Battery,
  X,
  Calendar,
  ArrowUpDown,
  Hash,
  RotateCcw,
} from "lucide-react";
import { ChevronUp, ChevronDown } from "lucide-react";
import api from "../../../services/api";
import "./AdminEmergencyManagement.css";

import { useParams } from "react-router-dom";

const AdminEmergencyManagement = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [advancedStats, setAdvancedStats] = useState({});

  // Param từ URL
  const { id } = useParams();

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    type: "",
    status: "",
    priority: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    respondedBy: "",
    hasLocation: "",
    isSilent: "",
    emergencyId: "" || id,
  });

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Selected data
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [responders, setResponders] = useState([]);
  const [responseLoading, setResponseLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(true);

  // Response form
  const [responseForm, setResponseForm] = useState({
    responderId: "",
    notes: "",
    estimatedTime: "",
    priority: "medium",
    assignedTeam: "",
  });

  // Fetch emergencies
  const fetchEmergencies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/emergencies", {
        params: filters,
      });

      setEmergencies(response.data.data.emergencies);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError("Không thể tải danh sách yêu cầu khẩn cấp");
      console.error("Fetch emergencies error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get("/api/admin/emergencies/stats");
      setStats(response.data.data);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  // Fetch advanced stats
  const fetchAdvancedStats = async () => {
    try {
      const response = await api.get("/api/admin/emergencies/stats/advanced");
      setAdvancedStats(response.data.data);
    } catch (err) {
      console.error("Fetch advanced stats error:", err);
    }
  };

  // Fetch available responders
  const fetchResponders = async () => {
    try {
      const response = await api.get("/api/admin/emergencies/responders");
      setResponders(response.data.data);
    } catch (err) {
      console.error("Fetch responders error:", err);
    }
  };

  // Initialize
  useEffect(() => {
    fetchEmergencies();
    fetchStats();
    fetchResponders();
  }, [fetchEmergencies]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      type: "",
      status: "",
      priority: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      respondedBy: "",
      hasLocation: "",
      isSilent: "",
      emergencyId: "",
    });
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleShowDetail = (emergency) => {
    setSelectedEmergency(emergency);
    setShowDetailModal(true);
  };

  const handleShowMap = (emergency) => {
    setSelectedEmergency(emergency);
    setSelectedLocation({
      lat: emergency.latitude,
      lng: emergency.longitude,
      address: emergency.address,
    });
    setShowMapModal(true);
  };

  const handleShowResponse = (emergency) => {
    setSelectedEmergency(emergency);
    setResponseForm({
      responderId: "",
      notes: "",
      estimatedTime: "",
      priority: emergency.priority || "medium",
      assignedTeam: "",
    });
    fetchResponders();
    setShowResponseModal(true);
  };

  const handleStatusChange = async (emergencyId, newStatus) => {
    try {
      await api.post(`/api/admin/emergencies/${emergencyId}/status`, {
        status: newStatus,
      });

      // Update local state
      setEmergencies((prev) =>
        prev.map((emergency) =>
          emergency._id === emergencyId
            ? { ...emergency, status: newStatus }
            : emergency
        )
      );

      // Update selected emergency if open
      if (selectedEmergency && selectedEmergency._id === emergencyId) {
        setSelectedEmergency((prev) => ({ ...prev, status: newStatus }));
      }

      fetchStats();
    } catch (err) {
      setError("Không thể cập nhật trạng thái");
      console.error("Update status error:", err);
    }
  };

  const handleSubmitResponse = async () => {
    try {
      setResponseLoading(true);
      await api.post(
        `/api/admin/emergencies/${selectedEmergency._id}/respond`,
        responseForm
      );

      // Refresh data
      fetchEmergencies();
      fetchStats();

      setShowResponseModal(false);
      setResponseLoading(false);
    } catch (err) {
      setError("Không thể gửi phản hồi");
      console.error("Submit response error:", err);
      setResponseLoading(false);
    }
  };

  const handleDeleteEmergency = async (emergencyId) => {
    try {
      await api.delete(`/api/admin/emergencies/${emergencyId}`);
      setEmergencies((prev) => prev.filter((e) => e._id !== emergencyId));
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      fetchStats();
    } catch (err) {
      setError("Không thể xoá yêu cầu");
      console.error("Delete emergency error:", err);
    }
  };

  const handleExportData = async (format) => {
    try {
      const response = await api.get("/api/admin/emergencies/export", {
        params: { ...filters, format },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `emergencies_${new Date().toISOString().split("T")[0]}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Không thể xuất dữ liệu");
      console.error("Export error:", err);
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        variant: "warning",
        label: "Đang chờ",
        icon: <Clock size={14} />,
      },
      responded: {
        variant: "info",
        label: "Đã tiếp nhận",
        icon: <CheckCircle size={14} />,
      },
      in_progress: {
        variant: "primary",
        label: "Đang xử lý",
        icon: <Activity size={14} />,
      },
      resolved: {
        variant: "success",
        label: "Đã giải quyết",
        icon: <CheckCircle size={14} />,
      },
      cancelled: {
        variant: "secondary",
        label: "Đã hủy",
        icon: <XCircle size={14} />,
      },
      expired: {
        variant: "danger",
        label: "Hết hạn",
        icon: <Clock size={14} />,
      },
    };

    return (
      statusConfig[status] || {
        variant: "secondary",
        label: status,
        icon: <AlertTriangle size={14} />,
      }
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      critical: { variant: "danger", label: "Khẩn cấp" },
      high: { variant: "warning", label: "Cao" },
      medium: { variant: "info", label: "Trung bình" },
      low: { variant: "secondary", label: "Thấp" },
    };

    return (
      priorityConfig[priority] || {
        variant: "secondary",
        label: "Không xác định",
      }
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      panic: {
        variant: "danger",
        label: "Khẩn cấp",
        icon: <AlertTriangle size={14} />,
      },
      medical: {
        variant: "success",
        label: "Y tế",
        icon: <Activity size={14} />,
      },
      fire: {
        variant: "warning",
        label: "Hỏa hoạn",
        icon: <AlertTriangle size={14} />,
      },
      police: {
        variant: "primary",
        label: "Cảnh sát",
        icon: <Shield size={14} />,
      },
      other: {
        variant: "secondary",
        label: "Khác",
        icon: <AlertTriangle size={14} />,
      },
    };

    return (
      typeConfig[type] || {
        variant: "secondary",
        label: type,
        icon: <AlertTriangle size={14} />,
      }
    );
  };

  const calculateResponseTime = (emergency) => {
    if (!emergency.respondedAt || !emergency.createdAt) return null;

    const responseTime =
      new Date(emergency.respondedAt) - new Date(emergency.createdAt);
    const minutes = Math.floor(responseTime / 60000);
    const seconds = Math.floor((responseTime % 60000) / 1000);

    return `${minutes}p ${seconds}s`;
  };

  const getDeviceStatus = (emergency) => {
    if (!emergency.deviceInfo) return null;

    return (
      <div className="device-status d-flex gap-2">
        {emergency.deviceInfo.battery && (
          <Badge bg={emergency.deviceInfo.battery < 20 ? "danger" : "success"}>
            <Battery size={12} className="me-1" />
            {emergency.deviceInfo.battery}%
          </Badge>
        )}
        {emergency.deviceInfo.network && (
          <Badge
            bg={emergency.deviceInfo.network === "wifi" ? "success" : "warning"}
          >
            {emergency.deviceInfo.network === "wifi" ? (
              <Wifi size={12} />
            ) : (
              <WifiOff size={12} />
            )}
            {emergency.deviceInfo.network === "wifi" ? "WiFi" : "Mạng di động"}
          </Badge>
        )}
      </div>
    );
  };

  // Enhanced stats calculation
  const getEnhancedStats = () => {
    const total = emergencies.length;
    const pending = emergencies.filter((e) => e.status === "pending").length;
    const resolved = emergencies.filter((e) => e.status === "resolved").length;
    const inProgress = emergencies.filter(
      (e) => e.status === "in_progress"
    ).length;
    const critical = emergencies.filter(
      (e) => e.priority === "critical"
    ).length;
    const withLocation = emergencies.filter(
      (e) => e.latitude && e.longitude
    ).length;

    return {
      total,
      pending,
      resolved,
      inProgress,
      critical,
      withLocation,
    };
  };

  const enhancedStats = getEnhancedStats();

  // Render Map (simplified - in real app use Google Maps API)
  const renderMap = () => {
    if (!selectedLocation) return null;

    const mapUrl = `https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=15&output=embed`;

    return (
      <div className="map-container">
        <iframe
          title="Emergency Location"
          width="100%"
          height="400"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapUrl}
          style={{ border: 0 }}
          allowFullScreen
        />
        <div className="map-overlay-info mt-3 p-3 bg-light rounded">
          <h6>Thông tin vị trí:</h6>
          <p className="mb-1">
            <strong>Địa chỉ:</strong>{" "}
            {selectedLocation.address || "Không xác định"}
          </p>
          <p className="mb-1">
            <strong>Tọa độ:</strong> {selectedLocation.lat.toFixed(6)},{" "}
            {selectedLocation.lng.toFixed(6)}
          </p>
          <p className="mb-0">
            <strong>Độ chính xác:</strong>{" "}
            {selectedEmergency?.locationAccuracy || "Không xác định"}m
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-emergency-management m-3">
      {/* Header */}
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 mb-2 text-danger">
              <AlertTriangle className="me-2" size={32} />
              Quản lý Yêu cầu Khẩn cấp
            </h1>
            <p className="text-muted mb-0">
              Quản lý và theo dõi tất cả yêu cầu khẩn cấp trong hệ thống
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-info"
              onClick={() => {
                setShowStatsModal(true);
                fetchAdvancedStats();
              }}
            >
              <BarChart3 size={16} className="me-2" />
              Thống kê
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => setShowExportModal(true)}
            >
              <Download size={16} className="me-2" />
              Xuất dữ liệu
            </Button>
            <Button variant="danger" onClick={fetchEmergencies}>
              <RefreshCw size={16} className="me-2" />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="emergency-stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Tổng yêu cầu</h6>
                  <h3 className="text-primary mb-1">{enhancedStats.total}</h3>
                  <div className="small text-muted">
                    <span className="text-danger">
                      {enhancedStats.critical} khẩn cấp
                    </span>
                  </div>
                </div>
                <div className="emergency-stats-icon bg-primary">
                  <AlertTriangle size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="emergency-stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Đang chờ xử lý</h6>
                  <h3 className="text-warning mb-1">{enhancedStats.pending}</h3>
                  <div className="small text-muted">
                    {Math.round(
                      (enhancedStats.pending / enhancedStats.total) * 100
                    ) || 0}
                    % tổng số
                  </div>
                </div>
                <div className="emergency-stats-icon bg-warning">
                  <Clock size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="emergency-stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Đang xử lý</h6>
                  <h3 className="text-info mb-1">{enhancedStats.inProgress}</h3>
                  <div className="small text-muted">
                    {Math.round(
                      (enhancedStats.inProgress / enhancedStats.total) * 100
                    ) || 0}
                    % tổng số
                  </div>
                </div>
                <div className="emergency-stats-icon bg-info">
                  <Activity size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="emergency-stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Đã giải quyết</h6>
                  <h3 className="text-success mb-1">
                    {enhancedStats.resolved}
                  </h3>
                  <div className="small text-muted">
                    {Math.round(
                      (enhancedStats.resolved / enhancedStats.total) * 100
                    ) || 0}
                    % tổng số
                  </div>
                </div>
                <div className="emergency-stats-icon bg-success">
                  <CheckCircle size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Filters */}
      {/* <Card className="emergency-filter-card">
        <Card.Header
          className="bg-white d-flex justify-content-between align-items-center cursor-pointer"
          onClick={() => setShowFilter((v) => !v)}
        >
          <h5 className="mb-0">
            <Filter size={20} className="me-2 text-danger" />
            Bộ lọc tìm kiếm
          </h5>

          {showFilter ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Card.Header>
        <Collapse in={showFilter}>
          <div>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label>
                    <Search size={14} className="me-1" />
                    Tìm kiếm
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="SĐT, tin nhắn, địa chỉ..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Label>
                    <Search size={14} className="me-1" />
                    ID của yêu cầu
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="ID của yêu cầu..."
                      value={filters.emergencyId}
                      onChange={(e) =>
                        handleFilterChange("emergencyId", e.target.value)
                      }
                    />
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Form.Label>
                    <AlertTriangle size={14} className="me-1" />
                    Loại yêu cầu
                  </Form.Label>
                  <Form.Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">Tất cả loại</option>
                    <option value="panic">Khẩn cấp</option>
                    <option value="medical">Y tế</option>
                    <option value="fire">Hỏa hoạn</option>
                    <option value="police">Cảnh sát</option>
                    <option value="other">Khác</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>
                    <Shield size={14} className="me-1" />
                    Trạng thái
                  </Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Đang chờ</option>
                    <option value="responded">Đã tiếp nhận</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="cancelled">Đã hủy</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>
                    <Activity size={14} className="me-1" />
                    Độ ưu tiên
                  </Form.Label>
                  <Form.Select
                    value={filters.priority}
                    onChange={(e) =>
                      handleFilterChange("priority", e.target.value)
                    }
                  >
                    <option value="">Tất cả độ ưu tiên</option>
                    <option value="critical">Khẩn cấp</option>
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label>Thời gian</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="date"
                        placeholder="Từ ngày"
                        value={filters.dateFrom}
                        onChange={(e) =>
                          handleFilterChange("dateFrom", e.target.value)
                        }
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="date"
                        placeholder="Đến ngày"
                        value={filters.dateTo}
                        onChange={(e) =>
                          handleFilterChange("dateTo", e.target.value)
                        }
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>

              <Row className="g-3 mt-2">
                <Col md={2}>
                  <Form.Label>Vị trí</Form.Label>
                  <Form.Select
                    value={filters.hasLocation}
                    onChange={(e) =>
                      handleFilterChange("hasLocation", e.target.value)
                    }
                  >
                    <option value="">Tất cả vị trí</option>
                    <option value="true">Có vị trí</option>
                    <option value="false">Không có vị trí</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Chế độ</Form.Label>
                  <Form.Select
                    value={filters.isSilent}
                    onChange={(e) =>
                      handleFilterChange("isSilent", e.target.value)
                    }
                  >
                    <option value="">Tất cả chế độ</option>
                    <option value="true">Im lặng</option>
                    <option value="false">Có âm thanh</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Sắp xếp</Form.Label>
                  <Form.Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split("-");
                      handleFilterChange("sortBy", sortBy);
                      handleFilterChange("sortOrder", sortOrder);
                    }}
                  >
                    <option value="createdAt-desc">Mới nhất</option>
                    <option value="createdAt-asc">Cũ nhất</option>
                    <option value="priority-desc">Ưu tiên cao nhất</option>
                    <option value="updatedAt-desc">Cập nhật gần nhất</option>
                  </Form.Select>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={handleResetFilters}
                  >
                    <Trash2 size={16} className="me-1" />
                    Xóa lọc
                  </Button>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="danger"
                    className="w-100"
                    onClick={fetchEmergencies}
                  >
                    <Search size={16} className="me-1" />
                    Tìm kiếm
                  </Button>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-primary"
                    className="w-100"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        status: "pending",
                        priority: "critical",
                      }));
                    }}
                  >
                    <AlertTriangle size={16} className="me-1" />
                    Khẩn cấp
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </div>
        </Collapse>
      </Card> */}
      <Card className="emergency-filter-card border-0 shadow-sm">
        <Card.Header
          className="bg-white d-flex justify-content-between align-items-center cursor-pointer py-3"
          onClick={() => setShowFilter((v) => !v)}
        >
          <h5 className="mb-0 d-flex align-items-center">
            <Filter size={20} className="me-2 text-danger" />
            Bộ lọc tìm kiếm
            {Object.values(filters).some(
              (value) => value !== "" && value !== null && value !== undefined
            ) && (
              <Badge bg="danger" pill className="ms-2">
                Đang lọc
              </Badge>
            )}
          </h5>
          <div className="d-flex align-items-center">
            <Button
              variant="link"
              size="sm"
              className="text-decoration-none me-2"
              onClick={(e) => {
                e.stopPropagation();
                handleResetFilters();
              }}
            >
              <Trash2 size={16} className="me-1" />
              Xóa lọc
            </Button>
            {showFilter ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </Card.Header>

        <Collapse in={showFilter}>
          <Card.Body className="pt-3">
            {/* Hàng 1: Tìm kiếm chung và ID */}
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Search size={14} className="me-1" />
                    Tìm kiếm chung
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="SĐT, tin nhắn, địa chỉ..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      className="py-2"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Tìm kiếm theo nội dung, SĐT hoặc địa chỉ
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Hash size={14} className="me-1" />
                    ID yêu cầu
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Nhập ID yêu cầu cụ thể..."
                      value={filters.emergencyId}
                      onChange={(e) =>
                        handleFilterChange("emergencyId", e.target.value)
                      }
                      className="py-2"
                    />
                    {filters.emergencyId && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleFilterChange("emergencyId", "")}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Tìm kiếm chính xác theo ID
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Calendar size={14} className="me-1" />
                    Từ ngày
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Calendar size={14} className="me-1" />
                    Đến ngày
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Hàng 2: Bộ lọc chính */}
            <Row className="g-3 mb-4">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <AlertTriangle size={14} className="me-1 text-warning" />
                    Loại yêu cầu
                  </Form.Label>
                  <Form.Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="py-2"
                  >
                    <option value="">Tất cả loại</option>
                    <option value="panic" className="text-danger">
                      Khẩn cấp
                    </option>
                    <option value="medical" className="text-primary">
                      Y tế
                    </option>
                    <option value="fire" className="text-danger">
                      Hỏa hoạn
                    </option>
                    <option value="police" className="text-primary">
                      Cảnh sát
                    </option>
                    <option value="other" className="text-secondary">
                      Khác
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Shield size={14} className="me-1 text-success" />
                    Trạng thái
                  </Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="py-2"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending" className="text-warning">
                      Đang chờ
                    </option>
                    <option value="responded" className="text-info">
                      Đã tiếp nhận
                    </option>
                    <option value="in_progress" className="text-primary">
                      Đang xử lý
                    </option>
                    <option value="resolved" className="text-success">
                      Đã giải quyết
                    </option>
                    <option value="cancelled" className="text-secondary">
                      Đã hủy
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Activity size={14} className="me-1 text-danger" />
                    Độ ưu tiên
                  </Form.Label>
                  <Form.Select
                    value={filters.priority}
                    onChange={(e) =>
                      handleFilterChange("priority", e.target.value)
                    }
                    className="py-2"
                  >
                    <option value="">Tất cả độ ưu tiên</option>
                    <option value="critical" className="text-danger fw-bold">
                      Khẩn cấp
                    </option>
                    <option value="high" className="text-warning fw-bold">
                      Cao
                    </option>
                    <option value="medium" className="text-primary">
                      Trung bình
                    </option>
                    <option value="low" className="text-success">
                      Thấp
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <MapPin size={14} className="me-1 text-info" />
                    Vị trí
                  </Form.Label>
                  <Form.Select
                    value={filters.hasLocation}
                    onChange={(e) =>
                      handleFilterChange("hasLocation", e.target.value)
                    }
                    className="py-2"
                  >
                    <option value="">Tất cả vị trí</option>
                    <option value="true"> Có vị trí</option>
                    <option value="false"> Không có vị trí</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Hàng 3: Sắp xếp và nút hành động */}
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <ArrowUpDown size={14} className="me-1" />
                    Sắp xếp
                  </Form.Label>
                  <Form.Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split("-");
                      handleFilterChange("sortBy", sortBy);
                      handleFilterChange("sortOrder", sortOrder);
                    }}
                    className="py-2"
                  >
                    <option value="createdAt-desc">Mới nhất (mặc định)</option>
                    <option value="createdAt-asc">Cũ nhất</option>
                    <option value="priority-desc"> Ưu tiên cao nhất</option>
                    <option value="updatedAt-desc"> Cập nhật gần nhất</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={8}>
                <div className="d-flex gap-2 justify-content-end">
                  <Button
                    variant="outline-secondary"
                    className="px-4 py-2 d-flex align-items-center"
                    onClick={() => {
                      // Reset tất cả filter trừ ID nếu đang có
                      const newFilters = {
                        search: "",
                        dateFrom: "",
                        dateTo: "",
                        type: "",
                        status: "",
                        priority: "",
                        hasLocation: "",
                        sortBy: "createdAt",
                        sortOrder: "desc",
                        emergencyId: filters.emergencyId, // Giữ lại ID nếu có
                      };
                      setFilters(newFilters);
                    }}
                  >
                    <RotateCcw size={16} className="me-2" />
                    Giữ ID, reset khác
                  </Button>

                  <Button
                    variant="outline-primary"
                    className="px-4 py-2 d-flex align-items-center"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        status: "pending",
                        priority: "critical",
                        hasLocation: "true",
                      }));
                    }}
                  >
                    <AlertTriangle size={16} className="me-2" />
                    Khẩn cấp chờ xử lý
                  </Button>

                  <Button
                    variant="danger"
                    className="px-4 py-2 d-flex align-items-center fw-semibold"
                    onClick={fetchEmergencies}
                  >
                    <Search size={16} className="me-2" />
                    Tìm kiếm
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Hiển thị bộ lọc hiện tại */}
            {Object.values(filters).some(
              (value) => value !== "" && value !== null && value !== undefined
            ) && (
              <div className="mt-4 pt-3 border-top">
                <small className="text-muted d-block mb-2">
                  Bộ lọc đang áp dụng:
                </small>
                <div className="d-flex flex-wrap gap-2">
                  {filters.emergencyId && (
                    <Badge bg="primary" className="d-flex align-items-center">
                      <Hash size={12} className="me-1" />
                      ID: {filters.emergencyId}
                      <X
                        size={12}
                        className="ms-1 cursor-pointer"
                        onClick={() => handleFilterChange("emergencyId", "")}
                      />
                    </Badge>
                  )}

                  {filters.type && (
                    <Badge bg="warning" className="d-flex align-items-center">
                      Loại:{" "}
                      {filters.type === "panic"
                        ? "Khẩn cấp"
                        : filters.type === "medical"
                        ? "Y tế"
                        : filters.type === "fire"
                        ? "Hỏa hoạn"
                        : filters.type === "police"
                        ? "Cảnh sát"
                        : "Khác"}
                      <X
                        size={12}
                        className="ms-1 cursor-pointer"
                        onClick={() => handleFilterChange("type", "")}
                      />
                    </Badge>
                  )}

                  {filters.status && (
                    <Badge bg="info" className="d-flex align-items-center">
                      Trạng thái:{" "}
                      {filters.status === "pending"
                        ? "Đang chờ"
                        : filters.status === "responded"
                        ? "Đã tiếp nhận"
                        : filters.status === "in_progress"
                        ? "Đang xử lý"
                        : filters.status === "resolved"
                        ? "Đã giải quyết"
                        : "Đã hủy"}
                      <X
                        size={12}
                        className="ms-1 cursor-pointer"
                        onClick={() => handleFilterChange("status", "")}
                      />
                    </Badge>
                  )}

                  {filters.priority && (
                    <Badge bg="danger" className="d-flex align-items-center">
                      Ưu tiên:{" "}
                      {filters.priority === "critical"
                        ? "Khẩn cấp"
                        : filters.priority === "high"
                        ? "Cao"
                        : filters.priority === "medium"
                        ? "Trung bình"
                        : "Thấp"}
                      <X
                        size={12}
                        className="ms-1 cursor-pointer"
                        onClick={() => handleFilterChange("priority", "")}
                      />
                    </Badge>
                  )}

                  {filters.search && (
                    <Badge bg="secondary" className="d-flex align-items-center">
                      <Search size={12} className="me-1" />
                      Tìm: {filters.search.substring(0, 15)}...
                      <X
                        size={12}
                        className="ms-1 cursor-pointer"
                        onClick={() => handleFilterChange("search", "")}
                      />
                    </Badge>
                  )}

                  {filters.hasLocation && (
                    <Badge bg="success" className="d-flex align-items-center">
                      <MapPin size={12} className="me-1" />
                      Vị trí:{" "}
                      {filters.hasLocation === "true" ? "Có" : "Không có"}
                      <X
                        size={12}
                        className="ms-1 cursor-pointer"
                        onClick={() => handleFilterChange("hasLocation", "")}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </Card.Body>
        </Collapse>
      </Card>

      {/* Emergencies Table */}
      <Card className="emergency-table-card">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <AlertTriangle size={20} className="me-2 text-danger" />
            Danh sách yêu cầu ({pagination.total || 0})
          </h5>
          <div className="text-muted small">
            Trang {filters.page} / {pagination.pages || 1}
            {enhancedStats.pending > 0 && (
              <Badge bg="danger" className="ms-2">
                {enhancedStats.pending} cần xử lý
              </Badge>
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0 position-relative">
          {loading && (
            <div className="emergency-loading-overlay">
              <div className="text-center">
                <Spinner animation="border" variant="danger" size="lg" />
                <p className="mt-2 text-muted">Đang tải danh sách yêu cầu...</p>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <Table hover className="mb-0 emergency-table">
              <thead className="bg-light">
                <tr>
                  <th width="120" className="ps-4">
                    Thời gian
                  </th>
                  <th width="150">Thông tin liên hệ</th>
                  <th width="100">Loại</th>
                  <th width="120">Trạng thái</th>
                  <th width="100">Độ ưu tiên</th>
                  <th width="150">Vị trí</th>
                  <th width="200">Tin nhắn/Thông tin</th>
                  <th width="120" className="text-center">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((emergency) => {
                  const status = getStatusBadge(emergency.status);
                  const priority = getPriorityBadge(emergency.priority);
                  const type = getTypeBadge(emergency.type);

                  return (
                    <tr
                      key={emergency._id}
                      className={`fade-in ${
                        emergency.priority === "critical" ? "" : "table-danger"
                      }`}
                    >
                      <td className="ps-4">
                        <div className="small">
                          <div className="fw-medium">
                            {formatDate(emergency.createdAt)}
                          </div>
                          <div className="text-muted">
                            {formatTimeAgo(emergency.createdAt)}
                          </div>
                          {emergency.respondedAt && (
                            <div className="text-success small">
                              <CheckCircle size={12} className="me-1" />
                              Phản hồi: {formatTimeAgo(emergency.respondedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="d-flex align-items-center mb-1">
                            {emergency.user?.profile?.avatar ? (
                              <Image
                                src={emergency.user.profile.avatar}
                                alt={emergency.user.fullName}
                                className="rounded-circle me-2"
                                width="24"
                                height="24"
                              />
                            ) : (
                              <User size={16} className="me-2 text-muted" />
                            )}
                            <div>
                              <div className="fw-medium">
                                {emergency.user?.fullName || "Khách"}
                              </div>
                              {emergency.phoneNumber && (
                                <div className="small text-muted">
                                  <Phone size={12} className="me-1" />
                                  {emergency.phoneNumber}
                                </div>
                              )}
                            </div>
                          </div>
                          {getDeviceStatus(emergency)}
                        </div>
                      </td>
                      <td>
                        <Badge bg={type.variant} className="emergency-badge">
                          {type.icon}
                          <span className="ms-1">{type.label}</span>
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={status.variant} className="emergency-badge">
                          {status.icon}
                          <span className="ms-1">{status.label}</span>
                        </Badge>
                        {emergency.isSilent && (
                          <Badge bg="secondary" className="ms-1">
                            <BellOff size={12} />
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge
                          bg={priority.variant}
                          className="emergency-badge"
                        >
                          {priority.label}
                        </Badge>
                        {emergency.priority === "critical" && (
                          <div className="small text-danger mt-1">
                            <AlertTriangle size={12} className="me-1" />
                            Cần xử lý ngay
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          {emergency.latitude && emergency.longitude ? (
                            <>
                              <MapPin size={16} className="me-2 text-success" />
                              <div className="small">
                                <div
                                  className="text-truncate"
                                  style={{ maxWidth: "120px" }}
                                >
                                  {emergency.address || "Đã xác định vị trí"}
                                </div>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                  onClick={() => handleShowMap(emergency)}
                                >
                                  <small>Xem bản đồ</small>
                                </Button>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted small">
                              <MapPin size={16} className="me-1" />
                              Không có vị trí
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          {emergency.message ? (
                            <div className="emergency-message">
                              {emergency.message.length > 50
                                ? `${emergency.message.substring(0, 50)}...`
                                : emergency.message}
                            </div>
                          ) : (
                            <span className="text-muted">
                              Không có tin nhắn
                            </span>
                          )}
                          {emergency.notes && (
                            <div className="text-info small mt-1">
                              <FileText size={12} className="me-1" />
                              Ghi chú: {emergency.notes.substring(0, 30)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-1">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleShowDetail(emergency)}
                            title="Xem chi tiết"
                            className="emergency-btn-icon"
                          >
                            <Eye size={14} />
                          </Button>
                          {emergency.status === "pending" && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleShowResponse(emergency)}
                              title="Phản hồi"
                              className="emergency-btn-icon"
                            >
                              <CheckCircle size={14} />
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setSelectedEmergency(emergency);
                              setShowDeleteConfirm(true);
                            }}
                            title="Xoá yêu cầu"
                            className="emergency-btn-icon"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="mt-2 d-flex gap-1 justify-content-center">
                          {emergency.status !== "resolved" &&
                            emergency.status !== "cancelled" && (
                              <Dropdown>
                                <Dropdown.Toggle
                                  size="sm"
                                  variant="outline-secondary"
                                  className="emergency-btn-icon"
                                >
                                  <Activity size={12} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  {emergency.status === "pending" && (
                                    <>
                                      <Dropdown.Item
                                        onClick={() =>
                                          handleStatusChange(
                                            emergency._id,
                                            "responded"
                                          )
                                        }
                                      >
                                        Tiếp nhận
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        onClick={() =>
                                          handleStatusChange(
                                            emergency._id,
                                            "in_progress"
                                          )
                                        }
                                      >
                                        Bắt đầu xử lý
                                      </Dropdown.Item>
                                    </>
                                  )}
                                  {emergency.status === "responded" && (
                                    <Dropdown.Item
                                      onClick={() =>
                                        handleStatusChange(
                                          emergency._id,
                                          "in_progress"
                                        )
                                      }
                                    >
                                      Bắt đầu xử lý
                                    </Dropdown.Item>
                                  )}
                                  {emergency.status === "in_progress" && (
                                    <Dropdown.Item
                                      onClick={() =>
                                        handleStatusChange(
                                          emergency._id,
                                          "resolved"
                                        )
                                      }
                                    >
                                      Đã giải quyết
                                    </Dropdown.Item>
                                  )}
                                  <Dropdown.Divider />
                                  <Dropdown.Item
                                    onClick={() =>
                                      handleStatusChange(
                                        emergency._id,
                                        "cancelled"
                                      )
                                    }
                                    className="text-danger"
                                  >
                                    Hủy yêu cầu
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {emergencies.length === 0 && !loading && (
            <div className="text-center py-5 text-muted">
              <AlertTriangle size={48} className="mb-3 opacity-50" />
              <h5>Không tìm thấy yêu cầu nào</h5>
              <p>Thử thay đổi bộ lọc tìm kiếm để có kết quả phù hợp</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted">
            Hiển thị {emergencies.length} trong tổng số {pagination.total} yêu
            cầu
          </div>
          <Pagination>
            <Pagination.Prev
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            />
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (filters.page <= 3) {
                pageNum = i + 1;
              } else if (filters.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = filters.page - 2 + i;
              }

              return (
                <Pagination.Item
                  key={pageNum}
                  active={filters.page === pageNum}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            <Pagination.Next
              disabled={filters.page === pagination.pages}
              onClick={() => handlePageChange(filters.page + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Enhanced Emergency Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
        centered
        className="emergency-modal-enhanced"
      >
        <Modal.Header className="emergency-modal-header-enhanced" closeButton>
          <Modal.Title>
            <AlertTriangle size={24} className="me-2" />
            Chi tiết Yêu cầu Khẩn cấp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedEmergency && (
            <Row>
              <Col md={8}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div>
                        <h4 className="text-dark mb-1">
                          #{selectedEmergency._id.substring(0, 8)}
                        </h4>
                        <div className="d-flex gap-2 mb-2">
                          {getTypeBadge(selectedEmergency.type).icon}
                          <Badge
                            bg={getTypeBadge(selectedEmergency.type).variant}
                          >
                            {getTypeBadge(selectedEmergency.type).label}
                          </Badge>
                          <Badge
                            bg={
                              getStatusBadge(selectedEmergency.status).variant
                            }
                          >
                            {getStatusBadge(selectedEmergency.status).label}
                          </Badge>
                          <Badge
                            bg={
                              getPriorityBadge(selectedEmergency.priority)
                                .variant
                            }
                          >
                            {getPriorityBadge(selectedEmergency.priority).label}
                          </Badge>
                          {selectedEmergency.isSilent && (
                            <Badge bg="secondary">
                              <BellOff size={12} className="me-1" />
                              Im lặng
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted small">Tạo lúc</div>
                        <div className="fw-medium">
                          {formatDate(selectedEmergency.createdAt)}
                        </div>
                      </div>
                    </div>

                    <Row className="g-3 mb-4">
                      <Col md={6}>
                        <div className="emergency-stat-item">
                          <div className="stat-value text-primary">
                            {calculateResponseTime(selectedEmergency) ||
                              "Chưa phản hồi"}
                          </div>
                          <div className="stat-label">Thời gian phản hồi</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="emergency-stat-item">
                          <div className="stat-value text-success">
                            {selectedEmergency.respondedBy ? "Có" : "Chưa"}
                          </div>
                          <div className="stat-label">Người phản hồi</div>
                        </div>
                      </Col>
                    </Row>

                    {/* Message Section */}
                    {selectedEmergency.message && (
                      <Card className="mb-4 border-warning">
                        <Card.Header className="bg-warning bg-opacity-10">
                          <h6 className="mb-0">
                            <AlertTriangle
                              size={18}
                              className="me-2 text-warning"
                            />
                            Tin nhắn khẩn cấp
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <p className="mb-0">{selectedEmergency.message}</p>
                        </Card.Body>
                      </Card>
                    )}

                    {/* Location Section */}
                    {selectedEmergency.latitude &&
                      selectedEmergency.longitude && (
                        <Card className="mb-4">
                          <Card.Header className="bg-white">
                            <h6 className="mb-0">
                              <MapPin size={18} className="me-2 text-danger" />
                              Thông tin vị trí
                            </h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <div className="mb-3">
                                  <strong>Địa chỉ:</strong>
                                  <div className="mt-1">
                                    {selectedEmergency.address ||
                                      "Không xác định"}
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <strong>Tọa độ:</strong>
                                  <div className="mt-1">
                                    {selectedEmergency.latitude.toFixed(6)},{" "}
                                    {selectedEmergency.longitude.toFixed(6)}
                                  </div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="mb-3">
                                  <strong>Độ chính xác:</strong>
                                  <div className="mt-1">
                                    {selectedEmergency.locationAccuracy ||
                                      "Không xác định"}
                                    m
                                  </div>
                                </div>
                                <Button
                                  variant="outline-primary"
                                  onClick={() =>
                                    handleShowMap(selectedEmergency)
                                  }
                                  className="w-100"
                                >
                                  <Navigation size={16} className="me-2" />
                                  Xem trên bản đồ
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      )}

                    {/* User Information */}
                    {selectedEmergency.user && (
                      <Card>
                        <Card.Header className="bg-white">
                          <h6 className="mb-0">
                            <User size={18} className="me-2 text-primary" />
                            Thông tin người dùng
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <div className="d-flex align-items-center mb-3">
                                <Image
                                  src={
                                    selectedEmergency.user.profile?.avatar ||
                                    "/assets/images/default-avatar.png"
                                  }
                                  alt={selectedEmergency.user.fullName}
                                  className="rounded-circle me-3"
                                  width="50"
                                  height="50"
                                />
                                <div>
                                  <div className="fw-bold">
                                    {selectedEmergency.user.fullName}
                                  </div>
                                  <div className="text-muted small">
                                    {selectedEmergency.user.email}
                                  </div>
                                </div>
                              </div>
                              {selectedEmergency.phoneNumber && (
                                <div className="mb-3">
                                  <strong>Số điện thoại:</strong>
                                  <div className="mt-1">
                                    <Phone
                                      size={16}
                                      className="me-2 text-primary"
                                    />
                                    {selectedEmergency.phoneNumber}
                                  </div>
                                </div>
                              )}
                            </Col>
                            <Col md={6}>
                              {selectedEmergency.user.isOnline !==
                                undefined && (
                                <div className="mb-3">
                                  <strong>Trạng thái:</strong>
                                  <div className="mt-1">
                                    <Badge
                                      bg={
                                        selectedEmergency.user.isOnline
                                          ? "success"
                                          : "secondary"
                                      }
                                    >
                                      {selectedEmergency.user.isOnline
                                        ? "Online"
                                        : "Offline"}
                                    </Badge>
                                    {selectedEmergency.user.lastSeen && (
                                      <div className="small text-muted mt-1">
                                        Lần cuối online:{" "}
                                        {formatTimeAgo(
                                          selectedEmergency.user.lastSeen
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {selectedEmergency.deviceInfo && (
                                <div className="mb-3">
                                  <strong>Thông tin thiết bị:</strong>
                                  <div className="mt-2">
                                    {getDeviceStatus(selectedEmergency)}
                                  </div>
                                </div>
                              )}
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                {/* Timeline/Activity Log */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">
                      <Clock size={18} className="me-2 text-primary" />
                      Nhật ký hoạt động
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-medium">Yêu cầu được tạo</div>
                          <small className="text-muted">
                            {formatTimeAgo(selectedEmergency.createdAt)}
                          </small>
                        </div>
                        <Badge bg="primary">Bắt đầu</Badge>
                      </ListGroup.Item>
                      {selectedEmergency.respondedAt && (
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-medium">Đã tiếp nhận</div>
                            <small className="text-muted">
                              {formatTimeAgo(selectedEmergency.respondedAt)}
                            </small>
                          </div>
                          <Badge bg="success">Tiếp nhận</Badge>
                        </ListGroup.Item>
                      )}
                      {selectedEmergency.status === "resolved" &&
                        selectedEmergency.resolvedAt && (
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-medium">Đã giải quyết</div>
                              <small className="text-muted">
                                {formatTimeAgo(selectedEmergency.resolvedAt)}
                              </small>
                            </div>
                            <Badge bg="success">Hoàn thành</Badge>
                          </ListGroup.Item>
                        )}
                      {selectedEmergency.updatedAt !==
                        selectedEmergency.createdAt && (
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-medium">Cập nhật cuối</div>
                            <small className="text-muted">
                              {formatTimeAgo(selectedEmergency.updatedAt)}
                            </small>
                          </div>
                          <Badge bg="info">Cập nhật</Badge>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>

                {/* Response Information */}
                {selectedEmergency.respondedBy && (
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-white">
                      <h6 className="mb-0">
                        <Users size={18} className="me-2 text-success" />
                        Thông tin phản hồi
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Người phản hồi:</strong>
                        <div className="mt-1 fw-medium">
                          {selectedEmergency.respondedBy.name}
                        </div>
                        <small className="text-muted">
                          {selectedEmergency.respondedBy.role}
                        </small>
                      </div>
                      {selectedEmergency.responseNotes && (
                        <div className="mb-3">
                          <strong>Ghi chú:</strong>
                          <div className="mt-1 p-2 bg-light rounded">
                            {selectedEmergency.responseNotes}
                          </div>
                        </div>
                      )}
                      {selectedEmergency.estimatedResponseTime && (
                        <div>
                          <strong>Thời gian ước tính:</strong>
                          <div className="mt-1">
                            {selectedEmergency.estimatedResponseTime}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">Hành động nhanh</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      {selectedEmergency.status === "pending" && (
                        <>
                          <Button
                            variant="success"
                            onClick={() =>
                              handleStatusChange(
                                selectedEmergency._id,
                                "responded"
                              )
                            }
                          >
                            <CheckCircle size={16} className="me-2" />
                            Tiếp nhận yêu cầu
                          </Button>
                          <Button
                            variant="warning"
                            onClick={() =>
                              handleShowResponse(selectedEmergency)
                            }
                          >
                            <Users size={16} className="me-2" />
                            Chỉ định đội phản hồi
                          </Button>
                          <Button
                            variant="success"
                            onClick={() =>
                              handleStatusChange(
                                selectedEmergency._id,
                                "resolved"
                              )
                            }
                          >
                            <CheckCircle size={16} className="me-2" />
                            Đánh dấu đã giải quyết
                          </Button>
                        </>
                      )}
                      {selectedEmergency.status === "in_progress" && (
                        <>
                          <Button
                            variant="success"
                            onClick={() =>
                              handleStatusChange(
                                selectedEmergency._id,
                                "resolved"
                              )
                            }
                          >
                            <CheckCircle size={16} className="me-2" />
                            Đánh dấu đã giải quyết
                          </Button>
                        </>
                      )}
                      {selectedEmergency.status === "responded" && (
                        <>
                          <Button
                            variant="success"
                            onClick={() =>
                              handleStatusChange(
                                selectedEmergency._id,
                                "resolved"
                              )
                            }
                          >
                            <CheckCircle size={16} className="me-2" />
                            Đánh dấu đã giải quyết
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() =>
                              handleStatusChange(
                                selectedEmergency._id,
                                "in_progress"
                              )
                            }
                          >
                            <Activity size={16} className="me-2" />
                            Đánh dấu đang giải quyết
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline-primary"
                        onClick={() => handleShowMap(selectedEmergency)}
                      >
                        <Navigation size={16} className="me-2" />
                        Xem vị trí trên bản đồ
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedEmergency(selectedEmergency);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 size={16} className="me-2" />
                        Xóa yêu cầu
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDetailModal(false)}
          >
            Đóng
          </Button>
          {selectedEmergency &&
            selectedEmergency.status !== "resolved" &&
            selectedEmergency.status !== "cancelled" && (
              <Button
                variant="danger"
                onClick={() => handleShowResponse(selectedEmergency)}
              >
                <Users size={16} className="me-2" />
                Phản hồi
              </Button>
            )}
        </Modal.Footer>
      </Modal>

      {/* Map Modal */}
      <Modal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        size="lg"
        centered
        className="emergency-map-modal"
        scrollable
      >
        <Modal.Header className="emergency-modal-header-enhanced">
          <Modal.Title>
            <Navigation size={24} className="me-2" />
            Vị trí Khẩn cấp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderMap()}</Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setShowMapModal(false)}
          >
            Đóng
          </Button>
          {selectedLocation && (
            <Button
              variant="primary"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`,
                  "_blank"
                );
              }}
            >
              <ExternalLink size={16} className="me-2" />
              Mở Google Maps
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Response Modal */}
      <Modal
        show={showResponseModal}
        onHide={() => setShowResponseModal(false)}
        centered
        className="emergency-modal-enhanced"
      >
        <Modal.Header className="emergency-modal-header-enhanced">
          <Modal.Title>
            <Users size={24} className="me-2" />
            Phản hồi Yêu cầu
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmergency && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Chọn người/đội phản hồi</Form.Label>
                <Form.Select
                  value={responseForm.responderId}
                  onChange={(e) =>
                    setResponseForm((prev) => ({
                      ...prev,
                      responderId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Chọn người phản hồi...</option>
                  {responders.map((responder) => (
                    <option key={responder._id} value={responder._id}>
                      {responder.fullName} ({responder.role})
                      {responder.isOnline && " - Online"}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Độ ưu tiên</Form.Label>
                <Form.Select
                  value={responseForm.priority}
                  onChange={(e) =>
                    setResponseForm((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                >
                  <option value="critical">Khẩn cấp</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Thời gian ước tính phản hồi</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="VD: 15 phút"
                    value={responseForm.estimatedTime}
                    onChange={(e) =>
                      setResponseForm((prev) => ({
                        ...prev,
                        estimatedTime: e.target.value,
                      }))
                    }
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Nhập ghi chú về tình huống..."
                  value={responseForm.notes}
                  onChange={(e) =>
                    setResponseForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Chỉ định đội (tùy chọn)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="VD: Đội cứu hộ 1, Đội y tế khẩn cấp..."
                  value={responseForm.assignedTeam}
                  onChange={(e) =>
                    setResponseForm((prev) => ({
                      ...prev,
                      assignedTeam: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setShowResponseModal(false)}
            disabled={responseLoading}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmitResponse}
            disabled={responseLoading || !responseForm.responderId}
          >
            {responseLoading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Đang gửi...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="me-2" />
                Gửi phản hồi
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Stats Modal */}
      <Modal
        show={showStatsModal}
        onHide={() => setShowStatsModal(false)}
        size="xl"
        centered
        className="emergency-modal-enhanced"
      >
        <Modal.Header className="emergency-modal-header-enhanced">
          <Modal.Title>
            <BarChart3 size={24} className="me-2" />
            Thống kê Hệ thống Khẩn cấp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Phân bố theo loại</h6>
                </Card.Header>
                <Card.Body>
                  {stats.typeDistribution &&
                  stats.typeDistribution.length > 0 ? (
                    <div>
                      {stats.typeDistribution.map((item) => {
                        const type = getTypeBadge(item._id);
                        return (
                          <div key={item._id} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="d-flex align-items-center gap-2">
                                {type.icon}
                                {type.label}
                              </span>
                              <span className="fw-semibold">{item.count}</span>
                            </div>
                            <ProgressBar
                              variant={type.variant}
                              now={(item.count / stats.totalEmergencies) * 100}
                            />
                            <div className="small text-muted text-end">
                              {Math.round(
                                (item.count / stats.totalEmergencies) * 100
                              )}
                              %
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Không có dữ liệu</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Phân bố theo trạng thái</h6>
                </Card.Header>
                <Card.Body>
                  {stats.statusDistribution &&
                  stats.statusDistribution.length > 0 ? (
                    <div>
                      {stats.statusDistribution.map((item) => {
                        const status = getStatusBadge(item._id);
                        return (
                          <div key={item._id} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="d-flex align-items-center gap-2">
                                {status.icon}
                                {status.label}
                              </span>
                              <span className="fw-semibold">{item.count}</span>
                            </div>
                            <ProgressBar
                              variant={status.variant}
                              now={(item.count / stats.totalEmergencies) * 100}
                            />
                            <div className="small text-muted text-end">
                              {Math.round(
                                (item.count / stats.totalEmergencies) * 100
                              )}
                              %
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Không có dữ liệu</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Thông số hiệu suất</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="text-center">
                      <div className="emergency-stat-value text-primary">
                        {stats.avgResponseTime || "0"} phút
                      </div>
                      <div className="emergency-stat-label">
                        TB thời gian phản hồi
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="emergency-stat-value text-success">
                        {stats.resolutionRate || "0"}%
                      </div>
                      <div className="emergency-stat-label">
                        Tỷ lệ giải quyết
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="emergency-stat-value text-info">
                        {stats.todayEmergencies || 0}
                      </div>
                      <div className="emergency-stat-label">Hôm nay</div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="emergency-stat-value text-warning">
                        {stats.criticalRate || "0"}%
                      </div>
                      <div className="emergency-stat-label">Tỷ lệ khẩn cấp</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Advanced Stats */}
          {advancedStats && (
            <Row className="mt-4">
              <Col md={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">Phân tích nâng cao</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <div className="text-center p-3">
                          <div className="fs-2 text-primary mb-1">
                            {advancedStats.peakHour || "N/A"}
                          </div>
                          <div className="small text-muted">Giờ cao điểm</div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center p-3">
                          <div className="fs-2 text-success mb-1">
                            {advancedStats.mostActiveUser?.emergencyCount || 0}
                          </div>
                          <div className="small text-muted">
                            Người dùng tích cực nhất
                            {advancedStats.mostActiveUser && (
                              <div className="fw-medium mt-1">
                                {advancedStats.mostActiveUser.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center p-3">
                          <div className="fs-2 text-info mb-1">
                            {advancedStats.avgResolutionTime || 0}p
                          </div>
                          <div className="small text-muted">
                            TB thời gian giải quyết
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="primary" onClick={() => setShowStatsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        centered
        className="emergency-modal-enhanced"
      >
        <Modal.Header className="emergency-modal-header-enhanced">
          <Modal.Title>
            <Download size={24} className="me-2" />
            Xuất dữ liệu
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <Download size={48} className="text-primary mb-3" />
            <h5>Chọn định dạng xuất dữ liệu</h5>
            <p className="text-muted">
              Dữ liệu sẽ được xuất dựa trên bộ lọc hiện tại
            </p>
          </div>
          <Row className="g-3">
            <Col md={6}>
              <Button
                variant="outline-primary"
                className="w-100 py-3"
                onClick={() => handleExportData("csv")}
              >
                <FileText size={24} className="mb-2" />
                <div>CSV</div>
                <small className="text-muted">Excel, Google Sheets</small>
              </Button>
            </Col>
            <Col md={6}>
              <Button
                variant="outline-success"
                className="w-100 py-3"
                onClick={() => handleExportData("json")}
              >
                <FileText size={24} className="mb-2" />
                <div>JSON</div>
                <small className="text-muted">Xử lý dữ liệu</small>
              </Button>
            </Col>
            {/* <Col md={6}>
              <Button
                variant="outline-info"
                className="w-100 py-3"
                onClick={() => handleExportData("pdf")}
              >
                <FileText size={24} className="mb-2" />
                <div>PDF</div>
                <small className="text-muted">Báo cáo in ấn</small>
              </Button>
            </Col>
            <Col md={6}>
              <Button
                variant="outline-warning"
                className="w-100 py-3"
                onClick={() => handleExportData("xlsx")}
              >
                <FileText size={24} className="mb-2" />
                <div>Excel</div>
                <small className="text-muted">Định dạng Excel đầy đủ</small>
              </Button>
            </Col> */}
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setShowExportModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleExportData("csv");
              setShowExportModal(false);
            }}
          >
            <Download size={16} className="me-2" />
            Xuất CSV
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        className="emergency-modal-enhanced"
      >
        <Modal.Header className="emergency-modal-header-enhanced">
          <Modal.Title>
            <Trash2 size={24} className="me-2" />
            Xác nhận xoá
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="text-center mb-4">
            <AlertTriangle size={48} className="text-danger mb-3" />
            <h5>Bạn có chắc chắn muốn xoá yêu cầu khẩn cấp này?</h5>
          </div>
          <Alert variant="danger">
            <Alert.Heading>
              <AlertTriangle size={20} className="me-2" />
              Cảnh báo quan trọng
            </Alert.Heading>
            <p className="mb-0">
              Yêu cầu khẩn cấp và tất cả thông tin liên quan sẽ bị xoá vĩnh viễn
              và không thể khôi phục. Hành động này có thể ảnh hưởng đến các
              thống kê và báo cáo.
            </p>
          </Alert>
          {selectedEmergency && (
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Thông tin yêu cầu:</h6>
              <p className="mb-1">
                <strong>ID:</strong> {selectedEmergency._id}
              </p>
              <p className="mb-1">
                <strong>Thời gian:</strong>{" "}
                {formatDate(selectedEmergency.createdAt)}
              </p>
              <p className="mb-0">
                <strong>Trạng thái:</strong>{" "}
                {getStatusBadge(selectedEmergency.status).label}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Huỷ bỏ
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteEmergency(selectedEmergency._id)}
          >
            <Trash2 size={16} className="me-2" />
            Xoá yêu cầu
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="mt-3 fade-in"
        >
          <Alert.Heading>
            <AlertTriangle size={20} className="me-2" />
            Có lỗi xảy ra
          </Alert.Heading>
          {error}
        </Alert>
      )}
    </div>
  );
};

export default AdminEmergencyManagement;
