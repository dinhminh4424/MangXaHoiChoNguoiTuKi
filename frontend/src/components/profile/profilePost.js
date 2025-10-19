// components/profile/ProfilePosts.js
import React, { useState, useEffect, useCallback } from "react";
import { usePost } from "../../contexts/PostContext";
import Post from "../Post/Post";
import { RefreshCw } from "lucide-react";

const ProfilePosts = ({ userId }) => {
  const { posts, fetchPosts, loading, error, deletePost } = usePost();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load posts cho profile
  const loadProfilePosts = useCallback(
    async (pageNum = 1, append = false) => {
      if (refreshing) return;

      setRefreshing(true);
      try {
        const params = {
          page: pageNum,
          limit: 10,
          userCreateID: userId, // Lọc theo userId
          privacy: userId ? "all" : "public",
          sortBy: "newest",
        };

        const response = await fetchPosts(params);

        if (!append || !response.posts) {
          setHasMore(true);
        } else {
          setHasMore(response.posts.length === 10);
        }

        setPage(pageNum);
      } catch (err) {
        console.error("Error loading profile posts:", err);
      } finally {
        setRefreshing(false);
      }
    },
    [fetchPosts, userId, refreshing]
  );

  // Initial load
  useEffect(() => {
    loadProfilePosts(1, false);
  }, [userId]);

  // Refresh posts
  const handleRefresh = () => {
    loadProfilePosts(1, false);
  };

  // Load more posts
  const loadMore = () => {
    if (!refreshing && hasMore) {
      loadProfilePosts(page + 1, true);
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // Filter posts by user
  const userPosts = posts.filter((post) =>
    userId ? post.author?._id === userId : true
  );

  return (
    <div className="profile-posts">
      {/* Header với refresh button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">📝 Bài viết</h5>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "spinning" : ""} />
          <span className="ms-2">Làm mới</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && userPosts.length === 0 && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải bài viết...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
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
      {!loading && userPosts.length === 0 && !error && (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <div className="empty-icon mb-3">📝</div>
            <h5>Chưa có bài viết nào</h5>
            <p className="mb-0">Người dùng chưa đăng bài viết nào</p>
          </div>
        </div>
      )}

      {/* Posts List */}
      {userPosts.length > 0 && (
        <div className="posts-container">
          {userPosts.map((post) => (
            <div key={post._id} className="mb-4">
              <Post
                post={post}
                onDelete={handleDeletePost}
                showActions={true}
              />
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-4">
              <button
                className="btn btn-outline-primary"
                onClick={loadMore}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Đang tải...
                  </>
                ) : (
                  "Tải thêm bài viết"
                )}
              </button>
            </div>
          )}

          {/* End of Posts */}
          {!hasMore && userPosts.length > 0 && (
            <div className="text-center mt-4">
              <div className="text-muted">
                <p>Bạn đã xem hết bài viết!</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePosts;
