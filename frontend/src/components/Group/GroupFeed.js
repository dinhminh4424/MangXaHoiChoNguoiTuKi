// components/Group/GroupFeed.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Alert, Spinner } from "react-bootstrap";
import groupService from "../../services/groupService";
import Post from "../Post/Post";
import { usePost } from "../../contexts/PostContext";
import "./GroupFeed.css";
import notificationService from "../../services/notificationService";

const GroupFeed = ({ groupId, canPost, refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { deletePost, reportPost } = usePost();

  // Ref để theo dõi phần tử cuối
  const observer = useRef();
  const lastPostRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadPosts(page + 1, true);
          }
        },
        { rootMargin: "300px" } // Tải trước khi đến cuối 300px
      );

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, page]
  );

  const loadPosts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
          setPosts([]);
        } else {
          setLoadingMore(true);
        }

        const response = await groupService.getGroupFeed(groupId, {
          page: pageNum,
          limit: 10,
        });

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
        setLoadingMore(false);
      }
    },
    [groupId]
  );

  // const handleDeletePost = (postId) => {
  //   setPosts((prev) => prev.filter((post) => post._id !== postId));
  // };

  const handleUpdatePost = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost.__id ? updatedPost : post))
    );
  };

  const handleDeletePost = async (postId) => {
    try {
      const res = await deletePost(postId);
      if (res.success) {
        console.log("Xóa bài viết thành công");

        notificationService.success({
          title: "Xoá bài viết thành công",
          text: "Bạn đã xoá bài viết thành công",
          timer: 3000,
          showConfirmButton: false,
        });
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      } else {
        notificationService.error({
          title: "Xoá bài viết thất bại",
          text: res.message,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      notificationService.error({
        title: "Xoá bài viết thất bại",
        text: err.message || "Có lỗi xảy ra",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  // Handle post report
  const handleReportPost = async (reportData) => {
    try {
      const finalReportData = {
        targetType: reportData.targetType,
        targetId: reportData.targetId,
        reason: reportData.reason,
        notes: reportData.notes,
        files: reportData.files,
      };

      const res = await reportPost(finalReportData);
      if (res.success) {
        notificationService.success({
          title: "Thành Công",
          text: res?.message,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error reporting post:", error);
      notificationService.error({
        title: "Thất Bại",
        text: error.message || "Có lỗi xảy ra",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  // Tải lại khi refreshTrigger thay đổi
  useEffect(() => {
    loadPosts(1);
  }, [loadPosts, refreshTrigger]);

  // Hiệu ứng loading đầu tiên
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
          <div className="display-1 mb-3">Empty</div>
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
            {posts.map((post, index) => (
              <div
                key={post._id}
                ref={index === posts.length - 1 ? lastPostRef : null} // Gắn ref vào bài cuối
              >
                <Post
                  post={post}
                  onDelete={handleDeletePost}
                  onUpdate={handleUpdatePost}
                  onReport={handleReportPost}
                />
              </div>
            ))}
          </div>

          {/* Hiệu ứng loading khi kéo */}
          {loadingMore && (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Đang tải thêm...</span>
            </div>
          )}

          {/* Không còn bài */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center text-muted py-4">
              <small>Đã hiển thị tất cả bài viết</small>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GroupFeed;
