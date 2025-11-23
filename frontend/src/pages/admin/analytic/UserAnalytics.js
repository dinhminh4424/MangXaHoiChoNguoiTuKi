// src/components/admin/analytics/UserAnalytics.js
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
  Tab,
  Nav,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Activity,
  BarChart3,
  Shield,
  Calendar,
} from "lucide-react";
import UserAnalyticsService from "../../../services/userAnalyticsService";

const UserAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("today");
  const [activeTab, setActiveTab] = useState("overview");
  const [customRange, setCustomRange] = useState({
    start: "",
    end: "",
  });
  const [useCustomRange, setUseCustomRange] = useState(false);

  useEffect(() => {
    fetchUserStats();
  }, [period]);

  const fetchUserStats = async (customStart = null, customEnd = null) => {
    try {
      setLoading(true);

      let response;
      if (useCustomRange && customStart && customEnd) {
        // Sử dụng custom date range
        response = await UserAnalyticsService.getUserStats(
          "custom",
          customStart,
          customEnd
        );
      } else {
        // Sử dụng period thông thường
        response = await UserAnalyticsService.getUserStats(period);
      }

      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRangeSubmit = (e) => {
    e.preventDefault();
    if (customRange.start && customRange.end) {
      setUseCustomRange(true);
      fetchUserStats(customRange.start, customRange.end);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setUseCustomRange(false);
    setCustomRange({ start: "", end: "" });
  };

  const resetFilters = () => {
    setPeriod("today");
    setUseCustomRange(false);
    setCustomRange({ start: "", end: "" });
    fetchUserStats();
  };

  const getRiskBadge = (riskLevel) => {
    const variants = {
      high: "danger",
      medium: "warning",
      low: "success",
    };

    const icons = {
      high: <AlertTriangle size={12} />,
      medium: <AlertTriangle size={12} />,
      low: <Shield size={12} />,
    };

    return (
      <Badge
        bg={variants[riskLevel]}
        className="d-flex align-items-center gap-1"
      >
        {icons[riskLevel]}
        {riskLevel === "high"
          ? "Cao"
          : riskLevel === "medium"
          ? "Trung bình"
          : "Thấp"}
      </Badge>
    );
  };

  const formatDateRangeDisplay = () => {
    if (useCustomRange && customRange.start && customRange.end) {
      const start = new Date(customRange.start).toLocaleDateString("vi-VN");
      const end = new Date(customRange.end).toLocaleDateString("vi-VN");
      return `${start} - ${end}`;
    }
    return null;
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu người dùng...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Lỗi khi tải dữ liệu</Alert.Heading>
          <p>{error}</p>
          <Button onClick={fetchUserStats}>Thử lại</Button>
        </Alert>
      </Container>
    );
  }

  if (!data) return null;

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h4 mb-1">Phân Tích Người Dùng</h2>
              <p className="text-muted mb-0">
                Theo dõi và phân tích hành vi người dùng hệ thống
                {formatDateRangeDisplay() && (
                  <span className="text-primary ms-2">
                    • {formatDateRangeDisplay()}
                  </span>
                )}
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              {/* Custom Date Range */}
              <Form onSubmit={handleCustomRangeSubmit} className="d-flex gap-2">
                <Form.Control
                  type="date"
                  size="sm"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                  placeholder="Từ ngày"
                  style={{ width: "140px" }}
                />
                <Form.Control
                  type="date"
                  size="sm"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  placeholder="Đến ngày"
                  style={{ width: "140px" }}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline-primary"
                  disabled={!customRange.start || !customRange.end}
                >
                  <Calendar size={14} className="me-1" />
                  Áp dụng
                </Button>
              </Form>

              <Form.Select
                style={{ width: "200px" }}
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                disabled={useCustomRange}
              >
                <option value="today">Hôm nay</option>
                <option value="week">7 ngày</option>
                <option value="month">30 ngày</option>
                <option value="year">1 năm</option>
              </Form.Select>

              {(useCustomRange || customRange.start || customRange.end) && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={resetFilters}
                  title="Reset bộ lọc"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row className="mb-4">
        <Col xl={3} lg={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted mb-2">
                    Tổng Người Dùng
                  </h6>
                  <h3 className="mb-0">
                    {data.overview?.totalUsers?.toLocaleString() || 0}
                  </h3>
                  <small className="text-muted">
                    {data.overview?.newUsers || 0} mới trong kỳ
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <Users size={24} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted mb-2">Đang Hoạt Động</h6>
                  <h3 className="mb-0">
                    {data.overview?.activeUsers?.toLocaleString() || 0}
                  </h3>
                  <small className="text-muted">
                    {data.overview?.activityRate || 0}% tỷ lệ hoạt động
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 rounded p-3">
                  <UserCheck size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted mb-2">Người Dùng Ngủ</h6>
                  <h3 className="mb-0">
                    {data.overview?.inactiveUsers?.toLocaleString() || 0}
                  </h3>
                  <small className="text-muted">Không hoạt động 30+ ngày</small>
                </div>
                <div className="bg-warning bg-opacity-10 rounded p-3">
                  <UserX size={24} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted mb-2">Nguy Cơ Cao</h6>
                  <h3 className="mb-0">
                    {data.anomalies?.summary?.totalHighRisk || 0}
                  </h3>
                  <small className="text-muted">
                    {data.anomalies?.summary?.totalSuspicious || 0} nghi vấn
                  </small>
                </div>
                <div className="bg-danger bg-opacity-10 rounded p-3">
                  <AlertTriangle size={24} className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-transparent border-0">
            <Nav variant="tabs" className="card-header-tabs">
              <Nav.Item>
                <Nav.Link eventKey="overview">Tổng Quan</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="anomalies">Phát Hiện Bất Thường</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="behavior">Hành Vi</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="leaderboards">Bảng Xếp Hạng</Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>

          <Card.Body>
            <Tab.Content>
              {/* Tab Tổng Quan */}
              <Tab.Pane eventKey="overview">
                <Row>
                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Người Dùng Cảnh Báo Gần Đây</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Người Dùng</th>
                            <th>Cảnh Báo</th>
                            <th>Vi Phạm</th>
                            <th>Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.recentWarnings) &&
                          data.recentWarnings.length > 0 ? (
                            data.recentWarnings
                              .slice(0, 10)
                              .map((user, index) => (
                                <tr key={index}>
                                  <td>
                                    <div>
                                      <strong>{user.username || "N/A"}</strong>
                                      <br />
                                      <small className="text-muted">
                                        {user.email || "Không có email"}
                                      </small>
                                    </div>
                                  </td>
                                  <td>
                                    <Badge bg="warning">
                                      {user.warningCount || 0}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg="danger">
                                      {user.violationCount || 0}
                                    </Badge>
                                  </td>
                                  <td>
                                    {getRiskBadge(user.riskLevel || "low")}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted py-3"
                              >
                                Không có người dùng cảnh báo
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Xu Hướng Hoạt Động</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Ngày</th>
                            <th>Người Dùng Hoạt Động</th>
                            <th>Thay Đổi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.trends) &&
                          data.trends.length > 0 ? (
                            data.trends.slice(-7).map((trend, index) => (
                              <tr key={index}>
                                <td>
                                  {new Date(trend.date).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </td>
                                <td>
                                  <strong>{trend.activeUsers || 0}</strong>
                                </td>
                                <td>
                                  {index > 0 && (
                                    <Badge
                                      bg={
                                        trend.activeUsers >
                                        data.trends[index - 1].activeUsers
                                          ? "success"
                                          : "danger"
                                      }
                                    >
                                      {trend.activeUsers >
                                      data.trends[index - 1].activeUsers
                                        ? "+"
                                        : ""}
                                      {trend.activeUsers -
                                        data.trends[index - 1].activeUsers}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="3"
                                className="text-center text-muted py-3"
                              >
                                Không có dữ liệu xu hướng
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Tab Phát Hiện Bất Thường */}
              <Tab.Pane eventKey="anomalies">
                <Row>
                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Người Dùng Nghi Vấn</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Người Dùng</th>
                            <th>Điểm Rủi Ro</th>
                            <th>Cảnh Báo</th>
                            <th>Vi Phạm</th>
                            <th>Mức Độ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.anomalies?.suspiciousUsers) &&
                          data.anomalies.suspiciousUsers.length > 0 ? (
                            data.anomalies.suspiciousUsers
                              .slice(0, 15)
                              .map((user, index) => (
                                <tr key={index}>
                                  <td>
                                    <div>
                                      <strong>{user.username || "N/A"}</strong>
                                      <br />
                                      <small className="text-muted">
                                        {user.email || "Không có email"}
                                      </small>
                                    </div>
                                  </td>
                                  <td>
                                    <strong
                                      className={
                                        (user.riskScore || 0) >= 50
                                          ? "text-danger"
                                          : (user.riskScore || 0) >= 20
                                          ? "text-warning"
                                          : "text-success"
                                      }
                                    >
                                      {user.riskScore || 0}
                                    </strong>
                                  </td>
                                  <td>{user.warningCount || 0}</td>
                                  <td>{user.violationCount || 0}</td>
                                  <td>
                                    {getRiskBadge(user.riskLevel || "low")}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                className="text-center text-muted py-3"
                              >
                                Không có người dùng nghi vấn
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Người Dùng Bị Báo Cáo Nhiều</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Người Dùng</th>
                            <th>Số Báo Cáo</th>
                            <th>Người Báo Cáo</th>
                            <th>Tần Suất</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.anomalies?.highReportUsers) &&
                          data.anomalies.highReportUsers.length > 0 ? (
                            data.anomalies.highReportUsers
                              .slice(0, 10)
                              .map((user, index) => (
                                <tr key={index}>
                                  <td>
                                    <div>
                                      <strong>{user.username || "N/A"}</strong>
                                      <br />
                                      <small className="text-muted">
                                        {user.email || "Không có email"}
                                      </small>
                                    </div>
                                  </td>
                                  <td>
                                    <Badge bg="danger">
                                      {user.reportCount || 0}
                                    </Badge>
                                  </td>
                                  <td>{user.uniqueReporters || 0}</td>
                                  <td>
                                    {(user.reportFrequency || 0) > 1 ? (
                                      <Badge bg="warning">
                                        {(user.reportFrequency || 0).toFixed(1)}
                                        /người
                                      </Badge>
                                    ) : (
                                      <Badge bg="success">Bình thường</Badge>
                                    )}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted py-3"
                              >
                                Không có người dùng bị báo cáo nhiều
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>

                    <h5 className="mb-3 mt-4">Người Dùng Spam</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Người Dùng</th>
                            <th className="text-center">Tổng Bài</th>
                            <th className="text-center">TB/Ngày</th>
                            <th className="text-center">Ngày Hoạt Động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.anomalies?.spamUsers) &&
                          data.anomalies.spamUsers.length > 0 ? (
                            data.anomalies.spamUsers
                              .slice(0, 10)
                              .map((user, index) => (
                                <tr key={index}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div>
                                        <strong>
                                          {user.username || "N/A"}
                                        </strong>
                                        <br />
                                        <small className="text-muted">
                                          {user.email || "Không có email"}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center align-middle">
                                    <span className="fw-bold text-primary">
                                      {user.postCount || 0}
                                    </span>
                                  </td>
                                  <td className="text-center align-middle">
                                    <Badge
                                      bg={
                                        (user.avgPostsPerDay || 0) >= 10
                                          ? "danger"
                                          : (user.avgPostsPerDay || 0) >= 5
                                          ? "warning"
                                          : "info"
                                      }
                                      className="px-3 py-2"
                                    >
                                      {Number(user.avgPostsPerDay || 0).toFixed(
                                        1
                                      )}{" "}
                                      bài
                                    </Badge>
                                  </td>
                                  <td className="text-center align-middle">
                                    {user.uniqueDays || 0} ngày
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center py-4">
                                <div className="text-muted">
                                  Không có người dùng spam
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Tab Hành Vi */}
              <Tab.Pane eventKey="behavior">
                <Row>
                  <Col lg={4} className="mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="card-title">Tần Suất Đăng Bài</h6>
                        <div className="text-center py-3">
                          <h2 className="text-primary">
                            {data.behavior?.postFrequency?.avgPostFrequency?.toFixed(
                              1
                            ) || 0}
                          </h2>
                          <p className="text-muted mb-0">bài/ngày trung bình</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={4} className="mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="card-title">Tần Suất Tìm Kiếm</h6>
                        <div className="text-center py-3">
                          <h2 className="text-info">
                            {data.behavior?.searchFrequency?.avgSearchesPerUser?.toFixed(
                              1
                            ) || 0}
                          </h2>
                          <p className="text-muted mb-0">lượt/người</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={4} className="mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="card-title">Thời Gian Online</h6>
                        <div className="text-center py-3">
                          <h2 className="text-success">
                            {data.behavior?.onlineTime?.avgOnlineTime?.toFixed(
                              0
                            ) || 0}
                          </h2>
                          <p className="text-muted mb-0">phút trung bình</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Tab Bảng Xếp Hạng */}
              <Tab.Pane eventKey="leaderboards">
                <Row>
                  <Col lg={4} className="mb-4">
                    <h5 className="mb-3">Hoạt Động Nhất</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Người Dùng</th>
                            <th>Bài</th>
                            <th>Bình Luận</th>
                            <th>Tổng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.leaderboards?.topActiveUsers) &&
                          data.leaderboards.topActiveUsers.length > 0 ? (
                            data.leaderboards.topActiveUsers
                              .slice(0, 8)
                              .map((user, index) => (
                                <tr key={index}>
                                  <td>
                                    <div>
                                      <strong>{user.username || "N/A"}</strong>
                                      <br />
                                      <small className="text-muted">
                                        {user.email || "Không có email"}
                                      </small>
                                    </div>
                                  </td>
                                  <td>{user.postCount || 0}</td>
                                  <td>{user.commentCount || 0}</td>
                                  <td>
                                    <Badge bg="primary">
                                      {user.totalActivity || 0}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted py-3"
                              >
                                Không có dữ liệu hoạt động
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>

                  <Col lg={4} className="mb-4">
                    <h5 className="mb-3">Đăng Nhiều Bài Nhất</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Người Dùng</th>
                            <th>Số Bài</th>
                            <th>Lượt Thích</th>
                            <th>Tương Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.leaderboards?.topPosters) &&
                          data.leaderboards.topPosters.length > 0 ? (
                            data.leaderboards.topPosters
                              .slice(0, 8)
                              .map((user, index) => (
                                <tr key={index}>
                                  <td>
                                    <div>
                                      <strong>{user.username || "N/A"}</strong>
                                      <br />
                                      <small className="text-muted">
                                        {user.email || "Không có email"}
                                      </small>
                                    </div>
                                  </td>
                                  <td>{user.postCount || 0}</td>
                                  <td>{user.totalLikes || 0}</td>
                                  <td>
                                    <Badge
                                      bg={
                                        (user.engagementRate || 0) > 10
                                          ? "success"
                                          : (user.engagementRate || 0) > 5
                                          ? "warning"
                                          : "secondary"
                                      }
                                    >
                                      {(user.engagementRate || 0).toFixed(1)}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted py-3"
                              >
                                Không có dữ liệu bài đăng
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>

                  <Col lg={4} className="mb-4">
                    <h5 className="mb-3">Bị Báo Cáo Nhiều Nhất</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Người Dùng</th>
                            <th>Tổng</th>
                            <th>Đang Chờ</th>
                            <th>Đã Duyệt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(data.leaderboards?.topReportedUsers) &&
                          data.leaderboards.topReportedUsers.length > 0 ? (
                            data.leaderboards.topReportedUsers
                              .slice(0, 8)
                              .map((user, index) => (
                                <tr key={index}>
                                  <td>
                                    <div>
                                      <strong>{user.username || "N/A"}</strong>
                                      <br />
                                      <small className="text-muted">
                                        {user.email || "Không có email"}
                                      </small>
                                    </div>
                                  </td>
                                  <td>
                                    <Badge bg="danger">
                                      {user.reportCount || 0}
                                    </Badge>
                                  </td>
                                  <td>{user.pendingReports || 0}</td>
                                  <td>{user.approvedReports || 0}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted py-3"
                              >
                                Không có dữ liệu báo cáo
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </Container>
  );
};

export default UserAnalytics;
