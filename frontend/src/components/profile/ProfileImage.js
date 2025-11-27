import { useCallback, useEffect, useRef, useState } from "react";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";
import "./ProfileImage.css";

const ImageProfile = ({ userId }) => {
  const [myImages, setMyImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const limit = 12;

  const { fetchImagesPost } = usePost();
  const { user: currentUser } = useAuth();

  const isOwnProfile = !userId || userId === currentUser?.id;

  // Load images
  const loadingImagePost = useCallback(
    async (pageToFetch = 1, forUserId) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (pageToFetch === 1) {
          setLoading(true);
          setMyImages([]);
        } else {
          setLoadingMore(true);
        }
        setError("");

        const id = forUserId || userId || currentUser?.id;

        const params = {
          userCreateID: id,
          page: pageToFetch,
          limit,
        };

        const res = await fetchImagesPost(params);
        const newImages = Array.isArray(res?.images) ? res.images : [];

        if (res && res.success) {
          if (pageToFetch === 1) {
            setMyImages(newImages);
            setTotalImages(res.totalImages || 0);
          } else {
            setMyImages((prev) => [...prev, ...newImages]);
          }

          const totalImagesCount = res.totalImages || res.total || 0;
          const loadedCount = (pageToFetch - 1) * limit + newImages.length;
          setHasMore(loadedCount < totalImagesCount && newImages.length > 0);
        } else {
          const msg = res?.message || "Lỗi khi tải ảnh";
          setError(msg);
        }
      } catch (err) {
        console.error("Error loading profile images:", err);
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [fetchImagesPost, userId, currentUser?.id, limit]
  );

  // Reset khi userId thay đổi
  useEffect(() => {
    setCurrentPage(1);
    setMyImages([]);
    setHasMore(true);
    setError("");
    loadingImagePost(1, userId);
  }, [userId, loadingImagePost]);

  // Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore || loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          loadingImagePost(nextPage, userId);
        }
      },
      { root: null, rootMargin: "100px", threshold: 0.1 }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadingImagePost, hasMore, loadingMore, loading, userId, currentPage]);

  // Format số lượng
  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count;
  };

  return (
    <div className="image-profile-container">
      {/* Profile Header */}
      {!loading && myImages.length > 0 && (
        <div className="image-profile-header p-5">
          <div className="header-content">
            <h3>Bộ sưu tập hình ảnh</h3>
            <p>Tất cả hình ảnh và video đã đăng</p>
            <span className="image-count-badge">{totalImages} hình ảnh</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="image-profile-loading">
          <div className="image-profile-spinner"></div>
          <h3>Đang tải hình ảnh...</h3>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="image-profile-error">
          <div className="image-profile-error-icon">
            <i className="ri-error-warning-line"></i>
          </div>
          <h3>Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <button
            className="image-profile-retry-btn"
            onClick={() => loadingImagePost(1, userId)}
          >
            <i className="ri-refresh-line"></i>
            Thử lại
          </button>
        </div>
      )}

      {/* Images Grid */}
      <div className="image-profile-grid">
        {myImages.length > 0
          ? myImages.map((myImage, index) => {
              const key = `${myImage.post?._id || "post"}-${index}`;
              const isVideo = myImage.type === "video";

              return (
                <div className="image-profile-card" key={key}>
                  <div className="image-profile-media-container">
                    <a
                      href={"/posts/" + (myImage.post?._id || "")}
                      className="image-profile-media-link"
                    >
                      {myImage.type === "image" && (
                        <img
                          src={myImage.imageUrl}
                          className="image-profile-img"
                          alt={myImage.post?.content || "Hình ảnh cá nhân"}
                          loading="lazy"
                        />
                      )}
                      {myImage.type === "video" && (
                        <>
                          <video
                            src={myImage.imageUrl}
                            className="image-profile-video"
                            alt="Video cá nhân"
                            loading="lazy"
                          />
                          <div className="image-profile-video-indicator">
                            <i className="ri-play-mini-fill"></i>
                            VIDEO
                          </div>
                          <div className="image-profile-video-overlay">
                            <i className="ri-play-circle-fill image-profile-play-icon"></i>
                          </div>
                        </>
                      )}
                    </a>

                    {/* Hover Stats */}
                    <div className="image-profile-hover-stats">
                      <div className="image-profile-stats-grid">
                        <a href="#" className="image-profile-stat-item">
                          <i className="ri-heart-3-fill image-profile-stat-icon"></i>
                          <span className="image-profile-stat-count">
                            {formatCount(myImage.post?.likeCount || 0)}
                          </span>
                        </a>
                        <a href="#" className="image-profile-stat-item">
                          <i className="ri-chat-3-fill image-profile-stat-icon"></i>
                          <span className="image-profile-stat-count">
                            {formatCount(myImage.post?.commentCount || 0)}
                          </span>
                        </a>
                        <a href="#" className="image-profile-stat-item">
                          <i className="ri-share-forward-fill image-profile-stat-icon"></i>
                          <span className="image-profile-stat-count">
                            {formatCount(myImage.post?.shareCount || 10)}
                          </span>
                        </a>
                      </div>
                    </div>

                    {/* Edit Button (chỉ hiện với chủ profile) */}
                    {isOwnProfile && (
                      <a
                        href="#"
                        className="image-profile-edit-btn"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Chỉnh sửa hoặc xóa"
                      >
                        <i className="ri-more-2-fill"></i>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          : !loading && (
              <div className="image-profile-empty">
                <div className="image-profile-empty-icon">
                  <i className="ri-image-2-line"></i>
                </div>
                <h3>Chưa có hình ảnh</h3>
                <p>
                  {isOwnProfile
                    ? "Hãy bắt đầu chia sẻ những khoảnh khắc đầu tiên của bạn!"
                    : "Người dùng này chưa chia sẻ hình ảnh nào"}
                </p>
                {isOwnProfile && (
                  <button className="image-profile-upload-btn">
                    <i className="ri-upload-cloud-line"></i>
                    Đăng ảnh đầu tiên
                  </button>
                )}
              </div>
            )}
      </div>

      {/* Loading More */}
      {loadingMore && (
        <div className="image-profile-loading-more">
          <div className="image-profile-loading-dots">
            <div className="image-profile-loading-dot"></div>
            <div className="image-profile-loading-dot"></div>
            <div className="image-profile-loading-dot"></div>
          </div>
          <span>Đang tải thêm hình ảnh...</span>
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} style={{ height: "1px", marginTop: "20px" }} />
    </div>
  );
};

export default ImageProfile;
