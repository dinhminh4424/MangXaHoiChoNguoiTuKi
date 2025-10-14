import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Smile,
  Image,
  Paperclip,
  Heart,
  MoreHorizontal,
  Reply,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import commentService from "../../services/commentService";
import { useEmotionPicker } from "../../hooks/useEmotionPicker";
import EmotionPicker from "./EmojiPicker";
import {
  EMOTIONS,
  EMOTION_ICONS,
  EMOTION_COLORS,
} from "../../constants/emotions";
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
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState({});
  const commentEndRef = useRef(null);
  const replyInputRefs = useRef({});

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

  const loadReplies = async (commentId) => {
    try {
      const response = await commentService.getCommentReplies(commentId);
      return response.comments || [];
    } catch (err) {
      console.error("Error loading replies:", err);
      return [];
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

  const submitReply = async (parentComment) => {
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await commentService.createComment({
        postID: postId,
        content: replyText.trim(),
        parentCommentID: parentComment._id,
      });

      // Cập nhật comment với reply mới
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === parentComment._id) {
            return {
              ...comment,
              replyCount: (comment.replyCount || 0) + 1,
              replies: [...(comment.replies || []), response.comment],
            };
          }
          return comment;
        })
      );

      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi gửi phản hồi");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLikeComment = async (comment, emotion = "like") => {
    try {
      if (comment.isLiked) {
        await commentService.unlikeComment(comment._id);
        setComments((prev) =>
          prev.map((c) =>
            c._id === comment._id
              ? {
                  ...c,
                  isLiked: false,
                  userEmotion: null,
                  likeCount: Math.max(0, (c.likeCount || 0) - 1),
                }
              : c
          )
        );
      } else {
        await commentService.likeComment(comment._id, emotion);
        setComments((prev) =>
          prev.map((c) =>
            c._id === comment._id
              ? {
                  ...c,
                  isLiked: true,
                  userEmotion: emotion,
                  likeCount: (c.likeCount || 0) + 1,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleEmotionSelect = async (comment, emotion) => {
    await toggleLikeComment(comment, emotion);
  };

  const toggleReplies = async (commentId) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }));
    } else {
      try {
        const replies = await loadReplies(commentId);
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId ? { ...comment, replies } : comment
          )
        );
        setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      } catch (err) {
        console.error("Error loading replies:", err);
      }
    }
  };

  const startReplying = (comment) => {
    setReplyingTo(comment);
    // Focus vào input sau khi render
    setTimeout(() => {
      const input = replyInputRefs.current[comment._id];
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyText("");
    setReplyingTo(null);
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

  const CommentItem = ({ comment, isReply = false, isLast }) => {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const menuRef = useRef(null);
    const isCommentOwner = comment.userID?._id === user?.userId;

    // Emotion picker cho like button
    const {
      showEmotionPicker,
      hoverEmotion,
      likeButtonRef,
      pickerRef,
      setHoverEmotion,
      handleEmotionSelect: handleCommentEmotionSelect,
      handleLikeMouseEnter,
      handleLikeMouseLeave,
      handlePickerMouseEnter,
      handlePickerMouseLeave,
    } = useEmotionPicker((emotion) => handleEmotionSelect(comment, emotion));

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuVisible(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [menuRef]);

    const handleEdit = () => console.log("Edit comment:", comment._id);
    const handleDelete = () => console.log("Delete comment:", comment._id);
    const handleReport = () => console.log("Report comment:", comment._id);
    const handleHide = () => console.log("Hide comment:", comment._id);

    const getLikeIcon = () => {
      if (comment.isLiked && comment.userEmotion) {
        return EMOTION_ICONS[comment.userEmotion];
      }
      if (hoverEmotion) {
        return EMOTION_ICONS[hoverEmotion] || getDefaultLikeIcon();
      }
      return getDefaultLikeIcon();
    };

    const getDefaultLikeIcon = () => (
      <svg
        width="16"
        height="16"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M.836 10.252h1.39c2.098 0 4.112-.074 5.608-1.544a8 8 0 0 0 2.392-5.566c0-3.385 4.278-1.8 4.278 1.22v3.89a2 2 0 0 0 2 2h4.709c1.046 0 1.925.806 1.946 1.852c.065 3.336-.49 5.763-1.84 8.346c-.778 1.49-2.393 2.32-4.073 2.283c-11.675-.261-10.165-2.231-16.41-2.231"
        />
      </svg>
    );

    const getLikeButtonStyle = () => {
      if (hoverEmotion) {
        return { color: EMOTION_COLORS[hoverEmotion] };
      }
      if (comment.isLiked && comment.userEmotion) {
        return { color: EMOTION_COLORS[comment.userEmotion] };
      }
      return {};
    };

    return (
      <div className={`comment-item ${isReply ? "comment-reply" : ""}`}>
        <div className="comment-avatar">
          <img
            src={
              comment.userID?.profile?.avatar || "/images/default-avatar.png"
            }
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
              <div className="comment-more-actions">
                <div className="menu-container" ref={menuRef}>
                  <button
                    className="action-btn"
                    onClick={() => setMenuVisible(!isMenuVisible)}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {isMenuVisible && (
                    <div className="custom-dropdown-menu">
                      {isCommentOwner ? (
                        <>
                          <button onClick={handleEdit} className="menu-item">
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={handleDelete}
                            className="menu-item delete"
                          >
                            Xóa
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={handleHide} className="menu-item">
                            Ẩn bình luận
                          </button>
                          <button onClick={handleReport} className="menu-item">
                            Báo cáo bình luận
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
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

          <div className="comment-footer-actions">
            <div className="action-group">
              <button
                ref={likeButtonRef}
                className={`action-btn like ${comment.isLiked ? "liked" : ""}`}
                onClick={() => toggleLikeComment(comment)}
                onMouseEnter={handleLikeMouseEnter}
                onMouseLeave={handleLikeMouseLeave}
                style={getLikeButtonStyle()}
              >
                <span className="like-icon">{getLikeIcon()}</span>
                {comment.likeCount > 0 && (
                  <span className="like-count">{comment.likeCount}</span>
                )}
              </button>

              <EmotionPicker
                isOpen={showEmotionPicker}
                selectedEmotion={comment.isLiked ? comment.userEmotion : null}
                hoverEmotion={hoverEmotion}
                onEmotionSelect={handleCommentEmotionSelect}
                onHoverEmotion={setHoverEmotion}
                pickerRef={pickerRef}
                onMouseEnter={handlePickerMouseEnter}
                onMouseLeave={handlePickerMouseLeave}
                position={isLast ? "top-left" : "left-top"} // Có thể thay đổi thành các vị trí khác
              />
            </div>
            {!isReply && (
              <button
                className="action-btn reply-btn"
                onClick={() => startReplying(comment)}
                title="Trả lời"
              >
                <Reply size={14} /> Trả lời
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo?._id === comment._id && (
            <div className="reply-input-container">
              <div className="user-avatar small">
                <img
                  src={user?.avatar || "/images/default-avatar.png"}
                  alt="Your avatar"
                />
              </div>
              <div className="reply-input-wrapper">
                <input
                  ref={(el) => (replyInputRefs.current[comment._id] = el)}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Trả lời ${
                    comment.userID?.fullName || "người dùng"
                  }...`}
                  disabled={submitting}
                  className="reply-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitReply(comment);
                    }
                    if (e.key === "Escape") {
                      cancelReply();
                    }
                  }}
                />
                <div className="reply-actions">
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="cancel-reply-btn"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => submitReply(comment)}
                    disabled={!replyText.trim() || submitting}
                    className="submit-reply-btn"
                  >
                    {submitting ? (
                      <div className="loading-spinner small"></div>
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replyCount > 0 && !isReply && (
            <div className="replies-section">
              <button
                className="view-replies-btn"
                onClick={() => toggleReplies(comment._id)}
              >
                {expandedReplies[comment._id] ? "📂" : "💬"}
                {expandedReplies[comment._id] ? " Ẩn" : " Xem"}{" "}
                {comment.replyCount} phản hồi
              </button>

              {expandedReplies[comment._id] && comment.replies && (
                <div className="replies-list">
                  {comment.replies.map((reply, index) => (
                    <CommentItem
                      key={reply._id}
                      comment={reply}
                      isLast={index === comments.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
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
            {comments.map((comment, index) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                isLast={index === comments.length - 1}
              />
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
