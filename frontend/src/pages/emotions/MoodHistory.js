// components/MoodHistory.js
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Form,
  Button,
  Modal,
  Alert,
  Spinner,
  InputGroup,
  Pagination,
  ProgressBar,
} from "react-bootstrap";
import moodService from "../../services/moodService";

import {
  Smile,
  Frown,
  Angry,
  Zap,
  AlertTriangle,
  ThumbsDown,
  Circle,
  Search,
  Download,
  Calendar,
  BarChart2,
  TrendingUp,
} from "lucide-react";

const EMOJI_MAP = {
  happy: <Smile className="w-5 h-5 text-yellow-500" />,
  sad: <Frown className="w-5 h-5 text-blue-500" />,
  angry: <Angry className="w-5 h-5 text-red-600" />,
  surprised: <Zap className="w-5 h-5 text-purple-500" />,
  fearful: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  disgusted: <ThumbsDown className="w-5 h-5 text-green-600" />,
  neutral: <Circle className="w-5 h-5 text-gray-500" />,
};

const EMOTION_LABELS = {
  happy: "Vui vẻ",
  sad: "Buồn",
  angry: "Tức giận",
  surprised: "Ngạc nhiên",
  fearful: "Sợ hãi",
  disgusted: "Chán ghét",
  neutral: "Bình thường",
};

const EMOTION_COLORS = {
  happy: "success",
  sad: "info",
  angry: "danger",
  surprised: "warning",
  fearful: "dark",
  disgusted: "secondary",
  neutral: "light",
};

// Custom icons thay thế react-feather
const CustomIcons = {
  Filter: () => <Search className="w-5 h-5" />,
  Download: () => <Download className="w-5 h-5" />,
  Calendar: () => <Calendar className="w-5 h-5" />,
  BarChart: () => <BarChart2 className="w-5 h-5" />,
  TrendingUp: () => <TrendingUp className="w-5 h-5" />,
};

