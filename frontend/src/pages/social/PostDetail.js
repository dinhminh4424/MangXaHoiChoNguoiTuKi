import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePost } from "../../contexts/PostContext";

import Post from "../../components/Post/Post";

const PostDetail = () => {
  const { postId } = useParams();
  const [error, setError] = useState("");

  const { currentPost, loading, fetchPostById } = usePost();

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const res = await fetchPostById(postId);
      if (!res.success) {
        setError(res.message);
      } else {
        setError("");
      }
    } catch (error) {}
  };

  return (
    <div className="container-sm">
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <div>
            <div className="spinner-grow text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-grow text-secondary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-grow text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-grow text-danger" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-grow text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-grow text-info" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-grow text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-grow text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Post post={currentPost} />
        </>
      )}
    </div>
  );
};

export default PostDetail;
