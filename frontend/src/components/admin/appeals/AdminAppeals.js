import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Table,
  Badge,
  Modal,
  Spinner,
  Alert,
  Pagination,
  InputGroup,
} from "react-bootstrap";
import {
  Eye,
  Search,
  Filter,
  XCircle,
  Clock,
  CheckCircle,
  FileEarmark,
  ArrowLeft,
  ArrowRight,
} from "react-bootstrap-icons";
import "./AdminAppeals.css";

const AdminAppeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    status: "all",
    email: "",
    reason: "all",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchAppeals();
    fetchStatistics();
  }, [filters, pagination.currentPage]);

  const fetchAppeals = async () => {
    try {
      setError("");
      // const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        status: filters.status,
        page: pagination.currentPage,
        limit: "10",
        ...(filters.email && { email: filters.email }),
        ...(filters.reason !== "all" && { reason: filters.reason }),
      });

      const response = await api.get(`/api/admin/appealsForUser/all?${params}`);
      setAppeals(response.data.appeals);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total,
      });
    } catch (error) {
      console.error("Error fetching appeals:", error);
      setError("Không thể tải danh sách kháng nghị");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/api/admin/appealsForUser/statistics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const updateAppealStatus = async (appealId, status, adminNotes = "") => {
    try {
      await api.put(`/api/admin/appealsForUser/update/${appealId}`, {
        status,
        adminNotes,
      });
      fetchAppeals();
      fetchStatistics();
    } catch (error) {
      console.error("Error updating appeal:", error);
      alert("Có lỗi khi cập nhật trạng thái");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setShowModal(true);
  };

  const getStatusVariant = (status) => {
    const variantMap = {
      pending: "warning",
      reviewing: "info",
      resolved: "success",
      rejected: "danger",
    };
    return variantMap[status] || "secondary";
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Đang chờ",
      reviewing: "Đang xem xét",
      resolved: "Đã giải quyết",
      rejected: "Đã từ chối",
    };
    return statusMap[status] || status;
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      email: "",
      reason: "all",
    });
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container py-4"
      style={{ backgroundColor: "#f8f9fa", minHeighteight: "100vh" }}
    >
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Quản lý Kháng nghị</h1>
          <p className="text-muted mb-0">
            Theo dõi và xử lý các yêu cầu kháng nghị từ người dùng
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Statistics */}
      <Row className="mb-4">
        <Col>
          <h5 className="mb-3">Tổng quan</h5>
          <Row className="d-flex justify-content-center align-items-center">
            {/* <Col xl={2} lg={4} md={6} className="mb-3">
              <Card className="stat-card border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="stat-icon text-primary mb-2">
                    <Filter size={24} />
                  </div>
                  <h3 className="stat-number">{statistics.total || 0}</h3>
                  <p className="stat-label text-muted mb-0">Tổng số</p>
                </Card.Body>
              </Card>
            </Col> */}
            <Col xl={3} lg={4} md={6} className="mb-3">
              <Card className="stat-card border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="stat-icon text-warning mb-2">
                    <Clock size={24} />
                  </div>
                  <h3 className="stat-number">{statistics.pending || 0}</h3>
                  <p className="stat-label text-muted mb-0">Đang chờ</p>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={4} md={6} className="mb-3">
              <Card className="stat-card border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="stat-icon text-info mb-2">
                    <Eye size={24} />
                  </div>
                  <h3 className="stat-number">{statistics.reviewing || 0}</h3>
                  <p className="stat-label text-muted mb-0"> Xem xét</p>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={4} md={6} className="mb-3">
              <Card className="stat-card border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="stat-icon text-success mb-2">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="stat-number">{statistics.resolved || 0}</h3>
                  <p className="stat-label text-muted mb-0">Giải quyết</p>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={4} md={6} className="mb-3">
              <Card className="stat-card border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="stat-icon text-danger mb-2">
                    <XCircle size={24} />
                  </div>
                  <h3 className="stat-number">{statistics.rejected || 0}</h3>
                  <p className="stat-label text-muted mb-0">Từ chối</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Bộ lọc</h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={clearFilters}
            >
              <XCircle size={16} className="me-1" />
              Xóa bộ lọc
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col lg={4} md={6} className="mb-3">
              <Form.Label>Email người dùng</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Nhập email..."
                  value={filters.email}
                  onChange={(e) => handleFilterChange("email", e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col lg={4} md={6} className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="reviewing">Đang xem xét</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="rejected">Đã từ chối</option>
              </Form.Select>
            </Col>
            <Col lg={4} md={6} className="mb-3">
              <Form.Label>Lý do</Form.Label>
              <Form.Select
                value={filters.reason}
                onChange={(e) => handleFilterChange("reason", e.target.value)}
              >
                <option value="all">Tất cả lý do</option>
                <option value="Bị khoá tài khoản">Bị khoá tài khoản</option>
                <option value="Nội dung bị xoá">Nội dung bị xoá</option>
                <option value="Bị report sai">Bị report sai</option>
                <option value="Lỗi hệ thống">Lỗi hệ thống</option>
                <option value="Khác">Khác</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Appeals Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Danh sách kháng nghị</h5>
            <div className="text-muted">
              Hiển thị {appeals.length} trên tổng số {pagination.total} kết quả
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {appeals.length === 0 ? (
            <div className="text-center py-5">
              <Filter size={48} className="text-muted mb-3" />
              <h5>Không có kháng nghị nào</h5>
              <p className="text-muted">
                Không tìm thấy kháng nghị nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Mã kháng nghị</th>
                    <th>Email</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Ngày gửi</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((appeal) => (
                    <AppealRow
                      key={appeal._id}
                      appeal={appeal}
                      onUpdate={updateAppealStatus}
                      onViewDetails={handleViewDetails}
                      getStatusVariant={getStatusVariant}
                      getStatusText={getStatusText}
                    />
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card.Footer className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  <ArrowLeft size={16} />
                </Pagination.Prev>

                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.currentPage - 1 &&
                      page <= pagination.currentPage + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={page}
                        active={page === pagination.currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Pagination.Item>
                    );
                  } else if (
                    page === pagination.currentPage - 2 ||
                    page === pagination.currentPage + 2
                  ) {
                    return <Pagination.Ellipsis key={page} />;
                  }
                  return null;
                })}

                <Pagination.Next
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  <ArrowRight size={16} />
                </Pagination.Next>
              </Pagination>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Appeal Detail Modal */}
      <AppealModal
        show={showModal}
        onHide={() => setShowModal(false)}
        appeal={selectedAppeal}
        onUpdate={updateAppealStatus}
        getStatusVariant={getStatusVariant}
        getStatusText={getStatusText}
      />
    </div>
  );
};

