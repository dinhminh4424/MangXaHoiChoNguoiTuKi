// import { useCallback, useEffect, useRef, useState } from "react";
// import { usePost } from "../../contexts/PostContext";
// import { useAuth } from "../../contexts/AuthContext";

// const ImageProfile = ({ userId }) => {
//   const [myImages, setMyImages] = useState([]);
//   const [loading, setLoading] = useState(false); // lần load đầu
//   const [error, setError] = useState("");
//   const [pages, setPages] = useState(1);
//   const [countImage, setCountImage] = useState(0);
//   const { user: currentUser } = useAuth();

//   const [loadingMore, setLoadingMore] = useState(false); // load tiếp
//   const [hasMore, setHasMore] = useState(true);

//   const isFetchingRef = useRef(false);
//   const observerRef = useRef(null);
//   const sentinelRef = useRef(null);
//   const pageSize = 2;
//   const limit = 2;

//   const { fetchImagesPost } = usePost();

//   const isOwnProfile = !userId || userId === currentUser?.id;

//   // load một trang ảnh
//   const loadingImagePost = useCallback(
//     async (pageToFetch = 1, forUserId) => {
//       if (isFetchingRef.current) return;
//       isFetchingRef.current = true;

//       try {
//         if (pageToFetch === 1) {
//           setLoading(true);
//         } else {
//           setLoadingMore(true);
//         }
//         setError("");

//         const id = forUserId || userId || currentUser?.id;

//         const params = {
//           userCreateID: id,
//           page: pageToFetch,
//           limit,
//         };

//         const res = await fetchImagesPost(params);

//         // đảm bảo lấy mảng ảnh an toàn
//         const newImages = Array.isArray(res?.images) ? res.images : [];

//         if (res && res.success) {
//           if (pageToFetch === 1) {
//             setMyImages(newImages);
//             setCountImage(res.imagesCount);
//           } else {
//             setMyImages((prev) => [...prev, ...newImages]);

//             setCountImage(countImage + res.imagesCount);
//           }

//           // backend có thể trả totalImages hoặc total
//           const totalImages =
//             typeof res.totalImages === "number"
//               ? res.totalImages
//               : typeof res.total === "number"
//               ? res.total
//               : undefined;

//           if (typeof totalImages === "number") {
//             const loadedSoFar = (pageToFetch - 1) * pageSize + newImages.length;
//             setHasMore(loadedSoFar < totalImages);
//           } else {
//             // nếu backend không trả total, dùng heuristic
//             setHasMore(newImages.length >= pageSize);
//           }
//         } else {
//           // nếu res.success false, show message (nếu có)
//           const msg = res?.message || "Lỗi khi tải ảnh";
//           setError(msg);
//         }
//       } catch (err) {
//         console.error("Error loading profile posts:", err);
//         setError(err?.message || String(err));
//       } finally {
//         setLoading(false);
//         setLoadingMore(false);
//         isFetchingRef.current = false;
//       }
//     },
//     [fetchImagesPost, userId, currentUser?.id]
//   );

//   // Khi userId thay đổi -> reset và load trang 1
//   useEffect(() => {
//     setPages(1);
//     setMyImages([]);
//     setHasMore(true);
//     setError("");
//     loadingImagePost(1, userId);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId]); // intentionally only on userId change

//   // Intersection Observer để load thêm
//   useEffect(() => {
//     const sentinel = sentinelRef.current;
//     if (!sentinel) return;

//     if (observerRef.current) observerRef.current.disconnect();

//     observerRef.current = new IntersectionObserver(
//       (entries) => {
//         const entry = entries[0];
//         if (
//           entry.isIntersecting &&
//           hasMore &&
//           !loadingMore &&
//           !loading &&
//           !isFetchingRef.current
//         ) {
//           // tăng page và gọi load trang tiếp theo
//           setPages((prev) => {
//             const next = prev + 1;
//             loadingImagePost(next, userId);
//             return next;
//           });
//         }
//       },
//       { root: null, rootMargin: "200px", threshold: 0.1 }
//     );

//     observerRef.current.observe(sentinel);

//     return () => {
//       if (observerRef.current) observerRef.current.disconnect();
//     };
//   }, [loadingImagePost, hasMore, loadingMore, loading, userId]);

