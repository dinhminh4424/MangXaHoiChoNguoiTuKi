// components/Post/PostComments.js
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Smile,
  Image,
  Paperclip,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import commentService from "../../services/commentService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import "./PostComments.css";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const PostComments = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const commentEndRef = useRef(null);

  const loadComments = async (pageNum = 1, append = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await commentService.getCommentsByPost(postId, {
        page: pageNum,
        limit: 10,
      });

      const newComments = response.comments || [];

      if (append) {
        setComments((prev) => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }

      setHasMore(newComments.length === 10);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải bình luận");
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await commentService.createComment({
        postID: postId,
        content: commentText.trim(),
      });

      setComments((prev) => [response.comment, ...prev]);
      setCommentText("");

      if (onCommentAdded) {
        onCommentAdded(response.comment);
      }

      setTimeout(() => {
        commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  };

  useEffect(() => {
    loadComments(1);
  }, [postId]);

  useEffect(() => {
    if (comments.length > 0) {
      commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  const CommentItem = ({ comment }) => {
    const [showMenu, setShowMenu] = useState(false);
    const isCommentOwner = comment.userID?._id === user?.userId;

    return (
      <div className="comment-item">
        <div className="comment-avatar">
          <img
            src={comment.userID?.avatar || "/images/default-avatar.png"}
            alt="Avatar"
          />
        </div>

        <div className="comment-content">
          <div className="comment-header">
            <div className="comment-user">
              <span className="user-name">
                {comment.userID?.fullName || "Người dùng"}
              </span>
              <span className="comment-time">
                {dayjs(comment.createdAt).fromNow()}
              </span>
            </div>

            <div className="comment-actions">
              <button className="action-btn like">
                <Heart size={14} />
              </button>

              <div className="menu-container">
                <button
                  className="menu-toggle"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreHorizontal size={14} />
                </button>

                {showMenu && (
                  <div className="dropdown-menu">
                    {isCommentOwner ? (
                      <>
                        <button className="menu-item">Chỉnh sửa</button>
                        <button className="menu-item delete">Xóa</button>
                      </>
                    ) : (
                      <>
                        <button className="menu-item">Báo cáo</button>
                        <button className="menu-item">Ẩn bình luận</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="comment-text">{comment.content}</div>

          {comment.file && (
            <div className="comment-file">
              {comment.file.type === "image" ? (
                <img
                  src={comment.file.fileUrl}
                  alt="Attachment"
                  className="file-image"
                />
              ) : (
                <div className="file-document">
                  <Paperclip size={16} />
                  <span className="file-name">{comment.file.fileName}</span>
                  <a
                    href={comment.file.fileUrl}
                    download
                    className="download-link"
                  >
                    Tải xuống
                  </a>
                </div>
              )}
            </div>
          )}

          {comment.replyCount > 0 && (
            <button className="view-replies">
              💬 Xem {comment.replyCount} phản hồi
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="post-comments">
      {/* Comment Input */}
      <form className="comment-form" onSubmit={submitComment}>
        <div className="comment-input-container">
          <div className="user-avatar">
            <img
              src={user?.avatar || "/images/default-avatar.png"}
              alt="Your avatar"
            />
          </div>

          <div className="input-wrapper">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              disabled={submitting}
              className="comment-textarea"
              rows="2"
            />

            <div className="input-actions">
              <div className="action-buttons">
                <button
                  type="button"
                  className="action-btn"
                  disabled={submitting}
                >
                  <Smile size={18} />
                </button>
                <button
                  type="button"
                  className="action-btn"
                  disabled={submitting}
                >
                  <Image size={18} />
                </button>
                <button
                  type="button"
                  className="action-btn"
                  disabled={submitting}
                >
                  <Paperclip size={18} />
                </button>
              </div>

              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="submit-btn"
              >
                {submitting ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">
            ×
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 && !loading ? (
          <div className="empty-comments">
            <div className="empty-icon">💬</div>
            <p>Chưa có bình luận nào</p>

            <span>Hãy là người đầu tiên bình luận!</span>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="load-more">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="load-more-btn"
                >
                  {loading ? "Đang tải..." : "Tải thêm bình luận"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div ref={commentEndRef} />
    </div>
  );
};

export default PostComments;
