// import { useCallback, useEffect, useRef, useState } from "react";
// import { usePost } from "../../contexts/PostContext";
// import { useAuth } from "../../contexts/AuthContext";
// import "./GroupFile.css";

// const ImageGroup = ({ groupId }) => {
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

//         const id = groupId;

//         const params = {
//           groupId: id,
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
//     [fetchImagesPost, groupId, currentUser?.id]
//   );

//   // Khi userId thay đổi -> reset và load trang 1
//   useEffect(() => {
//     setPages(1);
//     setMyImages([]);
//     setHasMore(true);
//     setError("");
//     loadingImagePost(1, groupId);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [groupId]); // intentionally only on userId change

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
//             loadingImagePost(next, groupId);
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
//   }, [loadingImagePost, hasMore, loadingMore, loading, groupId]);

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

// export default ImageGroup;

import { useCallback, useEffect, useRef, useState } from "react";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";
import "./GroupFile.css";

const ImageGroup = ({ groupId }) => {
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

  const limit = 12; // Tăng limit để load nhiều ảnh hơn

  const { fetchImagesPost } = usePost();
  const { user: currentUser } = useAuth();

  // Load images
  const loadingImagePost = useCallback(
    async (pageToFetch = 1) => {
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

        const params = {
          groupId: groupId,
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
        console.error("Error loading group images:", err);
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [fetchImagesPost, groupId, limit]
  );

  // Reset khi groupId thay đổi
  useEffect(() => {
    setCurrentPage(1);
    setMyImages([]);
    setHasMore(true);
    setError("");
    loadingImagePost(1);
  }, [groupId, loadingImagePost]);

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
          loadingImagePost(nextPage);
        }
      },
      { root: null, rootMargin: "100px", threshold: 0.1 }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadingImagePost, hasMore, loadingMore, loading, currentPage]);

  // Format số lượng
  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count;
  };

  return (
    <div className="container-fluid">
      {/* Header với thống kê */}
      {!loading && myImages.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1 fw-bold">Hình ảnh nhóm</h4>
                <p className="text-muted mb-0">
                  Tất cả hình ảnh được chia sẻ trong nhóm
                </p>
              </div>
              <span className="badge image-count-badge fs-6">
                {totalImages} ảnh
              </span>
            </div>
            <hr className="mt-3" />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2 text-muted">Đang tải danh sách ảnh...</p>
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
              <div className="card-body text-center py-5 text-danger">
                <i className="fas fa-exclamation-circle fa-2x mb-3 opacity-50"></i>
                <h5 className="mb-2">Đã xảy ra lỗi</h5>
                <p className="mb-0 text-muted">{error}</p>
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
                  <div className="image-grid-card">
                    <div className="image-container">
                      <a
                        href={"/posts/" + (myImage.post?._id || "")}
                        className="d-block text-decoration-none"
                      >
                        {myImage.type === "image" && (
                          <img
                            src={myImage.imageUrl}
                            className="img-fluid"
                            alt={myImage.post?.content || "Hình ảnh nhóm"}
                            loading="lazy"
                          />
                        )}
                        {myImage.type === "video" && (
                          <>
                            <video
                              src={myImage.imageUrl}
                              className="img-fluid"
                              alt="Video nhóm"
                              loading="lazy"
                            />
                            <div className="video-overlay">
                              <i className="ri-play-circle-fill play-icon"></i>
                            </div>
                          </>
                        )}
                      </a>

                      {/* Hover Stats */}
                      <div className="image-hover-data">
                        <div className="stats-list">
                          <a href="#" className="stat-item">
                            <i className="ri-heart-fill"></i>
                            <span>
                              {formatCount(myImage.post?.likeCount || 0)}
                            </span>
                          </a>
                          <a href="#" className="stat-item">
                            <i className="ri-chat-3-fill"></i>
                            <span>
                              {formatCount(myImage.post?.commentCount || 0)}
                            </span>
                          </a>
                          <a href="#" className="stat-item">
                            <i className="ri-share-forward-fill"></i>
                            <span>
                              {formatCount(myImage.post?.shareCount || 0)}
                            </span>
                          </a>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <a
                        href="#"
                        className="image-edit-btn"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Chỉnh sửa hoặc xóa"
                      >
                        <i className="ri-more-2-fill"></i>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          : !loading && (
              <div className="col-12">
                <div className="empty-state">
                  <i className="ri-image-line empty-state-icon"></i>
                  <h4 className="mb-2">Chưa có hình ảnh</h4>
                  <p className="text-muted mb-0">
                    Nhóm chưa có hình ảnh hoặc video được chia sẻ
                  </p>
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
            <span className="text-muted">Đang tải thêm ảnh...</span>
          </div>
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} style={{ height: "1px", marginTop: "20px" }} />
    </div>
  );
};

export default ImageGroup;
