import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

import { postService } from "../services/postService";
import { useAuth } from "./AuthContext";

const PostContext = createContext(null);

export const usePost = () => {
  const context = useContext(PostContext);

  if (!context) {
    throw new Error("usePost must be used within a PostProvider");
  }

  return context;
};

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const isSameUser = useCallback((likeUser, currentUser) => {
    if (!currentUser) return false;

    const likeUserId = likeUser?.toString();
    const currentUserId =
      currentUser.id?.toString() || currentUser.userId?.toString();

    return likeUserId === currentUserId;
  }, []);

  // Tạo bài viết mới
  const createPost = useCallback(async (postData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postService.createPost(postData);
      if (response?.success && response?.post) {
        setPosts((prev) => [response.post, ...prev]);
      }
      return response;
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tạo bài viết");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy Danh Sách Bài Viết
  // contexts/PostContext.js
  const fetchPosts = useCallback(async (params = {}, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await postService.getPosts(params);

      if (append) {
        // Nối thêm bài viết mới vào danh sách hiện tại
        setPosts((prevPosts) => [...prevPosts, ...(response.posts || [])]);
      } else {
        // Thay thế hoàn toàn danh sách bài viết
        setPosts(response.posts || []);
      }

      return response;
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi lấy danh sách bài viết");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy chi tiết bài viết theo ID
  const fetchPostById = useCallback(async (idPost) => {
    try {
      setLoading(true);
      setError(null);
      const res = await postService.getDetail(idPost);
      setCurrentPost(res?.post || null);
      return res;
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi lấy chi tiết bài viết");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật bài viết
  const updatePost = useCallback(
    async (id, postData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await postService.updatePost(id, postData);
        if (response?.post) {
          setPosts((prev) =>
            prev.map((post) => (post._id === id ? response.post : post))
          );
          if (currentPost && currentPost._id === id) {
            setCurrentPost(response.post);
          }
        }
        return response;
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi cập nhật bài viết");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentPost]
  );

  // Xóa bài viết
  const deletePost = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await postService.deletePost(id);
        // nếu API trả thành công thì xoá local
        setPosts((prev) => prev.filter((post) => post._id !== id));
        if (currentPost && currentPost._id === id) {
          setCurrentPost(null);
        }
        return response;
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi xóa bài viết");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentPost]
  );

  // Like bài viết
  const likePost = useCallback(
    async (id, emotion = "like") => {
      try {
        const response = await postService.likePost(id, emotion);
        if (response) {
          setPosts((prev) =>
            prev.map((post) =>
              post._id === id
                ? {
                    ...post,
                    likes: response.likes || [],
                    likeCount: response.likeCount || 0,
                  }
                : post
            )
          );
          if (currentPost && currentPost._id === id) {
            setCurrentPost((prev) => ({
              ...prev,
              likes: response.likes || [],
              likeCount: response.likeCount || 0,
            }));
          }
        }
        return response;
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi thích bài viết");
        throw err;
      }
    },
    [currentPost]
  );

  // Unlike bài viết
  const unlikePost = useCallback(
    async (id) => {
      try {
        const response = await postService.unlikePost(id);
        if (response) {
          setPosts((prev) =>
            prev.map((post) =>
              post._id === id
                ? {
                    ...post,
                    likes: response.likes || [],
                    likeCount: response.likeCount || 0,
                  }
                : post
            )
          );
          if (currentPost && currentPost._id === id) {
            setCurrentPost((prev) => ({
              ...prev,
              likes: response.likes || [],
              likeCount: response.likeCount || 0,
            }));
          }
        }
        return response;
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi bỏ thích bài viết");
        throw err;
      }
    },
    [currentPost]
  );

  // Kiểm tra user đã like bài viết chưa - ✅ ĐÃ SỬA
  const hasUserLiked = useCallback(
    (post) => {
      if (!user || !post?.likes) return false;
      return post.likes.some((like) => isSameUser(like.user, user));
    },
    [user, isSameUser]
  );

  // Lấy emotion của user cho bài viết - ✅ ĐÃ SỬA
  const getUserEmotion = useCallback(
    (post) => {
      if (!user || !post?.likes) return null;
      const userLike = post.likes.find((like) => isSameUser(like.user, user));
      return userLike ? userLike.emotion : null;
    },
    [user, isSameUser]
  );

  // báo cáo bài viết
  const reportPost = useCallback(
    async (reportData) => {
      try {
        const res = await postService.reportPost(reportData);
        return res;
      } catch (error) {
        setError(error.message || "Có lỗi xảy ra khi báo cáo bài viết");
        throw error;
      }
    },
    [currentPost]
  );

  const value = {
    posts,
    currentPost,
    loading,
    error,
    createPost,
    fetchPosts,
    fetchPostById,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    hasUserLiked,
    getUserEmotion,
    setPosts,
    setCurrentPost,
    setError,
    reportPost,
  };

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};
