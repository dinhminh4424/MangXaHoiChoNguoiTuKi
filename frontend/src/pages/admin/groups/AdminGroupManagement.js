import React, { useState, useEffect } from "react";
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupStats,
} from "../../../services/adminService";
import "./AdminGroupManagement.css";
import NotificationService from "../../../services/notificationService";

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

const AdminGroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    category: "",
    visibility: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [showFilter, setShowFilter] = useState(true);

  // Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // Form state
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    visibility: "private",
    category: ["all"],
    tags: [],
    emotionTags: [],
    avatar: "",
    coverPhoto: "",
  });

  // File upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [filters]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await getAllGroups(filters);

      console.log(response);

      setGroups(response.data.groups);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Không thể tải danh sách nhóm");
      console.error("Fetch groups error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getGroupStats();
      setStats(response.data);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  // Modal handlers
  const handleShowGroupModal = (group = null) => {
    setSelectedGroup(group);
    setModalMode(group ? "edit" : "create");

    if (group) {
      setGroupForm({
        name: group.name,
        description: group.description || "",
        visibility: group.visibility,
        category: group.category || ["all"],
        tags: group.tags || [],
        emotionTags: group.emotionTags || [],
        avatar: group.avatar || "",
        coverPhoto: group.coverPhoto || "",
      });
      setAvatarPreview(group.avatar || "");
      setCoverPreview(group.coverPhoto || "");
    } else {
      setGroupForm({
        name: "",
        description: "",
        visibility: "private",
        category: ["all"],
        tags: [],
        emotionTags: [],
        avatar: "",
        coverPhoto: "",
      });
      setAvatarPreview("");
      setCoverPreview("");
    }

    setAvatarFile(null);
    setCoverFile(null);
    setShowGroupModal(true);
  };

  const handleShowDetailModal = (group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  const handleShowStatsModal = () => {
    setShowStatsModal(true);
  };

  const handleCloseModals = () => {
    setShowGroupModal(false);
    setShowDetailModal(false);
    setShowStatsModal(false);
    setSelectedGroup(null);
  };

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value, type, options } = e.target;

    if (type === "select-multiple") {
      const selectedValues = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);
      setGroupForm((prev) => ({
        ...prev,
        [name]: selectedValues,
      }));
    } else {
      setGroupForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleTagsChange = (e) => {
    const tagsArray = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setGroupForm((prev) => ({
      ...prev,
      tags: tagsArray,
    }));
  };

  const handleEmotionTagsChange = (e) => {
    const tagsArray = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setGroupForm((prev) => ({
      ...prev,
      emotionTags: tagsArray,
    }));
  };

  // File handlers
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append form data
      Object.keys(groupForm).forEach((key) => {
        if (Array.isArray(groupForm[key])) {
          groupForm[key].forEach((value) => {
            formData.append(key, value);
          });
        } else {
          formData.append(key, groupForm[key]);
        }
      });

      // Append files
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("coverPhoto", coverFile);

      const response = await createGroup(formData);
      NotificationService.success({
        title: "Thành công",
        text: "Đã tạo nhóm mới thành công",
      });
      handleCloseModals();
      fetchGroups();
      fetchStats();
    } catch (error) {
      NotificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể tạo nhóm",
      });
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append form data
      Object.keys(groupForm).forEach((key) => {
        if (Array.isArray(groupForm[key])) {
          groupForm[key].forEach((value) => {
            formData.append(key, value);
          });
        } else {
          formData.append(key, groupForm[key]);
        }
      });

      console.log("avatarFile: ", avatarFile);
      console.log("coverFile: ", coverFile);

      // Append files
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("coverPhoto", coverFile);

      const response = await updateGroup(selectedGroup._id, formData);
      NotificationService.success({
        title: "Thành công",
        text: "Đã cập nhật thông tin nhóm",
      });
      handleCloseModals();
      fetchGroups();
      fetchStats();
    } catch (error) {
      NotificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể cập nhật nhóm",
      });
    }
  };

  // Filter handlers
  const handleSearch = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
      page: 1,
    }));
  };

  const handleCategoryFilter = (e) => {
    setFilters((prev) => ({
      ...prev,
      category: e.target.value,
      page: 1,
    }));
  };

  const handleVisibilityFilter = (e) => {
    setFilters((prev) => ({
      ...prev,
      visibility: e.target.value,
      page: 1,
    }));
  };

  const handleStatusFilter = (e) => {
    setFilters((prev) => ({
      ...prev,
      status: e.target.value,
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
      category: "",
      visibility: "",
      status: "",
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

  const handleDeleteGroup = async (groupId, groupName) => {
    let check = await NotificationService.confirm({
      title: `Bạn có chắc chắn muốn xóa hội nhóm "${groupName}"?`,
      confirmText: "Chắc chắn xoá",
      cancelText: "Huỷ xoá",
    });
    if (check.isConfirmed) {
      try {
        await deleteGroup(groupId);
        setGroups(groups.filter((group) => group._id !== groupId));
        NotificationService.success({
          title: "Thành công",
          text: "Đã xóa nhóm thành công",
        });
      } catch (error) {
        NotificationService.error({
          title: "Lỗi",
          text: "Không thể xóa nhóm",
        });
      }
    }
  };

  const handleToggleGroupStatus = async (groupId, currentStatus) => {
    try {
      const check = await NotificationService.confirm({
        title: `Bạn có chắc muốn ${
          currentStatus ? "vô hiệu hóa" : "kích hoạt"
        } nhóm này?`,
        confirmText: `Chắc chắn ${currentStatus ? "vô hiệu hóa" : "kích hoạt"}`,
        cancelText: "Huỷ",
      });

      if (check.isConfirmed) {
        const updateData = { active: !currentStatus };
        await updateGroup(groupId, updateData);

        NotificationService.success({
          title: "Cập nhật thành công!",
          text: `Đã ${
            currentStatus ? "vô hiệu hóa" : "kích hoạt"
          } nhóm thành công!`,
        });

        setGroups((prev) =>
          prev.map((group) =>
            group._id === groupId ? { ...group, active: !currentStatus } : group
          )
        );
        fetchStats();
      }
    } catch (error) {
      NotificationService.error({
        title: "Cập nhật thất bại!",
        text: `Không thể ${currentStatus ? "vô hiệu hóa" : "kích hoạt"} nhóm!`,
      });
    }
  };

  // Helper functions
  const getVisibilityBadgeClass = (visibility) => {
    switch (visibility) {
      case "public":
        return "bg-success";
      case "private":
        return "bg-secondary";
      case "invite":
        return "bg-info";
      default:
        return "bg-secondary";
    }
  };

  const getVisibilityDisplayName = (visibility) => {
    switch (visibility) {
      case "public":
        return "Công khai";
      case "private":
        return "Riêng tư";
      case "invite":
        return "Theo lời mời";
      default:
        return visibility;
    }
  };

  const getStatusBadgeClass = (active) => {
    return active ? "bg-success" : "bg-danger";
  };

  const getStatusText = (active) => {
    return active ? "Đang hoạt động" : "Đã vô hiệu hóa";
  };

  const formatMemberCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count.toString();
  };

  const categoryOptions = [
    "all",
    "happy",
    "sad",
    "angry",
    "surprised",
    "fearful",
    "disgusted",
    "neutral",
  ];

  const categoryDisplayNames = {
    all: "Tất cả",
    happy: "Vui vẻ",
    sad: "Buồn bã",
    angry: "Tức giận",
    surprised: "Ngạc nhiên",
    fearful: "Sợ hãi",
    disgusted: "Ghê tởm",
    neutral: "Trung tính",
  };

  return (
    <div className="admin-group-management">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Quản lý nhóm</h1>
          <p className="text-muted mb-0">
            Quản lý các nhóm cộng đồng và thiết lập
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-info" onClick={handleShowStatsModal}>
            <i className="ri-bar-chart-line me-2"></i> Thống kê
          </Button>
          <Button variant="primary" onClick={() => handleShowGroupModal()}>
            <i className="ri-group-line me-2"></i> Tạo nhóm mới
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
                  <h6 className="card-title">Tổng số nhóm</h6>
                  <h3 className="text-primary">{stats.totalGroups || 0}</h3>
                </div>
                <div className="stats-icon bg-primary">
                  <i className="ri-group-line"></i>
                </div>
              </div>
              <small className="text-muted">
                {stats.activeGroups || 0} đang hoạt động
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Nhóm công khai</h6>
                  <h3 className="text-success">{stats.publicGroups || 0}</h3>
                </div>
                <div className="stats-icon bg-success">
                  <i className="ri-earth-line"></i>
                </div>
              </div>
              <small className="text-muted">
                {stats.privateGroups || 0} nhóm riêng tư
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Tổng thành viên</h6>
                  <h3 className="text-info">{stats.totalMembers || 0}</h3>
                </div>
                <div className="stats-icon bg-info">
                  <i className="ri-user-line"></i>
                </div>
              </div>
              <small className="text-muted">
                Trung bình: {stats.avgMembersPerGroup || 0}/nhóm
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Báo cáo</h6>
                  <h3 className="text-warning">{stats.totalReports || 0}</h3>
                </div>
                <div className="stats-icon bg-warning">
                  <i className="ri-alert-line"></i>
                </div>
              </div>
              <small className="text-muted">
                {stats.groupsWithReports || 0} nhóm có báo cáo
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
            <i className="ri-filter-3-line me-2 text-primary"></i>
            Bộ lọc
          </h5>

          <i
            className={`ri-arrow-${showFilter ? "up" : "down"}-s-line`}
            style={{ fontSize: 20 }}
          ></i>
        </Card.Header>
        <Collapse in={showFilter}>
          <div>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label>Tìm kiếm</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tìm theo tên, mô tả..."
                    value={filters.search}
                    onChange={handleSearch}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Thể loại</Form.Label>
                  <Form.Select
                    value={filters.category}
                    onChange={handleCategoryFilter}
                  >
                    <option value="">Tất cả thể loại</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryDisplayNames[cat]}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Quyền riêng tư</Form.Label>
                  <Form.Select
                    value={filters.visibility}
                    onChange={handleVisibilityFilter}
                  >
                    <option value="">Tất cả</option>
                    <option value="public">Công khai</option>
                    <option value="private">Riêng tư</option>
                    <option value="invite">Theo lời mời</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={handleStatusFilter}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Vô hiệu hóa</option>
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
                    <option value="memberCount-desc">Nhiều thành viên</option>
                    <option value="memberCount-asc">Ít thành viên</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
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
          <p className="mt-3">Đang tải danh sách nhóm...</p>
        </div>
      )}

      {/* Groups Table */}
      {!loading && (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th width="250">Nhóm</th>
                    <th>Mô tả</th>
                    <th>Thể loại</th>
                    <th>Thành viên</th>
                    <th>Quyền riêng tư</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th width="120">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="group-avatar me-3">
                            {group.avatar ? (
                              <Image
                                src={group.avatar}
                                alt={group.name}
                                className="rounded-circle"
                                width="20"
                                height="20"
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  border: "4px solid white",
                                  boxShadow: " 0 4px 12px rgba(0, 0, 0, 0.3)",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "20px", height: "20px" }}
                              >
                                <i className="ri-group-line text-muted"></i>
                              </div>
                            )}
                          </div>
                          <div>
                            <div
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "150px" }}
                            >
                              {group.name}
                            </div>
                            <small className="text-muted">
                              {group.owner?.username || "System"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div
                          className="text-truncate"
                          style={{ maxWidth: "200px" }}
                        >
                          {group.description || "Không có mô tả"}
                        </div>
                      </td>
                      <td>
                        <div>
                          {group.category &&
                            group.category.slice(0, 2).map((cat) => (
                              <Badge
                                key={cat}
                                bg="outline-primary"
                                className="me-1 mb-1"
                              >
                                {categoryDisplayNames[cat] || cat}
                              </Badge>
                            ))}
                          {group.category && group.category.length > 2 && (
                            <Badge bg="light" text="dark">
                              +{group.category.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">
                          {formatMemberCount(group.memberCount || 0)}
                        </div>
                        <small className="text-muted">thành viên</small>
                      </td>
                      <td>
                        <Badge
                          className={getVisibilityBadgeClass(group.visibility)}
                        >
                          {getVisibilityDisplayName(group.visibility)}
                        </Badge>
                      </td>
                      <td>
                        {new Date(group.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <Badge className={getStatusBadgeClass(group.active)}>
                          {getStatusText(group.active)}
                        </Badge>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleShowDetailModal(group)}
                            title="Xem chi tiết"
                          >
                            <i className="ri-information-line"></i>
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleShowGroupModal(group)}
                            title="Chỉnh sửa"
                          >
                            <i className="ri-edit-line"></i>
                          </Button>
                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() =>
                              handleToggleGroupStatus(group._id, group.active)
                            }
                            title={group.active ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            <i
                              className={
                                group.active ? "ri-eye-off-line" : "ri-eye-line"
                              }
                            ></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              handleDeleteGroup(group._id, group.name)
                            }
                            title="Xoá nhóm"
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
            Hiển thị {groups.length} trong tổng số {pagination.total} nhóm
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

      {/* Group Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={handleCloseModals}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroup && (
            <Row>
              <Col md={4} className="text-center">
                <div className="mb-3">
                  {selectedGroup.avatar ? (
                    <Image
                      src={selectedGroup.avatar}
                      alt={selectedGroup.name}
                      className="rounded-circle"
                      width="120"
                      height="120"
                    />
                  ) : (
                    <div
                      className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                      style={{ width: "120px", height: "120px" }}
                    >
                      <i
                        className="ri-group-line text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                    </div>
                  )}
                </div>
                <h4>{selectedGroup.name}</h4>
                <p className="text-muted">
                  Tạo bởi: {selectedGroup.owner?.username || "System"}
                </p>

                {selectedGroup.coverPhoto && (
                  <div className="mt-3">
                    <Image
                      src={selectedGroup.coverPhoto}
                      alt="Cover"
                      className="rounded"
                      fluid
                    />
                  </div>
                )}
              </Col>
              <Col md={8}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Mô tả</Form.Label>
                    <p>{selectedGroup.description || "Không có mô tả"}</p>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">
                      Quyền riêng tư
                    </Form.Label>
                    <p>
                      <Badge
                        className={getVisibilityBadgeClass(
                          selectedGroup.visibility
                        )}
                      >
                        {getVisibilityDisplayName(selectedGroup.visibility)}
                      </Badge>
                    </p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Label className="fw-semibold">
                      Số thành viên
                    </Form.Label>
                    <p>{selectedGroup.memberCount || 0}</p>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Trạng thái</Form.Label>
                    <p>
                      <Badge
                        className={getStatusBadgeClass(selectedGroup.active)}
                      >
                        {getStatusText(selectedGroup.active)}
                      </Badge>
                    </p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Số báo cáo</Form.Label>
                    <p>{selectedGroup.reportCount || 0}</p>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Số cảnh báo</Form.Label>
                    <p>{selectedGroup.warningCount || 0}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Ngày tạo</Form.Label>
                    <p>
                      {new Date(selectedGroup.createdAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">
                      Cập nhật cuối
                    </Form.Label>
                    <p>
                      {new Date(selectedGroup.updatedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </Col>
                </Row>
                {selectedGroup.tags && selectedGroup.tags.length > 0 && (
                  <div className="mb-3">
                    <Form.Label className="fw-semibold">Tags</Form.Label>
                    <div>
                      {selectedGroup.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          bg="outline-primary"
                          className="me-1 mb-1"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedGroup.emotionTags &&
                  selectedGroup.emotionTags.length > 0 && (
                    <div className="mb-3">
                      <Form.Label className="fw-semibold">
                        Emotion Tags
                      </Form.Label>
                      <div>
                        {selectedGroup.emotionTags.map((tag, index) => (
                          <Badge
                            key={index}
                            bg="outline-info"
                            className="me-1 mb-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedGroup.category &&
                  selectedGroup.category.length > 0 && (
                    <div className="mb-3">
                      <Form.Label className="fw-semibold">Thể loại</Form.Label>
                      <div>
                        {selectedGroup.category.map((cat, index) => (
                          <Badge key={index} bg="primary" className="me-1 mb-1">
                            {categoryDisplayNames[cat] || cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCloseModals();
              handleShowGroupModal(selectedGroup);
            }}
          >
            Chỉnh sửa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Group Form Modal */}
      <Modal
        show={showGroupModal}
        onHide={handleCloseModals}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "create" ? "Tạo nhóm mới" : "Chỉnh sửa nhóm"}
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={
            modalMode === "create" ? handleCreateGroup : handleUpdateGroup
          }
        >
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên nhóm *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={groupForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quyền riêng tư</Form.Label>
                  <Form.Select
                    name="visibility"
                    value={groupForm.visibility}
                    onChange={handleFormChange}
                  >
                    <option value="public">Công khai</option>
                    <option value="private">Riêng tư</option>
                    <option value="invite">Theo lời mời</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={groupForm.description}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Avatar</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  {avatarPreview && (
                    <div className="mt-2">
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        width="80"
                        height="80"
                        className="rounded"
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ảnh bìa</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                  {coverPreview && (
                    <div className="mt-2">
                      <Image
                        src={coverPreview}
                        alt="Cover preview"
                        height="80"
                        className="rounded w-100"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Thể loại (Chọn nhiều)</Form.Label>
              <Form.Select
                multiple
                name="category"
                value={groupForm.category}
                onChange={handleFormChange}
                size={4}
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryDisplayNames[cat]}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Giữ Ctrl để chọn nhiều thể loại
              </Form.Text>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags (phân cách bằng dấu phẩy)</Form.Label>
                  <Form.Control
                    type="text"
                    value={groupForm.tags.join(", ")}
                    onChange={handleTagsChange}
                    placeholder="tag1, tag2, tag3"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Emotion Tags (phân cách bằng dấu phẩy)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={groupForm.emotionTags.join(", ")}
                    onChange={handleEmotionTagsChange}
                    placeholder="happy, sad, excited"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModals}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === "create" ? "Tạo nhóm" : "Cập nhật"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        show={showStatsModal}
        onHide={handleCloseModals}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thống kê nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Phân bố theo thể loại</h6>
                </Card.Header>
                <Card.Body>
                  {stats.categoryDistribution &&
                  Object.keys(stats.categoryDistribution).length > 0 ? (
                    <ul className="list-unstyled mb-0">
                      {Object.entries(stats.categoryDistribution).map(
                        ([category, count]) => (
                          <li
                            key={category}
                            className="d-flex justify-content-between py-1"
                          >
                            <span>
                              {categoryDisplayNames[category] || category}
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
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Phân bố theo quyền riêng tư</h6>
                </Card.Header>
                <Card.Body>
                  {stats.visibilityDistribution &&
                  Object.keys(stats.visibilityDistribution).length > 0 ? (
                    <ul className="list-unstyled mb-0">
                      {Object.entries(stats.visibilityDistribution).map(
                        ([visibility, count]) => (
                          <li
                            key={visibility}
                            className="d-flex justify-content-between py-1"
                          >
                            <span>{getVisibilityDisplayName(visibility)}</span>
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
                  <h6 className="mb-0">Nhóm mới trong tháng</h6>
                </Card.Header>
                <Card.Body>
                  <div className="text-center">
                    <h3 className="text-primary">
                      {stats.newGroupsThisMonth || 0}
                    </h3>
                    <small className="text-muted">nhóm được tạo</small>
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
                  <h6 className="mb-0">Top nhóm có nhiều thành viên</h6>
                </Card.Header>
                <Card.Body>
                  {stats.topGroupsByMembers &&
                  stats.topGroupsByMembers.length > 0 ? (
                    <div className="table-responsive">
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th>Tên nhóm</th>
                            <th>Thành viên</th>
                            <th>Quyền riêng tư</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.topGroupsByMembers.slice(0, 5).map((group) => (
                            <tr key={group._id}>
                              <td
                                className="text-truncate"
                                style={{ maxWidth: "150px" }}
                              >
                                {group.name}
                              </td>
                              <td>{group.memberCount}</td>
                              <td>
                                <Badge
                                  className={getVisibilityBadgeClass(
                                    group.visibility
                                  )}
                                >
                                  {getVisibilityDisplayName(group.visibility)}
                                </Badge>
                              </td>
                              <td>
                                <Badge
                                  className={getStatusBadgeClass(group.active)}
                                >
                                  {getStatusText(group.active)}
                                </Badge>
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

export default AdminGroupManagement;
