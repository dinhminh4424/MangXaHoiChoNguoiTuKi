import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  Search,
  Envelope,
  Clock,
  CheckCircle,
  ExclamationTriangle,
  XCircle,
  InfoCircle,
  FileText,
  ArrowRight,
  Send,
  Person,
} from "react-bootstrap-icons";
import api from "../../services/api";
import notificationService from "../../services/notificationService";
import "./CheckStatus.css";

const CheckStatus = () => {
  const [email, setEmail] = useState("");
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleCheckStatus = async (e) => {
    e.preventDefault();

    if (!email) {
      notificationService.warning({
        title: "Thiếu thông tin",
        text: "Vui lòng nhập email để kiểm tra trạng thái",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notificationService.warning({
        title: "Email không hợp lệ",
        text: "Vui lòng nhập địa chỉ email hợp lệ",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await api.get(
        `/api/appeals/status?email=${encodeURIComponent(email)}`
      );

      setAppeals(response.data.appeals);

      if (response.data.appeals.length === 0) {
        notificationService.info({
          title: "Không tìm thấy",
          text: "Không tìm thấy kháng nghị nào cho email này",
        });
      }
    } catch (error) {
      notificationService.error({
        title: "Lỗi",
        text:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi kiểm tra trạng thái",
      });
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        variant: "warning",
        icon: Clock,
        text: "Đang chờ xử lý",
        description: "Kháng nghị đã được tiếp nhận và đang chờ xử lý",
      },
      reviewing: {
        variant: "info",
        icon: ExclamationTriangle,
        text: "Đang xem xét",
        description: "Kháng nghị đang được đội ngũ xem xét chi tiết",
      },
      resolved: {
        variant: "success",
        icon: CheckCircle,
        text: "Đã giải quyết",
        description: "Kháng nghị đã được giải quyết thành công",
      },
      rejected: {
        variant: "danger",
        icon: XCircle,
        text: "Đã từ chối",
        description: "Kháng nghị không được chấp nhận",
      },
    };

    const config = statusConfig[status] || {
      variant: "secondary",
      icon: InfoCircle,
      text: status,
      description: "Trạng thái không xác định",
    };
    const IconComponent = config.icon;

    return (
      <div className="status-check-badge-container">
        <Badge bg={config.variant} className="status-check-badge">
          <IconComponent size={16} className="me-2" />
          {config.text}
        </Badge>
        <small className="status-check-badge-description">
          {config.description}
        </small>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={20} className="text-warning" />,
      reviewing: <ExclamationTriangle size={20} className="text-info" />,
      resolved: <CheckCircle size={20} className="text-success" />,
      rejected: <XCircle size={20} className="text-danger" />,
    };
    return icons[status] || <InfoCircle size={20} className="text-secondary" />;
  };

  return (
    <Container className="status-check-container">
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          {/* Header Section */}
          <div className="status-check-hero text-center mb-5">
            <div className="status-check-hero-icon">
              <Search size={80} className="text-primary" />
            </div>
            <h1 className="status-check-title">
              Theo Dõi Trạng Thái Kháng Nghị
            </h1>
            <p className="status-check-subtitle">
              Kiểm tra tiến độ xử lý kháng nghị của bạn một cách dễ dàng và
              nhanh chóng
            </p>
          </div>

          {/* Search Section */}
          <Card className="status-check-search-card shadow-lg">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <Envelope size={32} className="text-primary mb-3" />
                <h3 className="status-check-search-title">
                  Nhập Email Để Kiểm Tra
                </h3>
                <p className="status-check-search-subtitle text-muted">
                  Vui lòng nhập địa chỉ email bạn đã sử dụng khi gửi kháng nghị
                </p>
              </div>

              <Form onSubmit={handleCheckStatus}>
                <Row className="g-3 align-items-end">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label className="status-check-form-label">
                        <Envelope className="me-2" />
                        Địa chỉ email *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vidu@email.com"
                        required
                        className="status-check-form-input"
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="status-check-search-btn w-100"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Đang tìm kiếm...
                        </>
                      ) : (
                        <>
                          <Search className="me-2" />
                          Kiểm tra ngay
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>

              {/* Quick Actions */}
              <div className="status-check-quick-actions mt-4 pt-3 border-top">
                <Row className="g-2">
                  <Col>
                    <Button
                      variant="outline-primary"
                      href="/AppealForm"
                      className="w-100 status-check-action-btn"
                    >
                      <Send className="me-2" />
                      Gửi kháng nghị mới
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      variant="outline-success"
                      href="/login"
                      className="w-100 status-check-action-btn"
                    >
                      <Person className="me-2" />
                      Đăng nhập hệ thống
                    </Button>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>

          {/* Results Section */}
          {searched && (
            <div className="status-check-results-section mt-5">
              {loading ? (
                <Card className="status-check-loading-card text-center py-5">
                  <Card.Body>
                    <Spinner
                      animation="border"
                      variant="primary"
                      size="lg"
                      className="mb-3"
                    />
                    <h5 className="text-muted">Đang tìm kiếm kháng nghị...</h5>
                    <p className="text-muted mb-0">
                      Vui lòng chờ trong giây lát
                    </p>
                  </Card.Body>
                </Card>
              ) : appeals.length > 0 ? (
                <Card className="status-check-results-card shadow">
                  <Card.Header className="status-check-results-header">
                    <div className="d-flex align-items-center">
                      <FileText size={24} className="me-3 text-primary" />
                      <div>
                        <h4 className="mb-1">Kết Quả Tìm Kiếm</h4>
                        <p className="mb-0 text-muted">
                          Tìm thấy {appeals.length} kháng nghị cho email:{" "}
                          <strong>{email}</strong>
                        </p>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="status-check-appeals-list">
                      {appeals.map((appeal, index) => (
                        <div
                          key={appeal._id}
                          className={`status-check-appeal-item ${
                            index !== appeals.length - 1 ? "border-bottom" : ""
                          }`}
                        >
                          <div className="status-check-appeal-content p-4">
                            {/* Appeal Header */}
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="status-check-appeal-main">
                                <div className="d-flex align-items-center mb-2">
                                  {getStatusIcon(appeal.status)}
                                  <h5 className="status-check-appeal-reason mb-0 ms-3">
                                    {appeal.reason}
                                  </h5>
                                </div>
                                <small className="text-muted">
                                  Mã kháng nghị: #
                                  {appeal._id.slice(-8).toUpperCase()}
                                </small>
                              </div>
                              {getStatusBadge(appeal.status)}
                            </div>

                            {/* Appeal Details */}
                            <Row className="g-3 mb-3">
                              <Col md={6}>
                                <div className="status-check-detail-item">
                                  <strong>
                                    <Clock
                                      size={14}
                                      className="me-2 text-muted"
                                    />
                                    Ngày gửi:
                                  </strong>
                                  <span>{formatDate(appeal.createdAt)}</span>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="status-check-detail-item">
                                  <strong>
                                    <Clock
                                      size={14}
                                      className="me-2 text-muted"
                                    />
                                    Cập nhật cuối:
                                  </strong>
                                  <span>{formatDate(appeal.updatedAt)}</span>
                                </div>
                              </Col>
                            </Row>

                            {/* Appeal Message */}
                            <div className="status-check-message-container">
                              <strong className="status-check-message-label">
                                Nội dung kháng nghị:
                              </strong>
                              <div className="status-check-message-content">
                                {appeal.message}
                              </div>
                            </div>

                            {/* Admin Notes */}
                            {appeal.adminNotes && (
                              <Alert
                                variant="info"
                                className="status-check-admin-notes mt-3"
                              >
                                <Alert.Heading className="status-check-admin-notes-title">
                                  <InfoCircle className="me-2" />
                                  Phản hồi từ quản trị viên
                                </Alert.Heading>
                                <p className="status-check-admin-notes-text mb-0">
                                  {appeal.adminNotes}
                                </p>
                                <div className="status-check-admin-notes-time mt-2">
                                  <small className="text-muted">
                                    Cập nhật: {formatDate(appeal.updatedAt)}
                                  </small>
                                </div>
                              </Alert>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="status-check-empty-card text-center py-5">
                  <Card.Body>
                    <Search size={64} className="text-muted mb-3" />
                    <h4 className="text-muted">Không tìm thấy kháng nghị</h4>
                    <p className="text-muted mb-3">
                      Không có kháng nghị nào được tìm thấy cho email:{" "}
                      <strong>{email}</strong>
                    </p>
                    <Button
                      variant="primary"
                      href="/appeal"
                      className="status-check-new-appeal-btn"
                    >
                      <Send className="me-2" />
                      Gửi kháng nghị mới
                    </Button>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}

          {/* Info Section */}
          {!searched && (
            <Card className="status-check-info-card mt-5">
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col md={4}>
                    <div className="text-center">
                      <Clock size={32} className="text-warning mb-3" />
                      <h6>Xử lý nhanh chóng</h6>
                      <p className="text-muted small mb-0">
                        Kháng nghị được xử lý trong vòng 24-48 giờ làm việc
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <CheckCircle size={32} className="text-success mb-3" />
                      <h6>Cập nhật liên tục</h6>
                      <p className="text-muted small mb-0">
                        Theo dõi trạng thái kháng nghị mọi lúc, mọi nơi
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <Envelope size={32} className="text-primary mb-3" />
                      <h6>Thông báo qua email</h6>
                      <p className="text-muted small mb-0">
                        Nhận thông báo khi có cập nhật mới về kháng nghị
                      </p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CheckStatus;
