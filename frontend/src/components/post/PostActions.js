// components/Post/PostActions.js
import React, { useState } from "react";
import { Heart, MessageCircle, Share, Smile } from "lucide-react";
import "./PostActions.css";

const PostActions = ({
  isLiked,
  userEmotion,
  emotionIcons,
  isLiking,
  onLike,
  onComment,
  showComments,
  onEmotionSelect,
  likeCount = 0, // Thêm prop likeCount
  commentCount = 0, // Thêm prop commentCount
}) => {
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);

  const emotions = [
    { key: "like", icon: "👍", label: "Thích" },
    { key: "love", icon: "❤️", label: "Yêu thích" },
    { key: "haha", icon: "😂", label: "Haha" },
    { key: "wow", icon: "😮", label: "Wow" },
    { key: "sad", icon: "😢", label: "Buồn" },
    { key: "angry", icon: "😠", label: "Phẫn nộ" },
  ];

  const handleEmotionSelect = (emotion) => {
    setShowEmotionPicker(false);
    if (onEmotionSelect) {
      onEmotionSelect(emotion);
    }
  };

  const handleLikeClick = () => {
    if (onLike) {
      onLike();
    }
  };

  // Hàm format số like
  const formatLikeCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // Lấy icon hiển thị cho like button
  const getLikeIcon = () => {
    if (isLiked && userEmotion) {
      return emotionIcons[userEmotion];
    }
    return "🤍";
  };

  // Lấy class cho like button dựa trên emotion
  const getLikeButtonClass = () => {
    let className = `action-btn like-btn ${isLiked ? "liked" : ""}`;

    if (isLiked && userEmotion) {
      className += ` emotion-${userEmotion}`;
    }

    return className;
  };

  return (
    <div className="post-actions">
      {/* Stats Bar - Hiển thị số like và comment */}
      <div className="post-stats-bar">
        {likeCount > 0 && (
          <div className="stat-item">
            <span className="stat-icon">👍</span>
            <span className="stat-count">{formatLikeCount(likeCount)}</span>
          </div>
        )}

        {commentCount > 0 && (
          <div className="stat-item">
            <span className="stat-icon">💬</span>
            <span className="stat-count">{formatLikeCount(commentCount)}</span>
          </div>
        )}
      </div>

      {/* Actions Container */}
      <div className="actions-container">
        {/* Like Button với Emotion Picker */}
        <div className="action-group">
          <button
            className={getLikeButtonClass()}
            onClick={handleLikeClick}
            disabled={isLiking}
            title={isLiked ? `Đã thích (${userEmotion || "like"})` : "Thích"}
          >
            <div className="like-button-content">
              <Heart size={18} className={isLiked ? "filled" : ""} />
              <span className="action-text">
                <span className="emotion-icon">{getLikeIcon()}</span>
                Thích
              </span>
            </div>

            {/* Loading indicator */}
            {isLiking && (
              <div className="like-loading">
                <div className="loading-spinner"></div>
              </div>
            )}
          </button>

          <div className="emotion-picker-container">
            <button
              className="emotion-picker-btn"
              onClick={() => setShowEmotionPicker(!showEmotionPicker)}
              title="Chọn biểu cảm"
            >
              <Smile size={16} />
            </button>

            {showEmotionPicker && (
              <div className="emotion-picker">
                <div className="emotion-grid">
                  {emotions.map((emotion) => (
                    <button
                      key={emotion.key}
                      className={`emotion-option ${
                        isLiked && userEmotion === emotion.key ? "selected" : ""
                      }`}
                      onClick={() => handleEmotionSelect(emotion.key)}
                      title={emotion.label}
                    >
                      <span className="emotion-icon">{emotion.icon}</span>
                      <span className="emotion-label">{emotion.label}</span>
                    </button>
                  ))}
                </div>
                <div className="emotion-picker-arrow"></div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Button */}
        <button
          className={`action-btn comment-btn ${showComments ? "active" : ""}`}
          onClick={onComment}
          title="Bình luận"
        >
          <MessageCircle size={18} />
          <span className="action-text">
            Bình luận
            {commentCount > 0 && (
              <span className="action-count">
                {formatLikeCount(commentCount)}
              </span>
            )}
          </span>
        </button>

        {/* Share Button */}
        <button className="action-btn share-btn" title="Chia sẻ">
          <Share size={18} />
          <span className="action-text">Chia sẻ</span>
        </button>
      </div>
    </div>
  );
};

export default PostActions;