//   return (
//     <div className="container">
//       {loading && (
//         <div className="card border-0 shadow-sm">
//           <div className="card-body text-center py-5">
//             <div className="spinner-border text-primary" role="status">
//               <span className="visually-hidden">Đang tải...</span>
//             </div>
//             <p className="mt-2 text-muted">Đang tải danh sách ảnh...</p>
//           </div>
//         </div>
//       )}

//       {error && (
//         <div className="card border-0 shadow-sm">
//           <div className="card-body text-center py-5 text-danger">
//             <i className="fas fa-exclamation-circle fa-2x mb-3"></i>
//             <p>{error}</p>
//           </div>
//         </div>
//       )}

//       {/* <span className="badge text-bg-info container">{countImage}</span> */}

//       <div className="row">
//         {myImages.length > 0
//           ? myImages.map((myImage, index) => {
//               // tạo key tốt hơn (nên thay bằng id file nếu có)
//               const key = `${myImage.post?._id || "post"}-${index}`;
//               return (
//                 <div className="col-lg-3 col-md-6" key={key}>
//                   <div className="user-images position-relative overflow-hidden mb-3">
//                     <a href={"/posts/" + (myImage.post?._id || "")}>
//                       {myImage.type === "image" && (
//                         <img
//                           src={myImage.imageUrl}
//                           className="img-fluid rounded"
//                           alt={myImage.post?.content || "image"}
//                           style={{ height: "200px", objectFit: "cover" }}
//                         />
//                       )}
//                       {myImage.type === "video" && (
//                         <div className="user-images position-relative overflow-hidden mb-3">
//                           <video
//                             src={myImage.imageUrl} // Đây có thể là thumbnail
//                             className="img-fluid w-100"
//                             alt="video"
//                             style={{ height: "200px", objectFit: "cover" }}
//                           />
//                           <div className="position-absolute top-50 start-50 translate-middle">
//                             <i className="ri-play-circle-fill text-white fs-1 opacity-75"></i>
//                           </div>
//                         </div>
//                       )}
//                     </a>
//                     <div className="image-hover-data">
//                       <div className="product-elements-icon">
//                         <ul className="d-flex align-items-center m-0 p-0 list-inline">
//                           <li>
//                             <a href="#" className="ps-3 text-white">
//                               {myImage.post?.likeCount || 0}{" "}
//                               <i className="ri-thumb-up-line"></i>
//                             </a>
//                           </li>
//                           <li>
//                             <a href="#" className="ps-3 text-white">
//                               {myImage.post?.commentCount || 0}{" "}
//                               <i className="ri-chat-3-line"></i>
//                             </a>
//                           </li>
//                           <li>
//                             <a href="#" className="ps-3 text-white">
//                               10 <i className="ri-share-forward-line"></i>
//                             </a>
//                           </li>
//                         </ul>
//                       </div>
//                     </div>
//                     <a
//                       href="#"
//                       className="image-edit-btn"
//                       data-bs-toggle="tooltip"
//                       data-bs-placement="top"
//                       title="Edit or Remove"
//                     >
//                       <i className="ri-edit-2-fill"></i>
//                     </a>
//                   </div>
//                 </div>
//               );
//             })
//           : !loading && <h4>Chưa có hình ảnh</h4>}
//       </div>

//       {loadingMore && (
//         <div className="text-center py-3">
//           <div
//             className="spinner-border spinner-border-sm text-primary"
//             role="status"
//           >
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <span className="text-muted ms-2">Đang tải thêm...</span>
//         </div>
//       )}

//       {/* Sentinel for infinite scroll (để ngoài .row nhằm tránh ảnh hưởng layout) */}
//       <div ref={sentinelRef} style={{ height: "1px" }} />
//     </div>
//   );
// };

// export default ImageProfile;

