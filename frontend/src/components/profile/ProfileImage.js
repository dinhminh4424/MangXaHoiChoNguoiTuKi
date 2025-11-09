import { useCallback, useEffect, useState } from "react";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";

const ImageProfile = ({ userId }) => {
  const [myImages, setMyImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user: currentUser } = useAuth();

  const { fetchImagesPost } = usePost();

  const isOwnProfile = !userId || userId === currentUser?.id;

  const loadingImagePost = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const id = userId || currentUser?.id;

      const params = {
        userCreateID: id,
      };
      const res = await fetchImagesPost(params);
      console.log("res:", res);
      if (res.success) {
        setMyImages(res.images);
      }
    } catch (err) {
      console.error("Error loading profile posts:", err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadingImagePost();
  }, [userId]);

  return (
    <div className="container">
      {loading && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2 text-muted">Đang tải danh sách bạn bè...</p>
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

      <div className="row">
        {myImages.length > 0 ? (
          myImages.map((myImage, index) => (
            <div className="col-lg-4 col-md-6" key={index}>
              <div className="user-images position-relative overflow-hidden mb-3">
                <a href={"/posts/" + myImage.post._id}>
                  {myImage.type === "image" && (
                    <img
                      src={myImage.imageUrl}
                      className="img-fluid rounded"
                      alt="Responsive image"
                    />
                  )}
                </a>
                <div className="image-hover-data">
                  <div className="product-elements-icon">
                    <ul className="d-flex align-items-center m-0 p-0 list-inline">
                      <li>
                        <a href="#" className="ps-3 text-white">
                          {myImage.post.likeCount}{" "}
                          <i className="ri-thumb-up-line"></i>
                        </a>
                      </li>
                      <li>
                        <a href="#" className="ps-3 text-white">
                          {myImage.post.commentCount}{" "}
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
                  title=""
                  data-bs-original-title="Edit or Remove"
                >
                  <i className="ri-edit-2-fill"></i>
                </a>
              </div>
            </div>
          ))
        ) : (
          <h4>Chưa có hình ảnh</h4>
        )}
      </div>
    </div>
  );
};

export default ImageProfile;