const MoodHistory = () => {
  const { user } = useAuth();
  const [moodLogs, setMoodLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [trends, setTrends] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    emotion: "",
    dateFrom: "",
    dateTo: "",
    detectedFrom: "",
    search: "",
  });

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Modal states
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Load mood history
  const loadMoodHistory = useCallback(
    async (page = 1) => {
      if (!user) return;

      try {
        setLoading(true);
        const params = {
          page,
          limit: pagination.itemsPerPage,
          ...filters,
        };

        // Remove empty filters
        Object.keys(params).forEach((key) => {
          if (params[key] === "" || params[key] === null) {
            delete params[key];
          }
        });

        const data = await moodService.getMoodHistory(params);

        if (data.success) {
          setMoodLogs(data.moodLogs);
          setPagination((prev) => ({
            ...prev,
            currentPage: page,
            totalPages: data.totalPages,
            totalItems: data.total,
          }));
        }
      } catch (err) {
        console.error("Lỗi tải lịch sử:", err);
        setError("Không thể tải lịch sử tâm trạng");
      } finally {
        setLoading(false);
      }
    },
    [user, filters, pagination.itemsPerPage]
  );

  // Load statistics
  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      const [statsData, trendsData] = await Promise.all([
        moodService.getMoodStats("month"),
        moodService.getMoodTrends(30),
      ]);

      console.log(statsData.data);

      if (statsData.data.success) setStats(statsData.data);
      if (trendsData.data.success) setTrends(trendsData.data.trends || []);
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    }
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    loadMoodHistory(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      emotion: "",
      dateFrom: "",
      dateTo: "",
      detectedFrom: "",
      search: "",
    });
  };

  // Show log detail
  const showLogDetail = (log) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  // Export data
  const exportData = async () => {
    try {
      setExportLoading(true);
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const csvContent = generateCSV();
      downloadCSV(
        csvContent,
        `mood-history-${new Date().toISOString().split("T")[0]}.csv`
      );

      // Show success message
      alert("Xuất dữ liệu thành công!");
    } catch (err) {
      console.error("Lỗi xuất dữ liệu:", err);
      alert("Lỗi khi xuất dữ liệu");
    } finally {
      setExportLoading(false);
    }
  };

  // Generate CSV content
  const generateCSV = () => {
    const headers = [
      "Thời gian",
      "Cảm xúc",
      "Cường độ",
      "Phương thức",
      "Ghi chú",
      "Tags",
    ];
    const rows = moodLogs.map((log) => [
      formatDate(log.createdAt),
      EMOTION_LABELS[log.emotion],
      `${(log.intensity * 100).toFixed(0)}%`,
      log.detectedFrom === "camera"
        ? "Camera AI"
        : log.detectedFrom === "manual"
        ? "Thủ công"
        : "Ảnh tải lên",
      log.note || "",
      log.tags?.join(", ") || "",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  };

  // Download CSV
  const downloadCSV = (content, filename) => {
    const blob = new Blob(["\uFEFF" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination items
  const renderPaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;

    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={currentPage === 1}
        onClick={() => loadMoodHistory(currentPage - 1)}
      />
    );

    // Page numbers
    for (let page = 1; page <= totalPages; page++) {
      if (
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1)
      ) {
        items.push(
          <Pagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => loadMoodHistory(page)}
          >
            {page}
          </Pagination.Item>
        );
      } else if (page === currentPage - 2 || page === currentPage + 2) {
        items.push(<Pagination.Ellipsis key={`ellipsis-${page}`} />);
      }
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => loadMoodHistory(currentPage + 1)}
      />
    );

    return items;
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadMoodHistory();
      loadStats();
    }
  }, [user, loadMoodHistory, loadStats]);

  if (!user) {
    return (
      <Container fluid className="py-4">
        <Alert variant="warning">
          <Alert.Heading>Yêu cầu đăng nhập</Alert.Heading>
          <p>Vui lòng đăng nhập để xem lịch sử tâm trạng của bạn.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* Header */}
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 fw-bold text-primary mb-1">
                <BarChart2 className="w-5 h-5" /> Lịch sử Tâm trạng
              </h1>
              <p className="text-muted mb-0">
                Theo dõi và phân tích cảm xúc của bạn theo thời gian
              </p>
            </div>
            <Button
              variant="primary"
              onClick={exportData}
              disabled={exportLoading || moodLogs.length === 0}
              className="d-flex align-items-center gap-2"
            >
              {exportLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <CustomIcons.Download />
              )}
              Xuất dữ liệu
            </Button>
          </div>
        </Col>

        {/* Statistics Cards */}
        <Col xs={12}>
          <Row className="g-3">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="fs-2">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="fw-bold text-primary">
                    {pagination.totalItems}
                  </h4>
                  <p className="text-muted mb-0">Tổng số bản ghi</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="fs-2">
                    <Smile className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h4 className="fw-bold text-success">
                    {stats.stats?.find((s) => s._id === "happy")?.count || 0}
                  </h4>
                  <p className="text-muted mb-0">Lần vui vẻ</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="fs-2">
                    <Frown className="w-5 h-5 text-blue-500" />
                  </div>
                  <h4 className="fw-bold text-info">
                    {stats.stats?.find((s) => s._id === "sad")?.count || 0}
                  </h4>
                  <p className="text-muted mb-0">Lần buồn</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="fs-2">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="fw-bold text-warning">
                    {stats.period || "Tháng"}
                  </h4>
                  <p className="text-muted mb-0">Thời gian thống kê</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Filters */}
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <CustomIcons.Filter />
                  Bộ lọc & Tìm kiếm
                </h6>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={resetFilters}
                >
                  Đặt lại
                </Button>
              </div>

              <Row className="g-3">
                <Col md={3}>
                  <Form.Label>Loại cảm xúc</Form.Label>
                  <Form.Select
                    value={filters.emotion}
                    onChange={(e) =>
                      handleFilterChange("emotion", e.target.value)
                    }
                  >
                    <option value="">Tất cả cảm xúc</option>
                    {Object.entries(EMOTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {EMOJI_MAP[value]} {label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={3}>
                  <Form.Label>Phương thức</Form.Label>
                  <Form.Select
                    value={filters.detectedFrom}
                    onChange={(e) =>
                      handleFilterChange("detectedFrom", e.target.value)
                    }
                  >
                    <option value="">Tất cả phương thức</option>
                    <option value="camera">Camera AI</option>
                    <option value="manual">Thủ công</option>
                    <option value="image">Ảnh tải lên</option>
                  </Form.Select>
                </Col>

                <Col md={2}>
                  <Form.Label>Từ ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                </Col>

                <Col md={2}>
                  <Form.Label>Đến ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </Col>

                <Col md={2}>
                  <Form.Label>Tìm kiếm</Form.Label>
                  <InputGroup>
                    <Form.Control
                      placeholder="Tìm ghi chú..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") applyFilters();
                      }}
                    />
                    <Button variant="primary" onClick={applyFilters}>
                      <CustomIcons.Filter />
                    </Button>
                  </InputGroup>
                </Col>
              </Row>

              {/* Apply Filters Button */}
              <div className="d-flex justify-content-end mt-3">
                <Button variant="primary" onClick={applyFilters}>
                  Áp dụng bộ lọc
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3">
                  {error}
                </Alert>
              ) : moodLogs.length === 0 ? (
                <div className="text-center py-5">
                  <div className="fs-1 mb-3"></div>
                  <h5 className="text-muted">Chưa có dữ liệu</h5>
                  <p className="text-muted">
                    {Object.values(filters).some((f) => f)
                      ? "Không tìm thấy bản ghi nào phù hợp với bộ lọc"
                      : "Hãy bắt đầu ghi lại tâm trạng của bạn"}
                  </p>
                  {Object.values(filters).some((f) => f) && (
                    <Button variant="primary" onClick={resetFilters}>
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th width="60">#</th>
                          <th width="100">Cảm xúc</th>
                          <th width="100">Cường độ</th>
                          <th width="150">Thời gian</th>
                          <th width="120">Phương thức</th>
                          <th>Ghi chú</th>
                          <th width="100" className="text-center">
                            Tags
                          </th>
                          <th width="80" className="text-center">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {moodLogs.map((log, index) => (
                          <tr key={log._id}>
                            <td className="text-muted">
                              {(pagination.currentPage - 1) *
                                pagination.itemsPerPage +
                                index +
                                1}
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span className="fs-5">
                                  {EMOJI_MAP[log.emotion]}
                                </span>
                                <span className="fw-semibold text-capitalize">
                                  {EMOTION_LABELS[log.emotion]}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <ProgressBar
                                  now={log.intensity * 100}
                                  variant={EMOTION_COLORS[log.emotion]}
                                  className="mb-1"
                                  style={{ height: "6px" }}
                                />
                                <small className="text-muted">
                                  {(log.intensity * 100).toFixed(0)}%
                                </small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="fw-semibold">
                                  {formatDateShort(log.createdAt)}
                                </div>
                                <small className="text-muted">
                                  {new Date(log.createdAt).toLocaleTimeString(
                                    "vi-VN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </small>
                              </div>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  log.detectedFrom === "camera"
                                    ? "primary"
                                    : log.detectedFrom === "manual"
                                    ? "success"
                                    : "info"
                                }
                                className="text-capitalize"
                              >
                                {log.detectedFrom === "camera"
                                  ? "Camera AI"
                                  : log.detectedFrom === "manual"
                                  ? "Thủ công"
                                  : "Ảnh tải lên"}
                              </Badge>
                            </td>
                            <td>
                              <div
                                className="text-truncate"
                                style={{ maxWidth: "200px" }}
                              >
                                {log.note || (
                                  <span className="text-muted fst-italic">
                                    Không có ghi chú
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              {log.tags && log.tags.length > 0 ? (
                                <Badge bg="light" text="dark">
                                  {log.tags.length} tags
                                </Badge>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => showLogDetail(log)}
                              >
                                Chi tiết
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-around align-items-center p-3 border-top">
                      <Pagination className="mb-0">
                        {renderPaginationItems()}
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detail Modal */}
      <Modal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            {selectedLog && (
              <span className="fs-2">{EMOJI_MAP[selectedLog.emotion]}</span>
            )}
            <div>
              <div className="h5 mb-0">Chi tiết cảm xúc</div>
              <small className="text-muted">
                {selectedLog && formatDate(selectedLog.createdAt)}
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <Row className="g-4">
              <Col md={6}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">📋 Thông tin cơ bản</h6>
                    <div className="space-y-3">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Cảm xúc:</span>
                        <Badge
                          bg={EMOTION_COLORS[selectedLog.emotion]}
                          className="fs-6"
                        >
                          {EMOJI_MAP[selectedLog.emotion]}{" "}
                          {EMOTION_LABELS[selectedLog.emotion]}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Cường độ:</span>
                        <span className="fw-semibold">
                          {(selectedLog.intensity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Phương thức:</span>
                        <Badge
                          bg={
                            selectedLog.detectedFrom === "camera"
                              ? "primary"
                              : selectedLog.detectedFrom === "manual"
                              ? "success"
                              : "info"
                          }
                        >
                          {selectedLog.detectedFrom === "camera"
                            ? "Camera AI"
                            : selectedLog.detectedFrom === "manual"
                            ? "Thủ công"
                            : "Ảnh tải lên"}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Thời gian:</span>
                        <span>{formatDate(selectedLog.createdAt)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h6 className="fw-bold mb-3"> Chi tiết bổ sung</h6>
                    <div className="space-y-3">
                      <div>
                        <small className="text-muted">Mô tả:</small>
                        <p className="mb-0 mt-1">
                          {selectedLog.description || (
                            <span className="text-muted fst-italic">
                              Không có mô tả
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <small className="text-muted">Ghi chú:</small>
                        <p className="mb-0 mt-1">
                          {selectedLog.note || (
                            <span className="text-muted fst-italic">
                              Không có ghi chú
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <small className="text-muted">Tags:</small>
                        <div className="mt-1">
                          {selectedLog.tags && selectedLog.tags.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {selectedLog.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  bg="outline-secondary"
                                  text="dark"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted fst-italic">
                              Không có tags
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <small className="text-muted">Hoạt động:</small>
                        <div className="mt-1">
                          {selectedLog.activities &&
                          selectedLog.activities.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {selectedLog.activities.map((activity, index) => (
                                <Badge key={index} bg="outline-info">
                                  {activity}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted fst-italic">
                              Không có hoạt động
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {selectedLog.imageData && (
                <Col xs={12}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="fw-bold mb-3"> Hình ảnh đính kèm</h6>
                      <div className="text-center">
                        <img
                          src={selectedLog.imageData}
                          alt="Mood detection"
                          className="img-fluid rounded"
                          style={{ maxHeight: "200px" }}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowDetail(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MoodHistory;
