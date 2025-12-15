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
} from "react-bootstrap";
import {
  Search,
  Filter,
  Users,
  MessageCircle,
  FileText,
  Trash2,
  Eye,
  Download,
  BarChart3,
  User,
  Hash,
  Calendar,
  Clock,
  File,
  Image as ImageIcon,
  Video,
  Music,
  MessageSquare,
  X,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import api from "../../../services/api";
import "./AdminChatManagement.css";

const AdminChatManagement = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [advancedStats, setAdvancedStats] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    searchId: "",
    searchUserA: "",
    searchUserB: "",
    type: "",
    hasMessages: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
    hasFiles: "",
    isActive: "",
  });

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // Selected data
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [messagesPagination, setMessagesPagination] = useState({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageFilters, setMessageFilters] = useState({
    messageType: "",
    hasFile: "",
    recalled: "",
  });

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/chats/conversations", {
        params: filters,
      });

      setConversations(response.data.data.conversations);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError("Không thể tải danh sách hộp thoại");
      console.error("Fetch conversations error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get("/api/admin/chats/stats");
      setStats(response.data.data);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  // Fetch advanced stats
  const fetchAdvancedStats = async () => {
    try {
      const response = await api.get("/api/admin/chats/stats/advanced");
      setAdvancedStats(response.data.data);
    } catch (err) {
      console.error("Fetch advanced stats error:", err);
    }
  };

  // Fetch conversation messages
  const fetchConversationMessages = async (conversationId, page = 1) => {
    try {
      setMessagesLoading(true);
      const response = await api.get(
        `/api/admin/chats/conversations/${conversationId}/messages`,
        {
          params: {
            page,
            limit: 50,
            ...messageFilters,
          },
        }
      );

      if (page === 1) {
        setConversationMessages(response.data.data.messages);
      } else {
        setConversationMessages((prev) => [
          ...response.data.data.messages,
          ...prev,
        ]);
      }

      setMessagesPagination(response.data.data.pagination);
    } catch (err) {
      setError("Không thể tải tin nhắn");
      console.error("Fetch messages error:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchStats();
  }, [fetchConversations]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleMessageFilterChange = (key, value) => {
    setMessageFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      searchId: "",
      searchUserA: "",
      searchUserB: "",
      type: "",
      hasMessages: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "updatedAt",
      sortOrder: "desc",
      hasFiles: "",
      isActive: "",
    });
  };

  const handleResetMessageFilters = () => {
    setMessageFilters({
      messageType: "",
      hasFile: "",
      recalled: "",
    });
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleShowDetail = (conversation) => {
    setSelectedConversation(conversation);
    setShowDetailModal(true);
  };

  const handleShowMessages = async (conversation) => {
    setSelectedConversation(conversation);
    setShowMessagesModal(true);
    await fetchConversationMessages(conversation._id);
  };

  const handleLoadMoreMessages = async () => {
    if (messagesPagination.hasMore && !messagesLoading) {
      await fetchConversationMessages(
        selectedConversation._id,
        messagesPagination.page + 1
      );
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await api.delete(`/api/admin/chats/conversations/${conversationId}`);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      fetchStats();
      fetchAdvancedStats();
    } catch (err) {
      setError("Không thể xoá hộp thoại");
      console.error("Delete conversation error:", err);
    }
  };

  // Apply message filters
  useEffect(() => {
    if (selectedConversation && showMessagesModal) {
      fetchConversationMessages(selectedConversation._id, 1);
    }
  }, [messageFilters]);

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const getMessageTypeIcon = (messageType) => {
    switch (messageType) {
      case "image":
        return <ImageIcon size={16} className="text-success" />;
      case "video":
        return <Video size={16} className="text-danger" />;
      case "audio":
        return <Music size={16} className="text-warning" />;
      case "file":
        return <File size={16} className="text-info" />;
      default:
        return <MessageSquare size={16} className="text-primary" />;
    }
  };

  const getMessageTypeBadge = (messageType) => {
    const types = {
      text: { label: "Văn bản", variant: "primary" },
      image: { label: "Hình ảnh", variant: "success" },
      video: { label: "Video", variant: "danger" },
      audio: { label: "Âm thanh", variant: "warning" },
      file: { label: "File", variant: "info" },
    };
    return types[messageType] || { label: messageType, variant: "secondary" };
  };

  const getConversationName = (conversation) => {
    if (conversation.isGroup) {
      return conversation.name || "Nhóm không tên";
    } else {
      const otherMember = conversation.members?.find(
        (m) => m._id !== conversation.createdBy?._id
      );
      return otherMember?.fullName || otherMember?.username || "Người dùng";
    }
  };

  const getConversationMembers = (conversation) => {
    if (conversation.isGroup) {
      return conversation.members || [];
    } else {
      return (
        conversation.members?.filter(
          (m) => m._id !== conversation.createdBy?._id
        ) || []
      );
    }
  };

  const highlightText = (text, search) => {
    if (!search || !text) return text;
    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  };

  const getActivityLevel = (conversation) => {
    const messageCount = conversation.messageCount || 0;
    if (messageCount > 100) return { level: "Cao", variant: "success" };
    if (messageCount > 50) return { level: "Trung bình", variant: "warning" };
    return { level: "Thấp", variant: "secondary" };
  };

  // Enhanced stats calculation
  const getEnhancedStats = () => {
    const total = conversations.length;
    const groups = conversations.filter((c) => c.isGroup).length;
    const direct = conversations.filter((c) => !c.isGroup).length;
    const active = conversations.filter(
      (c) => (c.messageCount || 0) > 0
    ).length;
    const withFiles = conversations.filter(
      (c) => c.lastMessage?.fileUrl
    ).length;

    return {
      total,
      groups,
      direct,
      active,
      withFiles,
      inactive: total - active,
    };
  };

  const enhancedStats = getEnhancedStats();

  return (
    <div className="admin-chat-management m-3">
      {/* Header */}
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 mb-2 text-primary">
              <MessageCircle className="me-2" size={32} />
              Quản lý Hộp thoại Tin nhắn
            </h1>
            <p className="text-muted mb-0">
              Quản lý và theo dõi tất cả cuộc trò chuyện trong hệ thống
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
              variant="outline-primary"
              onClick={() => setShowAdvancedStats(true)}
            >
              <Users size={16} className="me-2" />
              Phân tích
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Tổng hộp thoại</h6>
                  <h3 className="text-primary mb-1">{enhancedStats.total}</h3>
                  <div className="small text-muted">
                    <span className="text-success">
                      {enhancedStats.active} hoạt động
                    </span>
                  </div>
                </div>
                <div className="stats-icon bg-primary">
                  <MessageCircle size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Nhóm chat</h6>
                  <h3 className="text-success mb-1">{enhancedStats.groups}</h3>
                  <div className="small text-muted">
                    {Math.round(
                      (enhancedStats.groups / enhancedStats.total) * 100
                    )}
                    % tổng số
                  </div>
                </div>
                <div className="stats-icon bg-success">
                  <Users size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Cá nhân</h6>
                  <h3 className="text-info mb-1">{enhancedStats.direct}</h3>
                  <div className="small text-muted">
                    {Math.round(
                      (enhancedStats.direct / enhancedStats.total) * 100
                    )}
                    % tổng số
                  </div>
                </div>
                <div className="stats-icon bg-info">
                  <User size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Có file</h6>
                  <h3 className="text-warning mb-1">
                    {enhancedStats.withFiles}
                  </h3>
                  <div className="small text-muted">
                    {Math.round(
                      (enhancedStats.withFiles / enhancedStats.total) * 100
                    )}
                    % hộp thoại
                  </div>
                </div>
                <div className="stats-icon bg-warning">
                  <FileText size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Tin nhắn hôm nay</h6>
                  <h3 className="text-danger mb-1">
                    {stats.todayMessages || 0}
                  </h3>
                  <div className="small text-muted">
                    {stats.totalMessages
                      ? Math.round(
                          ((stats.todayMessages || 0) / stats.totalMessages) *
                            100
                        )
                      : 0}
                    % tổng số
                  </div>
                </div>
                <div className="stats-icon bg-danger">
                  <Clock size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stats-card fade-in">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted">Đang online</h6>
                  <h3 className="text-purple mb-1">
                    {conversations.reduce(
                      (sum, conv) => sum + (conv.onlineMembers || 0),
                      0
                    )}
                  </h3>
                  <div className="small text-muted">Thành viên</div>
                </div>
                <div className="stats-icon bg-purple">
                  <User size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Filters */}
      <Card className="filter-card">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <Filter size={20} className="me-2 text-primary" />
            Bộ lọc tìm kiếm
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Label>
                <Search size={14} className="me-1" />
                Tìm kiếm chung
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Tên hộp thoại, nội dung..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Label>
                <Hash size={14} className="me-1" />
                ID hộp thoại
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập ID..."
                value={filters.searchId}
                onChange={(e) => handleFilterChange("searchId", e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Label>
                <User size={14} className="me-1" />
                Người dùng A
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Username hoặc email..."
                value={filters.searchUserA}
                onChange={(e) =>
                  handleFilterChange("searchUserA", e.target.value)
                }
              />
            </Col>
            <Col md={2}>
              <Form.Label>
                <User size={14} className="me-1" />
                Người dùng B
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Username hoặc email..."
                value={filters.searchUserB}
                onChange={(e) =>
                  handleFilterChange("searchUserB", e.target.value)
                }
              />
            </Col>
            <Col md={3}>
              <Form.Label>Loại hộp thoại</Form.Label>
              <Row>
                <Col>
                  <Form.Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">Tất cả loại</option>
                    <option value="direct">Cá nhân</option>
                    <option value="group">Nhóm</option>
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Select
                    value={filters.hasFiles}
                    onChange={(e) =>
                      handleFilterChange("hasFiles", e.target.value)
                    }
                  >
                    <option value="">Tất cả file</option>
                    <option value="true">Có file</option>
                    <option value="false">Không có file</option>
                  </Form.Select>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row className="g-3 mt-2">
            <Col md={2}>
              <Form.Label>Từ ngày</Form.Label>
              <InputGroup>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Label>Đến ngày</Form.Label>
              <InputGroup>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </InputGroup>
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
                <option value="updatedAt-desc">Mới nhất</option>
                <option value="updatedAt-asc">Cũ nhất</option>
                <option value="createdAt-desc">Tạo mới nhất</option>
                <option value="createdAt-asc">Tạo cũ nhất</option>
                <option value="messageCount-desc">Tin nhắn nhiều nhất</option>
                <option value="messageCount-asc">Tin nhắn ít nhất</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={filters.isActive}
                onChange={(e) => handleFilterChange("isActive", e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Form.Select>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="outline-primary"
                className="w-100"
                onClick={handleResetFilters}
              >
                <X size={16} className="me-1" />
                Xóa lọc
              </Button>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="primary"
                className="w-100"
                onClick={fetchConversations}
              >
                <Search size={16} className="me-1" />
                Tìm kiếm
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Conversations Table */}
      <Card className="table-card">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <MessageCircle size={20} className="me-2 text-primary" />
            Danh sách hộp thoại ({pagination.total || 0})
          </h5>
          <div className="text-muted small">
            Trang {filters.page} / {pagination.pages || 1}
          </div>
        </Card.Header>
        <Card.Body className="p-0 position-relative">
          {loading && (
            <div className="loading-overlay">
              <div className="text-center">
                <Spinner animation="border" variant="primary" size="lg" />
                <p className="mt-2 text-muted">
                  Đang tải danh sách hộp thoại...
                </p>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th width="250" className="ps-4">
                    Hộp thoại
                  </th>
                  <th width="100">Loại</th>
                  <th width="120">Thành viên</th>
                  <th width="200">Tin nhắn cuối</th>
                  <th width="100">Số tin nhắn</th>
                  <th width="120">Hoạt động</th>
                  <th width="120">Ngày tạo</th>
                  <th width="120" className="text-center">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => {
                  const activity = getActivityLevel(conversation);
                  const members = getConversationMembers(conversation);

                  return (
                    <tr key={conversation._id} className="fade-in">
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div
                            className={`conversation-avatar me-3 ${
                              conversation.isGroup
                                ? "avatar-group"
                                : "avatar-direct"
                            }`}
                          >
                            {conversation.isGroup ? (
                              <Users size={20} />
                            ) : (
                              <User size={20} />
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold text-dark">
                              {getConversationName(conversation)}
                            </div>
                            <div className="conversation-meta">
                              <Badge
                                bg="outline-secondary"
                                className="meta-badge"
                              >
                                ID: {conversation._id.substring(0, 8)}...
                              </Badge>
                              {conversation.isGroup && (
                                <Badge
                                  bg="outline-primary"
                                  className="meta-badge"
                                >
                                  {conversation.members?.length} thành viên
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          bg={conversation.isGroup ? "primary" : "success"}
                          className="badge-custom"
                        >
                          {conversation.isGroup ? "Nhóm" : "Cá nhân"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            {members.slice(0, 2).map((member, index) => (
                              <Image
                                key={member._id}
                                src={
                                  member.profile?.avatar ||
                                  "/assets/images/default-avatar.png"
                                }
                                alt={member.fullName}
                                className="rounded-circle border border-white"
                                width="24"
                                height="24"
                                style={{
                                  marginLeft: index > 0 ? "-8px" : "0",
                                  zIndex: 2 - index,
                                }}
                              />
                            ))}
                            {members.length > 2 && (
                              <div
                                className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center small"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  marginLeft: "-8px",
                                  zIndex: 0,
                                }}
                              >
                                +{members.length - 2}
                              </div>
                            )}
                          </div>
                          <div className="small">
                            <div className="text-success">
                              {conversation.onlineMembers || 0} online
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {conversation.lastMessage ? (
                          <div>
                            <div className="d-flex align-items-center mb-1">
                              {getMessageTypeIcon(
                                conversation.lastMessage.messageType
                              )}
                              <span className="ms-2 small fw-medium">
                                {conversation.lastMessage.recalled ? (
                                  <span className="text-muted fst-italic">
                                    Tin nhắn đã thu hồi
                                  </span>
                                ) : (
                                  truncateText(
                                    conversation.lastMessage.content ||
                                      conversation.lastMessage.fileName,
                                    25
                                  )
                                )}
                              </span>
                            </div>
                            <div className="small text-muted">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted small">
                            Chưa có tin nhắn
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="text-center">
                          <Badge
                            bg="outline-primary"
                            className="fs-6 px-3 py-2"
                          >
                            {conversation.messageCount || 0}
                          </Badge>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Badge bg={activity.variant} className="me-2">
                            {activity.level}
                          </Badge>
                          {conversation.lastMessage && (
                            <div className="small text-muted">
                              {formatDate(conversation.lastMessage.createdAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div>{formatDate(conversation.createdAt)}</div>
                          <div className="text-muted">
                            {conversation.createdBy?.fullName}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-1">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleShowDetail(conversation)}
                            title="Xem chi tiết"
                            className="btn-icon"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowMessages(conversation)}
                            title="Xem tin nhắn"
                            className="btn-icon"
                          >
                            <MessageCircle size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setShowDeleteConfirm(true);
                            }}
                            title="Xoá hộp thoại"
                            className="btn-icon"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {conversations.length === 0 && !loading && (
            <div className="text-center py-5 text-muted">
              <MessageCircle size={48} className="mb-3 opacity-50" />
              <h5>Không tìm thấy hộp thoại nào</h5>
              <p>Thử thay đổi bộ lọc tìm kiếm để có kết quả phù hợp</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted">
            Hiển thị {conversations.length} trong tổng số {pagination.total} hộp
            thoại
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

      {/* Enhanced Conversation Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
        centered
        className="modal-enhanced"
      >
        <Modal.Header className="modal-header-enhanced">
          <Modal.Title>
            <MessageCircle size={24} className="me-2" />
            Chi tiết Hộp thoại
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedConversation && (
            <Row>
              <Col md={8}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex align-items-start mb-4">
                      <div
                        className={`conversation-avatar me-3 ${
                          selectedConversation.isGroup
                            ? "avatar-group"
                            : "avatar-direct"
                        }`}
                        style={{ width: "60px", height: "60px" }}
                      >
                        {selectedConversation.isGroup ? (
                          <Users size={28} />
                        ) : (
                          <User size={28} />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="text-dark mb-1">
                          {getConversationName(selectedConversation)}
                        </h4>
                        <div className="d-flex gap-2 mb-2">
                          <Badge
                            bg={
                              selectedConversation.isGroup
                                ? "primary"
                                : "success"
                            }
                          >
                            {selectedConversation.isGroup
                              ? "Nhóm Chat"
                              : "Trò chuyện Cá nhân"}
                          </Badge>
                          <Badge bg="outline-secondary">
                            ID: {selectedConversation._id}
                          </Badge>
                        </div>
                        {selectedConversation.isGroup &&
                          selectedConversation.description && (
                            <p className="text-muted mb-0">
                              {selectedConversation.description}
                            </p>
                          )}
                      </div>
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <div className="stat-item">
                          <div className="stat-value text-primary">
                            {selectedConversation.messageCount || 0}
                          </div>
                          <div className="stat-label">Tổng tin nhắn</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="stat-item">
                          <div className="stat-value text-success">
                            {selectedConversation.totalMembers}
                          </div>
                          <div className="stat-label">Thành viên</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="stat-item">
                          <div className="stat-value text-warning">
                            {selectedConversation.onlineMembers || 0}
                          </div>
                          <div className="stat-label">Đang online</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="stat-item">
                          <div className="stat-value text-info">
                            {selectedConversation.lastMessage ? "Có" : "Không"}
                          </div>
                          <div className="stat-label">Tin nhắn gần nhất</div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Members Section */}
                {selectedConversation.members &&
                  selectedConversation.members.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-white">
                        <h6 className="mb-0">
                          <Users size={18} className="me-2 text-primary" />
                          Thành viên ({selectedConversation.members.length})
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          {selectedConversation.members.map((member) => (
                            <Col md={6} key={member._id} className="mb-3">
                              <div className="d-flex align-items-center">
                                <Image
                                  src={
                                    member.profile?.avatar ||
                                    "/assets/images/default-avatar.png"
                                  }
                                  alt={member.fullName}
                                  className="rounded-circle me-3"
                                  width="40"
                                  height="40"
                                />
                                <div className="flex-grow-1">
                                  <div className="fw-medium text-dark">
                                    {member.fullName}
                                  </div>
                                  <div className="small text-muted">
                                    {member.email}
                                  </div>
                                  <div className="small">
                                    <Badge
                                      bg={
                                        member.isOnline
                                          ? "success"
                                          : "secondary"
                                      }
                                      className={
                                        member.isOnline
                                          ? "badge-online"
                                          : "badge-offline"
                                      }
                                    >
                                      {member.isOnline ? "Online" : "Offline"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Card>
                  )}
              </Col>
              <Col md={4}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">
                      <Calendar size={18} className="me-2 text-primary" />
                      Thông tin thời gian
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <strong>Ngày tạo:</strong>
                      <div className="text-dark mt-1">
                        {formatDate(selectedConversation.createdAt)}
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>Cập nhật lần cuối:</strong>
                      <div className="text-dark mt-1">
                        {formatDate(selectedConversation.updatedAt)}
                      </div>
                    </div>
                    {selectedConversation.lastMessage && (
                      <div className="mb-3">
                        <strong>Tin nhắn cuối:</strong>
                        <div className="text-dark mt-1">
                          {formatDate(
                            selectedConversation.lastMessage.createdAt
                          )}
                        </div>
                      </div>
                    )}
                    {selectedConversation.createdBy && (
                      <div>
                        <strong>Người tạo:</strong>
                        <div className="d-flex align-items-center mt-2">
                          <Image
                            src={
                              selectedConversation.createdBy.profile?.avatar ||
                              "/assets/images/default-avatar.png"
                            }
                            alt={selectedConversation.createdBy.fullName}
                            className="rounded-circle me-2"
                            width="32"
                            height="32"
                          />
                          <span className="fw-medium">
                            {selectedConversation.createdBy.fullName}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">
                      <BarChart3 size={18} className="me-2 text-primary" />
                      Phân tích hoạt động
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small">Mức độ hoạt động</span>
                        <span className="small fw-medium">
                          {getActivityLevel(selectedConversation).level}
                        </span>
                      </div>
                      <ProgressBar
                        variant={getActivityLevel(selectedConversation).variant}
                        now={
                          selectedConversation.messageCount > 100
                            ? 100
                            : selectedConversation.messageCount > 50
                            ? 66
                            : selectedConversation.messageCount > 10
                            ? 33
                            : 10
                        }
                      />
                    </div>
                    <div className="small text-muted">
                      <div>
                        • {selectedConversation.messageCount || 0} tin nhắn
                      </div>
                      <div>
                        • {selectedConversation.onlineMembers || 0} thành viên
                        online
                      </div>
                      <div>
                        •{" "}
                        {selectedConversation.lastMessage
                          ? "Đang hoạt động"
                          : "Không hoạt động"}
                      </div>
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
          <Button
            variant="primary"
            onClick={() => {
              setShowDetailModal(false);
              handleShowMessages(selectedConversation);
            }}
          >
            <MessageCircle size={16} className="me-2" />
            Xem Tin nhắn
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Messages Modal */}
      <Modal
        show={showMessagesModal}
        onHide={() => setShowMessagesModal(false)}
        size="xl"
        centered
        scrollable
        className="modal-enhanced"
      >
        <Modal.Header className="modal-header-enhanced">
          <Modal.Title>
            <MessageCircle size={24} className="me-2" />
            Tin nhắn -{" "}
            {selectedConversation && getConversationName(selectedConversation)}
          </Modal.Title>
        </Modal.Header>

        {/* Message Filters */}
        <div className="bg-light border-bottom p-3">
          <Row className="g-2 align-items-center">
            <Col md={3}>
              <small className="text-muted fw-medium">Lọc tin nhắn:</small>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={messageFilters.messageType}
                onChange={(e) =>
                  handleMessageFilterChange("messageType", e.target.value)
                }
              >
                <option value="">Tất cả loại</option>
                <option value="text">Văn bản</option>
                <option value="image">Hình ảnh</option>
                <option value="video">Video</option>
                <option value="audio">Âm thanh</option>
                <option value="file">File</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={messageFilters.hasFile}
                onChange={(e) =>
                  handleMessageFilterChange("hasFile", e.target.value)
                }
              >
                <option value="">Tất cả file</option>
                <option value="true">Có file</option>
                <option value="false">Không có file</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={messageFilters.recalled}
                onChange={(e) =>
                  handleMessageFilterChange("recalled", e.target.value)
                }
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đã thu hồi</option>
                <option value="false">Chưa thu hồi</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={handleResetMessageFilters}
                className="w-100"
              >
                <X size={14} className="me-1" />
                Xóa lọc
              </Button>
            </Col>
          </Row>
        </div>

        <Modal.Body style={{ maxHeight: "70vh" }}>
          {messagesLoading && conversationMessages.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Đang tải tin nhắn...</p>
            </div>
          ) : (
            <div
              className="messages-container"
              onScroll={(e) => {
                const { scrollTop } = e.target;
                if (
                  scrollTop === 0 &&
                  messagesPagination.hasMore &&
                  !messagesLoading
                ) {
                  handleLoadMoreMessages();
                }
              }}
            >
              {messagesLoading && (
                <div className="text-center py-3 bg-light rounded mb-3">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <small className="text-muted ms-2">
                    Đang tải thêm tin nhắn...
                  </small>
                </div>
              )}

              {messagesPagination.hasMore && !messagesLoading && (
                <div className="text-center py-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleLoadMoreMessages}
                  >
                    <ChevronUp size={14} className="me-1" />
                    Tải thêm tin nhắn cũ
                  </Button>
                </div>
              )}

              {conversationMessages.map((message) => (
                <div
                  key={message._id}
                  className={`message-item p-3 ${
                    message.recalled ? "bg-warning bg-opacity-10" : "bg-white"
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <Image
                        src={
                          message.sender?.profile?.avatar ||
                          "/assets/images/default-avatar.png"
                        }
                        alt={message.sender?.fullName}
                        className="rounded-circle me-3"
                        width="40"
                        height="40"
                      />
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <strong className="text-dark">
                            {message.sender?.fullName}
                          </strong>
                          {message.recalled && (
                            <Badge bg="warning" className="badge-recalled">
                              <Clock size={12} className="me-1" />
                              Đã thu hồi
                            </Badge>
                          )}
                        </div>
                        <div className="small text-muted">
                          {formatDate(message.createdAt)}
                          {message.isReadBy && message.isReadBy.length > 0 && (
                            <span className="ms-2 text-success">
                              ✓ Đã xem ({message.isReadBy.length})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge
                        bg={getMessageTypeBadge(message.messageType).variant}
                        className="d-flex align-items-center gap-1"
                      >
                        {getMessageTypeIcon(message.messageType)}
                        {getMessageTypeBadge(message.messageType).label}
                      </Badge>
                    </div>
                  </div>

                  {/* Replied message */}
                  {message.repliedTo && (
                    <div className="reply-preview p-3 mb-3">
                      <div className="d-flex align-items-start">
                        <i className="ri-reply-line text-primary me-2 mt-1"></i>
                        <div className="flex-grow-1">
                          <small className="text-muted fw-bold d-block mb-1">
                            Trả lời {message.repliedTo.sender?.fullName}
                          </small>
                          <div className="text-truncate">
                            {message.repliedTo.recalled ? (
                              <span className="text-muted fst-italic">
                                Tin nhắn đã thu hồi
                              </span>
                            ) : (
                              message.repliedTo.content ||
                              (message.repliedTo.fileUrl ? (
                                <span className="text-muted d-flex align-items-center gap-1">
                                  {getMessageTypeIcon(
                                    message.repliedTo.messageType
                                  )}
                                  {message.repliedTo.fileName}
                                </span>
                              ) : (
                                "Tin nhắn"
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  {message.recalled ? (
                    <div className="text-center py-3 text-muted fst-italic bg-light rounded">
                      <Clock size={20} className="me-2" />
                      Tin nhắn đã được thu hồi
                    </div>
                  ) : (
                    <>
                      {message.content && (
                        <div className="message-content mb-3 p-3 bg-light rounded">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: highlightText(
                                message.content,
                                filters.search
                              ),
                            }}
                          />
                        </div>
                      )}

                      {message.fileUrl && (
                        <div className="message-file mb-3">
                          {message.messageType === "image" ? (
                            <div className="text-center">
                              <Image
                                src={message.fileUrl}
                                alt={message.fileName}
                                className="img-fluid rounded shadow-sm"
                                style={{ maxHeight: "300px", maxWidth: "100%" }}
                              />
                              {message.fileName && (
                                <div className="mt-2 small">
                                  <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-decoration-none"
                                  >
                                    <Download size={14} className="me-1" />
                                    {message.fileName}
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="d-flex align-items-center p-3 bg-light rounded">
                              <div className="me-3">
                                {getMessageTypeIcon(message.messageType)}
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-bold text-dark">
                                  {message.fileName}
                                </div>
                                {message.fileSize && (
                                  <div className="text-muted small">
                                    {formatFileSize(message.fileSize)}
                                  </div>
                                )}
                              </div>
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                              >
                                <Download size={14} className="me-1" />
                                Tải xuống
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Message metadata */}
                  {message.deletedFor && message.deletedFor.length > 0 && (
                    <div className="message-meta mt-2 pt-2 border-top">
                      <Badge bg="secondary" className="badge-deleted small">
                        <Trash2 size={12} className="me-1" />
                        Đã xoá cho {message.deletedFor.length} người
                      </Badge>
                    </div>
                  )}
                </div>
              ))}

              {conversationMessages.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <MessageCircle size={48} className="mb-3 opacity-50" />
                  <h5>Không có tin nhắn nào</h5>
                  <p>
                    Chưa có tin nhắn nào trong hộp thoại này hoặc không phù hợp
                    với bộ lọc
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light d-flex justify-content-between">
          <div className="flex-grow-1">
            <small className="text-muted">
              Hiển thị {conversationMessages.length} tin nhắn
              {messagesPagination.hasMore &&
                " • Cuộn lên đầu để tải thêm tin nhắn cũ"}
            </small>
          </div>
          <Button variant="primary" onClick={() => setShowMessagesModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Stats Modal */}
      <Modal
        show={showStatsModal}
        onHide={() => setShowStatsModal(false)}
        size="xl"
        centered
        className="modal-enhanced"
      >
        <Modal.Header className="modal-header-enhanced">
          <Modal.Title>
            <BarChart3 size={24} className="me-2" />
            Thống kê Hệ thống Chat
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Phân bố loại tin nhắn</h6>
                </Card.Header>
                <Card.Body>
                  {stats.messageTypeDistribution &&
                  stats.messageTypeDistribution.length > 0 ? (
                    <div>
                      {stats.messageTypeDistribution.map((item) => (
                        <div key={item._id} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="d-flex align-items-center gap-2">
                              {getMessageTypeIcon(item._id)}
                              {getMessageTypeBadge(item._id).label}
                            </span>
                            <span className="fw-semibold">{item.count}</span>
                          </div>
                          <ProgressBar
                            variant={getMessageTypeBadge(item._id).variant}
                            now={(item.count / stats.totalMessages) * 100}
                          />
                          <div className="small text-muted text-end">
                            {Math.round(
                              (item.count / stats.totalMessages) * 100
                            )}
                            %
                          </div>
                        </div>
                      ))}
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
                  <h6 className="mb-0">Hộp thoại nhiều tin nhắn nhất</h6>
                </Card.Header>
                <Card.Body>
                  {stats.topConversations &&
                  stats.topConversations.length > 0 ? (
                    <div className="table-responsive">
                      <Table size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Hộp thoại</th>
                            <th className="text-center">Số tin nhắn</th>
                            <th>Tin nhắn cuối</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.topConversations.map((conv) => (
                            <tr key={conv._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {conv.isGroup ? (
                                    <Users
                                      size={16}
                                      className="me-2 text-primary"
                                    />
                                  ) : (
                                    <User
                                      size={16}
                                      className="me-2 text-success"
                                    />
                                  )}
                                  <span
                                    className="text-truncate"
                                    style={{ maxWidth: "120px" }}
                                  >
                                    {conv.name || "Trò chuyện cá nhân"}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center">
                                <Badge bg="primary">{conv.messageCount}</Badge>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {conv.lastMessage
                                    ? formatDate(conv.lastMessage)
                                    : "N/A"}
                                </small>
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

          <Row className="mt-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Tổng quan hoạt động</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="text-center">
                      <div className="stat-value text-primary">
                        {stats.totalConversations || 0}
                      </div>
                      <div className="stat-label">Tổng hộp thoại</div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="stat-value text-success">
                        {stats.totalMessages || 0}
                      </div>
                      <div className="stat-label">Tổng tin nhắn</div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="stat-value text-info">
                        {stats.messagesWithFiles || 0}
                      </div>
                      <div className="stat-label">Tin nhắn có file</div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="stat-value text-warning">
                        {stats.recalledMessages || 0}
                      </div>
                      <div className="stat-label">Tin nhắn đã thu hồi</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="primary" onClick={() => setShowStatsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Advanced Stats Modal */}
      <Modal
        show={showAdvancedStats}
        onHide={() => setShowAdvancedStats(false)}
        size="xl"
        centered
        className="modal-enhanced"
      >
        <Modal.Header className="modal-header-enhanced">
          <Modal.Title>
            <BarChart3 size={24} className="me-2" />
            Phân tích Nâng cao
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {/* Stats Overview */}
          <Row className="mb-4">
            <Col md={3}>
              <div className="stat-item text-center">
                <div className="stat-value text-primary">
                  {advancedStats.totalUsers || 0}
                </div>
                <div className="stat-label">Người dùng</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item text-center">
                <div className="stat-value text-success">
                  {advancedStats.avgMessagesPerUser || 0}
                </div>
                <div className="stat-label">TB tin nhắn/người</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item text-center">
                <div className="stat-value text-info">
                  {advancedStats.peakHour || "N/A"}
                </div>
                <div className="stat-label">Giờ cao điểm</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item text-center">
                <div className="stat-value text-warning">
                  {advancedStats.avgResponseTime || "0"} phút
                </div>
                <div className="stat-label">TB thời gian phản hồi</div>
              </div>
            </Col>
          </Row>

          <Row>
            {/* Biểu đồ phân bố thời gian */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Phân bố tin nhắn theo giờ</h6>
                  <Badge bg="primary">
                    {advancedStats.hourlyActivity?.length || 0} giờ
                  </Badge>
                </Card.Header>
                <Card.Body>
                  {advancedStats.hourlyActivity &&
                  advancedStats.hourlyActivity.length > 0 ? (
                    <div className="hourly-chart">
                      {advancedStats.hourlyActivity.map((hourData, index) => {
                        const maxCount = Math.max(
                          ...advancedStats.hourlyActivity.map((h) => h.count)
                        );
                        const percentage = (hourData.count / maxCount) * 100;

                        return (
                          <div key={index} className="hour-row mb-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small text-muted">
                                {hourData._id.toString().padStart(2, "0")}:00 -{" "}
                                {hourData._id.toString().padStart(2, "0")}:59
                              </span>
                              <span className="small fw-semibold">
                                {hourData.count} tin nhắn
                              </span>
                            </div>
                            <ProgressBar
                              now={percentage}
                              variant={
                                hourData.count > maxCount * 0.7
                                  ? "success"
                                  : hourData.count > maxCount * 0.4
                                  ? "warning"
                                  : "info"
                              }
                              style={{ height: "8px" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <BarChart3 size={48} className="mb-3 opacity-50" />
                      <p>Không có dữ liệu phân bố theo giờ</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Top người dùng tích cực */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Top người dùng tích cực</h6>
                  <Badge bg="success">Top 10</Badge>
                </Card.Header>
                <Card.Body>
                  {advancedStats.topUsers &&
                  advancedStats.topUsers.length > 0 ? (
                    <div className="top-users-list">
                      {advancedStats.topUsers.map((user, index) => (
                        <div
                          key={user._id}
                          className="user-item d-flex align-items-center mb-3 p-2 bg-light rounded"
                        >
                          <div className="position-relative me-3">
                            <Image
                              src={
                                user.avatar ||
                                "/assets/images/default-avatar.png"
                              }
                              alt={user.fullName}
                              className="rounded-circle"
                              width="40"
                              height="40"
                            />
                            <Badge
                              bg={
                                index === 0
                                  ? "warning"
                                  : index === 1
                                  ? "secondary"
                                  : index === 2
                                  ? "danger"
                                  : "dark"
                              }
                              className="position-absolute top-0 start-100 translate-middle"
                              style={{ fontSize: "0.6rem" }}
                            >
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold text-dark">
                              {user.fullName}
                            </div>
                            <div className="small text-muted">
                              @{user.username}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-primary">
                              {user.messageCount}
                            </div>
                            <div className="small text-muted">tin nhắn</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <Users size={48} className="mb-3 opacity-50" />
                      <p>Không có dữ liệu người dùng</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Additional Charts Row */}
          <Row className="mt-4">
            {/* Phân bố theo ngày trong tuần */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Phân bố theo ngày trong tuần</h6>
                </Card.Header>
                <Card.Body>
                  {advancedStats.weeklyActivity &&
                  advancedStats.weeklyActivity.length > 0 ? (
                    <div className="weekly-chart">
                      {advancedStats.weeklyActivity.map((dayData, index) => {
                        const dayNames = [
                          "Chủ Nhật",
                          "Thứ 2",
                          "Thứ 3",
                          "Thứ 4",
                          "Thứ 5",
                          "Thứ 6",
                          "Thứ 7",
                        ];
                        const maxCount = Math.max(
                          ...advancedStats.weeklyActivity.map((d) => d.count)
                        );
                        const percentage = (dayData.count / maxCount) * 100;

                        return (
                          <div key={index} className="day-row mb-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small fw-medium">
                                {dayNames[dayData._id - 1]}
                              </span>
                              <span className="small text-muted">
                                {dayData.count} tin nhắn
                              </span>
                            </div>
                            <ProgressBar
                              now={percentage}
                              variant={
                                dayData.count > maxCount * 0.7
                                  ? "primary"
                                  : dayData.count > maxCount * 0.4
                                  ? "info"
                                  : "outline-primary"
                              }
                              style={{ height: "6px" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted">
                      <Calendar size={32} className="mb-2 opacity-50" />
                      <p className="small mb-0">Không có dữ liệu theo ngày</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Thống kê loại tin nhắn */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Phân bố loại tin nhắn</h6>
                </Card.Header>
                <Card.Body>
                  {advancedStats.messageTypeStats &&
                  advancedStats.messageTypeStats.length > 0 ? (
                    <div className="message-type-stats">
                      {advancedStats.messageTypeStats.map((typeData, index) => {
                        const total = advancedStats.messageTypeStats.reduce(
                          (sum, item) => sum + item.count,
                          0
                        );
                        const percentage = (
                          (typeData.count / total) *
                          100
                        ).toFixed(1);

                        return (
                          <div
                            key={typeData._id}
                            className="type-item d-flex align-items-center justify-content-between mb-2 p-2 border rounded"
                          >
                            <div className="d-flex align-items-center">
                              {getMessageTypeIcon(typeData._id)}
                              <span className="ms-2 small fw-medium">
                                {getMessageTypeBadge(typeData._id).label}
                              </span>
                            </div>
                            <div className="text-end">
                              <div className="fw-semibold">
                                {typeData.count}
                              </div>
                              <div className="small text-muted">
                                {percentage}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted">
                      <FileText size={32} className="mb-2 opacity-50" />
                      <p className="small mb-0">
                        Không có dữ liệu loại tin nhắn
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Conversation Insights */}
          <Row className="mt-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Thông tin chi tiết hộp thoại</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="text-center p-3">
                        <div className="fs-2 text-primary mb-1">
                          {advancedStats.avgConversationLength || 0}
                        </div>
                        <div className="small text-muted">
                          TB tin nhắn/hộp thoại
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3">
                        <div className="fs-2 text-success mb-1">
                          {advancedStats.mostActiveConversation?.messageCount ||
                            0}
                        </div>
                        <div className="small text-muted">
                          Hộp thoại tích cực nhất
                          {advancedStats.mostActiveConversation && (
                            <div className="fw-medium mt-1">
                              {truncateText(
                                advancedStats.mostActiveConversation.name ||
                                  "Trò chuyện cá nhân",
                                20
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3">
                        <div className="fs-2 text-info mb-1">
                          {advancedStats.medianResponseTime || 0}p
                        </div>
                        <div className="small text-muted">
                          Thời gian phản hồi trung bình
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light d-flex justify-content-between">
          <div className="text-muted small">
            Cập nhật lần cuối: {formatDate(new Date().toISOString())}
          </div>
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={fetchAdvancedStats}
            >
              <RefreshCw size={14} className="me-1" />
              Làm mới
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAdvancedStats(false)}
            >
              Đóng
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        className="modal-enhanced"
      >
        <Modal.Header className="modal-header-enhanced">
          <Modal.Title>
            <Trash2 size={24} className="me-2" />
            Xác nhận xoá
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="text-center mb-4">
            <Trash2 size={48} className="text-danger mb-3" />
            <h5>Bạn có chắc chắn muốn xoá hộp thoại này?</h5>
          </div>
          <Alert variant="danger">
            <Alert.Heading>
              <Trash2 size={20} className="me-2" />
              Cảnh báo quan trọng
            </Alert.Heading>
            <p className="mb-0">
              Tất cả{" "}
              <strong>
                {selectedConversation?.messageCount || 0} tin nhắn
              </strong>{" "}
              trong hộp thoại này sẽ bị xoá vĩnh viễn và không thể khôi phục.
              Hành động này sẽ ảnh hưởng đến tất cả thành viên tham gia hộp
              thoại.
            </p>
          </Alert>
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
            onClick={() => handleDeleteConversation(selectedConversation._id)}
          >
            <Trash2 size={16} className="me-2" />
            Xoá hộp thoại
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
            <i className="ri-error-warning-line me-2"></i>
            Có lỗi xảy ra
          </Alert.Heading>
          {error}
        </Alert>
      )}
    </div>
  );
};

export default AdminChatManagement;