// Component cho mỗi hàng trong bảng
const AppealRow = ({
  appeal,
  onUpdate,
  onViewDetails,
  getStatusVariant,
  getStatusText,
}) => {
  const [adminNotes, setAdminNotes] = useState(appeal.adminNotes || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = (newStatus) => {
    onUpdate(appeal._id, newStatus, adminNotes);
  };

  const handleNotesSave = () => {
    onUpdate(appeal._id, appeal.status, adminNotes);
    setIsEditing(false);
  };

  return (
    <tr>
      <td>
        <strong>#{appeal._id.slice(-6)}</strong>
      </td>
      <td>{appeal.email}</td>
      <td>{appeal.reason}</td>
      <td>
        <Badge bg={getStatusVariant(appeal.status)}>
          {getStatusText(appeal.status)}
        </Badge>
      </td>
      <td>{new Date(appeal.createdAt).toLocaleString("vi-VN")}</td>
      <td>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onViewDetails(appeal)}
          >
            <Eye size={16} />
          </Button>
          <Form.Select
            size="sm"
            style={{ width: "auto" }}
            value={appeal.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="pending">Đang chờ</option>
            <option value="reviewing">Đang xem xét</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="rejected">Đã từ chối</option>
          </Form.Select>
        </div>
      </td>
    </tr>
  );
};

// Modal xem chi tiết appeal
const AppealModal = ({
  show,
  onHide,
  appeal,
  onUpdate,
  getStatusVariant,
  getStatusText,
}) => {
  const [adminNotes, setAdminNotes] = useState(appeal?.adminNotes || "");
  const [isEditing, setIsEditing] = useState(false);

  if (!appeal) return null;

  const handleStatusChange = (newStatus) => {
    onUpdate(appeal._id, newStatus, adminNotes);
  };

  const handleNotesSave = () => {
    onUpdate(appeal._id, appeal.status, adminNotes);
    setIsEditing(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết kháng nghị</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-3">
          <Col md={6}>
            <strong>Mã kháng nghị:</strong>
            <div>#{appeal._id.slice(-6)}</div>
          </Col>
          <Col md={6}>
            <strong>Trạng thái:</strong>
            <div>
              <Badge bg={getStatusVariant(appeal.status)}>
                {getStatusText(appeal.status)}
              </Badge>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <strong>Email người dùng:</strong>
            <div>{appeal.email}</div>
          </Col>
          <Col md={6}>
            <strong>Lý do:</strong>
            <div>{appeal.reason}</div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <strong>Ngày gửi:</strong>
            <div>{new Date(appeal.createdAt).toLocaleString("vi-VN")}</div>
          </Col>
        </Row>

        <div className="mb-3">
          <strong>Nội dung kháng nghị:</strong>
          <Card className="mt-2">
            <Card.Body>
              <p className="mb-0">{appeal.message}</p>
            </Card.Body>
          </Card>
        </div>

        {appeal.files && appeal.files.length > 0 && (
          <div className="mb-3">
            <strong>Tài liệu đính kèm:</strong>
            <div className="mt-2">
              {appeal.files.map((file, index) => (
                <Card key={index} className="mb-2">
                  <Card.Body className="py-2">
                    <div className="d-flex align-items-center">
                      <FileEarmark className="text-primary me-2" />
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        {file.fileName}
                      </a>
                      <small className="text-muted ms-2">
                        ({(file.fileSize / 1024).toFixed(1)} KB)
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Cập nhật trạng thái:</strong>
              </Form.Label>
              <Form.Select
                value={appeal.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="pending">Đang chờ</option>
                <option value="reviewing">Đang xem xét</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="rejected">Đã từ chối</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>
            <strong>Ghi chú của quản trị viên:</strong>
          </Form.Label>
          {isEditing ? (
            <div>
              <Form.Control
                as="textarea"
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Nhập ghi chú cho người dùng..."
              />
              <div className="d-flex gap-2 mt-2">
                <Button variant="success" size="sm" onClick={handleNotesSave}>
                  Lưu ghi chú
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Card>
                <Card.Body>
                  <p className="mb-2">{adminNotes || "Chưa có ghi chú nào"}</p>
                </Card.Body>
              </Card>
              <Button
                variant="outline-primary"
                size="sm"
                className="mt-2"
                onClick={() => setIsEditing(true)}
              >
                {adminNotes ? "Chỉnh sửa" : "Thêm ghi chú"}
              </Button>
            </div>
          )}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminAppeals;
