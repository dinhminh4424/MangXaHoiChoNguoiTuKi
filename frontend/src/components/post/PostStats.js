// components/Post/PostStats.js
import React from "react";
import { Heart, MessageCircle, Eye, Users } from "lucide-react";
import "./PostStats.css";

const PostStats = ({
  likeCount = 0,
  commentCount = 0,
  viewCount = 0,
  likes = [],
}) => {
  // Định nghĩa emotions
  const emotionIcons = {
    like: "👍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😠",
  };

  // Format số
  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  // Lấy danh sách emotions
  const getUniqueEmotions = () => {
    const emotions = likes
      .map((like) => like.emotion)
      .filter((emotion) => emotion && emotionIcons[emotion]);
    return [...new Set(emotions)].slice(0, 6);
  };

  const uniqueEmotions = getUniqueEmotions();
  const hasEmotions = uniqueEmotions.length > 0;
  const hasStats = likeCount > 0 || commentCount > 0 || viewCount > 0;

  // Hiển thị icon emotion
  const renderEmotionIcon = (emotion) => emotionIcons[emotion] || "👍";

  // Kiểm tra badge
  const badges = [];
  if (likeCount > 10) badges.push({ text: "🔥 Phổ biến", type: "popular" });
  if (commentCount > 5) badges.push({ text: "💬 Sôi động", type: "active" });
  if (viewCount > 50) badges.push({ text: "🚀 Viral", type: "viral" });
  if (hasEmotions && uniqueEmotions.length >= 3) {
    badges.push({ text: "😊 Đa cảm xúc", type: "emotional" });
  }

  if (!hasStats && !hasEmotions) {
    return (
      <div className="post-stats">
        <div className="no-engagement">
          <span>Hãy là người đầu tiên tương tác!</span>
        </div>
      </div>
    );
  }

  const totalEngagement = likeCount + commentCount;

  return (
    <div className="post-stats">
      {/* Emotions Section */}
      {hasEmotions && (
        <div className="emotions-section">
          <div className="emotions-header">
            <Users size={14} className="emotions-icon" />
            <span className="emotions-title">Cảm xúc</span>
          </div>
          <div className="emotions-grid">
            {uniqueEmotions.map((emotion, index) => (
              <div key={index} className="emotion-item">
                <span className="emotion-icon">
                  {renderEmotionIcon(emotion)}
                </span>
                <span className="emotion-count">
                  {likes.filter((like) => like.emotion === emotion).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Main */}
      <div className="stats-main">
        <div className="stats-numbers">
          {/* Like Count */}
          {likeCount > 0 && (
            <div className="stat-item likes" title={`${likeCount} lượt thích`}>
              <Heart size={14} className="stat-icon" />
              <span className="stat-count">{formatCount(likeCount)}</span>
              {hasEmotions && (
                <div className="emotions-preview">
                  {uniqueEmotions.slice(0, 3).map((emotion, index) => (
                    <span key={index} className="preview-emotion">
                      {renderEmotionIcon(emotion)}
                    </span>
                  ))}
                  {uniqueEmotions.length > 3 && (
                    <span className="more-emotions">
                      +{uniqueEmotions.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comment Count */}
          {commentCount > 0 && (
            <div
              className="stat-item comments"
              title={`${commentCount} bình luận`}
            >
              <MessageCircle size={14} className="stat-icon" />
              <span className="stat-count">{formatCount(commentCount)}</span>
            </div>
          )}

          {/* View Count */}
          {viewCount > 0 && (
            <div className="stat-item views" title={`${viewCount} lượt xem`}>
              <Eye size={14} className="stat-icon" />
              <span className="stat-count">{formatCount(viewCount)}</span>
            </div>
          )}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="engagement-badges">
            {badges.map((badge, index) => (
              <span key={index} className={`badge ${badge.type}`}>
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Progress */}
      {totalEngagement > 0 && (
        <div className="engagement-progress">
          {likeCount > 0 && (
            <div className="progress-item">
              <span className="progress-label">Likes</span>
              <div className="progress-bar">
                <div
                  className="progress-fill likes"
                  style={{
                    width: `${(likeCount / totalEngagement) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="progress-percent">
                {Math.round((likeCount / totalEngagement) * 100)}%
              </span>
            </div>
          )}

          {commentCount > 0 && (
            <div className="progress-item">
              <span className="progress-label">Comments</span>
              <div className="progress-bar">
                <div
                  className="progress-fill comments"
                  style={{
                    width: `${(commentCount / totalEngagement) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="progress-percent">
                {Math.round((commentCount / totalEngagement) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostStats;
