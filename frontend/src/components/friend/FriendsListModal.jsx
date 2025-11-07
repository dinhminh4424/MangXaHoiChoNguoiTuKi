import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import friendService from "../../services/friendService";
import "./FriendsListModal.css";

const FriendsListModal = ({ show, onHide, userId, userName }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (show && userId) {
      fetchFriends(1);
    } else {
      setFriends([]);
      setPage(1);
      setHasMore(true);
    }
  }, [show, userId]);

  const fetchFriends = async (pageNum = 1) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await friendService.getFriendsByUserId(userId, {
        page: pageNum,
        limit: 20,
      });
      
      if (pageNum === 1) {
        setFriends(response.data || []);
      } else {
        setFriends((prev) => [...prev, ...(response.data || [])]);
      }
      
      setPagination(response.pagination);
      setHasMore(pageNum < response.pagination.total);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFriends(page + 1);
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
          Bạn bè của {userName || "người dùng"}
          {pagination && (
            <span className="text-muted ms-2">
              ({pagination.totalFriends})
            </span>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="friends-list-modal-body">
        {loading && friends.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>Chưa có bạn bè nào</p>
          </div>
        ) : (
          <>
            <div className="modal-friends-list">
              {friends.map((friend) => (
                <Link
                  key={friend._id || friend.id}
                  to={`/profile/${friend._id || friend.id}`}
                  className="modal-friend-item"
                  onClick={onHide}
                >
                  <div className="modal-friend-avatar">
                    <img
                      src={getAvatarUrl(friend)}
                      alt={friend.fullName || friend.username}
                      onError={(e) => {
                        e.target.src = "/images/default-avatar.png";
                      }}
                    />
                    {friend.isOnline && (
                      <span className="modal-online-indicator"></span>
                    )}
                  </div>
                  <div className="modal-friend-info">
                    <div className="modal-friend-name">
                      {friend.fullName || friend.username}
                    </div>
                    {friend.username && friend.fullName && (
                      <div className="modal-friend-username text-muted">
                        @{friend.username}
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

export default FriendsListModal;

