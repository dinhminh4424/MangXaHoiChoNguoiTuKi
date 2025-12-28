import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getAllPosts,
  deletePost,
  updatePostBlock,
  updatePostCommentBlock,
} from "../../../services/adminService";
// import "./AdminContentManagement.css";

import NotificationService from "../../../services/notificationService";

import { Collapse } from "react-bootstrap";

const DEFAULT_LIMIT = 12;

const AdminContentManagement = () => {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
  });

  const [filters, setFilters] = useState({
    email: "",
    username: "",
    postId: "",
    fromDate: "",
    toDate: "",
    status: "",
    minViolations: "",
    maxViolations: "",
    privacy: "",
    hasFiles: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [loadUpdate, setLoadUpdate] = useState(false);

  const [showFilters, setShowFilters] = useState(true);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // Xây dựng params từ filters
  const buildParams = useCallback(
    (page, limit = DEFAULT_LIMIT) => {
      const params = {
        page,
        limit,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] == null) {
          delete params[key];
        }
      });

      return params;
    },
    [filters]
  );

  // Fetch data với debounce
  const fetchData = useCallback(
    async (page = 1, options = { append: false }) => {
      const isLoadMore = options.append;

      try {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        setError(null);

        const params = buildParams(page);
        const res = await getAllPosts(params);
        const data = res?.data?.data || {};
        const fetched = data.posts || [];
        const pag = data.pagination || {};

        setPosts((prev) => (isLoadMore ? [...prev, ...fetched] : fetched));
        setPagination({
          currentPage: pag.current || page,
          totalPages:
            pag.pages ||
            Math.ceil((pag.total || 0) / (pag.limit || DEFAULT_LIMIT)) ||
            1,
          limit: pag.limit || DEFAULT_LIMIT,
          total: pag.total || 0,
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [buildParams]
  );

  // Reset và fetch lại khi filters thay đổi
  useEffect(() => {
    setPosts([]);
    setPagination((prev) => ({ ...prev, currentPage: 0, totalPages: 1 }));
    fetchData(1, { append: false });
  }, [fetchData]);

  // Infinite scroll
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || loadingMore) return;

          if (pagination.currentPage < pagination.totalPages) {
            fetchData(pagination.currentPage + 1, { append: true });
          }
        });
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [pagination, loadingMore, fetchData]);

  // Xử lý xóa bài viết
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      // Cập nhật tổng số lượng
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Không thể xóa bài viết");
    }
  };

  // Xử lý thay đổi filter
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset tất cả filters
  const handleResetFilters = () => {
    setFilters({
      email: "",
      username: "",
      postId: "",
      fromDate: "",
      toDate: "",
      status: "",
      minViolations: "",
      maxViolations: "",
      privacy: "",
      hasFiles: "",
    });
  };

  const HandlerBlockPost = async (postId, isBlock) => {
    try {
      setLoadUpdate(true);
      const res = await updatePostBlock(postId);
      if (res.success) {
        // Cập nhật trạng thái bài viết trong danh sách
        setPosts((prev) => {
          return prev.map((post) => {
            return post._id == postId
              ? { ...post, isBlocked: !post.isBlocked }
              : post;
          });
        });

        NotificationService.success({
          title: "Cập nhật thành công!",
          text: `Đã ${isBlock ? "Mở Khoá " : "Khoá"} bài viết thành công!  `,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
      setError(err?.toString() || "Có lỗi xảy ra khi cập nhật");

      NotificationService.error({
        title: "Cập nhật Thất Bại!",
        text: `Đã ${isBlock ? "Mở Khoá " : "Khoá"} bài viết thất bại!  `,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoadUpdate(false);
    }
  };

  const handleBlockComment = async (postId, isBlock) => {
    try {
      setLoadUpdate(true);

      const res = await updatePostCommentBlock(postId);
      if (res.success) {
        // Cập nhật trạng thái bài viết trong danh sách
        setPosts((prev) => {
          return prev.map((post) => {
            return post._id == postId
              ? { ...post, isBlockedComment: !post.isBlockedComment }
              : post;
          });
        });

        NotificationService.success({
          title: "Cập nhật thành công!",
          text: `Đã ${
            isBlock ? "Mở Khoá " : "Khoá"
          } bình luận bài viết thành công!  `,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error(error);
      setError(error?.toString() || "Có lỗi xảy ra khi cập nhật");
      NotificationService.error({
        title: "Cập nhật Thất Bại!",
        text: `Đã ${
          isBlock ? "Mở Khoá " : "Khoá"
        } bình luận bài viết thất bại!  `,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoadUpdate(false);
    }
  };

  // Render search và filters
  const renderFilters = () => (
    <div className="filters-section" style={{ display: "block" }}>
      <div
        className="card-header bg-white d-flex justify-content-between align-items-center cursor-pointer"
        onClick={() => setShowFilters((v) => !v)}
        style={{ cursor: "pointer" }}
      >
        <h6 className="mb-0">
          <i className="ri-filter-3-line me-2 text-primary"></i>
          Bộ lọc tìm kiếm
        </h6>
        <div className="d-flex align-items-center gap-2">
          <i
            className={`ri-arrow-${showFilters ? "up" : "down"}-s-line`}
            style={{ fontSize: "18px" }}
          ></i>
        </div>
      </div>
      <Collapse in={showFilters}>
        <div>
          <div className="row g-2 mb-3">
            {/* Tìm kiếm cơ bản */}
            <div className="col-md-3">
              <input
                className="form-control form-control-sm"
                placeholder="Email người dùng"
                value={filters.email}
                onChange={(e) => handleFilterChange("email", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control form-control-sm"
                placeholder="Username"
                value={filters.username}
                onChange={(e) => handleFilterChange("username", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control form-control-sm"
                placeholder="ID bài viết"
                value={filters.postId}
                onChange={(e) => handleFilterChange("postId", e.target.value)}
              />
            </div>

            {/* Lọc theo thời gian */}
            <div className="col-md-3">
              <input
                type="date"
                className="form-control form-control-sm"
                placeholder="Từ ngày"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control form-control-sm"
                placeholder="Đến ngày"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
              />
            </div>

            {/* Lọc theo trạng thái */}
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="blocked">Đã chặn</option>
              </select>
            </div>

            {/* Lọc theo số vi phạm */}
            <div className="col-md-2">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Số lỗi từ"
                value={filters.minViolations}
                onChange={(e) =>
                  handleFilterChange("minViolations", e.target.value)
                }
                min="0"
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Số lỗi đến"
                value={filters.maxViolations}
                onChange={(e) =>
                  handleFilterChange("maxViolations", e.target.value)
                }
                min="0"
              />
            </div>

            {/* Lọc theo quyền riêng tư */}
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filters.privacy}
                onChange={(e) => handleFilterChange("privacy", e.target.value)}
              >
                <option value="">Tất cả quyền riêng tư</option>
                <option value="public">Công khai</option>
                <option value="private">Riêng tư</option>
                <option value="friends">Bạn bè</option>
              </select>
            </div>

            {/* Lọc theo file đính kèm */}
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filters.hasFiles}
                onChange={(e) => handleFilterChange("hasFiles", e.target.value)}
              >
                <option value="">Tất cả file</option>
                <option value="true">Có file đính kèm</option>
                <option value="false">Không có file</option>
              </select>
            </div>

            {/* Nút reset */}
            <div className="col-md-2">
              <button
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={handleResetFilters}
              >
                <i className="ri-refresh-line me-1"></i> Reset
              </button>
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div className="row g-2 mb-3">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Tìm thấy {pagination.total} bài viết
                </small>
                <div className="d-flex gap-2">
                  <span className="badge bg-primary">
                    Đang hoạt động: {posts.filter((p) => !p.isBlocked).length}
                  </span>
                  <span className="badge bg-danger">
                    Đã chặn: {posts.filter((p) => p.isBlocked).length}
                  </span>
                  <span className="badge bg-warning">
                    Có vi phạm:{" "}
                    {posts.filter((p) => p.violationCount > 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Collapse>
    </div>
  );

  // Render danh sách bài viết
  const renderPosts = () => (
    <div className="content-list">
      <div className="row g-3">
        {posts.map((post, index) => (
          <div
            key={post._id + "-" + index}
            className="col-12 col-md-6 col-lg-4 col-xl-3"
          >
            <div
              className={`card h-100 shadow-sm ${
                post.isBlocked ? "border-danger" : ""
              }`}
            >
              {post.isBlocked && (
                <div className="card-header bg-danger text-white py-1">
                  <small>
                    <i className="ri-alarm-warning-line me-1"></i> ĐÃ CHẶN
                  </small>
                </div>
              )}

              <div className="card-body">
                {/* Header với thông tin user */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar-container">
                      <a href={`/profile/${post.userCreateID?._id}`}>
                        {post.userCreateID?.profile?.avatar ? (
                          <img
                            src={post.userCreateID.profile.avatar}
                            alt="avatar"
                            className="user-avatar"
                          />
                        ) : (
                          <i className="ri-user-line text-secondary"></i>
                        )}
                      </a>
                    </div>
                    <div className="ms-2">
                      <h6
                        className="mb-0 fw-semibold text-truncate"
                        style={{ maxWidth: "120px" }}
                      >
                        {post.userCreateID?.username}
                      </h6>
                      <small className="text-muted">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </small>
                    </div>
                  </div>

                  {/* Thông tin nhanh */}
                  <div className="text-end">
                    <div className="small text-muted">
                      <div>
                        <i className="ri-heart-line"></i> {post.likeCount || 0}
                      </div>
                      <div>
                        <i className="ri-chat-3-line"></i>{" "}
                        {post.commentCount || 0}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Nội dung */}
                <p className="">
                  #ID:
                  {post._id?.substring(0, 150)}
                  {post._id?.length > 150 && "..."}
                </p>

                {/* Nội dung */}
                <p className="card-text post-content">
                  {post.content?.substring(0, 150)}
                  {post.content?.length > 150 && "..."}
                </p>

                {/* Thông tin chi tiết */}
                <div className="post-meta">
                  <div className="row g-1 small text-muted">
                    <div className="col-6">
                      <i className="ri-shield-keyhole-line me-1"></i>
                      {post.privacy === "public"
                        ? "Công khai"
                        : post.privacy === "private"
                        ? "Riêng tư"
                        : "Bạn bè"}
                    </div>
                    <div className="col-6">
                      <i className="ri-alert-line me-1"></i>
                      {post.reportCount || 0} lỗi
                    </div>
                    <div className="col-6">
                      <i className="ri-file-line me-1"></i>
                      {post.files?.length || 0} file
                    </div>
                    <div className="col-6">
                      <i className="ri-edit-line me-1"></i>
                      {post.isEdited ? "Đã sửa" : "Chưa sửa"}
                    </div>
                  </div>
                </div>
                {/* trạng thái xoá bởi user */}
                {post.isDeletedByUser === true && (
                  <div className="">
                    <i className="fa-solid fa-trash-can me-1"></i>
                    <p className="badge bg-danger">Người Dùng Đã Xoá</p>
                  </div>
                )}
                {/* trạng thái ẩn comment */}
                {post.isBlockedComment === true && (
                  <div className="">
                    <i className="fa-regular fa-comment me-1"></i>
                    <p className="badge bg-secondary">Bình Luận đã ẩn</p>
                  </div>
                )}

                {/* Tags và emotions */}
                {(post.tags?.length > 0 || post.emotions?.length > 0) && (
                  <div className="post-tags mt-2">
                    {post.tags?.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="badge bg-light text-dark me-1 mb-1"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.emotions?.slice(0, 2).map((emotion, index) => (
                      <span key={index} className="badge bg-info me-1 mb-1">
                        {emotion}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="card-footer bg-white border-top-0 pt-0">
                <div className="d-flex justify-content-between">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => window.open(`/posts/${post._id}`, "_blank")}
                    title="Xem chi tiết"
                  >
                    <i className="ri-eye-line"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => {
                      HandlerBlockPost(post._id, post.isBlocked);
                    }}
                    title={post.isBlocked ? "Bỏ chặn" : "Chặn bài viết"}
                  >
                    {loadUpdate ? (
                      <div
                        className="spinner-border text-warning"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <i
                        className={
                          post.isBlocked
                            ? "ri-lock-unlock-line"
                            : "ri-lock-line"
                        }
                      ></i>
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      handleBlockComment(post._id, post.isBlockedComment);
                    }}
                    title={
                      post.isBlockedComment
                        ? "Bỏ chặn bình luận"
                        : "Chặn bình luận"
                    }
                  >
                    {loadUpdate ? (
                      <div
                        className="spinner-border text-secondary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : post.isBlockedComment ? (
                      <i className="fa-regular fa-comment"></i>
                    ) : (
                      <i className="fa-solid fa-comment-slash"></i>
                    )}
                  </button>
                  <a
                    className="btn btn-sm btn-outline-info"
                    href={`/admin/content/reports/${post._id}`}
                    title="Xem báo cáo"
                  >
                    <i className="ri-flag-line"></i>
                  </a>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(post._id)}
                    title="Xóa bài viết"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: "1px" }} />

      {/* Loading indicator */}
      {loadingMore && (
        <div className="text-center my-4">
          <div className="spinner-border spinner-border-sm" role="status" />
          <span className="ms-2">Đang tải thêm bài viết...</span>
        </div>
      )}

      {/* Hiển thị thông báo hết dữ liệu */}
      {!loadingMore &&
        pagination.currentPage >= pagination.totalPages &&
        posts.length > 0 && (
          <div className="text-center my-4">
            <small className="text-muted">
              Đã hiển thị tất cả {posts.length} bài viết
            </small>
          </div>
        )}
    </div>
  );

  return (
    <div className="admin-content-management container">
      <div className="page-header mt-3">
        <h1>Quản lý bài viết</h1>
        <p>Quản lý và kiểm duyệt tất cả bài viết trong hệ thống</p>
      </div>

      {/* Bộ lọc */}
      {renderFilters()}

      {/* Nội dung */}
      <div className="content-section">
        {error && (
          <div className="alert alert-danger d-flex align-items-center">
            <i className="ri-error-warning-line me-2"></i>
            {error}
          </div>
        )}

        {loading && posts.length === 0 ? (
          <div className="loading-container text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Đang tải danh sách bài viết...</p>
          </div>
        ) : (
          renderPosts()
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="empty-state text-center py-5">
            <i className="ri-inbox-line fs-1 text-muted"></i>
            <h3 className="mt-2">Không tìm thấy bài viết nào</h3>
            <p className="text-muted">
              Hãy thử điều chỉnh bộ lọc để tìm kiếm bài viết phù hợp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContentManagement;
