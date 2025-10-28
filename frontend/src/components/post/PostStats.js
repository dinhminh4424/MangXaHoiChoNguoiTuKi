// // components/Post/PostStats.js
// import React from "react";
// import { Heart, MessageCircle, Eye, Users } from "lucide-react";
// import "./PostStats.css";

// import { EMOTION_ICONS } from "../../constants/emotions";

// const PostStats = ({
//   likeCount = 0,
//   commentCount = 0,
//   viewCount = 0,
//   likes = [],
// }) => {
//   // Định nghĩa emotions
//   // const emotionIcons = {
//   //   like: "👍",
//   //   love: "❤️",
//   //   haha: "😂",
//   //   wow: "😮",
//   //   sad: "😢",
//   //   angry: "😠",
//   // };

//   const emotionIcons = EMOTION_ICONS;

//   // Format số
//   const formatCount = (count) => {
//     if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
//     if (count >= 1000) return (count / 1000).toFixed(1) + "K";
//     return count.toString();
//   };

//   // Lấy danh sách emotions
//   const getUniqueEmotions = () => {
//     const emotions = likes
//       .map((like) => like.emotion)
//       .filter((emotion) => emotion && emotionIcons[emotion]);
//     return [...new Set(emotions)].slice(0, 6);
//   };

//   const uniqueEmotions = getUniqueEmotions();
//   const hasEmotions = uniqueEmotions.length > 0;
//   const hasStats = likeCount > 0 || commentCount > 0 || viewCount > 0;

//   // Hiển thị icon emotion
//   const renderEmotionIcon = (emotion) => emotionIcons[emotion] || "👍";

//   // Kiểm tra badge
//   const badges = [];
//   if (likeCount > 10) badges.push({ text: "🔥 Phổ biến", type: "popular" });
//   if (commentCount > 5) badges.push({ text: "💬 Sôi động", type: "active" });
//   if (viewCount > 50) badges.push({ text: "🚀 Viral", type: "viral" });
//   if (hasEmotions && uniqueEmotions.length >= 3) {
//     badges.push({ text: "😊 Đa cảm xúc", type: "emotional" });
//   }

//   if (!hasStats && !hasEmotions) {
//     return (
//       <div className="post-stats">
//         <div className="no-engagement">
//           <span>Hãy là người đầu tiên tương tác!</span>
//         </div>
//       </div>
//     );
//   }

//   const totalEngagement = likeCount + commentCount;

//   return (
//     <div className="post-stats">
//       {/* Emotions Section */}
//       {hasEmotions && (
//         <div className="emotions-section">
//           <div className="emotions-header">
//             <Users size={14} className="emotions-icon" />
//             <span className="emotions-title">Cảm xúc</span>
//           </div>
//           <div className="emotions-grid">
//             {uniqueEmotions.map((emotion, index) => (
//               <div key={index} className="emotion-item">
//                 <span className="emotion-icon">
//                   {renderEmotionIcon(emotion)}
//                 </span>
//                 <span className="emotion-count">
//                   {likes.filter((like) => like.emotion === emotion).length}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Stats Main */}
//       <div className="stats-main">
//         <div className="stats-numbers">
//           {/* Like Count */}
//           {likeCount > 0 && (
//             <div className="stat-item likes" title={`${likeCount} lượt thích`}>
//               <Heart size={14} className="stat-icon" />
//               <span className="stat-count">{formatCount(likeCount)}</span>
//               {hasEmotions && (
//                 <div className="emotions-preview">
//                   {uniqueEmotions.slice(0, 3).map((emotion, index) => (
//                     <span key={index} className="preview-emotion">
//                       {renderEmotionIcon(emotion)}
//                     </span>
//                   ))}
//                   {uniqueEmotions.length > 3 && (
//                     <span className="more-emotions">
//                       +{uniqueEmotions.length - 3}
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Comment Count */}
//           {commentCount > 0 && (
//             <div
//               className="stat-item comments"
//               title={`${commentCount} bình luận`}
//             >
//               <MessageCircle size={14} className="stat-icon" />
//               <span className="stat-count">{formatCount(commentCount)}</span>
//             </div>
//           )}

//           {/* View Count */}
//           {viewCount > 0 && (
//             <div className="stat-item views" title={`${viewCount} lượt xem`}>
//               <Eye size={14} className="stat-icon" />
//               <span className="stat-count">{formatCount(viewCount)}</span>
//             </div>
//           )}
//         </div>

