// components/Post/PostComments.js
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Smile,
  Image,
  Paperclip,
  MoreHorizontal,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import commentService from "../../services/commentService";
import { useEmotionPicker } from "../../hooks/useEmotionPicker";
import EmotionPicker from "./EmojiPicker";
import { EMOTION_ICONS, EMOTION_COLORS } from "../../constants/emotions";
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

  // Load comments
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

  // Submit comment
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

  // Load more comments
  const loadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  };

  useEffect(() => {
    loadComments(1);
  }, [postId]);

  return (
    <div className="post-comments">
      {/* Comment Input */}
      <form className="comment-form" onSubmit={submitComment}>
        <div className="comment-input-container">
          <div className="user-avatar">
            <img
              src={user?.avatar || "/assets/images/default-avatar.png"}
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
                postId={postId}
                depth={0}
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

// CommentItem Component với nested replies vô hạn
const CommentItem = ({ comment, postId, depth = 0, isLast }) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  const [hasLoadedReplies, setHasLoadedReplies] = useState(false);
  const replyInputRef = useRef(null);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef(null);

  const isCommentOwner = comment.userID?._id === user?.userId;

  // Emotion picker
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

  // Load replies - SỬA LẠI HOÀN TOÀN
  const loadReplies = async (pageNum = 1, append = false) => {
    if (loadingReplies) return;

    setLoadingReplies(true);
    try {
      const response = await commentService.getCommentReplies(comment._id, {
        page: pageNum,
        limit: 10,
      });

      const newReplies = response.comments || [];
      const totalReplies = response.total || 0;

      if (append) {
        setReplies((prev) => [...prev, ...newReplies]);
      } else {
        setReplies(newReplies);
        setHasLoadedReplies(true);
      }

      // Tính toán hasMoreReplies
      const currentTotal = append
        ? replies.length + newReplies.length
        : newReplies.length;
      setHasMoreReplies(currentTotal < totalReplies);

      setRepliesPage(pageNum);

      // Nếu là lần đầu load, tự động hiển thị replies
      if (!append && newReplies.length > 0) {
        setShowReplies(true);
      }
    } catch (err) {
      console.error("Error loading replies:", err);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Toggle replies visibility - SỬA LẠI
  const toggleReplies = async () => {
    if (!showReplies) {
      // Nếu chưa load replies bao giờ, load lần đầu
      if (!hasLoadedReplies && replies.length === 0) {
        await loadReplies(1, false);
      }
      setShowReplies(true);
    } else {
      setShowReplies(false);
    }
  };

  // Load more replies
  const loadMoreReplies = () => {
    if (!loadingReplies && hasMoreReplies) {
      loadReplies(repliesPage + 1, true);
    }
  };

  // Submit reply - SỬA LẠI
  const submitReply = async () => {
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const response = await commentService.createComment({
        postID: postId,
        content: replyText.trim(),
        parentCommentID: comment._id,
      });

      const newReply = response.comment;

      // Thêm reply mới vào đầu danh sách
      setReplies((prev) => [newReply, ...prev]);
      setReplyText("");
      setReplying(false);

      // Đảm bảo hiển thị replies sau khi gửi
      setShowReplies(true);
      setHasLoadedReplies(true);

      // Cập nhật reply count
      comment.replyCount = (comment.replyCount || 0) + 1;
    } catch (err) {
      console.error("Error submitting reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Start replying
  const startReplying = () => {
    setReplying(true);
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 100);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyText("");
    setReplying(false);
  };

  // Like/unlike comment
  const toggleLikeComment = async (commentToLike, emotion = "like") => {
    try {
      if (commentToLike.isLiked) {
        await commentService.unlikeComment(commentToLike._id);
        // Update local state
        if (commentToLike._id === comment._id) {
          comment.isLiked = false;
          comment.userEmotion = null;
          comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
        } else {
          // Update in replies
          setReplies((prev) =>
            prev.map((reply) =>
              reply._id === commentToLike._id
                ? {
                    ...reply,
                    isLiked: false,
                    userEmotion: null,
                    likeCount: Math.max(0, (reply.likeCount || 0) - 1),
                  }
                : reply
            )
          );
        }
      } else {
        await commentService.likeComment(commentToLike._id, emotion);
        // Update local state
        if (commentToLike._id === comment._id) {
          comment.isLiked = true;
          comment.userEmotion = emotion;
          comment.likeCount = (comment.likeCount || 0) + 1;
        } else {
          // Update in replies
          setReplies((prev) =>
            prev.map((reply) =>
              reply._id === commentToLike._id
                ? {
                    ...reply,
                    isLiked: true,
                    userEmotion: emotion,
                    likeCount: (reply.likeCount || 0) + 1,
                  }
                : reply
            )
          );
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleEmotionSelect = async (commentToLike, emotion) => {
    await toggleLikeComment(commentToLike, emotion);
  };

  // Menu handlers
  const handleEdit = () => console.log("Edit comment:", comment._id);
  const handleDelete = () => console.log("Delete comment:", comment._id);
  const handleReport = () => console.log("Report comment:", comment._id);
  const handleHide = () => console.log("Hide comment:", comment._id);

  // Close menu when clicking outside
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

  // Auto load replies for first level comments - SỬA LẠI
  useEffect(() => {
    if (depth < 2 && comment.replyCount > 0 && !hasLoadedReplies) {
      loadReplies(1, false);
    }
  }, [comment._id, depth, comment.replyCount, hasLoadedReplies]);

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

  // Tính toán text hiển thị cho nút xem replies
  const getRepliesButtonText = () => {
    if (loadingReplies) {
      return "Đang tải...";
    }

    if (showReplies) {
      return `Ẩn ${comment.replyCount} phản hồi`;
    }

    return `Xem ${comment.replyCount} phản hồi`;
  };

  return (
    <div
      className={`comment-item ${depth > 0 ? "comment-reply" : ""}`}
      data-depth={depth}
    >
      <div className="comment-avatar">
        <img
          src={
            comment.userID?.profile?.avatar ||
            "/assets/images/default-avatar.png"
          }
          alt="Avatar"
        />
      </div>

      <div className="comment-content">
        <div className="comment-body">
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
        </div>

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
              position={isLast ? "left" : "left"}
            />
          </div>

          <button
            className="action-btn reply-btn"
            onClick={startReplying}
            title="Trả lời"
          >
            <Reply size={14} /> Trả lời
          </button>
        </div>

        {/* Reply Input */}
        {replying && (
          <div className="reply-input-container">
            <div className="user-avatar small">
              <img
                src={user?.avatar || "/assets/images/default-avatar.png"}
                alt="Your avatar"
              />
            </div>
            <div className="reply-input-wrapper">
              <input
                ref={replyInputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Trả lời ${
                  comment.userID?.fullName || "người dùng"
                }...`}
                disabled={submittingReply}
                className="reply-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitReply();
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
                  onClick={submitReply}
                  disabled={!replyText.trim() || submittingReply}
                  className="submit-reply-btn"
                >
                  {submittingReply ? (
                    <div className="loading-spinner small"></div>
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Replies Section - SỬA LẠI PHẦN NÀY */}
        {comment.replyCount > 0 && (
          <div className="replies-section">
            <button
              className="view-replies-btn"
              onClick={toggleReplies}
              disabled={loadingReplies && !showReplies}
            >
              {showReplies ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              {getRepliesButtonText()}
            </button>

            {showReplies && (
              <div className="replies-list">
                {/* Hiển thị replies */}
                {replies.length > 0 ? (
                  <>
                    {replies.map((reply, index) => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        postId={postId}
                        depth={depth + 1}
                        isLast={index === replies.length - 1}
                      />
                    ))}

                    {/* Load More Replies */}
                    {hasMoreReplies && (
                      <div className="load-more-replies">
                        <button
                          onClick={loadMoreReplies}
                          disabled={loadingReplies}
                          className="load-more-replies-btn"
                        >
                          {loadingReplies ? "Đang tải..." : "Tải thêm phản hồi"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  // Hiển thị khi đang loading hoặc không có replies
                  loadingReplies && (
                    <div className="replies-loading">
                      <div className="loading-spinner small"></div>
                      <span>Đang tải phản hồi...</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComments;