import { useCallback, useEffect, useRef, useState } from "react";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";
import "./ImageProfile.css";

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
    <div className="container-fluid profile-image-grid">
      {/* Profile Header */}
      {!loading && myImages.length > 0 && (
        <div className="profile-header">
          <div className="header-content text-center">
            <h3 className="fw-bold mb-2">Bộ sưu tập hình ảnh</h3>
            <p className="mb-3 opacity-90">Tất cả hình ảnh và video đã đăng</p>
            <span className="image-count-badge">{totalImages} hình ảnh</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0">
              <div className="card-body text-center py-5">
                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                  style={{ width: "3rem", height: "3rem" }}
                >
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <h5 className="text-muted">Đang tải hình ảnh...</h5>
                <p className="text-muted mb-0">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i
                  className="ri-error-warning-line text-danger mb-3"
                  style={{ fontSize: "3rem" }}
                ></i>
                <h5 className="text-danger mb-2">Đã xảy ra lỗi</h5>
                <p className="text-muted">{error}</p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => loadingImagePost(1, userId)}
                >
                  <i className="ri-refresh-line me-2"></i>
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid */}
      <div className="row g-3">
        {myImages.length > 0
          ? myImages.map((myImage, index) => {
              const key = `${myImage.post?._id || "post"}-${index}`;
              const isVideo = myImage.type === "video";

              return (
                <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6" key={key}>
                  <div className="image-profile-card">
                    <div className="image-container">
                      <a
                        href={"/posts/" + (myImage.post?._id || "")}
                        className="d-block text-decoration-none h-100"
                      >
                        {myImage.type === "image" && (
                          <img
                            src={myImage.imageUrl}
                            className="img-fluid"
                            alt={myImage.post?.content || "Hình ảnh cá nhân"}
                            loading="lazy"
                          />
                        )}
                        {myImage.type === "video" && (
                          <>
                            <video
                              src={myImage.imageUrl}
                              className="img-fluid"
                              alt="Video cá nhân"
                              loading="lazy"
                            />
                            <div className="video-indicator">
                              <i className="ri-play-mini-fill me-1"></i>
                              VIDEO
                            </div>
                            <div className="video-overlay">
                              <i className="ri-play-circle-fill play-icon"></i>
                            </div>
                          </>
                        )}
                      </a>

                      {/* Hover Stats */}
                      <div className="image-hover-stats">
                        <div className="stats-grid">
                          <a href="#" className="stat-item">
                            <i className="ri-heart-3-fill stat-icon"></i>
                            <span className="stat-count">
                              {formatCount(myImage.post?.likeCount || 0)}
                            </span>
                          </a>
                          <a href="#" className="stat-item">
                            <i className="ri-chat-3-fill stat-icon"></i>
                            <span className="stat-count">
                              {formatCount(myImage.post?.commentCount || 0)}
                            </span>
                          </a>
                          <a href="#" className="stat-item">
                            <i className="ri-share-forward-fill stat-icon"></i>
                            <span className="stat-count">
                              {formatCount(myImage.post?.shareCount || 10)}
                            </span>
                          </a>
                        </div>
                      </div>

                      {/* Edit Button (chỉ hiện với chủ profile) */}
                      {isOwnProfile && (
                        <a
                          href="#"
                          className="edit-image-btn"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Chỉnh sửa hoặc xóa"
                        >
                          <i className="ri-more-2-fill"></i>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          : !loading && (
              <div className="col-12">
                <div className="empty-state">
                  <i className="ri-image-2-line empty-state-icon"></i>
                  <h4 className="mb-2">Chưa có hình ảnh</h4>
                  <p className="text-muted mb-0">
                    {isOwnProfile
                      ? "Hãy bắt đầu chia sẻ những khoảnh khắc đầu tiên của bạn!"
                      : "Người dùng này chưa chia sẻ hình ảnh nào"}
                  </p>
                  {isOwnProfile && (
                    <button className="btn btn-primary mt-3">
                      <i className="ri-upload-cloud-line me-2"></i>
                      Đăng ảnh đầu tiên
                    </button>
                  )}
                </div>
              </div>
            )}
      </div>

      {/* Loading More */}
      {loadingMore && (
        <div className="row mt-4">
          <div className="col-12 text-center">
            <div
              className="spinner-border spinner-border-sm text-primary me-2"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Đang tải thêm hình ảnh...</span>
          </div>
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} style={{ height: "1px", marginTop: "20px" }} />
    </div>
  );
};

export default ImageProfile;
