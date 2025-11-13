import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Dropdown,
  Badge,
  Card,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import {
  getAllAppeals,
  updateAppealStatus,
} from "../../../services/adminService";

const AppealManagement = () => {
  const [appeals, setAppeals] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  });

  // State cho bộ lọc
  const [filters, setFilters] = useState({
    status: "all",
    appealStatus: "all",
    targetType: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
    appealId: "",
    violationId: "",
  });

  const limit = 10;
  const isFetchingRef = useRef(false);
  const filtersRef = useRef(filters);

  // Cập nhật ref khi filters thay đổi
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Danh sách hành động cho kháng nghị
  const appealActions = [
    {
      value: "approved",
      label: "Chấp thuận kháng nghị",
      description: "Chấp thuận và khôi phục nội dung",
      icon: "bi-check-circle",
      variant: "success",
    },
    {
      value: "rejected",
      label: "Từ chối kháng nghị",
      description: "Giữ nguyên quyết định trước đó",
      icon: "bi-x-circle",
      variant: "danger",
    },
  ];

  // Hành động khôi phục theo loại
  const restoreActions = {
    Post: [{ value: "unblock_post", label: "Mở khóa bài viết" }],
    Comment: [{ value: "unblock_comment", label: "Mở khóa bình luận" }],
    User: [{ value: "unban_user", label: "Mở khóa tài khoản" }],
    Group: [{ value: "unblock_group", label: "Mở khóa nhóm" }],
  };

  const fetchAppeals = useCallback(
    async (pageToFetch = 1, filterParams = null) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      try {
        const currentFilters = filterParams || filtersRef.current;

        if (pageToFetch === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError("");
        setSuccessMessage("");

        const params = {
          page: pageToFetch,
          limit,
          ...currentFilters,
        };

        console.log("Fetching appeals with params:", params);
        const res = await getAllAppeals(params);

        if (res?.success) {
          const newAppeals = res.data?.appeals || [];
          if (pageToFetch === 1) {
            setAppeals(newAppeals);
          } else {
            setAppeals((prev) => [...prev, ...newAppeals]);
          }

          if (res.data?.stats) {
            setStats(res.data.stats);
          }

          setHasMore(newAppeals.length >= limit);
        } else {
          if (pageToFetch === 1) {
            setAppeals([]);
          }
          setHasMore(false);
        }
      } catch (err) {
        console.error("Error fetching appeals:", err);
        setError(
          err?.response?.data?.message || err?.toString() || "Có lỗi xảy ra"
        );
        if (pageToFetch === 1) {
          setAppeals([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [limit]
  );

  // Effect cho phân trang - chỉ chạy khi component mount
  useEffect(() => {
    fetchAppeals(1);
    setPage(1);
  }, []); // Empty dependency array

  // Effect riêng cho filters - chạy khi filters thay đổi
  useEffect(() => {
    setPage(1);
    fetchAppeals(1, filters);
  }, [filters, fetchAppeals]);

  // Intersection Observer với cleanup proper
  const observer = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return;

    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading &&
          !isFetchingRef.current
        ) {
          setPage((prev) => {
            const nextPage = prev + 1;
            console.log("Loading more, page:", nextPage);
            fetchAppeals(nextPage);
            return nextPage;
          });
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.current = currentObserver;
    currentObserver.observe(sentinelRef.current);

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, fetchAppeals]);

  // Xử lý thay đổi bộ lọc với debounce
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchAppeals(1, filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: "all",
      appealStatus: "all",
      targetType: "all",
      dateFrom: "",
      dateTo: "",
      search: "",
      appealId: "",
      violationId: "",
    };
    setFilters(resetFilters);
    // Không cần gọi fetchAppeals ở đây vì useEffect của filters sẽ tự động chạy
  };

  // Xử lý mở modal chi tiết
  const handleShowDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setShowModal(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppeal(null);
  };

  // Xử lý cập nhật trạng thái kháng nghị
  const handleUpdateAppealStatus = async (
    appealId,
    status,
    actionTaken = null,
    appealNotes = ""
  ) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const updateData = {
        status: status,
        appealNotes: appealNotes,
      };

      if (actionTaken) {
        updateData.actionTaken = actionTaken;
      }

      const res = await updateAppealStatus(appealId, updateData);

      if (res?.success) {
        const statusText = getAppealStatusText(status);
        setSuccessMessage(`Đã ${statusText.toLowerCase()} kháng nghị`);

        // Cập nhật lại danh sách
        setAppeals((prev) =>
          prev.map((appeal) =>
            appeal._id === appealId
              ? {
                  ...appeal,
                  appeal: {
                    ...appeal.appeal,
                    appealStatus: status,
                    appealNotes: appealNotes,
                    appealReviewedBy: res.data.appealReviewedBy,
                    appealReviewedAt: new Date(),
                  },
                  status: res.data.status,
                  actionTaken: actionTaken || appeal.actionTaken,
                }
              : appeal
          )
        );

        // Cập nhật selected appeal nếu đang mở modal
        if (selectedAppeal && selectedAppeal._id === appealId) {
          setSelectedAppeal(res.data);
        }

        // Cập nhật stats
        setStats((prev) => ({
          ...prev,
          [status]: (prev[status] || 0) + 1,
          pending:
            status !== "pending"
              ? Math.max(0, (prev.pending || 0) - 1)
              : prev.pending,
        }));

        // Tự động ẩn thông báo sau 3s
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(res?.message || "Có lỗi xảy ra khi cập nhật");
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.toString() ||
          "Có lỗi xảy ra khi cập nhật"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge class
  const getAppealStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning text-dark";
      case "approved":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      case "cancelled":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  // Get target type badge class
  const getTargetTypeBadgeClass = (targetType) => {
    switch (targetType) {
      case "Post":
        return "bg-primary";
      case "Comment":
        return "bg-info";
      case "User":
        return "bg-success";
      case "Group":
        return "bg-purple";
      default:
        return "bg-secondary";
    }
  };

  // Get status text
  const getAppealStatusText = (status) => {
    const statusMap = {
      pending: "Đang chờ",
      approved: "Chấp thuận",
      rejected: "Từ chối",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  // Get target type text
  const getTargetTypeText = (targetType) => {
    const typeMap = {
      Post: "Bài viết",
      Comment: "Bình luận",
      User: "Người dùng",
      Group: "Nhóm",
      Message: "Tin nhắn",
    };
    return typeMap[targetType] || targetType;
  };

  // Render target preview
  const renderTargetPreview = (appeal) => {
    const { targetType, targetId } = appeal;

    if (!targetId) return <div className="text-muted">Không có thông tin</div>;

    switch (targetType) {
      case "Post":
        return (
          <div>
            <strong>Bài viết:</strong>
            <div className="mt-1 p-2 bg-light rounded">
              {targetId.content ? (
                <div className="text-truncate">{targetId.content}</div>
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
            {targetId.isBlocked && (
              <Badge bg="danger" className="mt-1">
                <i className="bi bi-lock me-1"></i>Đã bị chặn
              </Badge>
            )}
          </div>
        );

      case "Comment":
        return (
          <div>
            <strong>Bình luận:</strong>
            <div className="mt-1 p-2 bg-light rounded">
              {targetId.content ? (
                <div>{targetId.content}</div>
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
            {targetId.isBlocked && (
              <Badge bg="danger" className="mt-1">
                <i className="bi bi-lock me-1"></i>Đã bị chặn
              </Badge>
            )}
          </div>
        );

      case "User":
        return (
          <div className="d-flex align-items-center">
            {targetId.profile?.avatar && (
              <img
                src={targetId.profile.avatar}
                alt={targetId.username}
                className="rounded-circle me-3"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
            )}
            <div>
              <div className="fw-semibold">{targetId.username}</div>
              <div className="text-muted small">{targetId.email}</div>
              {!targetId.active && (
                <Badge bg="danger" className="mt-1">
                  <i className="bi bi-person-x me-1"></i>Đã bị khóa
                </Badge>
              )}
            </div>
          </div>
        );

      case "Group":
        return (
          <div className="d-flex align-items-start">
            {targetId.avatar && (
              <img
                src={targetId.avatar}
                alt={targetId.name}
                className="rounded me-3"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
            )}
            <div>
              <div className="fw-semibold">{targetId.name}</div>
              <div className="text-muted small">{targetId.description}</div>
              <div className="mt-1">
                <Badge bg="info" className="me-1">
                  <i className="bi bi-people me-1"></i>
                  {targetId.memberCount || 0} thành viên
                </Badge>
                {!targetId.active && (
                  <Badge bg="danger">
                    <i className="bi bi-lock me-1"></i>Đã bị khóa
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-muted">Không có thông tin</div>;
    }
  };

  // Thêm hàm formatFileSize
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mt-4">
      {/* Header với thống kê */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h4 mb-0">
              <i className="bi bi-megaphone me-2"></i>Quản lý Kháng nghị
            </h2>
            <div className="text-muted small">
              <i className="bi bi-list-check me-1"></i>Tổng số: {appeals.length}{" "}
              kháng nghị
            </div>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="col-12">
          <Row className="g-3">
            <Col md={3}>
              <Card className="border-warning">
                <Card.Body className="py-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-warning fw-bold fs-4">
                        {stats.pending || 0}
                      </div>
                      <div className="text-muted small">Đang chờ xử lý</div>
                    </div>
                    <div className="text-warning">
                      <i className="bi bi-clock-history fs-2"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-success">
                <Card.Body className="py-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-success fw-bold fs-4">
                        {stats.approved || 0}
                      </div>
                      <div className="text-muted small">Đã chấp thuận</div>
                    </div>
                    <div className="text-success">
                      <i className="bi bi-check-circle fs-2"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-danger">
                <Card.Body className="py-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-danger fw-bold fs-4">
                        {stats.rejected || 0}
                      </div>
                      <div className="text-muted small">Đã từ chối</div>
                    </div>
                    <div className="text-danger">
                      <i className="bi bi-x-circle fs-2"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-secondary">
                <Card.Body className="py-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-secondary fw-bold fs-4">
                        {stats.cancelled || 0}
                      </div>
                      <div className="text-muted small">Đã hủy</div>
                    </div>
                    <div className="text-secondary">
                      <i className="bi bi-archive fs-2"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Thông báo */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      {/* Bộ lọc nâng cao */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">
            <i className="bi bi-funnel me-2"></i>Bộ lọc nâng cao
          </h5>
        </div>
        <div className="card-body">
          <Row className="g-3">
            <Col md={3}>
              <label className="form-label">Trạng thái kháng nghị</label>
              <select
                className="form-select"
                value={filters.appealStatus}
                onChange={(e) =>
                  handleFilterChange("appealStatus", e.target.value)
                }
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="approved">Đã chấp thuận</option>
                <option value="rejected">Đã từ chối</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </Col>

            <Col md={2}>
              <label className="form-label">Loại đối tượng</label>
              <select
                className="form-select"
                value={filters.targetType}
                onChange={(e) =>
                  handleFilterChange("targetType", e.target.value)
                }
              >
                <option value="all">Tất cả loại</option>
                <option value="Post">Bài viết</option>
                <option value="Comment">Bình luận</option>
                <option value="User">Người dùng</option>
                <option value="Group">Nhóm</option>
              </select>
            </Col>

            <Col md={2}>
              <label className="form-label">Mã kháng nghị</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập mã kháng nghị..."
                value={filters.appealId}
                onChange={(e) => handleFilterChange("appealId", e.target.value)}
              />
            </Col>

            <Col md={2}>
              <label className="form-label">Mã vi phạm</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập mã vi phạm..."
                value={filters.violationId}
                onChange={(e) =>
                  handleFilterChange("violationId", e.target.value)
                }
              />
            </Col>

            <Col md={3}>
              <label className="form-label">Tìm kiếm</label>
              <input
                type="text"
                className="form-control"
                placeholder="Lý do, nội dung kháng nghị..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </Col>

            <Col md={3}>
              <label className="form-label">Từ ngày kháng nghị</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </Col>

            <Col md={3}>
              <label className="form-label">Đến ngày kháng nghị</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </Col>

            <Col md={6} className="d-flex align-items-end">
              <div className="d-flex gap-2 w-100">
                <Button
                  variant="primary"
                  className="flex-fill"
                  onClick={handleApplyFilters}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-1"></i>
                      Áp dụng bộ lọc
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleResetFilters}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {loading && page === 1 && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Bảng kháng nghị */}
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col" width="60">
                #
              </th>
              <th scope="col" width="120">
                Mã kháng nghị
              </th>
              <th scope="col">Thông tin kháng nghị</th>
              <th scope="col">Đối tượng</th>
              <th scope="col" width="120">
                Ngày kháng nghị
              </th>
              <th scope="col" width="120">
                Trạng thái
              </th>
              <th scope="col" width="220" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {appeals.length > 0 ? (
              appeals.map((appeal, index) => (
                <tr
                  key={appeal._id}
                  className="align-middle cursor-pointer"
                  onClick={() => handleShowDetails(appeal)}
                  style={{ cursor: "pointer" }}
                >
                  <th scope="row">{index + 1}</th>
                  <td>
                    <code className="text-primary">{appeal._id}</code>
                  </td>
                  <td>
                    <div>
                      <div className="fw-semibold">
                        <Badge
                          className={getTargetTypeBadgeClass(appeal.targetType)}
                        >
                          {getTargetTypeText(appeal.targetType)}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <small className="text-muted">Lý do kháng nghị:</small>
                        <div
                          className="text-truncate"
                          style={{ maxWidth: "200px" }}
                          title={appeal.appeal?.appealReason}
                        >
                          {appeal.appeal?.appealReason || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{renderTargetPreview(appeal)}</td>
                  <td>
                    <small className="text-muted">
                      {formatDate(appeal.appeal?.appealAt)}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${getAppealStatusBadgeClass(
                        appeal.appeal?.appealStatus
                      )}`}
                    >
                      {getAppealStatusText(appeal.appeal?.appealStatus)}
                    </span>
                  </td>
                  <td>
                    <div
                      className="d-flex gap-2 justify-content-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowDetails(appeal)}
                        title="Xem chi tiết"
                      >
                        <i className="bi bi-eye me-1"></i>Xem
                      </Button>

                      {appeal.appeal?.appealStatus === "pending" && (
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="outline-success"
                            size="sm"
                            id="dropdown-appeal-actions"
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span
                                className="spinner-border spinner-border-sm me-1"
                                role="status"
                              ></span>
                            ) : (
                              <i className="bi bi-gear me-1"></i>
                            )}
                            Xử lý
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Header>
                              <i className="bi bi-list-check me-2"></i>Chọn hành
                              động:
                            </Dropdown.Header>
                            {appealActions.map((action) => (
                              <Dropdown.Item
                                key={action.value}
                                onClick={() =>
                                  handleUpdateAppealStatus(
                                    appeal._id,
                                    action.value
                                  )
                                }
                              >
                                <div className="d-flex align-items-center">
                                  <i
                                    className={`${action.icon} me-2 text-${action.variant}`}
                                  ></i>
                                  <div>
                                    <div className="fw-semibold">
                                      {action.label}
                                    </div>
                                    <small className="text-muted">
                                      {action.description}
                                    </small>
                                  </div>
                                </div>
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <div className="text-muted">
                    <i className="bi bi-inbox fs-1 mb-2"></i>
                    <div>Không có kháng nghị nào</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="text-center py-3">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="text-muted ms-2">Đang tải thêm...</span>
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} style={{ height: "1px" }} />

      {/* Modal chi tiết kháng nghị */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-info-circle me-2"></i>Chi tiết Kháng nghị
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppeal && (
            <Row>
              {/* Thông tin kháng nghị */}
              <Col md={6}>
                <h6 className="text-muted mb-3 border-bottom pb-2">
                  <i className="bi bi-megaphone me-2"></i>Thông tin Kháng nghị
                </h6>

                <div className="mb-3">
                  <strong>Mã kháng nghị:</strong>
                  <code className="ms-2 bg-light p-1 rounded">
                    {selectedAppeal._id}
                  </code>
                </div>

                <div className="mb-2">
                  <strong>Loại đối tượng:</strong>
                  <Badge
                    className={`ms-2 ${getTargetTypeBadgeClass(
                      selectedAppeal.targetType
                    )}`}
                  >
                    {getTargetTypeText(selectedAppeal.targetType)}
                  </Badge>
                </div>

                <div className="mb-2">
                  <strong>Trạng thái kháng nghị:</strong>
                  <span
                    className={`badge ${getAppealStatusBadgeClass(
                      selectedAppeal.appeal?.appealStatus
                    )} ms-2`}
                  >
                    {getAppealStatusText(selectedAppeal.appeal?.appealStatus)}
                  </span>
                </div>

                <div className="mb-2">
                  <strong>Lý do kháng nghị:</strong>
                  <div className="mt-1 p-2 bg-light rounded">
                    {selectedAppeal.appeal?.appealReason || "—"}
                  </div>
                </div>

                <div className="mb-2">
                  <strong>Ngày gửi kháng nghị:</strong>{" "}
                  {formatDate(selectedAppeal.appeal?.appealAt)}
                </div>

                {selectedAppeal.appeal?.appealReviewedAt && (
                  <div className="mb-2">
                    <strong>Ngày xử lý:</strong>{" "}
                    {formatDate(selectedAppeal.appeal?.appealReviewedAt)}
                  </div>
                )}

                {selectedAppeal.appeal?.appealNotes && (
                  <div className="mb-2">
                    <strong>Ghi chú xử lý:</strong>
                    <div className="mt-1 p-2 bg-light rounded">
                      {selectedAppeal.appeal.appealNotes}
                    </div>
                  </div>
                )}
              </Col>

              {/* Thông tin vi phạm gốc */}
              <Col md={6}>
                <h6 className="text-muted mb-3 border-bottom pb-2">
                  <i className="bi bi-flag me-2"></i>Thông tin Vi phạm Gốc
                </h6>

                <div className="mb-2">
                  <strong>Lý do vi phạm:</strong>
                  <div className="mt-1 p-2 bg-light rounded">
                    {selectedAppeal.reason || "—"}
                  </div>
                </div>

                <div className="mb-2">
                  <strong>Trạng thái vi phạm:</strong>
                  <span
                    className={`badge ${getAppealStatusBadgeClass(
                      selectedAppeal.status
                    )} ms-2`}
                  >
                    {getAppealStatusText(selectedAppeal.status)}
                  </span>
                </div>

                <div className="mb-2">
                  <strong>Hành động đã thực hiện:</strong>
                  <span className="badge bg-secondary ms-2">
                    {selectedAppeal.actionTaken || "none"}
                  </span>
                </div>

                <div className="mb-2">
                  <strong>Ngày báo cáo:</strong>{" "}
                  {formatDate(selectedAppeal.createdAt)}
                </div>

                {/* Thông tin người gửi kháng nghị */}
                <h6 className="text-muted mb-3 border-bottom pb-2 mt-4">
                  <i className="bi bi-person me-2"></i>Người gửi Kháng nghị
                </h6>

                {selectedAppeal.userId && (
                  <div className="d-flex align-items-center mb-3">
                    {selectedAppeal.userId.profile?.avatar && (
                      <img
                        src={selectedAppeal.userId.profile.avatar}
                        alt={selectedAppeal.userId.username}
                        className="rounded-circle me-3"
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div>
                      <div className="fw-semibold">
                        {selectedAppeal.userId.username}
                      </div>
                      <div className="text-muted small">
                        {selectedAppeal.userId.email}
                      </div>
                      <div className="text-muted small">
                        {selectedAppeal.userId.fullName}
                      </div>
                    </div>
                  </div>
                )}

                {/* Thông tin người xử lý */}
                {selectedAppeal.appeal?.appealReviewedBy && (
                  <>
                    <h6 className="text-muted mb-3 border-bottom pb-2">
                      <i className="bi bi-person-check me-2"></i>Người xử lý
                      Kháng nghị
                    </h6>
                    <div className="d-flex align-items-center">
                      {selectedAppeal.appeal.appealReviewedBy.profile
                        ?.avatar && (
                        <img
                          src={
                            selectedAppeal.appeal.appealReviewedBy.profile
                              .avatar
                          }
                          alt={selectedAppeal.appeal.appealReviewedBy.username}
                          className="rounded-circle me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div>
                        <div className="fw-semibold">
                          {selectedAppeal.appeal.appealReviewedBy.username}
                        </div>
                        <div className="text-muted small">
                          {selectedAppeal.appeal.appealReviewedBy.email}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Col>

              {/* Xem trước đối tượng */}
              <Col md={12} className="mt-4">
                <h6 className="text-muted mb-3 border-bottom pb-2">
                  <i className="bi bi-eye me-2"></i>Xem trước Đối tượng
                </h6>
                {renderTargetPreview(selectedAppeal)}
              </Col>

              {/* File đính kèm kháng nghị */}
              {selectedAppeal.appeal?.files &&
                selectedAppeal.appeal.files.length > 0 && (
                  <Col md={12} className="mt-4">
                    <h6 className="text-muted mb-3 border-bottom pb-2">
                      <i className="bi bi-paperclip me-2"></i>File đính kèm
                      Kháng nghị
                    </h6>
                    <Row className="g-3">
                      {selectedAppeal.appeal.files.map((file, index) => (
                        <Col key={index} md={6} lg={4}>
                          <Card className="h-100">
                            <Card.Body>
                              <div className="text-center">
                                <i className="bi bi-file-earmark-text fs-1 text-muted"></i>
                                <div className="mt-2">
                                  <div
                                    className="small text-truncate"
                                    title={file.fileName}
                                  >
                                    {file.fileName}
                                  </div>
                                  <div className="small text-muted">
                                    {file.fileSize
                                      ? formatFileSize(file.fileSize)
                                      : "Unknown size"}
                                  </div>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Col>
                )}

              {/* Hành động xử lý */}
              {selectedAppeal.appeal?.appealStatus === "pending" && (
                <Col md={12} className="mt-4">
                  <h6 className="text-muted mb-3 border-bottom pb-2">
                    <i className="bi bi-gear me-2"></i>Hành động Xử lý
                  </h6>
                  <Row className="g-3">
                    <Col md={6}>
                      <Card className="border-success">
                        <Card.Header className="bg-success text-white">
                          <i className="bi bi-check-circle me-2"></i>Chấp thuận
                          Kháng nghị
                        </Card.Header>
                        <Card.Body>
                          <p className="text-muted small mb-3">
                            Chấp thuận kháng nghị và khôi phục đối tượng về
                            trạng thái ban đầu.
                          </p>
                          <div className="d-flex gap-2 flex-wrap">
                            {restoreActions[selectedAppeal.targetType]?.map(
                              (action) => (
                                <Button
                                  key={action.value}
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateAppealStatus(
                                      selectedAppeal._id,
                                      "approved",
                                      action.value,
                                      `Kháng nghị được chấp thuận: ${action.label}`
                                    )
                                  }
                                  disabled={actionLoading}
                                >
                                  <i className="bi bi-check-lg me-1"></i>
                                  {action.label}
                                </Button>
                              )
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="border-danger">
                        <Card.Header className="bg-danger text-white">
                          <i className="bi bi-x-circle me-2"></i>Từ chối Kháng
                          nghị
                        </Card.Header>
                        <Card.Body>
                          <p className="text-muted small mb-3">
                            Giữ nguyên quyết định xử lý vi phạm trước đó.
                          </p>
                          <Button
                            variant="outline-danger"
                            onClick={() =>
                              handleUpdateAppealStatus(
                                selectedAppeal._id,
                                "rejected",
                                null,
                                "Kháng nghị bị từ chối: Quyết định xử lý vi phạm được giữ nguyên"
                              )
                            }
                            disabled={actionLoading}
                          >
                            <i className="bi bi-x-lg me-1"></i>Từ chối Kháng
                            nghị
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            <i className="bi bi-x-lg me-1"></i>Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AppealManagement;
