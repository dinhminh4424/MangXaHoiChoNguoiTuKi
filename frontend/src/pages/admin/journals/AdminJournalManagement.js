// export default AdminJournalManagement;
//=============
import React, { useState, useEffect } from "react";
import {
  getAllJournals,
  getJournalById,
  deleteJournal,
  getJournalStats,
} from "../../../services/adminService";
import "./AdminJournalManagement.css";
import NotificationService from "../../../services/notificationService";

import { Filter, ChevronUp, ChevronDown } from "lucide-react";

// Import Bootstrap components
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import { Collapse } from "react-bootstrap";

const AdminJournalManagement = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    searchId: "", // Thêm trường tìm kiếm theo ID
    emotion: "",
    privacy: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [journalDetail, setJournalDetail] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const [showFilter, setShowFilter] = useState(true);

  // Emotion options
  const emotionOptions = [
    "happy",
    "sad",
    "angry",
    "excited",
    "calm",
    "anxious",
    "loved",
    "grateful",
    "neutral",
  ];

  const emotionDisplayNames = {
    happy: "Vui vẻ",
    sad: "Buồn bã",
    angry: "Tức giận",
    excited: "Hào hứng",
    calm: "Bình tĩnh",
    anxious: "Lo lắng",
    loved: "Yêu thương",
    grateful: "Biết ơn",
    neutral: "Trung tính",
  };

  const emotionColors = {
    happy: "emotion-happy",
    sad: "emotion-sad",
    angry: "emotion-angry",
    excited: "emotion-excited",
    calm: "emotion-calm",
    anxious: "emotion-anxious",
    loved: "emotion-loved",
    grateful: "emotion-grateful",
    neutral: "bg-secondary",
  };

  useEffect(() => {
    fetchJournals();
    fetchStats();
  }, [filters]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const response = await getAllJournals(filters);
      setJournals(response.data.journals);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Không thể tải danh sách nhật ký");
      console.error("Fetch journals error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getJournalStats();
      setStats(response.data);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  const fetchJournalDetail = async (journalId) => {
    try {
      const response = await getJournalById(journalId);
      setJournalDetail(response.data);
    } catch (err) {
      console.error("Fetch journal detail error:", err);
      NotificationService.error({
        title: "Lỗi",
        text: "Không thể tải chi tiết nhật ký",
      });
    }
  };

  // Modal handlers
  const handleShowDetailModal = async (journal) => {
    setSelectedJournal(journal);
    await fetchJournalDetail(journal._id);
    setShowDetailModal(true);
  };

  const handleShowStatsModal = () => {
    setShowStatsModal(true);
  };

  const handleCloseModals = () => {
    setShowDetailModal(false);
    setShowStatsModal(false);
    setShowMediaModal(false);
    setSelectedJournal(null);
    setJournalDetail(null);
    setSelectedMediaIndex(0);
  };

  const handleShowMediaModal = (media, startIndex = 0) => {
    setSelectedMediaIndex(startIndex);
    setShowMediaModal(true);
  };

  const handleNextMedia = () => {
    if (journalDetail?.media) {
      setSelectedMediaIndex((prev) =>
        prev < journalDetail.media.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handlePrevMedia = () => {
    if (journalDetail?.media) {
      setSelectedMediaIndex((prev) =>
        prev > 0 ? prev - 1 : journalDetail.media.length - 1
      );
    }
  };

  // Filter handlers
  const handleSearch = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
      searchId: "", // Reset searchId khi tìm kiếm thông thường
      page: 1,
    }));
  };

  const handleSearchById = (e) => {
    setFilters((prev) => ({
      ...prev,
      searchId: e.target.value,
      search: "", // Reset search thông thường khi tìm theo ID
      page: 1,
    }));
  };

  const handleEmotionFilter = (e) => {
    setFilters((prev) => ({
      ...prev,
      emotion: e.target.value,
      page: 1,
    }));
  };

  const handlePrivacyFilter = (e) => {
    setFilters((prev) => ({
      ...prev,
      privacy: e.target.value,
      page: 1,
    }));
  };

  const handleDateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1,
    }));
  };

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split("-");
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      searchId: "",
      emotion: "",
      privacy: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleDeleteJournal = async (journalId, journalTitle) => {
    if (
      window.confirm(`Bạn có chắc chắn muốn xóa nhật ký "${journalTitle}"?`)
    ) {
      try {
        await deleteJournal(journalId);
        setJournals(journals.filter((journal) => journal._id !== journalId));
        NotificationService.success({
          title: "Thành công",
          text: "Đã xóa nhật ký thành công",
        });
        fetchStats();
      } catch (err) {
        NotificationService.error({
          title: "Lỗi",
          text: "Không thể xóa nhật ký",
        });
      }
    }
  };

  // Helper functions
  const getPrivacyBadgeClass = (isPrivate) => {
    return isPrivate ? "bg-secondary" : "bg-success";
  };

  const getPrivacyText = (isPrivate) => {
    return isPrivate ? "Riêng tư" : "Công khai";
  };

  const formatContentPreview = (content) => {
    // Remove HTML tags for preview
    const text = content.replace(/<[^>]*>/g, "");
    return text.length > 49 ? text.substring(0, 49) + "..." : text;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatJournalId = (id) => {
    return id ? `#${id.substring(0, 8)}...` : "";
  };

  const renderMediaPreview = (media) => {
    if (!media || media.length === 0) return null;

    const firstMedia = media[0];
    const remainingCount = media.length - 1;

    return (
      <div className="media-preview-container">
        <div
          className="media-preview-item position-relative"
          onClick={() => handleShowMediaModal(media, 0)}
          style={{ cursor: "pointer" }}
        >
          {firstMedia.match(/\.(mp4|avi|mov)$/i) ? (
            <div className="media-item video-item">
              <div className="media-overlay">
                <i className="ri-play-circle-fill"></i>
              </div>
              <div className="media-thumbnail bg-dark"></div>
            </div>
          ) : (
            <Image
              src={firstMedia}
              alt="Media preview"
              className="media-thumbnail"
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          )}

          {remainingCount > 0 && (
            <div className="media-count-badge">
              <Badge bg="dark">+{remainingCount}</Badge>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentMedia = () => {
    if (!journalDetail?.media || journalDetail.media.length === 0) return null;

    const currentMedia = journalDetail.media[selectedMediaIndex];
    const isVideo = currentMedia.match(/\.(mp4|avi|mov)$/i);

    return (
      <div className="current-media-container text-center">
        {isVideo ? (
          <video controls className="media-fullview">
            <source src={currentMedia} type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        ) : (
          <Image
            src={currentMedia}
            alt={`Media ${selectedMediaIndex + 1}`}
            className="media-fullview"
            style={{ maxHeight: "70vh", objectFit: "contain" }}
            fluid
          />
        )}

        {journalDetail.media.length > 1 && (
          <div className="media-navigation mt-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handlePrevMedia}
              className="me-2"
            >
              <i className="ri-arrow-left-line"></i>
            </Button>
            <span className="mx-3">
              {selectedMediaIndex + 1} / {journalDetail.media.length}
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleNextMedia}
            >
              <i className="ri-arrow-right-line"></i>
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-journal-management">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Quản lý Nhật ký</h1>
          <p className="text-muted mb-0">
            Quản lý nhật ký tâm trạng và cảm xúc của người dùng
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-info" onClick={handleShowStatsModal}>
            <i className="ri-bar-chart-line me-2"></i> Thống kê
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Tổng số nhật ký</h6>
                  <h3 className="text-primary">{stats.totalJournals || 0}</h3>
                </div>
                <div className="stats-icon bg-primary">
                  <i className="ri-book-line"></i>
                </div>
              </div>
              <small className="text-muted">
                {stats.privateJournals || 0} nhật ký riêng tư
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Nhật ký hôm nay</h6>
                  <h3 className="text-success">{stats.todayJournals || 0}</h3>
                </div>
                <div className="stats-icon bg-success">
                  <i className="ri-calendar-event-line"></i>
                </div>
              </div>
              <small className="text-muted">
                {stats.thisWeekJournals || 0} trong tuần này
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Cảm xúc phổ biến</h6>
                  <h3 className="text-info">
                    {stats.topEmotion
                      ? emotionDisplayNames[stats.topEmotion]
                      : "N/A"}
                  </h3>
                </div>
                <div className="stats-icon bg-info">
                  <i className="ri-heart-line"></i>
                </div>
              </div>
              <small className="text-muted">
                {stats.topEmotionCount || 0} nhật ký
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Có media</h6>
                  <h3 className="text-warning">{stats.withMedia || 0}</h3>
                </div>
                <div className="stats-icon bg-warning">
                  <i className="ri-image-line"></i>
                </div>
              </div>
              <small className="text-muted">
                {stats.avgMediaPerJournal || 0} media/ nhật ký
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Filters */}
      <Card className="mb-4">
        <Card.Header
          className="bg-white d-flex justify-content-between align-items-center cursor-pointer"
          onClick={() => setShowFilter((v) => !v)}
        >
          <h5 className="mb-0">
            <Filter size={20} className="me-2 text-primary" />
            Bộ lọc tìm kiếm
          </h5>

          {showFilter ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Card.Header>
        <Collapse in={showFilter}>
          <div>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label>Tìm kiếm theo tiêu đề/nội dung</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tìm theo tiêu đề, nội dung..."
                    value={filters.search}
                    onChange={handleSearch}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Tìm kiếm theo ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập ID nhật ký..."
                    value={filters.searchId}
                    onChange={handleSearchById}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Cảm xúc</Form.Label>
                  <Form.Select
                    value={filters.emotion}
                    onChange={handleEmotionFilter}
                  >
                    <option value="">Tất cả cảm xúc</option>
                    {emotionOptions.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {emotionDisplayNames[emotion]}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Quyền riêng tư</Form.Label>
                  <Form.Select
                    value={filters.privacy}
                    onChange={handlePrivacyFilter}
                  >
                    <option value="">Tất cả</option>
                    <option value="private">Riêng tư</option>
                    <option value="public">Công khai</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Sắp xếp</Form.Label>
                  <Form.Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={handleSortChange}
                  >
                    <option value="createdAt-desc">Mới nhất</option>
                    <option value="createdAt-asc">Cũ nhất</option>
                    <option value="title-asc">Tiêu đề A-Z</option>
                    <option value="title-desc">Tiêu đề Z-A</option>
                  </Form.Select>
                </Col>
                <Col md={1} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={handleResetFilters}
                    title="Reset bộ lọc"
                  >
                    <i className="ri-refresh-line"></i>
                  </Button>
                </Col>
              </Row>
              <Row className="g-3 mt-2">
                <Col md={3}>
                  <Form.Label>Từ ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleDateFilter("dateFrom", e.target.value)
                    }
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Đến ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleDateFilter("dateTo", e.target.value)}
                  />
                </Col>
              </Row>
            </Card.Body>
          </div>
        </Collapse>
      </Card>

      {loading && (
        <div className="loading-container d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Đang tải danh sách nhật ký...</p>
        </div>
      )}

      {!loading && journals.length === 0 && (
        <div className="text-center py-5">
          <i className="ri-search-line display-4 text-muted"></i>
          <h5 className="mt-3 text-muted">Không tìm thấy nhật ký nào</h5>
          <p className="text-muted">
            {filters.searchId
              ? `Không tìm thấy nhật ký với ID: ${filters.searchId}`
              : filters.search
              ? `Không tìm thấy nhật ký với từ khóa: ${filters.search}`
              : "Không có nhật ký nào phù hợp với bộ lọc"}
          </p>
          {(filters.searchId ||
            filters.search ||
            filters.emotion ||
            filters.privacy ||
            filters.dateFrom ||
            filters.dateTo) && (
            <Button variant="outline-primary" onClick={handleResetFilters}>
              <i className="ri-refresh-line me-2"></i>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {/* Journals Table */}
      {!loading && (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th width="100">ID</th>
                    <th width="140">Tiêu đề</th>
                    <th width="100">Người viết</th>
                    <th width="150">Nội dung</th>
                    <th width="120">Cảm xúc</th>
                    <th width="100">Media</th>
                    <th width="140">Ngày viết</th>
                    <th width="100">Quyền riêng tư</th>
                    <th width="100">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map((journal) => (
                    <tr key={journal._id}>
                      <td>
                        <code className="journal-id" title={journal._id}>
                          {formatJournalId(journal._id)}
                        </code>
                      </td>
                      <td>
                        <div
                          className="fw-semibold text-truncate"
                          style={{ maxWidth: "110px" }}
                          title={journal.title}
                        >
                          {journal.title}
                        </div>
                      </td>
                      {/* <td>
                        <div className="d-flex align-items-center">
                          {journal.userId?.profile?.avatar ? (
                            <Image
                              src={journal.userId.profile.avatar}
                              alt={journal.userId.username}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                          ) : (
                            <div
                              className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <i className="ri-user-line text-muted"></i>
                            </div>
                          )}
                          <div>
                            <div className="fw-semibold small">
                              {journal.userId?.username}
                            </div>
                          </div>
                        </div>
                      </td> */}
                      <td>
                        <div className="">
                          {journal.userId?.profile?.avatar ? (
                            <Image
                              src={journal.userId.profile.avatar}
                              alt={journal.userId.username}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                          ) : (
                            <div
                              className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <i className="ri-user-line text-muted"></i>
                            </div>
                          )}
                          <div>
                            {/* <div className="fw-semibold small" >
                              
                              {journal.userId?.username}
                            </div> */}
                            <div
                              className="fw-semibold small"
                              style={{ maxWidth: "110px" }}
                            >
                              {journal.userId?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div
                          className="content-preview small"
                          title={formatContentPreview(journal.content)}
                        >
                          {formatContentPreview(journal.content)}
                        </div>
                      </td>
                      <td>
                        <div>
                          {journal.emotions &&
                            journal.emotions
                              .slice(0, 1)
                              .map((emotion, index) => (
                                <span
                                  key={index}
                                  className={`emotion-tag small ${
                                    emotionColors[emotion] || "bg-secondary"
                                  }`}
                                >
                                  {emotionDisplayNames[emotion] || emotion}
                                </span>
                              ))}
                          {journal.emotions && journal.emotions.length > 1 && (
                            <Badge bg="light" text="dark" className="small">
                              +{journal.emotions.length - 1}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        {renderMediaPreview(journal.media)}
                        {(!journal.media || journal.media.length === 0) && (
                          <span className="text-muted small">Không có</span>
                        )}
                      </td>
                      <td>
                        <small>
                          {formatDate(journal.date || journal.createdAt)}
                        </small>
                      </td>
                      <td>
                        <Badge
                          className={getPrivacyBadgeClass(journal.isPrivate)}
                        >
                          {getPrivacyText(journal.isPrivate)}
                        </Badge>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleShowDetailModal(journal)}
                            title="Xem chi tiết"
                          >
                            <i className="ri-information-line"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              handleDeleteJournal(journal._id, journal.title)
                            }
                            title="Xoá nhật ký"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted">
            Hiển thị {journals.length} trong tổng số {pagination.total} nhật ký
          </div>
          <Pagination>
            <Pagination.Prev
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            />
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
                <Pagination.Item
                  key={page}
                  active={filters.page === page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Pagination.Item>
              )
            )}
            <Pagination.Next
              disabled={filters.page === pagination.pages}
              onClick={() => handlePageChange(filters.page + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Journal Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={handleCloseModals}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết Nhật ký</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {journalDetail && (
            <Row>
              <Col md={8}>
                <Card className="mb-4">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">{journalDetail.title}</h4>
                    <Badge
                      className={getPrivacyBadgeClass(journalDetail.isPrivate)}
                    >
                      {getPrivacyText(journalDetail.isPrivate)}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <strong>ID: </strong>
                      <code>{journalDetail._id}</code>
                    </div>
                    <div
                      className="journal-content"
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        lineHeight: "1.6",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: journalDetail.content,
                      }}
                    />
                  </Card.Body>
                </Card>

                {journalDetail.media && journalDetail.media.length > 0 && (
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">
                        Hình ảnh & Video ({journalDetail.media.length})
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="media-gallery">
                        {journalDetail.media.map((item, index) => (
                          <div
                            key={index}
                            className="media-item"
                            onClick={() =>
                              handleShowMediaModal(journalDetail.media, index)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            {item.match(/\.(mp4|avi|mov)$/i) ? (
                              <div className="media-overlay">
                                <i className="ri-play-circle-fill"></i>
                              </div>
                            ) : (
                              <Image src={item} alt={`Media ${index + 1}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
              <Col md={4}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Thông tin</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col>
                        <Form.Label className="fw-semibold">
                          Người viết
                        </Form.Label>
                        <div className="d-flex align-items-center">
                          {journalDetail.userId?.profile?.avatar ? (
                            <Image
                              src={journalDetail.userId.profile.avatar}
                              alt={journalDetail.userId.username}
                              className="rounded-circle me-2"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div
                              className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i className="ri-user-line text-muted"></i>
                            </div>
                          )}
                          <div>
                            <div className="fw-semibold">
                              {journalDetail.userId?.username}
                            </div>
                            <small className="text-muted">
                              {journalDetail.userId?.email}
                            </small>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col>
                        <Form.Label className="fw-semibold">
                          Ngày viết
                        </Form.Label>
                        <p className="mb-0">
                          {formatDate(
                            journalDetail.date || journalDetail.createdAt
                          )}
                        </p>
                      </Col>
                    </Row>

                    {journalDetail.tags && journalDetail.tags.length > 0 && (
                      <Row className="mb-3">
                        <Col>
                          <Form.Label className="fw-semibold">Tags</Form.Label>
                          <div>
                            {journalDetail.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                bg="outline-primary"
                                className="me-1 mb-1"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Cảm xúc</h5>
                  </Card.Header>
                  <Card.Body>
                    {journalDetail.emotions &&
                    journalDetail.emotions.length > 0 ? (
                      <div>
                        {journalDetail.emotions.map((emotion, index) => (
                          <span
                            key={index}
                            className={`emotion-tag ${
                              emotionColors[emotion] || "bg-secondary"
                            } me-2 mb-2`}
                          >
                            {emotionDisplayNames[emotion] || emotion}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">
                        Không có cảm xúc được gắn
                      </p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Media Modal */}
      <Modal
        show={showMediaModal}
        onHide={handleCloseModals}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xem Media</Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderCurrentMedia()}</Modal.Body>
      </Modal>

      {/* Stats Modal */}
      <Modal
        show={showStatsModal}
        onHide={handleCloseModals}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thống kê Nhật ký</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Phân bố theo cảm xúc</h6>
                </Card.Header>
                <Card.Body>
                  {stats.emotionDistribution &&
                  Object.keys(stats.emotionDistribution).length > 0 ? (
                    <ul className="list-unstyled mb-0">
                      {Object.entries(stats.emotionDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 8)
                        .map(([emotion, count]) => (
                          <li
                            key={emotion}
                            className="d-flex justify-content-between py-1"
                          >
                            <span>
                              {emotionDisplayNames[emotion] || emotion}
                            </span>
                            <span className="fw-semibold">{count}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">Không có dữ liệu</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Phân bố theo quyền riêng tư</h6>
                </Card.Header>
                <Card.Body>
                  {stats.privacyDistribution &&
                  Object.keys(stats.privacyDistribution).length > 0 ? (
                    <ul className="list-unstyled mb-0">
                      {Object.entries(stats.privacyDistribution).map(
                        ([privacy, count]) => (
                          <li
                            key={privacy}
                            className="d-flex justify-content-between py-1"
                          >
                            <span>
                              {privacy === "private" ? "Riêng tư" : "Công khai"}
                            </span>
                            <span className="fw-semibold">{count}</span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">Không có dữ liệu</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Hoạt động theo tháng</h6>
                </Card.Header>
                <Card.Body>
                  <div className="text-center">
                    <h3 className="text-primary">
                      {stats.thisMonthJournals || 0}
                    </h3>
                    <small className="text-muted">
                      nhật ký trong tháng này
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Tỷ lệ tăng trưởng</h6>
                </Card.Header>
                <Card.Body>
                  <div className="text-center">
                    <h3
                      className={
                        stats.growthRate >= 0 ? "text-success" : "text-danger"
                      }
                    >
                      {stats.growthRate >= 0 ? "+" : ""}
                      {stats.growthRate || 0}%
                    </h3>
                    <small className="text-muted">so với tháng trước</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Top người viết nhiều nhất</h6>
                </Card.Header>
                <Card.Body>
                  {stats.topWriters && stats.topWriters.length > 0 ? (
                    <div className="table-responsive">
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th>Người dùng</th>
                            <th>Số nhật ký</th>
                            <th>Nhật ký gần nhất</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.topWriters.slice(0, 5).map((writer) => (
                            <tr key={writer._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {writer.avatar ? (
                                    <Image
                                      src={writer.avatar}
                                      alt={writer.username}
                                      className="rounded-circle me-2"
                                      width="24"
                                      height="24"
                                    />
                                  ) : (
                                    <div
                                      className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                                      style={{ width: "24px", height: "24px" }}
                                    >
                                      <i className="ri-user-line text-muted"></i>
                                    </div>
                                  )}
                                  <span>{writer.username}</span>
                                </div>
                              </td>
                              <td>{writer.journalCount}</td>
                              <td>
                                {writer.lastJournal
                                  ? formatDate(writer.lastJournal)
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Không có dữ liệu</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminJournalManagement;
