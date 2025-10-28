// components/Post/Post.js
import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePost } from "../../contexts/PostContext";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostStats from "./PostStats";
import PostActions from "./PostActions";
import PostComments from "./PostComments";
import { EMOTION_ICONS } from "../../constants/emotions";
import notificationService from "../../services/notificationService"; // Import service

import "./Post.css";

const Post = ({ post, onUpdate, onDelete, onEdit, onReport }) => {
  const { user } = useAuth();
  const { likePost, unlikePost, hasUserLiked, getUserEmotion } = usePost();
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = useMemo(() => {
    return user && post?.userCreateID?._id === user?.id;
  }, [post?.userCreateID?._id, user]);

  const userEmotion = useMemo(() => {
    return post ? getUserEmotion(post) : null;
  }, [getUserEmotion, post]);

  // ✅ THÊM DEBUG
  const isLiked = hasUserLiked(post);

  const handleLike = async () => {
    if (isLiking || !post) return;

    console.log("🔄 handleLike called, current state:", {
      isLiked,
      userEmotion,
    });

    setIsLiking(true);
    try {
      if (isLiked) {
        console.log("🔄 Unliking post...");
        await unlikePost(post._id);
      } else {
        console.log("🔄 Liking post...");
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

    console.log("🔄 handleEmotionSelect:", emotion);

    setIsLiking(true);
    try {
      if (isLiked) {
        // Nếu đã like thì unlike trước, rồi like lại với emotion mới
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

  // const emotionIcons = {
  //   like: "👍",
  //   love: "❤️",
  //   haha: "😂",
  //   wow: "😮",
  //   sad: "😢",
  //   angry: "😠",
  // };

  const emotionIcons = EMOTION_ICONS;

  if (!post) {
    return <div className="post-card">Bài viết không tồn tại</div>;
  }

  return (
    <div className="post-card">
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
      <div className="post-content">
        {/* Privacy Badge */}
        <div className="post-privacy">
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
        </div>

        {/* Text Content */}
        {post.content && (
          <div className="post-text">
            <p>{post.content}</p>
          </div>
        )}

        {/* Emotions & Tags */}
        {(post.emotions?.length > 0 || post.tags?.length > 0) && (
          <div className="post-meta">
            {post.emotions?.length > 0 && (
              <div className="post-emotions">
                {post.emotions.map((emotion, index) => (
                  <span key={index} className="emotion-tag">
                    {emotion}
                  </span>
                ))}
              </div>
            )}
            {post.tags?.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag, index) => (
                  <span key={index} className="hash-tag">
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
        emotionIcons={emotionIcons}
        isLiking={isLiking}
        onLike={handleLike}
        onEmotionSelect={handleEmotionSelect}
        onComment={handleCommentClick}
        showComments={showComments}
        likeCount={post.likeCount || post.likes?.length || 0}
        commentCount={post.commentCount || 0}
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
