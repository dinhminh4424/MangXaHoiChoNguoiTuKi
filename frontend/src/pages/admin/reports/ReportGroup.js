import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Dropdown, Badge } from "react-bootstrap";
import {
  getGroupViolation,
  updateGroupViolationStatus,
} from "../../../services/adminService";
import { useParams } from "react-router-dom";

const ReportGroup = () => {
  const [groupReports, setGroupReports] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Param từ URL
  const { id } = useParams();

  // State cho bộ lọc
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
    reportId: "" || id,
  });

  const limit = 10;
  const isFetchingRef = useRef(false);

  // Danh sách hành động cho Group
  const actionOptions = [
    {
      value: "warning",
      label: "Cảnh báo nhóm",
      description: "Gửi cảnh cáo tới chủ nhóm",
      icon: "bi-exclamation-triangle",
      status: "approved",
    },
    {
      value: "block_group",
      label: "Chặn nhóm",
      description: "Vô hiệu hóa nhóm tạm thời",
      icon: "bi-people-fill",
      status: "approved",
    },
  ];

  const fetchGroupViolations = useCallback(
    async (pageToFetch = 1, filterParams = filters) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      try {
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
          status: filterParams.status,
          dateFrom: filterParams.dateFrom,
          dateTo: filterParams.dateTo,
          search: filterParams.search,
          reportId: filterParams.reportId,
          // id: id || "",
        };

        const res = await getGroupViolation(params);
        console.log("getGroupViolation: ", res);

        if (res?.success) {
          const newReports = res.data?.reportsGroup || [];
          if (pageToFetch === 1) {
            setGroupReports(newReports);
          } else {
            setGroupReports((prev) => [...prev, ...newReports]);
          }
          setHasMore(newReports.length >= limit);
        } else {
          if (pageToFetch === 1) {
            setGroupReports([]);
          }
          setHasMore(false);
        }
      } catch (err) {
        console.error(err);
        setError(err?.toString() || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [limit]
  );

  // Effect cho phân trang
  useEffect(() => {
    fetchGroupViolations(1, filters);
    setPage(1);
  }, [fetchGroupViolations, filters]);

  // Intersection Observer
  const observer = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchGroupViolations(next, filters);
            return next;
          });
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.current.observe(sentinelRef.current);

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [fetchGroupViolations, hasMore, loadingMore, loading, filters]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchGroupViolations(1, filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: "all",
      dateFrom: "",
      dateTo: "",
      search: "",
      reportId: "",
    };
    setFilters(resetFilters);
    setPage(1);
    fetchGroupViolations(1, resetFilters);
  };

  // Xử lý mở modal chi tiết
  const handleShowDetails = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  // Xử lý cập nhật trạng thái báo cáo
  const handleUpdateStatus = async (
    reportId,
    newStatus,
    actionTaken = "none"
  ) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const res = await updateGroupViolationStatus(reportId, {
        status: newStatus,
        actionTaken: actionTaken,
        reviewedAt: new Date(),
      });

      if (res?.success) {
        const actionText = getActionText(actionTaken);
        setSuccessMessage(
          `Đã ${getStatusText(newStatus)} với hành động: ${actionText}`
        );

        // Cập nhật lại danh sách
        setGroupReports((prev) =>
          prev.map((report) =>
            report._id === reportId
              ? {
                  ...report,
                  status: newStatus,
                  actionTaken: actionTaken,
                  reviewedAt: new Date(),
                }
              : report
          )
        );

        // Cập nhật selected report nếu đang mở modal
        if (selectedReport && selectedReport._id === reportId) {
          setSelectedReport((prev) => ({
            ...prev,
            status: newStatus,
            actionTaken: actionTaken,
            reviewedAt: new Date(),
          }));
        }

        // Tự động ẩn thông báo sau 3s
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(res?.message || "Có lỗi xảy ra khi cập nhật");
      }
    } catch (err) {
      console.error(err);
      setError(err?.toString() || "Có lỗi xảy ra khi cập nhật");
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
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning text-dark";
      case "reviewed":
        return "bg-info";
      case "approved":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Get action badge class
  const getActionBadgeClass = (action) => {
    switch (action) {
      case "warning":
        return "bg-warning text-dark";
      case "block_group":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    const statusMap = {
      pending: "Đang chờ",
      reviewed: "Đã xem xét",
      approved: "Đã phê duyệt",
      rejected: "Đã từ chối",
      auto: "Xử lý tự động",
    };
    return statusMap[status] || status;
  };

  // Get action text
  const getActionText = (action) => {
    const actionMap = {
      none: "Không có",
      warning: "Cảnh báo nhóm",
      block_group: "Chặn nhóm",
    };
    return actionMap[action] || action;
  };

  // Get visibility badge
  const getVisibilityBadge = (visibility) => {
    const visibilityMap = {
      public: { class: "bg-success", text: "Công khai" },
      private: { class: "bg-secondary", text: "Riêng tư" },
      invite: { class: "bg-info", text: "Theo lời mời" },
    };
    const visibilityInfo = visibilityMap[visibility] || {
      class: "bg-secondary",
      text: visibility,
    };
    return (
      <Badge className={visibilityInfo.class}>{visibilityInfo.text}</Badge>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // State cho lightbox ảnh
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Xử lý mở ảnh lớn
  const handleOpenImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // Render file preview
  const renderFilePreview = (file) => {
    const fileUrl = file.fileUrl;

    switch (file.type) {
      case "image":
        return (
          <div className="file-preview image-preview position-relative">
            <img
              src={fileUrl}
              alt={file.fileName}
              className="img-fluid rounded cursor-pointer"
              style={{ maxHeight: "200px", objectFit: "contain" }}
              onClick={() => handleOpenImage(fileUrl)}
            />
            <div className="preview-overlay position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded opacity-0 hover-opacity-100 transition-opacity">
              <button
                className="btn btn-sm btn-light"
                onClick={() => handleOpenImage(fileUrl)}
              >
                <i className="bi bi-zoom-in me-1"></i>Phóng to
              </button>
            </div>
          </div>
        );

      case "video":
        return (
          <div className="file-preview video-preview">
            <video
              controls
              className="w-100 rounded"
              style={{ maxHeight: "200px" }}
            >
              <source src={fileUrl} type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        );

      default:
        return (
          <div className="file-preview file-preview">
            <div className="card">
              <div className="card-body text-center">
                <i className="bi bi-paperclip fs-1 text-muted"></i>
                <div className="mt-2">
                  <small className="text-muted">File đính kèm</small>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0">
          <i className="bi bi-flag me-2"></i>Quản lý báo cáo nhóm
        </h2>
        <div className="text-muted small">
          <i className="bi bi-people-fill me-1"></i>Tổng số:{" "}
          {groupReports.length} báo cáo
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

      {/* Bộ lọc */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">
            <i className="bi bi-funnel me-2"></i>Bộ lọc
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="reviewed">Đã xem xét</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Mã báo cáo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập mã báo cáo..."
                value={filters.reportId}
                onChange={(e) => handleFilterChange("reportId", e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Từ ngày</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Đến ngày</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Tìm kiếm</label>
              <input
                type="text"
                className="form-control"
                placeholder="Lý do, ghi chú..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <div className="d-flex gap-2 w-100">
                <button
                  className="btn btn-primary flex-fill d-block"
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
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleResetFilters}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && page === 1 && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Bảng báo cáo */}
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col" width="60">
                #
              </th>
              <th scope="col" width="120">
                Mã báo cáo
              </th>
              <th scope="col">Nhóm</th>
              <th scope="col">Lý do</th>
              <th scope="col" width="100">
                Ngày báo cáo
              </th>
              <th scope="col" width="120">
                Trạng thái
              </th>
              <th scope="col" width="120">
                Hành động
              </th>
              <th scope="col" width="220" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {groupReports.length > 0 ? (
              groupReports.map((report, index) => (
                <tr
                  key={report._id}
                  className="align-middle cursor-pointer"
                  onClick={() => handleShowDetails(report)}
                  style={{ cursor: "pointer" }}
                >
                  <th scope="row">{index + 1}</th>
                  <td>
                    <code className="text-primary">{report._id}</code>
                  </td>
                  <td>
                    <div className="">
                      {report.targetId?.avatar && (
                        <img
                          src={report.targetId.avatar}
                          alt={report.targetId.name}
                          className="rounded-circle me-2"
                          style={{
                            width: "39px",
                            height: "39px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div>
                        <div className="fw-semibold">
                          {report.targetId?.name || "N/A"}
                        </div>
                        <small className="text-muted">
                          {report.targetId?.memberCount || 0} Mber
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="text-truncate"
                      style={{ maxWidth: "200px" }}
                      title={report.reason}
                    >
                      {report.reason || "—"}
                    </div>
                  </td>
                  <td>
                    <small className="text-muted">
                      {formatDate(report.createdAt)}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${getStatusBadgeClass(report.status)}`}
                    >
                      {getStatusText(report.status)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${getActionBadgeClass(
                        report.actionTaken
                      )}`}
                    >
                      {getActionText(report.actionTaken)}
                    </span>
                  </td>
                  <td>
                    <div
                      className="d-flex gap-2 justify-content-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleShowDetails(report)}
                        title="Xem chi tiết"
                      >
                        <i className="bi bi-eye me-1"></i>Xem
                      </button>

                      {report.status === "pending" && (
                        <>
                          <Dropdown>
                            <Dropdown.Toggle
                              variant="outline-success"
                              size="sm"
                              id="dropdown-actions"
                              disabled={actionLoading}
                            >
                              {actionLoading ? (
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                ></span>
                              ) : (
                                <i className="bi bi-check-lg me-1"></i>
                              )}
                              Duyệt
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Header>
                                <i className="bi bi-list-check me-2"></i>Chọn
                                hành động:
                              </Dropdown.Header>
                              {actionOptions.map((action) => (
                                <Dropdown.Item
                                  key={action.value}
                                  onClick={() =>
                                    handleUpdateStatus(
                                      report._id,
                                      action.status,
                                      action.value
                                    )
                                  }
                                >
                                  <div className="d-flex align-items-center">
                                    <i
                                      className={`${action.icon} me-2 text-primary`}
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
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              handleUpdateStatus(report._id, "rejected", "none")
                            }
                            disabled={actionLoading}
                            title="Từ chối"
                          >
                            <i className="bi bi-x-lg me-1"></i>Huỷ
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <div className="text-muted">
                    <i className="bi bi-inbox fs-1 mb-2"></i>
                    <div>Không có báo cáo nào</div>
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

      {/* Modal chi tiết báo cáo */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-info-circle me-2"></i>Chi tiết báo cáo nhóm
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <div className="row">
              {/* Thông tin báo cáo */}
              <div className="col-md-6">
                <h6 className="text-muted mb-3 border-bottom pb-2">
                  <i className="bi bi-flag me-2"></i>Thông tin báo cáo
                </h6>

                <div className="mb-3">
                  <strong>Mã báo cáo:</strong>
                  <code className="ms-2 bg-light p-1 rounded">
                    {selectedReport._id}
                  </code>
                </div>

                <div className="mb-2">
                  <strong>Loại đối tượng:</strong>
                  <Badge bg="primary" className="ms-2">
                    {selectedReport.targetType}
                  </Badge>
                </div>

                <div className="mb-2">
                  <strong>Lý do báo cáo:</strong>
                  <div className="mt-1 p-2 bg-light rounded">
                    {selectedReport.reason || "—"}
                  </div>
                </div>

                <div className="mb-2">
                  <strong>Trạng thái:</strong>
                  <span
                    className={`badge ${getStatusBadgeClass(
                      selectedReport.status
                    )} ms-2`}
                  >
                    {getStatusText(selectedReport.status)}
                  </span>
                </div>

                <div className="mb-2">
                  <strong>Hành động đã thực hiện:</strong>
                  <span
                    className={`badge ${getActionBadgeClass(
                      selectedReport.actionTaken
                    )} ms-2`}
                  >
                    {getActionText(selectedReport.actionTaken)}
                  </span>
                </div>

                <div className="mb-2">
                  <strong>Ngày báo cáo:</strong>{" "}
                  {formatDate(selectedReport.createdAt)}
                </div>

                {selectedReport.reviewedAt && (
                  <div className="mb-2">
                    <strong>Ngày xem xét:</strong>{" "}
                    {formatDate(selectedReport.reviewedAt)}
                  </div>
                )}
              </div>

              {/* Thông tin nhóm */}
              <div className="col-md-6">
                <h6 className="text-muted mb-3 border-bottom pb-2">
                  <i className="bi bi-people-fill me-2"></i>Thông tin nhóm
                </h6>

                {selectedReport.targetId && (
                  <div className="mb-4">
                    <div className="d-flex align-items-start mb-3">
                      {selectedReport.targetId.avatar && (
                        <img
                          src={selectedReport.targetId.avatar}
                          alt={selectedReport.targetId.name}
                          className="rounded me-3"
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div className="flex-grow-1">
                        <h5 className="mb-1">{selectedReport.targetId.name}</h5>
                        <p className="text-muted mb-2">
                          {selectedReport.targetId.description}
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                          {getVisibilityBadge(
                            selectedReport.targetId.visibility
                          )}
                          <Badge bg="info">
                            <i className="bi bi-people me-1"></i>
                            {selectedReport.targetId.memberCount || 0} thành
                            viên
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thông tin người báo cáo */}
                <h6 className="text-muted mb-3 border-bottom pb-2">
                  <i className="bi bi-person me-2"></i>Thông tin người báo cáo
                </h6>

                {selectedReport.reportedBy && (
                  <div className="d-flex align-items-center mb-3">
                    {selectedReport.reportedBy.profile?.avatar && (
                      <img
                        src={selectedReport.reportedBy.profile.avatar}
                        alt={selectedReport.reportedBy.username}
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
                        {selectedReport.reportedBy.username}
                      </div>
                      <div className="text-muted small">
                        {selectedReport.reportedBy.email}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ghi chú */}
                {selectedReport.notes && (
                  <div className="mt-3">
                    <strong>Ghi chú:</strong>
                    <div className="mt-1 p-2 bg-light rounded">
                      {selectedReport.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* File đính kèm */}
              {selectedReport.evidence &&
                selectedReport.evidence.length > 0 && (
                  <div className="col-12 mt-4">
                    <h6 className="text-muted mb-3 border-bottom pb-2">
                      <i className="bi bi-paperclip me-2"></i>File đính kèm
                    </h6>
                    <div className="row g-3">
                      {selectedReport.evidence.map((file, index) => (
                        <div key={index} className="col-md-6 col-lg-4">
                          <div className="card h-100">
                            <div className="card-body">
                              {renderFilePreview(file)}
                              <div className="mt-2">
                                <div
                                  className="small text-truncate"
                                  title={file.fileName}
                                >
                                  {file.fileName}
                                </div>
                                <div className="small text-muted">
                                  {formatFileSize(file.fileSize)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Hành động */}
              {selectedReport.status === "pending" && (
                <div className="col-12 mt-4">
                  <h6 className="text-muted mb-3 border-bottom pb-2">
                    <i className="bi bi-gear me-2"></i>Hành động
                  </h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {actionOptions.map((action) => (
                      <button
                        key={action.value}
                        className="btn btn-outline-success"
                        onClick={() =>
                          handleUpdateStatus(
                            selectedReport._id,
                            action.status,
                            action.value
                          )
                        }
                        disabled={actionLoading}
                      >
                        <i className={`${action.icon} me-1`}></i>
                        {action.label}
                      </button>
                    ))}
                    <button
                      className="btn btn-outline-danger"
                      onClick={() =>
                        handleUpdateStatus(
                          selectedReport._id,
                          "rejected",
                          "none"
                        )
                      }
                      disabled={actionLoading}
                    >
                      <i className="bi bi-x-lg me-1"></i>Từ chối báo cáo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleCloseModal}>
            <i className="bi bi-x-lg me-1"></i>Đóng
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal xem ảnh lớn */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xem ảnh</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={selectedImage}
            alt="Preview"
            className="img-fluid"
            style={{ maxHeight: "70vh", objectFit: "contain" }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ReportGroup;
