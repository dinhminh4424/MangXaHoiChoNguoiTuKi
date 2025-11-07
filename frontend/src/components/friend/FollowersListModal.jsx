import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import followService from "../../services/followService";
import "./FriendsListModal.css";

const FollowersListModal = ({ show, onHide, userId, userName }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (show && userId) {
      fetchFollowers(1);
    } else {
      setFollowers([]);
      setPage(1);
      setHasMore(true);
    }
  }, [show, userId]);

  const fetchFollowers = async (pageNum = 1) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await followService.getFollowers(userId, {
        page: pageNum,
        limit: 20,
      });
      
      if (pageNum === 1) {
        setFollowers(response.data || []);
      } else {
        setFollowers((prev) => [...prev, ...(response.data || [])]);
      }
      
      setPagination(response.pagination);
      setHasMore(pageNum < response.pagination.total);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFollowers(page + 1);
    }
  };

  const getAvatarUrl = (user) => {
    if (user.profile?.avatar) {
      return user.profile.avatar.startsWith("http")
        ? user.profile.avatar
        : `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}${
            user.profile.avatar
          }`;
    }
    return "/assets/images/default-avatar.png";
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Người theo dõi {userName || "người dùng"}
          {pagination && (
            <span className="text-muted ms-2">
              ({pagination.totalFollowers})
            </span>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="friends-list-modal-body">
        {loading && followers.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>Chưa có người theo dõi nào</p>
          </div>
        ) : (
          <>
            <div className="modal-friends-list">
              {followers.map((follower) => (
                <Link
                  key={follower._id || follower.id}
                  to={`/profile/${follower._id || follower.id}`}
                  className="modal-friend-item"
                  onClick={onHide}
                >
                  <div className="modal-friend-avatar">
                    <img
                      src={getAvatarUrl(follower)}
                      alt={follower.fullName || follower.username}
                      onError={(e) => {
                        e.target.src = "/images/default-avatar.png";
                      }}
                    />
                    {follower.isOnline && (
                      <span className="modal-online-indicator"></span>
                    )}
                  </div>
                  <div className="modal-friend-info">
                    <div className="modal-friend-name">
                      {follower.fullName || follower.username}
                    </div>
                    {follower.username && follower.fullName && (
                      <div className="modal-friend-username text-muted">
                        @{follower.username}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-3">
                <button
                  className="btn btn-outline-primary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Đang tải..." : "Tải thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default FollowersListModal;

