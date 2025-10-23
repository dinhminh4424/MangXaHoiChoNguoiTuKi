// components/Post/PostActions.js
import React from "react";
import { MessageCircle, Share } from "lucide-react";
import { useEmotionPicker } from "../../hooks/useEmotionPicker";
import {
  EMOTIONS,
  EMOTION_ICONS,
  EMOTION_COLORS,
} from "../../constants/emotions";
import EmotionPicker from "./EmojiPicker";
import "./PostActions.css";

const PostActions = ({
  isLiked,
  userEmotion,
  emotionIcons = EMOTION_ICONS,
  isLiking,
  onLike,
  onComment,
  showComments,
  onEmotionSelect,
  likeCount = 0,
  commentCount = 0,
}) => {
  const {
    showEmotionPicker,
    hoverEmotion,
    likeButtonRef,
    pickerRef,
    setHoverEmotion,
    handleEmotionSelect,
    handleLikeMouseEnter,
    handleLikeMouseLeave,
    handlePickerMouseEnter,
    handlePickerMouseLeave,
  } = useEmotionPicker(onEmotionSelect);

  const handleLikeClick = () => {
    onLike?.();
  };

  const formatLikeCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const getLikeIcon = () => {
    if (isLiked && userEmotion) return emotionIcons[userEmotion];
    if (hoverEmotion)
      return EMOTION_ICONS[hoverEmotion] || getDefaultLikeIcon();
    return getDefaultLikeIcon();
  };

  const getDefaultLikeIcon = () => (
    <svg
      width="20"
      height="20"
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

  const getLikeButtonClass = () => {
    return `action-btn like-btn ${isLiked ? "liked" : ""} ${
      isLiked && userEmotion ? `emotion-${userEmotion}` : ""
    }`;
  };

  const getLikeButtonStyle = () => {
    if (hoverEmotion) {
      return { color: EMOTION_COLORS[hoverEmotion] };
    }
    if (isLiked && userEmotion) {
      return { color: EMOTION_COLORS[userEmotion] };
    }
    return {};
  };

  const getSelectedEmotion = () => (isLiked ? userEmotion : null);

  const getLikeButtonText = () => {
    if (isLiked && userEmotion) {
      const emotion = EMOTIONS.find((e) => e.key === userEmotion);
      return emotion?.label || "Thích";
    }
    return "Thích";
  };

  return (
    <div className="post-actions">
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

      <div className="actions-container">
        <div className="action-group">
          <button
            ref={likeButtonRef}
            className={getLikeButtonClass()}
            onClick={handleLikeClick}
            onMouseEnter={handleLikeMouseEnter}
            onMouseLeave={handleLikeMouseLeave}
            onMouseDown={handleLikeMouseLeave}
            disabled={isLiking}
            style={getLikeButtonStyle()}
            title={
              isLiked
                ? `Đã thích (${
                    EMOTIONS.find((e) => e.key === userEmotion)?.label || "like"
                  })`
                : "Thích"
            }
          >
            <div className="like-button-content">
              <span className="action-text">
                <span className="emotion-icon">{getLikeIcon()}</span>
                {getLikeButtonText()}
              </span>
            </div>
            {isLiking && (
              <div className="like-loading">
                <div className="loading-spinner"></div>
              </div>
            )}
          </button>

          <EmotionPicker
            isOpen={showEmotionPicker}
            selectedEmotion={getSelectedEmotion()}
            hoverEmotion={hoverEmotion}
            onEmotionSelect={handleEmotionSelect}
            onHoverEmotion={setHoverEmotion}
            pickerRef={pickerRef}
            onMouseEnter={handlePickerMouseEnter}
            onMouseLeave={handlePickerMouseLeave}
            position="top-right"
          />
        </div>

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

        <button className="action-btn share-btn" title="Chia sẻ">
          <Share size={18} />
          <span className="action-text">Chia sẻ</span>
        </button>
      </div>
    </div>
  );
};

export default PostActions;
