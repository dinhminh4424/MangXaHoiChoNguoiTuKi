// components/Post/Post.js
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePost } from "../../contexts/PostContext";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostStats from "./PostStats";
import PostActions from "./PostActions";
import PostComments from "./PostComments";
import { EMOTION_ICONS } from "../../constants/emotions";
import notificationService from "../../services/notificationService";

import "./Post.css";

const Post = ({ post, onUpdate, onDelete, onEdit, onReport }) => {
  const { user } = useAuth();
  const { likePost, unlikePost, hasUserLiked, getUserEmotion } = usePost();
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const contentRef = useRef(null);

  const isOwner = useMemo(() => {
    return user && post?.userCreateID?._id === user?.id;
  }, [post?.userCreateID?._id, user]);

  const userEmotion = useMemo(() => {
    return post ? getUserEmotion(post) : null;
  }, [getUserEmotion, post]);

  // Kiểm tra chiều cao nội dung để hiển thị "Xem thêm"
  useEffect(() => {
    const checkContentHeight = () => {
      if (contentRef.current) {
        const lineHeight = 24; // Giả sử line-height là 24px
        const maxLines = 8; // Số dòng tối đa trước khi hiển thị "Xem thêm"
        const maxHeight = lineHeight * maxLines;

        const contentHeight = contentRef.current.scrollHeight;
        const shouldShow = contentHeight > maxHeight;

        setShouldShowReadMore(shouldShow);
        setShowFullContent(!shouldShow); // Nếu nội dung ngắn thì luôn hiển thị đầy đủ
      }
    };

    checkContentHeight();

    // Kiểm tra lại khi nội dung thay đổi
    const observer = new MutationObserver(checkContentHeight);
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => observer.disconnect();
  }, [post?.content]);

  const isLiked = hasUserLiked(post);

  const handleLike = async () => {
    if (isLiking || !post) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await unlikePost(post._id);
      } else {
        await likePost(post._id, "like");
      }
    } catch (error) {
      console.error("❌ Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEmotionSelect = async (emotion) => {
    if (!post) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await unlikePost(post._id);
      }
      await likePost(post._id, emotion);
    } catch (error) {
      console.error("❌ Error selecting emotion:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleDelete = async () => {
    let check = await notificationService.confirm({
      title: "Bạn có chắc muốn xoá bài viết này?",
      confirmText: "Chắc chắn xoá",
      cancelText: "Huỷ xoá",
    });
    if (check.isConfirmed) {
      try {
        await onDelete(post._id);
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  const renderContent = () => {
    if (!post.content) return null;

    const content = post.content;

    return (
      <div className="post-text bg-white">
        <div
          ref={contentRef}
          className={`post-content-text ${
            showFullContent ? "expanded" : "collapsed"
          }`}
        >
          <p>{content}</p>
        </div>

        {shouldShowReadMore && (
          <button className="read-more-btn" onClick={toggleContent}>
            {showFullContent ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div>
    );
  };

  if (!post) {
    return <div className="post-card">Bài viết không tồn tại</div>;
  }

  return (
    <div
      className="post-card"
      style={{
        opacity: post.isBlocked ? 0.5 : 1, // Mờ đi nếu bị block
        // pointerEvents: post.isBlocked ? "none" : "auto", // Không cho click khi bị block
      }}
    >
      {/* Header */}
      <PostHeader
        post={post}
        isOwner={isOwner}
        onUpdate={onUpdate}
        onDelete={handleDelete}
        onEdit={onEdit}
        onReport={onReport}
      />

      {/* Content */}
      <div className="post-content mt-3">
        {/* Privacy Badge */}
        {/* <div className="post-privacy">
          <span className={`privacy-badge ${post.privacy}`}>
            {post.privacy === "public"
              ? "🌍 Công khai"
              : post.privacy === "friends"
              ? "👥 Bạn bè"
              : "🔒 Riêng tư"}
          </span>
          {post.isAnonymous && (
            <span className="anonymous-badge">🕶️ Ẩn danh</span>
          )}
        </div> */}

        {/* Text Content với tính năng Xem thêm */}
        {renderContent()}

        {/* Emotions & Tags */}
        {(post.emotions?.length > 0 || post.tags?.length > 0) && (
          <div className="post-meta">
            {post.emotions?.length > 0 && (
              <div className="post-emotions">
                {post.emotions.map((emotion, index) => (
                  <span
                    key={index}
                    className="emotion-tag"
                    style={{
                      backgroundColor: "#fff3e0",
                      color: "#f57c00",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                      borderColor: "#f57c00",
                    }}
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            )}
            {post.tags?.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="hash-tag"
                    style={{
                      backgroundColor: "#e3f2fd",
                      color: "#1976d2",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                      borderColor: "#1976d2",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Files */}
        {post.files && post.files.length > 0 && (
          <PostMedia files={post.files} />
        )}
      </div>

      {/* Stats */}
      <PostStats
        likeCount={post.likeCount || 0}
        commentCount={post.commentCount || 0}
        likes={post.likes || []}
      />

      {/* Actions */}
      <PostActions
        isLiked={isLiked}
        userEmotion={userEmotion}
        emotionIcons={EMOTION_ICONS}
        isLiking={isLiking}
        onLike={handleLike}
        onEmotionSelect={handleEmotionSelect}
        onComment={handleCommentClick}
        showComments={showComments}
        likeCount={post.likeCount || post.likes?.length || 0}
        commentCount={post.commentCount || 0}
        blockComment={post.isBlockedComment || false}
      />

      {/* Comments Section */}
      {showComments && (
        <PostComments
          postId={post._id}
          onCommentAdded={() => {
            // Có thể thêm logic để cập nhật comment count
          }}
        />
      )}
    </div>
  );
};

export default Post;