//         {/* Badges */}
//         {badges.length > 0 && (
//           <div className="engagement-badges">
//             {badges.map((badge, index) => (
//               <span key={index} className={`badge ${badge.type}`}>
//                 {badge.text}
//               </span>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Engagement Progress */}
//       {totalEngagement > 0 && (
//         <div className="engagement-progress">
//           {likeCount > 0 && (
//             <div className="progress-item">
//               <span className="progress-label">Likes</span>
//               <div className="progress-bar">
//                 <div
//                   className="progress-fill likes"
//                   style={{
//                     width: `${(likeCount / totalEngagement) * 100}%`,
//                   }}
//                 ></div>
//               </div>
//               <span className="progress-percent">
//                 {Math.round((likeCount / totalEngagement) * 100)}%
//               </span>
//             </div>
//           )}

//           {commentCount > 0 && (
//             <div className="progress-item">
//               <span className="progress-label">Comments</span>
//               <div className="progress-bar">
//                 <div
//                   className="progress-fill comments"
//                   style={{
//                     width: `${(commentCount / totalEngagement) * 100}%`,
//                   }}
//                 ></div>
//               </div>
//               <span className="progress-percent">
//                 {Math.round((commentCount / totalEngagement) * 100)}%
//               </span>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PostStats;


// components/Post/PostStats.js
import React, { useState } from "react";
import { Heart, MessageCircle, Eye, Share, Users, Sparkles } from "lucide-react";
import "./PostStats.css";

import { EMOTION_ICONS } from "../../constants/emotions";

