// components/Group/GroupFeed.js
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Alert, Spinner, Button } from "react-bootstrap";
import groupService from "../../services/groupService";
import Post from "../Post/Post";
import "./GroupFeed.css";

const GroupFeed = ({ groupId, canPost, refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);

        const response = await groupService.getGroupFeed(groupId, {
          page: pageNum,
          limit: 10,
        });

        console.log(
          "==========================================================================="
        );
        console.log(response);
        console.log(
          "==========================================================================="
        );
        if (response.success) {
          const newPosts = response.posts || [];

          if (append) {
            setPosts((prev) => [...prev, ...newPosts]);
          } else {
            setPosts(newPosts);
          }

          setHasMore(newPosts.length === 10);
          setPage(pageNum);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải bài viết");
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  const handleDeletePost = async (postId) => {
    try {
      setPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      setError("Lỗi khi xóa bài viết");
    }
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts, refreshTrigger]); // Thêm refreshTrigger vào dependency

  if (loading && posts.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Đang tải bài viết...</span>
      </div>
    );
  }

  return (
    <div className="group-feed">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📝</div>
          <h3 className="h4 mb-3">Chưa có bài viết nào</h3>
          <p className="text-muted">
            {canPost
              ? "Hãy là người đầu tiên đăng bài trong nhóm!"
              : "Tham gia nhóm để xem và đăng bài viết"}
          </p>
        </div>
      ) : (
        <>
          <div className="posts-list">
            {posts.map((post) => (
              <Post
                key={post._id}
                post={post}
                onDelete={handleDeletePost}
                onUpdate={handleUpdatePost}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more text-center mt-4">
              <Button
                variant="outline-primary"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Đang tải...
                  </>
                ) : (
                  "Tải thêm bài viết"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GroupFeed;
