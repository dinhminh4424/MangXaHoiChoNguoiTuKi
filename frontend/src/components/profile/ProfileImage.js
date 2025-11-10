import { useCallback, useEffect, useRef, useState } from "react";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";

const ImageProfile = ({ userId }) => {
  const [myImages, setMyImages] = useState([]);
  const [loading, setLoading] = useState(false); // lần load đầu
  const [error, setError] = useState("");
  const [pages, setPages] = useState(1);
  const [countImage, setCountImage] = useState(0);
  const { user: currentUser } = useAuth();

  const [loadingMore, setLoadingMore] = useState(false); // load tiếp
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const pageSize = 2;
  const limit = 2;

  const { fetchImagesPost } = usePost();

  const isOwnProfile = !userId || userId === currentUser?.id;

  // load một trang ảnh
  const loadingImagePost = useCallback(
    async (pageToFetch = 1, forUserId) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (pageToFetch === 1) {
          setLoading(true);
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

        // đảm bảo lấy mảng ảnh an toàn
        const newImages = Array.isArray(res?.images) ? res.images : [];

        if (res && res.success) {
          if (pageToFetch === 1) {
            setMyImages(newImages);
            setCountImage(res.imagesCount);
          } else {
            setMyImages((prev) => [...prev, ...newImages]);

            setCountImage(countImage + res.imagesCount);
          }

          // backend có thể trả totalImages hoặc total
          const totalImages =
            typeof res.totalImages === "number"
              ? res.totalImages
              : typeof res.total === "number"
              ? res.total
              : undefined;

          if (typeof totalImages === "number") {
            const loadedSoFar = (pageToFetch - 1) * pageSize + newImages.length;
            setHasMore(loadedSoFar < totalImages);
          } else {
            // nếu backend không trả total, dùng heuristic
            setHasMore(newImages.length >= pageSize);
          }
        } else {
          // nếu res.success false, show message (nếu có)
          const msg = res?.message || "Lỗi khi tải ảnh";
          setError(msg);
        }
      } catch (err) {
        console.error("Error loading profile posts:", err);
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [fetchImagesPost, userId, currentUser?.id]
  );

  // Khi userId thay đổi -> reset và load trang 1
  useEffect(() => {
    setPages(1);
    setMyImages([]);
    setHasMore(true);
    setError("");
    loadingImagePost(1, userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // intentionally only on userId change

  // Intersection Observer để load thêm
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading &&
          !isFetchingRef.current
        ) {
          // tăng page và gọi load trang tiếp theo
          setPages((prev) => {
            const next = prev + 1;
            loadingImagePost(next, userId);
            return next;
          });
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadingImagePost, hasMore, loadingMore, loading, userId]);

  return (
    <div className="container">
      {loading && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2 text-muted">Đang tải danh sách ảnh...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-danger">
            <i className="fas fa-exclamation-circle fa-2x mb-3"></i>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* <span className="badge text-bg-info container">{countImage}</span> */}

      <div className="row">
        {myImages.length > 0
          ? myImages.map((myImage, index) => {
              // tạo key tốt hơn (nên thay bằng id file nếu có)
              const key = `${myImage.post?._id || "post"}-${index}`;
              return (
                <div className="col-lg-3 col-md-6" key={key}>
                  <div className="user-images position-relative overflow-hidden mb-3">
                    <a href={"/posts/" + (myImage.post?._id || "")}>
                      {myImage.type === "image" && (
                        <img
                          src={myImage.imageUrl}
                          className="img-fluid rounded"
                          alt={myImage.post?.content || "image"}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      )}
                      {myImage.type === "video" && (
                        <div className="user-images position-relative overflow-hidden mb-3">
                          <video
                            src={myImage.imageUrl} // Đây có thể là thumbnail
                            className="img-fluid w-100"
                            alt="video"
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                          <div className="position-absolute top-50 start-50 translate-middle">
                            <i className="ri-play-circle-fill text-white fs-1 opacity-75"></i>
                          </div>
                        </div>
                      )}
                    </a>
                    <div className="image-hover-data">
                      <div className="product-elements-icon">
                        <ul className="d-flex align-items-center m-0 p-0 list-inline">
                          <li>
                            <a href="#" className="ps-3 text-white">
                              {myImage.post?.likeCount || 0}{" "}
                              <i className="ri-thumb-up-line"></i>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="ps-3 text-white">
                              {myImage.post?.commentCount || 0}{" "}
                              <i className="ri-chat-3-line"></i>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="ps-3 text-white">
                              10 <i className="ri-share-forward-line"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <a
                      href="#"
                      className="image-edit-btn"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title="Edit or Remove"
                    >
                      <i className="ri-edit-2-fill"></i>
                    </a>
                  </div>
                </div>
              );
            })
          : !loading && <h4>Chưa có hình ảnh</h4>}
      </div>

      {loadingMore && (
        <div className="text-center py-3">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="text-muted ms-2">Đang tải thêm...</span>
        </div>
      )}

      {/* Sentinel for infinite scroll (để ngoài .row nhằm tránh ảnh hưởng layout) */}
      <div ref={sentinelRef} style={{ height: "1px" }} />
    </div>
  );
};

export default ImageProfile;

// ===================================================
// import { useCallback, useEffect, useRef, useState } from "react";
// import { usePost } from "../../contexts/PostContext";
// import { useAuth } from "../../contexts/AuthContext";

// const ImageProfile = ({ userId }) => {
//   const [myImages, setMyImages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [countImage, setCountImage] = useState(0);

//   const [loadingMore, setLoadingMore] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);

//   const isFetchingRef = useRef(false);
//   const observerRef = useRef(null);
//   const sentinelRef = useRef(null);

//   const limit = 10; // Tăng limit lên để load nhiều hơn mỗi lần

//   const { fetchImagesPost } = usePost();
//   const { user: currentUser } = useAuth();

//   const isOwnProfile = !userId || userId === currentUser?.id;

//   // Load một trang ảnh
//   const loadingImagePost = useCallback(
//     async (pageToFetch = 1, forUserId) => {
//       if (isFetchingRef.current) return;
//       isFetchingRef.current = true;

//       try {
//         if (pageToFetch === 1) {
//           setLoading(true);
//           setMyImages([]); // Clear images khi load trang đầu
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

//         if (res && res.success) {
//           const newImages = Array.isArray(res?.images) ? res.images : [];

//           if (pageToFetch === 1) {
//             setMyImages(newImages);
//             setCountImage(res.totalImages || 0);
//           } else {
//             setMyImages((prev) => [...prev, ...newImages]);
//           }

//           // Kiểm tra xem còn dữ liệu không
//           const totalImages = res.totalImages || res.total || 0;
//           const loadedCount = (pageToFetch - 1) * limit + newImages.length;
//           setHasMore(loadedCount < totalImages && newImages.length > 0);
//         } else {
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
//     [fetchImagesPost, userId, currentUser?.id, limit]
//   );

//   // Reset khi userId thay đổi
//   useEffect(() => {
//     setCurrentPage(1);
//     setMyImages([]);
//     setHasMore(true);
//     setError("");
//     loadingImagePost(1, userId);
//   }, [userId, loadingImagePost]);

//   // Intersection Observer để load thêm
//   useEffect(() => {
//     const sentinel = sentinelRef.current;
//     if (!sentinel || !hasMore || loadingMore || loading) return;

//     if (observerRef.current) observerRef.current.disconnect();

//     observerRef.current = new IntersectionObserver(
//       (entries) => {
//         const entry = entries[0];
//         if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
//           const nextPage = currentPage + 1;
//           setCurrentPage(nextPage);
//           loadingImagePost(nextPage, userId);
//         }
//       },
//       { root: null, rootMargin: "100px", threshold: 0.1 }
//     );

//     observerRef.current.observe(sentinel);

//     return () => {
//       if (observerRef.current) observerRef.current.disconnect();
//     };
//   }, [loadingImagePost, hasMore, loadingMore, loading, userId, currentPage]);

//   // Hàm render hình ảnh
//   const renderImage = (myImage, index) => {
//     const postId = myImage.post?._id;
//     const key = `${postId}-${myImage.imageUrl}-${index}`;

//     return (
//       <div className="col-lg-6 col-md-6 mb-3" key={key}>
//         <div className="user-images position-relative overflow-hidden rounded">
//           <a href={postId ? `/posts/${postId}` : "#"} className="d-block">
//             {myImage.type === "image" && (
//               <img
//                 src={myImage.imageUrl}
//                 className="img-fluid w-100"
//                 alt={myImage.post?.content || "image"}
//                 style={{ height: "200px", objectFit: "cover" }}
//               />
//             )}
//             {myImage.type === "video" && (
//               <div className="video-thumbnail position-relative">
//                 <video
//                   src={myImage.imageUrl} // Đây có thể là thumbnail
//                   className="img-fluid w-100"
//                   alt="video"
//                   style={{ height: "200px", objectFit: "cover" }}
//                 />
//                 <div className="position-absolute top-50 start-50 translate-middle">
//                   <i className="ri-play-circle-fill text-white fs-1 opacity-75"></i>
//                 </div>
//               </div>
//             )}
//           </a>

//           {isOwnProfile && (
//             <a
//               href="#"
//               className="image-edit-btn position-absolute top-0 end-0 m-2 bg-dark bg-opacity-50 rounded-circle p-2"
//               data-bs-toggle="tooltip"
//               data-bs-placement="top"
//               title="Edit or Remove"
//             >
//               <i className="ri-edit-2-fill text-white"></i>
//             </a>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="container">
//       {/* Loading State */}
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

//       {/* Error State */}
//       {error && (
//         <div className="card border-0 shadow-sm">
//           <div className="card-body text-center py-5 text-danger">
//             <i className="fas fa-exclamation-circle fa-2x mb-3"></i>
//             <p>{error}</p>
//           </div>
//         </div>
//       )}

//       {/* Image Count */}
//       {!loading && myImages.length > 0 && (
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <span className="badge text-bg-info">{countImage} hình ảnh</span>
//         </div>
//       )}

//       {/* Images Grid */}
//       <div className="row">
//         {myImages.length > 0
//           ? myImages.map(renderImage)
//           : !loading && (
//               <div className="col-12">
//                 <div className="text-center py-5 text-muted">
//                   <i className="ri-image-line fs-1"></i>
//                   <h4 className="mt-2">Chưa có hình ảnh</h4>
//                 </div>
//               </div>
//             )}
//       </div>

//       {/* Loading More */}
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

//       {/* Sentinel for infinite scroll */}
//       <div ref={sentinelRef} style={{ height: "1px" }} />
//     </div>
//   );
// };

// export default ImageProfile;
