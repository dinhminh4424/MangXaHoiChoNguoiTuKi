// pages/social/Feed.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";
import notificationService from "../../services/notificationService"; // Import service
import {
  Plus,
  Filter,
  Search,
  RefreshCw,
  Users,
  Globe,
  TrendingUp,
  Earth,
} from "lucide-react";
import Post from "../../components/post/Post";
import "./Feed.css";

const Feed = () => {
  const navigate = useNavigate();
  const { posts, fetchPosts, loading, error, setError, deletePost } = usePost();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    emotions: "",
    tags: "",
    privacy: "all",
    sortBy: "newest",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load posts với debounce
  const loadPosts = useCallback(
    async (pageNum = 1, append = false) => {
      if (refreshing) return;

      setRefreshing(true);
      try {
        const params = {
          page: pageNum,
          limit: 5,
          ...filters,
        };

        // Add search if exists
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const response = await fetchPosts(params);

        if (!append || !response.posts) {
          setHasMore(true);
        } else {
          setHasMore(response.posts.length === 10);
        }

        setPage(pageNum);
      } catch (err) {
        console.error("Error loading posts:", err);
      } finally {
        setRefreshing(false);
      }
    },
    [fetchPosts, filters, searchTerm, refreshing]
  );

  // Initial load và khi filters thay đổi
  useEffect(() => {
    loadPosts(1, false);
  }, [filters, searchTerm]);

  useEffect(() => {
    if (error) {
      notificationService.error({
        title: "Thất Bại",
        text: error,
        timer: 3000,
        showConfirmButton: false,
      });
      setError(null);
    }
  }, [error]);

  // Refresh posts
  const handleRefresh = () => {
    loadPosts(1, false);
  };

  // Load more posts
  const loadMore = () => {
    if (!refreshing && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      // Posts will be updated automatically through context
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // Handle post update
  const handleUpdatePost = async (updatedPost) => {
    try {
      navigate(`/posts/edit/${updatedPost._id}`);

      // let req = await updatePost(updatedPost._id, updatedPost);
      // // Posts will be updated automatically through context
      // if (req.success) {
      //   notificationService.success({
      //     title: "Thành Công",
      //     text: req.message,
      //     timer: 3000,
      //     showConfirmButton: false,
      //   });
      // } else {
      //   notificationService.warning({
      //     title: "Có Nhận",
      //     text: req.message,
      //     timer: 3000,
      //     showConfirmButton: false,
      //   });
      // }
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  // Stats calculation
  const getStats = () => {
    const totalPosts = posts.length;
    const publicPosts = posts.filter(
      (post) => post.privacy === "public"
    ).length;
    const anonymousPosts = posts.filter((post) => post.isAnonymous).length;

    return { totalPosts, publicPosts, anonymousPosts };
  };

  const stats = getStats();

  return (
    <div className="feed-container">
      {/* Header */}
      <div className="feed-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="feed-title">📰 Bảng tin</h1>
              <p className="feed-subtitle">Cập nhật mới nhất từ cộng đồng</p>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary btn-refresh"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    size={18}
                    className={refreshing ? "spinning" : ""}
                  />
                </button>
                <button
                  className="btn btn-primary btn-create-post"
                  onClick={() => navigate("/posts/createPost")}
                >
                  {/* <Plus size={18} className="me-2" />  */}
                  <Earth size={18} className="me-2" />
                  Tạo bài viết
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          {/* Sidebar - Filters */}
          <div className="col-lg-3 col-md-4">
            <div className="feed-sidebar">
              {/* Search */}
              <div className="filter-card">
                <div className="filter-header">
                  <Search size={18} />
                  <span>Tìm kiếm</span>
                </div>
                <div className="filter-content">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="filter-card">
                <div className="filter-header">
                  <Filter size={18} />
                  <span>Bộ lọc</span>
                </div>
                <div className="filter-content">
                  {/* Emotions Filter */}
                  <div className="filter-group">
                    <label className="filter-label">Cảm xúc</label>
                    <input
                      type="text"
                      className="form-control filter-input"
                      placeholder="Vui, buồn, lo lắng..."
                      value={filters.emotions}
                      onChange={(e) =>
                        handleFilterChange("emotions", e.target.value)
                      }
                    />
                  </div>

                  {/* Tags Filter */}
                  <div className="filter-group">
                    <label className="filter-label">Tags</label>
                    <input
                      type="text"
                      className="form-control filter-input"
                      placeholder="#suckhoe #tamly..."
                      value={filters.tags}
                      onChange={(e) =>
                        handleFilterChange("tags", e.target.value)
                      }
                    />
                  </div>

                  {/* Privacy Filter */}
                  <div className="filter-group">
                    <label className="filter-label">Quyền riêng tư</label>
                    <select
                      className="form-select filter-select"
                      value={filters.privacy}
                      onChange={(e) =>
                        handleFilterChange("privacy", e.target.value)
                      }
                    >
                      <option value="all">Tất cả</option>
                      <option value="public">Công khai</option>
                      <option value="friends">Bạn bè</option>
                      <option value="private">Ânr danh</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="filter-group">
                    <label className="filter-label">Sắp xếp</label>
                    <select
                      className="form-select filter-select"
                      value={filters.sortBy}
                      onChange={(e) =>
                        handleFilterChange("sortBy", e.target.value)
                      }
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="popular">Phổ biến</option>
                      <option value="most_commented">Nhiều bình luận</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="filter-card">
                <div className="filter-header">
                  <TrendingUp size={18} />
                  <span>Thống kê</span>
                </div>
                <div className="filter-content">
                  <div className="stats-item">
                    <div className="stats-value">{stats.totalPosts}</div>
                    <div className="stats-label">Bài viết</div>
                  </div>
                  <div className="stats-item">
                    <div className="stats-value">{stats.publicPosts}</div>
                    <div className="stats-label">Công khai</div>
                  </div>
                  <div className="stats-item">
                    <div className="stats-value">{stats.anonymousPosts}</div>
                    <div className="stats-label">Ẩn danh</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Posts */}
          <div className="col-lg-9 col-md-8">
            <div className="feed-main">
              {/* Loading State */}
              {loading && posts.length === 0 && (
                <div className="loading-container">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="loading-text">Đang tải bài viết...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="alert alert-danger alert-feed" role="alert">
                  <strong>Lỗi:</strong> {error}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-3"
                    onClick={handleRefresh}
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && posts.length === 0 && !error && (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>Chưa có bài viết nào</h3>
                  <p>Hãy là người đầu tiên chia sẻ cảm xúc của mình!</p>
                  <button
                    className="btn btn-primary btn-empty-action"
                    onClick={() => navigate("/posts/createPost")}
                  >
                    <Plus size={18} className="me-2" />
                    Tạo bài viết đầu tiên
                  </button>
                </div>
              )}

              {/* Posts List */}
              {posts.length > 0 && (
                <div className="posts-container">
                  {posts.map((post) => (
                    <Post
                      key={post._id}
                      post={post}
                      onUpdate={handleUpdatePost}
                      onDelete={handleDeletePost}
                    />
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="load-more-container">
                      <button
                        className="btn btn-outline-primary btn-load-more"
                        onClick={loadMore}
                        disabled={refreshing}
                      >
                        {refreshing ? (
                          <>
                            <div
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            Đang tải...
                          </>
                        ) : (
                          "Tải thêm bài viết"
                        )}
                      </button>
                    </div>
                  )}

                  {/* End of Feed */}
                  {!hasMore && posts.length > 0 && (
                    <div className="end-of-feed">
                      <div className="end-icon">🎉</div>
                      <p>Bạn đã xem hết bài viết!</p>
                      <small className="text-muted">
                        Quay lại sau để xem thêm nội dung mới
                      </small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
