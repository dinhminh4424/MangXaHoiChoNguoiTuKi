import { useCallback, useEffect, useRef, useState } from "react";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";

const ImageGroup = ({ groupId }) => {
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

        const id = groupId;

        const params = {
          groupId: id,
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
    [fetchImagesPost, groupId, currentUser?.id]
  );

  // Khi userId thay đổi -> reset và load trang 1
  useEffect(() => {
    setPages(1);
    setMyImages([]);
    setHasMore(true);
    setError("");
    loadingImagePost(1, groupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]); // intentionally only on userId change

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
            loadingImagePost(next, groupId);
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
  }, [loadingImagePost, hasMore, loadingMore, loading, groupId]);

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

export default ImageGroup;
