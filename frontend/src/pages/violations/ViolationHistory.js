// pages/ViolationHistory.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Pagination,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Alert,
  Dropdown,
} from "react-bootstrap";
import { violationService } from "../../services/violationService";
import ViolationDetailsModal from "../../components/violation/ViolationDetailsModal";
import AppealModal from "../../components/violation/AppealModal";
import ViolationStats from "../../components/violation/ViolationStats";

const ViolationHistory = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    targetType: "all",
    actionTaken: "all",
    appealStatus: "all",
    search: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [error, setError] = useState("");

  // Load dữ liệu
  useEffect(() => {
    loadViolations();
    loadStats();
  }, [filters]);

  const loadViolations = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await violationService.getViolations(filters);
      setViolations(response.data.docs);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        total: response.data.totalDocs,
        hasPrev: response.data.hasPrevPage,
        hasNext: response.data.hasNextPage,
      });
    } catch (error) {
      setError("Không thể tải danh sách vi phạm. Vui lòng thử lại.");
      console.error("Load violations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await violationService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Load stats error:", error);
    }
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

  const handleViewDetails = (violation) => {
    setSelectedViolation(violation);
    setShowDetailsModal(true);
  };

  const handleAppeal = (violation) => {
    setSelectedViolation(violation);
    setShowAppealModal(true);
  };

  const handleAppealSuccess = () => {
    setShowAppealModal(false);
    loadViolations();
    loadStats();
  };

  const getActionTakenVariant = (action) => {
    const map = {
      none: "secondary",
      warning: "warning",
      auto_warned: "light",
      block_post: "info",
      block_comment: "primary",
      ban_user: "danger",
      auto_blocked: "dark",
      auto_baned: "dark",
    };
    return map[action] || "secondary";
  };

  const getActionTakenText = (action) => {
    const actions = {
      none: "Không xử lý",
      warning: "Cảnh báo",
      block_post: "Chặn bài",
      block_comment: "Chặn bình luận",
      ban_user: "Cấm tài khoản",
      auto_blocked: "Tự động chặn",
      auto_warned: "Tự động cảnh báo",
      auto_baned: "Tự động cấm",
    };
    return actions[action] || action;
  };

  const getAppealStatusBadge = (appeal) => {
    if (!appeal?.isAppealed) {
      return <Badge bg="secondary">Chưa kháng cáo</Badge>;
    }
    const variants = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      cancelled: "secondary",
    };
    return (
      <Badge bg={variants[appeal.appealStatus] || "secondary"}>
        {appeal.appealStatus === "pending" && "Đang xử lý"}
        {appeal.appealStatus === "approved" && "Được chấp nhận"}
        {appeal.appealStatus === "rejected" && "Bị từ chối"}
        {appeal.appealStatus === "cancelled" && "Đã hủy"}
      </Badge>
    );
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h3 className="mb-0 fw-bold text-dark">
            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
            Lịch Sử Vi Phạm
          </h3>
        </Col>
        <Col xs="auto">
          <small className="text-muted">
            Cập nhật: {new Date().toLocaleString("vi-VN")}
          </small>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          <i className="fas fa-times-circle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Thống kê */}
      {stats && (
        <div className="mb-4">
          <ViolationStats stats={stats} />
        </div>
      )}

      {/* Bộ lọc nâng cao */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col lg={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Tìm theo lý do, nội dung..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col lg={2}>
              <Form.Select
                value={filters.targetType}
                onChange={(e) =>
                  handleFilterChange("targetType", e.target.value)
                }
              >
                <option value="all">Tất cả loại</option>
                <option value="Post">Bài viết</option>
                <option value="Comment">Bình luận</option>
                <option value="User">Người dùng</option>
                <option value="Message">Tin nhắn</option>
                <option value="Group">Nhóm</option>
              </Form.Select>
            </Col>

            <Col lg={3}>
              <Form.Select
                value={filters.actionTaken}
                onChange={(e) =>
                  handleFilterChange("actionTaken", e.target.value)
                }
              >
                <option value="all">Tất cả hành động</option>
                <option value="none">Không xử lý</option>
                <option value="warning">Cảnh báo</option>
                <option value="block_post">Chặn bài</option>
                <option value="block_comment">Chặn bình luận</option>
                <option value="ban_user">Cấm tài khoản</option>
              </Form.Select>
            </Col>

            <Col lg={3}>
              <Form.Select
                value={filters.appealStatus}
                onChange={(e) =>
                  handleFilterChange("appealStatus", e.target.value)
                }
              >
                <option value="all">Tất cả kháng cáo</option>
                <option value="none">Chưa kháng cáo</option>
                <option value="pending">Đang xử lý</option>
                <option value="approved">Chấp nhận</option>
                <option value="rejected">Từ chối</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bảng vi phạm */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light text-secondary small text-uppercase">
                    <tr>
                      <th className="ps-4">Loại</th>
                      <th>Lý do vi phạm</th>
                      <th className="text-center">Hành động</th>
                      <th className="text-center">Kháng cáo</th>
                      <th>Thời gian</th>
                      <th className="text-end pe-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          <i className="fas fa-inbox fa-2x mb-3 d-block"></i>
                          Không có vi phạm nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      violations.map((violation) => (
                        <tr key={violation._id} className="border-start-0">
                          <td className="ps-4">
                            <Badge bg="light" text="dark" className="fw-medium">
                              {violation.targetType}
                            </Badge>
                          </td>
                          <td>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>{violation.reason}</Tooltip>}
                            >
                              <div
                                className="text-truncate"
                                style={{ maxWidth: "280px" }}
                              >
                                {violation.reason}
                              </div>
                            </OverlayTrigger>
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={getActionTakenVariant(violation.actionTaken)}
                            >
                              {getActionTakenText(violation.actionTaken)}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {getAppealStatusBadge(violation.appeal)}
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(violation.createdAt)}
                            </small>
                          </td>
                          <td className="text-end pe-4">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleViewDetails(violation)}
                              title="Chi tiết"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            {/* {!violation.appeal?.isAppealed &&
                              violation.status === "approved" && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleAppeal(violation)}
                                  title="Kháng cáo"
                                >
                                  <i className="fas fa-gavel"></i>
                                </Button>
                              )} */}
                            {!violation.appeal?.isAppealed &&
                              (violation.status === "approved" ||
                                violation.status === "auto") && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleAppeal(violation)}
                                  title="Kháng cáo"
                                >
                                  <i className="fas fa-gavel"></i>
                                </Button>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Phân trang */}
              {pagination.totalPages > 1 && (
                <div className="border-top px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="text-muted small">
                    Hiển thị{" "}
                    <strong>
                      {(filters.page - 1) * filters.limit + 1} -{" "}
                      {Math.min(filters.page * filters.limit, pagination.total)}
                    </strong>{" "}
                    trong <strong>{pagination.total}</strong> vi phạm
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.Prev
                      disabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(filters.page - 1)}
                    />
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === filters.page}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(filters.page + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal chi tiết */}
      <ViolationDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        violation={selectedViolation}
      />

      {/* Modal kháng cáo */}
      <AppealModal
        show={showAppealModal}
        onHide={() => setShowAppealModal(false)}
        violation={selectedViolation}
        onSuccess={handleAppealSuccess}
      />
    </Container>
  );
};

export default ViolationHistory;