const PostStats = ({
  likeCount = 0,
  commentCount = 0,
  viewCount = 0,
  shareCount = 0,
  likes = [],
  currentUserReaction = null,
  onReactionClick,
  onCommentClick,
  onShareClick,
  showDetailedStats = false
}) => {
  const [showReactionsDetail, setShowReactionsDetail] = useState(false);

  const emotionIcons = EMOTION_ICONS;

  // Format số
  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  // Lấy danh sách emotions với số lượng
  const getEmotionStats = () => {
    const emotionCounts = {};
    likes.forEach(like => {
      const emotion = like.emotion || 'like';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([emotion, count]) => ({
        emotion,
        count,
        icon: emotionIcons[emotion] || "👍"
      }));
  };

  const emotionStats = getEmotionStats();
  const totalReactions = likes.length;
  const hasReactions = totalReactions > 0;
  const hasComments = commentCount > 0;
  const hasShares = shareCount > 0;
  const hasViews = viewCount > 0;

  // Tính tổng engagement
  const totalEngagement = likeCount + commentCount + shareCount;

  // Hiển thị summary reactions (giống Facebook)
  const renderReactionsSummary = () => {
    if (!hasReactions) return null;

    const topEmotions = emotionStats.slice(0, 3);
    
    return (
      <div 
        className="reactions-summary"
        onClick={() => setShowReactionsDetail(!showReactionsDetail)}
        title="Xem chi tiết cảm xúc"
      >
        <div className="reaction-icons">
          {topEmotions.map((emotion, index) => (
            <div 
              key={emotion.emotion} 
              className="reaction-icon-wrapper"
              style={{ zIndex: topEmotions.length - index }}
            >
              <span className="reaction-icon">{emotion.icon}</span>
            </div>
          ))}
        </div>
        <span className="reaction-count">{formatCount(totalReactions)}</span>
      </div>
    );
  };

  // Hiển thị detailed reactions popover
  const renderReactionsDetail = () => {
    if (!showReactionsDetail || !hasReactions) return null;

    return (
      <div className="reactions-detail-popover">
        <div className="reactions-detail-header">
          <h4>Tất cả cảm xúc ({totalReactions})</h4>
          <button 
            className="close-detail"
            onClick={() => setShowReactionsDetail(false)}
          >
            ×
          </button>
        </div>
        <div className="reactions-detail-list">
          {emotionStats.map((emotion) => (
            <div key={emotion.emotion} className="reaction-detail-item">
              <span className="reaction-detail-icon">{emotion.icon}</span>
              <span className="reaction-detail-name">
                {getEmotionLabel(emotion.emotion)}
              </span>
              <span className="reaction-detail-count">{emotion.count}</span>
              <div className="reaction-detail-bar">
                <div 
                  className="reaction-detail-fill"
                  style={{ 
                    width: `${(emotion.count / totalReactions) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Chuyển đổi emotion key thành label
  const getEmotionLabel = (emotion) => {
    const labels = {
      like: "Thích",
      love: "Yêu thích",
      haha: "Haha",
      wow: "Wow",
      sad: "Buồn",
      angry: "Phẫn nộ",
      care: "Quan tâm"
    };
    return labels[emotion] || emotion;
  };

  // Hiển thị engagement bar (giống Facebook)
  const renderEngagementBar = () => {
    if (totalEngagement === 0) return null;

    return (
      <div className="engagement-bar">
        <div className="engagement-bar-content">
          {hasReactions && (
            <div className="engagement-item">
              {renderReactionsSummary()}
            </div>
          )}
          
          {hasComments && (
            <div className="engagement-item comments">
              <span className="engagement-count">
                {formatCount(commentCount)} bình luận
              </span>
            </div>
          )}

          {hasShares && (
            <div className="engagement-item shares">
              <span className="engagement-count">
                {formatCount(shareCount)} chia sẻ
              </span>
            </div>
          )}
        </div>

        {hasViews && (
          <div className="view-count">
            <Eye size={12} />
            <span>{formatCount(viewCount)}</span>
          </div>
        )}
      </div>
    );
  };

  // Hiển thị interactive stats
  const renderInteractiveStats = () => {
    if (!showDetailedStats) return null;

    return (
      <div className="interactive-stats">
        <div className="stats-grid">
          {/* Reach Stats */}
          <div className="stat-card">
            <div className="stat-icon">
              <Eye size={16} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{formatCount(viewCount)}</span>
              <span className="stat-label">Lượt tiếp cận</span>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={16} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{formatCount(totalEngagement)}</span>
              <span className="stat-label">Tương tác</span>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="stat-card">
            <div className="stat-icon">
              <Sparkles size={16} />
            </div>
            <div className="stat-content">
              <span className="stat-number">
                {viewCount > 0 ? ((totalEngagement / viewCount) * 100).toFixed(1) : 0}%
              </span>
              <span className="stat-label">Tỷ lệ tương tác</span>
            </div>
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div className="engagement-breakdown">
          <h5>Phân tích tương tác</h5>
          <div className="breakdown-bars">
            {hasReactions && (
              <div className="breakdown-item">
                <span className="breakdown-label">Cảm xúc</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill reactions"
                    style={{ width: `${(likeCount / totalEngagement) * 100}%` }}
                  ></div>
                </div>
                <span className="breakdown-percent">
                  {Math.round((likeCount / totalEngagement) * 100)}%
                </span>
              </div>
            )}

            {hasComments && (
              <div className="breakdown-item">
                <span className="breakdown-label">Bình luận</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill comments"
                    style={{ width: `${(commentCount / totalEngagement) * 100}%` }}
                  ></div>
                </div>
                <span className="breakdown-percent">
                  {Math.round((commentCount / totalEngagement) * 100)}%
                </span>
              </div>
            )}

            {hasShares && (
              <div className="breakdown-item">
                <span className="breakdown-label">Chia sẻ</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill shares"
                    style={{ width: `${(shareCount / totalEngagement) * 100}%` }}
                  ></div>
                </div>
                <span className="breakdown-percent">
                  {Math.round((shareCount / totalEngagement) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị khi không có engagement
  if (!hasReactions && !hasComments && !hasShares && !hasViews) {
    return (
      <div className="post-stats">
        <div className="no-engagement">
          <div className="no-engagement-content">
            <Sparkles size={20} className="sparkle-icon" />
            <span>Hãy là người đầu tiên tương tác!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-stats">
      {/* Main Engagement Bar */}
      {renderEngagementBar()}

      {/* Reactions Detail Popover */}
      {renderReactionsDetail()}

      {/* Interactive Detailed Stats */}
      {renderInteractiveStats()}

      {/* Engagement Highlights */}
      {totalEngagement > 10 && (
        <div className="engagement-highlights">
          <div className="highlight-badges">
            {likeCount > 20 && (
              <span className="highlight-badge popular">
                <Sparkles size={12} />
                Phổ biến
              </span>
            )}
            {commentCount > 10 && (
              <span className="highlight-badge active">
                <MessageCircle size={12} />
                Sôi động
              </span>
            )}
            {shareCount > 5 && (
              <span className="highlight-badge viral">
                <Share size={12} />
                Đang lan tỏa
              </span>
            )}
            {emotionStats.length >= 4 && (
              <span className="highlight-badge emotional">
                <Heart size={12} />
                Đa cảm xúc
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostStats;