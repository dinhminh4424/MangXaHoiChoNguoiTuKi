import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import {
  getPostViolation,
  updateViolationStatus,
} from "../../../services/adminService";

import "./ReportComment.css";

const Report = () => {
  const [postReports, setPostReports] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State cho bộ lọc
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
    reportId: "",
  });

  const limit = 10;
  const isFetchingRef = useRef(false);

  const fetchPostViolations = useCallback(
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
        };

        const res = await getPostViolation(params);
        console.log("getPostViolation: ", res);

        if (res?.success) {
          const newReports = res.data?.reportsPost || [];
          if (pageToFetch === 1) {
            setPostReports(newReports);
          } else {
            setPostReports((prev) => [...prev, ...newReports]);
          }
          setHasMore(newReports.length >= limit);
        } else {
          if (pageToFetch === 1) {
            setPostReports([]);
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
    fetchPostViolations(1, filters);
    setPage(1);
  }, [fetchPostViolations, filters]);

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
            fetchPostViolations(next, filters);
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
  }, [fetchPostViolations, hasMore, loadingMore, loading, filters]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchPostViolations(1, filters);
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
    fetchPostViolations(1, resetFilters);
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

      const res = await updateViolationStatus(reportId, {
        status: newStatus,
        actionTaken: actionTaken,
        reviewedAt: new Date(),
      });

      if (res?.success) {
        setSuccessMessage(
          `Đã cập nhật trạng thái thành ${getStatusText(newStatus)}`
        );

        // Cập nhật lại danh sách
        setPostReports((prev) =>
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
      case "block_post":
        return "bg-danger";
      case "ban_user":
        return "bg-dark";
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
    };
    return statusMap[status] || status;
  };

  // Get action text
  const getActionText = (action) => {
    const actionMap = {
      none: "Không có",
      warning: "Cảnh báo",
      block_post: "Chặn bài đăng",
      ban_user: "Cấm người dùng",
    };
    return actionMap[action] || action;
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0">Quản lý báo cáo bài viết</h2>
        <div className="text-muted small">
          Tổng số: {postReports.length} báo cáo
        </div>
      </div>

      {/* Thông báo */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
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
          <h5 className="card-title mb-0">Bộ lọc</h5>
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
                  {loading ? "Đang tải..." : "Áp dụng"}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleResetFilters}
                  disabled={loading}
                >
                  Reset
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
              <th scope="col">Bài viết</th>
              <th scope="col">Lý do</th>
              <th scope="col" width="150">
                Ngày báo cáo
              </th>
              <th scope="col" width="120">
                Trạng thái
              </th>
              <th scope="col" width="120">
                Hành động
              </th>
              <th scope="col" width="180" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {postReports.length > 0 ? (
              postReports.map((report, index) => {
                return (
                  <tr key={report._id} className="align-middle">
                    <th scope="row">{(page - 1) * limit + index + 1}</th>
                    <td>
                      <code className="text-primary">{report._id}</code>
                    </td>
                    <td>
                      <button
                        className="btn btn-link btn-sm p-0 text-decoration-none text-start"
                        onClick={() => handleShowDetails(report)}
                        title="Xem chi tiết"
                      >
                        Bài viết #{report.targetId?.slice(-8) || "N/A"}
                      </button>
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
                        className={`badge ${getStatusBadgeClass(
                          report.status
                        )}`}
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
                      <div className="d-flex gap-2 justify-content-center">
                        <button
                          className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
                          onClick={() => handleShowDetails(report)}
                          title="Xem chi tiết"
                          style={{}}
                        >
                          <svg
                            width="25"
                            height="25"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="#000000"
                              d="M4.467 17.463c-.14-.22-.31-.42-.46-.62a6 6 0 0 0-.46-.51a1.1 1.1 0 0 0-.35-.23a.29.29 0 0 0-.4.13c-.12.24 0 .11.36 1.11c.06.15.11.32.18.47q.18.355.42.67c.282.366.62.686 1 .95a.33.33 0 0 0 .48 0a.34.34 0 0 0 0-.48a8 8 0 0 1-.54-1a4 4 0 0 0-.23-.49m14.218-.16c-.14-.22-.31-.42-.46-.62a6 6 0 0 0-.46-.51a1.3 1.3 0 0 0-.34-.24a.31.31 0 0 0-.41.14a.3.3 0 0 0 .14.4l.22.7c.06.16.11.33.18.48q.18.355.42.67c.282.366.62.686 1 .95a.34.34 0 0 0 .48-.48a6.4 6.4 0 0 1-.53-1a3 3 0 0 0-.24-.49m-13.338-1.1q.171.337.41.63c.255.267.548.496.87.68a.34.34 0 0 0 .48-.48c-.18-.28-.28-.58-.45-.86s-.24-.34-.34-.51s-.42-.5-.56-.65l-.1-.13c-.21-.13-.35-.11-.41 0s-.23-.04.1 1.32m14.668.47q.389.4.87.68a.36.36 0 0 0 .49 0a.34.34 0 0 0 0-.48c-.18-.28-.29-.58-.46-.86s-.24-.34-.34-.51l-.56-.66c-.06-.06-.08-.11-.1-.12c-.21-.13-.34-.11-.41 0s-.23 0 .11 1.34q.166.327.4.61"
                            />
                            <path
                              fill="#000000"
                              d="m22.194 12.853l-.18-.19a3.4 3.4 0 0 0-1.23-.62a8.8 8.8 0 0 0-2.68-.23a4.9 4.9 0 0 0-1.849.47a5.45 5.45 0 0 0-2.35 2.7c-.14-.44-.27-.9-.35-1.16a1.2 1.2 0 0 0-.3-.5a.85.85 0 0 0-.34-.11a8 8 0 0 0-1-.06a2.5 2.5 0 0 0-1 .17q-.184.136-.31.33q-.248.48-.4 1c-.08.26-.149.54-.209.8a5.8 5.8 0 0 0-3-2.91a5 5 0 0 0-4.609.7a.341.341 0 0 0 .1.624a.35.35 0 0 0 .26-.034a4.21 4.21 0 0 1 3.92-.49a4.87 4.87 0 0 1 2.51 3a3.69 3.69 0 0 1-1.16 3.449a4.06 4.06 0 0 1-3.67 1.12a5.1 5.1 0 0 1-2.22-1.18a3.93 3.93 0 0 1-1.32-2.13a3.14 3.14 0 0 1 .1-1.45a5.1 5.1 0 0 1 .65-1.38a.29.29 0 0 0-.07-.42a.3.3 0 0 0-.42.07a5.4 5.4 0 0 0-.81 1.56a3.8 3.8 0 0 0-.24 1.74a4.66 4.66 0 0 0 1.39 2.67a6.1 6.1 0 0 0 2.61 1.59a5.13 5.13 0 0 0 4.72-1.31a4.84 4.84 0 0 0 1.649-4c.31-.2-.17 0 .58-1.49c.56-1.13.1-1 1.63-.91c.24.5.67 1.42.93 1.88c0 .15-.06.3-.08.45a4.1 4.1 0 0 0 2.36 4.44c.407.173.833.3 1.269.38q.937.175 1.89.22c.49 0 1 .05 1.54 0a5.3 5.3 0 0 0 1.06-.16a.35.35 0 0 0 .25-.41a.35.35 0 0 0-.42-.26q-.455.102-.92.11c-.49 0-1-.05-1.45-.09a13.5 13.5 0 0 1-1.77-.27a5 5 0 0 1-1.07-.38a3.17 3.17 0 0 1-1.65-3.48a4.6 4.6 0 0 1 2.21-3.42a4.5 4.5 0 0 1 1.79-.379a7.7 7.7 0 0 1 1.95.15c.406.094.784.286 1.1.56c.351.292.664.628.93 1a4.3 4.3 0 0 1 .7 2c.073.76.04 1.528-.1 2.28q-.06.297-.15.59a2.3 2.3 0 0 1-.24.519a.303.303 0 1 0 .51.33q.15-.24.27-.5q.16-.385.259-.79a8.7 8.7 0 0 0 .18-3a7.24 7.24 0 0 0-1.75-3.189m-9.398-8.069l-.02.03l-.01.02l.02-.05zm-2.54 3.94a4.7 4.7 0 0 1 1.58-.48a3.76 3.76 0 0 1 1.91.22c.1 0 .1.21.14.42s.08.48.12.78a.34.34 0 0 0 .498.273a.34.34 0 0 0 .182-.333a6.7 6.7 0 0 0-.12-1.21a.94.94 0 0 0-.45-.65a4.65 4.65 0 0 0-2.35-.51a4.2 4.2 0 0 0-2.37.75a1.42 1.42 0 0 0-.33.89a17 17 0 0 0 0 2a.4.4 0 0 0 0 .13c-.06.77.8.51 1.9.28a10 10 0 0 1 1.46-.23q.47-.06.94 0c.16 0 .77.12 1 .14h.15a.31.31 0 0 0 .3-.22a.28.28 0 0 0-.16-.35a.3.3 0 0 0-.15 0c-.24 0-.79-.18-.94-.22a5 5 0 0 0-1.11-.17a10.6 10.6 0 0 0-1.61.07l-.62.07a6.8 6.8 0 0 1 .03-1.65"
                            />
                            <path
                              fill="#000000"
                              d="M22.314 11.073c-.14-.37-.25-.62-.25-.62l-.42-1a15 15 0 0 0-.73-1.93a3 3 0 0 0-1-1.18a7 7 0 0 0-.65-.419a2.3 2.3 0 0 0-.6-.17h-.43a.5.5 0 0 1-.2-.15c-.07.05-.12-.22-.19-.39c-.29-.67-.659-1.77-.879-2.31a1.5 1.5 0 0 0-.34-.53a2 2 0 0 0-.85-.39a4.7 4.7 0 0 0-1.12-.09a3.9 3.9 0 0 0-1.11.09a1.06 1.06 0 0 0-.64.54q-.057.155-.07.32v1.55a1.2 1.2 0 0 1-.08.39s0 .06-.06.07h-.39q-.5.045-1 0v-1.3a5.3 5.3 0 0 0-.1-1a1 1 0 0 0-.64-.53a3.6 3.6 0 0 0-.999-.04a5.4 5.4 0 0 0-1.12.09a2.15 2.15 0 0 0-.8.36a1.13 1.13 0 0 0-.31.55c-.15.53-.36 1.62-.56 2.29c0 .15-.12.33-.13.36a.64.64 0 0 1-.23.16c-.11 0-.22 0-.43.05a1.9 1.9 0 0 0-.59.14q-.33.193-.64.42a2.94 2.94 0 0 0-1 1.15a17 17 0 0 0-.739 1.96l-.56 1.47a.31.31 0 0 0 .17.39a.3.3 0 0 0 .39-.22l.63-1.4q.316-.913.76-1.77a2.1 2.1 0 0 1 .76-.83a6 6 0 0 1 .58-.35a1.2 1.2 0 0 1 .34-.08q.28-.012.56-.06a1.6 1.6 0 0 0 .59-.33a2.2 2.2 0 0 0 .42-.8c.2-.6.42-1.49.58-2c0-.1.07-.2.09-.27a1.3 1.3 0 0 1 .47-.13a7 7 0 0 1 .769 0c1 0 .73-.59.66 2.23a.63.63 0 0 0 .48.65q.536.135 1.09.14a3.8 3.8 0 0 0 1.48-.21a1.06 1.06 0 0 0 .51-.46c.134-.247.212-.52.23-.8q.045-.645 0-1.29a2 2 0 0 0-.07-.27c.17.1.57-.13.72-.13a3.8 3.8 0 0 1 .89 0q.177.038.34.12c0 .07.09.19.13.3c.24.55.569 1.45.849 2c.11.286.269.55.47.78c.18.153.387.272.61.35c.15 0 .29 0 .57.06q.169.013.33.07c.17.08.31.2.56.35c.312.2.567.48.74.81q.432.88.75 1.81l.46 1l.16.4c.07.71 1.06 1.05.79.03"
                            />
                          </svg>
                        </button>

                        {report.status === "pending" && (
                          <>
                            <button
                              className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center"
                              onClick={() =>
                                handleUpdateStatus(
                                  report._id,
                                  "approved",
                                  "warning"
                                )
                              }
                              disabled={actionLoading}
                              title="Phê duyệt & Cảnh báo"
                              style={{}}
                            >
                              <svg
                                width="25"
                                height="25"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="#000000"
                                  d="M23.702 3.74a1.6 1.6 0 0 0-.13-.73a.72.72 0 0 0-.599-.399a1.3 1.3 0 0 0-.769.22a2.4 2.4 0 0 1-1.507.47a1 1 0 0 1-.5-.15a3 3 0 0 1-.719-.84a1.3 1.3 0 0 0-.769-.478a.88.88 0 0 0-.728.18c-.27.301-.58.567-.92.788a1.54 1.54 0 0 1-.788.14a3.7 3.7 0 0 1-1.997-.859a.61.61 0 0 0-.929.23a3.8 3.8 0 0 0-.34.998q-.063.75-.02 1.498c0 .39-.11 1.997-.09 3.475q-.039 1.181.09 2.357c.227.706.654 1.33 1.229 1.797a7.3 7.3 0 0 0 2.766 1.498a.27.27 0 0 0 .35-.19a.29.29 0 0 0-.19-.35a6.8 6.8 0 0 1-2.117-1.098a3.4 3.4 0 0 1-1.318-1.767a20 20 0 0 1 0-2.237c0-1.508.19-2.995.22-3.435a10 10 0 0 1 .14-1.328q.045-.265.139-.52a4.4 4.4 0 0 0 1.997 1c.454.031.908-.055 1.318-.25c.296-.149.563-.348.789-.59q.114-.126.21-.269c.14.05.19.22.29.37c.21.313.477.584.788.798c.304.181.646.287.999.31c.435.027.871-.04 1.278-.2q.367-.154.709-.36q.08.335.1.68c0 .519 0 .998-.06 1.198s-.22 1.857-.46 3.435c-.13.859-.27 1.678-.399 2.207a3.8 3.8 0 0 1-1.698 1.478a5.9 5.9 0 0 1-2.316.629a.32.32 0 0 0-.31.33a.33.33 0 0 0 .33.309a6.7 6.7 0 0 0 2.606-.63a4.67 4.67 0 0 0 2.097-1.787v-.08c.16-.539.33-1.407.5-2.316c.289-1.598.548-3.305.568-3.475a17 17 0 0 0 .16-2.057M.795 4.229a1.65 1.65 0 0 0-.39 1.777a.27.27 0 0 0 .36.15a.26.26 0 0 0 .15-.36a.93.93 0 0 1 .17-.788q.166-.248.41-.42c.299-.469.309-.818-.27-.758q-.238.174-.43.4M19.119 17.9c.05.379-.15.529-.29.928a2.2 2.2 0 0 1-.938.999a10 10 0 0 1-2.147.938l-3.665 1.218a12.4 12.4 0 0 1-3.305.89a4.2 4.2 0 0 1-2.067-.38a.7.7 0 0 1-.19-.23c-.11-.17-.19-.37-.27-.52c-.23-.439-.439-.888-.649-1.347c-.21-.46-.4-.919-.579-1.378c-.918-2.287-1.997-4.803-2.796-7.34a27 27 0 0 1-1.218-5.012a.27.27 0 0 0-.31-.25a.27.27 0 0 0-.25.31a27.4 27.4 0 0 0 1 5.202c.728 2.586 1.717 5.153 2.546 7.49c.19.489.38.998.589 1.447c.21.45.43.939.669 1.398q.194.455.48.859c.128.159.292.285.478.37c.818.4 1.73.569 2.637.489a13.2 13.2 0 0 0 3.585-.999l3.604-1.348c.809-.28 1.583-.652 2.307-1.108c.519-.355.93-.845 1.188-1.418a1.7 1.7 0 0 0 .15-1.288c-.06-.31-.46-.23-.56.08"
                                />
                                <path
                                  fill="#000000"
                                  d="M18.62 15.223a.31.31 0 0 0-.325-.139a.3.3 0 0 0-.115.05a.32.32 0 0 0-.09.449c.246.366.419.776.51 1.208c-.535.432-1.14.77-1.788.999c-.889.329-1.777.629-2.666.938l-2.377.919c-.778.31-1.547.629-2.346.859a12.5 12.5 0 0 1-1.688.389a51 51 0 0 1-1.857-4.723c-.43-1.278-.819-2.576-1.198-3.865c-.38-1.288-.79-2.626-1.129-3.924c-.29-.998-.659-2.067-.928-3.115c-.12-.44-.22-.87-.3-1.259c.28-.17.59-.33.919-.489l.42-.18l.708.939c.08.11.17.28.26.41q.09.136.22.24a.78.78 0 0 0 .479.079q.504-.025.998-.13q.478-.055.939-.19c.669-.18 1.318-.449 1.997-.619q.448-.086.879-.24a.8.8 0 0 0 .4-.309q.12-.22.159-.47c0-.249 0-.558.05-.738q.06-.465.18-.919c0-.16.1-.31.15-.46a16 16 0 0 1 1.058-.199c.18-.043.369-.043.55 0a.59.59 0 0 1 .359.44s.12.13.29.1a.3.3 0 0 0 .239-.26v-.11a1.2 1.2 0 0 0-.43-.6A1.6 1.6 0 0 0 11.99.016a27 27 0 0 0-4.823.879a20.6 20.6 0 0 0-3.105 1.118c-.999.47-2.387.889-2.257 2.277c.05.38.11.749.18 1.118c.21 1.069.479 2.127.689 3.186c.19.889.379 1.787.609 2.676a46 46 0 0 0 1.208 3.924a47 47 0 0 0 2.716 6.151a.34.34 0 0 0 .3.16a20 20 0 0 0 3.555-.52a19 19 0 0 0 1.427-.449c.68-.24 1.358-.539 1.998-.808c.868-.39 1.747-.76 2.606-1.169c.569-.27 1.298-.838 1.857-1.158c.789-.53.09-1.578-.33-2.177M5 2.771a41 41 0 0 1 2.635-.898a49 49 0 0 1 2.637-.73s-.23.7-.32 1l-.16.738c-.799.2-4.373 1.298-4.373 1.298c-.15.04-1.139-1.168-1.139-1.168z"
                                />
                                <path
                                  fill="#000000"
                                  d="M17.98 11.479c.238-.106.445-.271.6-.48q.404-.517.729-1.088c.519-.889.928-1.837 1.507-2.686q.337-.545.79-.999a.31.31 0 0 0 .07-.347a.3.3 0 0 0-.07-.102a.32.32 0 0 0-.45 0a6.6 6.6 0 0 0-1.298 1.338c-.54.709-.999 1.488-1.488 2.217c-.11.18-.28.469-.46.739a2 2 0 0 1-.19.29c-.06-.1-1.807-1.898-1.807-1.898a.27.27 0 0 0-.389 0a.28.28 0 0 0 0 .4l1.398 1.897s.3.419.42.559a.54.54 0 0 0 .639.16"
                                />
                              </svg>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                              onClick={() =>
                                handleUpdateStatus(
                                  report._id,
                                  "rejected",
                                  "none"
                                )
                              }
                              disabled={actionLoading}
                              title="Từ chối"
                              style={{}}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="25"
                                height="25"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="none"
                                  stroke="#000000"
                                  d="m.5.5l8.903 8.903M23.5 23.5L13.118 13.118M16 23.5c-1 0-1.75-1.5-1.75-1.5c-.75-1.5-.75-3.5-.75-5v-.5l-5-2.5v-.25l.88-4.25l.023-.097m6.097.785C17 11.5 19 12 21 12m-10.5 5.5c-1 3-3 5-5.5 5m.155-9.5l.535-2.583A4.919 4.919 0 0 1 6.22 9M7.5 7.523a4.902 4.902 0 0 1 3-1.023h1.544a2 2 0 0 1 1.958 2.405L13.155 13l-.037.118M9.403 9.403l3.715 3.715M13.35 4.5s-1.6-1-1.6-2.25a1.746 1.746 0 1 1 3.495 0c0 1.25-1.595 2.25-1.595 2.25h-.3Z"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <div className="text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    Không có báo cáo nào
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chi tiết sử dụng React Bootstrap Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết báo cáo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-muted mb-3">Thông tin báo cáo</h6>
                <div className="mb-2">
                  <strong>Mã báo cáo:</strong>
                  <code className="ms-2">{selectedReport._id}</code>
                </div>
                <div className="mb-2">
                  <strong>Loại đối tượng:</strong> {selectedReport.targetType}
                </div>
                <div className="mb-2">
                  <strong>ID bài viết:</strong> {selectedReport.targetId}
                </div>
                <div className="mb-2">
                  <strong>Lý do:</strong> {selectedReport.reason || "—"}
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
                  <strong>Hành động:</strong>
                  <span
                    className={`badge ${getActionBadgeClass(
                      selectedReport.actionTaken
                    )} ms-2`}
                  >
                    {getActionText(selectedReport.actionTaken)}
                  </span>
                </div>
              </div>

              <div className="col-md-6">
                <h6 className="text-muted mb-3">Thông tin người báo cáo</h6>
                {selectedReport.reportedBy && (
                  <>
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={
                          selectedReport.reportedBy.profile?.avatar ||
                          "/assets/images/default-avatar.png"
                        }
                        alt="Avatar"
                        className="rounded-circle me-3"
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <div className="fw-semibold">
                          {selectedReport.reportedBy.username}
                        </div>
                        <div className="text-muted small">
                          {selectedReport.reportedBy.email}
                        </div>
                      </div>
                    </div>
                  </>
                )}

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

              {selectedReport.notes && (
                <div className="col-12 mt-4">
                  <h6 className="text-muted mb-2">Ghi chú</h6>
                  <div className="card">
                    <div className="card-body">{selectedReport.notes}</div>
                  </div>
                </div>
              )}

              {selectedReport.files && selectedReport.files.length > 0 && (
                <div className="col-12 mt-4">
                  <h6 className="text-muted mb-2">
                    File đính kèm ({selectedReport.files.length})
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedReport.files.map((file, index) => (
                      <div key={index} className="card">
                        <div className="card-body py-2">
                          <small>
                            <div>
                              <strong>File:</strong> {file.fileName}
                            </div>
                            <div>
                              <strong>Loại:</strong> {file.type}
                            </div>
                            <div>
                              <strong>Kích thước:</strong>{" "}
                              {(file.fileSize / 1024).toFixed(2)} KB
                            </div>
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="me-auto">
            {selectedReport?.status === "pending" && (
              <div className="btn-group">
                <button
                  className="btn btn-success"
                  onClick={() =>
                    handleUpdateStatus(
                      selectedReport._id,
                      "approved",
                      "warning"
                    )
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang xử lý..." : "Phê duyệt & Cảnh báo"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() =>
                    handleUpdateStatus(selectedReport._id, "rejected", "none")
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang xử lý..." : "Từ chối"}
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCloseModal}
          >
            Đóng
          </button>
          <a
            href={`/posts/${selectedReport?.targetId}`}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Xem bài viết
          </a>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Report;
