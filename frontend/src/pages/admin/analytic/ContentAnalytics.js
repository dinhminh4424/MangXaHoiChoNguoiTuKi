// src/components/admin/analytics/ContentAnalytics.js
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
  ProgressBar,
} from "react-bootstrap";
import {
  FileText,
  MessageSquare,
  Flag,
  TrendingUp,
  Hash,
  MapPin,
  BarChart3,
  AlertTriangle,
  EyeOff,
  Trash2,
} from "lucide-react";
import ContentAnalyticsService from "../../../services/contentAnalyticsService";

const ContentAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("today");
  const [activeTab, setActiveTab] = useState("overview");
  const [customRange, setCustomRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    fetchContentStats();
  }, [period]);

  const fetchContentStats = async (customStart = null, customEnd = null) => {
    try {
      setLoading(true);
      const response = await ContentAnalyticsService.getContentOverview(
        period,
        customStart,
        customEnd
      );

      console.log(response.data);
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
      fetchContentStats(customRange.start, customRange.end);
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      high: "danger",
      medium: "warning",
      low: "secondary",
    };

    return (
      <Badge bg={variants[severity]}>
        {severity === "high"
          ? "Cao"
          : severity === "medium"
          ? "Trung bình"
          : "Thấp"}
      </Badge>
    );
  };

  const getRiskLevel = (reportCount) => {
    if (reportCount >= 10) return "high";
    if (reportCount >= 5) return "medium";
    return "low";
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu nội dung...</p>
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
          <Button onClick={() => fetchContentStats()}>Thử lại</Button>
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
              <h2 className="h4 mb-1">Phân Tích Nội Dung</h2>
              <p className="text-muted mb-0">
                Theo dõi và phân tích bài viết, bình luận và xu hướng nội dung
              </p>
            </div>
            <div className="d-flex gap-2">
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
                />
                <Form.Control
                  type="date"
                  size="sm"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  placeholder="Đến ngày"
                />
                <Button type="submit" size="sm" variant="outline-primary">
                  Áp dụng
                </Button>
              </Form>

              <Form.Select
                style={{ width: "200px" }}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="today">Hôm nay</option>
                <option value="week">7 ngày</option>
                <option value="month">30 ngày</option>
                <option value="year">1 năm</option>
              </Form.Select>
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
                  <h6 className="card-title text-muted mb-2">Tổng Bài Viết</h6>
                  <h3 className="mb-0">
                    {data.overview.totalPosts?.toLocaleString()}
                  </h3>
                  <small className="text-muted">
                    {data.overview.newPosts} mới trong kỳ
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <FileText size={24} className="text-primary" />
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
                  <h6 className="card-title text-muted mb-2">Tổng Bình Luận</h6>
                  <h3 className="mb-0">
                    {data.overview.totalComments?.toLocaleString()}
                  </h3>
                  <small className="text-muted">
                    {data.overview.newComments} mới trong kỳ
                  </small>
                </div>
                <div className="bg-info bg-opacity-10 rounded p-3">
                  <MessageSquare size={24} className="text-info" />
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
                  <h6 className="card-title text-muted mb-2">Bài Bị Chặn</h6>
                  <h3 className="mb-0">{data.overview.blockedPosts.length}</h3>
                  <small className="text-muted">
                    Tỷ lệ tương tác: {data.overview.engagementRate}%
                  </small>
                </div>
                <div className="bg-warning bg-opacity-10 rounded p-3">
                  <EyeOff size={24} className="text-warning" />
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
                  <h6 className="card-title text-muted mb-2">Chất Lượng</h6>
                  <h3 className="mb-0">{data.quality?.deletionRate || 0}%</h3>
                  <small className="text-muted">Tỷ lệ bài bị xoá</small>
                </div>
                <div className="bg-danger bg-opacity-10 rounded p-3">
                  <Trash2 size={24} className="text-danger" />
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
                <Nav.Link eventKey="reported">Bài Bị Báo Cáo</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="trending">Xu Hướng</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="quality">Chất Lượng</Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>

          <Card.Body>
            <Tab.Content>
              {/* Tab Tổng Quan */}
              <Tab.Pane eventKey="overview">
                <Row>
                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Bài Viết Bị Chặn Gần Đây</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Nội Dung</th>
                            <th>Tác Giả</th>
                            <th>Loại Chặn</th>
                            <th>Report</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.overview.blockedPosts
                            ?.slice(0, 8)
                            .map((post, index) => (
                              <tr key={index}>
                                <td>
                                  <div>
                                    <strong>{post.content}...</strong>
                                    <br />
                                    <small className="text-muted">
                                      {new Date(
                                        post.createdAt
                                      ).toLocaleDateString("vi-VN")}
                                    </small>
                                  </div>
                                </td>
                                <td>{post.author}</td>
                                <td>
                                  <Badge bg="warning">{post.blockReason}</Badge>
                                </td>
                                <td>
                                  <Badge bg="danger">
                                    {post.reportCount || 0}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Phân Bố Theo Giờ</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Giờ</th>
                            <th>Số Bài</th>
                            <th>Like TB</th>
                            <th>Comment TB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.geographic?.hourlyDistribution?.map(
                            (hour, index) => (
                              <tr key={index}>
                                <td>{hour.hour}:00</td>
                                <td>
                                  <strong>{hour.postCount}</strong>
                                </td>
                                <td>{hour.avgLikes}</td>
                                <td>{hour.avgComments}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </Table>
                    </div>

                    <h5 className="mb-3 mt-4">Phân Loại Nội Dung</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Loại</th>
                            <th>Số Lượng</th>
                            <th>Tương Tác TB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.geographic?.contentTypeDistribution?.map(
                            (type, index) => (
                              <tr key={index}>
                                <td>
                                  <Badge
                                    bg={
                                      type.type === "media"
                                        ? "primary"
                                        : "secondary"
                                    }
                                  >
                                    {type.type === "media"
                                      ? "Có Media"
                                      : "Chỉ Text"}
                                  </Badge>
                                </td>
                                <td>{type.count}</td>
                                <td>{type.avgEngagement}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Tab Bài Bị Báo Cáo */}
              <Tab.Pane eventKey="reported">
                <Row>
                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Bài Có Nhiều Report Nhất</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Nội Dung</th>
                            <th>Tác Giả</th>
                            <th>Report</th>
                            <th>Like</th>
                            <th>Mức Độ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.reportedPosts?.highReportPosts
                            ?.slice(0, 10)
                            .map((post, index) => (
                              <tr key={index}>
                                <td>
                                  <div>
                                    <strong>{post.content}...</strong>
                                    <br />
                                    <small className="text-muted">
                                      {new Date(
                                        post.createdAt
                                      ).toLocaleDateString("vi-VN")}
                                    </small>
                                  </div>
                                </td>
                                <td>{post.author}</td>
                                <td>
                                  <Badge bg="danger">{post.reportCount}</Badge>
                                </td>
                                <td>{post.likeCount}</td>
                                <td>
                                  {getSeverityBadge(
                                    getRiskLevel(post.reportCount)
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Bài Mới Bị Report</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Nội Dung</th>
                            <th>Report</th>
                            <th>Người Report</th>
                            <th>Lần Cuối</th>
                            <th>Mức Độ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.reportedPosts?.recentReportedPosts
                            ?.slice(0, 10)
                            .map((post, index) => (
                              <tr key={index}>
                                <td>
                                  <div>
                                    <strong>{post.content}...</strong>
                                    <br />
                                    <small className="text-muted">
                                      {post.author}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <Badge bg="warning">{post.reportCount}</Badge>
                                </td>
                                <td>{post.uniqueReporters}</td>
                                <td>
                                  {new Date(post.lastReport).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </td>
                                <td>{getSeverityBadge(post.severity)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Tab Xu Hướng */}
              <Tab.Pane eventKey="trending">
                <Row>
                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Hashtags Hot</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Hashtag</th>
                            <th>Số Lượng</th>
                            <th>Like TB</th>
                            <th>Comment TB</th>
                            <th>Tương Tác TB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.trending?.trendingHashtags
                            ?.slice(0, 10)
                            .map((hashtag, index) => (
                              <tr key={index}>
                                <td>
                                  <Badge bg="primary" className="me-1">
                                    {hashtag.hashtag}
                                  </Badge>
                                </td>
                                <td>
                                  <strong>{hashtag.count}</strong>
                                </td>
                                <td>{hashtag.totalLikes}</td>
                                <td>{hashtag.totalComments}</td>
                                <td>
                                  <Badge
                                    bg={
                                      hashtag.avgEngagement > 10
                                        ? "success"
                                        : hashtag.avgEngagement > 5
                                        ? "warning"
                                        : "secondary"
                                    }
                                  >
                                    {hashtag.avgEngagement}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>

                    <h5 className="mb-3 mt-4">Bài Viết Nổi Bật</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Nội Dung</th>
                            <th>Tác Giả</th>
                            <th>Tương Tác</th>
                            <th>Like</th>
                            <th>Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.trending?.topEngagedPosts
                            ?.slice(0, 8)
                            .map((post, index) => (
                              <tr key={index}>
                                <td>
                                  <div>
                                    <strong>{post.content}...</strong>
                                    <br />
                                    <small className="text-muted">
                                      {new Date(
                                        post.createdAt
                                      ).toLocaleDateString("vi-VN")}
                                    </small>
                                  </div>
                                </td>
                                <td>{post.author}</td>
                                <td>
                                  <Badge bg="success">{post.engagement}</Badge>
                                </td>
                                <td>{post.likeCount}</td>
                                <td>{post.commentCount}</td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Khu Vực Hoạt Động</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Khu Vực</th>
                            <th>Tổng User</th>
                            <th>Đang Hoạt Động</th>
                            <th>Tỷ Lệ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.trending?.geographicTrends
                            ?.slice(0, 10)
                            .map((area, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <MapPin
                                      size={14}
                                      className="me-2 text-muted"
                                    />
                                    {area.location}
                                  </div>
                                </td>
                                <td>{area.userCount}</td>
                                <td>{area.activeUsers}</td>
                                <td>
                                  <ProgressBar
                                    now={
                                      (area.activeUsers / area.userCount) * 100
                                    }
                                    variant={
                                      area.activeUsers / area.userCount > 0.7
                                        ? "success"
                                        : area.activeUsers / area.userCount >
                                          0.4
                                        ? "warning"
                                        : "danger"
                                    }
                                    style={{ width: "80px", height: "6px" }}
                                  />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Tab Chất Lượng */}
              <Tab.Pane eventKey="quality">
                <Row>
                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Chỉ Số Chất Lượng</h5>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Tỷ lệ bài bị xoá</span>
                            <strong>{data.quality?.deletionRate || 0}%</strong>
                          </div>
                          <ProgressBar
                            now={data.quality?.deletionRate || 0}
                            variant={
                              (data.quality?.deletionRate || 0) > 10
                                ? "danger"
                                : (data.quality?.deletionRate || 0) > 5
                                ? "warning"
                                : "success"
                            }
                          />
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Tỷ lệ bài bị ẩn</span>
                            <strong>{data.quality?.blockingRate || 0}%</strong>
                          </div>
                          <ProgressBar
                            now={data.quality?.blockingRate || 0}
                            variant={
                              (data.quality?.blockingRate || 0) > 15
                                ? "danger"
                                : (data.quality?.blockingRate || 0) > 8
                                ? "warning"
                                : "success"
                            }
                          />
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Tỷ lệ vi phạm</span>
                            <strong>{data.quality?.violationRate || 0}%</strong>
                          </div>
                          <ProgressBar
                            now={data.quality?.violationRate || 0}
                            variant={
                              (data.quality?.violationRate || 0) > 20
                                ? "danger"
                                : (data.quality?.violationRate || 0) > 10
                                ? "warning"
                                : "success"
                            }
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <h5 className="mb-3">Bình Luận Có Vấn Đề</h5>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Nội Dung</th>
                            <th>Tác Giả</th>
                            <th>Độc Hại</th>
                            <th>Report</th>
                            <th>Mức Độ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.quality?.toxicComments
                            ?.slice(0, 8)
                            .map((comment, index) => (
                              <tr key={index}>
                                <td>
                                  <div>
                                    <strong>{comment.content}...</strong>
                                    <br />
                                    <small className="text-muted">
                                      {new Date(
                                        comment.createdAt
                                      ).toLocaleDateString("vi-VN")}
                                    </small>
                                  </div>
                                </td>
                                <td>{comment.author}</td>
                                <td>
                                  <Badge bg="danger">
                                    {comment.toxicScore}
                                  </Badge>
                                </td>
                                <td>{comment.reportCount}</td>
                                <td>{getSeverityBadge(comment.riskLevel)}</td>
                              </tr>
                            ))}
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

export default ContentAnalytics;
